


import OrderBook from '../components/OrderBook';
import OrderForm from '../components/OrderForm';

import React, { useEffect, useState } from 'react';

interface HistoryOrder {
  _id: string;
  type: string;
  pricePerShare: number;
  quantity: number;
  status?: string;
  timestamp: string;
}

const OrdersHistory: React.FC<{ ticker: string }> = ({ ticker }) => {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    fetch(`/api/trades/history/${ticker}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Erreur chargement historique');
        setLoading(false);
      });
  }, [ticker]);

  return (
    <section className="orderbook-history-container" aria-labelledby="orderbook-history-title">
      <header className="orderbook-header">
        <h2 id="orderbook-history-title" className="orderbook-title">Historique des ordres ({ticker})</h2>
      </header>
      {loading && <div>Chargement...</div>}
      {error && <div className="orderform-message orderform-error">{error}</div>}
      {!loading && !error && (
        <table className="orderbook-history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Prix</th>
              <th>Quantité</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>Aucun ordre trouvé</td></tr>
            )}
            {orders.map(order => (
              <tr key={order._id}>
                <td>{new Date(order.timestamp).toLocaleString('fr-FR')}</td>
                <td>{order.type === 'buy' ? 'Achat' : 'Vente'}</td>
                <td>{order.pricePerShare}</td>
                <td>{order.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

const OrderBookMenu: React.FC = () => {
  const [view, setView] = useState<'form' | 'orders' | 'history'>('form');
  const [ticker, setTicker] = useState('APPL');

  return (
    <div className="orderbook-menu-wrapper">
      <header className="orderbook-menu-header">
        <button className={`orderbook-menu-tab${view === 'form' ? ' active' : ''}`} onClick={() => setView('form')}>Formulaire</button>
        <button className={`orderbook-menu-tab${view === 'orders' ? ' active' : ''}`} onClick={() => setView('orders')}>Carnet d'ordre</button>
        <button className={`orderbook-menu-tab${view === 'history' ? ' active' : ''}`} onClick={() => setView('history')}>Historique</button>
      </header>
      <div style={{ margin: '1rem 0', textAlign: 'center' }}>
        <label htmlFor="ticker-select">Sélectionner une action :</label>
        <select id="ticker-select" value={ticker} onChange={e => setTicker(e.target.value)} style={{ marginLeft: '1rem' }}>
          <option value="APPL">APPL</option>
          <option value="GOGL">GOGL</option>
          <option value="AMZN">AMZN</option>
          <option value="TSLA">TSLA</option>
        </select>
      </div>
      <div className="orderbook-menu-content">
        {view === 'form' && <OrderForm ticker={ticker} />}
        {view === 'orders' && <OrderBook ticker={ticker} />}
        {view === 'history' && <OrdersHistory ticker={ticker} />}
      </div>
    </div>
  );
};

export default OrderBookMenu;
