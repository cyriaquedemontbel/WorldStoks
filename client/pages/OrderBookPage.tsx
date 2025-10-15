import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { Transaction } from '../types';
import OrderForm from '../components/OrderForm';

// Table d'ordres complète pour le tab Carnet d'ordre
function AllOrdersTable({ orders, onSelectOrder }: { orders: any[]; onSelectOrder?: (order: any) => void }) {
  const [sortField, setSortField] = useState<'date' | 'name' | 'price' | 'quantity' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [query, setQuery] = useState<string>('');

  const normalized = (s: any) => (s || '').toString().toLowerCase();

  const filtered = orders.filter(o => {
    if (filterType !== 'all' && o.type !== filterType) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    const name = (o.stock?.name || o.name || '').toString().toLowerCase();
    const ticker = (o.stock?.ticker || o.ticker || '').toString().toLowerCase();
    return name.includes(q) || ticker.includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortOrder === 'asc' ? 1 : -1;
    try {
      if (sortField === 'date') {
        const ta = new Date(a.timestamp || a.createdAt || a.date || 0).getTime();
        const tb = new Date(b.timestamp || b.createdAt || b.date || 0).getTime();
        return (ta - tb) * dir;
      }
      if (sortField === 'name') {
        const na = normalized(a.stock?.name || a.name || a.ticker || '');
        const nb = normalized(b.stock?.name || b.name || b.ticker || '');
        return na < nb ? -1 * dir : na > nb ? 1 * dir : 0;
      }
      if (sortField === 'price') {
        const pa = Number(a.price ?? a.pricePerShare ?? 0);
        const pb = Number(b.price ?? b.pricePerShare ?? 0);
        return (pa - pb) * dir;
      }
      if (sortField === 'quantity') {
        const qa = Number(a.quantity ?? 0);
        const qb = Number(b.quantity ?? 0);
        return (qa - qb) * dir;
      }
      if (sortField === 'type') {
        const ta = normalized(a.type || '');
        const tb = normalized(b.type || '');
        return ta < tb ? -1 * dir : ta > tb ? 1 * dir : 0;
      }
    } catch (e) {
      return 0;
    }
    return 0;
  });

  return (
    <div>
      <div className="filters-bar">
        <div className="filters-group">
          <label className="filters-label">Trier par</label>
          <select className="filters-select" value={sortField} onChange={e => setSortField(e.target.value as any)}>
            <option value="date">Date</option>
            <option value="name">Nom de l'action</option>
            <option value="price">Prix</option>
            <option value="quantity">Quantité</option>
            <option value="type">Achat/Vente</option>
          </select>
          <select className="filters-select" value={sortOrder} onChange={e => setSortOrder(e.target.value as any)}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>

        <div className="filters-group">
          <label className="filters-label">Filtrer</label>
          <select className="filters-select" value={filterType} onChange={e => setFilterType(e.target.value as any)}>
            <option value="all">Tous</option>
            <option value="buy">Achat</option>
            <option value="sell">Vente</option>
          </select>
        </div>

        <div className="filters-right">
          <input className="filters-input" placeholder="Rechercher nom ou ticker" value={query} onChange={e => setQuery(e.target.value)} />
          <button
            type="button"
            className="filters-clear"
            onClick={() => {
              setSortField('date');
              setSortOrder('desc');
              setFilterType('all');
              setQuery('');
            }}
          >Enlever les filtres</button>
        </div>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Date de publication</th>
              <th className="text-left">Nom de l'action</th>
              <th>Ticker</th>
              <th>Prix</th>
              <th>Quantité</th>
              <th>Achat/Vente</th>
              <th>Restant</th>
              <th>Statut</th>
              <th>Utilisateur</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={9}>Aucun ordre</td></tr>
            ) : sorted.map(order => {
              let statut = 'En attente';
              if (order.status === 'matched') statut = order.type === 'buy' ? 'Acheté' : 'Vendu';
              if (order.status === 'cancelled') statut = 'Annulé';

              return (
                <tr
                  key={order._id}
                  onClick={() => onSelectOrder && onSelectOrder(order)}
                  className={`order-row ${onSelectOrder ? 'clickable' : ''} ${order.type === 'buy' ? 'buy' : 'sell'}`}
                >
                  <td className="date-cell">{order.timestamp ? new Date(order.timestamp).toLocaleString('fr-FR') : '-'}</td>
                  <td className="text-left">
                    {order.stock?.ticker || order.ticker ? (
                      <Link to={`/stock/${order.stock?.ticker || order.ticker}`} className="table-link" onClick={e => e.stopPropagation()}>
                        {order.stock?.name || order.name || '-'}
                      </Link>
                    ) : (
                      order.stock?.name || order.name || '-'
                    )}
                  </td>
                  <td className="ticker-cell">{order.stock?.ticker || order.ticker || '-'}</td>
                  <td className="price-cell">{(order.price ?? order.pricePerShare) ? Number(order.price ?? order.pricePerShare).toLocaleString('fr-FR', { style: 'currency', currency: 'USD' }) : '-'}</td>
                  <td>{order.quantity ?? '-'}</td>
                  <td><span className="type-badge">{order.type === 'buy' ? 'Achat' : 'Vente'}</span></td>
                  <td>{order.quantityRemaining ?? '-'}</td>
                  <td className="status-cell">{statut}</td>
                  <td>{order.user?.username || order.user?.email || order.user || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// History tab: user's orders + transactions
const HistoryTab: React.FC<{ history: Transaction[]; orders?: any[]; onCancel?: (id: string) => void; isAuth?: boolean }> = ({ history, orders = [], onCancel, isAuth }) => {
  const sortedHistory = Array.isArray(history)
    ? [...history].sort((a, b) => new Date(b.timestamp ?? b.createdAt ?? b.date).getTime() - new Date(a.timestamp ?? a.createdAt ?? a.date).getTime())
    : [];

  return (
    <section className="history-page">
      <h2 className="section-title">Mes Ordres</h2>
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Ticker</th>
              <th>Prix</th>
              <th>Quantité</th>
              <th>Restant</th>
              <th>Statut</th>
              {onCancel && <th>Action</th>}
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

                const priceVal = order.price ?? order.pricePerShare ?? null;
                const priceStr = (priceVal !== null && priceVal !== undefined) ? Number(priceVal).toLocaleString('fr-FR', { style: 'currency', currency: 'USD' }) : '-';

                return (
                  <tr key={order._id || order.id || Math.random().toString(36).slice(2,9)} className={`order-row ${order.type === 'buy' ? 'buy' : 'sell'}`}>
                    <td className="date-cell">{dateStr}</td>
                    <td><span className="type-badge">{order.type === 'buy' ? 'Achat' : 'Vente'}</span></td>
                    <td className="ticker-cell">{order.ticker || order.stock?.ticker || '-'}</td>
                    <td className="price-cell">{priceStr}</td>
                    <td>{order.quantity ?? '-'}</td>
                    <td>{order.quantityRemaining ?? '-'}</td>
                    <td className="status-cell">{statut}</td>
                    {onCancel && (
                      <td>
                        <button onClick={() => onCancel(order._id)} className="btn--danger">Annuler</button>
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
      <h2> </h2>
      <h2 className="section-title">Historique des Transactions</h2>
      <h2>  </h2>
      {sortedHistory.length > 0 ? (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Actif</th>
                <th>Quantité</th>
                <th>Prix / Action</th>
                <th>Valeur Totale</th>
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
                const name = tx.name ?? '-';
                const ticker = tx.ticker ?? '-';

                return (
                  <tr key={tx.id ?? Math.random().toString(36).substr(2, 9)}>
                    <td>{timestamp}</td>
                    <td className="status-cell">{typeLabel}</td>
                    <td>{name} <span className="ticker-cell">({ticker})</span></td>
                    <td>{quantity.toLocaleString('fr-FR')}</td>
                    <td>{pricePerShare.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</td>
                    <td>{totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-history">
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

interface HistoryOrder {
  _id: string;
  type: string;
  pricePerShare: number;
  quantity: number;
  status?: string;
  timestamp: string;
}

const OrderBookPage: React.FC = () => {
  const { ticker: urlTicker } = useParams<{ ticker: string }>();
  const [view, setView] = useState<'form' | 'orders' | 'history'>('form');
  const [tickers, setTickers] = useState<{ ticker: string; name: string }[]>([]);
  const [ticker, setTicker] = useState<string>(urlTicker || 'APPL');
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [prefillOrder, setPrefillOrder] = useState<{ type: 'buy' | 'sell'; price?: number; quantity?: number } | null>(null);
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
    <section className="orderbook-page">
      <header className="orderbook-menu-header">
        <button className={`orderbook-menu-tab${view === 'form' ? ' active' : ''}`} onClick={() => setView('form')}>Formulaire</button>
        <button className={`orderbook-menu-tab${view === 'orders' ? ' active' : ''}`} onClick={() => setView('orders')}>Carnet d'ordre</button>
        <button className={`orderbook-menu-tab${view === 'history' ? ' active' : ''}`} onClick={() => setView('history')}>Historique</button>
      </header>

      <div className="orderbook-menu-content">
        {notice && (
          <div className="orderbook-notice">
            <div className={`notice-chip notice-${notice.type}`}>{notice.text}</div>
          </div>
        )}

        {view === 'form' && <OrderForm ticker={ticker} tickers={tickers} setTicker={setTicker} prefill={prefillOrder} />}
        {view === 'orders' && <AllOrdersTable orders={allOrders.filter(o => o.status === 'open')} onSelectOrder={(order) => {
          const selectedTicker = order.stock?.ticker || order.ticker;
          if (selectedTicker) setTicker(selectedTicker);
          setPrefillOrder({ type: order.type === 'buy' ? 'sell' : 'buy', price: order.price ?? order.pricePerShare, quantity: order.quantity });
          setView('form');
        }} />}
        {view === 'history' && <HistoryTab history={userHistory} orders={myOrders} onCancel={handleCancelOrder} isAuth={!!localStorage.getItem('authToken')} />}
      </div>
    </section>
  );
};

export default OrderBookPage;
