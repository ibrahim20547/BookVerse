import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notification, setNotification] = useState({ message: '', type: 'success' });
  const [loadingData, setLoadingData] = useState(false);

  // Books filter & search
  const [bookSearch, setBookSearch] = useState('');
  const [bookCategoryFilter, setBookCategoryFilter] = useState('');

  // Books Add/Edit Modal Form State
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookForm, setBookForm] = useState({
    id: null,
    title: '',
    author: '',
    category_id: '',
    description: '',
    cover_image: '',
    publication_year: '',
    rating: 4.5,
    read_link: '',
    total_copies: 5,
    is_available: true
  });

  // Categories Form State
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [editCatId, setEditCatId] = useState(null);

  // Users filter & search
  const [userSearch, setUserSearch] = useState('');

  // Open Library Discovery & Import inside Admin
  const [importQuery, setImportQuery] = useState('');
  const [importResults, setImportResults] = useState([]);
  const [searchingExternal, setSearchingExternal] = useState(false);
  const [importingId, setImportingId] = useState(null);

  useEffect(() => {
    document.title = 'Admin Dashboard | BookVerse';
    fetchData();
  }, [activeTab]);

  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: 'success' }), 4000);
  };

  const fetchData = async () => {
    setLoadingData(true);
    try {
      if (activeTab === 'dashboard') {
        const [statsRes, catRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/categories')
        ]);
        setStats(statsRes.data && typeof statsRes.data === 'object' ? statsRes.data : { total_books: 0, total_categories: 0, total_users: 0, total_borrows: 0, total_favorites: 0, activity: [] });
        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      } else if (activeTab === 'books') {
        const [booksRes, catRes] = await Promise.all([
          api.get('/books'),
          api.get('/categories')
        ]);
        setBooks(Array.isArray(booksRes.data) ? booksRes.data : []);
        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      } else if (activeTab === 'categories') {
        const catRes = await api.get('/categories');
        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      } else if (activeTab === 'users') {
        const usersRes = await api.get('/admin/users');
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      } else if (activeTab === 'transactions') {
        const txRes = await api.get('/admin/borrows');
        setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
      } else if (activeTab === 'import') {
        const catRes = await api.get('/categories');
        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      notify('Failed to load data. Please verify connection.', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin', { replace: true });
  };

  // --- Book Operations ---
  const handleOpenAddBook = () => {
    const defaultCatId = categories.length > 0 ? categories[0].id : '';
    setBookForm({
      id: null,
      title: '',
      author: '',
      category_id: defaultCatId,
      description: '',
      cover_image: '',
      publication_year: new Date().getFullYear(),
      rating: 4.5,
      read_link: '',
      total_copies: 5,
      is_available: true
    });
    setShowBookModal(true);
  };

  const handleOpenEditBook = (b) => {
    setBookForm({
      id: b.id,
      title: b.title || '',
      author: b.author || '',
      category_id: b.category_id || (categories[0]?.id || ''),
      description: b.description || '',
      cover_image: b.cover_image || '',
      publication_year: b.publication_year || '',
      rating: b.rating || 4.5,
      read_link: b.read_link || '',
      total_copies: b.total_copies || 1,
      is_available: b.is_available !== undefined ? b.is_available : true
    });
    setShowBookModal(true);
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    try {
      if (bookForm.id) {
        await api.put(`/books/${bookForm.id}`, bookForm);
        notify(`"${bookForm.title}" updated successfully!`);
      } else {
        await api.post('/books', bookForm);
        notify(`"${bookForm.title}" added to library catalog!`);
      }
      setShowBookModal(false);
      fetchData();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save book', 'error');
    }
  };

  const handleDeleteBook = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      await api.delete(`/books/${id}`);
      notify(`"${title}" was deleted.`);
      fetchData();
    } catch (err) {
      notify('Failed to delete book.', 'error');
    }
  };

  // --- Category Operations ---
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editCatId) {
        await api.put(`/categories/${editCatId}`, { name: catName, description: catDesc });
        notify('Category updated successfully');
      } else {
        await api.post('/categories', { name: catName, description: catDesc });
        notify('New category added');
      }
      setCatName('');
      setCatDesc('');
      setEditCatId(null);
      fetchData();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save category', 'error');
    }
  };

  const handleEditCategory = (c) => {
    setEditCatId(c.id);
    setCatName(c.name);
    setCatDesc(c.description || '');
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? Books in this category should be reassigned.`)) return;
    try {
      await api.delete(`/categories/${id}`);
      notify(`Category "${name}" deleted.`);
      fetchData();
    } catch (err) {
      notify('Failed to delete category.', 'error');
    }
  };

  // --- User Operations ---
  const handleToggleUserStatus = async (targetUser) => {
    if (targetUser.role === 'admin') {
      notify('Administrator accounts cannot be deactivated.', 'error');
      return;
    }
    const action = targetUser.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} user "${targetUser.username}"?`)) return;
    try {
      await api.put(`/admin/users/${targetUser.id}/toggle-status`);
      notify(`User "${targetUser.username}" is now ${targetUser.is_active ? 'deactivated' : 'active'}.`);
      fetchData();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update user status.', 'error');
    }
  };

  // --- Transaction Operations ---
  const handleUpdateTransaction = async (id, newStatus) => {
    try {
      await api.put(`/admin/borrows/${id}/status`, { status: newStatus });
      notify(`Borrow record marked as ${newStatus}.`);
      fetchData();
    } catch (err) {
      notify('Failed to update borrow record.', 'error');
    }
  };

  // --- Open Library Search & Import ---
  const handleSearchExternal = async (e) => {
    e.preventDefault();
    if (!importQuery.trim()) return;
    setSearchingExternal(true);
    try {
      const res = await api.get(`/external/search?q=${encodeURIComponent(importQuery)}`);
      setImportResults(res.data);
      if (res.data.length === 0) {
        notify('No books found for that search query.', 'error');
      }
    } catch (err) {
      notify('External search failed. Please try again.', 'error');
    } finally {
      setSearchingExternal(false);
    }
  };

  const handleImportBook = async (extBook) => {
    setImportingId(extBook.id);
    try {
      await api.post('/external/import', {
        title: extBook.title,
        author: extBook.author,
        description: `Imported from Open Library. First published in ${extBook.publication_year || 'N/A'}.`,
        cover_image: extBook.cover_image,
        publication_year: extBook.publication_year,
        read_link: extBook.read_link || `https://openlibrary.org/works/${extBook.id}`
      });
      notify(`"${extBook.title}" successfully imported to BookVerse!`);
    } catch (err) {
      notify('Failed to import book.', 'error');
    } finally {
      setImportingId(null);
    }
  };

  // Filtered lists
  const filteredBooks = books.filter(b => {
    const matchesSearch = !bookSearch || 
      b.title?.toLowerCase().includes(bookSearch.toLowerCase()) || 
      b.author?.toLowerCase().includes(bookSearch.toLowerCase());
    const matchesCategory = !bookCategoryFilter || String(b.category_id) === String(bookCategoryFilter);
    return matchesSearch && matchesCategory;
  });

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background, #0f172a)',
      color: 'var(--text-main, #f8fafc)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Top Navigation Bar */}
      <header style={{
        background: '#0b1120',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: '700',
            fontSize: '1.25rem',
            letterSpacing: '0.02em',
            fontFamily: '"Crimson Text", Georgia, serif'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c5a059" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19V5C4 3.89543 4.89543 3 6 3H19.4C19.7314 3 20 3.26863 20 3.6V16.7143C20 17.9767 18.9767 19 17.7143 19H4Z"/>
              <path d="M4 19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19M4 19H17.7143M8 7H16M8 11H13"/>
            </svg>
            <span style={{ color: '#ffffff' }}>BookVerse</span>
            <span style={{
              background: '#c5a059',
              color: '#0f172a',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Admin
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Public Website Preview Link */}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '0.85rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.03)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <span>Public Site</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </Link>

          {/* Admin User Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.35rem 0.75rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            fontSize: '0.85rem'
          }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: '#c5a059',
              color: '#0f172a',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem'
            }}>
              {user?.username?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{user?.username}</span>
          </div>

          {/* Logout Button */}
          <button
            id="admin-logout-btn"
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '0.5rem 0.9rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s, transform 0.1s',
              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Admin Content Area with Sidebar */}
      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 'calc(100vh - 65px)'
      }}>
        {/* Sidebar */}
        <aside style={{
          width: '240px',
          background: '#0d1527',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div>
            <div style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#64748b',
              fontWeight: '700',
              marginBottom: '0.75rem',
              paddingLeft: '0.6rem'
            }}>
              Administration
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {[
                { id: 'dashboard', label: 'Overview & Stats', icon: '📊' },
                { id: 'books', label: 'Books & Content', icon: '📚' },
                { id: 'import', label: 'Discover & Import', icon: '🌐' },
                { id: 'categories', label: 'Categories & Genres', icon: '🏷️' },
                { id: 'users', label: 'User Accounts', icon: '👥' },
                { id: 'transactions', label: 'Borrows & Returns', icon: '🔄' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === item.id ? 'rgba(197, 160, 89, 0.15)' : 'transparent',
                    color: activeTab === item.id ? '#e2ba6a' : '#94a3b8',
                    fontWeight: activeTab === item.id ? '600' : '500',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    borderLeft: activeTab === item.id ? '3px solid #c5a059' : '3px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== item.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== item.id) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#94a3b8';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Quick System Summary */}
          <div style={{
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.75rem',
            color: '#64748b'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: '600', marginBottom: '0.3rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              System Online
            </div>
            <div>Database: Connected</div>
            <div>Role: Super Administrator</div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main style={{
          flex: 1,
          padding: '2rem',
          overflowY: 'auto',
          background: '#090e1a'
        }}>
          {/* Global Notification Toast */}
          {notification.message && (
            <div style={{
              background: notification.type === 'error' ? '#ef4444' : '#10b981',
              color: '#ffffff',
              padding: '0.85rem 1.25rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              fontWeight: '500',
              animation: 'adminSlideDown 0.25s ease-out'
            }}>
              <span>{notification.message}</span>
              <button
                onClick={() => setNotification({ message: '', type: 'success' })}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* --- TAB 1: OVERVIEW & STATS --- */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.3rem 0', color: '#ffffff' }}>
                    Dashboard Overview
                  </h1>
                  <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
                    Real-time metrics, collection inventory, and user activity.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handleOpenAddBook}
                    style={{
                      background: '#c5a059',
                      color: '#0f172a',
                      border: 'none',
                      padding: '0.6rem 1.1rem',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <span>+</span> Add New Book
                  </button>
                  <button
                    onClick={() => setActiveTab('import')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '0.6rem 1.1rem',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Import External Books
                  </button>
                </div>
              </div>

              {/* Statistics Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2.5rem'
              }}>
                {[
                  { label: 'Total Books', value: stats?.total_books ?? 0, icon: '📖', color: '#38bdf8' },
                  { label: 'Categories', value: stats?.total_categories ?? 0, icon: '🏷️', color: '#a855f7' },
                  { label: 'Registered Users', value: stats?.total_users ?? 0, icon: '👥', color: '#34d399' },
                  { label: 'Total Borrows', value: stats?.total_borrows ?? 0, icon: '🔄', color: '#f59e0b' },
                  { label: 'Favorites Saved', value: stats?.total_favorites ?? 0, icon: '⭐', color: '#fb7185' }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#111c34',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '500' }}>{item.label}</span>
                      <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#ffffff', lineHeight: 1.1 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activity Table */}
              <div style={{
                background: '#111c34',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1.5rem',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: '600', margin: 0, color: '#ffffff' }}>
                    Recent Circulation Activity
                  </h2>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#c5a059',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}
                  >
                    View All Borrows →
                  </button>
                </div>

                {stats?.activity && stats.activity.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: '#64748b' }}>
                          <th style={{ padding: '0.75rem' }}>Action</th>
                          <th style={{ padding: '0.75rem' }}>User</th>
                          <th style={{ padding: '0.75rem' }}>Book Title</th>
                          <th style={{ padding: '0.75rem' }}>Date & Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.activity.map((act, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#cbd5e1' }}>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: '#60a5fa',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                textTransform: 'uppercase'
                              }}>
                                {act.type}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', fontWeight: '500' }}>{act.user}</td>
                            <td style={{ padding: '0.75rem' }}>{act.book}</td>
                            <td style={{ padding: '0.75rem', color: '#94a3b8' }}>
                              {new Date(act.date).toLocaleDateString()} {new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '1rem 0 0 0' }}>
                    No recent activity recorded yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* --- TAB 2: BOOKS & PRODUCTS MANAGEMENT --- */}
          {activeTab === 'books' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.3rem 0', color: '#ffffff' }}>
                    Book Catalog Management
                  </h1>
                  <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
                    Add, edit, or remove books, modify inventory copies, and manage online reading URLs.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handleOpenAddBook}
                    style={{
                      background: '#c5a059',
                      color: '#0f172a',
                      border: 'none',
                      padding: '0.65rem 1.25rem',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <span>+</span> Add New Book
                  </button>
                  <button
                    onClick={() => setActiveTab('import')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '0.65rem 1.1rem',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Import from Web
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
              }}>
                <input
                  type="text"
                  placeholder="Search books by title or author..."
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  style={{
                    flex: '1 1 300px',
                    padding: '0.65rem 1rem',
                    background: '#111c34',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.9rem'
                  }}
                />
                <select
                  value={bookCategoryFilter}
                  onChange={(e) => setBookCategoryFilter(e.target.value)}
                  style={{
                    flex: '0 1 200px',
                    padding: '0.65rem 1rem',
                    background: '#111c34',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Books Table */}
              <div style={{
                background: '#111c34',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'hidden'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: '#64748b' }}>
                        <th style={{ padding: '0.9rem 1rem' }}>Cover & Title</th>
                        <th style={{ padding: '0.9rem 1rem' }}>Category</th>
                        <th style={{ padding: '0.9rem 1rem' }}>Rating</th>
                        <th style={{ padding: '0.9rem 1rem' }}>Copies</th>
                        <th style={{ padding: '0.9rem 1rem' }}>Status</th>
                        <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.map((b) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#cbd5e1' }}>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                              {b.cover_image ? (
                                <img
                                  src={b.cover_image}
                                  alt={b.title}
                                  style={{ width: '42px', height: '58px', objectFit: 'cover', borderRadius: '4px', background: '#1e293b' }}
                                />
                              ) : (
                                <div style={{ width: '42px', height: '58px', background: '#1e293b', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                  📖
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: '600', color: '#ffffff' }}>{b.title}</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>by {b.author}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <span style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem'
                            }}>
                              {b.category_name || 'Unassigned'}
                            </span>
                          </td>
                          <td style={{ padding: '0.9rem 1rem', color: '#fbbf24', fontWeight: '600' }}>
                            ★ {b.rating}
                          </td>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <span style={{ fontWeight: '600', color: b.available_copies > 0 ? '#34d399' : '#f87171' }}>
                              {b.available_copies} / {b.total_copies}
                            </span>
                          </td>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <span style={{
                              background: b.is_available ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: b.is_available ? '#34d399' : '#f87171',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              {b.is_available ? 'Available' : 'Unavailable'}
                            </span>
                          </td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                              <button
                                onClick={() => handleOpenEditBook(b)}
                                style={{
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  color: '#ffffff',
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '5px',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteBook(b.id, b.title)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.2)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '5px',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredBooks.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                            No books match the search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB 3: DISCOVER & IMPORT FROM OPEN LIBRARY --- */}
          {activeTab === 'import' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.3rem 0', color: '#ffffff' }}>
                  Discover & Import Books
                </h1>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
                  Search Open Library's public repository of millions of books and import them directly into BookVerse with one click.
                </p>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearchExternal} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', maxWidth: '700px' }}>
                <input
                  type="text"
                  placeholder="Search book title, author, or keyword (e.g. Shakespeare, Dune, Python)..."
                  value={importQuery}
                  onChange={(e) => setImportQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    background: '#111c34',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.95rem'
                  }}
                />
                <button
                  type="submit"
                  disabled={searchingExternal}
                  style={{
                    background: '#c5a059',
                    color: '#0f172a',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {searchingExternal ? 'Searching...' : 'Search'}
                </button>
              </form>

              {/* Results Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem'
              }}>
                {importResults.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: '#111c34',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      {item.cover_image ? (
                        <img
                          src={item.cover_image}
                          alt={item.title}
                          style={{ width: '60px', height: '85px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      ) : (
                        <div style={{ width: '60px', height: '85px', background: '#1e293b', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                          📚
                        </div>
                      )}
                      <div>
                        <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1rem', color: '#ffffff' }}>{item.title}</h4>
                        <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.85rem', color: '#94a3b8' }}>by {item.author}</p>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Published: {item.publication_year || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleImportBook(item)}
                      disabled={importingId === item.id}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        background: importingId === item.id ? '#64748b' : '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor: importingId === item.id ? 'wait' : 'pointer'
                      }}
                    >
                      {importingId === item.id ? 'Importing Book...' : '➕ Import to Catalog'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- TAB 4: CATEGORIES MANAGEMENT --- */}
          {activeTab === 'categories' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.3rem 0', color: '#ffffff' }}>
                  Categories & Genres Management
                </h1>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
                  Create and organize the library genres and collections displayed across the website.
                </p>
              </div>

              {/* Add / Edit Category Card */}
              <div style={{
                background: '#111c34',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#ffffff' }}>
                  {editCatId ? 'Edit Category' : 'Add New Category'}
                </h3>
                <form onSubmit={handleSaveCategory} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 240px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                      Category Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Science Fiction, Biography"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        background: '#090e1a',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ flex: '2 1 320px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Brief overview of books found in this category..."
                      value={catDesc}
                      onChange={(e) => setCatDesc(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        background: '#090e1a',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="submit"
                      style={{
                        background: '#c5a059',
                        color: '#0f172a',
                        border: 'none',
                        padding: '0.65rem 1.25rem',
                        borderRadius: '6px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {editCatId ? 'Save Changes' : 'Create Category'}
                    </button>
                    {editCatId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditCatId(null);
                          setCatName('');
                          setCatDesc('');
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.65rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Categories Table */}
              <div style={{
                background: '#111c34',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: '#64748b' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Category Name</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Description</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Catalog Books</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#cbd5e1' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#ffffff' }}>{c.name}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>{c.description || '—'}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            background: 'rgba(197, 160, 89, 0.15)',
                            color: '#e2ba6a',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: '600',
                            fontSize: '0.8rem'
                          }}>
                            {c.book_count ?? 0} books
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => handleEditCategory(c)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: '#ffffff',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '5px',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c.id, c.name)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '5px',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- TAB 5: USER ACCOUNTS MANAGEMENT --- */}
          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.3rem 0', color: '#ffffff' }}>
                    User Accounts & Security
                  </h1>
                  <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
                    Inspect registered users, manage privileges, and activate or suspend access.
                  </p>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Search users by username or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{
                      width: '280px',
                      padding: '0.65rem 1rem',
                      background: '#111c34',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              {/* Users Table */}
              <div style={{
                background: '#111c34',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: '#64748b' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>User ID</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Username</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Email Address</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#cbd5e1' }}>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>#{u.id}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#ffffff' }}>{u.username}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>{u.email}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            background: u.role === 'admin' ? 'rgba(197, 160, 89, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                            color: u.role === 'admin' ? '#e2ba6a' : '#60a5fa',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            textTransform: 'uppercase'
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            background: u.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: u.is_active ? '#34d399' : '#f87171',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {u.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          {u.role !== 'admin' ? (
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              style={{
                                background: u.is_active ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                color: u.is_active ? '#f87171' : '#34d399',
                                border: 'none',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '5px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
                              Protected
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- TAB 6: BORROW & RETURN MANAGEMENT --- */}
          {activeTab === 'transactions' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.3rem 0', color: '#ffffff' }}>
                  Borrow & Circulation Records
                </h1>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
                  Monitor book loans, track overdue items, and manually log returned copies.
                </p>
              </div>

              {/* Transactions Table */}
              <div style={{
                background: '#111c34',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: '#64748b' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>User</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Book Title</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Borrow Date</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Return Date</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#cbd5e1' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#ffffff' }}>{t.user_name}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>{t.book_title}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>
                          {new Date(t.borrow_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>
                          {t.return_date ? new Date(t.return_date).toLocaleDateString() : 'Active Loan'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            background: t.status === 'returned' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: t.status === 'returned' ? '#34d399' : '#fbbf24',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          {t.status === 'borrowed' && (
                            <button
                              onClick={() => handleUpdateTransaction(t.id, 'returned')}
                              style={{
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '5px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Mark Returned
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                          No borrow records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- ADD / EDIT BOOK MODAL --- */}
      {showBookModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000,
          animation: 'adminFadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#111c34',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#ffffff' }}>
                {bookForm.id ? 'Edit Book Content' : 'Add New Book to Collection'}
              </h2>
              <button
                onClick={() => setShowBookModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBook} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookForm.title}
                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#090e1a',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    Author *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#090e1a',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    Category *
                  </label>
                  <select
                    required
                    value={bookForm.category_id}
                    onChange={(e) => setBookForm({ ...bookForm, category_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#090e1a',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select a Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    Publication Year
                  </label>
                  <input
                    type="number"
                    value={bookForm.publication_year}
                    onChange={(e) => setBookForm({ ...bookForm, publication_year: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#090e1a',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    Rating (0 - 5.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={bookForm.rating}
                    onChange={(e) => setBookForm({ ...bookForm, rating: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#090e1a',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    Total Inventory Copies *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={bookForm.total_copies}
                    onChange={(e) => setBookForm({ ...bookForm, total_copies: parseInt(e.target.value) || 1 })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#090e1a',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Cover Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... or https://covers.openlibrary.org/..."
                  value={bookForm.cover_image}
                  onChange={(e) => setBookForm({ ...bookForm, cover_image: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#090e1a',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                />
                {bookForm.cover_image && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={bookForm.cover_image}
                      alt="Cover Preview"
                      style={{ height: '70px', borderRadius: '4px', objectFit: 'cover' }}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cover Image Preview</span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Online Reading Link (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://www.gutenberg.org/ebooks/... or https://openlibrary.org/..."
                  value={bookForm.read_link}
                  onChange={(e) => setBookForm({ ...bookForm, read_link: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#090e1a',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Description / Synopsis
                </label>
                <textarea
                  rows="3"
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  placeholder="Enter a detailed book description..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#090e1a',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.7rem 1.25rem',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#c5a059',
                    color: '#0f172a',
                    border: 'none',
                    padding: '0.7rem 1.75rem',
                    borderRadius: '6px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {bookForm.id ? 'Save Book Changes' : 'Create Book Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes adminFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes adminSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
