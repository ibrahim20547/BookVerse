import React from 'react';
import { useTheme } from '../context/ThemeContext';

const PRESET_COLORS = [
  { name: 'Forest Green', hex: '#0A2A1E' },
  { name: 'Classic Navy', hex: '#1C2841' },
  { name: 'Burgundy', hex: '#4A0404' },
  { name: 'Mahogany Brown', hex: '#4E2F2D' },
  { name: 'Slate Grey', hex: '#36454F' },
  { name: 'Vintage Sepia', hex: '#704214' },
  { name: 'Royal Purple', hex: '#3B1F4C' },
  { name: 'Library Bronze', hex: '#634731' },
  { name: 'Deep Teal', hex: '#134E4A' },
  { name: 'Oxford Blue', hex: '#002147' },
  { name: 'Warm Crimson', hex: '#7F1D1D' },
  { name: 'Midnight', hex: '#0F172A' }
];

const ThemeCustomizer = () => {
  const { 
    primaryColor, 
    setPrimaryColor, 
    isDarkMode, 
    setIsDarkMode, 
    resetTheme, 
    isCustomizerOpen, 
    closeCustomizer 
  } = useTheme();

  if (!isCustomizerOpen) return null;

  return (
    <>
      <div 
        style={{ 
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 
        }} 
        onClick={closeCustomizer}
      />
      <div 
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '320px', 
          backgroundColor: 'var(--surface)', boxShadow: '-4px 0 15px rgba(0,0,0,0.1)', 
          zIndex: 1000, padding: '2rem', overflowY: 'auto',
          borderLeft: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Customize Theme</h2>
          <button 
            onClick={closeCustomizer}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-main)' }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Theme Mode</h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className={`btn ${!isDarkMode ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1 }}
              onClick={() => setIsDarkMode(false)}
            >
              Light
            </button>
            <button 
              className={`btn ${isDarkMode ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1 }}
              onClick={() => setIsDarkMode(true)}
            >
              Dark
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Preset Colors</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
            {PRESET_COLORS.map(color => (
              <button
                key={color.name}
                title={color.name}
                onClick={() => setPrimaryColor(color.hex)}
                style={{
                  width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                  backgroundColor: color.hex, cursor: 'pointer',
                  outline: primaryColor === color.hex ? '3px solid var(--accent)' : 'none',
                  outlineOffset: '2px', transition: 'all 0.2s'
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Custom Color Picker</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input 
              type="color" 
              value={primaryColor} 
              onChange={(e) => setPrimaryColor(e.target.value)}
              style={{ width: '50px', height: '50px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
            />
            <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--text-main)' }}>{primaryColor.toUpperCase()}</span>
          </div>
        </div>

        <div style={{ marginTop: '3rem' }}>
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', borderColor: '#ef4444', color: '#ef4444' }}
            onClick={resetTheme}
          >
            Reset to Default
          </button>
        </div>
      </div>
    </>
  );
};

export default ThemeCustomizer;
