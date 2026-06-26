import React from 'react';
import { FolderOpen, Plus } from 'lucide-react';

export default function EmptyState({ icon: Icon = FolderOpen, title = 'No items found', description = 'Get started by creating your first record.', actionLabel, onAction }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '4rem 2rem', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1',
      textAlign: 'center', margin: '1rem 0'
    }}>
      <div style={{ padding: '1rem', background: '#e2e8f0', color: '#64748b', borderRadius: '50%', marginBottom: '1.25rem' }}>
        <Icon size={32} />
      </div>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{title}</h3>
      <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', maxWidth: '380px', fontSize: '0.9rem', lineHeight: 1.5 }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button className="admin-button-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem' }} onClick={onAction}>
          <Plus size={18} /> {actionLabel}
        </button>
      )}
    </div>
  );
}
