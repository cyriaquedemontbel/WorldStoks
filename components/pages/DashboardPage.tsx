
import React, { useState, useEffect } from 'react';
import { User, Page, DailyMarket, ExtremeEvent } from '../../types';
import { getRecommendedMarkets, generateExtremeEvents, getMarketAnalysis } from '../../services/geminiService';
import { getAllMarkets } from '../../services/marketService';
import BetSlipCard from '../BetSlipCard';
import BettingCard from '../BettingCard';
import ExtremeEventCard from '../ExtremeEventCard';
import LoadingSpinner from '../LoadingSpinner';
import InteractivePointMap from '../StaticWorldMap';
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


interface DashboardPageProps {
  user: User;
  navigateTo: (page: Page) => void;
  setSelectedMarket: (market: DailyMarket) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user, navigateTo, setSelectedMarket }) => {
  const [recommendedMarkets, setRecommendedMarkets] = useState<DailyMarket[]>([]);
  const [featuredEvent, setFeaturedEvent] = useState<ExtremeEvent | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [loadingEvent, setLoadingEvent] = useState(true);
  
  // State from HomePage for the map
  const [allMarkets, setAllMarkets] = useState<DailyMarket[]>([]);
  const [allEvents, setAllEvents] = useState<ExtremeEvent[]>([]);
  const [filteredMarkets, setFilteredMarkets] = useState<DailyMarket[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ExtremeEvent[]>([]);
  const [mapAndEventsLoading, setMapAndEventsLoading] = useState(true);
  const [mapAndEventsError, setMapAndEventsError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(1000); // in km
  const [searchCenter, setSearchCenter] = useState<{ lat: number, lng: number } | null>(null);
  const [analyzingMarket, setAnalyzingMarket] = useState<DailyMarket | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [isAnalysisLoading, setIsLoadingAnalysis] = useState(false);

  const activeBets = user.bets.filter(b => b.status === 'Active').slice(0, 3);

  // Existing useEffect for recommendations and featured event
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoadingRecs(true);
      try {
        const allMarketsData = await getAllMarkets();
        const recs = await getRecommendedMarkets(user, allMarketsData);
        setRecommendedMarkets(recs);
      } catch (error) {
        console.error("Failed to load recommendations:", error);
      } finally {
        setLoadingRecs(false);
      }
    };

    const fetchFeaturedEvent = async () => {
        setLoadingEvent(true);
        try {
            const events = await generateExtremeEvents('Global');
            if (events.length > 0) {
                // Feature the one with highest probability
                const sortedEvents = [...events].sort((a, b) => b.probability - a.probability);
                setFeaturedEvent(sortedEvents[0]);
            }
        } catch (error) {
            console.error("Failed to load featured event:", error);
        } finally {
            setLoadingEvent(false);
        }
    };
    
    fetchRecommendations();
    fetchFeaturedEvent();
  }, [user]);

  // useEffect from HomePage to fetch data for the map
  useEffect(() => {
    const fetchAllDataForMap = async () => {
      setMapAndEventsLoading(true);
      setMapAndEventsError(null);
      try {
        const [marketsData, eventsData] = await Promise.all([
          getAllMarkets(),
          generateExtremeEvents('Global')
        ]);
        setAllMarkets(marketsData.filter(m => m.status === 'Active'));
        setAllEvents(eventsData);
      } catch (err) {
        setMapAndEventsError('Failed to load map data. Please try again later.');
        console.error(err);
      } finally {
        setMapAndEventsLoading(false);
      }
    };
    fetchAllDataForMap();
  }, []);

  // useEffect from HomePage to filter markets based on map interaction
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

    const market: DailyMarket = {
        id: event.id,
        event: event.event,
        location: event.location,
        date: event.projected_date,
        icon: event.icon,
        betType: 'OverUnder',
        unit: 'mm', 
        options: {
            A: { name: "Event Will Occur", odds: parseFloat(oddsWillHappen.toFixed(2)) },
            B: { name: "Event Will Not Occur", odds: parseFloat(oddsWontHappen.toFixed(2)) },
        },
        status: 'Active',
        lat: event.lat,
        lng: event.lng,
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
    <div className="animate-fade-in space-y-12">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary dark:text-text-primary-dark">Welcome, {user.username}</h1>
        <p className="mt-2 text-lg text-text-secondary dark:text-text-secondary-dark">Here's your personal betting dashboard.</p>
      </div>
      
      {/* Interactive Map Section from HomePage */}
      <section className="space-y-8">
            <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">Explore Markets on the Map</h2>
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
              {mapAndEventsLoading ? (
                 <div className="flex justify-center items-center py-20"><LoadingSpinner /></div>
              ) : mapAndEventsError ? (
                <div className="text-center py-20 bg-red-100/50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg"><p>{mapAndEventsError}</p></div>
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
                        filteredMarkets.map(market => <BettingCard key={market.id} market={market} onPlaceBet={handlePlaceBet} currentUser={user} onAnalyze={handleAnalyze} />)
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
                        filteredEvents.map(event => <ExtremeEventCard key={event.id} event={event} onPlaceBet={handleExtremeEventBet} currentUser={user} />)
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
      </section>

      {/* Existing Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Recommended for You */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-4">Recommended For You</h2>
            {loadingRecs ? (
              <div className="flex justify-center items-center h-48 bg-surface dark:bg-surface-dark rounded-xl"><LoadingSpinner /></div>
            ) : recommendedMarkets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendedMarkets.map(market => (
                  <BettingCard key={market.id} market={market} onPlaceBet={handlePlaceBet} currentUser={user} onAnalyze={handleAnalyze} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-surface dark:bg-surface-dark rounded-xl">
                <p>No recommendations available right now.</p>
              </div>
            )}
          </section>

          {/* Active Bets */}
           {activeBets.length > 0 && (
             <section>
                <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-4">Your Active Bets</h2>
                <div className="space-y-4">
                  {activeBets.map(bet => (
                    <BetSlipCard key={bet.id} bet={bet} />
                  ))}
                   {user.bets.filter(b => b.status === 'Active').length > 3 && (
                      <div className="text-center">
                        <button onClick={() => navigateTo('MyBets')} className="font-semibold text-primary dark:text-primary-dark hover:underline">
                          View all active bets
                        </button>
                      </div>
                  )}
                </div>
            </section>
           )}

        </div>
        <div className="space-y-8">
          {/* Balance */}
          <section className="bg-surface dark:bg-surface-dark p-6 rounded-xl shadow-lg border border-border-color/50 dark:border-border-color-dark/50">
            <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2">Your Balance</h2>
            <p className="text-4xl font-extrabold text-primary dark:text-primary-dark">${user.balance.toFixed(2)}</p>
            <button onClick={() => navigateTo('Settings')} className="mt-4 w-full bg-primary/10 hover:bg-primary/20 text-primary font-bold py-2 px-4 rounded-lg transition-all">
                Manage Funds
            </button>
          </section>

          {/* Featured Event */}
          <section>
             <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-4">Featured Event</h2>
             {loadingEvent ? (
                <div className="flex justify-center items-center h-48 bg-surface dark:bg-surface-dark rounded-xl"><LoadingSpinner /></div>
             ) : featuredEvent ? (
                <ExtremeEventCard event={featuredEvent} onPlaceBet={handleExtremeEventBet} currentUser={user} />
             ) : (
                <div className="text-center py-12 bg-surface dark:bg-surface-dark rounded-xl">
                    <p>No featured event available.</p>
                </div>
             )}
          </section>
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

export default DashboardPage;
