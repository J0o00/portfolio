import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function CreateEducationModal({ onClose, onSubmit }) {
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!institution.trim()) return;
    
    onSubmit({
      institution: institution.trim(),
      degree: degree.trim(),
      field_of_study: fieldOfStudy.trim(),
      status: 'draft'
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '400px',
        padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Add Education</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="admin-form-group">
            <label>Institution *</label>
            <input 
              type="text" 
              className="admin-input" 
              value={institution} 
              onChange={e => setInstitution(e.target.value)} 
              placeholder="e.g. University of California, Berkeley"
              required 
            />
          </div>

          <div className="admin-form-group">
            <label>Degree</label>
            <input 
              type="text" 
              className="admin-input" 
              value={degree} 
              onChange={e => setDegree(e.target.value)} 
              placeholder="e.g. Bachelor of Science" 
            />
          </div>

          <div className="admin-form-group">
            <label>Field of Study</label>
            <input 
              type="text" 
              className="admin-input" 
              value={fieldOfStudy} 
              onChange={e => setFieldOfStudy(e.target.value)} 
              placeholder="e.g. Computer Science" 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="admin-button-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-button-primary" disabled={!institution.trim()}>Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
