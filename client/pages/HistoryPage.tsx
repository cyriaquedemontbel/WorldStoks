import React from 'react';
import { Transaction } from '../types';

interface HistoryPageProps {
    history: Transaction[];
}

export const HistoryPage = ({ history }: HistoryPageProps) => {

    const sortedHistory = [...history].reverse();

    return (
        <section className="history-page">
            <h2>Historique des Transactions</h2>
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
                            {sortedHistory.map(tx => (
                                <tr key={tx.id} className={tx.type === 'buy' ? 'transaction--buy' : 'transaction--sell'}>
                                    <td>{new Date(tx.timestamp).toLocaleString('fr-FR')}</td>
                                    <td className="transaction-type">{tx.type === 'buy' ? 'Achat' : 'Vente'}</td>
                                    <td className="transaction-asset">{tx.name} ({tx.ticker})</td>
                                    <td>{tx.quantity.toLocaleString('fr-FR')}</td>
                                    <td>{tx.pricePerShare.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</td>
                                    <td>{tx.totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="no-history">
                    <p>Vous n'avez aucune transaction pour le moment.</p>
                </div>
            )}
        </section>
    );
};