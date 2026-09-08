from flask import Blueprint, request, jsonify
from extensions import db
from models import User, Category, Book, BorrowRecord, Favorite
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from datetime import datetime
import requests

bp = Blueprint('api', __name__)

def get_current_user():
    claims = get_jwt()
    if claims and 'role' in claims:
        return {'id': claims.get('id', int(claims.get('sub', 0))), 'role': claims.get('role', 'user'), 'username': claims.get('username', '')}
    ident = get_jwt_identity()
    if isinstance(ident, dict):
        return ident
    if ident:
        u = User.query.get(int(ident))
        if u:
            return {'id': u.id, 'role': u.role, 'username': u.username}
    return {'id': None, 'role': 'user', 'username': ''}


# --- Auth Routes ---
@bp.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.json or {}
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return jsonify({'message': 'Username, email, and password are required'}), 400

        if User.query.filter_by(username=username).first() or \
           User.query.filter_by(email=email).first():
            return jsonify({'message': 'Username or email already exists'}), 400
            
        # First user is admin
        role = 'admin' if User.query.count() == 0 else 'user'
        
        new_user = User(
            username=username,
            email=email,
            role=role
        )
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({'message': 'User created successfully', 'role': role}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Register error: {e}")
        return jsonify({'message': 'Registration failed. Please try again.'}), 500

@bp.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.json or {}
        username_or_email = data.get('username', '')
        password = data.get('password', '')

        user = User.query.filter((User.username == username_or_email) | (User.email == username_or_email)).first()
        if user and user.check_password(password):
            if not user.is_active:
                return jsonify({'message': 'Account is deactivated'}), 403
            access_token = create_access_token(identity=str(user.id), additional_claims={'id': user.id, 'role': user.role, 'username': user.username})
            return jsonify(access_token=access_token), 200
        return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'message': 'Authentication service error'}), 500

@bp.route('/auth/me', methods=['GET'])
@jwt_required()
def get_me():
    try:
        current_user = get_current_user()
        return jsonify(current_user), 200
    except Exception as e:
        return jsonify({'id': None, 'role': 'user', 'username': ''}), 200

# --- Categories Routes ---
@bp.route('/categories', methods=['GET'])
def get_categories():
    try:
        categories = Category.query.all()
        return jsonify([{'id': c.id, 'name': c.name, 'description': c.description, 'book_count': len(c.books or [])} for c in categories]), 200
    except Exception as e:
        print(f"Get categories error: {e}")
        return jsonify([]), 200

