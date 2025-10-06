
import React from 'react';
import { Bet, PlacedBet } from '../types';
import { Icon } from './Icon';

interface BetSlipCardProps {
  bet: Bet | PlacedBet;
}

// Type guard to differentiate bet types
function isPlacedBet(bet: Bet | PlacedBet): bet is PlacedBet {
    return (bet as PlacedBet).betType === 'Combined';
}

const StatusBadge: React.FC<{ status: Bet['status'], winnings?: number }> = ({ status, winnings }) => {
    const baseClasses = "font-bold text-xs uppercase px-3 py-1 rounded-full";
    switch (status) {
        case 'Active':
            return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300`}>Active</span>;
        case 'Won':
            return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300`}>Won (+${winnings?.toFixed(2)})</span>;
        case 'Lost':
            return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300`}>Lost</span>;
        default:
            return null;
    }
};

const BetSlipCard: React.FC<BetSlipCardProps> = ({ bet }) => {
  if (isPlacedBet(bet)) {
    // Render logic for a combined bet (PlacedBet)
    const firstSelection = bet.selections[0];
    return (
      <div className="bg-surface dark:bg-surface-dark p-5 rounded-xl shadow-lg border border-border-color/50 dark:border-border-color-dark/50 transition-all">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4 flex-1">
                <div className="bg-primary/10 dark:bg-primary-dark/20 p-3 rounded-lg">
                    <Icon icon="ticket" className="w-6 h-6 text-primary dark:text-primary-dark" />
                </div>
                <div>
                    <p className="font-bold text-text-primary dark:text-text-primary-dark">Combined Bet ({bet.selections.length} selections)</p>
                    <p className="text-sm text-text-secondary dark:text-text-secondary-dark">{firstSelection.eventName} - {firstSelection.eventDate}</p>
                </div>
            </div>
            <div className="sm:text-right">
                <StatusBadge status={bet.status} winnings={bet.potentialWinnings} />
            </div>
        </div>
        <div className="space-y-2 border-t border-border-color dark:border-border-color-dark pt-3">
            {bet.selections.map(sel => (
                <div key={sel.selectionId} className="text-sm flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-text-primary dark:text-text-primary-dark">{sel.selectionName}</p>
                        <p className="text-xs text-text-secondary dark:text-text-secondary-dark">{sel.marketName}</p>
                    </div>
                    <p className="font-bold">@{sel.odds.toFixed(2)}</p>
                </div>
            ))}
        </div>
         <div className="border-t border-border-color dark:border-border-color-dark mt-3 pt-3 flex justify-between items-center">
             <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                Stake / To Win: <span className="font-bold text-text-primary dark:text-text-primary-dark">${bet.stake.toFixed(2)} / <span className="text-green-600 dark:text-green-400">${bet.potentialWinnings.toFixed(2)}</span></span>
             </p>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                Total Odds: <span className="font-bold text-primary dark:text-primary-dark">@{bet.combinedOdds.toFixed(2)}</span>
            </p>
        </div>
      </div>
    );
  }

  // Original render logic for a single bet (Bet)
  return (
    <div className="bg-surface dark:bg-surface-dark p-5 rounded-xl shadow-lg border border-border-color/50 dark:border-border-color-dark/50 transition-all">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        {/* Market Info */}
        <div className="flex items-center gap-4 flex-1">
          <div className="bg-primary/10 dark:bg-primary-dark/20 p-3 rounded-lg">
            <Icon icon={bet.market.icon} className="w-6 h-6 text-primary dark:text-primary-dark" />
          </div>
          <div>
            <p className="font-bold text-text-primary dark:text-text-primary-dark">{bet.market.event}</p>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark">{bet.market.location} - {bet.market.date}</p>
          </div>
        </div>

        {/* Bet Details */}
        <div className="flex-1 sm:text-center">
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Your Pick</p>
            <p className="font-bold text-text-primary dark:text-text-primary-dark">{bet.selectedOption} @ {bet.odds.toFixed(2)}</p>
        </div>
        
        {/* Actual Result for settled bets */}
        {bet.status !== 'Active' && bet.actualResult && (
            <div className="flex-1 sm:text-center">
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Actual Result</p>
                <p className="font-bold text-primary dark:text-primary-dark">{bet.actualResult}</p>
            </div>
        )}

        {/* Stake and Winnings */}
        <div className="flex-1 sm:text-center">
             <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Stake / To Win</p>
            <p className="font-bold text-text-primary dark:text-text-primary-dark">${bet.stake.toFixed(2)} / <span className="text-green-600 dark:text-green-400">${bet.potentialWinnings.toFixed(2)}</span></p>
        </div>

        {/* Status */}
        <div className="sm:text-right">
            <StatusBadge status={bet.status} winnings={bet.potentialWinnings} />
        </div>
      </div>
    </div>
  );
};

export default BetSlipCard;
