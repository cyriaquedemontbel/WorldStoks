import React, { useState, useEffect } from 'react';
import { Stock, User } from '../types';

interface TradeModalProps {
    user: User;
    stock: Stock;
    type: 'buy' | 'sell';
    onClose: () => void;
    onConfirm: (ticker: string, quantity: number) => void;
}

export const TradeModal = ({ user, stock, type, onClose, onConfirm }: TradeModalProps) => {
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        setQuantity(value > 0 ? value : 1);
    };

    const totalValue = stock.price * quantity;
    const userShares = user.portfolio[stock.ticker] || 0;
    const availableToBuy = stock.maxSupply - stock.circulatingSupply;

    const isBuyDisabled = type === 'buy' && (totalValue > user.cash || quantity <= 0 || quantity > availableToBuy);
    const isSellDisabled = type === 'sell' && (quantity > userShares || quantity <= 0);
    const isConfirmDisabled = isBuyDisabled || isSellDisabled;

    const title = type === 'buy' ? `Acheter ${stock.name}` : `Vendre ${stock.name}`;
    // Fix: Used double quotes for the string to fix syntax error caused by the unescaped apostrophe in "l'Achat".
    const confirmButtonText = type === 'buy' ? "Confirmer l'Achat" : "Confirmer la Vente";
    const confirmButtonClass = type === 'buy' ? 'btn--buy' : 'btn--sell';

    const infoLabel = type === 'buy' ? 'Votre solde' : 'Vos actions';
    const infoValue = type === 'buy'
        ? user.cash.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })
        : userShares.toLocaleString('fr-FR');
        
    const totalLabel = type === 'buy' ? 'Coût total estimé' : 'Revenu total estimé';

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="trade-modal-title">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <header className="modal-header">
                    <h3 id="trade-modal-title">{title}</h3>
                    <button className="close-button" onClick={onClose} aria-label="Fermer">&times;</button>
                </header>
                <div className="modal-body">
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Prix par action</span>
                            <span className="info-value">{stock.price.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">{infoLabel}</span>
                            <span className="info-value">{infoValue}</span>
                        </div>
                    </div>

                    <div className="form-group">
                         <label className="form-label" htmlFor="quantity">Quantité</label>
                         <div className="quantity-section">
                             <button className="btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
                             <input
                                id="quantity"
                                type="number"
                                value={quantity}
                                onChange={handleQuantityChange}
                                min="1"
                                max={type === 'buy' ? availableToBuy : userShares}
                                className="form-input quantity-input"
                                aria-label="Quantité"
                             />
                             <button className="btn" onClick={() => setQuantity(q => q + 1)}>+</button>
                         </div>
                         {type === 'buy' && (
                             <small className="form-text text-muted" style={{textAlign: 'center', display: 'block', marginTop: '0.5rem'}}>
                                {availableToBuy.toLocaleString('fr-FR')} actions disponibles à l'achat.
                             </small>
                         )}
                    </div>
                   
                    <div className="total-value-section">
                        <span className="total-value-label">{totalLabel}</span>
                        <p className="total-value">{totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</p>
                    </div>
                </div>
                <footer className="modal-footer">
                    <button className="btn btn--secondary" onClick={onClose}>Annuler</button>
                    <button 
                        className={`btn ${confirmButtonClass}`}
                        onClick={() => onConfirm(stock.ticker, quantity)}
                        disabled={isConfirmDisabled}
                    >
                        {confirmButtonText}
                    </button>
                </footer>
            </div>
        </div>
    );
};