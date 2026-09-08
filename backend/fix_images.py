from app import create_app
from extensions import db
from models import Book
import urllib.parse

app = create_app()

with app.app_context():
    books = Book.query.all()
    updated = 0
    for book in books:
        if not book.cover_image or 'unsplash' in book.cover_image:
            title_encoded = urllib.parse.quote_plus(book.title)
            # Use placehold.co to generate a clean book cover image
            book.cover_image = f"https://placehold.co/400x600/f3f4f6/333333?text={title_encoded}"
            updated += 1
            
    db.session.commit()
    print(f"Updated {updated} book covers with reliable placeholders.")
