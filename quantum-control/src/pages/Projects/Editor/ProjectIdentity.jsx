import React from 'react';

export default function ProjectIdentity({ data, update }) {
  return (
    <div className="admin-card">
      <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--admin-accent)' }}>Project Identity</h3>
      
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div className="admin-form-group">
          <label className="admin-label">Title</label>
          <input 
            type="text" 
            className="admin-input"
            value={data?.title || ''}
            onChange={e => update({ title: e.target.value })}
            placeholder="e.g. Digital Twin Motor"
          />
        </div>

        <div className="admin-form-group">
          <label className="admin-label">URL Slug</label>
          <input 
            type="text" 
            className="admin-input"
            value={data?.slug || ''}
            onChange={e => update({ slug: e.target.value })}
            placeholder="e.g. digital-twin-motor"
          />
          <span className="admin-help-text">Must be unique, lowercase, no spaces.</span>
        </div>

        <div className="admin-form-group">
          <label className="admin-label">Excerpt (Short Preview)</label>
          <textarea 
            className="admin-input"
            rows={3}
            value={data?.excerpt || ''}
            onChange={e => update({ excerpt: e.target.value })}
            placeholder="A brief summary for project cards"
          />
        </div>
      </div>
    </div>
  );
}
