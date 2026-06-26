import React from 'react';

export function Skeleton({ width = '100%', height = '1rem', borderRadius = '8px', style = {}, className = '' }) {
  return (
    <div 
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: '#f1f5f9',
        backgroundImage: 'linear-gradient(90deg, #f1f5f9 0px, #e2e8f0 40px, #f1f5f9 80px)',
        backgroundSize: '600px',
        animation: 'shimmer 1.6s infinite linear',
        ...style
      }} 
    />
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
        {Array.from({ length: columns }).map((_, idx) => (
          <Skeleton key={idx} height="1.2rem" width={idx === 0 ? '30%' : '20%'} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.5rem 0' }}>
          {Array.from({ length: columns }).map((_, cIdx) => (
            <Skeleton key={cIdx} height="1rem" width={cIdx === 0 ? '35%' : '18%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton height="140px" borderRadius="8px" />
          <Skeleton height="1.25rem" width="70%" />
          <Skeleton height="0.9rem" width="90%" />
          <Skeleton height="0.9rem" width="50%" />
        </div>
      ))}
    </div>
  );
}
