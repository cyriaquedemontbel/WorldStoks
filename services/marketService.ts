import { DailyMarket } from '../types';

const MARKETS_KEY = 'skybet_markets';

// Initial mock data to ensure the app has content on first load
const initialMarkets: DailyMarket[] = [
    {
        id: "temp-ber-1",
        betType: "OverUnder",
        event: "Max Temperature in Berlin",
        location: "Berlin, Germany",
        date: new Date(Date.now() + 864e5).toISOString().slice(0, 10),
        icon: "temperature",
        unit: "°C",
        options: { A: { name: "Over 22.5°C", odds: 1.90 }, B: { name: "Under 22.5°C", odds: 1.85 } },
        status: 'Active',
        lat: 52.52,
        lng: 13.40,
    },
    {
        id: "rain-lon-1",
        betType: "OverUnder",
        event: "Rainfall in London",
        location: "London, UK",
        date: new Date(Date.now() + 864e5).toISOString().slice(0, 10),
        icon: "rain",
        unit: "mm",
        options: { A: { name: "Over 0.5mm", odds: 1.75 }, B: { name: "Under 0.5mm", odds: 2.00 } },
        status: 'Active',
        lat: 51.50,
        lng: -0.12,
    },
    {
        id: "temp-exact-nyc-1",
        betType: "ExactValue",
        event: "Exact Max Temperature in New York",
        location: "New York, USA",
        date: new Date(Date.now() + 864e5).toISOString().slice(0, 10),
        icon: "temperature",
        unit: "°C",
        range: { min: 15, max: 30, step: 0.5 },
        status: 'Active',
        lat: 40.71,
        lng: -74.00,
    },
    {
        id: "wind-syd-1",
        betType: "ExactValue",
        event: "Exact Max Wind Speed in Sydney",
        location: "Sydney, Australia",
        date: new Date(Date.now() + 864e5).toISOString().slice(0, 10),
        icon: "wind",
        unit: "km/h",
        range: { min: 5, max: 40, step: 1 },
        status: 'Active',
        lat: -33.86,
        lng: 151.20,
    },
    {
        id: "temp-tok-1",
        betType: "OverUnder",
        event: "Min Temperature in Tokyo",
        location: "Tokyo, Japan",
        date: new Date(Date.now() + 864e5).toISOString().slice(0, 10),
        icon: "temperature",
        unit: "°C",
        options: { A: { name: "Above 15°C", odds: 2.05 }, B: { name: "Below 15°C", odds: 1.75 } },
        status: 'Active',
        lat: 35.68,
        lng: 139.69,
    },
    {
        id: "snow-mos-1",
        betType: "OverUnder",
        event: "Snowfall in Moscow",
        location: "Moscow, Russia",
        date: new Date(Date.now() + 864e5).toISOString().slice(0, 10),
        icon: "snow",
        unit: "mm",
        options: { A: { name: "Any snowfall", odds: 3.50 }, B: { name: "No snowfall", odds: 1.30 } },
        status: 'Settled', // Past event for history
        lat: 55.75,
        lng: 37.61,
    }
];


const getMarkets = (): DailyMarket[] => {
  const markets = localStorage.getItem(MARKETS_KEY);
  if (!markets) {
    localStorage.setItem(MARKETS_KEY, JSON.stringify(initialMarkets));
    return initialMarkets;
  }
  return JSON.parse(markets);
};

const saveMarkets = (markets: DailyMarket[]) => {
  localStorage.setItem(MARKETS_KEY, JSON.stringify(markets));
};

export const getAllMarkets = (): Promise<DailyMarket[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getMarkets());
    }, 200);
  });
};

export const getMarketById = (id: string): Promise<DailyMarket | undefined> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(getMarkets().find(m => m.id === id));
        }, 100);
    });
};

export const addMarket = (market: Omit<DailyMarket, 'id' | 'status'>): Promise<DailyMarket> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const markets = getMarkets();
            const newMarket: DailyMarket = {
                ...market,
                id: `market-${Date.now()}`,
                status: 'Active',
            } as DailyMarket;
            markets.unshift(newMarket); // Add to the top of the list
            saveMarkets(markets);
            resolve(newMarket);
        }, 200);
    });
};

export const updateMarket = (updatedMarket: DailyMarket): Promise<DailyMarket> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const markets = getMarkets();
            const index = markets.findIndex(m => m.id === updatedMarket.id);
            if (index !== -1) {
                markets[index] = updatedMarket;
                saveMarkets(markets);
                resolve(updatedMarket);
            } else {
                reject(new Error("Market not found"));
            }
        }, 200);
    });
};

export const deleteMarket = (id: string): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            let markets = getMarkets();
            markets = markets.filter(m => m.id !== id);
            saveMarkets(markets);
            resolve();
        }, 200);
    });
};