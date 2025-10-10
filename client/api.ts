import { Stock, User, Transaction } from './types';

// Remplacez cette URL par l'URL de votre backend
const API_BASE_URL = '/api'; 

// Une fonction helper pour gérer les réponses de l'API
const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || 'Une erreur est survenue');
    }
    return response.json();
};

// Fonction pour obtenir le token depuis le localStorage
const getToken = (): string | null => {
    return localStorage.getItem('authToken');
};

// =================================================================
// API Calls
// =================================================================

// Auth
export const apiLogin = async (email: string, pass: string): Promise<{ token: string, user: User }> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
    });
    return handleResponse(response);
};

export const apiSignUp = async (email: string, pass: string): Promise<User> => {
     const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
    });
    return handleResponse(response);
}

export const apiFetchMe = async (): Promise<User | null> => {
    const token = getToken();
    if (!token) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) {
             localStorage.removeItem('authToken');
             return null;
        }
        return await handleResponse(response);
    } catch (error) {
        localStorage.removeItem('authToken');
        return null;
    }
};

// Stocks
export const apiFetchStocks = async (): Promise<Stock[]> => {
    const response = await fetch(`${API_BASE_URL}/stocks`);
    return handleResponse(response);
};

// User Data (History, Portfolio are fetched with the user object in this model)
export const apiFetchHistory = async (): Promise<Transaction[]> => {
     const token = getToken();
     const response = await fetch(`${API_BASE_URL}/user/history`, {
         headers: { 'Authorization': `Bearer ${token}` }
     });
     return handleResponse(response);
};

export const apiUpdateFunds = async (amount: number, type: 'deposit' | 'withdraw'): Promise<User> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/user/funds`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ amount, type })
    });
    return handleResponse(response);
}


// Trading
export const apiBuyStock = async (ticker: string, quantity: number): Promise<{ user: User, updatedStock: Stock }> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/trade/buy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ticker, quantity })
    });
    return handleResponse(response);
};

export const apiSellStock = async (ticker: string, quantity: number): Promise<{ user: User, updatedStock: Stock }> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/trade/sell`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ticker, quantity })
    });
    return handleResponse(response);
};

// AI Market Update
export const apiUpdateMarketWithAI = async (): Promise<Stock[]> => {
    const token = getToken(); // Assuming this is an admin-only action
    const response = await fetch(`${API_BASE_URL}/market/update-ai`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};

// Admin
export const apiAddStock = async (stockData: Omit<Stock, 'history' | 'change' | 'changePercent'>): Promise<Stock> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/admin/stocks`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(stockData)
    });
    return handleResponse(response);
};

export const apiUpdateStock = async (stockData: Stock): Promise<Stock> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/admin/stocks/${stockData.ticker}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(stockData)
    });
    return handleResponse(response);
};

export const apiDeleteStock = async (ticker: string): Promise<{ message: string }> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/admin/stocks/${ticker}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};
