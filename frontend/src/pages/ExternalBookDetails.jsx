import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const ExternalBookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await api.get(`/external/book/${id}`);
        setBook(res.data);
      } catch (err) {
        setError('Failed to fetch book details from external source.');
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading external book details...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '3rem' }}>{error}</div>;
  if (!book) return <div style={{ textAlign: 'center', padding: '3rem' }}>Book not found.</div>;

  return (
    <div className="card" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <button className="btn btn-outline mb-4" onClick={() => navigate(-1)}>← Back to Search</button>
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px' }}>
          {book.cover_image ? (
            <img src={book.cover_image} alt={book.title} style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
          ) : (
            <div style={{ width: '100%', height: '400px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: 'var(--text-muted)' }}>
              No Cover Available
            </div>
          )}
        </div>
        
        <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column' }}>
          <span style={{ display: 'inline-block', background: 'var(--accent)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '1rem', alignSelf: 'flex-start' }}>
            External Source (Open Library)
          </span>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>{book.title}</h2>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontWeight: '500' }}>by {book.author}</h3>
          
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>About this Book</h4>
            <p style={{ lineHeight: '1.6', color: 'var(--text-main)', maxHeight: '300px', overflowY: 'auto' }}>
              {book.description}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: 'auto' }}>
            {book.read_link ? (
              <a 
                href={book.read_link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                📖 Read on Open Library
              </a>
            ) : (
              <button className="btn btn-outline" disabled style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                No Legal Reading Source Available
              </button>
            )}
          </div>
          
          <div style={{ marginTop: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)', background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius)', borderLeft: '4px solid var(--accent)' }}>
            <strong>Notice:</strong> This book is discovered from an external public database. It is not currently available for borrowing in the BookVerse library.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExternalBookDetails;
