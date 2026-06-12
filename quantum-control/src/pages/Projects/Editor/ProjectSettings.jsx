import React from 'react';
import { useAuth } from '../../../context/AuthContext';

export default function ProjectSettings({ data, update }) {
  const { userProfile } = useAuth();
  
  const canChangeStatus = ['Owner', 'Admin'].includes(userProfile?.role);

  return (
    <div className="admin-card">
      <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--admin-accent)' }}>Settings</h3>
      
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        
        {canChangeStatus && (
          <div className="admin-form-group">
            <label className="admin-label">Status</label>
            <select 
              className="admin-input"
              value={data?.status || 'draft'}
              onChange={e => update({ status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        )}

        <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input 
            type="checkbox" 
            id="featuredToggle"
            checked={!!data?.featured}
            onChange={e => update({ featured: e.target.checked })}
          />
          <label htmlFor="featuredToggle" className="admin-label" style={{ margin: 0 }}>Featured Project</label>
        </div>

        {data?.featured && (
          <div className="admin-form-group">
            <label className="admin-label">Featured Order</label>
            <input 
              type="number" 
              className="admin-input"
              value={data?.featured_order || 0}
              onChange={e => update({ featured_order: parseInt(e.target.value, 10) || 0 })}
            />
            <span className="admin-help-text">Lower numbers appear first on the homepage.</span>
          </div>
        )}
      </div>
    </div>
  );
}
