import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'ws_theme_pref';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'default' | 'alt'>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === 'alt' ? 'alt' : 'default';
    } catch {
      return 'default';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme === 'alt' ? 'alt' : 'default');
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <label style={{ color: '#fff', fontSize: 12 }}>Thème</label>
      <button
        onClick={() => setTheme(t => (t === 'default' ? 'alt' : 'default'))}
        aria-pressed={theme === 'alt'}
        title="Basculer le thème"
        style={{
          padding: '6px 10px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)',
          background: theme === 'alt' ? '#0ea5a4' : 'transparent',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        {theme === 'alt' ? 'Neutre' : 'Actuel'}
      </button>
    </div>
  );
}
