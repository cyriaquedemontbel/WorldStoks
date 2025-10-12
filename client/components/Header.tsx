import React from 'react';
import { User, Page } from '../types';
import { Logo } from './Logo';
import { text } from 'stream/consumers';

interface HeaderProps {
    user: User;
    currentPage: Page;
    onNavigate: (page: Page) => void;
    onLogout: () => void;
}

export const Header = ({ user, currentPage, onNavigate, onLogout }: HeaderProps) => {
    const guestNav: { page: Page; label: string }[] = [
        { page: 'home', label: 'Marchés' },
        { page: 'about', label: 'À Propos' },
    ];

    const userNav: { page: Page; label: string }[] = [
        { page: 'home', label: 'Accueil' },
        { page: 'portfolio', label: 'Portefeuille' },
        { page: 'history', label: 'Historique' },
        { page: 'about', label: 'À Propos' },
    ];

    const adminNav: { page: Page; label: string }[] = [
        { page: 'home', label: 'Marchés' },
        { page: 'admin', label: 'Gestion' },
    ];

    const navItems: { page: Page; label: string }[] = user.isLoggedIn
        ? (user.isAdmin ? adminNav : userNav)
        : guestNav;

    return (
        <header className="main-header">
            <div className="header-content">
                <Logo onClick={() => onNavigate('home')} />

                <nav className="main-nav">
                    <ul>
                        {navItems.map(item => (
                            <li key={item.page}>
                                <button
                                    onClick={() => onNavigate(item.page)}
                                    className={currentPage === item.page ? 'active' : ''}
                                    aria-current={currentPage === item.page ? 'page' : undefined}
                                >
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

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
                                    color : 'white',
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

                            <button className="btn btn--secondary" onClick={onLogout}>Déconnexion</button>
                        </>
                    ) : (
                        <button className="btn btn--primary" onClick={() => onNavigate('login')}>Connexion</button>
                    )}
                </div>
            </div>
        </header>
    );
};
