import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stock, User, Page } from '../types';
import { ChangeIcon } from '../components/ChangeIcon';
import { StockChart } from '../components/StockChart';

interface StockDetailPageProps {
  stocks: Stock[];
  user: User;
  onOpenTradeModal: (stock: Stock, type: 'buy' | 'sell', onTradeComplete?: () => void) => void;
}

export const StockDetailPage: React.FC<StockDetailPageProps> = ({ stocks, user, onOpenTradeModal }) => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const stock = stocks.find(s => s.ticker === ticker);

  const [localStock, setLocalStock] = useState<Stock | undefined>(stock);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'stable'>('stable');
  const prevPriceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (stock) setLocalStock(stock);
  }, [stock]);

  // Animation de la direction du prix
  useEffect(() => {
    if (!localStock) return;
    if (prevPriceRef.current !== undefined && prevPriceRef.current !== localStock.price) {
      setPriceDirection(localStock.price > prevPriceRef.current ? 'up' : 'down');
      const timer = setTimeout(() => setPriceDirection('stable'), 500);
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = localStock.price;
  }, [localStock?.price]);

  if (!localStock) return <p>Stock non trouvé.</p>;

  const handleAction = (type: 'buy' | 'sell') => {
    if (user.isLoggedIn) {
      onOpenTradeModal(localStock, type, async () => {
        // Refresh stock après trade
        try {
          const res = await fetch(`http://localhost:5000/api/stocks/${localStock._id}`);
          if (!res.ok) throw new Error('Erreur récupération stock');
          const updatedStock = await res.json();
          setLocalStock(updatedStock);
        } catch (err) {
          console.error(err);
        }
      });
    } else {
      navigate('/login');
    }
  };

  const price = localStock.price ?? 0;
  const previousPrice = prevPriceRef.current ?? price;
  const change = price - previousPrice;
  const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
  const isPositive = change >= 0;
  const availableShares = localStock.circulatingSupply ?? 0;

  const userHolding = user.portfolio?.[localStock.ticker];
  const userShares = userHolding && typeof (userHolding as any).quantity === 'number'
    ? (userHolding as any).quantity
    : 0;

  const formattedPrice = price.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' });
  const formattedChange = `${isPositive ? '+' : ''}${change.toFixed(2)}`;
  const formattedChangePercent = `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`;

  const getPriceClass = () => {
    switch (priceDirection) {
      case 'up': return 'price-up';
      case 'down': return 'price-down';
      default: return '';
    }
  };

  return (
    <section className="stock-detail-page" aria-labelledby="stock-detail-title">
      <button onClick={() => navigate('/')} className="btn btn--back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(180deg)' }}>
          <path d="M5 12H19M19 12L13 6M19 12L13 18"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Retour aux marchés</span>
      </button>

      <header className="stock-detail-page__header">
        <h2 id="stock-detail-title" className="stock-detail-page__name">{localStock.name}</h2>
        <span className="stock-detail-page__ticker">{localStock.ticker}</span>
        <div className="stock-detail-page__price-line">
          <p className={`stock-detail-page__price ${getPriceClass()}`}>{formattedPrice}</p>
        </div>
        <div className={`stock-detail-page__change ${isPositive ? 'stock-detail-page__change--positive' : 'stock-detail-page__change--negative'}`}>
          <ChangeIcon change={change} />
          <span>{formattedChange} ({formattedChangePercent})</span>
          <span className="sr-only">variation depuis la dernière mise à jour</span>
        </div>
      </header>

      <div className="stock-detail-page__chart-panel">
        <h3>Performance sur le marché</h3>
        <StockChart stock={localStock} />
      </div>

      <div className="stock-detail-page__trade-container">
        <h3>Passer un ordre</h3>
        {user.isLoggedIn ? (
          <div className="trade-actions">
            <button className="btn btn--buy" onClick={() => handleAction('buy')} disabled={(user.cash ?? 0) < price || availableShares < 1}>Acheter</button>
            <button className="btn btn--sell" onClick={() => handleAction('sell')} disabled={userShares < 1}>Vendre</button>
          </div>
        ) : (
          <p>Veuillez vous <button className="link-button" onClick={() => navigate('/login')}>connecter</button> pour trader.</p>
        )}
        {availableShares < 1 && <p className="no-available-shares">Aucune action disponible à l'achat</p>}
      </div>

      <div className="stock-detail-page__stats">
        <div className="stat-item">
          <span className="stat-label">Actions échangées (24h)</span>
          <span className="stat-value">{(localStock.volumeToday ?? 0).toLocaleString('fr-FR')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Volume (24h)</span>
          <span className="stat-value">{(localStock.turnoverToday ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Offre en Circulation</span>
          <span className="stat-value">{availableShares.toLocaleString('fr-FR')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Offre Maximale</span>
          <span className="stat-value">{(localStock.maxSupply ?? 0).toLocaleString('fr-FR')}</span>
        </div>
      </div>

      <article className="stock-detail-page__description" aria-labelledby="about-stock-title">
        <h3 id="about-stock-title">À Propos de {localStock.name}</h3>
        <p>{localStock.description}</p>
      </article>
    </section>
  );
};
