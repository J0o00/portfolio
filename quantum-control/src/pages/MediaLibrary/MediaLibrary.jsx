import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../../../src/lib/supabase';
import MediaUpload from './MediaUpload';
import MediaGrid from './MediaGrid';
import { Search, Filter } from 'lucide-react';

export default function MediaLibrary() {
  const { userProfile } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [bucketFilter, setBucketFilter] = useState('all');

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

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleUploadSuccess = () => {
    fetchAssets();
  };

  const handleAssetDeleted = (deletedId) => {
    setAssets(prev => prev.filter(asset => asset.id !== deletedId));
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.filename.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (asset.tags && asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesBucket = bucketFilter === 'all' || asset.bucket === bucketFilter;
    return matchesSearch && matchesBucket;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0' }}>Media Library</h2>
          <p style={{ margin: 0, color: 'var(--admin-placeholder)' }}>Manage assets for your portfolio and projects.</p>
        </div>
      </div>

      <MediaUpload onUploadSuccess={handleUploadSuccess} />

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-placeholder)' }} />
            <input 
              type="text" 
              placeholder="Search by filename or tags..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input"
              style={{ margin: 0, paddingLeft: '2.5rem' }}
            />
          </div>
          <select 
            className="admin-input" 
            style={{ width: '200px', margin: 0 }}
            value={bucketFilter}
            onChange={(e) => setBucketFilter(e.target.value)}
          >
            <option value="all">All Buckets</option>
            <option value="profile-assets">profile-assets</option>
            <option value="projects">projects</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--admin-placeholder)' }}>Loading assets...</div>
        ) : filteredAssets.length === 0 ? (
          <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--admin-placeholder)' }}>No assets found.</div>
        ) : (
          <MediaGrid assets={filteredAssets} onAssetDeleted={handleAssetDeleted} />
        )}
      </div>
    </div>
  );
}
