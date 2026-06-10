import React, { useState } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../context/AuthContext';
import { X, Send, Loader2 } from 'lucide-react';

export default function UserInviteModal({ onClose, onInviteSuccess }) {
  const { userProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError('');

    try {
      const { error: dbError } = await supabase
        .from('user_invites')
        .insert({
          email: email.trim().toLowerCase(),
          role: role,
          invited_by: userProfile.id
        });

      if (dbError) throw dbError;

      if (onInviteSuccess) onInviteSuccess();
      onClose();
    } catch (err) {
      console.error('Invite failed:', err);
      // More friendly error for unique constraint
      if (err.code === '23505') {
        setError('An invite for this email already exists or they are already a user.');
      } else {
        setError(err.message || 'Failed to send invite');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-placeholder)' }}
        >
          <X size={20} />
        </button>
        
        <h3 style={{ margin: '0 0 1.5rem 0' }}>Whitelist New User</h3>
        
        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label className="admin-label">Email Address</label>
            <input 
              type="email" 
              required
              className="admin-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="admin-label">Initial Role</label>
            <select 
              className="admin-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              {userProfile?.role === 'Owner' && <option value="Owner">Owner</option>}
              {userProfile?.role === 'Owner' && <option value="Admin">Admin</option>}
              <option value="Editor">Editor</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="admin-button-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="admin-button"
              disabled={loading || !email}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Whitelist User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
