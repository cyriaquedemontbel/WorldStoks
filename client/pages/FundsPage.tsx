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
        <section className="funds-page-container" aria-labelledby="funds-title">
            <header className="funds-title" id="funds-title">Fonds&nbsp;<span style={{fontWeight:400,opacity:0.7}}>FND</span></header>
            <div className="funds-card">
                <div className="funds-balance-group">
                    <span className="funds-balance-label">Solde disponible :</span>
                    <span className="funds-balance-value">{user.cash.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</span>
                </div>
                <div className="funds-tabs">
                    <button 
                        type="button"
                        onClick={() => setAction('deposit')} 
                        className={`funds-tab-btn${action === 'deposit' ? ' active' : ''}`}
                        aria-pressed={action === 'deposit'}
                        disabled={isLoading}
                    >
                        Dépôt
                    </button>
                    <button 
                        type="button"
                        onClick={() => setAction('withdraw')} 
                        className={`funds-tab-btn${action === 'withdraw' ? ' active' : ''}`}
                        aria-pressed={action === 'withdraw'}
                        disabled={isLoading}
                    >
                        Retrait
                    </button>
                </div>
                <form className="funds-form" onSubmit={handleSubmit}>
                    <div className="funds-form-group">
                        <label htmlFor="amount" className="funds-form-label">Montant</label>
                        <input 
                            type="text" 
                            id="amount" 
                            name="amount"
                            className="funds-form-input"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0.00"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <button type="submit" className="funds-submit-btn" disabled={isLoading}>
                        {isLoading ? 'En cours...' : (action === 'deposit' ? 'Déposer des fonds' : 'Retirer des fonds')}
                    </button>
                    {message && <p className="funds-form-message" aria-live="polite">{message}</p>}
                </form>
            </div>
        </section>
    );
};
