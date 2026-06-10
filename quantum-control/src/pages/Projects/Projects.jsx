import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import CreateProjectModal from './CreateProjectModal';
import { Plus, Edit2, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Projects() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // RBAC checks
  const canCreate = ['Owner', 'Admin', 'Editor'].includes(userProfile?.role);
  const canDelete = ['Owner', 'Admin'].includes(userProfile?.role);
  const canEdit = ['Owner', 'Admin', 'Editor'].includes(userProfile?.role);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateSubmit = async ({ title, slug }) => {
    await projectService.createProject({ title, slug, userId: userProfile.id });
    setIsCreateModalOpen(false);
    fetchProjects();
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await projectService.deleteProject(id);
      fetchProjects();
    } catch (err) {
      console.error('Failed to delete', err);
      alert('Failed to delete project');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>Projects</h1>
          <p style={{ margin: 0, color: 'var(--admin-text-muted)' }}>Manage your portfolio projects</p>
        </div>
        {canCreate && (
          <button 
            className="admin-button-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={18} />
            Create Project
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
      ) : projects.length === 0 ? (
        <div style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '4rem 2rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>No projects yet</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
            Create your first project to start building your portfolio.
          </p>
          {canCreate && (
            <button className="admin-button-primary" onClick={() => setIsCreateModalOpen(true)}>
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Title</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Status</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Featured</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Updated</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{p.title}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: p.status === 'published' ? 'rgba(0, 200, 100, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                      color: p.status === 'published' ? '#00aa55' : '#cc8800'
                    }}>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {p.featured ? 'Yes' : 'No'}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--admin-text-muted)' }}>
                    {formatDate(p.updated_at)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button 
                        className="admin-button-secondary" 
                        style={{ padding: '0.5rem' }}
                        onClick={() => navigate(`/projects/${p.id}`)}
                        title={canEdit ? "Edit" : "View"}
                      >
                        <Edit2 size={16} />
                      </button>
                      {canDelete && (
                        <button 
                          className="admin-button-secondary" 
                          style={{ padding: '0.5rem', color: '#ff3333' }}
                          onClick={() => handleDelete(p.id, p.title)}
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
        <CreateProjectModal 
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}
    </div>
  );
}
