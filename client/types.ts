export interface Stock {
    ticker: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    description: string;
    volumeToday: number;
    turnoverToday: number;
    history: { date: number; price: number; }[];
    maxSupply: number;
    circulatingSupply: number;
}

export interface User {
    isLoggedIn: boolean;
    isAdmin: boolean;
    email: string;
    cash: number;
    portfolio: { [ticker: string]: number }; // e.g., { 'PSG': 10, 'OM': 5 }
}

export interface Transaction {
    id: string;
    timestamp: number;
    type: 'buy' | 'sell';
    ticker: string;
    name: string;
    quantity: number;
    pricePerShare: number;
    totalValue: number;
}

export type Page = 'home' | 'login' | 'about' | 'portfolio' | 'history' | 'funds' | 'admin' | 'detail';