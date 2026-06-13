import React from 'react';

export default function ExperienceContent({ data, update }) {
  return (
    <div className="admin-card">
      <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--admin-accent)' }}>Experience Content</h3>
      
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div className="admin-form-group">
          <label className="admin-label">Summary (Short Preview)</label>
          <textarea 
            className="admin-input"
            rows={3}
            value={data?.summary || ''}
            onChange={e => update({ summary: e.target.value })}
            placeholder="A brief summary for timelines, SEO, and Open Graph"
          />
        </div>

        <div className="admin-form-group">
          <label className="admin-label">Full Description (HTML/Markdown support can be added later)</label>
          <textarea 
            className="admin-input"
            rows={12}
            value={data?.description || ''}
            onChange={e => update({ description: e.target.value })}
            placeholder="Detailed description of your experience, responsibilities, and achievements..."
            style={{ fontFamily: 'monospace' }}
          />
        </div>
      </div>
    </div>
  );
}
