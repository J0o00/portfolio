import React from 'react';

export default function ResearchIdentity({ data, update }) {
  const handleAuthorsChange = (e) => {
    // Split by comma and trim, filtering out empty strings
    const authorsStr = e.target.value;
    const authorsArray = authorsStr.split(',').map(a => a.trim()).filter(a => a.length > 0);
    // Keep raw string in UI state if needed, but since we map back from array:
    update({ authors: authorsArray });
  };

  return (
    <div className="admin-card">
      <h3 style={{ margin: '0 0 1.5rem 0', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        Research Identity
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="admin-form-group">
          <label className="admin-label">Title</label>
          <input
            type="text"
            className="admin-input"
            value={data.title}
            onChange={e => update({ title: e.target.value })}
            placeholder="e.g. Digital Twin of Induction Motor"
          />
        </div>

        <div className="admin-form-group">
          <label className="admin-label">URL Slug</label>
          <input
            type="text"
            className="admin-input"
            value={data.slug}
            onChange={e => update({ slug: e.target.value })}
          />
          <span style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
            Unique identifier for the URL (e.g., digital-twin-induction-motor). Must be lowercase with hyphens.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="admin-form-group">
            <label className="admin-label">Type</label>
            <select
              className="admin-input"
              value={data.type}
              onChange={e => update({ type: e.target.value })}
            >
              <option value="Investigation">Investigation</option>
              <option value="Publication">Publication</option>
              <option value="Conference">Conference</option>
              <option value="Patent">Patent</option>
              <option value="Technical Note">Technical Note</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Published Date</label>
            <input
              type="date"
              className="admin-input"
              value={data.published_date || ''}
              onChange={e => update({ published_date: e.target.value || null })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="admin-form-group">
            <label className="admin-label">Venue / Publisher</label>
            <input
              type="text"
              className="admin-input"
              value={data.venue || ''}
              onChange={e => update({ venue: e.target.value })}
              placeholder="e.g. IEEE PESCCIMCON 2026"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Reference Number (DOI / Patent No.)</label>
            <input
              type="text"
              className="admin-input"
              value={data.reference_number || ''}
              onChange={e => update({ reference_number: e.target.value })}
              placeholder="e.g. DOI: 10.xxxx/xxxx"
            />
          </div>
        </div>

        <div className="admin-form-group">
          <label className="admin-label">Authors</label>
          <input
            type="text"
            className="admin-input"
            value={data.authors ? data.authors.join(', ') : ''}
            onChange={handleAuthorsChange}
            placeholder="e.g. Jovial Joyson, Prof. Chin"
          />
          <span style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
            Comma-separated list of authors.
          </span>
        </div>
      </div>
    </div>
  );
}
