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
                            {sortedHistory.map(tx => {
                                const timestamp = tx.timestamp ? new Date(tx.timestamp).toLocaleString('fr-FR') : '-';
                                const quantity = tx.quantity ?? 0;
                                const pricePerShare = tx.pricePerShare ?? 0;
                                const totalValue = tx.totalValue ?? quantity * pricePerShare;
                                const typeLabel = tx.type === 'buy' ? 'Achat' : 'Vente';
                                const rowClass = tx.type === 'buy' ? 'transaction--buy' : 'transaction--sell';
                                const name = tx.name ?? '-';
                                const ticker = tx.ticker ?? '-';

                                return (
                                    <tr key={tx.id ?? Math.random().toString(36).substr(2, 9)} className={rowClass}>
                                        <td>{timestamp}</td>
                                        <td className="transaction-type">{typeLabel}</td>
                                        <td className="transaction-asset">{name} ({ticker})</td>
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
                    <p>Vous n'avez aucune transaction pour le moment.</p>
                </div>
            )}
        </section>
    );
};
