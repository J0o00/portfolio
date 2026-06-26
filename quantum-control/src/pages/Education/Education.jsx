import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as educationService from '../../services/educationService';
import CreateEducationModal from './CreateEducationModal';
import { Plus, Edit2, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Education() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [educationList, setEducationList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // RBAC checks
  const canCreate = ['Owner', 'Admin', 'Editor'].includes(userProfile?.role);
  const canDelete = ['Owner', 'Admin'].includes(userProfile?.role);
  const canEdit = ['Owner', 'Admin', 'Editor'].includes(userProfile?.role);

  const fetchEducation = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await educationService.getEducationList();
      setEducationList(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load education entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducation();
  }, []);

  const handleCreateSubmit = async (educationData) => {
    const created = await educationService.createEducation({
        ...educationData,
        created_by: userProfile.id
    });
    setIsCreateModalOpen(false);
    if (created && created.id) {
        navigate(`/education/${created.id}`);
    } else {
        fetchEducation();
    }
  };

  const handleDelete = async (id, institution) => {
    if (!window.confirm(`Are you sure you want to delete "${institution}"? This cannot be undone.`)) {
      return;
    }
    try {
      await educationService.deleteEducation(id);
      fetchEducation();
    } catch (err) {
      console.error('Failed to delete', err);
      alert('Failed to delete education entry');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>Education</h1>
          <p style={{ margin: 0, color: 'var(--admin-text-muted)' }}>Manage your academic background</p>
        </div>
        {canCreate && (
          <button 
            className="admin-button-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={18} />
            Add Education
          </button>
        )}
      </header>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(255, 50, 50, 0.1)', color: '#ff3333', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--admin-accent)' }} />
        </div>
      ) : educationList.length === 0 ? (
        <div style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '4rem 2rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>No education entries yet</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
            Add your academic history manually or sync from your resume.
          </p>
          {canCreate && (
            <button className="admin-button-primary" onClick={() => setIsCreateModalOpen(true)}>
              Add Education
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Institution</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Degree & Field</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Status</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {educationList.map(ed => (
                <tr key={ed.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{ed.institution}</td>
                  <td style={{ padding: '1rem', color: 'var(--admin-text-muted)' }}>
                    {ed.degree || '-'} {ed.field_of_study ? ` in ${ed.field_of_study}` : ''}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: ed.status === 'published' ? 'rgba(0, 200, 100, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                      color: ed.status === 'published' ? '#00aa55' : '#cc8800'
                    }}>
                      {ed.status ? ed.status.toUpperCase() : 'DRAFT'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button 
                        className="admin-button-secondary" 
                        style={{ padding: '0.5rem' }}
                        onClick={() => navigate(`/education/${ed.id}`)}
                        title={canEdit ? "Edit" : "View"}
                      >
                        <Edit2 size={16} />
                      </button>
                      {canDelete && (
                        <button 
                          className="admin-button-secondary" 
                          style={{ padding: '0.5rem', color: '#ff3333' }}
                          onClick={() => handleDelete(ed.id, ed.institution)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCreateModalOpen && (
        <CreateEducationModal 
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}
    </div>
  );
}
