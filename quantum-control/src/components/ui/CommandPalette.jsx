import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Folder, FileText, Image, Users, Award, BookOpen, Clock, ArrowRight } from 'lucide-react';

const ACTIONS = [
  { id: 'create-proj', title: 'Create Project', type: 'Action', icon: <Plus size={16} color="#3b82f6" />, url: '/projects?new=true' },
  { id: 'create-res', title: 'Create Research Paper', type: 'Action', icon: <Plus size={16} color="#10b981" />, url: '/research?new=true' },
  { id: 'invite-user', title: 'Invite New User', type: 'Action', icon: <Users size={16} color="#8b5cf6" />, url: '/users?invite=true' },
  { id: 'nav-projects', title: 'Go to Projects CMS', type: 'Navigation', icon: <Folder size={16} />, url: '/projects' },
  { id: 'nav-research', title: 'Go to Research CMS', type: 'Navigation', icon: <BookOpen size={16} />, url: '/research' },
  { id: 'nav-media', title: 'Open Media Library', type: 'Navigation', icon: <Image size={16} />, url: '/media' },
  { id: 'nav-skills', title: 'Go to Technical Skills', type: 'Navigation', icon: <Award size={16} />, url: '/skills' },
  { id: 'nav-experience', title: 'Search Experience CMS', type: 'Navigation', icon: <Clock size={16} />, url: '/experience' },
  { id: 'nav-resume', title: 'Resume Intelligence Portal', type: 'Navigation', icon: <FileText size={16} />, url: '/resume-sync' }
];

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClose(!isOpen);
      }
      if (isOpen && e.key === 'Escape') {
        onClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = ACTIONS.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase()) || 
    a.type.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (url) => {
    navigate(url);
    onClose(false);
    setQuery('');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 999999, padding: '10vh 1rem 1rem 1rem' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '640px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column' }}>
        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', gap: '0.75rem' }}>
          <Search size={20} color="#64748b" />
          <input 
            type="text" 
            placeholder="Type a command or jump to page... (Ctrl + K)" 
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            autoFocus
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '1.05rem', color: '#0f172a', fontWeight: 500 }}
          />
          <kbd style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>ESC</kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '0.75rem' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>No commands found matching "{query}"</div>
          ) : (
            filtered.map((action, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div 
                  key={action.id}
                  onClick={() => handleSelect(action.url)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '10px',
                    background: isSelected ? '#eff6ff' : 'transparent', cursor: 'pointer', transition: 'background 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.4rem', background: isSelected ? '#fff' : '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex' }}>
                      {action.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: isSelected ? 700 : 600, color: isSelected ? '#1d4ed8' : '#1e293b', fontSize: '0.95rem' }}>{action.title}</div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{action.type}</span>
                    </div>
                  </div>

                  {isSelected && <ArrowRight size={18} color="#3b82f6" />}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.6rem 1.25rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
          <span>Navigate with <kbd>↑</kbd> <kbd>↓</kbd> arrows, <kbd>Enter</kbd> to jump</span>
          <span>Quantum Control Platform v1.0</span>
        </div>
      </div>
    </div>
  );
}
