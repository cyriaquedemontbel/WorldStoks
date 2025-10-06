import React, { useState, useEffect, useCallback } from 'react';
import { DailyMarket, Page, User } from '../../types';
import { generateHeadToHeadMarkets } from '../../services/geminiService';
import LoadingSpinner from '../LoadingSpinner';
import { Icon } from '../Icon';

interface HeadToHeadCardProps {
    market: DailyMarket;
    onPlaceBet: (market: DailyMarket) => void;
    currentUser: User | null;
}
  
const HeadToHeadCard: React.FC<HeadToHeadCardProps> = ({ market, onPlaceBet, currentUser }) => {
    const isAdmin = currentUser?.isAdmin || false;
    // Safely split the location string
    const locationParts = market.location.split(' vs. ');
    const cityA = locationParts[0] || 'City A';
    const cityB = locationParts[1] || 'City B';

    // Type guard for OverUnderMarket
    const isOverUnderMarket = (market: DailyMarket): market is import('../../types').OverUnderMarket => {
        return market.betType === 'OverUnder';
    };
  
    return (
      <div className="bg-surface dark:bg-surface-dark p-6 rounded-2xl shadow-lg border border-border-color/50 dark:border-border-color-dark/50 flex flex-col justify-between transition-transform hover:scale-[1.02] hover:shadow-xl">
          <div>
              <div className="text-center">
                  <p className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">{market.date}</p>
                  <h3 className="text-lg font-bold text-text-primary dark:text-text-primary-dark mt-1">{market.event}</h3>
              </div>
  
              <div className="mt-6 flex items-center justify-around">
                  <div className="text-center w-2/5">
                      <p className="text-xl font-bold truncate">{cityA}</p>
                      {isOverUnderMarket(market) && <p className="text-2xl font-black text-primary dark:text-primary-dark">{market.options.A.odds.toFixed(2)}</p>}
                  </div>
                  <div className="text-center w-1/5">
                      <div className="bg-red-500/10 dark:bg-red-500/20 p-3 rounded-full inline-block">
                          <Icon icon={market.icon} className="w-8 h-8 text-red-500" />
                      </div>
                      <p className="font-bold text-red-500 text-lg">VS</p>
                  </div>
                  <div className="text-center w-2/5">
                      <p className="text-xl font-bold truncate">{cityB}</p>
                      {isOverUnderMarket(market) && <p className="text-2xl font-black text-primary dark:text-primary-dark">{market.options.B.odds.toFixed(2)}</p>}
                  </div>
              </div>
          </div>
  
          <div className="mt-6">
              <button
              onClick={() => onPlaceBet(market)}
              disabled={isAdmin}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg shadow-primary/30 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
              >
              {isAdmin ? 'Admin cannot place bets' : 'View Selections & Bet'}
              </button>
          </div>
      </div>
    );
};

interface HeadToHeadPageProps {
  navigateTo: (page: Page) => void;
  setSelectedMarket: (market: DailyMarket) => void;
  currentUser: User | null;
}

const HeadToHeadPage: React.FC<HeadToHeadPageProps> = ({ navigateTo, setSelectedMarket, currentUser }) => {
  const [markets, setMarkets] = useState<DailyMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await generateHeadToHeadMarkets();
      setMarkets(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);
  
  const handlePlaceBet = (market: DailyMarket) => {
    setSelectedMarket(market);
    navigateTo('Betting');
  }

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary dark:text-text-primary-dark">Head-to-Head Betting</h1>
        <p className="mt-4 text-lg text-text-secondary dark:text-text-secondary-dark">Pit city against city in a weather showdown. Who will win?</p>
        <button 
            onClick={fetchMarkets}
            disabled={loading}
            className="mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg transition-all shadow-md hover:shadow-lg shadow-primary/30 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center mx-auto gap-2"
        >
            <Icon icon="storm" className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Finding Matchups...' : 'Find New Matchups'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-red-100/50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {markets.map(market => (
            <HeadToHeadCard key={market.id} market={market} onPlaceBet={handlePlaceBet} currentUser={currentUser} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeadToHeadPage;
