import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
    birthDate: string;
    gender?: string;
    consent: boolean;
  }) => Promise<void>;
}

export const LoginPage = ({ onLogin, onSignUp }: LoginPageProps) => {
  // Ajout d'une fonction de login par défaut si non fournie
  const [loginResult, setLoginResult] = useState<string | null>(null);
  async function defaultOnLogin(email: string, password: string) {
    setLoginResult(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      setLoginResult('Connexion réussie ! Token : ' + data.token);
      // Redirection ou autre action possible ici
    } else {
      setLoginResult(data.message || 'Erreur de connexion');
    }
  }
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
        await (onLogin || defaultOnLogin)(email, password);
      } else {
        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;
        const username = formData.get('username') as string;
        const confirmPassword = formData.get('confirmPassword') as string;
        const birthDate = formData.get('birthDate') as string;
        const gender = formData.get('gender') as string;
        const consent = formData.get('consent') === 'on';

        if (password !== confirmPassword) {
          alert("Les mots de passe ne correspondent pas.");
          return;
        }

        if (!consent) {
          alert("Vous devez accepter les conditions pour continuer.");
          return;
        }

        await onSignUp({ email, password, firstName, lastName, username, birthDate, gender, consent });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
  };

  const boxStyle = {
    marginBottom: '1rem',
    padding: '1rem',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
        padding: '2rem',
        // Fond transparent, aucune couleur
      }}
    >
      <div style={{ width: '400px' }}>
        {/* Toggle login/signup */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setMode('login')}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: mode === 'login' ? '#4f46e5' : '#e5e7eb',
              color: mode === 'login' ? 'white' : '#111827',
              fontWeight: 'bold',
            }}
          >
            Connexion
          </button>
          <button
            onClick={() => setMode('signup')}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: mode === 'signup' ? '#4f46e5' : '#e5e7eb',
              color: mode === 'signup' ? 'white' : '#111827',
              fontWeight: 'bold',
            }}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={handleSubmit}>
        {/* Email */}
        <div style={boxStyle}>
        <label htmlFor="email" style={{ display: 'block', marginBottom: '0.3rem', color: '#111827' }}>
            Adresse e-mail
        </label>
        <input type="email" id="email" name="email" required disabled={isLoading} style={inputStyle} />
        </div>

        {/* Mot de passe */}
        <div style={boxStyle}>
        <label htmlFor="password" style={{ display: 'block', marginBottom: '0.3rem', color: '#111827' }}>
            Mot de passe
        </label>
        <input
            type="password"
            id="password"
            name="password"
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            disabled={isLoading}
            style={inputStyle}
        />
        </div>

        {mode === 'signup' && (
        <>
            {/* Confirmation mot de passe */}
            <div style={boxStyle}>
            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.3rem', color: '#111827' }}>
                Confirmer mot de passe
            </label>
            <input type="password" id="confirmPassword" name="confirmPassword" required disabled={isLoading} style={inputStyle} />
            </div>

            {/* Prénom et Nom */}
            <div style={boxStyle}>
            <label htmlFor="firstName" style={{ color: '#111827' }}>Prénom</label>
            <input type="text" id="firstName" name="firstName" required disabled={isLoading} style={inputStyle} />
            </div>
            <div style={boxStyle}>
            <label htmlFor="lastName" style={{ color: '#111827' }}>Nom</label>
            <input type="text" id="lastName" name="lastName" required disabled={isLoading} style={inputStyle} />
            </div>

            {/* Pseudo */}
            <div style={boxStyle}>
            <label htmlFor="username" style={{ color: '#111827' }}>Nom d'utilisateur / pseudo</label>
            <input type="text" id="username" name="username" required disabled={isLoading} style={inputStyle} />
            </div>

            {/* Date de naissance */}
            <div style={boxStyle}>
            <label htmlFor="birthDate" style={{ color: '#111827' }}>Date de naissance</label>
            <input type="date" id="birthDate" name="birthDate" required disabled={isLoading} style={inputStyle} />
            </div>

            {/* Sexe / Genre */}
            <div style={boxStyle}>
            <label htmlFor="gender" style={{ color: '#111827' }}>Sexe / Genre (optionnel)</label>
            <select id="gender" name="gender" disabled={isLoading} style={inputStyle}>
                <option value="">Sélectionnez</option>
                <option value="male">Homme</option>
                <option value="female">Femme</option>
                <option value="other">Autre</option>
            </select>
            </div>

            {/* Consentement RGPD */}
            <div style={{ ...boxStyle, display: 'flex', alignItems: 'center' }}>
            <input type="checkbox" id="consent" name="consent" required disabled={isLoading} style={{ marginRight: '0.5rem' }} />
            <label htmlFor="consent" style={{ color: '#111827' }}>
                J'accepte les <a href="/terms" target="_blank" rel="noreferrer" style={{ color: '#4f46e5' }}>conditions et la politique de confidentialité</a>
            </label>
            </div>
        </>
        )}

          {/* Bouton submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.7rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#4f46e5',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '1rem',
            }}
          >
            {isLoading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer un compte'}
          </button>
        </form>
        {loginResult && (
          <div style={{ marginTop: '1rem', color: loginResult.startsWith('Connexion') ? 'green' : 'red' }}>
            {loginResult}
          </div>
        )}
      </div>
    </div>
  );
};
