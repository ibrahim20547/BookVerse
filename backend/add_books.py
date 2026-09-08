from app import create_app
from extensions import db
from models import Book, Category

app = create_app()

history_books = [
    {
        "title": "Sapiens: A Brief History of Humankind",
        "author": "Yuval Noah Harari",
        "category_name": "History",
        "description": "A book by Professor Yuval Noah Harari that spans the whole of human history, from the very first humans to walk the earth to the radical – and sometimes devastating – breakthroughs of the Cognitive, Agricultural and Scientific Revolutions.",
        "publication_year": 2011,
        "rating": 4.6,
        "cover_image": "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg"
    },
    {
        "title": "Guns, Germs, and Steel: The Fates of Human Societies",
        "author": "Jared Diamond",
        "category_name": "History",
        "description": "A transdisciplinary non-fiction book by Jared Diamond. It won the Pulitzer Prize for General Non-Fiction in 1998.",
        "publication_year": 1997,
        "rating": 4.2,
        "cover_image": "https://covers.openlibrary.org/b/isbn/9780393317558-L.jpg"
    },
    {
        "title": "A People's History of the United States",
        "author": "Howard Zinn",
        "category_name": "History",
        "description": "A 1980 non-fiction book by American historian and political scientist Howard Zinn.",
        "publication_year": 1980,
        "rating": 4.1,
        "cover_image": "https://covers.openlibrary.org/b/isbn/9780060528379-L.jpg"
    }
]

islamic_books = [
    {
        "title": "The Sealed Nectar (Ar-Raheeq Al-Makhtum)",
        "author": "Safi-ur-Rahman al-Mubarakpuri",
        "category_name": "Islamic",
        "description": "A complete authoritative book on the life of Prophet Muhammad (S) which was honored by the World Muslim League as first prize winner.",
        "publication_year": 1979,
        "rating": 4.9,
        "cover_image": "https://covers.openlibrary.org/b/isbn/9781591440710-L.jpg"
    },
    {
        "title": "Purification of the Heart",
        "author": "Hamza Yusuf",
        "category_name": "Islamic",
        "description": "Signs, Symptoms and Cures of the Spiritual Diseases of the Heart.",
        "publication_year": 2004,
        "rating": 4.8,
        "cover_image": "https://covers.openlibrary.org/b/isbn/9781929694150-L.jpg"
    },
    {
        "title": "Muhammad: His Life Based on the Earliest Sources",
        "author": "Martin Lings",
        "category_name": "Islamic",
        "description": "An internationally acclaimed, comprehensive, and authoritative account of the life of the Prophet.",
        "publication_year": 1983,
        "rating": 4.7,
        "cover_image": "https://covers.openlibrary.org/b/isbn/9781594771538-L.jpg"
    }
]

with app.app_context():
    # 1. Update all existing broken images to a solid generic color image from via.placeholder.com
    books = Book.query.all()
    updated = 0
    for book in books:
        if 'unsplash' in book.cover_image or 'placehold.co' in book.cover_image or not book.cover_image:
            # use UI-Avatars for reliable generation
            # book.cover_image = f"https://ui-avatars.com/api/?name={book.title.replace(' ', '+')}&size=400&background=random"
            book.cover_image = "https://images.pexels.com/photos/256450/pexels-photo-256450.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1"
            updated += 1
    
    # 2. Add Islamic Category
    islamic_cat = Category.query.filter_by(name="Islamic").first()
    if not islamic_cat:
        islamic_cat = Category(name="Islamic", description="Books relating to Islamic history, theology, and spirituality.")
        db.session.add(islamic_cat)
        db.session.commit()
        
    history_cat = Category.query.filter_by(name="History").first()
    
    # 3. Add Books
    for b_data in history_books:
        if not Book.query.filter_by(title=b_data["title"]).first():
            b = Book(
                title=b_data["title"],
                author=b_data["author"],
                category_id=history_cat.id,
                description=b_data["description"],
                cover_image=b_data["cover_image"],
                publication_year=b_data["publication_year"],
                rating=b_data["rating"],
                total_copies=10,
                available_copies=10,
                is_available=True
            )
            db.session.add(b)
            
    for b_data in islamic_books:
        if not Book.query.filter_by(title=b_data["title"]).first():
            b = Book(
                title=b_data["title"],
                author=b_data["author"],
                category_id=islamic_cat.id,
                description=b_data["description"],
                cover_image=b_data["cover_image"],
                publication_year=b_data["publication_year"],
                rating=b_data["rating"],
                total_copies=10,
                available_copies=10,
                is_available=True
            )
            db.session.add(b)
            
    db.session.commit()
    print(f"Updated {updated} broken covers and added new History and Islamic books.")
