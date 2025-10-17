import React, { useEffect, useState } from 'react';
import { Order } from '../types';

const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders/admin', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (!res.ok) throw new Error('Erreur chargement ordres');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet ordre ?')) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Erreur suppression');
      fetchOrders();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      
      <h2>Ordres d'actions de l'admin</h2>
      {loading && <div>Chargement...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Type</th>
            <th>Prix</th>
            <th>Quantité</th>
            <th>Restant</th>
            <th>Status</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order._id}>
              <td>{order.stock?.ticker || order.ticker}</td>
              <td>{order.type}</td>
              <td>{order.price}</td>
              <td>{order.quantity}</td>
              <td>{order.quantityRemaining}</td>
              <td>{order.status}</td>
              <td>{new Date(order.timestamp).toLocaleString()}</td>
              <td>
                <button onClick={() => handleDelete(order._id)} style={{ color: 'red' }}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && !loading && <div>Aucun ordre trouvé.</div>}
    </div>
  );
};

export default AdminOrdersPage;
