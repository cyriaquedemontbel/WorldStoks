export interface Stock {
    ticker: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    description: string;
    volumeToday: number;
    turnoverToday: number;
    history: { date: number; price: number }[];
    maxSupply: number;
    circulatingSupply: number;
}

export interface User {
  isLoggedIn: boolean;
  isAdmin: boolean;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: string;
  consent?: boolean; 
  cash: number;
  portfolio: Record<string, { quantity: number; price: number }>;
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

export type Page =
  | 'home'
  | 'detail'
  | 'login'
  | 'about'
  | 'portfolio'
  | 'history'
  | 'funds'
  | 'admin'
  | 'settings'; 