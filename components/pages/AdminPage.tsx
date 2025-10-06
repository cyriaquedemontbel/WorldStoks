import React, { useState, useEffect, useCallback } from 'react';
import { User, DailyMarket, IconName, OverUnderMarket, ExactValueMarket } from '../../types';
import { getAllMarkets, addMarket, updateMarket, deleteMarket } from '../../services/marketService';
import { getAllUsers, toggleUserSuspension } from '../../services/userService';
import { suggestMarket, suggestStormMarket } from '../../services/geminiService';
import { Icon } from '../Icon';
import LoadingSpinner from '../LoadingSpinner';


// --- Sub-components for Admin Page ---

const MarketRow: React.FC<{ market: DailyMarket; onEdit: (market: DailyMarket) => void; onDelete: (id: string) => void; }> = ({ market, onEdit, onDelete }) => (
    <tr className="border-b border-border-color dark:border-border-color-dark hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
        <td className="p-3 text-sm">{market.event}</td>
        <td className="p-3 text-sm">{market.location}</td>
        <td className="p-3 text-sm">{market.date}</td>
        <td className="p-3 text-sm">{market.betType === 'OverUnder' ? market.options.A.odds.toFixed(2) : '-'}</td>
        <td className="p-3 text-sm">{market.betType === 'OverUnder' ? market.options.B.odds.toFixed(2) : '-'}</td>
        <td className="p-3 text-sm">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${market.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>
                {market.status}
            </span>
        </td>
        <td className="p-3 text-sm text-right">
            <button onClick={() => onEdit(market)} className="text-primary hover:underline mr-4">Edit</button>
            <button onClick={() => onDelete(market.id)} className="text-red-500 hover:underline">Delete</button>
        </td>
    </tr>
);

const UserRow: React.FC<{ user: User; onToggleSuspension: (id: string) => void; }> = ({ user, onToggleSuspension }) => (
    <tr className="border-b border-border-color dark:border-border-color-dark hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
        <td className="p-3 text-sm">{user.username}</td>
        <td className="p-3 text-sm">{user.email}</td>
        <td className="p-3 text-sm">${user.balance.toFixed(2)}</td>
        <td className="p-3 text-sm">{user.bets.length}</td>
        <td className="p-3 text-sm">
             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isSuspended ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>
                {user.isSuspended ? 'Suspended' : 'Active'}
            </span>
        </td>
        <td className="p-3 text-sm text-right">
            <button 
                onClick={() => onToggleSuspension(user.id)} 
                className={`text-sm font-semibold py-1 px-3 rounded-md transition-colors ${user.isSuspended ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-orange-100 text-orange-800 hover:bg-orange-200'}`}
            >
                {user.isSuspended ? 'Unsuspend' : 'Suspend'}
            </button>
        </td>
    </tr>
);

const getInitialState = (market: Partial<DailyMarket> | null): Partial<DailyMarket> => {
    const defaults = {
        event: '', location: '', date: new Date(Date.now() + 864e5).toISOString().slice(0, 10), icon: 'temperature' as const
    };

    const newMarketDefaults = {
        betType: 'OverUnder' as const,
        options: { A: { name: '', odds: 1.85 }, B: { name: '', odds: 1.90 } },
    };

    if (market) {
        return { ...defaults, ...market };
    }

    return { ...defaults, ...newMarketDefaults };
};


const MarketForm: React.FC<{ 
    market: Partial<DailyMarket> | null; 
    onSave: (market: Partial<DailyMarket>) => void; 
    onCancel: () => void; 
    isLoading: boolean;
}> = ({ market, onSave, onCancel, isLoading }) => {
    // FIX: Conditionally construct the initial state to ensure it's a valid DailyMarket partial type.
    // This avoids creating an object with conflicting properties like `betType: 'ExactValue'` and an `options` property.
    const [formData, setFormData] = useState<Partial<DailyMarket>>(getInitialState(market));
    const [isSuggesting, setIsSuggesting] = useState(false);

    useEffect(() => {
        // FIX: Conditionally construct the initial state to ensure it's a valid DailyMarket partial type.
        // This avoids creating an object with conflicting properties like `betType: 'ExactValue'` and an `options` property.
        setFormData(getInitialState(market));
    }, [market]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('option')) {
            const [_, option, field] = name.split('.');
            // FIX: Ensure the updated state is a valid Partial<OverUnderMarket> by removing the 'range' property.
            setFormData(prev => {
                const { range, ...rest } = prev as Partial<DailyMarket> & { range?: any; options?: any };
                const baseOptions = rest.options || { A: {}, B: {} };
                const optionToUpdate = baseOptions[option as 'A' | 'B'] || {};

                return {
                    ...rest,
                    betType: 'OverUnder',
                    options: {
                        ...baseOptions,
                        [option]: {
                            ...optionToUpdate,
                            [field]: field === 'odds' ? parseFloat(value) : value,
                        },
                    },
                };
            });
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSuggest = async () => {
        setIsSuggesting(true);
        try {
            const suggestion = await suggestMarket();
            // FIX: When merging the suggestion, ensure the resulting object is a valid DailyMarket partial
            // by removing the conflicting property ('range' for OverUnder, 'options' for ExactValue).
            setFormData(prev => {
                const combined = { ...prev, ...suggestion, date: prev.date };
                if (combined.betType === 'ExactValue') {
                    const { options, ...rest } = combined as any;
                    return rest;
                }
                const { range, ...rest } = combined as any;
                return rest;
            });
        } catch (error) {
            console.error("Failed to get suggestion", error);
            // You could show an error toast here
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in">
            <div className="bg-surface dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-lg p-6 m-4 overflow-y-auto max-h-screen">
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-bold">{market?.id ? 'Edit Market' : 'Add New Market'}</h3>
                      <button type="button" onClick={handleSuggest} disabled={isSuggesting} className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-wait">
                        {isSuggesting ? 'Thinking...' : 'Suggest Daily Market'}
                        {!isSuggesting && <Icon icon="storm" className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium">Event</label>
                            <input name="event" value={formData.event} onChange={handleChange} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 border border-border-color dark:border-border-color-dark rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Location</label>
                            <input name="location" value={formData.location} onChange={handleChange} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 border border-border-color dark:border-border-color-dark rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Date</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 border border-border-color dark:border-border-color-dark rounded-md" required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Icon</label>
                            <select name="icon" value={formData.icon} onChange={handleChange} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 border border-border-color dark:border-border-color-dark rounded-md">
                                {(['sun', 'rain', 'wind', 'temperature', 'storm', 'snow', 'cyclone'] as IconName[]).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                            </select>
                        </div>
                        {formData.id && (
                             <div>
                                <label className="block text-sm font-medium">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 border border-border-color dark:border-border-color-dark rounded-md">
                                    <option value="Active">Active</option>
                                    <option value="Settled">Settled</option>
                                </select>
                            </div>
                        )}
                        <div className="md:col-span-2"><hr className="my-2 border-border-color dark:border-border-color-dark"/></div>
                        <div className="md:col-span-2">
                            <h4 className="font-semibold mb-2">Option A</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium">Name</label><input name="option.A.name" value={(formData as Partial<OverUnderMarket>).options?.A.name} onChange={handleChange} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 border border-border-color dark:border-border-color-dark rounded-md" required /></div>
                                <div><label className="block text-sm font-medium">Odds</label><input type="number" step="0.01" name="option.A.odds" value={(formData as Partial<OverUnderMarket>).options?.A.odds} onChange={handleChange} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 border border-border-color dark:border-border-color-dark rounded-md" required /></div>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <h4 className="font-semibold mb-2">Option B</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium">Name</label><input name="option.B.name" value={(formData as Partial<OverUnderMarket>).options?.B.name} onChange={handleChange} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 border border-border-color dark:border-border-color-dark rounded-md" required /></div>
                                <div><label className="block text-sm font-medium">Odds</label><input type="number" step="0.01" name="option.B.odds" value={(formData as Partial<OverUnderMarket>).options?.B.odds} onChange={handleChange} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 border border-border-color dark:border-border-color-dark rounded-md" required /></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={onCancel} className="bg-slate-200 dark:bg-slate-700 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-400">{isLoading ? 'Saving...' : 'Save Market'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Main Admin Page Component ---

const AdminPage: React.FC<{ user: User | null; }> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'markets' | 'users'>('markets');
    const [markets, setMarkets] = useState<DailyMarket[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMarket, setEditingMarket] = useState<Partial<DailyMarket> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSuggestingStorm, setIsSuggestingStorm] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'markets') {
                const marketsData = await getAllMarkets();
                setMarkets(marketsData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            } else {
                const usersData = await getAllUsers();
                setUsers(usersData);
            }
        } catch (error) {
            console.error(`Failed to load ${activeTab}`, error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        loadData();
    }, [activeTab, loadData]);

    const handleEdit = (market: DailyMarket) => {
        setEditingMarket(market);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingMarket(null);
        setIsFormOpen(true);
    };

    const handleSuggestStorm = async () => {
        setIsSuggestingStorm(true);
        try {
            const suggestion = await suggestStormMarket();
            const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
            setEditingMarket({ ...suggestion, date: tomorrow });
            setIsFormOpen(true);
        } catch (error) {
            console.error("Failed to suggest storm market:", error);
            // You could show an error toast here in a real app
        } finally {
            setIsSuggestingStorm(false);
        }
    };

    const handleSave = async (marketData: Partial<DailyMarket>) => {
        setIsSaving(true);
        try {
            if (marketData.id) {
                await updateMarket(marketData as DailyMarket);
            } else {
                await addMarket(marketData as Omit<DailyMarket, 'id' | 'status'>);
            }
            setIsFormOpen(false);
            setEditingMarket(null);
            await loadData(); // Reload markets
        } catch (error) {
            console.error("Failed to save market", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this market?')) {
            try {
                await deleteMarket(id);
                await loadData(); // Reload markets
            } catch (error) {
                console.error("Failed to delete market", error);
            }
        }
    };

    const handleToggleSuspension = async (userId: string) => {
        try {
            await toggleUserSuspension(userId);
            await loadData(); // Reload user data
        } catch (error) {
            console.error("Failed to toggle user suspension", error);
        }
    };
    
    if (!user || !user.isAdmin) {
        return <div className="text-center p-8"><h2 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h2><p>You do not have permission to view this page.</p></div>;
    }

    const TabButton: React.FC<{tab: 'markets' | 'users', children: React.ReactNode}> = ({ tab, children }) => (
        <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${activeTab === tab ? 'bg-surface dark:bg-surface-dark border-b-2 border-primary' : 'text-text-secondary dark:text-text-secondary-dark hover:bg-slate-200/50'}`}>
            {children}
        </button>
    );

    return (
        <div className="animate-fade-in max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary dark:text-text-primary-dark mb-8">Admin Dashboard</h1>

            <div className="flex border-b border-border-color dark:border-border-color-dark mb-6">
                <TabButton tab="markets">Manage Markets</TabButton>
                <TabButton tab="users">Manage Users</TabButton>
            </div>
            
            {isFormOpen && <MarketForm market={editingMarket} onSave={handleSave} onCancel={() => setIsFormOpen(false)} isLoading={isSaving} />}

            {isLoading ? <div className="flex justify-center py-16"><LoadingSpinner /></div> : (
                <div className="bg-surface dark:bg-surface-dark p-6 rounded-xl shadow-lg border border-border-color/50 dark:border-border-color-dark/50">
                    {activeTab === 'markets' && (
                        <div>
                             <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                                <h2 className="text-2xl font-bold">Markets</h2>
                                <div className="flex gap-2 flex-wrap">
                                    <button onClick={handleSuggestStorm} disabled={isSuggestingStorm} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2 disabled:bg-slate-400">
                                        {isSuggestingStorm ? 'Scanning...' : 'Suggest Storm Market'}
                                        {!isSuggestingStorm && <Icon icon="cyclone" className="w-5 h-5" />}
                                    </button>
                                    <button onClick={handleAddNew} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">Add New Market</button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b-2 border-border-color dark:border-border-color-dark bg-slate-50 dark:bg-slate-900/50">
                                        <tr>
                                            <th className="p-3 text-sm font-semibold">Event</th><th className="p-3 text-sm font-semibold">Location</th><th className="p-3 text-sm font-semibold">Date</th>
                                            <th className="p-3 text-sm font-semibold">Odds A</th><th className="p-3 text-sm font-semibold">Odds B</th><th className="p-3 text-sm font-semibold">Status</th>
                                            <th className="p-3 text-sm font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {markets.map(m => <MarketRow key={m.id} market={m} onEdit={handleEdit} onDelete={handleDelete} />)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {activeTab === 'users' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Users</h2>
                             <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b-2 border-border-color dark:border-border-color-dark bg-slate-50 dark:bg-slate-900/50">
                                        <tr>
                                            <th className="p-3 text-sm font-semibold">Username</th><th className="p-3 text-sm font-semibold">Email</th>
                                            <th className="p-3 text-sm font-semibold">Balance</th><th className="p-3 text-sm font-semibold">Bets Placed</th>
                                            <th className="p-3 text-sm font-semibold">Status</th><th className="p-3 text-sm font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => <UserRow key={u.id} user={u} onToggleSuspension={handleToggleSuspension} />)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminPage;