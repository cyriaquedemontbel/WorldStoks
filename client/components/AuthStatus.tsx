import React, { useEffect, useState } from 'react';

const AuthStatus: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Aucun token trouvé.');
      return;
    }
    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Token invalide ou expiré');
        return res.json();
      })
      .then(data => {
        setUser(data);
      })
      .catch(err => {
        setError(err.message);
      });
  }, []);

  if (error) return <div style={{ color: 'red' }}>Erreur d’authentification : {error}</div>;
  if (!user) return <div>Vérification de l’authentification...</div>;
  return <div style={{ color: 'green' }}>Connecté en tant que : {user.email || user.username}</div>;
};

export default AuthStatus;
