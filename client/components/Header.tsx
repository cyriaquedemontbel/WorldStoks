import React from 'react';
import { User, Page } from '../types';
import { Logo } from './Logo';

interface HeaderProps {
    user: User;
    currentPage: Page;
    onNavigate: (page: Page) => void;
    onLogout: () => void;
}

export const Header = ({ user, currentPage, onNavigate, onLogout }: HeaderProps) => {
    // Navigation items for guests
    const guestNavItems: { page: Page; label: string; }[] = [
        { page: 'home', label: 'Marchés' },
        { page: 'about', label: 'À Propos' },
    ];

    // Navigation items for regular logged-in users
    const userNavItems: { page: Page; label: string; }[] = [
        { page: 'home', label: 'Accueil' },
        { page: 'portfolio', label: 'Portefeuille' },
        { page: 'history', label: 'Historique' },
        { page: 'about', label: 'À Propos' },
    ];

    // Navigation items for admin users
    const adminNavItems: { page: Page; label: string; }[] = [
        { page: 'home', label: 'Marchés' },
        { page: 'admin', label: 'Gestion' },
    ];

    let finalNavItems: { page: Page; label: string; }[];

    if (user.isLoggedIn) {
        if (user.isAdmin) {
            finalNavItems = adminNavItems;
        } else {
            finalNavItems = userNavItems;
        }
    } else {
        finalNavItems = guestNavItems;
    }

    return (
        <header className="main-header">
            <div className="header-content">
                <Logo onClick={() => onNavigate('home')} />
                <nav className="main-nav">
                    <ul>
                        {finalNavItems.map(item => (
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
                                <span className="user-email">{user.email}</span>
                                <button 
                                    className={`user-cash-btn ${currentPage === 'funds' ? 'active' : ''}`}
                                    onClick={() => onNavigate('funds')}
                                    aria-label="Gérer mes fonds"
                                >
                                    <span className="user-cash">{user.cash.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</span>
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