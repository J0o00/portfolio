import React from 'react';
import { useAuth } from '../../../context/AuthContext';

export default function ResearchSettings({ data, update }) {
  const { userProfile } = useAuth();
  const canChangeStatus = ['Owner', 'Admin'].includes(userProfile?.role);

  return (
    <div className="admin-card">
      <h3 style={{ margin: '0 0 1.5rem 0', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        Research Settings
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Visibility section only for Owner/Admin */}
        {canChangeStatus && (
          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Visibility Status
            </h4>
            <div className="admin-form-group">
              <select
                className="admin-input"
                value={data.status}
                onChange={e => update({ status: e.target.value })}
                style={{ 
                  background: data.status === 'published' ? 'rgba(0, 200, 100, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                  color: data.status === 'published' ? '#00aa55' : '#cc8800',
                  fontWeight: 600,
                  border: 'none'
                }}
              >
                <option value="draft">DRAFT (Hidden from public)</option>
                <option value="published">PUBLISHED (Visible to public)</option>
                <option value="archived">ARCHIVED (Hidden, preserved)</option>
              </select>
              <span style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', display: 'block' }}>
                Editors can save drafts but cannot publish or archive items.
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Featured */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ margin: 0 }}>Featured Status</h4>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={data.featured || false}
                onChange={e => update({ featured: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: 500 }}>Feature on Portfolio Homepage</span>
            </label>
            
            <div className="admin-form-group">
              <label className="admin-label">Featured Order (Lower = First)</label>
              <input
                type="number"
                className="admin-input"
                value={data.featured_order || 0}
                onChange={e => update({ featured_order: parseInt(e.target.value) || 0 })}
                disabled={!data.featured}
              />
            </div>
          </div>

          {/* Is Ongoing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ margin: 0 }}>Progress Status</h4>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={data.is_ongoing || false}
                onChange={e => update({ is_ongoing: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: 500 }}>Mark as Ongoing Research</span>
            </label>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>
              If checked, this item will display an "Ongoing" badge on the public portfolio.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
