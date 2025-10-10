import React, { useState } from 'react';
import { Stock } from '../types';
import { StockForm } from '../components/StockForm';

interface AdminPageProps {
    stocks: Stock[];
    // Fix: Updated prop types to expect a Promise<boolean> for async operations.
    onAddStock: (stock: Stock) => Promise<boolean>;
    onUpdateStock: (stock: Stock) => Promise<boolean>;
    onDeleteStock: (ticker: string) => void;
}

export const AdminPage = ({ stocks, onAddStock, onUpdateStock, onDeleteStock }: AdminPageProps) => {
    const [editingStock, setEditingStock] = useState<Stock | 'new' | null>(null);

    // Fix: Converted handleSaveStock to an async function to correctly handle promises.
    const handleSaveStock = async (stock: Stock): Promise<boolean> => {
        let success = false;
        if (editingStock === 'new') {
            success = await onAddStock(stock);
        } else {
            success = await onUpdateStock(stock);
        }
        
        if (success) {
            setEditingStock(null);
        }
        return success;
    };

    if (editingStock) {
        return (
            <div className="admin-page">
                <StockForm 
                    initialData={editingStock === 'new' ? undefined : editingStock}
                    onSubmit={handleSaveStock}
                    onCancel={() => setEditingStock(null)}
                />
            </div>
        );
    }

    return (
        <section className="admin-page" aria-labelledby="admin-title">
            <header className="admin-page__header">
                <h2 id="admin-title">Gestion des Marchés</h2>
                <button className="btn btn--primary" onClick={() => setEditingStock('new')}>
                    Ajouter un nouveau marché
                </button>
            </header>
            
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Symbole</th>
                            <th>Nom</th>
                            <th>Prix</th>
                            <th>Offre en Circulation</th>
                            <th>Offre Maximale</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stocks.map(stock => (
                            <tr key={stock.ticker}>
                                <td>{stock.ticker}</td>
                                <td>{stock.name}</td>
                                <td>{stock.price.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</td>
                                <td>{stock.circulatingSupply.toLocaleString('fr-FR')}</td>
                                <td>{stock.maxSupply.toLocaleString('fr-FR')}</td>
                                <td>
                                    <div className="admin-table__actions">
                                        <button className="btn btn--edit" onClick={() => setEditingStock(stock)}>Modifier</button>
                                        <button className="btn btn--delete" onClick={() => onDeleteStock(stock.ticker)}>Supprimer</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};