import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Image as ImageIcon, Settings, UserCircle, LogOut, FolderKanban, BookOpen, Briefcase, Code2, GraduationCap, FileText, Search } from 'lucide-react';
import CommandPalette from '../components/ui/CommandPalette';

export default function AdminLayout() {
  const { userProfile, signOut } = useAuth();
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItemStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    textDecoration: 'none',
    color: isActive ? 'var(--admin-accent)' : 'var(--admin-text)',
    background: isActive ? 'rgba(0, 102, 204, 0.1)' : 'transparent',
    borderRadius: '8px',
    marginBottom: '0.5rem',
    fontWeight: isActive ? 600 : 400,
    transition: 'all 0.2s ease'
  });

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div style={{ padding: '0 1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Quantum Control</h2>
          <span style={{ fontSize: '0.8rem', color: '#666' }}>Role: {userProfile?.role}</span>
        </div>

        {/* Command Palette Trigger */}
        <button 
          onClick={() => setIsCmdOpen(true)}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem',
            background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '1.5rem',
            color: '#64748b', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', outline: 'none'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Search size={16} /> Quick Search...</span>
          <kbd style={{ fontSize: '0.7rem', background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>Ctrl+K</kbd>
        </button>

        <nav style={{ flex: 1 }}>
          <NavLink to="/" style={navItemStyle} end><LayoutDashboard size={18} /> Dashboard</NavLink>
          <NavLink to="/profile" style={navItemStyle}><UserCircle size={18} /> Profile Manager</NavLink>
          <NavLink to="/projects" style={navItemStyle}><FolderKanban size={18} /> Projects</NavLink>
          <NavLink to="/research" style={navItemStyle}><BookOpen size={18} /> Research</NavLink>
          <NavLink to="/experience" style={navItemStyle}><Briefcase size={18} /> Experience</NavLink>
          <NavLink to="/education" style={navItemStyle}><GraduationCap size={18} /> Education</NavLink>
          <NavLink to="/skills" style={navItemStyle}><Code2 size={18} /> Skills</NavLink>
          <NavLink to="/resume-sync" style={navItemStyle}><FileText size={18} /> Resume Sync</NavLink>
          <NavLink to="/media" style={navItemStyle}><ImageIcon size={18} /> Media Library</NavLink>
          
          {(userProfile?.role === 'Owner' || userProfile?.role === 'Admin') && (
            <NavLink to="/users" style={navItemStyle}><Users size={18} /> Users</NavLink>
          )}
          
          <NavLink to="/settings" style={navItemStyle}><Settings size={18} /> Settings</NavLink>
        </nav>

        <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '1rem', marginTop: 'auto' }}>
          <button onClick={handleSignOut} className="admin-button-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer', border: 'none', textAlign: 'left' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>
      
      <main className="admin-main">
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '2rem', flex: 1, boxSizing: 'border-box' }}>
          <Outlet />
        </div>
      </main>

      <CommandPalette isOpen={isCmdOpen} onClose={setIsCmdOpen} />
    </div>
  );
}
