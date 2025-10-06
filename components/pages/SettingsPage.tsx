import React, { useState, useEffect } from 'react';
import { User, Page } from '../../types';
import AddFundsModal from '../AddFundsModal';

interface SettingsPageProps {
  user: User | null;
  updateUser: (user: User) => void;
  navigateTo: (page: Page) => void;
  onLogout: () => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, updateUser, navigateTo, onLogout, addToast }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (!user) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
        <p className="mb-6">You need to be logged in to view settings.</p>
        <button onClick={() => navigateTo('Login')} className="bg-primary text-white font-bold py-2 px-6 rounded-lg">
          Log In
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="animate-fade-in max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-text-primary dark:text-text-primary-dark mb-8">Settings</h1>
        <div className="space-y-8">
          {/* Account Info */}
          <div className="bg-surface dark:bg-surface-dark p-6 rounded-xl shadow-lg border border-border-color/50 dark:border-border-color-dark/50">
            <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-4">Account Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary dark:text-text-secondary-dark">Username</span>
                <span className="font-medium text-text-primary dark:text-text-primary-dark">{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary dark:text-text-secondary-dark">Email</span>
                <span className="font-medium text-text-primary dark:text-text-primary-dark">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="bg-surface dark:bg-surface-dark p-6 rounded-xl shadow-lg border border-border-color/50 dark:border-border-color-dark/50">
            <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-4">Balance</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary dark:text-text-secondary-dark">Current Balance</p>
                <p className="text-3xl font-bold text-primary dark:text-primary-dark">${user.balance.toFixed(2)}</p>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">
                Add Funds
              </button>
            </div>
          </div>
          
          {/* Theme */}
          <div className="bg-surface dark:bg-surface-dark p-6 rounded-xl shadow-lg border border-border-color/50 dark:border-border-color-dark/50">
            <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-4">Appearance</h2>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary dark:text-text-secondary-dark">Dark Mode</span>
              <button onClick={toggleDarkMode} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-primary' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          
          {/* Logout */}
           <div className="text-center mt-8">
                <button onClick={onLogout} className="text-red-600 dark:text-red-400 hover:underline font-semibold">
                    Log Out
                </button>
            </div>
        </div>
      </div>
      {isModalOpen && (
        <AddFundsModal
          user={user}
          onClose={() => setIsModalOpen(false)}
          updateUser={updateUser}
          addToast={addToast}
        />
      )}
    </>
  );
};

export default SettingsPage;
