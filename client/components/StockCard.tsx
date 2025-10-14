import React from 'react';
import { Stock, User, Page } from '../types';
import { ChangeIcon } from './ChangeIcon';

interface StockCardProps {
  stock: Stock & { change?: number; changePercent?: number };
  user: User;
  onStockSelect: (ticker: string) => void;
  onNavigate: (page: Page) => void;
  onOpenTradeModal: (stock: Stock, type: 'buy' | 'sell') => void;
}

export const StockCard = ({
  stock,
  user,
  onStockSelect,
  onNavigate,
  onOpenTradeModal,
}: StockCardProps) => {
  const price = stock.price ?? 0;
  const change = stock.change ?? 0;
  const changePercent = stock.changePercent ?? 0;
  const isPositive = change >= 0;

  const formattedPrice = price.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' });
  const formattedChange = `${isPositive ? '+' : ''}${change.toFixed(2)}`;
  const formattedChangePercent = `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`;
  const changeClass = isPositive ? 'stock-card__change--positive' : 'stock-card__change--negative';

  const handleAction = (e: React.MouseEvent, type: 'buy' | 'sell') => {
    e.stopPropagation();
    if (user.isLoggedIn) {
      onOpenTradeModal(stock, type);
    } else {
      onNavigate('login');
    }
  };

  const userHolding = user.portfolio?.[stock.ticker];
  const userShares = (userHolding && typeof (userHolding as any).quantity === 'number')
    ? (userHolding as any).quantity
    : 0;

  return (
    <article
      className="stock-card"
      aria-labelledby={`stock-name-${stock.ticker}`}
      onClick={() => onStockSelect(stock.ticker)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => { if (e.key === 'Enter') onStockSelect(stock.ticker); }}
    >
      <div className="stock-card__header">
        <h2 id={`stock-name-${stock.ticker}`} className="stock-card__name">{stock.name}</h2>
        <span className="stock-card__ticker">{stock.ticker}</span>
      </div>

      <div className="stock-card__price-info">
        <p className="stock-card__price">{formattedPrice}</p>
        <div className={`stock-card__change ${changeClass}`}>
          <ChangeIcon change={change} />
          <span>{formattedChange} ({formattedChangePercent})</span>
        </div>
      </div>

      <div className="stock-card__actions">
        <button
          className="btn btn--buy"
          onClick={(e) => handleAction(e, 'buy')}
          aria-label={`Acheter une action de ${stock.name}`}
          disabled={(user.cash ?? 0) < price || (stock.circulatingSupply ?? 0) < 1}
        >
          Acheter
        </button>
        <button
          className="btn btn--sell"
          onClick={(e) => handleAction(e, 'sell')}
          aria-label={`Vendre une action de ${stock.name}`}
          disabled={userShares < 1}
        >
          Vendre
        </button>
      </div>
    </article>
  );
};
