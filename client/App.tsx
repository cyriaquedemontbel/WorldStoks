import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { StockDetailPage } from './pages/StockDetailPage';
import { LoginPage } from './pages/LoginPage';
import { AboutPage } from './pages/AboutPage';
import OrderBookPage from './pages/OrderBookPage';
import PageContainer from './components/PageContainer';
import { PortfolioPage } from './pages/PortfolioPage';
// ...existing code...
import { FundsPage } from './pages/FundsPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import { TradeModal } from './components/TradeModal';
import { Stock, User, Transaction, Page } from './types';
import * as api from './services/api';

const guestUser: User = {
  id: 'guest',
  email: '',
  cash: 0,
  portfolio: {},
  isLoggedIn: false,
  isAdmin: false,
  username: '',
  firstName: '',
  lastName: '',
  birthDate: '',
  gender: '',
  consent: false,
};

type TradeModalState = {
  isOpen: boolean;
  stock: Stock | null;
  type: 'buy' | 'sell' | null;
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<User>(guestUser);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [tradeModalState, setTradeModalState] = useState<TradeModalState>({
    isOpen: false,
    stock: null,
    type: null,
  });

  const currentPage: Page = (() => {
    const path = location.pathname.split('/')[1];
    if (!path || path === '') return 'home';
    if (path === 'stock') return 'home';
    return path as Page;
  })();

  const showMessage = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 3000);
  };

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

  const updateStockInState = useCallback((updatedStock: Stock) => {
    setStocks(prev => prev.map(s => s?.ticker === updatedStock?.ticker ? updatedStock : s));
  }, []);

  const handleNavigate = (page: Page, ticker?: string) => {
    switch (page) {
      case 'home':
        navigate('/');
        break;
      case 'portfolio':
        navigate('/portfolio');
        break;
      case 'funds':
        navigate('/funds');
        break;
      case 'history':
        navigate('/history');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'about':
        navigate('/about');
        break;
      case 'login':
        navigate('/login');
        break;
      case 'admin':
        navigate('/admin');
        break;
      case 'admin-orders':
        navigate('/admin/orders');
        break;
      case 'orderbook':
        navigate(`/orderbook/${ticker || 'AAPL'}`);
        break;
      default:
        navigate('/');
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    try {
      const { token, user: userData } = await api.apiLogin(email, pass);
  localStorage.setItem('authToken', token);
  if (userData?.email) localStorage.setItem('userEmail', userData.email);

      setUser({
        ...userData,
        isLoggedIn: true,
        isAdmin: userData.isAdmin ?? false,
        cash: userData.cash ?? 0,
        portfolio: userData.portfolio ?? {},
      });

      const historyData = await api.apiFetchHistory();
      setHistory(historyData.filter(Boolean));

      navigate(userData.isAdmin ? '/admin' : '/');
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
      const { token, user: userData } = await api.apiSignUp(data);
  localStorage.setItem('authToken', token);
  if (userData?.email) localStorage.setItem('userEmail', userData.email);

      setUser({
        ...userData,
        isLoggedIn: true,
        isAdmin: userData.isAdmin ?? false,
        cash: userData.cash ?? 0,
        portfolio: userData.portfolio ?? {},
      });

      const historyData = await api.apiFetchHistory();
      setHistory(historyData.filter(Boolean));

      navigate(userData.isAdmin ? '/admin' : '/');
      showMessage('Inscription réussie !');
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Erreur d'inscription.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(guestUser);
    setHistory([]);
    navigate('/');
  };

  const handleTrade = async (
    tradeFn: () => Promise<{ success: boolean; user: User; stock: Stock }>,
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

  const handleOpenTradeModal = (stock: Stock, type: 'buy' | 'sell') =>
    setTradeModalState({ isOpen: true, stock, type });

  const handleCloseTradeModal = () =>
    setTradeModalState({ isOpen: false, stock: null, type: null });

  const handleConfirmTrade = (ticker: string, quantity: number) => {
    if (!tradeModalState.stock || !tradeModalState.type) return;
    const price = tradeModalState.stock.price;
    if (tradeModalState.type === 'buy')
      handleTrade(() => api.apiPlaceOrder(ticker, 'buy', price, quantity), `${quantity} action(s) achetée(s) !`);
    else
      handleTrade(() => api.apiPlaceOrder(ticker, 'sell', price, quantity), `${quantity} action(s) vendue(s) !`);
  };


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
        isAdmin: updatedUser.isAdmin ?? false,
        cash: updatedUser.cash ?? 0,
        portfolio: updatedUser.portfolio ?? {},
      });
      return `${amount.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })} ${type === 'deposit' ? 'déposés' : 'retirés'} !`;
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Erreur mise à jour fonds.');
      return '';
    }
  };

  if (isLoading)
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );

  return (
    <>
      <Header
        user={user}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

  {errorMessage && <div className="error-toast">{errorMessage}</div>}

  

      <Routes>
  <Route path="/admin/orders" element={<PageContainer>{user.isAdmin ? (<AdminOrdersPage />) : (<Navigate to="/" />)}</PageContainer>} />
        <Route path="/" element={<PageContainer><HomePage stocks={stocks} user={user} onStockSelect={(ticker) => navigate(`/stock/${ticker}`)} onOpenTradeModal={handleOpenTradeModal} onNavigate={handleNavigate} /></PageContainer>} />
        <Route path="/orderbook/:ticker" element={<PageContainer><OrderBookPage /></PageContainer>} />
        <Route path="/stock/:ticker" element={<PageContainer><StockDetailPage stocks={stocks} user={user} onOpenTradeModal={handleOpenTradeModal} /></PageContainer>} />
        <Route path="/login" element={<PageContainer><LoginPage onLogin={handleLogin} onSignUp={handleSignUp} /></PageContainer>} />
        <Route path="/about" element={<PageContainer><AboutPage /></PageContainer>} />
        <Route path="/portfolio" element={<PageContainer><PortfolioPage stocks={stocks} user={user} onNavigate={(page, ticker) => ticker ? navigate(`/stock/${ticker}`) : handleNavigate(page)} /></PageContainer>} />
        <Route path="/funds" element={<PageContainer><FundsPage user={user} onUpdateFunds={handleUpdateFunds} /></PageContainer>} />
        <Route path="/admin" element={<PageContainer>{user.isAdmin ? (<AdminPage stocks={stocks} onAddStock={handleAddStock} onUpdateStock={handleUpdateStock} onDeleteStock={handleDeleteStock} />) : (<Navigate to="/" />)}</PageContainer>} />
        <Route path="/admin/orders" element={<PageContainer>{user.isAdmin ? (<AdminOrdersPage />) : (<Navigate to="/" />)}</PageContainer>} />
        <Route path="/settings" element={<PageContainer><SettingsPage user={user} onUpdateUser={setUser} /></PageContainer>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {tradeModalState.isOpen && tradeModalState.stock && tradeModalState.type && (
        <TradeModal
          user={user}
          stock={tradeModalState.stock}
          type={tradeModalState.type}
          onClose={handleCloseTradeModal}
          onConfirm={handleConfirmTrade}
        />
      )}
    </>
  );
};

export default App;