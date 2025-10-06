import React from 'react';
import { Icon } from '../Icon';
import { Page } from '../../types';

interface HowItWorksPageProps {
  navigateTo: (page: Page) => void;
}

const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ navigateTo }) => {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-text-primary dark:text-text-primary-dark mb-12">
        How SkyBet Works
      </h1>

      <div className="space-y-10">
        
        <div className="flex flex-col md:flex-row items-center gap-8 bg-surface dark:bg-surface-dark p-8 rounded-xl shadow-lg border border-border-color/50 dark:border-border-color-dark/50">
          <div className="flex-shrink-0 bg-primary/10 dark:bg-primary/20 p-6 rounded-full">
            <Icon icon="sun" className="w-16 h-16 text-primary-dark" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2 text-text-primary dark:text-text-primary-dark">1. Explore Weather Markets</h2>
            <p className="text-text-secondary dark:text-text-secondary-dark">
              Use our interactive world map on the homepage to discover betting markets from all over the globe. Click anywhere on the map and adjust the search radius to find daily markets and long-range extreme event forecasts for that area. You can also visit the dedicated pages for a full list of all available markets.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row-reverse items-center gap-8 bg-surface dark:bg-surface-dark p-8 rounded-xl shadow-lg border border-border-color/50 dark:border-border-color-dark/50">
          <div className="flex-shrink-0 bg-primary/10 dark:bg-primary/20 p-6 rounded-full">
            <Icon icon="temperature" className="w-16 h-16 text-primary-dark" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2 text-text-primary dark:text-text-primary-dark">2. Analyze the Odds</h2>
            <p className="text-text-secondary dark:text-text-secondary-dark">
              Each betting card clearly displays the event, location, and the two possible outcomes with their associated odds. Our odds are dynamically generated to reflect the likelihood of each weather outcome. Higher odds mean a less likely event but a bigger potential payout.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 bg-surface dark:bg-surface-dark p-8 rounded-xl shadow-lg border border-border-color/50 dark:border-border-color-dark/50">
          <div className="flex-shrink-0 bg-primary/10 dark:bg-primary/20 p-6 rounded-full">
            <Icon icon="storm" className="w-16 h-16 text-primary-dark" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2 text-text-primary dark:text-text-primary-dark">3. Place Your Bet</h2>
            <p className="text-text-secondary dark:text-text-secondary-dark">
              Once you've made your prediction, simply click "Place Bet" and enter your stake. You'll need to sign up for an account and deposit funds to get started. All bets are settled once the official weather data for the event date is confirmed.
            </p>
          </div>
        </div>

      </div>

      <div className="text-center mt-16 p-6 bg-sky-100 dark:bg-slate-800/50 rounded-lg border border-sky-200 dark:border-slate-700">
        <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2">Ready to Get Started?</h3>
        <p className="text-text-secondary dark:text-text-secondary-dark mb-4">Sign up today and make your first weather prediction!</p>
        <button 
          onClick={() => navigateTo('SignUp')}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-6 rounded-lg transition-all shadow-md hover:shadow-lg shadow-primary/30">
            Sign Up Now
        </button>
      </div>

    </div>
  );
};

export default HowItWorksPage;