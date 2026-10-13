import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const loc = useLocation();

  const isActive = (path) => {
    if (path === '/') return loc.pathname === '/';
    return loc.pathname === path || loc.pathname.startsWith(path + '/');
  };

  const linkStyle = (path) => ({
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    color: isActive(path) ? '#8B5CF6' : '#94A3B8',
    borderBottom: isActive(path) ? '2px solid #8B5CF6' : 'none',
    paddingBottom: '4px',
  });

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '16px 24px',
        backgroundColor: '#1E293B',
        alignItems: 'center',
      }}
    >
      <div style={{ fontWeight: 'bold', color: '#FFF' }}>⚡ IT ADIS</div>
      <div style={{ display: 'flex', gap: '15px' }}>
        <Link to="/" style={linkStyle('/')}>
          🏠 Урок
        </Link>
        <Link to="/leaderboard" style={linkStyle('/leaderboard')}>
          🏆 Топ
        </Link>
        <Link to="/shop" style={linkStyle('/shop')}>
          🛍️ Магазин
        </Link>
        <Link to="/video" style={linkStyle('/video')}>
          🎥 Видео
        </Link>
        <Link to="/teacher" style={{ ...linkStyle('/teacher'), color: '#FACC15' }}>
          👨‍🏫 Учитель
        </Link>
      </div>
    </nav>
  );
}