@bp.route('/categories', methods=['POST'])
@jwt_required()
def add_category():
    user = get_current_user()
    if user['role'] != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    try:
        data = request.json or {}
        new_category = Category(name=data.get('name'), description=data.get('description'))
        db.session.add(new_category)
        db.session.commit()
        return jsonify({'message': 'Category added'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to add category'}), 500

@bp.route('/categories/<int:id>', methods=['PUT'])
@jwt_required()
def update_category(id):
    user = get_current_user()
    if user['role'] != 'admin': return jsonify({'message': 'Admin access required'}), 403
    try:
        cat = Category.query.get_or_404(id)
        data = request.json or {}
        cat.name = data.get('name', cat.name)
        cat.description = data.get('description', cat.description)
        db.session.commit()
        return jsonify({'message': 'Category updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update category'}), 500

@bp.route('/categories/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_category(id):
    user = get_current_user()
    if user['role'] != 'admin': return jsonify({'message': 'Admin access required'}), 403
    try:
        cat = Category.query.get_or_404(id)
        db.session.delete(cat)
        db.session.commit()
        return jsonify({'message': 'Category deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to delete category'}), 500

# --- Books Routes ---
@bp.route('/books', methods=['GET'])
def get_books():
    try:
        search = request.args.get('search', '')
        category_id = request.args.get('category_id')
        
        query = Book.query
        if search:
            query = query.filter(Book.title.ilike(f'%{search}%') | Book.author.ilike(f'%{search}%') | Book.description.ilike(f'%{search}%') | Book.category.has(Category.name.ilike(f'%{search}%')))
        if category_id:
            query = query.filter_by(category_id=category_id)
            
        books = query.all()
        return jsonify([{
            'id': b.id, 'title': b.title, 'author': b.author, 
            'category_id': b.category_id, 'category_name': b.category.name if b.category else None,
            'description': b.description, 'cover_image': b.cover_image,
            'publication_year': b.publication_year, 'rating': b.rating, 'read_link': b.read_link,
            'available_copies': b.available_copies, 'total_copies': b.total_copies, 'is_available': b.is_available
        } for b in books]), 200
    except Exception as e:
        print(f"Get books error: {e}")
        return jsonify([]), 200

@bp.route('/books/<int:id>', methods=['GET'])
def get_book(id):
    try:
        b = Book.query.get_or_404(id)
        return jsonify({
            'id': b.id, 'title': b.title, 'author': b.author, 
            'category_id': b.category_id, 'category_name': b.category.name if b.category else None,
            'description': b.description, 'cover_image': b.cover_image,
            'publication_year': b.publication_year, 'rating': b.rating, 'read_link': b.read_link,
            'available_copies': b.available_copies, 'total_copies': b.total_copies, 'is_available': b.is_available
        }), 200
    except Exception as e:
        return jsonify({'message': 'Book not found'}), 404

@bp.route('/books', methods=['POST'])
@jwt_required()
def add_book():
    user = get_current_user()
    if user['role'] != 'admin': return jsonify({'message': 'Admin access required'}), 403
    try:
        data = request.json or {}
        new_book = Book(
            title=data.get('title'), author=data.get('author'),
            category_id=data.get('category_id'), description=data.get('description'),
            cover_image=data.get('cover_image'), publication_year=data.get('publication_year'),
            rating=data.get('rating', 0.0), read_link=data.get('read_link'),
            total_copies=data.get('total_copies', 1),
            available_copies=data.get('total_copies', 1),
            is_available=data.get('is_available', True)
        )
        db.session.add(new_book)
        db.session.commit()
        return jsonify({'message': 'Book added'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to add book'}), 500

@bp.route('/books/<int:id>', methods=['PUT'])
@jwt_required()
def update_book(id):
    user = get_current_user()
    if user['role'] != 'admin': return jsonify({'message': 'Admin access required'}), 403
    try:
        b = Book.query.get_or_404(id)
        data = request.json or {}
        b.title = data.get('title', b.title)
        b.author = data.get('author', b.author)
        b.category_id = data.get('category_id', b.category_id)
        b.description = data.get('description', b.description)
        b.cover_image = data.get('cover_image', b.cover_image)
        b.publication_year = data.get('publication_year', b.publication_year)
        b.rating = data.get('rating', b.rating)
        b.read_link = data.get('read_link', b.read_link)
        if 'is_available' in data: b.is_available = data['is_available']
        diff = int(data.get('total_copies', b.total_copies)) - b.total_copies
        b.total_copies = int(data.get('total_copies', b.total_copies))
        b.available_copies = b.available_copies + diff
        db.session.commit()
        return jsonify({'message': 'Book updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update book'}), 500

@bp.route('/books/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_book(id):
    user = get_current_user()
    if user['role'] != 'admin': return jsonify({'message': 'Admin access required'}), 403
    try:
        b = Book.query.get_or_404(id)
        db.session.delete(b)
        db.session.commit()
        return jsonify({'message': 'Book deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to delete book'}), 500

# --- Borrow/Return Routes ---
@bp.route('/borrow/<int:book_id>', methods=['POST'])
@jwt_required()
def borrow_book(book_id):
    user = get_current_user()
    try:
        book = Book.query.get_or_404(book_id)
        if book.available_copies <= 0: return jsonify({'message': 'Book is not available'}), 400
        
        existing_borrow = BorrowRecord.query.filter_by(user_id=user['id'], book_id=book_id, status='borrowed').first()
        if existing_borrow: return jsonify({'message': 'You already borrowed this book'}), 400
        
        record = BorrowRecord(user_id=user['id'], book_id=book_id)
        book.available_copies -= 1
        db.session.add(record)
        db.session.commit()
        return jsonify({'message': 'Book borrowed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to borrow book'}), 500

@bp.route('/return/<int:book_id>', methods=['POST'])
@jwt_required()
def return_book(book_id):
    user = get_current_user()
    try:
        record = BorrowRecord.query.filter_by(user_id=user['id'], book_id=book_id, status='borrowed').first()
        if not record: return jsonify({'message': 'No active borrow record found for this book'}), 404
        
        record.status = 'returned'
        record.return_date = datetime.utcnow()
        
        book = Book.query.get(book_id)
        if book: book.available_copies += 1
        
        db.session.commit()
        return jsonify({'message': 'Book returned successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to return book'}), 500

@bp.route('/user/borrows', methods=['GET'])
@jwt_required()
def get_user_borrows():
    user = get_current_user()
    try:
        records = BorrowRecord.query.filter_by(user_id=user['id']).order_by(BorrowRecord.borrow_date.desc()).all()
        return jsonify([{
            'id': r.id, 'book_id': r.book_id, 'book_title': r.book.title if r.book else 'Unknown Book', 'book_cover': r.book.cover_image if r.book else None,
            'borrow_date': r.borrow_date, 'return_date': r.return_date, 'status': r.status
        } for r in records]), 200
    except Exception as e:
        print(f"Get user borrows error: {e}")
        return jsonify([]), 200

# --- Favorites Routes ---
@bp.route('/favorites/<int:book_id>', methods=['POST'])
@jwt_required()
def add_favorite(book_id):
    user = get_current_user()
    try:
        book = Book.query.get_or_404(book_id)
        if Favorite.query.filter_by(user_id=user['id'], book_id=book_id).first():
            return jsonify({'message': 'Book already in favorites'}), 400
        
        new_fav = Favorite(user_id=user['id'], book_id=book_id)
        db.session.add(new_fav)
        db.session.commit()
        return jsonify({'message': 'Added to favorites'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to add favorite'}), 500

@bp.route('/favorites/<int:book_id>', methods=['DELETE'])
@jwt_required()
def remove_favorite(book_id):
    user = get_current_user()
    try:
        fav = Favorite.query.filter_by(user_id=user['id'], book_id=book_id).first()
        if not fav:
            return jsonify({'message': 'Not in favorites'}), 404
        
        db.session.delete(fav)
        db.session.commit()
        return jsonify({'message': 'Removed from favorites'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to remove favorite'}), 500

@bp.route('/user/favorites', methods=['GET'])
@jwt_required()
def get_user_favorites():
    user = get_current_user()
    try:
        favorites = Favorite.query.filter_by(user_id=user['id']).order_by(Favorite.created_at.desc()).all()
        return jsonify([{
            'id': f.id, 'book_id': f.book_id, 'book_title': f.book.title if f.book else 'Unknown', 'book_cover': f.book.cover_image if f.book else None,
            'rating': f.book.rating if f.book else 0, 'author': f.book.author if f.book else 'Unknown'
        } for f in favorites]), 200
    except Exception as e:
        return jsonify([]), 200

@bp.route('/user/favorites/<int:book_id>', methods=['GET'])
@jwt_required()
def check_favorite(book_id):
    user = get_current_user()
    try:
        fav = Favorite.query.filter_by(user_id=user['id'], book_id=book_id).first()
        return jsonify({'is_favorite': bool(fav)}), 200
    except Exception as e:
        return jsonify({'is_favorite': False}), 200

# --- Admin Routes ---
@bp.route('/admin/users', methods=['GET'])
@jwt_required()
def get_users():
    user = get_current_user()
    if user['role'] != 'admin': return jsonify({'message': 'Admin access required'}), 403
    try:
        users = User.query.all()
        return jsonify([{'id': u.id, 'username': u.username, 'email': u.email, 'role': u.role, 'is_active': u.is_active} for u in users]), 200
    except Exception as e:
        return jsonify([]), 200

@bp.route('/admin/users/<int:id>/toggle-status', methods=['PUT'])
@jwt_required()
def toggle_user_status(id):
    user = get_current_user()
    if user['role'] != 'admin': return jsonify({'message': 'Admin access required'}), 403
    try:
        target_user = User.query.get_or_404(id)
        if target_user.role == 'admin': return jsonify({'message': 'Cannot deactivate admin'}), 400
        target_user.is_active = not target_user.is_active
        db.session.commit()
        return jsonify({'message': 'User status updated', 'is_active': target_user.is_active}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to toggle user status'}), 500

@bp.route('/admin/borrows', methods=['GET'])
@jwt_required()
def get_all_borrows():
    user = get_current_user()
    if user['role'] != 'admin': return jsonify({'message': 'Admin access required'}), 403
    try:
        records = BorrowRecord.query.order_by(BorrowRecord.borrow_date.desc()).all()
        return jsonify([{
            'id': r.id, 'user_name': r.user.username if r.user else 'Unknown', 'book_title': r.book.title if r.book else 'Unknown',
            'borrow_date': r.borrow_date, 'return_date': r.return_date, 'status': r.status
        } for r in records]), 200
    except Exception as e:
        return jsonify([]), 200

@bp.route('/admin/borrows/<int:id>/status', methods=['PUT'])
@jwt_required()
def update_borrow_status(id):
    user = get_current_user()
    if user['role'] != 'admin': return jsonify({'message': 'Admin access required'}), 403
    try:
        record = BorrowRecord.query.get_or_404(id)
        data = request.json or {}
        new_status = data.get('status')
        if new_status in ['borrowed', 'returned'] and record.status != new_status:
            record.status = new_status
            if new_status == 'returned':
                record.return_date = datetime.utcnow()
                if record.book: record.book.available_copies += 1
            elif new_status == 'borrowed':
                record.return_date = None
                if record.book: record.book.available_copies -= 1
            db.session.commit()
        return jsonify({'message': 'Borrow status updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update borrow status'}), 500

@bp.route('/admin/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    user = get_current_user()
    if user['role'] != 'admin': return jsonify({'message': 'Admin access required'}), 403
    try:
        total_books = Book.query.count()
        total_categories = Category.query.count()
        total_users = User.query.count()
        total_borrows = BorrowRecord.query.count()
        total_favorites = Favorite.query.count()
        
        # Simple recent activity
        recent_borrows = BorrowRecord.query.order_by(BorrowRecord.borrow_date.desc()).limit(5).all()
        activity = [{'type': 'borrow', 'user': r.user.username if r.user else 'Unknown', 'book': r.book.title if r.book else 'Unknown', 'date': r.borrow_date} for r in recent_borrows]
        
        return jsonify({
            'total_books': total_books,
            'total_categories': total_categories,
            'total_users': total_users,
            'total_borrows': total_borrows,
            'total_favorites': total_favorites,
            'activity': activity
        }), 200
    except Exception as e:
        return jsonify({
            'total_books': 0,
            'total_categories': 0,
            'total_users': 0,
            'total_borrows': 0,
            'total_favorites': 0,
            'activity': []
        }), 200

# --- External Book Routes ---
@bp.route('/external/search', methods=['GET'])
def external_search():
    query = request.args.get('q', '')
    if not query:
        return jsonify([]), 200
    
    try:
        response = requests.get(f'https://openlibrary.org/search.json?q={query}&limit=12', timeout=5)
        data = response.json()
        results = []
        for doc in data.get('docs', []):
            if not doc.get('title'): continue
            
            cover_id = doc.get('cover_i')
            cover_image = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else None
            
            key = doc.get('key', '').replace('/works/', '')
            if not key: continue
            
            author = doc.get('author_name', ['Unknown Author'])[0]
            year = doc.get('first_publish_year')
            has_fulltext = doc.get('has_fulltext', False)
            
            results.append({
                'id': key,
                'title': doc.get('title'),
                'author': author,
                'cover_image': cover_image,
                'publication_year': year,
                'is_external': True,
                'has_fulltext': has_fulltext
            })
        return jsonify(results), 200
    except Exception as e:
        print("External search error:", e)
        return jsonify([]), 200

@bp.route('/external/book/<string:key>', methods=['GET'])
def external_book_details(key):
    try:
        response = requests.get(f'https://openlibrary.org/works/{key}.json', timeout=5)
        data = response.json()
        if 'error' in data: return jsonify({'message': 'Not found'}), 404
        
        title = data.get('title', 'Unknown Title')
        desc = data.get('description', '')
        if isinstance(desc, dict): desc = desc.get('value', '')
        
        # Get author
        author_name = "Unknown Author"
        authors = data.get('authors', [])
        if authors and 'author' in authors[0] and 'key' in authors[0]['author']:
            auth_key = authors[0]['author']['key']
            auth_res = requests.get(f'https://openlibrary.org{auth_key}.json', timeout=5)
            if auth_res.status_code == 200:
                author_name = auth_res.json().get('name', 'Unknown Author')
        
        covers = data.get('covers', [])
        cover_image = f"https://covers.openlibrary.org/b/id/{covers[0]}-L.jpg" if covers else None
        
        return jsonify({
            'id': key,
            'title': title,
            'author': author_name,
            'description': desc or "No description available for this book.",
            'cover_image': cover_image,
            'is_external': True,
            'read_link': f'https://openlibrary.org/works/{key}'
        }), 200
    except Exception as e:
        print("External book details error:", e)
        return jsonify({'message': 'Error fetching book details'}), 500

@bp.route('/external/import', methods=['POST'])
@jwt_required()
def import_external_book():
    user = get_current_user()
    if user['role'] != 'admin': return jsonify({'message': 'Admin access required'}), 403
    
    try:
        data = request.json or {}
        cat = Category.query.first()
        
        new_book = Book(
            title=data.get('title'),
            author=data.get('author'),
            category_id=cat.id if cat else 1,
            description=data.get('description', 'Imported from external source.'),
            cover_image=data.get('cover_image'),
            publication_year=data.get('publication_year'),
            rating=0.0,
            read_link=data.get('read_link'),
            total_copies=1,
            available_copies=1,
            is_available=True
        )
        db.session.add(new_book)
        db.session.commit()
        return jsonify({'message': 'Book imported successfully', 'book_id': new_book.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to import book'}), 500
