import React, { useState, useEffect } from 'react';
import { Page, User } from '../types';
import Logo from './Logo';

interface HeaderProps {
  currentPage: Page;
  navigateTo: (page: Page) => void;
  user: User | null;
  onLogout: () => void;
}

const NavLink: React.FC<{
  page: Page;
  currentPage: Page;
  navigateTo: (page: Page) => void;
  children: React.ReactNode;
  isMobile?: boolean;
  onClick?: () => void;
}> = ({ page, currentPage, navigateTo, children, isMobile = false, onClick }) => {
  const isActive = currentPage === page;
  const baseClasses = "font-semibold transition-colors duration-200";
  const activeClasses = "text-primary dark:text-primary-dark";
  const inactiveClasses = "text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark";
  const mobileClasses = "block py-3 px-4 text-lg";
  const desktopClasses = "px-4 py-2";

  return (
    <button
      onClick={() => {
        navigateTo(page);
        if (onClick) onClick();
      }}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${isMobile ? mobileClasses : desktopClasses}`}
    >
      {children}
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ currentPage, navigateTo, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup function to reset overflow when component unmounts
    return () => {
        document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const navLinks = [
    { page: 'DailyMarkets' as Page, label: 'Daily Markets' },
    { page: 'LiveBetting' as Page, label: 'Live Betting' },
    { page: 'HeadToHead' as Page, label: 'Head-to-Head' },
    { page: 'ExtremeEvents' as Page, label: 'Extreme Events' },
    { page: 'HowItWorks' as Page, label: 'How It Works' },
  ];

  const handleMobileMenuClose = () => setIsMobileMenuOpen(false);

  const renderNavLinks = (isMobile: boolean) => (
    <>
      {navLinks.map(link => (
        <NavLink key={link.page} page={link.page} currentPage={currentPage} navigateTo={navigateTo} isMobile={isMobile} onClick={handleMobileMenuClose}>
          {link.label}
        </NavLink>
      ))}
    </>
  );

  const renderUserActions = (isMobile: boolean) => (
    <div className={`flex items-center gap-2 ${isMobile ? 'flex-col w-full p-4' : ''}`}>
      {user ? (
        <>
          {user.isAdmin && (
            <NavLink page="Admin" currentPage={currentPage} navigateTo={navigateTo} isMobile={isMobile} onClick={handleMobileMenuClose}>Admin</NavLink>
          )}
          <NavLink page="MyBets" currentPage={currentPage} navigateTo={navigateTo} isMobile={isMobile} onClick={handleMobileMenuClose}>My Bets</NavLink>
          <NavLink page="Settings" currentPage={currentPage} navigateTo={navigateTo} isMobile={isMobile} onClick={handleMobileMenuClose}>
             <div className="flex items-center gap-2">
                <span>{user.username}</span>
                <span className="text-xs font-normal opacity-75">${user.balance.toFixed(2)}</span>
            </div>
          </NavLink>
          {!isMobile && <div className="h-6 w-px bg-border-color dark:bg-border-color-dark"></div>}
          <button onClick={() => { onLogout(); handleMobileMenuClose(); }} className={`${isMobile ? 'w-full py-3' : 'px-4 py-2'}font-semibold text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark`}>Logout</button>
        </>
      ) : (
        <>
          <button onClick={() => { navigateTo('Login'); handleMobileMenuClose(); }} className={`px-4 py-2 rounded-lg font-bold transition-colors ${isMobile ? 'w-full bg-slate-200 dark:bg-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Log In</button>
          <button onClick={() => { navigateTo('SignUp'); handleMobileMenuClose(); }} className={`px-4 py-2 rounded-lg font-bold text-white transition-colors bg-primary hover:bg-primary-dark ${isMobile ? 'w-full' : ''}`}>Sign Up</button>
        </>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-lg border-b border-border-color dark:border-border-color-dark">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Home link */}
          <div className="flex-shrink-0">
            <button onClick={() => navigateTo('Home')} className="flex items-center gap-2 text-xl font-bold">
              <Logo className="h-8 w-auto" />
              <span className="text-text-primary dark:text-text-primary-dark">SkyBet</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex lg:items-center lg:gap-2">
            {renderNavLinks(false)}
          </nav>

          {/* Desktop User Actions */}
          <div className="hidden lg:flex lg:items-center">
            {renderUserActions(false)}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md text-text-secondary dark:text-text-secondary-dark hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none">
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 top-20 bg-surface dark:bg-surface-dark animate-fade-in-fast">
          <div className="pt-2 pb-3 space-y-1 flex flex-col items-center">
            {renderNavLinks(true)}
            <div className="w-full px-4"><hr className="border-border-color dark:border-border-color-dark my-4" /></div>
            {renderUserActions(true)}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
