import React, { useState, useEffect } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Users as UsersIcon, UserPlus, Shield, ShieldAlert, Mail, Clock, Trash2 } from 'lucide-react';
import UserInviteModal from './UserInviteModal';

export default function Users() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch active users
    const { data: usersData, error: usersError } = await supabase
      .from('users_profile')
      .select('*')
      .order('created_at', { ascending: false });
      
    // Fetch pending invites
    const { data: invitesData, error: invitesError } = await supabase
      .from('user_invites')
      .select('*')
      .order('created_at', { ascending: false });

    if (!usersError) setUsers(usersData || []);
    if (!invitesError) setInvites(invitesData || []);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId, currentRole, newRole) => {
    if (currentRole === newRole) return;
    
    const { error } = await supabase
      .from('users_profile')
      .update({ role: newRole })
      .eq('id', userId);
      
    if (error) {
      alert(`Failed to update role: ${error.message}`);
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const handleStatusChange = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    
    const { error } = await supabase
      .from('users_profile')
      .update({ status: newStatus })
      .eq('id', userId);
      
    if (error) {
      alert(`Failed to update status: ${error.message}`);
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    }
  };

  const handleCancelInvite = async (inviteId) => {
    if (!window.confirm('Are you sure you want to cancel this invite?')) return;
    
    const { error } = await supabase
      .from('user_invites')
      .delete()
      .eq('id', inviteId);
      
    if (error) {
      alert(`Failed to cancel invite: ${error.message}`);
    } else {
      setInvites(invites.filter(i => i.id !== inviteId));
    }
  };

  // Determine if current user can manage a specific target user
  const canManage = (targetUser) => {
    if (userProfile?.role === 'Owner') return true;
    if (userProfile?.role === 'Admin' && targetUser.role !== 'Owner') return true;
    return false;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UsersIcon /> Users & Roles
          </h2>
          <p style={{ margin: 0, color: 'var(--admin-placeholder)' }}>Manage team access and permissions.</p>
        </div>
        
        {(userProfile?.role === 'Owner' || userProfile?.role === 'Admin') && (
          <button 
            onClick={() => setShowInviteModal(true)}
            className="admin-button"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <UserPlus size={18} />
            Whitelist User
          </button>
        )}
      </div>

      {/* Active Users Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--admin-border-color)', background: 'rgba(255,255,255,0.5)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Active Users</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--admin-border-color)', fontWeight: '600' }}>Email</th>
                <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--admin-border-color)', fontWeight: '600' }}>Role</th>
                <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--admin-border-color)', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--admin-border-color)', fontWeight: '600' }}>Last Login</th>
                <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--admin-border-color)', fontWeight: '600' }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Loading users...</td></tr>
              ) : users.map(user => {
                const isSelf = user.id === userProfile?.id;
                const editable = canManage(user) && !isSelf;
                
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--admin-border-color)', background: user.status === 'Suspended' ? '#fef2f2' : 'transparent' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {user.role === 'Owner' ? <Shield size={16} color="#4f46e5" /> : 
                         user.role === 'Admin' ? <ShieldAlert size={16} color="#d97706" /> : 
                         <UsersIcon size={16} color="var(--admin-placeholder)" />}
                        <span style={{ fontWeight: isSelf ? 'bold' : 'normal' }}>
                          {user.email} {isSelf && '(You)'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {editable ? (
                        <select 
                          className="admin-input" 
                          style={{ padding: '0.25rem', margin: 0, height: 'auto', width: 'auto' }}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, user.role, e.target.value)}
                        >
                          {userProfile?.role === 'Owner' && <option value="Owner">Owner</option>}
                          <option value="Admin">Admin</option>
                          <option value="Editor">Editor</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      ) : (
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '12px', 
                          fontSize: '0.85rem',
                          background: user.role === 'Owner' ? '#e0e7ff' : '#f3f4f6',
                          color: user.role === 'Owner' ? '#4f46e5' : '#374151'
                        }}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {editable ? (
                        <button 
                          onClick={() => handleStatusChange(user.id, user.status)}
                          style={{ 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '12px', 
                            fontSize: '0.85rem',
                            border: 'none',
                            cursor: 'pointer',
                            background: user.status === 'Active' ? '#dcfce7' : '#fee2e2',
                            color: user.status === 'Active' ? '#166534' : '#991b1b'
                          }}
                        >
                          {user.status}
                        </button>
                      ) : (
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '12px', 
                          fontSize: '0.85rem',
                          background: user.status === 'Active' ? '#dcfce7' : '#fee2e2',
                          color: user.status === 'Active' ? '#166534' : '#991b1b'
                        }}>
                          {user.status}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--admin-placeholder)', fontSize: '0.9rem' }}>
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--admin-placeholder)', fontSize: '0.9rem' }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invites Table */}
      {invites.length > 0 && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--admin-border-color)', background: 'rgba(255,255,255,0.5)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Pending Whitelist Approvals</h3>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--admin-border-color)', fontWeight: '600' }}>Email</th>
                  <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--admin-border-color)', fontWeight: '600' }}>Initial Role</th>
                  <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--admin-border-color)', fontWeight: '600' }}>Added On</th>
                  <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--admin-border-color)', fontWeight: '600', width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invites.map(invite => (
                  <tr key={invite.id} style={{ borderBottom: '1px solid var(--admin-border-color)' }}>
                    <td style={{ padding: '1rem 1.5rem', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={16} />
                        {invite.email}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem', background: '#f3f4f6', color: '#374151' }}>
                        {invite.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--admin-placeholder)', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} />
                        {new Date(invite.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <button 
                        onClick={() => handleCancelInvite(invite.id)}
                        className="admin-button-secondary"
                        style={{ padding: '0.4rem', color: '#dc2626', borderColor: '#fca5a5' }}
                        title="Cancel Invite"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showInviteModal && (
        <UserInviteModal 
          onClose={() => setShowInviteModal(false)} 
          onInviteSuccess={fetchData} 
        />
      )}
    </div>
  );
}
