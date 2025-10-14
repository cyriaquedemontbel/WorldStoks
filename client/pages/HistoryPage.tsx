import React, { useEffect, useState } from 'react';
import { Transaction, Order } from '../types';
import { apiFetchMyOrders } from '../services/api';

interface HistoryPageProps {
    history: Transaction[];
}

export const HistoryPage = ({ history }: HistoryPageProps) => {
    const sortedHistory = [...history].reverse();
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        apiFetchMyOrders().then(setOrders);
    }, []);

    return (
        <section className="history-page" style={{ background: '#181818', minHeight: '80vh', padding: '2rem 0' }}>
            <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: '2rem', fontWeight: 700 }}>Historique des Transactions</h2>
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
                                const timestamp = tx.date ? new Date(tx.date).toLocaleString('fr-FR') : '-';
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
                    <p>Vous n'avez aucune transaction pour le moment.</p>
                </div>
            )}
            {/* Ordres */}
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
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr><td colSpan={7}>Aucun ordre</td></tr>
                        ) : orders.map(order => {
                            let statut = 'En attente';
                            if (order.status === 'matched') statut = order.type === 'buy' ? 'Acheté' : 'Vendu';
                            if (order.status === 'cancelled') statut = 'Annulé';
                            return (
                                <tr key={order._id}>
                                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{new Date(order.timestamp).toLocaleString('fr-FR')}</td>
                                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{order.type === 'buy' ? 'Achat' : 'Vente'}</td>
                                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{order.ticker || '-'}</td>
                                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{order.price.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</td>
                                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{order.quantity}</td>
                                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{order.quantityRemaining}</td>
                                    <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 700 }}>{statut}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
};
