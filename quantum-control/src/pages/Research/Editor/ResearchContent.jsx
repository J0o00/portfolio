import React from 'react';

export default function ResearchContent({ data, update }) {
  return (
    <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 style={{ margin: '0 0 1.5rem 0', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
          Research Content
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="admin-form-group">
            <label className="admin-label">Abstract</label>
            <textarea
              className="admin-input"
              value={data.abstract || ''}
              onChange={e => update({ abstract: e.target.value })}
              placeholder="A brief summary of the research (used for previews and cards)."
              style={{ minHeight: '100px', resize: 'vertical' }}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Full Content</label>
            <textarea
              className="admin-input"
              value={data.content || ''}
              onChange={e => update({ content: e.target.value })}
              placeholder="The full body of the research or notes."
              style={{ minHeight: '200px', resize: 'vertical' }}
            />
            <span style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
              Plain text for V1. Markdown or Rich Text support will be added later.
            </span>
          </div>

          <div className="admin-form-group">
            <label className="admin-label">External URL (PDF / Publication Link)</label>
            <input
              type="url"
              className="admin-input"
              value={data.url || ''}
              onChange={e => update({ url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ margin: '0 0 1.5rem 0', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
          Status & Planning
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="admin-form-group">
            <label className="admin-label">Research Status</label>
            <input
              type="text"
              className="admin-input"
              value={data.research_status || ''}
              onChange={e => update({ research_status: e.target.value })}
              placeholder="e.g. Concept Phase, MATLAB Modeling, Completed"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Next Steps</label>
            <textarea
              className="admin-input"
              value={data.next_steps || ''}
              onChange={e => update({ next_steps: e.target.value })}
              placeholder="What are the immediate next steps for this investigation?"
              style={{ minHeight: '100px', resize: 'vertical' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
