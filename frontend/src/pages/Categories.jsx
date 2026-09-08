import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const safeCategories = Array.isArray(categories) ? categories : [];

  return (
    <div>
      <section className="text-center mb-4">
        <h2>Explore by Category</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
          Browse our collections curated by genre and topic.
        </p>
      </section>

      <div className="grid-3">
        {safeCategories.map(cat => (
          <div 
            key={cat.id} 
            className="card" 
            style={{ cursor: 'pointer', textAlign: 'center', padding: '3rem 1.5rem' }}
            onClick={() => navigate(`/books?category_id=${cat.id}`)}
          >
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>{cat.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{cat.description}</p>
            <div style={{ marginTop: '1.5rem', color: 'var(--accent)', fontWeight: 'bold' }}>
              View Books →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
