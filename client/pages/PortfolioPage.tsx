import React, { useMemo, useEffect, useState } from 'react';
import { User, Stock, Page } from '../types';
import * as api from '../services/api';
import { PortfolioChart } from '../components/PortfolioChart';

interface PortfolioPageProps {
  user: User | null;
  stocks: Stock[];
  onNavigate: (page: Page, ticker?: string) => void;
}

export const PortfolioPage = ({ user, stocks, onNavigate }: PortfolioPageProps) => {
  // Keep a local copy of user and stocks so the page can refresh itself
  const [localUser, setLocalUser] = useState<User | null>(user);
  const [localStocks, setLocalStocks] = useState<Stock[]>(stocks);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [u, s] = await Promise.all([api.apiFetchUserData(), api.apiFetchStocks()]);
        if (!mounted) return;
        if (u) setLocalUser(u);
        if (s && s.length) setLocalStocks(s);
      } catch (err) {
        // silent fail — page can continue using props
      }
    };

    // initial load
    load();

    // poll every 5 seconds while mounted
    const id = setInterval(load, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const effectiveUser = localUser ?? user;
  const effectiveStocks = localStocks ?? stocks;

  // Keep local copies in sync immediately when parent props change so
  // the page reflects updates performed at the app level without delay.
  useEffect(() => {
    if (user) setLocalUser(user);
  }, [user]);

  useEffect(() => {
    if (stocks && stocks.length) setLocalStocks(stocks);
  }, [stocks]);

  if (!effectiveUser) return <p>Chargement du portefeuille...</p>;
  const cash = effectiveUser.cash ?? 0;

  // ✅ Calcul des holdings avec valeur actuelle basée sur les prix du marché
  const userHoldings = useMemo(() => {
    return Object.entries(effectiveUser.portfolio ?? {}).map(([ticker, holding]) => {
      // On cast le holding pour que TS reconnaisse quantity et price
      const { quantity, price } = holding as { quantity: number; price: number };

      const stockData = effectiveStocks.find(s => s.ticker === ticker);
      if (!stockData || quantity <= 0) return null;

      return {
        ...stockData,
        quantity,
        currentValue: stockData.price * quantity,
        purchasePrice: price,
      };
    })
    .filter(
      (h): h is Stock & { quantity: number; currentValue: number; purchasePrice: number } => h !== null
    )
    .sort((a, b) => b.currentValue - a.currentValue);
  }, [effectiveUser.portfolio, effectiveStocks]);

  const totalStockValue = useMemo(() => userHoldings.reduce((sum, h) => sum + h.currentValue, 0), [userHoldings]);
  const totalPortfolioValue = useMemo(() => cash + totalStockValue, [cash, totalStockValue]);

  const userHasHoldings = userHoldings.length > 0;

  return (
    <section className="portfolio-page">
      <header className="portfolio-header">
        <h2>Mon Portefeuille</h2>
      </header>

      {/* Graphique dynamique */}
      <PortfolioChart user={user} stocks={stocks} />

      <div className="portfolio-summary">
        <div className="summary-item total">
          <span className="summary-label">Valeur Totale du Portefeuille</span>
          <span className="summary-value">
            {totalPortfolioValue.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Valeur des Actions</span>
          <span className="summary-value">
            {totalStockValue.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Liquidités</span>
          <span className="summary-value">
            {cash.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}
          </span>
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
                role="button"
                tabIndex={0}
                onClick={() => onNavigate('detail', holding.ticker)}
                onKeyPress={e => { if (e.key === 'Enter') onNavigate('detail', holding.ticker); }}
              >
                <div className="holding-item__info">
                  <span className="holding-item__name">{holding.name} ({holding.ticker})</span>
                  <span className="holding-item__quantity">{holding.quantity.toLocaleString('fr-FR')} actions</span>
                </div>
                <div className="holding-item__value">
                  <span className="holding-item__total-value">
                    {holding.currentValue.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}
                  </span>
                  <span className="holding-item__price">
                    @ {holding.purchasePrice.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })} / action
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-holdings">
            <p>Vous ne détenez actuellement aucune action.</p>
            <button className="btn btn--primary" onClick={() => onNavigate('home')}>
              Explorer les marchés
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
