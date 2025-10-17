// ----------------- STOCK -----------------
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

  // ✅ Ajouts récents :
  marketCounter?: number;       // compteur pour suivre l'activité (achats/ventes)
  lastPriceChange?: number;     // variation % depuis le dernier prix
  previousPrice?: number;       // utile pour calculer la variation
  basePriceToday?: number;      // 🔹 prix de référence du jour pour calcul du % de variation
}


// ----------------- TRANSACTION -----------------
export interface Transaction {
  id?: string;             // ID unique optionnel
  ticker: string;          // symbole de l'action
  name?: string;           // nom de l'action (optionnel)
  quantity: number;        // positif = achat, négatif = vente
  price: number;           // prix d'achat/vente par action
  pricePerShare?: number;  // prix exact par action au moment de la transaction (backend)
  date: number;            // timestamp en millisecondes
  type?: 'buy' | 'sell';   // optionnel, pour info
  totalValue?: number;     // optionnel, calculé automatiquement
}

// ----------------- USER -----------------
export interface User {
  id: string;
  name?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  birthDate?: string;
  gender?: string;
  isLoggedIn?: boolean;
  isAdmin?: boolean;
  consent?: boolean;
  cash: number;
  portfolio: Record<string, { quantity: number; price: number }>;
  transactions?: Transaction[]; // liste des transactions
}

// ----------------- PAGE -----------------
export type Page =
  | 'home'
  | 'detail'
  | 'login'
  | 'about'
  | 'portfolio'
  | 'history'
  | 'funds'
  | 'admin'
  | 'settings'
  | 'orderbook'
  | 'admin-orders';

// ----------------- ORDER -----------------
export interface Order {
  _id: string;
  user: string;
  price: number;
  quantity: number;
  quantityRemaining: number;
  status: string;
  type: 'buy' | 'sell';
  timestamp: string;
}
