import React, { useState, useEffect } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Trash2, Edit2 } from 'lucide-react';

export default function Users() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Viewer');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('users_profile').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Create a UUID manually, or let auth handle it. Wait, users_profile id references auth.users.
      // If we are strictly whitelisting BEFORE they sign up, auth.users won't have the ID yet.
      // This means our schema referencing auth.users on delete cascade needs them to exist in auth.users first.
      // Alternatively, the whitelist could be a separate table `whitelist`, or we use Supabase Admin API.
      // For now, let's insert into a whitelist or just assume we have to invite them.
      // Actually, since we can't insert into users_profile without auth.users ID (FK constraint),
      // we must use Supabase invite endpoint if we want them in auth.users, OR create a `whitelist` table.
      alert("Feature coming soon: Requires Supabase Admin API to invite or a separate Whitelist table.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveAccess = async (id, role) => {
    if (role === 'Owner') {
      alert("Cannot remove an Owner here. Use extreme caution.");
      return;
    }
    try {
      // Soft delete by suspending
      const { error } = await supabase.from('users_profile').update({ status: 'Suspended' }).eq('id', id);
      if (error) throw error;
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  if (userProfile?.role !== 'Owner' && userProfile?.role !== 'Admin') {
    return <div>Access Denied. You must be an Admin or Owner to view this page.</div>;
  }

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '2rem' }}>User Management</h2>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>Whitelist New User</h3>
        <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input 
              type="email" 
              className="admin-input" 
              placeholder="Email address" 
              value={newEmail} 
              onChange={e => setNewEmail(e.target.value)} 
              required 
            />
          </div>
          <div>
            <select className="admin-input" value={newRole} onChange={e => setNewRole(e.target.value)}>
              <option value="Owner">Owner</option>
              <option value="Admin">Admin</option>
              <option value="Editor">Editor</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
          <button type="submit" className="admin-button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={18} /> Invite
          </button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Approved Users</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border-color)' }}>
                <th style={{ padding: '0.75rem 0' }}>Email</th>
                <th style={{ padding: '0.75rem 0' }}>Role</th>
                <th style={{ padding: '0.75rem 0' }}>Status</th>
                <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '0.75rem 0' }}>{u.email}</td>
                  <td style={{ padding: '0.75rem 0' }}>
                    <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(0,102,204,0.1)', color: 'var(--admin-accent)', borderRadius: '4px', fontSize: '0.85rem' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0' }}>
                    <span style={{ color: u.status === 'Active' ? 'green' : 'red' }}>{u.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                    <button onClick={() => handleRemoveAccess(u.id, u.role)} className="admin-button-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '1rem 0', textAlign: 'center', color: '#666' }}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
