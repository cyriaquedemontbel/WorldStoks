import React, { useState, useEffect } from 'react';
import { Stock } from '../types';

interface StockFormProps {
    initialData?: Stock;
    // Fix: Changed onSubmit to return a Promise<boolean> to support async operations.
    onSubmit: (stock: Stock) => Promise<boolean>;
    onCancel: () => void;
}

const emptyStock: Omit<Stock, 'history'> = {
    ticker: '',
    name: '',
    price: 0,
    change: 0,
    changePercent: 0,
    description: '',
    volumeToday: 0,
    turnoverToday: 0,
    maxSupply: 1000000,
    circulatingSupply: 0,
};

export const StockForm = ({ initialData, onSubmit, onCancel }: StockFormProps) => {
    const [formData, setFormData] = useState<Omit<Stock, 'history'>>(() => {
        if (!initialData) return emptyStock;
        const { history, ...rest } = initialData;
        return rest;
    });
    // Fix: Added isSubmitting state to manage form state during async submission.
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!initialData;

    useEffect(() => {
        if (initialData) {
            const { history, ...rest } = initialData;
            setFormData(rest);
        } else {
            setFormData(emptyStock);
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumberField = e.target.type === 'number';

        setFormData(prev => ({ 
            ...prev, 
            [name]: isNumberField ? (value === '' ? 0 : parseFloat(value)) : value
        }));
    };

    // Fix: Changed handleSubmit to be async to await the onSubmit promise.
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const stockToSubmit: Stock = {
            ...formData,
            history: initialData?.history || [],
            // Ensure circulatingSupply is not negative
            circulatingSupply: Math.max(0, formData.circulatingSupply),
        };
        const success = await onSubmit(stockToSubmit);
        if (!success) {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="admin-form" onSubmit={handleSubmit}>
            <h3>{isEditing ? 'Modifier le marché' : 'Ajouter un marché'}</h3>
            <div className="admin-form__grid">
                <div className="form-group">
                    <label className="form-label" htmlFor="ticker">Symbole (Ticker)</label>
                    <input className="form-input" type="text" id="ticker" name="ticker" value={formData.ticker} onChange={handleChange} required disabled={isEditing || isSubmitting} maxLength={5} />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="name">Nom</label>
                    <input className="form-input" type="text" id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isSubmitting} />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="price">Prix</label>
                    <input className="form-input" type="number" id="price" name="price" value={formData.price} onChange={handleChange} required step="0.01" disabled={isSubmitting} />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="change">Changement (24h)</label>
                    <input className="form-input" type="number" id="change" name="change" value={formData.change} onChange={handleChange} required step="0.01" disabled={isSubmitting} />
                </div>
                 <div className="form-group">
                    <label className="form-label" htmlFor="maxSupply">Offre Maximale</label>
                    <input className="form-input" type="number" id="maxSupply" name="maxSupply" value={formData.maxSupply} onChange={handleChange} required step="1" disabled={isSubmitting} />
                </div>
                 <div className="form-group">
                    <label className="form-label" htmlFor="circulatingSupply">Offre en Circulation</label>
                    <input className="form-input" type="number" id="circulatingSupply" name="circulatingSupply" value={formData.circulatingSupply} onChange={handleChange} required step="1" readOnly={!isEditing} disabled={isSubmitting} />
                </div>
                <div className="form-group admin-form-group--full-width">
                    <label className="form-label" htmlFor="changePercent">Changement % (24h)</label>
                    <input className="form-input" type="number" id="changePercent" name="changePercent" value={formData.changePercent} onChange={handleChange} required step="0.01" disabled={isSubmitting} />
                </div>
                <div className="form-group admin-form-group--full-width">
                    <label className="form-label" htmlFor="volumeToday">Actions échangées (24h)</label>
                    <input className="form-input" type="number" id="volumeToday" name="volumeToday" value={formData.volumeToday} onChange={handleChange} required step="1" disabled={isSubmitting} />
                </div>
                <div className="form-group admin-form-group--full-width">
                    <label className="form-label" htmlFor="turnoverToday">Volume (24h)</label>
                    <input className="form-input" type="number" id="turnoverToday" name="turnoverToday" value={formData.turnoverToday} onChange={handleChange} required step="1" disabled={isSubmitting} />
                </div>
                 <div className="form-group admin-form-group--full-width">
                    <label className="form-label" htmlFor="description">Description</label>
                    <textarea className="form-input" id="description" name="description" value={formData.description} onChange={handleChange} required rows={4} disabled={isSubmitting}></textarea>
                </div>
            </div>
            <div className="admin-form__actions">
                <button type="button" className="btn btn--back" onClick={onCancel} disabled={isSubmitting}>Annuler</button>
                <button type="submit" className="btn btn--submit" disabled={isSubmitting}>{isSubmitting ? 'Sauvegarde...' : (isEditing ? 'Sauvegarder' : 'Ajouter')}</button>
            </div>
        </form>
    );
};