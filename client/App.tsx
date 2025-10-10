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
import { TradeModal } from './components/TradeModal';
import * as api from './api';
import { Stock, User, Page, Transaction } from './types';

const guestUser: User = {
    isLoggedIn: false,
    isAdmin: false,
    email: '',
    cash: 0,
    portfolio: {},
};

type TradeModalState = {
    isOpen: boolean;
    stock: Stock | null;
    type: 'buy' | 'sell' | null;
}

export const App = () => {
    const [user, setUser] = useState<User>(guestUser);
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [history, setHistory] = useState<Transaction[]>([]);
    const [currentPage, setCurrentPage] = useState<Page>('home');
    const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMarketUpdating, setIsMarketUpdating] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [tradeModalState, setTradeModalState] = useState<TradeModalState>({
        isOpen: false,
        stock: null,
        type: null,
    });

    const showMessage = (msg: string) => {
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(''), 3000);
    };
    
    // Fetch initial data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [stocksData, userData, historyData] = await Promise.all([
                    api.apiFetchStocks(),
                    api.apiFetchMe(),
                    api.apiFetchHistory().catch(() => []) // History might fail if not logged in
                ]);
                setStocks(stocksData);
                if (userData) {
                    setUser(userData);
                    setHistory(historyData);
                }
            } catch (error) {
                showMessage(error instanceof Error ? error.message : "Erreur de chargement des données.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleLogin = async (email: string, pass: string) => {
        try {
            const { token, user: loggedInUser } = await api.apiLogin(email, pass);
            localStorage.setItem('authToken', token);
            setUser(loggedInUser);
            // Fetch history after login
            const historyData = await api.apiFetchHistory();
            setHistory(historyData);
            setCurrentPage('home');
            showMessage(`Bienvenue, ${loggedInUser.email} !`);
        } catch (error) {
            showMessage(error instanceof Error ? error.message : "Erreur de connexion.");
        }
    };
    
    const handleSignUp = async (email: string, pass: string) => {
        try {
            await api.apiSignUp(email, pass);
            showMessage("Inscription réussie ! Veuillez vous connecter.");
            // Or automatically log them in
            await handleLogin(email, pass);
        } catch (error) {
            showMessage(error instanceof Error ? error.message : "Erreur d'inscription.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setUser(guestUser);
        setHistory([]);
        setCurrentPage('home');
    };

    const handleNavigate = (page: Page, ticker?: string) => {
        if (page === 'detail' && ticker) {
            setSelectedTicker(ticker);
        } else {
            setSelectedTicker(null);
        }
        setCurrentPage(page);
    };

    const handleStockSelect = (ticker: string) => {
        setSelectedTicker(ticker);
        setCurrentPage('detail');
    };

    const updateStockInState = useCallback((updatedStock: Stock) => {
        setStocks(prev => prev.map(s => s.ticker === updatedStock.ticker ? updatedStock : s));
    }, []);

    const handleTrade = async (tradeFn: () => Promise<{ user: User; updatedStock: Stock }>, successMsg: string) => {
        try {
            const { user: updatedUser, updatedStock } = await tradeFn();
            setUser(updatedUser);
            updateStockInState(updatedStock);
            // Refresh history
            const historyData = await api.apiFetchHistory();
            setHistory(historyData);
            showMessage(successMsg);
        } catch (error) {
            showMessage(error instanceof Error ? error.message : "Erreur de transaction.");
        } finally {
            handleCloseTradeModal();
        }
    };

    const handleBuyStock = (ticker: string, quantity: number) => {
        handleTrade(
            () => api.apiBuyStock(ticker, quantity),
            `${quantity} action(s) de ${ticker} achetée(s) !`
        );
    };
    
    const handleSellStock = (ticker: string, quantity: number) => {
        handleTrade(
            () => api.apiSellStock(ticker, quantity),
            `${quantity} action(s) de ${ticker} vendue(s) !`
        );
    };

    const handleOpenTradeModal = (stock: Stock, type: 'buy' | 'sell') => {
        setTradeModalState({ isOpen: true, stock, type });
    };

    const handleCloseTradeModal = () => {
        setTradeModalState({ isOpen: false, stock: null, type: null });
    };

    const handleConfirmTrade = (ticker: string, quantity: number) => {
        if (tradeModalState.type === 'buy') {
            handleBuyStock(ticker, quantity);
        } else if (tradeModalState.type === 'sell') {
            handleSellStock(ticker, quantity);
        }
    };

    const handleUpdateMarket = async () => {
        setIsMarketUpdating(true);
        try {
            const updatedStocks = await api.apiUpdateMarketWithAI();
            setStocks(updatedStocks);
            showMessage('Marché mis à jour avec succès !');
        } catch (error) {
            showMessage(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du marché.');
        } finally {
            setIsMarketUpdating(false);
        }
    };

    // Admin functions
    const handleAddStock = async (stock: Stock) => {
        try {
            const newStock = await api.apiAddStock(stock);
            setStocks(prev => [...prev, newStock]);
            showMessage(`Marché ${stock.ticker} ajouté.`);
            return true;
        } catch (error) {
            showMessage(error instanceof Error ? error.message : "Erreur d'ajout.");
            return false;
        }
    };

    const handleUpdateStock = async (updatedStock: Stock) => {
        try {
            const savedStock = await api.apiUpdateStock(updatedStock);
            updateStockInState(savedStock);
            showMessage(`Marché ${updatedStock.ticker} mis à jour.`);
            return true;
        } catch (error) {
            showMessage(error instanceof Error ? error.message : "Erreur de mise à jour.");
            return false;
        }
    };

    const onDeleteStock = async (ticker: string) => {
        try {
            await api.apiDeleteStock(ticker);
            setStocks(prev => prev.filter(s => s.ticker !== ticker));
            showMessage(`Marché ${ticker} supprimé.`);
        } catch (error) {
            showMessage(error instanceof Error ? error.message : "Erreur de suppression.");
        }
    };
    
    const handleUpdateFunds = async (amount: number, type: 'deposit' | 'withdraw') => {
        try {
            const updatedUser = await api.apiUpdateFunds(amount, type);
            setUser(updatedUser);
            return `${amount.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })} ${type === 'deposit' ? 'déposés' : 'retirés'} avec succès.`;
        } catch (error) {
            throw error;
        }
    };

    const renderPage = () => {
        if (isLoading) {
            return (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <div className="loader"></div>
                </div>
            );
        }

        switch (currentPage) {
            case 'home':
                return <HomePage stocks={stocks} user={user} onStockSelect={handleStockSelect} onNavigate={handleNavigate} isMarketUpdating={isMarketUpdating} onOpenTradeModal={handleOpenTradeModal} onUpdateMarket={handleUpdateMarket} />;
            case 'detail':
                const selectedStock = stocks.find(s => s.ticker === selectedTicker);
                return selectedStock ? <StockDetailPage stock={selectedStock} user={user} onBack={() => setCurrentPage('home')} onNavigate={handleNavigate} onOpenTradeModal={handleOpenTradeModal} /> : <p>Action non trouvée.</p>;
            case 'login':
                return <LoginPage onLogin={handleLogin} onSignUp={handleSignUp} />;
            case 'about':
                return <AboutPage />;
            case 'portfolio':
                return <PortfolioPage user={user} stocks={stocks} onNavigate={handleNavigate} />;
            case 'history':
                return <HistoryPage history={history} />;
            case 'funds':
                return <FundsPage user={user} onUpdateFunds={handleUpdateFunds} />;
            case 'admin':
                 return user.isAdmin ? <AdminPage stocks={stocks} onAddStock={handleAddStock} onUpdateStock={handleUpdateStock} onDeleteStock={onDeleteStock} /> : <p>Accès non autorisé.</p>;
            default:
                return <HomePage stocks={stocks} user={user} onStockSelect={handleStockSelect} onNavigate={handleNavigate} isMarketUpdating={isMarketUpdating} onOpenTradeModal={handleOpenTradeModal} onUpdateMarket={handleUpdateMarket} />;
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
                <TradeModal
                    user={user}
                    stock={tradeModalState.stock}
                    type={tradeModalState.type}
                    onClose={handleCloseTradeModal}
                    onConfirm={handleConfirmTrade}
                />
            )}
        </div>
    );
};
