import React, { useState, useEffect, useCallback } from 'react';
import { DailyMarket, Page, User } from '../../types';
import { generateLiveMarkets } from '../../services/geminiService';
import BettingCard from '../BettingCard';
import LoadingSpinner from '../LoadingSpinner';
import { Icon } from '../Icon';

interface LiveBettingPageProps {
  navigateTo: (page: Page) => void;
  setSelectedMarket: (market: DailyMarket) => void;
  currentUser: User | null;
}

const LiveBettingPage: React.FC<LiveBettingPageProps> = ({ navigateTo, setSelectedMarket, currentUser }) => {
  const [markets, setMarkets] = useState<DailyMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await generateLiveMarkets();
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
  
  // Dummy analyze function since there is no analysis for live markets
  const handleAnalyze = () => { /* No-op */ };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary dark:text-text-primary-dark">Live Betting</h1>
        <p className="mt-4 text-lg text-text-secondary dark:text-text-secondary-dark">Bet on micro-events happening right now. New markets every few minutes.</p>
        <button 
            onClick={fetchMarkets}
            disabled={loading}
            className="mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg transition-all shadow-md hover:shadow-lg shadow-primary/30 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center mx-auto gap-2"
        >
            <Icon icon="storm" className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Markets'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {markets.map(market => (
            <BettingCard key={market.id} market={market} onPlaceBet={handlePlaceBet} currentUser={currentUser} onAnalyze={handleAnalyze} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveBettingPage;
