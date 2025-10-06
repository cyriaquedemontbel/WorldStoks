import React, { useState, useEffect } from 'react';
import { DailyMarket, Page, User } from '../../types';
import { getAllMarkets } from '../../services/marketService';
import { getMarketAnalysis } from '../../services/geminiService';
import BettingCard from '../BettingCard';
import LoadingSpinner from '../LoadingSpinner';
import AnalysisModal from '../AnalysisModal';

interface DailyMarketsPageProps {
  navigateTo: (page: Page) => void;
  setSelectedMarket: (market: DailyMarket) => void;
  currentUser: User | null;
}

const DailyMarketsPage: React.FC<DailyMarketsPageProps> = ({ navigateTo, setSelectedMarket, currentUser }) => {
  const [markets, setMarkets] = useState<DailyMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [analyzingMarket, setAnalyzingMarket] = useState<DailyMarket | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [isAnalysisLoading, setIsLoadingAnalysis] = useState(false);

  useEffect(() => {
    const fetchMarkets = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await getAllMarkets();
        setMarkets(results.filter(m => m.status === 'Active'));
      } catch (err) {
        setError('Failed to load market data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarkets();
  }, []);
  
  const handlePlaceBet = (market: DailyMarket) => {
    setSelectedMarket(market);
    navigateTo('Betting');
  }

  const handleAnalyze = async (market: DailyMarket) => {
    setAnalyzingMarket(market);
    setIsLoadingAnalysis(true);
    setAnalysis('');
    try {
      const result = await getMarketAnalysis(market);
      setAnalysis(result);
    } catch (error) {
      setAnalysis('Sorry, an error occurred while fetching the analysis.');
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const closeAnalysisModal = () => {
    setAnalyzingMarket(null);
    setAnalysis('');
  }

  return (
    <>
      <div className="animate-fade-in max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary dark:text-text-primary-dark">Daily Weather Markets</h1>
          <p className="mt-4 text-lg text-text-secondary dark:text-text-secondary-dark">Browse all available active markets from around the world.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {markets.map(market => (
              <BettingCard key={market.id} market={market} onPlaceBet={handlePlaceBet} currentUser={currentUser} onAnalyze={handleAnalyze} />
            ))}
          </div>
        )}
      </div>
      {analyzingMarket && (
        <AnalysisModal 
          market={analyzingMarket} 
          analysis={analysis} 
          isLoading={isAnalysisLoading} 
          onClose={closeAnalysisModal} 
        />
      )}
    </>
  );
};

export default DailyMarketsPage;