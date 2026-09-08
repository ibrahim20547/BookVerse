import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const Home = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [booksRes, catRes] = await Promise.all([
          api.get('/books'),
          api.get('/categories')
        ]);
        setBooks(booksRes.data);
        setCategories(catRes.data.slice(0, 4)); // Show top 4 categories
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/books`);
    }
  };

  const featuredBooks = books.slice(0, 4);
  const popularBooks = [...books].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const newArrivals = [...books].reverse().slice(0, 4);

  const renderBookGrid = (bookList) => (
    <div className="grid-4">
      {bookList.map(book => (
        <div key={book.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.2rem', background: '#FFFFFF' }}>
          {book.cover_image && (
            <div style={{ height: '280px', marginBottom: '1.2rem', display: 'flex', justifyContent: 'center' }}>
              <img src={book.cover_image} alt={book.title} className="book-cover" style={{ maxWidth: '100%' }} />
            </div>
          )}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: '700', letterSpacing: '1px', marginBottom: '0.4rem' }}>
              {book.category_name}
            </span>
            <h4 style={{ marginBottom: '0.2rem', fontSize: '1.2rem', color: 'var(--primary)', lineHeight: '1.3', fontFamily: '"Crimson Text", serif' }}>
              {book.title}
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500', fontStyle: 'italic', marginBottom: '1rem' }}>
              {book.author}
            </p>
            <div style={{ marginTop: 'auto' }}>
              <Link to={`/book/${book.id}`} className="btn btn-outline" style={{ width: '100%', padding: '0.5rem' }}>View Details</Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <section className="hero mb-4">
        <h1>Discover a World of Knowledge</h1>
        <p>Explore books, journals, and digital resources to inspire your mind and fuel your curiosity.</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
          <Link to="/books" className="btn btn-accent" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>Browse Collection</Link>
          <Link to="/categories" className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>Explore Categories</Link>
        </div>
      </section>

      {/* Featured Collection Section */}
      <section className="mb-4" style={{ padding: '3rem 2rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div className="flex justify-between align-center mb-2">
          <h2 style={{ borderBottom: '2px solid var(--accent)', paddingBottom: '0.5rem', display: 'inline-block' }}>Discover Our Collection</h2>
          <Link to="/books" style={{ fontWeight: '600' }}>View All →</Link>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Curated selections of our finest classical literature and modern texts.</p>
        {renderBookGrid(featuredBooks)}
      </section>

      {/* Popular Books */}
      {popularBooks.length > 0 && (
        <section className="mb-4">
          <div className="flex justify-between align-center mb-2">
            <h2 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', display: 'inline-block' }}>Popular Books</h2>
            <Link to="/books" style={{ fontWeight: '600' }}>View All →</Link>
          </div>
          {renderBookGrid(popularBooks)}
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="mb-4">
          <div className="flex justify-between align-center mb-2">
            <h2 style={{ borderBottom: '2px solid var(--accent)', paddingBottom: '0.5rem', display: 'inline-block' }}>New Arrivals</h2>
            <Link to="/books" style={{ fontWeight: '600' }}>View All →</Link>
          </div>
          {renderBookGrid(newArrivals)}
        </section>
      )}

      {/* Categories & Visual Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
        
        {/* Digital Resources Card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <img src="/assets/digital.jpg" alt="Digital Resources" style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
          <div style={{ padding: '2rem' }}>
            <h2>Digital Resources</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Access our extensive collection of digital journals, e-books, and online databases from the comfort of your home.
            </p>
            <Link to="/books" className="btn btn-outline">Explore E-Resources</Link>
          </div>
        </div>

        {/* Reading & Library Card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <img src="/assets/reading.jpg" alt="Library Reading Nook" style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
          <div style={{ padding: '2rem' }}>
            <h2>Library Experience</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Immerse yourself in a world of knowledge. Our curated spaces and collections are designed to inspire every reader.
            </p>
            <Link to="/categories" className="btn btn-outline">View Collections</Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Home;
