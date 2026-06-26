import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as skillsService from '../../services/skillsService';
import CreateSkillModal from './CreateSkillModal';
import { Plus, Edit2, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Skills() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // RBAC checks
  const canCreate = ['Owner', 'Admin', 'Editor'].includes(userProfile?.role);
  const canDelete = ['Owner', 'Admin'].includes(userProfile?.role);
  const canEdit = ['Owner', 'Admin', 'Editor'].includes(userProfile?.role);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await skillsService.getSkills();
      setSkills(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleCreateSubmit = async (skillData) => {
    const created = await skillsService.createSkill(skillData);
    setIsCreateModalOpen(false);
    if (created && created.id) {
        navigate(`/skills/${created.id}`);
    } else {
        fetchSkills();
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await skillsService.deleteSkill(id);
      fetchSkills();
    } catch (err) {
      console.error('Failed to delete', err);
      alert('Failed to delete skill');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>Skills</h1>
          <p style={{ margin: 0, color: 'var(--admin-text-muted)' }}>Manage your technical skills and proficiencies</p>
        </div>
        {canCreate && (
          <button 
            className="admin-button-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={18} />
            Add Skill
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
      ) : skills.length === 0 ? (
        <div style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '4rem 2rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>No skills yet</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
            Add your first skill or sync from your resume.
          </p>
          {canCreate && (
            <button className="admin-button-primary" onClick={() => setIsCreateModalOpen(true)}>
              Add Skill
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Name</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Category</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Proficiency</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Featured</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--admin-text-muted)' }}>{s.category || '-'}</td>
                  <td style={{ padding: '1rem' }}>
                    {s.proficiency ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '60px', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${s.proficiency}%`, height: '100%', background: 'var(--admin-accent)' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>{s.proficiency}%</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {s.featured ? 'Yes' : 'No'}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button 
                        className="admin-button-secondary" 
                        style={{ padding: '0.5rem' }}
                        onClick={() => navigate(`/skills/${s.id}`)}
                        title={canEdit ? "Edit" : "View"}
                      >
                        <Edit2 size={16} />
                      </button>
                      {canDelete && (
                        <button 
                          className="admin-button-secondary" 
                          style={{ padding: '0.5rem', color: '#ff3333' }}
                          onClick={() => handleDelete(s.id, s.name)}
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
        <CreateSkillModal 
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}
    </div>
  );
}
