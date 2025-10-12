import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { StockDetailPage } from './pages/StockDetailPage';
import { LoginPage } from './pages/LoginPage';
import { AboutPage } from './pages/AboutPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { HistoryPage } from './pages/HistoryPage';
import { FundsPage } from './pages/FundsPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import { TradeModal } from './components/TradeModal';
import * as api from './api';
import { Stock, User, Page, Transaction } from './types';


const guestUser: User = {
  isLoggedIn: false,
  isAdmin: false,
  email: '',
  username: '',
  firstName: '',
  lastName: '',
  birthDate: '',
  gender: '',
  consent: false,
  cash: 0,
  portfolio: {},
};


type TradeModalState = {
  isOpen: boolean;
  stock: Stock | null;
  type: 'buy' | 'sell' | null;
};

export const App: React.FC = () => {
  const [user, setUser] = useState<User>(guestUser);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [tradeModalState, setTradeModalState] = useState<TradeModalState>({ isOpen: false, stock: null, type: null });

  const showMessage = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  // ===================================
  // Charger stocks + user + portfolio
  // ===================================
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const stocksData = (await api.apiFetchStocks())?.filter(Boolean) ?? [];
        const userData = await api.apiFetchUserData();
        let historyData: Transaction[] = [];
        if (userData) {
          setUser({
            ...userData,
            isLoggedIn: true,
            isAdmin: userData.isAdmin ?? false,
            cash: userData.cash ?? 0,
            portfolio: userData.portfolio ?? {},
          });
          historyData = await api.apiFetchHistory().catch(() => []);
        }
        setStocks(stocksData);
        setHistory(historyData.filter(Boolean));
      } catch (err) {
        showMessage(err instanceof Error ? err.message : 'Erreur de chargement des données.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // ===================================
  // Auth
  // ===================================
const handleLogin = async (email: string, pass: string) => {
  try {
    const { token, user: userData } = await api.apiLogin(email, pass);
    localStorage.setItem('authToken', token);

    setUser({
      ...userData,
      isLoggedIn: true,
      isAdmin: userData.isAdmin ?? false,
      cash: userData.cash ?? 0,
      portfolio: userData.portfolio ?? {},
    });

    const historyData = await api.apiFetchHistory();
    setHistory(historyData.filter(Boolean));

    setCurrentPage(userData.isAdmin ? 'admin' : 'home');
    showMessage(`Bienvenue, ${userData.email} !`);
  } catch (err) {
    showMessage(err instanceof Error ? err.message : 'Erreur de connexion.');
  }
};

const handleSignUp = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  birthDate: string;
  gender?: string;
  consent: boolean;
}) => {
  try {
    // Appel à l'API avec tous les champs
    const { token, user: userData } = await api.apiSignUp(data);
    localStorage.setItem('authToken', token);

    setUser({
      ...userData,
      isLoggedIn: true,
      isAdmin: userData.isAdmin ?? false,
      cash: userData.cash ?? 0,
      portfolio: userData.portfolio ?? {},
    });

    const historyData = await api.apiFetchHistory();
    setHistory(historyData.filter(Boolean));

    setCurrentPage(userData.isAdmin ? 'admin' : 'home');
    showMessage('Inscription réussie !');
  } catch (err) {
    showMessage(err instanceof Error ? err.message : "Erreur d'inscription.");
  }
};


  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(guestUser);
    setHistory([]);
    setCurrentPage('home');
  };

  // ===================================
  // Navigation
  // ===================================
  const handleNavigate = (page: Page, ticker?: string) => {
    setSelectedTicker(page === 'detail' ? ticker || null : null);
    setCurrentPage(page);
  };

  const handleStockSelect = (ticker: string) => {
    setSelectedTicker(ticker);
    setCurrentPage('detail');
  };

  const updateStockInState = useCallback((updatedStock: Stock) => {
    setStocks(prev => prev.map(s => s?.ticker === updatedStock?.ticker ? updatedStock : s));
  }, []);

  // ===================================
  // Trading
  // ===================================
  const handleTrade = async (
    tradeFn: () => Promise<{ success: boolean; user: User; stock: Stock; portfolio?: Record<string, { quantity: number; price: number }> }>,
    successMsg: string
  ) => {
    try {
      const res = await tradeFn();
      if (!res.success) {
        showMessage('Transaction échouée.');
        return;
      }

      const updatedUserData = await api.apiFetchUserData();
      if (!updatedUserData) throw new Error('Impossible de récupérer les données utilisateur');

      setUser({
        ...updatedUserData,
        isLoggedIn: true,
        isAdmin: updatedUserData.isAdmin ?? false,
        cash: updatedUserData.cash ?? 0,
        portfolio: updatedUserData.portfolio ?? {},
      });

      if (res.stock) updateStockInState(res.stock);

      const historyData = await api.apiFetchHistory();
      setHistory(historyData.filter(Boolean));

      showMessage(successMsg);
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Erreur de transaction.');
    } finally {
      handleCloseTradeModal();
    }
  };

  const handleBuyStock = (ticker: string, quantity: number) =>
    handleTrade(() => api.apiBuyStock(ticker, quantity), `${quantity} action(s) de ${ticker} achetée(s) !`);

  const handleSellStock = (ticker: string, quantity: number) =>
    handleTrade(() => api.apiSellStock(ticker, quantity), `${quantity} action(s) de ${ticker} vendue(s) !`);

  const handleOpenTradeModal = (stock: Stock, type: 'buy' | 'sell') =>
    setTradeModalState({ isOpen: true, stock, type });

  const handleCloseTradeModal = () =>
    setTradeModalState({ isOpen: false, stock: null, type: null });

  const handleConfirmTrade = (ticker: string, quantity: number) => {
    if (tradeModalState.type === 'buy') handleBuyStock(ticker, quantity);
    else if (tradeModalState.type === 'sell') handleSellStock(ticker, quantity);
  };

  // ===================================
  // Admin / Stock management
  // ===================================
  const handleAddStock = async (stock: Stock) => {
    try {
      const newStock = await api.apiAddStock(stock);
      setStocks(prev => [...prev, newStock].filter(Boolean));
      showMessage(`Action ${stock.ticker} ajoutée.`);
      return true;
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Erreur d'ajout.");
      return false;
    }
  };

  const handleUpdateStock = async (stock: Stock) => {
    try {
      const updatedStock = await api.apiUpdateStock(stock);
      updateStockInState(updatedStock);
      showMessage(`Action ${stock.ticker} mise à jour.`);
      return true;
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Erreur de mise à jour.');
      return false;
    }
  };

  const handleDeleteStock = async (ticker: string) => {
    try {
      await api.apiDeleteStock(ticker);
      setStocks(prev => prev.filter(s => s?.ticker !== ticker));
      showMessage(`Action ${ticker} supprimée.`);
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Erreur de suppression.');
    }
  };

  const handleUpdateFunds = async (amount: number, type: 'deposit' | 'withdraw') => {
    try {
      await api.apiUpdateFunds(amount, type);
      const updatedUser = await api.apiFetchUserData();
      if (!updatedUser) throw new Error('Impossible de récupérer les données utilisateur');
      setUser({
        ...updatedUser,
        isLoggedIn: true,
        cash: updatedUser.cash ?? 0,
        isAdmin: updatedUser.isAdmin ?? false,
        portfolio: updatedUser.portfolio ?? {},
      });
      return `${amount.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })} ${type === 'deposit' ? 'déposés' : 'retirés'} !`;
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Erreur mise à jour fonds.');
      return '';
    }
  };

  // ===================================
  // Page rendering
  // ===================================
  const renderPage = () => {
    if (isLoading) return <div className="loader-container"><div className="loader"></div></div>;

    switch (currentPage) {
      case 'home':
        return <HomePage stocks={stocks.filter(Boolean)} user={user} onStockSelect={handleStockSelect} onNavigate={handleNavigate} onOpenTradeModal={handleOpenTradeModal} />;
      case 'detail': {
        const stock = stocks.find(s => s?.ticker === selectedTicker);
        return stock ? <StockDetailPage stock={stock} user={user} onBack={() => setCurrentPage('home')} onNavigate={handleNavigate} onOpenTradeModal={handleOpenTradeModal} /> : <p>Action non trouvée.</p>;
      }
      case 'login':
        return <LoginPage onLogin={handleLogin} onSignUp={handleSignUp} />;
      case 'about':
        return <AboutPage />;
      case 'portfolio':
        return <PortfolioPage user={user} stocks={stocks.filter(Boolean)} onNavigate={handleNavigate} />;
      case 'history':
        return <HistoryPage history={history.filter(Boolean)} />;
      case 'funds':
        return <FundsPage user={user} onUpdateFunds={handleUpdateFunds} />;
      case 'admin':
        return user.isAdmin ? <AdminPage stocks={stocks.filter(Boolean)} onAddStock={handleAddStock} onUpdateStock={handleUpdateStock} onDeleteStock={handleDeleteStock} /> : <p>Accès non autorisé.</p>;
      case 'settings':
        return <SettingsPage user={user} onUpdateUser={setUser} />;
      default:
        return <HomePage stocks={stocks.filter(Boolean)} user={user} onStockSelect={handleStockSelect} onNavigate={handleNavigate} onOpenTradeModal={handleOpenTradeModal} />;
    }
  };

  return (
    <div className="App">
      <Header user={user} currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout} />
      <main className="main-content">
        {errorMessage && <div className="error-toast">{errorMessage}</div>}
        {renderPage()}
      </main>
      {tradeModalState.isOpen && tradeModalState.stock && tradeModalState.type && (
        <TradeModal user={user} stock={tradeModalState.stock} type={tradeModalState.type} onClose={handleCloseTradeModal} onConfirm={handleConfirmTrade} />
      )}
    </div>
  );
};
