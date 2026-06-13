import React, { useState, useEffect } from 'react';
import { experienceService } from '../../../services/experienceService';
import { useAuth } from '../../../context/AuthContext';
import { History, Save, RotateCcw, Loader2, Calendar } from 'lucide-react';

export default function ExperienceRevisions({ data, refreshExperience }) {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [label, setLabel] = useState('');
  const { userProfile } = useAuth();

  useEffect(() => {
    loadRevisions();
  }, [data.id]);

  const loadRevisions = async () => {
    try {
      setLoading(true);
      const revs = await experienceService.getExperienceRevisions(data.id);
      setRevisions(revs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    try {
      setCreating(true);
      await experienceService.createExperienceRevision(data.id, userProfile.id, label);
      setLabel('');
      await loadRevisions();
    } catch (err) {
      console.error(err);
      alert('Failed to create snapshot');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (revisionId) => {
    if (!window.confirm("Are you sure you want to restore this revision? Your current draft will be auto-saved as a snapshot before the restore happens.")) return;
    try {
      setRestoring(true);
      await experienceService.restoreExperienceRevision(data.id, revisionId, userProfile.id);
      alert('Revision restored successfully!');
      if (refreshExperience) {
        refreshExperience();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to restore revision');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      {/* Create Snapshot Section */}
      <div>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>
          <Save size={20} /> Create Snapshot
        </h3>
        <p style={{ color: 'var(--admin-placeholder)', marginBottom: '1.5rem' }}>
          Manually save a named version of this experience item. Useful before making major changes or publishing.
        </p>
        
        <form onSubmit={handleCreateSnapshot} style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <input 
            type="text"
            placeholder="e.g. 'Before rewriting description'"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="admin-input"
            style={{ flex: 1 }}
            required
          />
          <button 
            type="submit" 
            disabled={creating || !label.trim()}
            className="admin-button-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
          >
            {creating ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            Create Snapshot
          </button>
        </form>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />

      {/* Revisions History */}
      <div>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>
          <History size={20} /> Version History
        </h3>
        
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-placeholder)' }}>
            <Loader2 size={24} className="spin" style={{ margin: '0 auto 1rem' }} />
            <p>Loading history...</p>
          </div>
        ) : revisions.length === 0 ? (
          <div style={{ padding: '3rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.2)' }}>
            <p style={{ color: 'var(--admin-placeholder)' }}>No snapshots have been created yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {revisions.map((rev) => (
              <div key={rev.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 'bold', color: '#fff' }}>v{rev.version}</span>
                    <span style={{ color: '#ccc' }}>{rev.revision_label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--admin-placeholder)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={12} /> {new Date(rev.created_at).toLocaleString()}</span>
                    <span>By: {rev.users_profile?.email || 'Unknown'}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleRestore(rev.id)}
                  disabled={restoring}
                  className="admin-button-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <RotateCcw size={16} /> Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
