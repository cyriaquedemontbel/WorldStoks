import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { Transaction } from '../types';
// ...existing code...

// Table d'ordres complète pour le tab Carnet d'ordre
function AllOrdersTable({ orders }: { orders: any[] }) {
  return (
    <div className="orders-table-container" style={{ maxWidth: 900, margin: '0 auto', background: '#222', borderRadius: '1rem', boxShadow: '0 2px 16px rgba(0,0,0,0.12)', padding: '2rem' }}>
      <table className="orders-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#f3f3f3' }}>
        <thead>
          <tr style={{ background: '#222', color: '#fff' }}>
            <th style={{ padding: '0.7rem', fontWeight: 600 }}>Date de publication</th>
            <th style={{ padding: '0.7rem', fontWeight: 600 }}>Nom de l'action</th>
            <th style={{ padding: '0.7rem', fontWeight: 600 }}>Ticker</th>
            <th style={{ padding: '0.7rem', fontWeight: 600 }}>Prix</th>
            <th style={{ padding: '0.7rem', fontWeight: 600 }}>Quantité</th>
            <th style={{ padding: '0.7rem', fontWeight: 600 }}>Achat/Vente</th>
            <th style={{ padding: '0.7rem', fontWeight: 600 }}>Restant</th>
            <th style={{ padding: '0.7rem', fontWeight: 600 }}>Statut</th>
            <th style={{ padding: '0.7rem', fontWeight: 600 }}>Utilisateur</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr><td colSpan={9}>Aucun ordre</td></tr>
          ) : orders.map(order => {
            let statut = 'En attente';
            if (order.status === 'matched') statut = order.type === 'buy' ? 'Acheté' : 'Vendu';
            if (order.status === 'cancelled') statut = 'Annulé';
            return (
              <tr key={order._id}>
                <td style={{ padding: '0.6rem', textAlign: 'center' }}>{new Date(order.timestamp).toLocaleString('fr-FR')}</td>
                <td style={{ padding: '0.6rem', textAlign: 'left' }}>
                  {order.stock?.ticker || order.ticker ? (
                    <Link to={`/stock/${order.stock?.ticker || order.ticker}`} style={{ color: '#fff', textDecoration: 'none' }}>
                      {order.stock?.name || order.name || '-'}
                    </Link>
                  ) : (
                    order.stock?.name || order.name || '-'
                  )}
                </td>
                <td style={{ padding: '0.6rem', textAlign: 'center', width: 90 }}>{order.stock?.ticker || order.ticker || '-'}</td>
                <td style={{ padding: '0.6rem', textAlign: 'center' }}>{order.price?.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' }) || '-'}</td>
                <td style={{ padding: '0.6rem', textAlign: 'center' }}>{order.quantity}</td>
                <td style={{ padding: '0.6rem', textAlign: 'center' }}>{order.type === 'buy' ? 'Achat' : 'Vente'}</td>
                <td style={{ padding: '0.6rem', textAlign: 'center' }}>{order.quantityRemaining ?? '-'}</td>
                <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 700 }}>{statut}</td>
                <td style={{ padding: '0.6rem', textAlign: 'center' }}>{order.user?.username || order.user?.email || order.user || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
// ...existing code...
// ...existing code...

const HistoryTab: React.FC<{ history: Transaction[]; orders?: any[]; onCancel?: (id: string) => void; isAuth?: boolean }> = ({ history, orders = [], onCancel, isAuth }) => {
  const sortedHistory = Array.isArray(history)
    ? [...history].sort((a, b) => new Date(b.timestamp ?? b.createdAt ?? b.date).getTime() - new Date(a.timestamp ?? a.createdAt ?? a.date).getTime())
    : [];
    // ...existing code...

  return (
    <section className="history-page" style={{ background: '#181818', minHeight: '80vh', padding: '2rem 0' }}>
      {/* Ordres */}
      {/* Ordres (restored to original layout, only user's orders) */}
      <h2 style={{ color: '#fff', textAlign: 'center', margin: '2rem 0 1rem', fontWeight: 700 }}>Mes Ordres</h2>
      <div className="orders-table-container" style={{ maxWidth: 700, margin: '0 auto', background: '#222', borderRadius: '1rem', boxShadow: '0 2px 16px rgba(0,0,0,0.12)', padding: '2rem' }}>
        <table className="orders-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#f3f3f3' }}>
          <thead>
            <tr style={{ background: '#222', color: '#fff' }}>
              <th style={{ padding: '0.7rem', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '0.7rem', fontWeight: 600 }}>Type</th>
              <th style={{ padding: '0.7rem', fontWeight: 600 }}>Ticker</th>
              <th style={{ padding: '0.7rem', fontWeight: 600 }}>Prix</th>
              <th style={{ padding: '0.7rem', fontWeight: 600 }}>Quantité</th>
              <th style={{ padding: '0.7rem', fontWeight: 600 }}>Restant</th>
              <th style={{ padding: '0.7rem', fontWeight: 600 }}>Statut</th>
              {onCancel && <th style={{ padding: '0.7rem', fontWeight: 600 }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {(!Array.isArray(orders) || orders.length === 0) ? (
              <tr><td colSpan={onCancel ? 8 : 7}>Aucun ordre</td></tr>
            ) : orders.map(order => {
              try {
                let statut = 'En attente';
                if (order.status === 'matched') statut = order.type === 'buy' ? 'Acheté' : 'Vendu';
                if (order.status === 'cancelled') statut = 'Annulé';

                const ts = order.timestamp ?? order.createdAt ?? order.date ?? null;
                const dateStr = ts ? new Date(ts).toLocaleString('fr-FR') : '-';

                const priceVal = order.price ?? order.pricePerShare ?? 0;
                const priceStr = (priceVal !== null && priceVal !== undefined) ? priceVal.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' }) : '-';

                return (
                  <tr key={order._id || order.id || Math.random().toString(36).slice(2,9)}>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{dateStr}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{order.type === 'buy' ? 'Achat' : 'Vente'}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{order.ticker || order.stock?.ticker || '-'}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{priceStr}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{order.quantity ?? '-'}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{order.quantityRemaining ?? '-'}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 700 }}>{statut}</td>
                    {onCancel && (
                      <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                        <button
                          onClick={() => onCancel(order._id)}
                          style={{ background: '#ff4d4f', color: '#fff', border: 'none', padding: '0.4rem 0.6rem', borderRadius: 6, cursor: 'pointer' }}
                        >Annuler</button>
                      </td>
                    )}
                  </tr>
                );
              } catch (e) {
                console.warn('Erreur rendu ordre:', e, order);
                return null;
              }
            })}
          </tbody>
        </table>
      </div>
      <h2 style={{ color: '#fff', textAlign: 'center', margin: '2rem 0 1rem', fontWeight: 700 }}>Historique des Transactions</h2>
      {/* Transactions */}
      {sortedHistory.length > 0 ? (
        <div className="history-table-container" style={{ maxWidth: 700, margin: '0 auto', background: '#222', borderRadius: '1rem', boxShadow: '0 2px 16px rgba(0,0,0,0.12)', padding: '2rem' }}>
          <table className="history-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#f3f3f3' }}>
            <thead>
              <tr style={{ background: '#222', color: '#fff' }}>
                <th style={{ padding: '0.7rem', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '0.7rem', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '0.7rem', fontWeight: 600 }}>Actif</th>
                <th style={{ padding: '0.7rem', fontWeight: 600 }}>Quantité</th>
                <th style={{ padding: '0.7rem', fontWeight: 600 }}>Prix / Action</th>
                <th style={{ padding: '0.7rem', fontWeight: 600 }}>Valeur Totale</th>
              </tr>
            </thead>
            <tbody>
              {sortedHistory.map(tx => {
                const rawTs = tx.timestamp ?? tx.createdAt ?? tx.date ?? null;
                const timestamp = rawTs ? new Date(rawTs).toLocaleString('fr-FR') : '-';
                const quantity = tx.quantity ?? 0;
                const pricePerShare = tx.pricePerShare ?? tx.price ?? 0;
                const totalValue = tx.totalValue ?? quantity * pricePerShare;
                const typeLabel = tx.type === 'buy' ? 'Achat' : 'Vente';
                const rowStyle = tx.type === 'buy'
                  ? { background: '#1a2b1a', color: '#b6f7b6' }
                  : { background: '#2b1a1a', color: '#f7b6b6' };
                const name = tx.name ?? '-';
                const ticker = tx.ticker ?? '-';

                return (
                  <tr key={tx.id ?? Math.random().toString(36).substr(2, 9)} style={rowStyle}>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{timestamp}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 700 }}>{typeLabel}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{name} <span style={{ color: '#aaa' }}>({ticker})</span></td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{quantity.toLocaleString('fr-FR')}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{pricePerShare.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-history" style={{ textAlign: 'center', color: '#fff', marginTop: '2rem' }}>
          {!isAuth ? (
            <p>Connectez-vous pour voir votre historique de transactions.</p>
          ) : (
            <p>Vous n'avez aucune transaction pour le moment.</p>
          )}
        </div>
      )}
    </section>
  );
};

// ...existing code...
// ...existing code...
const OrdersHistory: React.FC<{ ticker: string }> = ({ ticker }) => {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    fetch('/api/user/history', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        // Filtrer par ticker côté client
        const filtered = Array.isArray(data)
          ? data.filter(order => order.ticker === ticker)
          : [];
        setOrders(filtered);
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
        <h2 id="orderbook-history-title" className="orderbook-title" style={{ color: '#f3f3f3' }}>Historique des ordres ({ticker})</h2>
      </header>
      {loading && <div style={{ color: '#f3f3f3' }}>Chargement...</div>}
      {error && <div className="orderform-message orderform-error" style={{ color: '#ff6b6b' }}>{error}</div>}
      {!loading && !error && (
        <table className="orderbook-history-table" style={{ width: '100%', color: '#f3f3f3', background: 'transparent' }}>
          <thead>
            <tr style={{ color: '#f3f3f3', background: 'transparent' }}>
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
              <tr key={order._id} style={{ color: '#f3f3f3', background: 'transparent' }}>
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
import OrderBook from '../components/OrderBook';
import OrderForm from '../components/OrderForm';
import AuthStatus from '../components/AuthStatus';

interface HistoryOrder {
  _id: string;
  type: string;
  pricePerShare: number;
  quantity: number;
  status?: string;
  timestamp: string;
}

// ...existing code...

const OrderBookPage: React.FC = () => {
  const { ticker: urlTicker } = useParams<{ ticker: string }>();
  const [view, setView] = useState<'form' | 'orders' | 'history'>('form');
  const [tickers, setTickers] = useState<{ ticker: string; name: string }[]>([]);
  const [ticker, setTicker] = useState<string>(urlTicker || 'APPL');
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('authToken');

    const fetchAll = async () => {
      try {
        if (token) {
          const tradesRes = await fetch('/api/trades/my', { headers: { 'Authorization': `Bearer ${token}` } });
          const tradesData = await tradesRes.json();
          if (!mounted) return;
          setUserHistory(Array.isArray(tradesData) ? tradesData : []);
        } else {
          // not authenticated: don't show global transactions — keep history empty and prompt to login
          setUserHistory([]);
        }

        const ordersRes = await fetch('/api/orders/all');
        const ordersData = await ordersRes.json();
        if (!mounted) return;
        if (Array.isArray(ordersData.orders)) {
          setAllOrders(ordersData.orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        } else {
          setAllOrders([]);
        }

        if (token) {
          const myRes = await fetch('/api/orders/my', { headers: { 'Authorization': `Bearer ${token}` } });
          const myData = await myRes.json();
          if (!mounted) return;
          if (Array.isArray(myData)) setMyOrders(myData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
          else if (Array.isArray(myData.orders)) setMyOrders(myData.orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
          else setMyOrders([]);
        } else {
          setMyOrders([]);
        }
      } catch (e) {
        console.warn('Erreur fetch orders/trades:', e);
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Cancel order handler
  const handleCancelOrder = async (id: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) return alert('Vous devez être connecté pour annuler un ordre');

    // confirmation
    const ok = window.confirm('Confirmer l\'annulation de cet ordre ?');
    if (!ok) return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) {
        const err = await res.json();
        setNotice({ type: 'error', text: err.message || 'Erreur annulation ordre' });
        setTimeout(() => setNotice(null), 3000);
        return;
      }
      // refresh lists after cancellation
      const fetchFn = async () => {
        const ordersRes = await fetch('/api/orders/all');
        const ordersData = await ordersRes.json();
        setAllOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
        const myRes = await fetch('/api/orders/my', { headers: { 'Authorization': `Bearer ${token}` } });
        const myData = await myRes.json();
        setMyOrders(Array.isArray(myData) ? myData : (Array.isArray(myData.orders) ? myData.orders : []));
      };
      fetchFn();
      setNotice({ type: 'success', text: 'Ordre annulé' });
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      console.error('Erreur annulation:', e);
      setNotice({ type: 'error', text: 'Erreur annulation' });
      setTimeout(() => setNotice(null), 3000);
    }
  };

  useEffect(() => {
    fetch('/api/tickers/tickers')
      .then(res => res.json())
      .then(data => setTickers(data.tickers || []));
  }, []);

  useEffect(() => {
    if (urlTicker) setTicker(urlTicker);
  }, [urlTicker]);

  return (
    <section
      className="orderbook-menu-wrapper"
        style={{
          width: '90%',
          maxWidth: '1400px',
          margin: '2rem auto',
          background: '#222',
          borderRadius: '1.5rem',
          boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
          padding: '2.5rem 2rem',
          color: '#fff',
          minHeight: '80vh',
        }}
    >
      {/* AuthStatus removed as requested */}
      <header className="orderbook-menu-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <button className={`orderbook-menu-tab${view === 'form' ? ' active' : ''}`} onClick={() => setView('form')} style={{ marginRight: 12, background: view === 'form' ? '#222' : '#232323', color: '#222', border: 'none', borderRadius: 8, padding: '0.7rem 2rem', fontWeight: 600, cursor: 'pointer' }}>Formulaire</button>
    <button className={`orderbook-menu-tab${view === 'orders' ? ' active' : ''}`} onClick={() => setView('orders')} style={{ marginRight: 12, background: view === 'orders' ? '#222' : '#232323', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 2rem', fontWeight: 600, cursor: 'pointer' }}>Carnet d'ordre</button>
  <button className={`orderbook-menu-tab${view === 'history' ? ' active' : ''}`} onClick={() => setView('history')} style={{ background: view === 'history' ? '#222' : '#232323', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 2rem', fontWeight: 600, cursor: 'pointer' }}>Historique</button>
      </header>
      {/* Sélection d'action intégrée dans OrderForm */}
      <div className="orderbook-menu-content">
  {notice && (
    <div style={{ marginBottom: 12, textAlign: 'center' }}>
      <div style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: 8, background: notice.type === 'success' ? '#2ecc71' : notice.type === 'error' ? '#ff6b6b' : '#f1c40f', color: '#fff' }}>{notice.text}</div>
    </div>
  )}
  {view === 'form' && <OrderForm ticker={ticker} tickers={tickers} setTicker={setTicker} />}
  {view === 'orders' && <AllOrdersTable orders={allOrders.filter(o => o.status === 'open')} />}
  {view === 'history' && <HistoryTab history={userHistory} orders={myOrders} onCancel={handleCancelOrder} isAuth={!!localStorage.getItem('authToken')} />}
      </div>
    </section>
  );
};

export default OrderBookPage;
