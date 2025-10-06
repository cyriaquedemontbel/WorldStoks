
export type Page = 'Home' | 'DailyMarkets' | 'ExtremeEvents' | 'Betting' | 'HowItWorks' | 'MyBets' | 'Login' | 'SignUp' | 'Settings' | 'Admin' | 'LiveBetting' | 'HeadToHead';

export type Region = 'Global' | 'North America' | 'South America' | 'Europe' | 'Africa' | 'Asia' | 'Oceania' | 'Antarctica';

export type IconName = 'sun' | 'rain' | 'wind' | 'temperature' | 'storm' | 'snow' | 'cyclone' | 'tsunami' | 'ticket';

export type BetType = 'OverUnder' | 'ExactValue';
export type BetUnit = '°C' | 'km/h' | 'mm';

interface BaseMarket {
  id: string;
  event: string;
  location: string;
  date: string; // YYYY-MM-DD
  icon: IconName;
  status: 'Active' | 'Settled';
  lat: number;
  lng: number;
  unit: BetUnit;
}

export interface OverUnderMarket extends BaseMarket {
  betType: 'OverUnder';
  options: {
    A: { name: string; odds: number };
    B: { name: string; odds: number };
  };
  range?: never; // Ensure range is not present for OverUnder
}

export interface ExactValueMarket extends BaseMarket {
  betType: 'ExactValue';
  range: {
    min: number;
    max: number;
    step: number;
  };
  options?: never; // Ensure options is not present for ExactValue
}

export type DailyMarket = OverUnderMarket | ExactValueMarket;

export interface ExtremeEvent {
  id: string;
  event: string;
  location: string;
  projected_date: string;
  probability: number; // 0 to 1
  details: string;
  icon: IconName;
  lat: number;
  lng: number;
}

// For single bets (legacy)
export interface Bet {
  id: string;
  market: DailyMarket;
  stake: number;
  selectedOption: string; // e.g., "Over 25.5°C" or "Temperature will be 21°C"
  userPrediction?: number; // For 'ExactValue' bets, e.g., 21
  odds: number;
  potentialWinnings: number;
  status: 'Active' | 'Won' | 'Lost';
  actualResult?: string; // e.g., "26.1°C"
}

// For combined bets
export interface Selection {
  id: string;
  name: string;
  odds: number;
}

export interface Market {
  id: string;
  name: string;
  selections: Selection[];
}

export interface WeatherEvent {
  name: string;
  location: string;
  date: string;
  markets: Market[];
}

export interface BetSelection {
  selectionId: string;
  selectionName: string;
  odds: number;
  marketId: string;
  marketName: string;
  // Event info for display and settlement
  eventName: string; 
  eventLocation: string;
  eventDate: string;
}

export interface PlacedBet {
  id: string;
  selections: BetSelection[];
  stake: number;
  combinedOdds: number;
  potentialWinnings: number;
  status: 'Active' | 'Won' | 'Lost';
  settledDate?: string;
  // Add a property to distinguish from Bet
  betType: 'Combined';
}

export interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  bets: (Bet | PlacedBet)[];
  isAdmin?: boolean;
  isSuspended?: boolean;
}

export type Toast = {
  id: number;
  message: string;
  type: 'success' | 'error';
};