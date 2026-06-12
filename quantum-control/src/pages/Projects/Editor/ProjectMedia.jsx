import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../../src/lib/supabase';
import { Image, X, Grid, ArrowUp, ArrowDown } from 'lucide-react';
import MediaPickerModal from '../../MediaLibrary/MediaPickerModal';

export default function ProjectMedia({ data, update }) {
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
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

  const handleSelectGallery = (assets) => {
    update({ gallery: assets });
  };

  const removeCover = () => {
    setCoverAsset(null);
    update({ cover_media_id: null });
  };

  const removeGalleryAsset = (idToRemove) => {
    const newGallery = (data.gallery || []).filter(a => a.id !== idToRemove);
    update({ gallery: newGallery });
  };

  const moveGalleryAsset = (index, direction) => {
    const newGallery = [...(data.gallery || [])];
    if (direction === 'up' && index > 0) {
      const temp = newGallery[index];
      newGallery[index] = newGallery[index - 1];
      newGallery[index - 1] = temp;
      update({ gallery: newGallery });
    } else if (direction === 'down' && index < newGallery.length - 1) {
      const temp = newGallery[index];
      newGallery[index] = newGallery[index + 1];
      newGallery[index + 1] = temp;
      update({ gallery: newGallery });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      {/* Cover Image Section */}
      <div>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>
          <Image size={20} /> Cover Image
        </h3>
        <p style={{ color: 'var(--admin-placeholder)', marginBottom: '1.5rem' }}>
          This image represents your project on the portfolio and lists.
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

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />

      {/* Gallery Section */}
      <div>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>
          <Grid size={20} /> Gallery Images
        </h3>
        <p style={{ color: 'var(--admin-placeholder)', marginBottom: '1.5rem' }}>
          Additional images to showcase your project in detail.
        </p>

        {(!data.gallery || data.gallery.length === 0) ? (
          <div style={{ padding: '3rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.2)' }}>
            <p style={{ color: 'var(--admin-placeholder)', marginBottom: '1rem' }}>No gallery images added yet.</p>
            <button onClick={() => setIsGalleryModalOpen(true)} className="admin-button-secondary">Add Gallery Images</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--admin-placeholder)' }}>{data.gallery.length} asset{data.gallery.length !== 1 ? 's' : ''}</span>
              <button onClick={() => setIsGalleryModalOpen(true)} className="admin-button-secondary">Manage Gallery</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {data.gallery.map((asset, index) => {
                const isImage = asset.asset_type === 'image';
                const fileUrl = supabase.storage.from(asset.bucket).getPublicUrl(asset.storage_path).data.publicUrl;
                
                return (
                  <div key={asset.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {isImage ? (
                      <img src={fileUrl} alt={asset.alt_text || asset.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', wordBreak: 'break-all', textAlign: 'center' }}>
                        {asset.filename}
                      </div>
                    )}
                    
                    {/* Controls overlay */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0.5rem', className: 'gallery-item-overlay' }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => removeGalleryAsset(asset.id)} style={{ background: 'rgba(255,0,0,0.8)', border: 'none', color: 'white', borderRadius: '4px', padding: '0.25rem', cursor: 'pointer' }}>
                          <X size={16} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button disabled={index === 0} onClick={() => moveGalleryAsset(index, 'up')} style={{ background: index === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '4px', padding: '0.25rem', cursor: index === 0 ? 'not-allowed' : 'pointer' }}>
                          <ArrowUp size={16} />
                        </button>
                        <button disabled={index === data.gallery.length - 1} onClick={() => moveGalleryAsset(index, 'down')} style={{ background: index === data.gallery.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '4px', padding: '0.25rem', cursor: index === data.gallery.length - 1 ? 'not-allowed' : 'pointer' }}>
                          <ArrowDown size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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

      <MediaPickerModal 
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onSelect={handleSelectGallery}
        multiple={true}
        initialSelectedIds={(data.gallery || []).map(g => g.id)}
      />
    </div>
  );
}
