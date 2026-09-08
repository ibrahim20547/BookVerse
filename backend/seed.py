from app import create_app
from extensions import db
from models import User, Category, Book

app = create_app()

def seed_data():
    with app.app_context():
        # Drop and create tables
        db.drop_all()
        db.create_all()

        print("Creating admin user...")
        admin = User(username='admin', email='admin@library.com', role='admin')
        admin.set_password('admin')
        db.session.add(admin)

        print("Creating categories...")
        categories_dict = {}
        categories_dict['Fiction'] = Category(name='Fiction', description='Narrative and imaginative literature.')
        db.session.add(categories_dict['Fiction'])
        categories_dict['Science'] = Category(name='Science', description='Factual literature concerning the physical universe.')
        db.session.add(categories_dict['Science'])
        categories_dict['Technology'] = Category(name='Technology', description='Books about modern technology and engineering.')
        db.session.add(categories_dict['Technology'])
        categories_dict['History'] = Category(name='History', description='The study of past events and civilizations.')
        db.session.add(categories_dict['History'])
        categories_dict['Business'] = Category(name='Business', description='Finance, management, and entrepreneurship.')
        db.session.add(categories_dict['Business'])
        categories_dict['Education'] = Category(name='Education', description='Pedagogy, learning theory, and educational philosophy.')
        db.session.add(categories_dict['Education'])
        categories_dict['Mystery'] = Category(name='Mystery', description='Whodunits, thrillers, and detective stories.')
        db.session.add(categories_dict['Mystery'])
        db.session.commit()

        print("Creating books...")
        books = []
        
        # Mystery
        books.append(Book(title='The Adventures of Sherlock Holmes', author='Arthur Conan Doyle', category_id=categories_dict['Mystery'].id, description='A collection of twelve short stories featuring the famous consulting detective Sherlock Holmes.', cover_image='https://images.unsplash.com/photo-1626966679586-be6950294fc9?q=80&w=600&auto=format&fit=crop', publication_year=1892, rating=4.8, read_link='https://www.gutenberg.org/ebooks/1661', total_copies=5, available_copies=5))
        books.append(Book(title='The Mysterious Affair at Styles', author='Agatha Christie', category_id=categories_dict['Mystery'].id, description='The debut novel introducing Hercule Poirot, who investigates the poisoning of a wealthy heiress.', cover_image='https://images.unsplash.com/photo-1614544048536-0d28caf77f41?q=80&w=600&auto=format&fit=crop', publication_year=1920, rating=4.6, read_link='https://www.gutenberg.org/ebooks/863', total_copies=5, available_copies=5))

        # Science
        books.append(Book(title='Relativity: The Special and General Theory', author='Albert Einstein', category_id=categories_dict['Science'].id, description='Einstein\'s own popular translation of the physics that revolutionized our understanding of space and time.', cover_image='https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop', publication_year=1916, rating=4.7, read_link='https://www.gutenberg.org/ebooks/30155', total_copies=5, available_copies=5))
        books.append(Book(title='On the Origin of Species', author='Charles Darwin', category_id=categories_dict['Science'].id, description='A work of scientific literature which is considered to be the foundation of evolutionary biology.', cover_image='https://images.unsplash.com/photo-1530292552636-f61b0c03c516?q=80&w=600&auto=format&fit=crop', publication_year=1859, rating=4.8, read_link='https://www.gutenberg.org/ebooks/1228', total_copies=5, available_copies=5))
        books.append(Book(title='Opticks', author='Isaac Newton', category_id=categories_dict['Science'].id, description='A treatise of the reflections, refractions, inflections and colours of light.', cover_image='https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop', publication_year=1704, rating=4.5, read_link='https://www.gutenberg.org/ebooks/33504', total_copies=5, available_copies=5))

        # Fiction
        books.append(Book(title='Pride and Prejudice', author='Jane Austen', category_id=categories_dict['Fiction'].id, description='A romantic novel that charts the emotional development of the protagonist, Elizabeth Bennet.', cover_image='https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop', publication_year=1813, rating=4.9, read_link='https://www.gutenberg.org/ebooks/1342', total_copies=5, available_copies=5))
        books.append(Book(title='Moby Dick', author='Herman Melville', category_id=categories_dict['Fiction'].id, description='The narrative of sailor Ishmael\'s obsessive quest for the legendary white whale.', cover_image='https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop', publication_year=1851, rating=4.6, read_link='https://www.gutenberg.org/ebooks/2701', total_copies=5, available_copies=5))
        books.append(Book(title='Dracula', author='Bram Stoker', category_id=categories_dict['Fiction'].id, description='The classic gothic horror novel introducing the vampire Count Dracula.', cover_image='https://images.unsplash.com/photo-1517672651691-24622a91b550?q=80&w=600&auto=format&fit=crop', publication_year=1897, rating=4.7, read_link='https://www.gutenberg.org/ebooks/345', total_copies=5, available_copies=5))

        # History
        books.append(Book(title='History of the Decline and Fall of the Roman Empire', author='Edward Gibbon', category_id=categories_dict['History'].id, description='A historical work detailing the trajectory of Western civilization from the height of the Roman Empire.', cover_image='https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=600&auto=format&fit=crop', publication_year=1776, rating=4.5, read_link='https://www.gutenberg.org/ebooks/25717', total_copies=5, available_copies=5))
        books.append(Book(title='The History of the Peloponnesian War', author='Thucydides', category_id=categories_dict['History'].id, description='A historical account of the war fought between the Peloponnesian League and the Delian League.', cover_image='https://images.unsplash.com/photo-1587211516246-86c4767bd8a7?q=80&w=600&auto=format&fit=crop', publication_year=-400, rating=4.6, read_link='https://www.gutenberg.org/ebooks/7142', total_copies=5, available_copies=5))

        # Technology
        books.append(Book(title='The First Airplane Diesel Engine', author='Robert B. Meyer', category_id=categories_dict['Technology'].id, description='A detailed historical account of the Packard Model DR-980 of 1928.', cover_image='https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop', publication_year=1964, rating=4.4, read_link='https://www.gutenberg.org/ebooks/34316', total_copies=5, available_copies=5))
        books.append(Book(title='Edison, His Life and Inventions', author='Frank Lewis Dyer', category_id=categories_dict['Technology'].id, description='A biography and review of the technological inventions of Thomas Edison.', cover_image='https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop', publication_year=1910, rating=4.5, read_link='https://www.gutenberg.org/ebooks/820', total_copies=5, available_copies=5))

        # Business
        books.append(Book(title='The Art of Money Getting', author='P. T. Barnum', category_id=categories_dict['Business'].id, description='Golden Rules for Making Money by the legendary showman.', cover_image='https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop', publication_year=1880, rating=4.3, read_link='https://www.gutenberg.org/ebooks/8581', total_copies=5, available_copies=5))
        books.append(Book(title='The Principles of Scientific Management', author='Frederick Winslow Taylor', category_id=categories_dict['Business'].id, description='A highly influential monograph outlining the principles of industrial efficiency.', cover_image='https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop', publication_year=1911, rating=4.4, read_link='https://www.gutenberg.org/ebooks/6435', total_copies=5, available_copies=5))

        # Education
        books.append(Book(title='Democracy and Education', author='John Dewey', category_id=categories_dict['Education'].id, description='An introduction to the philosophy of education and its relation to experience.', cover_image='https://images.unsplash.com/photo-1544377193-33dce4d95d0c?q=80&w=600&auto=format&fit=crop', publication_year=1916, rating=4.7, read_link='https://www.gutenberg.org/ebooks/852', total_copies=5, available_copies=5))
        books.append(Book(title='The Montessori Method', author='Maria Montessori', category_id=categories_dict['Education'].id, description='Scientific pedagogy as applied to child education in the Children\'s Houses.', cover_image='https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop', publication_year=1912, rating=4.6, read_link='https://www.gutenberg.org/ebooks/24096', total_copies=5, available_copies=5))

        for book in books:
            db.session.add(book)

        db.session.commit()
        print(f"Database seeded successfully with {len(books)} books!")

if __name__ == '__main__':
    seed_data()
