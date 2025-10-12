import { Stock, User, Transaction } from './types';

const API_BASE_URL = "http://localhost:5000/api";

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || 'Une erreur est survenue');
    }
    return response.json();
};

const getToken = (): string | null => localStorage.getItem('authToken');

// ==========================
// Auth
// ==========================
export const apiLogin = async (email: string, pass: string): Promise<{ token: string, user: User }> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
    });
    return handleResponse(response);
};

// Nouveau apiSignUp avec tous les champs
export const apiSignUp = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
    birthDate: string;
    gender?: string;
    consent: boolean;
}): Promise<{ token: string; user: User }> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

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
    } catch {
        localStorage.removeItem('authToken');
        return null;
    }
};

// ==========================
// Stocks
// ==========================
export const apiFetchStocks = async (): Promise<Stock[]> => {
    const response = await fetch(`${API_BASE_URL}/stocks`);
    return handleResponse(response);
};

// ==========================
// User Data
// ==========================
export const apiFetchUserData = async (): Promise<User | null> => {
    const token = getToken();
    if (!token) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/user/data`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) {
            localStorage.removeItem('authToken');
            return null;
        }
        const data = await handleResponse(response);
        return data as User;
    } catch {
        localStorage.removeItem('authToken');
        return null;
    }
};

export const apiFetchHistory = async (): Promise<Transaction[]> => {
    const token = getToken();
    if (!token) return [];
    try {
        const response = await fetch(`${API_BASE_URL}/user/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await handleResponse(response);
    } catch {
        return [];
    }
};

export const apiUpdateFunds = async (amount: number, type: 'deposit' | 'withdraw'): Promise<User> => {
    const token = getToken();
    if (!token) throw new Error("Utilisateur non connecté");

    const response = await fetch(`${API_BASE_URL}/user/funds`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount, type })
    });
    return handleResponse(response);
};

// ==========================
// Update user info (Settings)
// ==========================
export const apiUpdateUser = async (data: {
    firstName?: string;
    lastName?: string;
    username?: string;
    birthDate?: string;
    gender?: string;
    password?: string;
}): Promise<User> => {
    const token = getToken();
    if (!token) throw new Error('Utilisateur non connecté');

    const response = await fetch(`${API_BASE_URL}/user/update`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || 'Erreur mise à jour utilisateur');
    }

    return response.json();
};

// ==========================
// Trading
// ==========================
export const apiBuyStock = async (ticker: string, quantity: number) => {
  const res = await fetch(`${API_BASE_URL}/trades/buy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
    body: JSON.stringify({ ticker, quantity }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const apiSellStock = async (ticker: string, quantity: number) => {
  const res = await fetch(`${API_BASE_URL}/trades/sell`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
    body: JSON.stringify({ ticker, quantity }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// ==========================
// Admin
// ==========================
export const apiAddStock = async (stockData: Omit<Stock, 'history' | 'change' | 'changePercent'>): Promise<Stock> => {
    const token = getToken();
    if (!token) throw new Error("Utilisateur non connecté");

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
    if (!token) throw new Error("Utilisateur non connecté");

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
    if (!token) throw new Error("Utilisateur non connecté");

    const response = await fetch(`${API_BASE_URL}/admin/stocks/${ticker}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};

// ==========================
// Market Update (AI simulation)
// ==========================
export const apiUpdateMarketWithAI = async (): Promise<Stock[]> => {
    const response = await fetch(`${API_BASE_URL}/stocks/update-market`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(response);
};
