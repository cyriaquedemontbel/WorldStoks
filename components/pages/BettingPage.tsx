import React, { useState, useEffect, useRef } from 'react';
import { DailyMarket, User, WeatherEvent, Market, Selection, BetSelection, Page, PlacedBet } from '../../types';
import LoadingSpinner from '../LoadingSpinner';
import { Icon } from '../Icon';
import { generateEventHeaderAndInitialMarkets, generateAdditionalMarkets, getUpdatedOdds } from '../../services/geminiService';


interface BettingPageProps {
    market: DailyMarket;
    user: User | null;
    updateUser: (user: User) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    navigateTo: (page: Page) => void;
}

const BettingPage: React.FC<BettingPageProps> = ({ market: initialMarket, user, updateUser, addToast, navigateTo }) => {
  const [event, setEvent] = useState<WeatherEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStreamingMore, setIsStreamingMore] = useState(false);
  const [stake, setStake] = useState<string>('10');
  const [betSlip, setBetSlip] = useState<BetSelection[]>([]);
  
  const [isUpdatingOdds, setIsUpdatingOdds] = useState<string | null>(null); // marketId being updated
  const [updatedMarketInfo, setUpdatedMarketInfo] = useState<{ marketId: string; selectionUpdates: Record<string, number> } | null>(null);

  useEffect(() => {
    const generateEvent = async () => {
      setLoading(true);
      try {
        // Step 1: Fast initial load
        const initialEvent = await generateEventHeaderAndInitialMarkets(initialMarket);
        setEvent(initialEvent);
        setLoading(false); // Render the page immediately
        setIsStreamingMore(true);

        // Step 2: Load additional markets in the background
        const additionalMarkets = await generateAdditionalMarkets(initialEvent);
        setEvent(prevEvent => {
            if (!prevEvent) return null;
            // Create a Set of existing market IDs to avoid duplicates
            const existingMarketIds = new Set(prevEvent.markets.map(m => m.id));
            // Filter out any potential duplicates from the additional markets
            const uniqueAdditionalMarkets = additionalMarkets.filter(m => !existingMarketIds.has(m.id));
            return {
                ...prevEvent,
                markets: [...prevEvent.markets, ...uniqueAdditionalMarkets]
            };
        });

      } catch (err) {
        console.error("Failed to generate event from Gemini:", err);
        addToast("Could not generate event markets. Please try again.", 'error');
        navigateTo('DailyMarkets');
      } finally {
        setIsStreamingMore(false);
      }
    };
    generateEvent();
  }, [initialMarket, addToast, navigateTo]);

  const handleUpdateOdds = async (marketToUpdate: Market) => {
    setIsUpdatingOdds(marketToUpdate.id);
    try {
        const newOddsData = await getUpdatedOdds(marketToUpdate);
        
        const selectionUpdates: Record<string, number> = {};
        marketToUpdate.selections.forEach(sel => {
            selectionUpdates[sel.id] = sel.odds; // Store old odds
        });

        setEvent(prevEvent => {
            if (!prevEvent) return null;
            return {
                ...prevEvent,
                markets: prevEvent.markets.map(m => {
                    if (m.id === marketToUpdate.id) {
                        return {
                            ...m,
                            selections: m.selections.map(sel => {
                                const newOddInfo = newOddsData.find(no => no.id === sel.id);
                                return newOddInfo ? { ...sel, odds: newOddInfo.odds } : sel;
                            })
                        };
                    }
                    return m;
                })
            };
        });
        
        setUpdatedMarketInfo({ marketId: marketToUpdate.id, selectionUpdates });
        addToast(`Odds for "${marketToUpdate.name}" have been updated!`, 'success');
        
        // Clear the visual update indicator after a few seconds
        setTimeout(() => setUpdatedMarketInfo(null), 5000);

    } catch (error) {
        console.error("Failed to update odds:", error);
        addToast("Could not fetch the latest odds.", "error");
    } finally {
        setIsUpdatingOdds(null);
    }
  };

  const handleSelectSelection = (event: WeatherEvent, market: Market, selection: Selection) => {
    setBetSlip(prev => {
        const existingSelection = prev.find(s => s.selectionId === selection.id);
        if (existingSelection) {
            return prev.filter(s => s.selectionId !== selection.id);
        }
        const existingFromMarket = prev.find(s => s.marketId === market.id);
        if (existingFromMarket) {
            // Replace selection from the same market
            const filtered = prev.filter(s => s.marketId !== market.id);
            return [...filtered, { 
                selectionId: selection.id, 
                selectionName: selection.name, 
                odds: selection.odds, 
                marketId: market.id, 
                marketName: market.name,
                eventName: event.name,
                eventLocation: event.location,
                eventDate: event.date
            }];
        }
        return [...prev, { 
            selectionId: selection.id, 
            selectionName: selection.name, 
            odds: selection.odds, 
            marketId: market.id, 
            marketName: market.name,
            eventName: event.name,
            eventLocation: event.location,
            eventDate: event.date
        }];
    });
  };

  const handleRemoveSelection = (selectionId: string) => {
    setBetSlip(prev => prev.filter(s => s.selectionId !== selectionId));
  };
  
  const handleClearBetSlip = () => {
    setBetSlip([]);
  };

  const handlePlaceBet = () => {
    if (!user) {
        addToast('You must be logged in to place a bet.', 'error');
        navigateTo('Login');
        return;
    }
    const stakeValue = parseFloat(stake);
    if (isNaN(stakeValue) || stakeValue <= 0) {
        addToast('Please enter a valid stake amount.', 'error');
        return;
    }
    if (stakeValue > user.balance) {
        addToast('Insufficient balance.', 'error');
        return;
    }

    const combinedOdds = betSlip.reduce((acc, sel) => acc * sel.odds, 1);
    const potentialWinnings = stakeValue * combinedOdds;

    const newBet: PlacedBet = {
        id: `combo-${Date.now()}`,
        selections: betSlip,
        stake: stakeValue,
        combinedOdds,
        potentialWinnings,
        status: 'Active',
        betType: 'Combined',
    };

    const updatedUser: User = {
        ...user,
        balance: user.balance - stakeValue,
        bets: [newBet, ...user.bets],
    };

    updateUser(updatedUser);
    addToast(`Combined bet placed successfully!`, 'success');
    navigateTo('MyBets');
  };

  const combinedOdds = betSlip.reduce((acc, sel) => acc * sel.odds, 1);
  const potentialWinnings = (parseFloat(stake) || 0) * combinedOdds;

  if (loading) {
    return <div className="flex flex-col justify-center items-center py-20 gap-4">
        <LoadingSpinner />
        <p className="text-text-secondary dark:text-text-secondary-dark">Generating event markets with Gemini...</p>
    </div>;
  }

  if (!event) {
    return <div className="text-center py-20">Could not load the event. Please go back and try again.</div>;
  }

  return (
    <div className="animate-fade-in max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-9 space-y-4">
        <header className="bg-surface dark:bg-slate-800 p-4 rounded-xl shadow-lg">
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">{event.name}</h1>
            <p className="font-semibold text-primary dark:text-primary-dark">{event.location}</p>
        </header>
        
        {event.markets.map(market => {
            const isCurrentlyUpdating = isUpdatingOdds === market.id;
            const wasJustUpdated = updatedMarketInfo?.marketId === market.id;
            return (
                <div key={market.id} className="bg-surface dark:bg-slate-800 p-4 rounded-xl shadow-lg animate-fade-in">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-lg">{market.name}</h3>
                        <button 
                            onClick={() => handleUpdateOdds(market)}
                            disabled={isCurrentlyUpdating}
                            className="flex items-center gap-2 text-xs font-semibold text-primary dark:text-primary-dark hover:bg-primary/10 py-1 px-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait"
                        >
                             {isCurrentlyUpdating ? (
                                <div className="w-4 h-4 border-2 border-primary border-dashed rounded-full animate-spin border-t-transparent"></div>
                             ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 4L13 11M4 20l7-7" /></svg>
                             )}
                            <span>{isCurrentlyUpdating ? "Updating..." : "Actualiser les cotes"}</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {market.selections.map(selection => {
                            const isSelected = betSlip.some(s => s.selectionId === selection.id);
                            const oldOdds = wasJustUpdated ? updatedMarketInfo!.selectionUpdates[selection.id] : undefined;
                            const oddsChanged = oldOdds !== undefined && oldOdds !== selection.odds;
                            return (
                                <div key={selection.id} className="flex items-center justify-between p-2 rounded bg-slate-100 dark:bg-slate-700/50">
                                    <span className="text-sm font-semibold pr-4">{selection.name}</span>
                                    <button
                                        onClick={() => handleSelectSelection(event, market, selection)}
                                        className={`w-28 h-10 flex items-center justify-center font-bold text-sm rounded transition-all duration-200 ${
                                            isSelected
                                            ? 'bg-primary text-white'
                                            : 'bg-yellow-400/50 hover:bg-yellow-400/80 text-slate-800 dark:text-slate-200'
                                        }`}
                                    >
                                    {oddsChanged ? (
                                        <span className="flex items-center gap-2 animate-fade-in-fast">
                                            <span className="line-through opacity-60">{oldOdds?.toFixed(2)}</span>
                                            <span className={selection.odds > oldOdds! ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                                {selection.odds.toFixed(2)}
                                            </span>
                                        </span>
                                    ) : (
                                        selection.odds.toFixed(2)
                                    )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )
        })}
        {isStreamingMore && (
            <div className="flex justify-center items-center gap-3 p-4 bg-surface dark:bg-slate-800 rounded-xl shadow-lg">
                <div className="w-5 h-5 border-2 border-primary border-dashed rounded-full animate-spin border-t-transparent"></div>
                <p className="text-text-secondary dark:text-text-secondary-dark font-semibold">Loading more markets...</p>
            </div>
        )}
      </div>

      <aside className="lg:col-span-3 h-fit sticky top-24">
        <div className="bg-surface dark:bg-slate-800 p-4 rounded-xl shadow-lg">
            <h2 className="text-lg font-bold mb-4 border-b border-border-color dark:border-border-color-dark pb-2">YOUR BET SLIP</h2>
            {betSlip.length === 0 ? (
                <p className="text-center text-text-secondary dark:text-text-secondary-dark py-8">Your slip is empty. Click an odd to add a bet.</p>
            ) : (
                <div className="space-y-3">
                    {betSlip.map(sel => (
                        <div key={sel.selectionId} className="bg-slate-100 dark:bg-slate-700/50 p-2 rounded">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-bold">{sel.selectionName}</p>
                                <button onClick={() => handleRemoveSelection(sel.selectionId)} className="text-red-500 hover:text-red-700 text-xs font-bold">X</button>
                            </div>
                            <p className="text-xs text-text-secondary dark:text-text-secondary-dark">{sel.marketName}</p>
                            <p className="text-right font-bold text-primary dark:text-primary-dark">{sel.odds.toFixed(2)}</p>
                        </div>
                    ))}
                     <button onClick={handleClearBetSlip} className="text-xs text-red-500 hover:underline">Clear Slip</button>
                    <hr className="border-border-color dark:border-border-color-dark my-2"/>
                    <div className="space-y-2 text-sm">
                         <div className="flex justify-between font-semibold">
                            <span>{betSlip.length} Selections</span>
                            <span>Total Odds: <span className="text-primary dark:text-primary-dark">{combinedOdds.toFixed(2)}</span></span>
                        </div>
                        <div>
                            <label htmlFor="stake" className="font-semibold">Stake ($)</label>
                             <input
                                type="number"
                                id="stake"
                                value={stake}
                                onChange={(e) => setStake(e.target.value)}
                                className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-900 border border-border-color dark:border-border-color-dark rounded-md"
                                placeholder="10"
                            />
                        </div>
                         <div className="flex justify-between font-bold text-base pt-2">
                            <span>Potential Winnings</span>
                            <span className="text-green-600 dark:text-green-400">${potentialWinnings.toFixed(2)}</span>
                        </div>
                    </div>
                     <button
                        onClick={handlePlaceBet}
                        disabled={!user || betSlip.length === 0}
                        className="w-full mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-all disabled:bg-slate-400 disabled:cursor-not-allowed"
                     >
                        {user ? "Place Bet" : "Log in to place bet"}
                    </button>
                </div>
            )}
        </div>
      </aside>
    </div>
  );
};

export default BettingPage;