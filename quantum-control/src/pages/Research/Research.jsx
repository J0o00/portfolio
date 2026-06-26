import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { researchService } from '../../services/researchService';
import CreateResearchModal from './CreateResearchModal';
import { RetryState } from '../../components/ui/RetryState';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Research() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [researchItems, setResearchItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // RBAC checks
  const canCreate = ['Owner', 'Admin', 'Editor'].includes(userProfile?.role);
  const canDelete = ['Owner', 'Admin'].includes(userProfile?.role);
  const canEdit = ['Owner', 'Admin', 'Editor'].includes(userProfile?.role);

  const fetchResearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await researchService.getResearchList();
      setResearchItems(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load research items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearch();
  }, []);

  const handleCreateSubmit = async (payload) => {
    await researchService.createResearch({ ...payload, userId: userProfile.id });
    setIsCreateModalOpen(false);
    fetchResearch();
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await researchService.deleteResearch(id);
      fetchResearch();
    } catch (err) {
      console.error('Failed to delete', err);
      alert('Failed to delete research item');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Simple client-side search
  const filteredResearch = useMemo(() => {
    if (!searchTerm.trim()) return researchItems;
    const lowerQuery = searchTerm.toLowerCase();
    return researchItems.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.type.toLowerCase().includes(lowerQuery) ||
      (item.reference_number && item.reference_number.toLowerCase().includes(lowerQuery))
    );
  }, [researchItems, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>Research Notebook</h1>
          <p style={{ margin: 0, color: 'var(--admin-text-muted)' }}>Manage your publications, patents, and investigations</p>
        </div>
        {canCreate && (
          <button 
            className="admin-button-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={18} />
            Create Research
          </button>
        )}
      </header>

      {!error && !loading && (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input 
              type="text" 
              className="admin-input" 
              placeholder="Search by title, type, or reference..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>
      )}

      {error ? (
        <RetryState message={error} onRetry={fetchResearch} isRetrying={loading} />
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--admin-accent)' }} />
        </div>
      ) : researchItems.length === 0 ? (
        <div style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '4rem 2rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>No research items yet</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
            Add your first publication, patent, or investigation.
          </p>
          {canCreate && (
            <button className="admin-button-primary" onClick={() => setIsCreateModalOpen(true)}>
              Create Research
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Title</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Type</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Status</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Research Status</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Published Date</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Updated</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResearch.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{item.title}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      background: 'rgba(0,0,0,0.05)'
                    }}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: item.status === 'published' ? 'rgba(0, 200, 100, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                      color: item.status === 'published' ? '#00aa55' : '#cc8800'
                    }}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>
                    {item.research_status || '-'}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>
                    {item.published_date ? formatDate(item.published_date) : '-'}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>
                    {formatDate(item.updated_at)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button 
                        className="admin-button-secondary" 
                        style={{ padding: '0.5rem' }}
                        onClick={() => navigate(`/research/${item.id}`)}
                        title={canEdit ? "Edit" : "View"}
                      >
                        <Edit2 size={16} />
                      </button>
                      {canDelete && (
                        <button 
                          className="admin-button-secondary" 
                          style={{ padding: '0.5rem', color: '#ff3333' }}
                          onClick={() => handleDelete(item.id, item.title)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredResearch.length === 0 && searchTerm.trim() && (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                    No research found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isCreateModalOpen && (
        <CreateResearchModal 
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}
    </div>
  );
}
