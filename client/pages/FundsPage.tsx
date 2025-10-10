import React, { useState } from 'react';
import { User } from '../types';

interface FundsPageProps {
    user: User;
    onUpdateFunds: (amount: number, type: 'deposit' | 'withdraw') => Promise<string>;
}

export const FundsPage = ({ user, onUpdateFunds }: FundsPageProps) => {
    const [amount, setAmount] = useState('');
    const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const showMessage = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);

        if (isNaN(numAmount) || numAmount <= 0) {
            showMessage("Veuillez entrer un montant valide.");
            return;
        }

        if (action === 'withdraw' && numAmount > user.cash) {
            showMessage("Fonds insuffisants pour ce retrait.");
            return;
        }
        
        setIsLoading(true);
        try {
            const successMessage = await onUpdateFunds(numAmount, action);
            showMessage(successMessage);
            setAmount('');
        } catch (error) {
            showMessage(error instanceof Error ? error.message : "Erreur lors de l'opération.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="funds-page" aria-labelledby="funds-title">
            <h2 id="funds-title">Gérer mes Fonds</h2>
            <div className="funds-container">
                <div className="current-balance">
                    <span className="balance-label">Solde disponible :</span>
                    <span className="balance-value">{user.cash.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</span>
                </div>
                
                <form className="funds-form" onSubmit={handleSubmit}>
                    <div className="form-tabs">
                        <button 
                            type="button"
                            onClick={() => setAction('deposit')} 
                            className={`tab-btn ${action === 'deposit' ? 'tab-btn--active' : ''}`}
                            aria-pressed={action === 'deposit'}
                            disabled={isLoading}
                        >
                            Dépôt
                        </button>
                        <button 
                            type="button"
                            onClick={() => setAction('withdraw')} 
                            className={`tab-btn ${action === 'withdraw' ? 'tab-btn--active' : ''}`}
                            aria-pressed={action === 'withdraw'}
                            disabled={isLoading}
                        >
                            Retrait
                        </button>
                    </div>

                    <div className="form-group">
                        <label htmlFor="amount" className="form-label">Montant</label>
                        <input 
                            type="text" 
                            id="amount" 
                            name="amount"
                            className="form-input"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0.00"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    
                    <button type="submit" className="btn btn--submit" disabled={isLoading}>
                        {isLoading ? 'En cours...' : (action === 'deposit' ? 'Déposer des fonds' : 'Retirer des fonds')}
                    </button>
                    
                    {message && <p className="form-message" aria-live="polite">{message}</p>}
                </form>
            </div>
        </section>
    );
};
