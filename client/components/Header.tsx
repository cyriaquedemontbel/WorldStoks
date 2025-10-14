import React from 'react';
import { User, Page } from '../types';
import { Logo } from './Logo';

interface HeaderProps {
  user: User;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, currentPage, onNavigate, onLogout }) => {
  // Définition des items de navigation selon le type d'utilisateur
  const guestNav: { page: Page; label: string }[] = [
    { page: 'home', label: 'Marchés' },
    { page: 'about', label: 'À Propos' },
  ];

  const userNav: { page: Page; label: string }[] = [
    { page: 'home', label: 'Accueil' },
    { page: 'portfolio', label: 'Portefeuille' },
    { page: 'orderbook', label: "Carnet d'ordres" },
    { page: 'about', label: 'À Propos' },
  ];

  const adminNav: { page: Page | 'admin-orders'; label: string }[] = [
    { page: 'home', label: 'Marchés' },
    { page: 'admin', label: 'Gestion' },
    { page: 'admin-orders', label: 'Ordres Admin' },
  ];

  const navItems: { page: Page | 'admin-orders'; label: string }[] = user.isLoggedIn
    ? user.isAdmin
      ? adminNav
      : userNav
    : guestNav;

  return (
    <header className="main-header">
      <div className="header-content">
        {/* Logo cliquable qui ramène à l'accueil */}
        <Logo onClick={() => onNavigate('home')} />

        {/* Menu de navigation */}
        <nav className="main-nav">
          <ul>
            {navItems.map(item => (
              <li key={item.page}>
                {item.page === 'orderbook' ? (
                  <button
                    onClick={() => onNavigate('orderbook', 'AAPL')}
                    className={currentPage === item.page ? 'active' : ''}
                    aria-current={currentPage === item.page ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                ) : item.page === 'admin-orders' ? (
                  <button
                    onClick={() => onNavigate('admin-orders')}
                    className={currentPage === item.page ? 'active' : ''}
                    aria-current={currentPage === item.page ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate(item.page as any)}
                    className={currentPage === item.page ? 'active' : ''}
                    aria-current={currentPage === item.page ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Actions utilisateur */}
        <div className="user-actions">
          {user.isLoggedIn ? (
            <>
              <div className="user-info">
                <button
                  className="user-pseudo-btn"
                  onClick={() => onNavigate('settings')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {user.username || user.email}
                </button>
                <button
                  className={`user-cash-btn ${currentPage === 'funds' ? 'active' : ''}`}
                  onClick={() => onNavigate('funds')}
                  aria-label="Gérer mes fonds"
                >
                  {user.cash != null
                    ? user.cash.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })
                    : '$0.00'}
                </button>
              </div>

              <button className="btn btn--secondary" onClick={onLogout}>
                Déconnexion
              </button>
            </>
          ) : (
            <button className="btn btn--primary" onClick={() => onNavigate('login')}>
              Connexion
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
