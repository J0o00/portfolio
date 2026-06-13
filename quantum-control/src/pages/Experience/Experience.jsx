import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { experienceService } from '../../services/experienceService';
import CreateExperienceModal from './CreateExperienceModal';
import { Plus, Edit2, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Experience() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const canCreate = ['Owner', 'Admin', 'Editor'].includes(userProfile?.role);
  const canDelete = ['Owner', 'Admin'].includes(userProfile?.role);
  const canEdit = ['Owner', 'Admin', 'Editor'].includes(userProfile?.role);

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await experienceService.getExperience();
      setExperiences(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load experience items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  const handleCreateSubmit = async (data) => {
    const newItem = await experienceService.createExperience({ ...data, created_by: userProfile.id });
    setIsCreateModalOpen(false);
    navigate(`/experience/${newItem.id}`);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await experienceService.deleteExperience(id);
      fetchExperiences();
    } catch (err) {
      console.error('Failed to delete', err);
      alert('Failed to delete experience');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>Experience</h1>
          <p style={{ margin: 0, color: 'var(--admin-text-muted)' }}>Manage your professional background, awards, and leadership</p>
        </div>
        {canCreate && (
          <button 
            className="admin-button-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={18} />
            Add Experience
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
      ) : experiences.length === 0 ? (
        <div style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '4rem 2rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>No experience items yet</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
            Add your internships, certifications, or awards.
          </p>
          {canCreate && (
            <button className="admin-button-primary" onClick={() => setIsCreateModalOpen(true)}>
              Add Experience
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Role</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Organization</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Period</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Status</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {experiences.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>
                    {e.role_title}
                    <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginTop: '0.2rem' }}>{e.type}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{e.organization}</td>
                  <td style={{ padding: '1rem', color: 'var(--admin-text-muted)' }}>
                    {e.is_current ? (
                        <>{formatDate(e.start_date)} - Present</>
                    ) : (
                        <>{formatDate(e.start_date)} - {formatDate(e.end_date)}</>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: e.status === 'published' ? 'rgba(0, 200, 100, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                      color: e.status === 'published' ? '#00aa55' : '#cc8800'
                    }}>
                      {e.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button 
                        className="admin-button-secondary" 
                        style={{ padding: '0.5rem' }}
                        onClick={() => navigate(`/experience/${e.id}`)}
                        title={canEdit ? "Edit" : "View"}
                      >
                        <Edit2 size={16} />
                      </button>
                      {canDelete && (
                        <button 
                          className="admin-button-secondary" 
                          style={{ padding: '0.5rem', color: '#ff3333' }}
                          onClick={() => handleDelete(e.id, e.role_title)}
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
        <CreateExperienceModal 
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}
    </div>
  );
}
