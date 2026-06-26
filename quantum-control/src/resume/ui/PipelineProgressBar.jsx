import React from 'react';
import { Check, Loader2, Circle } from 'lucide-react';

const STAGES = [
  { id: 'UPLOADED', label: 'Upload' },
  { id: 'TEXT_EXTRACTED', label: 'Extract' },
  { id: 'TEXT_CONFIRMED', label: 'Preview' },
  { id: 'AI_PARSED', label: 'Parse' },
  { id: 'NORMALIZED', label: 'Normalize' },
  { id: 'MATCHED', label: 'Match' },
  { id: 'REVIEWED', label: 'Review' },
  { id: 'SYNCED', label: 'Sync' }
];

export default function PipelineProgressBar({ currentStage }) {
  const currentIndex = STAGES.findIndex(s => s.id === currentStage);

  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
      background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0',
      marginBottom: '1.5rem', overflowX: 'auto'
    }}>
      {STAGES.map((stage, idx) => {
        const isCompleted = idx < currentIndex || currentStage === 'SYNCED';
        const isCurrent = idx === currentIndex && currentStage !== 'SYNCED';

        return (
          <React.Fragment key={stage.id}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', minWidth: '60px' }}>
              <div style={{ 
                width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isCompleted ? '#10b981' : isCurrent ? '#3b82f6' : '#e2e8f0',
                color: isCompleted || isCurrent ? '#fff' : '#64748b',
                transition: 'all 0.3s ease'
              }}>
                {isCompleted ? <Check size={16} strokeWidth={3} /> : isCurrent ? <Loader2 size={16} className="spin" /> : <span style={{ fontSize: '11px', fontWeight: 600 }}>{idx + 1}</span>}
              </div>
              <span style={{ fontSize: '11px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#1e293b' : '#64748b' }}>
                {stage.label}
              </span>
            </div>
            {idx < STAGES.length - 1 && (
              <div style={{ flex: 1, height: '2px', background: idx < currentIndex ? '#10b981' : '#cbd5e1', margin: '0 0.5rem', minWidth: '15px', marginBottom: '1.2rem' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
