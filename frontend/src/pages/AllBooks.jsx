import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api';

const AllBooks = () => {
  const [books, setBooks] = useState([]);
  const [externalBooks, setExternalBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get('category_id') || '';
  const initialSearch = queryParams.get('search') || '';
  
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBooks(search, selectedCategory);
    }, 300);
    
    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedCategory]);

  const fetchBooks = async (searchQuery = '', catId = '') => {
    setLoading(true);
    try {
      let url = '/books?';
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (catId) url += `category_id=${catId}&`;
      const res = await api.get(url);
      setBooks(res.data);

      if (searchQuery) {
        const extRes = await api.get(`/external/search?q=${encodeURIComponent(searchQuery)}`);
        // Filter out books that might already be in our DB (basic title match)
        const localTitles = res.data.map(b => b.title.toLowerCase());
        const filteredExt = extRes.data.filter(b => !localTitles.includes(b.title.toLowerCase()));
        setExternalBooks(filteredExt);
      } else {
        setExternalBooks([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks(search, selectedCategory);
  };

  return (
    <div>
      <h2 className="mb-2">Library Collection</h2>
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <aside style={{ width: '250px', flexShrink: 0 }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Search</h3>
            <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
              <input 
                type="text" 
                className="form-control mb-1" 
                placeholder="Title or author..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>

            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Filter by Category</h3>
            <ul style={{ listStyle: 'none' }}>
              <li style={{ marginBottom: '0.8rem' }}>
                <button 
                  onClick={() => setSelectedCategory('')}
                  style={{ background: 'none', border: 'none', color: selectedCategory === '' ? 'var(--accent)' : 'var(--text-main)', fontWeight: selectedCategory === '' ? '600' : '400', cursor: 'pointer', textAlign: 'left', width: '100%', fontSize: '1rem' }}
                >
                  All Categories
                </button>
              </li>
              {categories.map(cat => (
                <li key={cat.id} style={{ marginBottom: '0.8rem' }}>
                  <button 
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{ background: 'none', border: 'none', color: selectedCategory == cat.id ? 'var(--accent)' : 'var(--text-main)', fontWeight: selectedCategory == cat.id ? '600' : '400', cursor: 'pointer', textAlign: 'left', width: '100%', fontSize: '1rem' }}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: '300px' }}>
          
          {loading && (
             <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
               <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid var(--border)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
               <p style={{ marginTop: '1rem' }}>Searching library and web...</p>
             </div>
          )}
          
          {!loading && (
            <>
              {/* Local Results */}
              <div className="grid-3" style={{ marginBottom: externalBooks.length > 0 ? '3rem' : '0' }}>
                {books.map(book => (
                  <div key={book.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
                    {book.cover_image && (
                      <div style={{ height: '250px', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={book.cover_image} alt={book.title} className="book-cover" style={{ maxWidth: '100%' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '0.4rem' }}>
                        {book.category_name}
                      </span>
                      <h4 style={{ marginBottom: '0.2rem', fontSize: '1.2rem', color: 'var(--primary)', lineHeight: '1.3', fontFamily: '"Crimson Text", serif' }}>{book.title}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500', fontStyle: 'italic' }}>{book.author}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.description}</p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Year: {book.publication_year || 'N/A'}</span>
                        <span style={{ color: '#FFD700' }}>★ {book.rating || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        <span style={{ color: book.available_copies > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                          {book.available_copies > 0 ? 'Available' : 'Out of Stock'}
                        </span>
                      </div>

                      <Link to={`/book/${book.id}`} className="btn btn-outline text-center" style={{ width: '100%' }}>View Details</Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* External Results */}
              {externalBooks.length > 0 && (
                <>
                  <hr style={{ border: 'none', borderTop: '2px dashed var(--border)', margin: '0 0 2rem 0' }} />
                  <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>🌐 Discover from Web</h3>
                  <div className="grid-3">
                    {externalBooks.map(book => (
                      <div key={book.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', border: '1px solid var(--accent)' }}>
                        {book.cover_image ? (
                          <div style={{ height: '250px', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={book.cover_image} alt={book.title} className="book-cover" style={{ maxWidth: '100%' }} />
                          </div>
                        ) : (
                           <div style={{ height: '250px', borderRadius: '8px', marginBottom: '1rem', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Cover</div>
                        )}
                        
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '0.4rem' }}>
                            External Source
                          </span>
                          <h4 style={{ marginBottom: '0.2rem', fontSize: '1.2rem', color: 'var(--primary)', lineHeight: '1.3', fontFamily: '"Crimson Text", serif' }}>{book.title}</h4>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500', fontStyle: 'italic' }}>{book.author}</p>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.85rem', flex: 1 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Year: {book.publication_year || 'N/A'}</span>
                            <span style={{ color: book.has_fulltext ? '#10b981' : 'var(--text-muted)', fontWeight: book.has_fulltext ? 'bold' : 'normal' }}>
                              {book.has_fulltext ? '📖 Read Online' : 'No Reading Source'}
                            </span>
                          </div>

                          <Link to={`/external-book/${book.id}`} className="btn btn-primary text-center" style={{ width: '100%', background: 'var(--accent)', borderColor: 'var(--accent)' }}>View Web Details</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {books.length === 0 && externalBooks.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>No matching books found in library or web.</p>
              )}
            </>
          )}
        </main>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default AllBooks;
