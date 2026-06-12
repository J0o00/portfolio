import React from 'react';

export default function ProjectContent({ data, update }) {
  return (
    <div className="admin-card">
      <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--admin-accent)' }}>Project Content</h3>
      
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div className="admin-form-group">
          <label className="admin-label">Short Description</label>
          <textarea 
            className="admin-input"
            rows={4}
            value={data?.short_description || ''}
            onChange={e => update({ short_description: e.target.value })}
            placeholder="Overview of the project"
          />
        </div>

        <div className="admin-form-group">
          <label className="admin-label">Full Description</label>
          <textarea 
            className="admin-input"
            rows={10}
            value={data?.full_description || ''}
            onChange={e => update({ full_description: e.target.value })}
            placeholder="Detailed project explanation..."
          />
        </div>
      </div>
    </div>
  );
}
