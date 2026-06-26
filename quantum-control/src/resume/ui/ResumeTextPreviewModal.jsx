import React from 'react';
import { FileText, ArrowRight, X, AlertCircle } from 'lucide-react';

export default function ResumeTextPreviewModal({ isOpen, rawText, fileName, wordCount, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
        {/* Modal Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: '#e0e7ff', color: '#4f46e5', borderRadius: '10px' }}>
              <FileText size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Step 1: Extracted Raw Text Preview</h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{fileName} ({wordCount} words extracted)</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
        </div>

        {/* Advisory Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#eff6ff', color: '#1d4ed8', fontSize: '0.85rem', borderBottom: '1px solid #bfdbfe' }}>
          <AlertCircle size={18} /> Please verify that PDF/DOCX text extraction succeeded cleanly before launching AI tokens.
        </div>

        {/* Scrollable Text Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-wrap', background: '#fff' }}>
          {rawText || 'No text extracted.'}
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#f8fafc' }}>
          <button className="admin-button-secondary" onClick={onClose}>Cancel Upload</button>
          <button className="admin-button-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem' }} onClick={onConfirm}>
            Confirm & Run AI Parsing <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
