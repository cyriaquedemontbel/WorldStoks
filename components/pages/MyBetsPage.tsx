
import React, { useEffect, useCallback } from 'react';
import { User, Page, Bet, PlacedBet } from '../../types';
import BetSlipCard from '../BetSlipCard';
import { getWeatherOutcome } from '../../services/weatherService';

// Type guard to differentiate bet types
function isPlacedBet(bet: Bet | PlacedBet): bet is PlacedBet {
    return (bet as PlacedBet).betType === 'Combined';
}

interface MyBetsPageProps {
  user: User | null;
  updateUser: (user: User) => void;
  navigateTo: (page: Page) => void;
}

const MyBetsPage: React.FC<MyBetsPageProps> = ({ user, updateUser, navigateTo }) => {

  const settlePastBets = useCallback(async (currentUser: User) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const betsToSettle = currentUser.bets.filter(bet => {
      if (bet.status !== 'Active') return false;
      try {
        const betDateStr = isPlacedBet(bet) ? bet.selections[0].eventDate : bet.market.date;
        const betDate = new Date(betDateStr);
        return betDate < today;
      } catch (e) {
        return false; 
      }
    });

    if (betsToSettle.length === 0) return;

    let balanceChange = 0;
    const settledBetIds = new Set<string>();

    for (const bet of betsToSettle) {
        let overallWin = false;

        if (isPlacedBet(bet)) {
            // --- Settle Combined Bet ---
            const selectionOutcomes = await Promise.all(
                bet.selections.map(sel => getWeatherOutcome({
                    event: sel.marketName,
                    location: sel.eventLocation,
                    date: sel.eventDate
                }))
            );
            
            let allSelectionsWon = true;
            for (let i = 0; i < bet.selections.length; i++) {
                const selection = bet.selections[i];
                const outcome = selectionOutcomes[i];
                let selectionWon = false;
                
                // This is simplified win logic for Over/Under text match.
                // A more robust solution would parse numbers.
                const actualResultValue = parseFloat(outcome.actualResult);
                const thresholdMatch = selection.selectionName.match(/[\d.]+/);

                if (thresholdMatch && !isNaN(actualResultValue)) {
                    const threshold = parseFloat(thresholdMatch[0]);
                    if (selection.selectionName.toLowerCase().includes('over') || selection.selectionName.toLowerCase().includes('above')) {
                        selectionWon = actualResultValue > threshold;
                    } else { // Assumes under/below
                        selectionWon = actualResultValue < threshold;
                    }
                } else {
                    selectionWon = selection.selectionName === outcome.actualResult;
                }

                if (!selectionWon) {
                    allSelectionsWon = false;
                    break; 
                }
            }
            overallWin = allSelectionsWon;

        } else {
            // --- Settle Single Bet ---
            const outcome = await getWeatherOutcome(bet.market);
            let isWin = false;
            const actualResultValue = parseFloat(outcome.actualResult);

            if (bet.market.betType === 'OverUnder') {
                const thresholdMatch = bet.selectedOption.match(/[\d.]+/);
                if (thresholdMatch && !isNaN(actualResultValue)) {
                    const threshold = parseFloat(thresholdMatch[0]);
                    if (bet.selectedOption.toLowerCase().includes('over') || bet.selectedOption.toLowerCase().includes('above')) {
                        isWin = actualResultValue > threshold;
                    } else {
                        isWin = actualResultValue < threshold;
                    }
                } else {
                    isWin = bet.selectedOption === outcome.actualResult;
                }
            } else if (bet.market.betType === 'ExactValue') {
                if (bet.userPrediction !== undefined && !isNaN(actualResultValue)) {
                    const step = bet.market.range.step;
                    const roundedResult = Math.round(actualResultValue / step) * step;
                    isWin = roundedResult === bet.userPrediction;
                }
            }
            
            // Assign actualResult to the single bet
            bet.actualResult = outcome.actualResult;
            overallWin = isWin;
        }

        if (overallWin) {
            balanceChange += bet.potentialWinnings;
            bet.status = 'Won';
        } else {
            bet.status = 'Lost';
        }
        settledBetIds.add(bet.id);
    }
    
    const updatedBets = currentUser.bets.map(b => settledBetIds.has(b.id) ? betsToSettle.find(sb => sb.id === b.id) || b : b);

    const updatedUser: User = {
        ...currentUser,
        balance: currentUser.balance + balanceChange,
        bets: updatedBets as (Bet | PlacedBet)[],
    };
    updateUser(updatedUser);

  }, [updateUser]);

  useEffect(() => {
    if (user) {
      settlePastBets(user);
    }
  }, [user, settlePastBets]);


  if (!user) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
        <p className="mb-6">You need to be logged in to view your bets.</p>
        <button onClick={() => navigateTo('Login')} className="bg-primary text-white font-bold py-2 px-6 rounded-lg">
          Log In
        </button>
      </div>
    );
  }

  const activeBets = user.bets.filter(b => b.status === 'Active');
  const pastBets = user.bets.filter(b => b.status !== 'Active').sort((a,b) => {
    const dateA = new Date(isPlacedBet(a) ? a.selections[0].eventDate : a.market.date);
    const dateB = new Date(isPlacedBet(b) ? b.selections[0].eventDate : b.market.date);
    return dateB.getTime() - dateA.getTime();
  });


  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary dark:text-text-primary-dark">My Bets</h1>
        <p className="mt-4 text-lg text-text-secondary dark:text-text-secondary-dark">Track your active bets and view your betting history.</p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-6 border-b-2 border-primary dark:border-primary-dark pb-2">Active Bets</h2>
          {activeBets.length > 0 ? (
            <div className="space-y-6">
              {activeBets.map(bet => (
                <BetSlipCard key={bet.id} bet={bet} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-surface dark:bg-surface-dark rounded-xl border border-border-color/50 dark:border-border-color-dark/50">
              <p className="text-text-secondary dark:text-text-secondary-dark">You have no active bets.</p>
              <button onClick={() => navigateTo('DailyMarkets')} className="mt-4 bg-primary text-white font-bold py-2 px-5 rounded-lg">
                Browse Markets
              </button>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-6 border-b-2 border-border-color dark:border-border-color-dark pb-2">Past Bets</h2>
          {pastBets.length > 0 ? (
            <div className="space-y-6">
              {pastBets.map(bet => (
                <BetSlipCard key={bet.id} bet={bet} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-surface dark:bg-surface-dark rounded-xl border border-border-color/50 dark:border-border-color-dark/50">
              <p className="text-text-secondary dark:text-text-secondary-dark">You have no past bets.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MyBetsPage;
