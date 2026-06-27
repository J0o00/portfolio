import React, { useState } from 'react';
import { Key, ShieldAlert, X, Check } from 'lucide-react';

export default function ResumeAIKeyModal({ isOpen, onClose, onSave }) {
  const [keyInput, setKeyInput] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!keyInput.trim()) return;
    sessionStorage.setItem('RESUME_SESSION_AI_KEY', keyInput.trim());
    onSave(keyInput.trim());
    setKeyInput('');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: '#eff6ff', color: '#2563eb', borderRadius: '10px' }}>
              <Key size={22} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Session AI Key</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
        </div>

        <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
          Enter your Google Gemini API Key. For enterprise security, this key is stored strictly in temporary browser memory (`sessionStorage`) and is cleared when you close the tab.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Gemini API Key</label>
            <input 
              type="password" 
              autoComplete="new-password"
              placeholder="AIzaSy..." 
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#059669', background: '#ecfdf5', padding: '0.6rem 0.75rem', borderRadius: '8px' }}>
            <ShieldAlert size={16} /> Zero backend storage. Never embedded in ES bundles.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="admin-button-secondary" style={{ padding: '0.6rem 1.25rem' }} onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-button-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem' }}>
              <Check size={16} /> Save for Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
