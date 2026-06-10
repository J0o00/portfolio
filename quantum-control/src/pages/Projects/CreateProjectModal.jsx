import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function CreateProjectModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !slug) return;
    
    setLoading(true);
    setError(null);
    try {
      await onSubmit({ title: title.trim(), slug });
    } catch (err) {
      console.error(err);
      if (err.code === '23505') {
        setError('A project with this slug already exists.');
      } else {
        setError(err.message || 'Failed to create project');
      }
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Create New Project</h2>
          <button onClick={onClose} className="admin-button-secondary" style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ padding: '0.75rem', background: 'rgba(255, 50, 50, 0.1)', color: '#ff3333', borderRadius: '8px', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}
            
            <div className="admin-form-group">
              <label className="admin-label">Project Title</label>
              <input
                type="text"
                className="admin-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Digital Twin Motor"
                autoFocus
                required
              />
            </div>
            
            <div className="admin-form-group">
              <label className="admin-label">URL Slug (Auto-generated)</label>
              <input
                type="text"
                className="admin-input"
                value={slug}
                disabled
                style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: '#666' }}
              />
            </div>
          </div>
          
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onClose} className="admin-button-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="admin-button-primary" disabled={loading || !title.trim()}>
              {loading ? <Loader2 size={16} className="spin" /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
