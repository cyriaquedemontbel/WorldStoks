import React, { useEffect, useState } from 'react';

interface Order {
  _id: string;
  user: string;
  price: number;
  quantity: number;
  quantityRemaining: number;
  status: string;
  timestamp: string;
}

interface OrderBookData {
  bids: Order[];
  asks: Order[];
}

interface Props {
  ticker: string;
}

const OrderBook: React.FC<Props> = ({ ticker }) => {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/orderbook/book/${ticker}`)
      .then(res => res.json())
      .then(data => {
        setOrderBook(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Erreur chargement carnet d\'ordres');
        setLoading(false);
      });
  }, [ticker]);

  if (loading) return <div>Chargement du carnet d'ordres...</div>;
  if (error) return <div>{error}</div>;
  if (!orderBook) return <div>Aucun ordre pour cette action.</div>;

  // Trie les ventes pour mettre celles de l'admin en haut
  const sortedAsks = Array.isArray(orderBook.asks)
    ? [...orderBook.asks].sort((a, b) => {
        const aAdmin = a.user && typeof a.user === 'object' && a.user.isAdmin;
        const bAdmin = b.user && typeof b.user === 'object' && b.user.isAdmin;
        if (aAdmin && !bAdmin) return -1;
        if (!aAdmin && bAdmin) return 1;
        return 0;
      })
    : [];

  return (
    <section className="orderbook-container" aria-labelledby="orderbook-title">
      <header className="orderbook-header">
        <h2 id="orderbook-title" className="orderbook-title">Carnet d'ordres pour <span className="orderbook-ticker">{ticker}</span></h2>
      </header>
      <div className="orderbook-tables">
        <div className="orderbook-table-block">
          <h4 className="orderbook-table-title orderbook-bids-title">Achats <span role="img" aria-label="Acheteur">🟢</span></h4>
          <table className="orderbook-bids">
            <thead>
              <tr>
                <th>Prix</th>
                <th>Quantité</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(orderBook.bids) && orderBook.bids.map(order => (
                <tr key={order._id}>
                  <td>{order.price}</td>
                  <td>{order.quantityRemaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="orderbook-table-block">
          <h4 className="orderbook-table-title orderbook-asks-title">Ventes <span role="img" aria-label="Vendeur">🔴</span></h4>
          <table className="orderbook-asks">
            <thead>
              <tr>
                <th>Prix</th>
                <th>Quantité</th>
              </tr>
            </thead>
            <tbody>
              {sortedAsks.map(order => (
                <tr key={order._id}>
                  <td>{order.price}</td>
                  <td>{order.quantityRemaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default OrderBook;
