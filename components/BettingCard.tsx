import React from 'react';
import { DailyMarket, User } from '../types';
import { Icon } from './Icon';

interface BettingCardProps {
  market: DailyMarket;
  onPlaceBet: (market: DailyMarket) => void;
  currentUser: User | null;
  onAnalyze: (market: DailyMarket) => void;
}

const BettingCard: React.FC<BettingCardProps> = ({ market, onPlaceBet, currentUser, onAnalyze }) => {
  const isAdmin = currentUser?.isAdmin || false;

  const getBetTypeDescription = () => {
    switch(market.betType) {
        case 'OverUnder':
            return 'Over/Under Bet';
        case 'ExactValue':
            return `Predict the Exact ${market.event.includes('Temperature') ? 'Temperature' : market.event.includes('Wind') ? 'Wind Speed' : 'Rainfall'}`;
        default:
            return 'View Bet';
    }
  }

  return (
    <div className="bg-surface dark:bg-surface-dark p-6 rounded-2xl shadow-lg border border-border-color/50 dark:border-border-color-dark/50 flex flex-col justify-between transition-transform hover:scale-[1.02] hover:shadow-xl">
      <div>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">{market.location} - {market.date}</p>
            <h3 className="text-lg font-bold text-text-primary dark:text-text-primary-dark mt-1">{market.event}</h3>
          </div>
          <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full">
            <Icon icon={market.icon} className="w-6 h-6 text-primary dark:text-primary-dark" />
          </div>
        </div>

        <div className="mt-6 p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 text-center">
            <p className="font-semibold text-text-primary dark:text-text-primary-dark">{getBetTypeDescription()}</p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <button
          onClick={() => onPlaceBet(market)}
          disabled={isAdmin}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg shadow-primary/30 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isAdmin ? 'Admin cannot place bets' : 'Place Bet'}
        </button>
        <button
          onClick={() => onAnalyze(market)}
          className="w-full text-sm text-primary dark:text-primary-dark hover:bg-primary/10 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Gemini Insight
        </button>
      </div>
    </div>
  );
};

export default BettingCard;