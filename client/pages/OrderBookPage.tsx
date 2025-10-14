import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OrderBook from '../components/OrderBook';
import OrderForm from '../components/OrderForm';
import AuthStatus from '../components/AuthStatus';

const OrderBookPage: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [tickers, setTickers] = useState<{ ticker: string; name: string }[]>([]);
  const [selectedTickerForm, setSelectedTickerForm] = useState<string>(ticker || '');
  const [selectedTickerBook, setSelectedTickerBook] = useState<string>(ticker || '');

  useEffect(() => {
  fetch('/api/tickers/tickers')
      .then(res => res.json())
      .then(data => setTickers(data.tickers || []));
  }, []);

  const handleSelectForm = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTickerForm(e.target.value);
  };
  const handleSelectBook = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTickerBook(e.target.value);
    navigate(`/orderbook/${e.target.value}`);
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', gap: '2rem', flexDirection: 'column' }}>
      <AuthStatus />
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1, borderRight: '1px solid #ccc', paddingRight: '2rem' }}>
          <h3>Passer un ordre</h3>
          <label htmlFor="ticker-form-select">Sélectionner une action : </label>
          <select id="ticker-form-select" value={selectedTickerForm} onChange={handleSelectForm}>
            <option value="">-- Choisir --</option>
            {tickers.map(t => (
              <option key={t.ticker} value={t.ticker}>{t.ticker} - {t.name}</option>
            ))}
          </select>
          {selectedTickerForm && <OrderForm ticker={selectedTickerForm} />}
        </div>
        <div style={{ flex: 2, paddingLeft: '2rem' }}>
          <h3>Carnet d'ordres</h3>
          <label htmlFor="ticker-book-select">Sélectionner une action : </label>
          <select id="ticker-book-select" value={selectedTickerBook} onChange={handleSelectBook}>
            <option value="">-- Choisir --</option>
            {tickers.map(t => (
              <option key={t.ticker} value={t.ticker}>{t.ticker} - {t.name}</option>
            ))}
          </select>
          {selectedTickerBook ? <OrderBook ticker={selectedTickerBook} /> : <div>Veuillez sélectionner une action.</div>}
        </div>
      </div>
    </div>
  );
};

export default OrderBookPage;
