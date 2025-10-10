import React, { useState, useEffect, useRef } from 'react';
import { Stock, Page, User } from '../types';
import { ChangeIcon } from '../components/ChangeIcon';
import { StockChart } from '../components/StockChart';

interface StockDetailPageProps {
    stock: Stock;
    user: User;
    onBack: () => void;
    onNavigate: (page: Page) => void;
    onOpenTradeModal: (stock: Stock, type: 'buy' | 'sell') => void;
}

export const StockDetailPage = ({ stock, user, onBack, onNavigate, onOpenTradeModal }: StockDetailPageProps) => {
    const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'stable'>('stable');
    // Fix: Explicitly initialize useRef with undefined to avoid potential issues with older TypeScript type definitions that may not recognize the no-argument overload.
    const prevPriceRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (prevPriceRef.current !== undefined && prevPriceRef.current !== stock.price) {
            if (stock.price > prevPriceRef.current) {
                setPriceDirection('up');
            } else {
                setPriceDirection('down');
            }
             const timer = setTimeout(() => setPriceDirection('stable'), 500);
             return () => clearTimeout(timer);
        }
        prevPriceRef.current = stock.price;
    }, [stock.price]);

    const getPriceClass = () => {
        switch (priceDirection) {
            case 'up': return 'price-up';
            case 'down': return 'price-down';
            default: return '';
        }
    };

    const isPositive = stock.change >= 0;
    const changeClass = isPositive ? 'stock-detail-page__change--positive' : 'stock-detail-page__change--negative';
    const formattedPrice = stock.price.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' });
    const formattedChange = `${isPositive ? '+' : ''}${stock.change.toFixed(2)}`;
    const formattedChangePercent = `${isPositive ? '+' : ''}${stock.changePercent.toFixed(2)}%`;
    
    const handleAction = (type: 'buy' | 'sell') => {
        if (user.isLoggedIn) {
            onOpenTradeModal(stock, type);
        } else {
            onNavigate('login');
        }
    };
    
    const userShares = user.portfolio[stock.ticker] || 0;

    return (
        <section className="stock-detail-page" aria-labelledby="stock-detail-title">
            <button onClick={onBack} className="btn btn--back">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{transform: 'rotate(180deg)'}}><path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>Retour aux marchés</span>
            </button>
            <header className="stock-detail-page__header">
                <h2 id="stock-detail-title" className="stock-detail-page__name">{stock.name}</h2>
                <span className="stock-detail-page__ticker">{stock.ticker}</span>
                <div className="stock-detail-page__price-line">
                    <p className={`stock-detail-page__price ${getPriceClass()}`}>{formattedPrice}</p>
                </div>
                <div className={`stock-detail-page__change ${changeClass}`}>
                    <ChangeIcon change={stock.change} />
                    <span>{formattedChange} ({formattedChangePercent})</span>
                    <span className="sr-only">sur les dernières 24 heures</span>
                </div>
            </header>
            
            <div className="stock-detail-page__chart-panel">
                <h3>Performance sur le marché</h3>
                <StockChart stock={stock} />
            </div>

            <div className="stock-detail-page__trade-container">
                <h3>Passer un ordre</h3>
                { user.isLoggedIn ? (
                    <div className="trade-actions">
                        <button className="btn btn--buy" onClick={() => handleAction('buy')} disabled={user.cash < stock.price}>Acheter</button>
                        <button className="btn btn--sell" onClick={() => handleAction('sell')} disabled={userShares < 1}>Vendre</button>
                    </div>
                ) : (
                    <p>Veuillez vous <button className="link-button" onClick={() => onNavigate('login')}>connecter</button> pour trader.</p>
                )}
            </div>

            <div className="stock-detail-page__stats">
                <div className="stat-item">
                    <span className="stat-label">Actions échangées (24h)</span>
                    <span className="stat-value">{stock.volumeToday.toLocaleString('fr-FR')}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Volume (24h)</span>
                    <span className="stat-value">{stock.turnoverToday.toLocaleString('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Offre en Circulation</span>
                    <span className="stat-value">{stock.circulatingSupply.toLocaleString('fr-FR')}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Offre Maximale</span>
                    <span className="stat-value">{stock.maxSupply.toLocaleString('fr-FR')}</span>
                </div>
            </div>
            
            <article className="stock-detail-page__description" aria-labelledby="about-stock-title">
                <h3 id="about-stock-title">À Propos de {stock.name}</h3>
                <p>{stock.description}</p>
            </article>

        </section>
    );
};