import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const DEFAULT_THEME = {
  primary: '#0A2A1E',
  isDarkMode: false
};

// Helper to darken a hex color (crude approach, sufficient for UI)
const shadeColor = (color, percent) => {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    R = (R>0)?R:0;
    G = (G>0)?G:0;
    B = (B>0)?B:0;

    let RR = ((R.toString(16).length===1)?"0"+R.toString(16):R.toString(16));
    let GG = ((G.toString(16).length===1)?"0"+G.toString(16):G.toString(16));
    let BB = ((B.toString(16).length===1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
};

export const ThemeProvider = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_THEME.primary);
  const [isDarkMode, setIsDarkMode] = useState(DEFAULT_THEME.isDarkMode);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedPrimary = localStorage.getItem('theme-primary');
    const savedMode = localStorage.getItem('theme-mode');
    
    if (savedPrimary) setPrimaryColor(savedPrimary);
    if (savedMode) setIsDarkMode(savedMode === 'dark');
  }, []);

  // Apply theme when state changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Save to local storage
    localStorage.setItem('theme-primary', primaryColor);
    localStorage.setItem('theme-mode', isDarkMode ? 'dark' : 'light');

    // Set Primary Colors
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--primary-light', shadeColor(primaryColor, 20)); // lighter
    root.style.setProperty('--primary-dark', shadeColor(primaryColor, -40)); // darker

    // Set Background & Text Colors based on mode
    if (isDarkMode) {
      root.style.setProperty('--background', '#121212');
      root.style.setProperty('--surface', '#1E1E1E');
      root.style.setProperty('--text-main', '#E0E0E0');
      root.style.setProperty('--text-muted', '#999999');
      root.style.setProperty('--border', '#333333');
    } else {
      root.style.setProperty('--background', '#F9F9F6');
      root.style.setProperty('--surface', '#FFFFFF');
      root.style.setProperty('--text-main', '#333333');
      root.style.setProperty('--text-muted', '#666666');
      root.style.setProperty('--border', '#E5E7EB');
    }
  }, [primaryColor, isDarkMode]);

  const resetTheme = () => {
    setPrimaryColor(DEFAULT_THEME.primary);
    setIsDarkMode(DEFAULT_THEME.isDarkMode);
  };

  const toggleCustomizer = () => setIsCustomizerOpen(!isCustomizerOpen);

  return (
    <ThemeContext.Provider value={{
      primaryColor,
      setPrimaryColor,
      isDarkMode,
      setIsDarkMode,
      resetTheme,
      isCustomizerOpen,
      toggleCustomizer,
      closeCustomizer: () => setIsCustomizerOpen(false)
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
