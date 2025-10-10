import React, { useState } from 'react';

interface LoginPageProps {
    onLogin: (email: string, pass: string) => Promise<void>;
    onSignUp: (email: string, pass: string) => Promise<void>;
}

export const LoginPage = ({ onLogin, onSignUp }: LoginPageProps) => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            if (mode === 'login') {
                await onLogin(email, password);
            } else {
                await onSignUp(email, password);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-form-container">
                <div className="form-tabs">
                    <button 
                        onClick={() => setMode('login')} 
                        className={`tab-btn ${mode === 'login' ? 'tab-btn--active' : ''}`}
                        aria-pressed={mode === 'login'}
                        disabled={isLoading}
                    >
                        Connexion
                    </button>
                    <button 
                        onClick={() => setMode('signup')} 
                        className={`tab-btn ${mode === 'signup' ? 'tab-btn--active' : ''}`}
                        aria-pressed={mode === 'signup'}
                        disabled={isLoading}
                    >
                        Inscription
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Adresse e-mail</label>
                        <input className="form-input" type="text" id="email" name="email" required autoComplete="email" disabled={isLoading} />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Mot de passe</label>
                        <input className="form-input" type="password" id="password" name="password" required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} disabled={isLoading}/>
                    </div>
                    <button type="submit" className="btn btn--submit" disabled={isLoading}>
                        {isLoading ? 'Chargement...' : (mode === 'login' ? 'Se connecter' : 'Créer un compte')}
                    </button>
                </form>
            </div>
        </div>
    );
};
