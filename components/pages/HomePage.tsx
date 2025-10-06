import React, { useState, useEffect } from 'react';
import { Page, DailyMarket, User, ExtremeEvent } from '../../types';
import InteractivePointMap from '../StaticWorldMap';
import BettingCard from '../BettingCard';
import ExtremeEventCard from '../ExtremeEventCard';
import { getAllMarkets } from '../../services/marketService';
import { generateExtremeEvents, getMarketAnalysis } from '../../services/geminiService';
import LoadingSpinner from '../LoadingSpinner';
import { Icon } from '../Icon';
import AnalysisModal from '../AnalysisModal';

// Haversine formula to calculate distance between two lat/lng points in km
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    0.5 - Math.cos(dLat)/2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    (1 - Math.cos(dLon))/2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

interface HomePageProps {
  navigateTo: (page: Page) => void;
  setSelectedMarket: (market: DailyMarket | null) => void;
  currentUser: User | null;
}

const HomePage: React.FC<HomePageProps> = ({ navigateTo, setSelectedMarket, currentUser }) => {
  const [allMarkets, setAllMarkets] = useState<DailyMarket[]>([]);
  const [allEvents, setAllEvents] = useState<ExtremeEvent[]>([]);
  const [filteredMarkets, setFilteredMarkets] = useState<DailyMarket[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ExtremeEvent[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchRadius, setSearchRadius] = useState(1000); // in km
  const [searchCenter, setSearchCenter] = useState<{ lat: number, lng: number } | null>(null);
  
  const [analyzingMarket, setAnalyzingMarket] = useState<DailyMarket | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [isAnalysisLoading, setIsLoadingAnalysis] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [marketsData, eventsData] = await Promise.all([
          getAllMarkets(),
          generateExtremeEvents('Global')
        ]);
        setAllMarkets(marketsData.filter(m => m.status === 'Active'));
        setAllEvents(eventsData);
      } catch (err) {
        setError('Failed to load initial data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  useEffect(() => {
    if (!searchCenter) {
      setFilteredMarkets([]);
      setFilteredEvents([]);
      return;
    }
    const filteredM = allMarkets.filter(market => 
      getDistance(searchCenter.lat, searchCenter.lng, market.lat, market.lng) <= searchRadius
    );
    const filteredE = allEvents.filter(event => 
      getDistance(searchCenter.lat, searchCenter.lng, event.lat, event.lng) <= searchRadius
    );
    setFilteredMarkets(filteredM);
    setFilteredEvents(filteredE);
  }, [searchCenter, searchRadius, allMarkets, allEvents]);

  const handlePlaceBet = (market: DailyMarket) => {
    setSelectedMarket(market);
    navigateTo('Betting');
  };

  const handleExtremeEventBet = (event: ExtremeEvent) => {
    const margin = 0.95;
    const oddsWillHappen = (1 / event.probability) * margin;
    const oddsWontHappen = (1 / (1 - event.probability)) * margin;
    // FIX: Added missing betType and unit properties to satisfy the DailyMarket type.
    const market: DailyMarket = {
      id: event.id, event: event.event, location: event.location, date: event.projected_date,
      icon: event.icon, lat: event.lat, lng: event.lng, status: 'Active',
      betType: 'OverUnder',
      unit: 'mm', // Placeholder unit for probability-based bet
      options: {
        A: { name: "Event Will Occur", odds: parseFloat(oddsWillHappen.toFixed(2)) },
        B: { name: "Event Will Not Occur", odds: parseFloat(oddsWontHappen.toFixed(2)) },
      },
    };
    setSelectedMarket(market);
    navigateTo('Betting');
  };

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
      <div className="animate-fade-in">
        <div className="text-center pt-8 pb-12">
          <h1 className="text-4xl md:text-6xl font-extrabold text-text-primary dark:text-text-primary-dark tracking-tight">
            Bet on the Weather
          </h1>
          <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-text-secondary dark:text-text-secondary-dark">
            Click anywhere on the globe. Adjust the radius. Find your next winning bet.
          </p>
        </div>

        <div className="max-w-7xl mx-auto space-y-8">
            <div className="bg-surface dark:bg-surface-dark p-4 rounded-xl shadow-lg border border-border-color/50 dark:border-border-color-dark/50">
              <label htmlFor="radius" className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-2 text-center">
                  Search Radius: <span className="font-bold text-primary dark:text-primary-dark">{searchRadius} km</span>
              </label>
              <input
                  id="radius"
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <InteractivePointMap onPointSelect={setSearchCenter} radius={searchRadius} />

            <div className="pt-8">
              {loading ? (
                 <div className="flex justify-center items-center py-20"><LoadingSpinner /></div>
              ) : error ? (
                <div className="text-center py-20 bg-red-100/50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg"><p>{error}</p></div>
              ) : !searchCenter ? (
                <div className="text-center py-20 bg-surface dark:bg-surface-dark rounded-xl border border-border-color/50 dark:border-border-color-dark/50">
                  <Icon icon="rain" className="w-16 h-16 text-text-secondary/50 dark:text-text-secondary-dark/50 mx-auto mb-4" />
                  <p className="text-text-secondary dark:text-text-secondary-dark text-lg">Click the map to search for weather events.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Daily Markets Column */}
                  <div>
                    <h2 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-6">Daily Markets</h2>
                    <div className="space-y-6">
                      {filteredMarkets.length > 0 ? (
                        filteredMarkets.map(market => <BettingCard key={market.id} market={market} onPlaceBet={handlePlaceBet} currentUser={currentUser} onAnalyze={handleAnalyze} />)
                      ) : (
                        <div className="text-center py-12 bg-surface dark:bg-surface-dark rounded-xl border border-border-color/50 dark:border-border-color-dark/50">
                          <p className="text-text-secondary dark:text-text-secondary-dark">No daily markets found here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Extreme Events Column */}
                  <div>
                    <h2 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-6">Extreme Events</h2>
                     <div className="space-y-6">
                      {filteredEvents.length > 0 ? (
                        filteredEvents.map(event => <ExtremeEventCard key={event.id} event={event} onPlaceBet={handleExtremeEventBet} currentUser={currentUser} />)
                      ) : (
                         <div className="text-center py-12 bg-surface dark:bg-surface-dark rounded-xl border border-border-color/50 dark:border-border-color-dark/50">
                          <p className="text-text-secondary dark:text-text-secondary-dark">No extreme events found here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
        </div>
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

export default HomePage;
