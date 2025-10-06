import React from 'react';
import { DailyMarket } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { Icon } from './Icon';

interface AnalysisModalProps {
  market: DailyMarket;
  analysis: string;
  isLoading: boolean;
  onClose: () => void;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ market, analysis, isLoading, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-surface dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-lg p-8 m-4 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 pb-4 border-b border-border-color dark:border-border-color-dark">
          <div className="bg-primary/10 dark:bg-primary-dark/20 p-3 rounded-lg flex-shrink-0">
            <Icon icon={market.icon} className="w-8 h-8 text-primary dark:text-primary-dark" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">{market.event}</h2>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark">{market.location} - {market.date}</p>
          </div>
        </div>

        <div className="min-h-[100px] flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
                <LoadingSpinner />
                <p className="text-text-secondary dark:text-text-secondary-dark">Analyzing with Gemini...</p>
            </div>
          ) : (
            <p className="text-text-primary dark:text-text-primary-dark text-base whitespace-pre-wrap">{analysis}</p>
          )}
        </div>

        <button 
          onClick={onClose} 
          className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold py-2.5 px-4 rounded-lg transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AnalysisModal;
