import React from 'react';

export default function ExperienceIdentity({ data, update }) {
  return (
    <div className="admin-card">
      <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--admin-accent)' }}>Experience Identity</h3>
      
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="admin-form-group">
            <label className="admin-label">Role Title</label>
            <input 
              type="text" 
              className="admin-input"
              value={data?.role_title || ''}
              onChange={e => update({ role_title: e.target.value })}
              placeholder="e.g. Industrial Automation Engineer Intern"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Organization</label>
            <input 
              type="text" 
              className="admin-input"
              value={data?.organization || ''}
              onChange={e => update({ organization: e.target.value })}
              placeholder="e.g. Siemens COE"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="admin-form-group">
            <label className="admin-label">Location (Optional)</label>
            <input 
              type="text" 
              className="admin-input"
              value={data?.location || ''}
              onChange={e => update({ location: e.target.value })}
              placeholder="e.g. Anna University"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Type</label>
            <select
              className="admin-input"
              value={data?.type || 'Work'}
              onChange={e => update({ type: e.target.value })}
            >
              <option value="Work">Work</option>
              <option value="Research">Research</option>
              <option value="Leadership">Leadership</option>
              <option value="Award">Award</option>
              <option value="Certification">Certification</option>
              <option value="Education">Education</option>
              <option value="Volunteer">Volunteer</option>
              <option value="Mentorship">Mentorship</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
          <div className="admin-form-group">
            <label className="admin-label">Start Date</label>
            <input 
              type="date" 
              className="admin-input"
              value={data?.start_date || ''}
              onChange={e => update({ start_date: e.target.value })}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">End Date</label>
            <input 
              type="date" 
              className="admin-input"
              value={data?.end_date || ''}
              onChange={e => update({ end_date: e.target.value })}
              disabled={data?.is_current}
            />
          </div>

          <div className="admin-form-group" style={{ paddingBottom: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={data?.is_current || false}
                onChange={e => update({ is_current: e.target.checked })}
              />
              <span className="admin-label" style={{ margin: 0 }}>Currently holding this role</span>
            </label>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="admin-form-group">
                <label className="admin-label">Display Order</label>
                <input 
                    type="number" 
                    className="admin-input"
                    value={data?.display_order || 0}
                    onChange={e => update({ display_order: parseInt(e.target.value) || 0 })}
                />
                <span className="admin-help-text">Lower numbers appear first</span>
            </div>
            <div className="admin-form-group" style={{ paddingBottom: '0.5rem', display: 'flex', alignItems: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                    type="checkbox"
                    checked={data?.featured || false}
                    onChange={e => update({ featured: e.target.checked })}
                    />
                    <span className="admin-label" style={{ margin: 0 }}>Featured on Homepage</span>
                </label>
            </div>
        </div>
        
        {data?.featured && (
            <div className="admin-form-group">
                <label className="admin-label">Featured Order</label>
                <input 
                    type="number" 
                    className="admin-input"
                    value={data?.featured_order || 0}
                    onChange={e => update({ featured_order: parseInt(e.target.value) || 0 })}
                />
            </div>
        )}

      </div>
    </div>
  );
}
