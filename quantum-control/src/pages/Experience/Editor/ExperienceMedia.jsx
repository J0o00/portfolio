import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../../src/lib/supabase';
import { Image, X } from 'lucide-react';
import MediaPickerModal from '../../MediaLibrary/MediaPickerModal';

export default function ExperienceMedia({ data, update }) {
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [coverAsset, setCoverAsset] = useState(null);
  const [loadingCover, setLoadingCover] = useState(false);

  useEffect(() => {
    if (data.cover_media_id) {
      fetchCoverAsset(data.cover_media_id);
    } else {
      setCoverAsset(null);
    }
  }, [data.cover_media_id]);

  const fetchCoverAsset = async (id) => {
    setLoadingCover(true);
    const { data: asset } = await supabase
      .from('media_library')
      .select('*')
      .eq('id', id)
      .single();
    if (asset) setCoverAsset(asset);
    setLoadingCover(false);
  };

  const handleSelectCover = (asset) => {
    setCoverAsset(asset);
    update({ cover_media_id: asset ? asset.id : null });
  };

  const removeCover = () => {
    setCoverAsset(null);
    update({ cover_media_id: null });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      {/* Cover Image Section */}
      <div>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>
          <Image size={20} /> Cover Image
        </h3>
        <p style={{ color: 'var(--admin-placeholder)', marginBottom: '1.5rem' }}>
          This image represents your experience or award on the portfolio timeline.
        </p>

        {loadingCover ? (
          <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
            Loading cover...
          </div>
        ) : coverAsset ? (
          <div style={{ position: 'relative', width: '100%', maxWidth: '600px', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <img 
              src={supabase.storage.from(coverAsset.bucket).getPublicUrl(coverAsset.storage_path).data.publicUrl} 
              alt={coverAsset.alt_text || 'Cover'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setIsCoverModalOpen(true)} className="admin-button-secondary">Change</button>
              <button onClick={removeCover} className="admin-button-secondary" style={{ padding: '0.5rem', color: '#ff4444' }}><X size={16} /></button>
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '600px', aspectRatio: '16/9', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.2)' }}>
            <button onClick={() => setIsCoverModalOpen(true)} className="admin-button-secondary">Select Cover Image</button>
          </div>
        )}
      </div>

      <MediaPickerModal 
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        onSelect={handleSelectCover}
        multiple={false}
        initialSelectedIds={data.cover_media_id ? [data.cover_media_id] : []}
      />
    </div>
  );
}
