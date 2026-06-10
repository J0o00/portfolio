import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

export default function Login() {
  const { signInWithGoogle, user, userProfile } = useAuth();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--admin-bg)' }}>
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <h1 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Quantum Control</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Private Administration Platform</p>
        
        {user && !userProfile && (
          <div style={{ marginBottom: '2rem', padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '0.9rem' }}>
            Access Denied. Your email is not whitelisted.
          </div>
        )}

        <button onClick={signInWithGoogle} className="admin-button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
          <LogIn size={18} />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
