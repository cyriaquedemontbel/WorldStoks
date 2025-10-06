import React, { useState, useEffect } from 'react';
import { ExtremeEvent, Page, DailyMarket, User } from '../../types';
import { generateExtremeEvents } from '../../services/geminiService';
import ExtremeEventCard from '../ExtremeEventCard';
import LoadingSpinner from '../LoadingSpinner';

interface ExtremeEventsPageProps {
  navigateTo: (page: Page) => void;
  setSelectedMarket: (market: DailyMarket) => void;
  currentUser: User | null;
}

const ExtremeEventsPage: React.FC<ExtremeEventsPageProps> = ({ navigateTo, setSelectedMarket, currentUser }) => {
  const [events, setEvents] = useState<ExtremeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await generateExtremeEvents('Global');
        setEvents(results);
      } catch (err) {
        setError('Failed to load extreme event data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handlePlaceBet = (event: ExtremeEvent) => {
    const margin = 0.95; // 5% bookmaker margin
    const oddsWillHappen = (1 / event.probability) * margin;
    const oddsWontHappen = (1 / (1 - event.probability)) * margin;

    // FIX: Added missing betType and unit properties to satisfy the DailyMarket type.
    const market: DailyMarket = {
        id: event.id,
        event: event.event,
        location: event.location,
        date: event.projected_date,
        icon: event.icon,
        betType: 'OverUnder',
        unit: 'mm', // Placeholder unit for probability-based bet
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

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary dark:text-text-primary-dark">Extreme Event Watch</h1>
        <p className="mt-4 text-lg text-text-secondary dark:text-text-secondary-dark">Browse all available high-impact weather phenomena.</p>
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
          {events.map(event => (
            <ExtremeEventCard key={event.id} event={event} onPlaceBet={handlePlaceBet} currentUser={currentUser} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExtremeEventsPage;
