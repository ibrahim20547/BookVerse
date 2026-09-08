import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);

  if (user && (user.role === 'admin' || user.username?.toLowerCase() === 'admin')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  useEffect(() => {
    fetchBorrows();
  }, []);

  const fetchBorrows = async () => {
    try {
      const res = await api.get('/user/borrows');
      setBorrows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load user borrows:', err);
      setBorrows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (bookId) => {
    try {
      await api.post(`/return/${bookId}`);
      fetchBorrows();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to return book');
    }
  };

  if (loading) return <div className="text-center mt-2">Loading your library...</div>;

  const safeBorrows = Array.isArray(borrows) ? borrows : [];
  const activeBorrows = safeBorrows.filter(b => b && b.status === 'borrowed');
  const history = safeBorrows.filter(b => b && b.status === 'returned');

  return (
    <div className="container" style={{ margin: '2rem auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>Welcome, {user?.username}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{user?.email} • Member since 2026</p>
        </div>
        <div>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚙️</span> Profile Settings
          </button>
        </div>
      </div>
      
      <div className="card mb-4">
        <h3 style={{ borderBottom: '2px solid var(--accent)', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'inline-block' }}>My Library: Currently Borrowed</h3>
        {activeBorrows.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--background)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You have no active borrowed books.</p>
            <Link to="/books" className="btn btn-primary">Browse Collection</Link>
          </div>
        ) : (
          <div className="grid-3">
            {activeBorrows.map(record => (
              <div key={record.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.2rem', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', fontFamily: '"Crimson Text", serif', color: 'var(--primary)' }}>{record.book_title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Borrowed on: {record.borrow_date ? new Date(record.borrow_date).toLocaleDateString() : 'N/A'}
                </p>
                <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/book/${record.book_id}`} className="btn btn-outline" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', padding: '0.5rem' }}>View Book</Link>
                  <button onClick={() => handleReturn(record.book_id)} className="btn btn-accent" style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem' }}>Return Book</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'inline-block' }}>Borrowing History: Returned Books</h3>
        {history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No borrowing history found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', color: 'var(--primary)' }}>Book Title</th>
                  <th style={{ padding: '1rem', color: 'var(--primary)' }}>Borrowed Date</th>
                  <th style={{ padding: '1rem', color: 'var(--primary)' }}>Returned Date</th>
                  <th style={{ padding: '1rem', color: 'var(--primary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(record => (
                  <tr key={record.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>
                      <Link to={`/book/${record.book_id}`}>{record.book_title}</Link>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{record.borrow_date ? new Date(record.borrow_date).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{record.return_date ? new Date(record.return_date).toLocaleDateString() : '-'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: '#e6f4ea', color: '#1e4b2e', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                        Returned
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
