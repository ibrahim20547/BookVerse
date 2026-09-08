import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const BookDetails = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await api.get(`/books/${id}`);
        setBook(res.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchBook();
    if (user) {
      const checkFav = async () => {
        try {
          const res = await api.get(`/user/favorites/${id}`);
          setIsFavorite(res.data.is_favorite);
        } catch (err) {
          console.error(err);
        }
      };
      checkFav();
    }
  }, [id, user]);

  const handleBorrow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/borrow/${id}`);
      setMessage({ text: res.data.message, type: 'success' });
      setBook({ ...book, available_copies: book.available_copies - 1 });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to borrow', type: 'error' });
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (isFavorite) {
        await api.delete(`/favorites/${id}`);
        setIsFavorite(false);
      } else {
        await api.post(`/favorites/${id}`);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center mt-2">Loading...</div>;
  if (!book) return <div className="text-center mt-2">Book not found.</div>;

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {book.cover_image && (
          <div style={{ flex: '1', minWidth: '250px' }}>
            <img src={book.cover_image} alt={book.title} style={{ width: '100%', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }} />
          </div>
        )}
        <div style={{ flex: '2', minWidth: '300px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{book.title}</h2>
          <h4 style={{ color: 'var(--text-muted)', fontFamily: 'Inter', fontWeight: '500', marginBottom: '1rem' }}>By {book.author}</h4>
          
          <span style={{ display: 'inline-block', background: 'var(--surface-alt)', padding: '0.3rem 0.8rem', borderRadius: '4px', fontSize: '0.9rem', border: '1px solid var(--border)', marginBottom: '1.5rem', marginRight: '1rem', color: 'var(--primary)' }}>
            Category: {book.category_name || 'Uncategorized'}
          </span>
          <span style={{ display: 'inline-block', background: 'var(--surface-alt)', padding: '0.3rem 0.8rem', borderRadius: '4px', fontSize: '0.9rem', border: '1px solid var(--border)', marginBottom: '1.5rem', marginRight: '1rem', color: 'var(--primary)' }}>
            Year: {book.publication_year || 'N/A'}
          </span>
          <span style={{ display: 'inline-block', background: 'var(--surface-alt)', padding: '0.3rem 0.8rem', borderRadius: '4px', fontSize: '0.9rem', border: '1px solid var(--border)', marginBottom: '1.5rem', color: 'var(--accent)' }}>
            ★ {book.rating || 'N/A'}
          </span>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ lineHeight: '1.8' }}>{book.description || 'No description available for this book.'}</p>
          </div>
          
          <div style={{ padding: '1rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontWeight: '600', color: 'var(--primary)' }}>Availability:</span>
               <span style={{ color: book.available_copies > 0 ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                {book.available_copies} / {book.total_copies} copies
              </span>
            </div>
          </div>

          {message.text && (
            <div style={{ padding: '0.8rem', marginBottom: '1rem', borderRadius: '4px', background: message.type === 'error' ? '#fde8e8' : '#e6f4ea', color: message.type === 'error' ? '#9b1c1c' : '#1e4b2e' }}>
              {message.text}
            </div>
          )}

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.8rem' }}
            onClick={handleBorrow}
            disabled={book.available_copies <= 0}
          >
            {book.available_copies > 0 ? 'Borrow Book' : 'Currently Unavailable'}
          </button>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            {book.read_link && (
              <a href={book.read_link} target="_blank" rel="noopener noreferrer" className="btn btn-accent text-center" style={{ flex: 1, padding: '0.8rem' }}>
                Read Book
              </a>
            )}
            <button 
              className="btn btn-outline" 
              style={{ flex: 1, padding: '0.8rem', borderColor: isFavorite ? 'var(--accent)' : 'var(--text-muted)', color: isFavorite ? 'var(--accent)' : 'var(--text-muted)' }}
              onClick={handleFavorite}
            >
              {isFavorite ? '★ Remove from Favorites' : '☆ Add to Favorites'}
            </button>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button className="btn" style={{ width: '100%', padding: '0.8rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)' }} onClick={() => navigate('/books')}>
              ← Back to Library
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
