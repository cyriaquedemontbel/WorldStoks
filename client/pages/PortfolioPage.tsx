import React from 'react';
import { User, Stock, Page } from '../types';
import { PortfolioChart } from '../components/PortfolioChart';

interface PortfolioPageProps {
    user: User;
    stocks: Stock[];
    onNavigate: (page: Page, ticker?: string) => void;
}

export const PortfolioPage = ({ user, stocks, onNavigate }: PortfolioPageProps) => {
    const userHoldings = Object.entries(user.portfolio)
        .map(([ticker, quantity]) => {
            const stockData = stocks.find(s => s.ticker === ticker);
            if (!stockData || quantity === 0) return null;
            return {
                ...stockData,
                quantity,
                currentValue: stockData.price * quantity,
            };
        })
        .filter((holding): holding is Stock & { quantity: number; currentValue: number } => holding !== null)
        .sort((a, b) => b.currentValue - a.currentValue);

    const totalStockValue = userHoldings.reduce((acc, holding) => acc + holding.currentValue, 0);
    const totalPortfolioValue = user.cash + totalStockValue;
    const userHasHoldings = userHoldings.length > 0;

    return (
        <section className="portfolio-page">
            <header className="portfolio-header">
                <h2>Mon Portefeuille</h2>
            </header>

            <PortfolioChart user={user} stocks={stocks} />

            <div className="portfolio-summary">
                <div className="summary-item total">
                    <span className="summary-label">Valeur Totale du Portefeuille</span>
                    <span className="summary-value">{totalPortfolioValue.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Valeur des Actions</span>
                    <span className="summary-value">{totalStockValue.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Liquidités</span>
                    <span className="summary-value">{user.cash.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</span>
                </div>
            </div>

            <div className="portfolio-holdings">
                <h3>Mes Actifs</h3>
                {userHasHoldings ? (
                    <div className="holdings-list">
                        {userHoldings.map(holding => (
                            <div 
                                key={holding.ticker} 
                                className="holding-item"
                                onClick={() => onNavigate('detail', holding.ticker)}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => { if(e.key === 'Enter') onNavigate('detail', holding.ticker) }}
                            >
                                <div className="holding-item__info">
                                    <span className="holding-item__name">{holding.name} ({holding.ticker})</span>
                                    <span className="holding-item__quantity">{holding.quantity.toLocaleString('fr-FR')} actions</span>
                                </div>
                                <div className="holding-item__value">
                                    <span className="holding-item__total-value">{holding.currentValue.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</span>
                                    <span className="holding-item__price">@ {holding.price.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })} / action</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-holdings">
                        <p>Vous ne détenez actuellement aucune action.</p>
                        <button className="btn btn--primary" onClick={() => onNavigate('home')}>Explorer les marchés</button>
                    </div>
                )}
            </div>
        </section>
    );
};