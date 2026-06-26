import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, ArrowRight, Layers, Award } from 'lucide-react';

export default function ConfidenceDashboard({ confidenceSummary = {}, summaryBreakdown = {}, onOpenReview }) {
  const overall = Math.round((confidenceSummary.overall || 0.95) * 100);

  const sections = [
    { key: 'profile', label: 'Profile', score: Math.round((confidenceSummary.profile || 0.99) * 100) },
    { key: 'experience', label: 'Experience', score: Math.round((confidenceSummary.experience || 0.94) * 100) },
    { key: 'education', label: 'Education', score: Math.round((confidenceSummary.education || 0.98) * 100) },
    { key: 'skills', label: 'Skills', score: Math.round((confidenceSummary.skills || 0.99) * 100) },
    { key: 'projects', label: 'Projects', score: Math.round((confidenceSummary.projects || 0.85) * 100) },
    { key: 'research', label: 'Research', score: Math.round((confidenceSummary.research || 0.90) * 100) }
  ];

  const lowConfidenceSections = sections.filter(s => s.score < 85);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.6rem', background: '#ecfdf5', color: '#059669', borderRadius: '12px' }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>Quantum Control AI Confidence Dashboard</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Automated Schema Ingestion Diagnostics & Verification</p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Overall Confidence</span>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: overall >= 90 ? '#059669' : overall >= 80 ? '#d97706' : '#dc2626', lineHeight: 1 }}>
            {overall}%
          </div>
        </div>
      </div>

      {/* Amber Warning Banner */}
      {lowConfidenceSections.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', color: '#b45309' }}>
          <AlertTriangle size={22} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            Attention: {lowConfidenceSections.map(s => `${s.label} (${s.score}%)`).join(', ')} fell below the 85% safety threshold. Please inspect manually.
          </span>
        </div>
      )}

      {/* Section Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        {sections.map(sec => {
          const isSafe = sec.score >= 85;
          return (
            <div key={sec.key} style={{ padding: '1rem', borderRadius: '12px', background: '#f8fafc', border: `1px solid ${isSafe ? '#e2e8f0' : '#fde68a'}`, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>{sec.label}</span>
                {isSafe ? <CheckCircle size={15} color="#10b981" /> : <AlertTriangle size={15} color="#d97706" />}
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: isSafe ? '#1e293b' : '#b45309' }}>{sec.score}%</span>
            </div>
          );
        })}
      </div>

      {/* Detected Entities Overview Card */}
      <div style={{ background: '#f1f5f9', padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
          <Layers size={18} /> Batch Preview Summary Breakdown
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
          <div><strong style={{ color: '#475569' }}>Skills:</strong> {summaryBreakdown.skills || 'No changes'}</div>
          <div><strong style={{ color: '#475569' }}>Experience:</strong> {summaryBreakdown.experience || 'No changes'}</div>
          <div><strong style={{ color: '#475569' }}>Education:</strong> {summaryBreakdown.education || 'No changes'}</div>
          <div><strong style={{ color: '#475569' }}>Projects:</strong> {summaryBreakdown.projects || 'No changes'}</div>
          <div><strong style={{ color: '#475569' }}>Research:</strong> {summaryBreakdown.research || 'No changes'}</div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
        <button className="admin-button-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.95rem' }} onClick={onOpenReview}>
          Review Detailed Changes & Dry Run <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
