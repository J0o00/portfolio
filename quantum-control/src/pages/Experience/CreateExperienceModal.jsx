import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function CreateExperienceModal({ onClose, onSubmit }) {
  const [roleTitle, setRoleTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [type, setType] = useState('Work');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleTitle.trim() || !organization.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      await onSubmit({ 
        role_title: roleTitle.trim(), 
        organization: organization.trim(),
        type 
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create experience');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Add Experience</h2>
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
              <label className="admin-label">Role Title</label>
              <input
                type="text"
                className="admin-input"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Industrial Automation Intern"
                autoFocus
                required
              />
            </div>
            
            <div className="admin-form-group">
              <label className="admin-label">Organization</label>
              <input
                type="text"
                className="admin-input"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Siemens COE"
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Type</label>
              <select
                className="admin-input"
                value={type}
                onChange={(e) => setType(e.target.value)}
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
          
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onClose} className="admin-button-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="admin-button-primary" disabled={loading || !roleTitle.trim() || !organization.trim()}>
              {loading ? <Loader2 size={16} className="spin" /> : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
