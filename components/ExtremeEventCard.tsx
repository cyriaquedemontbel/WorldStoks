import React from 'react';
import { ExtremeEvent, User } from '../types';
import { Icon } from './Icon';

interface ExtremeEventCardProps {
  event: ExtremeEvent;
  onPlaceBet: (event: ExtremeEvent) => void;
  currentUser: User | null;
}

const ExtremeEventCard: React.FC<ExtremeEventCardProps> = ({ event, onPlaceBet, currentUser }) => {
  const probabilityPercentage = (event.probability * 100).toFixed(0);
  const isAdmin = currentUser?.isAdmin || false;

  return (
    <div className="bg-surface dark:bg-surface-dark p-6 rounded-2xl shadow-lg border border-border-color/50 dark:border-border-color-dark/50 overflow-hidden relative flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">{event.location} - {event.projected_date}</p>
            <h3 className="text-lg font-bold text-text-primary dark:text-text-primary-dark mt-1">{event.event}</h3>
          </div>
          <div className="bg-red-500/10 dark:bg-red-500/20 p-3 rounded-full">
            <Icon icon={event.icon} className="w-6 h-6 text-red-500" />
          </div>
        </div>

        <p className="mt-4 text-text-secondary dark:text-text-secondary-dark text-sm">
          {event.details}
        </p>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-bold text-red-600 dark:text-red-400">Probability</span>
            <span className="text-sm font-bold text-red-600 dark:text-red-400">{probabilityPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div 
              className="bg-red-500 h-2.5 rounded-full" 
              style={{ width: `${probabilityPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <button
          onClick={() => onPlaceBet(event)}
          disabled={isAdmin}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg shadow-red-500/30 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isAdmin ? 'Admin cannot place bets' : 'Place Bet'}
        </button>
      </div>

      <div className="absolute -bottom-1 -right-1 text-red-500/5 dark:text-red-500/10 -z-10">
        <Icon icon={event.icon} className="w-24 h-24" />
      </div>
    </div>
  );
};

export default ExtremeEventCard;