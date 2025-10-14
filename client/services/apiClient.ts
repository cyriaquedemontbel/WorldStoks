// Moved into services/ to avoid filename collision with /api dev proxy
import { Stock, User, Transaction, Order } from '../types';

const API_BASE_URL = "http://localhost:5000/api";

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || 'Une erreur est survenue');
    }
    return response.json();
};

const getToken = (): string | null => localStorage.getItem('authToken');

export const apiFetchMyOrders = async (): Promise<Order[]> => {
    const token = getToken();
    if (!token) return [];
    try {
        const response = await fetch(`${API_BASE_URL}/orders/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await handleResponse(response);
        return data.orders || [];
    } catch {
        return [];
    }
};

// Minimal set exported for now; other functions can be moved similarly as needed.
