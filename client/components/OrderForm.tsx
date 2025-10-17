import React, { useState } from 'react';
import { apiFetchMyOrders } from '../services/api';

interface Props {
  ticker: string;
  tickers: { ticker: string; name: string }[];
  setTicker: (ticker: string) => void;
  prefill?: { type: 'buy' | 'sell'; price?: number; quantity?: number } | null;
}

const OrderForm: React.FC<Props> = ({ ticker, tickers, setTicker, prefill = null }) => {
  const [form, setForm] = useState({ type: 'buy', price: '', quantity: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setSuccess(null);
    try {
  const token = localStorage.getItem('authToken');
      const res = await fetch('/api/orders/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ticker,
          type: form.type,
          price: parseFloat(form.price),
          quantity: parseInt(form.quantity)
        })
      });
      if (res.status === 401) {
        setFormError('Vous devez être connecté pour passer un ordre.');
        setFormLoading(false);
        return;
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Erreur création ordre');
      setForm({ type: 'buy', price: '', quantity: '' });
      setSuccess('Ordre créé !');
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Apply prefill when provided (e.g. when user clicked an order in the book)
  React.useEffect(() => {
    if (prefill) {
      setForm({
        type: prefill.type || 'buy',
        price: prefill.price != null ? String(prefill.price) : '',
        quantity: prefill.quantity != null ? String(prefill.quantity) : '',
      });
    }
  }, [prefill]);

  return (
    <section className="orderform-container" aria-labelledby="orderform-title">
      <header className="orderform-header">
        <h2 id="orderform-title" className="orderform-title">Passer un ordre</h2>
      </header>
      <form className="orderform-form" onSubmit={handleSubmitOrder}>
        <div className="orderform-row">
          <label htmlFor="ticker">Action :</label>
          <select name="ticker" id="ticker" value={ticker} onChange={e => setTicker(e.target.value)} required>
            {tickers.length === 0 && <option value="AAPL">AAPL</option>}
            {tickers.map(t => (
              <option key={t.ticker} value={t.ticker}>{t.ticker} - {t.name}</option>
            ))}
          </select>
        </div>
        <div className="orderform-row">
          <label htmlFor="type">Type :</label>
          <select name="type" id="type" value={form.type} onChange={handleFormChange}>
            <option value="buy">Acheter</option>
            <option value="sell">Vendre</option>
          </select>
        </div>
        <div className="orderform-row">
          <label htmlFor="price">Prix :</label>
          <input name="price" id="price" type="number" step="0.01" placeholder="Prix" value={form.price} onChange={handleFormChange} required />
        </div>
        <div className="orderform-row">
          <label htmlFor="quantity">Quantité :</label>
          <input name="quantity" id="quantity" type="number" min="1" placeholder="Quantité" value={form.quantity} onChange={handleFormChange} required />
        </div>
        <button type="submit" className="btn btn--primary" disabled={formLoading}>Passer l'ordre</button>
        {formError && <div className="orderform-message orderform-error">{formError}</div>}
        {success && <div className="orderform-message orderform-success">{success}</div>}
      </form>
    </section>
  );
}

export default OrderForm;
