import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function CreateResearchModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Investigation');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !slug || !type) return;
    
    setLoading(true);
    setError(null);
    try {
      await onSubmit({ title: title.trim(), slug, type });
    } catch (err) {
      console.error(err);
      if (err.code === '23505') {
        setError('A research item with this slug already exists.');
      } else {
        setError(err.message || 'Failed to create research item');
      }
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Create New Research</h2>
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
              <label className="admin-label">Title</label>
              <input
                type="text"
                className="admin-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Digital Twin of Induction Motor"
                autoFocus
                required
              />
            </div>
            
            <div className="admin-form-group">
              <label className="admin-label">Type</label>
              <select
                className="admin-input"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="Investigation">Investigation</option>
                <option value="Publication">Publication</option>
                <option value="Conference">Conference</option>
                <option value="Patent">Patent</option>
                <option value="Technical Note">Technical Note</option>
              </select>
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
              {loading ? <Loader2 size={16} className="spin" /> : 'Create Research'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
