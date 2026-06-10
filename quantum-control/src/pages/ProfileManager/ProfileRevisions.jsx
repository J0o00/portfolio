import React from 'react';

export default function ProfileRevisions({ revisions, onRestore }) {
  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Version History</h3>
      {revisions.length === 0 ? (
        <p style={{ color: '#ccc', fontSize: '0.9rem' }}>No revisions yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {revisions.map((rev) => (
            <li key={rev.id} style={{ 
              background: 'rgba(255,255,255,0.05)', padding: '1rem', 
              borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontWeight: 'bold' }}>Version {rev.version}</div>
              <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '0.5rem' }}>
                {new Date(rev.created_at).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '1rem' }}>
                By: {rev.users_profile?.email || 'Unknown'}
              </div>
              <button 
                onClick={() => onRestore(rev)}
                style={{
                  background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none',
                  padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', width: '100%'
                }}
              >
                Restore to Draft
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
