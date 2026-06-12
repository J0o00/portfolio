import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../src/lib/supabase';
import { Search, X, Check, Upload } from 'lucide-react';
import MediaUpload from './MediaUpload';

export default function MediaPickerModal({ isOpen, onClose, onSelect, multiple = false, initialSelectedIds = [] }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
      setSelectedIds(initialSelectedIds || []);
    }
  }, [isOpen, initialSelectedIds]);

  const fetchAssets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('media_library')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAssets(data);
    } else {
      console.error('Error fetching assets:', error);
    }
    setLoading(false);
  };

  const toggleSelection = (asset) => {
    if (multiple) {
      setSelectedIds(prev => 
        prev.includes(asset.id) 
          ? prev.filter(id => id !== asset.id)
          : [...prev, asset.id]
      );
    } else {
      setSelectedIds([asset.id]);
    }
  };

  const handleConfirm = () => {
    const selectedAssets = assets.filter(a => selectedIds.includes(a.id));
    if (multiple) {
      // Sort to match selectedIds order if needed, but for now just return the matched ones.
      // Better to map according to selectedIds to preserve order
      const orderedSelection = selectedIds.map(id => assets.find(a => a.id === id)).filter(Boolean);
      onSelect(orderedSelection);
    } else {
      onSelect(selectedAssets[0] || null);
    }
    onClose();
  };

  if (!isOpen) return null;

  const uniqueAssetTypes = [...new Set(assets.map(a => a.asset_type))].filter(Boolean);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.filename.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (asset.tags && asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesType = assetTypeFilter === 'all' || asset.asset_type === assetTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000, padding: '2rem'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '1000px', height: '80vh',
        display: 'flex', flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ margin: 0 }}>{showUpload ? 'Upload Media' : 'Select Media'}</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              onClick={() => setShowUpload(!showUpload)} 
              className="admin-button-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {showUpload ? 'Back to Library' : <><Upload size={16} /> Upload New</>}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.25rem' }}>
              <X size={24} />
            </button>
          </div>
        </div>

        {showUpload ? (
          <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
            <MediaUpload 
              onUploadSuccess={(newAsset) => {
                fetchAssets();
                if (newAsset) {
                  if (!multiple) {
                    setSelectedIds([newAsset.id]);
                  } else {
                    setSelectedIds(prev => [...prev, newAsset.id]);
                  }
                }
                setShowUpload(false);
              }} 
            />
          </div>
        ) : (
          <>
            {/* Filters */}
            <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-placeholder)' }} />
                <input 
                  type="text" 
                  placeholder="Search filename or tags..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="admin-input"
                  style={{ margin: 0, paddingLeft: '2.5rem' }}
                />
              </div>
              <select 
                className="admin-input" 
                style={{ width: '200px', margin: 0 }}
                value={assetTypeFilter}
                onChange={(e) => setAssetTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                {uniqueAssetTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

        {/* Grid Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--admin-placeholder)', marginTop: '2rem' }}>Loading assets...</div>
          ) : filteredAssets.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--admin-placeholder)', marginTop: '2rem' }}>No assets found.</div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
              gap: '1rem' 
            }}>
              {filteredAssets.map(asset => {
                const isSelected = selectedIds.includes(asset.id);
                const isImage = asset.asset_type === 'image';
                const fileUrl = supabase.storage.from(asset.bucket).getPublicUrl(asset.storage_path).data.publicUrl;

                return (
                  <div 
                    key={asset.id}
                    onClick={() => toggleSelection(asset)}
                    style={{
                      border: `2px solid ${isSelected ? '#2980b9' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                      background: 'rgba(0,0,0,0.2)',
                      aspectRatio: '1',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {isImage ? (
                      <img 
                        src={fileUrl} 
                        alt={asset.alt_text || asset.filename} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', wordBreak: 'break-all', textAlign: 'center', fontSize: '0.9rem' }}>
                        {asset.filename}
                      </div>
                    )}
                    
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: '0.5rem', right: '0.5rem',
                        background: '#2980b9', borderRadius: '50%', padding: '0.25rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Check size={16} color="white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={onClose} className="admin-button-secondary">Cancel</button>
          <button 
            onClick={handleConfirm} 
            className="admin-button-primary"
            disabled={selectedIds.length === 0 && !multiple}
          >
            {multiple ? `Select ${selectedIds.length} Assets` : 'Select Asset'}
          </button>
        </div>
      </div>
    </div>
  );
}
