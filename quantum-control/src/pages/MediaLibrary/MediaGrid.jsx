import React from 'react';
import MediaCard from './MediaCard';

export default function MediaGrid({ assets, onAssetDeleted }) {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
      gap: '1.5rem' 
    }}>
      {assets.map(asset => (
        <MediaCard 
          key={asset.id} 
          asset={asset} 
          onDeleted={onAssetDeleted} 
        />
      ))}
    </div>
  );
}
