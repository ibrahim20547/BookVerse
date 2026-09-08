import urllib.request
from app import create_app
from extensions import db
from models import Book

# Download a reliable placeholder image locally
url = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop"
frontend_public = r"c:\Users\Microsoft\Desktop\Digital library\frontend\public\book-placeholder.jpg"
frontend_dist = r"c:\Users\Microsoft\Desktop\Digital library\frontend\dist\book-placeholder.jpg"

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response:
    img_data = response.read()

with open(frontend_public, 'wb') as f:
    f.write(img_data)
    
try:
    with open(frontend_dist, 'wb') as f:
        f.write(img_data)
except Exception:
    pass

app = create_app()

with app.app_context():
    books = Book.query.all()
    updated = 0
    for book in books:
        if 'pexels' in str(book.cover_image) or 'placehold' in str(book.cover_image) or not book.cover_image:
            book.cover_image = "/book-placeholder.jpg"
            updated += 1
            
    db.session.commit()
    print(f"Downloaded local placeholder and updated {updated} books.")
