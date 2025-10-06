import React, { useState } from 'react';
import { User, Page } from '../../types';
import { login } from '../../services/userService';

interface LoginPageProps {
  onLogin: (user: User) => void;
  navigateTo: (page: Page) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, navigateTo, addToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(email, password);
      onLogin(user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="bg-surface dark:bg-surface-dark p-8 rounded-2xl shadow-2xl border border-border-color/50 dark:border-border-color-dark/50">
          <h2 className="text-3xl font-bold text-center text-text-primary dark:text-text-primary-dark mb-2">Welcome Back!</h2>
          <p className="text-center text-text-secondary dark:text-text-secondary-dark mb-8">Log in to your SkyBet account.</p>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="hidden bg-red-100/50 dark:bg-red-900/20 border border-red-300 dark:border-red-500/30 text-red-800 dark:text-red-300 p-3 rounded-lg text-center text-sm">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-border-color dark:border-border-color-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-border-color dark:border-border-color-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-slate-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Log In'}
              </button>
            </div>
          </form>
        </div>
        <p className="text-center mt-6 text-text-secondary dark:text-text-secondary-dark">
            Don't have an account? <button onClick={() => navigateTo('SignUp')} className="font-medium text-primary hover:text-primary-dark bg-transparent border-none p-0 disabled:text-slate-400" disabled={isLoading}>Sign up here.</button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
