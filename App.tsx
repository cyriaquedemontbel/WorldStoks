import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomePage from './components/pages/HomePage';
import DashboardPage from './components/pages/DashboardPage';
import DailyMarketsPage from './components/pages/DailyMarketsPage';
import ExtremeEventsPage from './components/pages/ExtremeEventsPage';
import BettingPage from './components/pages/BettingPage';
import HowItWorksPage from './components/pages/HowItWorksPage';
import LoginPage from './components/pages/LoginPage';
import SignUpPage from './components/pages/SignUpPage';
import SettingsPage from './components/pages/SettingsPage';
import MyBetsPage from './components/pages/MyBetsPage';
import AdminPage from './components/pages/AdminPage'; // Import AdminPage
import LiveBettingPage from './components/pages/LiveBettingPage';
import HeadToHeadPage from './components/pages/HeadToHeadPage';
import ToastContainer from './components/ToastContainer';
import { Page, DailyMarket, User, Toast } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('Home');
  const [selectedMarket, setSelectedMarket] = useState<DailyMarket | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Basic session management using localStorage
    const storedUser = localStorage.getItem('skybet_user');
    if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, 5000);
  };

  const handleLogin = (user: User) => {
    localStorage.setItem('skybet_user', JSON.stringify(user));
    setCurrentUser(user);
    setCurrentPage('Home');
    addToast(`Welcome back, ${user.username}!`);
  };

  const handleSignUp = (user: User) => {
    localStorage.setItem('skybet_user', JSON.stringify(user));
    setCurrentUser(user);
    setCurrentPage('Home');
    addToast('Account created successfully. Welcome!');
  };

  const handleLogout = () => {
    localStorage.removeItem('skybet_user');
    setCurrentUser(null);
    setCurrentPage('Home');
    addToast('You have been logged out.');
  };

  const handleUpdateUser = (user: User) => {
    localStorage.setItem('skybet_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const renderPage = () => {
    // Admin Page Security Check
    if (currentPage === 'Admin' && (!currentUser || !currentUser.isAdmin)) {
        setCurrentPage('Home');
        return <HomePage navigateTo={setCurrentPage} setSelectedMarket={setSelectedMarket} currentUser={currentUser} />;
    }

    switch (currentPage) {
      case 'Home':
        return currentUser 
            ? <DashboardPage user={currentUser} navigateTo={setCurrentPage} setSelectedMarket={setSelectedMarket} />
            : <HomePage navigateTo={setCurrentPage} setSelectedMarket={setSelectedMarket} currentUser={currentUser} />;
      case 'DailyMarkets':
        return <DailyMarketsPage navigateTo={setCurrentPage} setSelectedMarket={setSelectedMarket} currentUser={currentUser} />;
      case 'LiveBetting':
        return <LiveBettingPage navigateTo={setCurrentPage} setSelectedMarket={setSelectedMarket} currentUser={currentUser} />;
      case 'HeadToHead':
        return <HeadToHeadPage navigateTo={setCurrentPage} setSelectedMarket={setSelectedMarket} currentUser={currentUser} />;
      case 'ExtremeEvents':
        return <ExtremeEventsPage navigateTo={setCurrentPage} setSelectedMarket={setSelectedMarket} currentUser={currentUser} />;
      case 'Betting':
        if (!selectedMarket) {
          setCurrentPage('DailyMarkets'); // Redirect if no market is selected
          return null;
        }
        return <BettingPage market={selectedMarket} user={currentUser} navigateTo={setCurrentPage} updateUser={handleUpdateUser} addToast={addToast} />;
      case 'HowItWorks':
        return <HowItWorksPage navigateTo={setCurrentPage} />;
      case 'MyBets':
        return <MyBetsPage user={currentUser} updateUser={handleUpdateUser} navigateTo={setCurrentPage} />;
      case 'Login':
        return <LoginPage onLogin={handleLogin} navigateTo={setCurrentPage} addToast={addToast} />;
      case 'SignUp':
        return <SignUpPage onSignUp={handleSignUp} navigateTo={setCurrentPage} addToast={addToast} />;
      case 'Settings':
        return <SettingsPage user={currentUser} updateUser={handleUpdateUser} navigateTo={setCurrentPage} onLogout={handleLogout} addToast={addToast} />;
      case 'Admin':
        return <AdminPage user={currentUser} />;
      default:
        return <HomePage navigateTo={setCurrentPage} setSelectedMarket={setSelectedMarket} currentUser={currentUser} />;
    }
  };

  return (
    <div className="bg-background dark:bg-background-dark text-text-primary dark:text-text-primary-dark min-h-screen font-sans transition-colors">
      <ToastContainer toasts={toasts} setToasts={setToasts} />
      <Header currentPage={currentPage} navigateTo={setCurrentPage} user={currentUser} onLogout={handleLogout} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {renderPage()}
      </main>
      <footer className="text-center py-6 border-t border-border-color dark:border-border-color-dark mt-16">
        <p className="text-sm text-text-secondary dark:text-text-secondary-dark">&copy; {new Date().getFullYear()} SkyBet. All rights reserved. For entertainment purposes only.</p>
      </footer>
    </div>
  );
}

export default App;