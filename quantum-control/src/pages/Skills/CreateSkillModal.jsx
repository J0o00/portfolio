import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function CreateSkillModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({
      name: name.trim(),
      slug: slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '400px',
        padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Create New Skill</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="admin-form-group">
            <label>Name</label>
            <input 
              type="text" 
              className="admin-input" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. MATLAB Simulink"
              required 
            />
          </div>

          <div className="admin-form-group">
            <label>Slug (optional)</label>
            <input 
              type="text" 
              className="admin-input" 
              value={slug} 
              onChange={e => setSlug(e.target.value)} 
              placeholder="e.g. matlab-simulink" 
            />
            <small style={{ color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Leave blank to auto-generate from name
            </small>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="admin-button-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-button-primary" disabled={!name.trim()}>Create Skill</button>
          </div>
        </form>
      </div>
    </div>
  );
}
