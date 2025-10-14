// pages/SettingsPage.tsx
import React, { useState } from 'react';
import { User } from '../types';
import * as api from '../services/api';

interface SettingsPageProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, onUpdateUser }) => {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [username, setUsername] = useState(user.username || '');
  const [birthDate, setBirthDate] = useState(user.birthDate || '');
  const [gender, setGender] = useState(user.gender || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    if (password && password !== confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      // On pourrait créer une route API pour mettre à jour l'utilisateur
      const updatedUser = await api.apiUpdateUser({
        firstName,
        lastName,
        username,
        birthDate,
        gender,
        ...(password ? { password } : {})
      });
      onUpdateUser(updatedUser);
      setMessage('Profil mis à jour avec succès !');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="settings-page-container" aria-labelledby="settings-title">
      <header className="settings-title" id="settings-title">Compte&nbsp;<span style={{fontWeight:400,opacity:0.7}}>SET</span></header>
      <div className="settings-card">
        {message && <div className="settings-message">{message}</div>}
        <div className="settings-group">
          <label>Prénom</label>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>
        <div className="settings-group">
          <label>Nom</label>
          <input value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
        <div className="settings-group">
          <label>Nom d'utilisateur / pseudo</label>
          <input value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div className="settings-group">
          <label>Date de naissance</label>
          <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
        </div>
        <div className="settings-group">
          <label>Sexe / Genre</label>
          <select value={gender} onChange={e => setGender(e.target.value)}>
            <option value="">Sélectionnez</option>
            <option value="male">Homme</option>
            <option value="female">Femme</option>
            <option value="other">Autre</option>
          </select>
        </div>
        <hr className="settings-separator" />
        <div className="settings-group">
          <label>Nouveau mot de passe</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div className="settings-group">
          <label>Confirmer mot de passe</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        </div>
        <button className="settings-save-btn" onClick={handleSave} disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </section>
  );
};
