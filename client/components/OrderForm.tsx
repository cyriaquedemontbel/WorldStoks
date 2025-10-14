import React, { useState } from 'react';
import { apiFetchMyOrders } from '../api';

interface Props {
  ticker: string;
}

const OrderForm: React.FC<Props> = ({ ticker }) => {
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
      const token = localStorage.getItem('token');
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

  return (
    <form onSubmit={handleSubmitOrder} style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <select name="type" value={form.type} onChange={handleFormChange}>
        <option value="buy">Acheter</option>
        <option value="sell">Vendre</option>
      </select>
      <input name="price" type="number" step="0.01" placeholder="Prix" value={form.price} onChange={handleFormChange} required />
      <input name="quantity" type="number" min="1" placeholder="Quantité" value={form.quantity} onChange={handleFormChange} required />
      <button type="submit" disabled={formLoading}>Passer l'ordre</button>
      {formError && <span style={{ color: 'red' }}>{formError}</span>}
      {success && <span style={{ color: 'green' }}>{success}</span>}
    </form>
  );
};

export default OrderForm;
