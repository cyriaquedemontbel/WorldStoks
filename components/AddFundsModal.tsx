import React, { useState } from 'react';
import { User } from '../types';

interface AddFundsModalProps {
  user: User;
  onClose: () => void;
  updateUser: (user: User) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}

const AddFundsModal: React.FC<AddFundsModalProps> = ({ user, onClose, updateUser, addToast }) => {
  const [amount, setAmount] = useState('50.00');
  const [error, setError] = useState('');

  const handleAddFunds = () => {
    setError('');
    const fundAmount = parseFloat(amount);
    if (isNaN(fundAmount) || fundAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (fundAmount > 1000) {
        setError('You can add a maximum of $1,000 at a time.');
        return;
    }
    const updatedUser = { ...user, balance: user.balance + fundAmount };
    updateUser(updatedUser);
    addToast(`$${fundAmount.toFixed(2)} added to your balance.`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
      <div className="bg-surface dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-md p-8 m-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-4">Add Funds</h2>
        <p className="text-text-secondary dark:text-text-secondary-dark mb-6">Enter the amount you'd like to add to your balance.</p>
        
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark">Amount</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="amount"
              id="amount"
              className="w-full px-4 py-2.5 pl-7 bg-slate-100 dark:bg-slate-800 border border-border-color dark:border-border-color-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
              placeholder="50.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        
        <div className="mt-8 flex gap-4">
          <button onClick={onClose} className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold py-2.5 px-4 rounded-lg transition-all">
            Cancel
          </button>
          <button onClick={handleAddFunds} className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-4 rounded-lg transition-all">
            Add Funds
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFundsModal;
