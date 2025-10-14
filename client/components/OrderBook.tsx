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

  return (
    <div className="orderbook-container">
      <h3>Carnet d'ordres pour {ticker}</h3>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div>
          <h4>Achats (Bids)</h4>
          <table>
            <thead>
              <tr>
                <th>Prix</th>
                <th>Quantité</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(orderBook.bids) && orderBook.bids.map(order => (
                <tr key={order._id}>
                  <td>{order.price.toFixed(2)} $</td>
                  <td>{order.quantityRemaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h4>Ventes (Asks)</h4>
          <table>
            <thead>
              <tr>
                <th>Prix</th>
                <th>Quantité</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(orderBook.asks) && orderBook.asks.map(order => (
                <tr key={order._id}>
                  <td>{order.price.toFixed(2)} $</td>
                  <td>{order.quantityRemaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
