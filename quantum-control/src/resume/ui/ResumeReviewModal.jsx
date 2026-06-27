import React, { useState, useEffect } from 'react';
import { Layers, Check, X, Edit3, AlertTriangle, ArrowRight, ShieldCheck, Database, RefreshCw } from 'lucide-react';

export default function ResumeReviewModal({ isOpen, diffModel = {}, onClose, onSync }) {
  const [activeTab, setActiveTab] = useState('skills');
  const [isDryRun, setIsDryRun] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [localDiff, setLocalDiff] = useState(() => JSON.parse(JSON.stringify(diffModel)));

  useEffect(() => {
    if (diffModel && Object.keys(diffModel).length > 0) {
      setLocalDiff(JSON.parse(JSON.stringify(diffModel)));
    }
  }, [diffModel]);

  if (!isOpen) return null;

  const tabs = [
    { key: 'skills', label: `Skills (${(localDiff.skills || []).length})` },
    { key: 'experience', label: `Experience (${(localDiff.experience || []).length})` },
    { key: 'education', label: `Education (${(localDiff.education || []).length})` },
    { key: 'projects', label: `Projects (${(localDiff.projects || []).length})` },
    { key: 'research', label: `Research (${(localDiff.research || []).length})` },
    { key: 'profile', label: 'Profile' }
  ];

  const handleToggleSelect = (sectionKey, idx) => {
    setLocalDiff(prev => {
      const copy = { ...prev };
      if (sectionKey === 'profile') {
        if (copy.profile) copy.profile.selected = !copy.profile.selected;
      } else {
        copy[sectionKey][idx].selected = !copy[sectionKey][idx].selected;
      }
      return copy;
    });
  };

  const handleApply = async () => {
    if (isDryRun) {
      alert(`=== DRY RUN PREVIEW ===\nNo changes written to database.\n\nSummary:\n${localDiff.summary?.breakdown?.skills || ''}\n${localDiff.summary?.breakdown?.experience || ''}\n${localDiff.summary?.breakdown?.projects || ''}`);
      return;
    }

    setSyncing(true);
    try {
      await onSync(localDiff);
    } finally {
      setSyncing(false);
    }
  };

  const currentItems = activeTab === 'profile' ? (localDiff.profile ? [localDiff.profile] : []) : (localDiff[activeTab] || []);

  const getBadgeStyle = (status) => {
    switch (status) {
      case 'NEW': return { background: '#dcfce7', color: '#166534' };
      case 'MODIFIED': return { background: '#dbeafe', color: '#1e40af' };
      case 'POSSIBLE DUPLICATE': return { background: '#fef9c3', color: '#854d0e' };
      default: return { background: '#f1f5f9', color: '#475569' };
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '880px', height: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Database size={22} color="#38bdf8" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Step 2: Interactive Ingestion Diff Review</h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Review normalized entities before database commit</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Dry Run Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', background: isDryRun ? '#38bdf8' : 'rgba(255,255,255,0.1)', color: isDryRun ? '#0f172a' : '#fff', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 600, transition: 'all 0.2s' }}>
              <input type="checkbox" checked={isDryRun} onChange={e => setIsDryRun(e.target.checked)} style={{ display: 'none' }} />
              <ShieldCheck size={16} /> Dry Run Simulation
            </label>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '0 1.5rem', gap: '0.5rem', overflowX: 'auto' }}>
          {tabs.map(t => (
            <button 
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{ 
                padding: '0.85rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: activeTab === t.key ? 700 : 500,
                color: activeTab === t.key ? '#0f172a' : '#64748b', borderBottom: activeTab === t.key ? '2px solid #3b82f6' : '2px solid transparent'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f1f5f9' }}>
          {currentItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No extracted entities for this section.</div>
          ) : (
            currentItems.map((item, idx) => {
              const ent = item.entity || {};
              return (
                <div key={idx} style={{ background: '#fff', borderRadius: '12px', border: item.selected ? '1px solid #3b82f6' : '1px solid #cbd5e1', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: item.selected ? 1 : 0.6, transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input 
                        type="checkbox" 
                        checked={!!item.selected} 
                        onChange={() => handleToggleSelect(activeTab, idx)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div>
                        <strong style={{ fontSize: '1rem', color: '#1e293b' }}>
                          {ent.name || ent.role_title || ent.title || ent.institution || 'Profile Config'}
                        </strong>
                        {ent.organization && <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>@ {ent.organization}</span>}
                      </div>
                    </div>

                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '6px', ...getBadgeStyle(item.status) }}>
                      {item.status}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, paddingLeft: '28px' }}>
                    {ent.summary || ent.short_description || ent.description || ent.bio || ent.degree || `Category: ${ent.category || 'N/A'}`}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {isDryRun ? <span style={{ color: '#0284c7', fontWeight: 600 }}>⚡ Dry Run active (zero DB mutations)</span> : 'Ready to write selected entities to active portfolio tables.'}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="admin-button-secondary" onClick={onClose} disabled={syncing}>Cancel</button>
            <button className="admin-button-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', background: isDryRun ? '#0284c7' : undefined }} onClick={handleApply} disabled={syncing}>
              {syncing ? <RefreshCw size={18} className="spin" /> : <Check size={18} />}
              {syncing ? 'Synchronizing...' : isDryRun ? 'Simulate Dry Run' : 'Synchronize Selected to CMS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
