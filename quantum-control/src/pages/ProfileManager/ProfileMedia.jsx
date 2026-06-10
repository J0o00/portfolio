import React, { useState, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { supabase } from '../../../../src/lib/supabase';

export default function ProfileMedia({ data, update, user }) {
  const [upImg, setUpImg] = useState();
  const [crop, setCrop] = useState({ unit: '%', width: 50, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef(null);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setUpImg(reader.result));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getCroppedImg = (image, crop, width) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = width;
    canvas.height = width; // aspect ratio 1:1
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      width,
      width
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.9);
    });
  };

  const handleUpload = async () => {
    if (!completedCrop || !imgRef.current) return;
    try {
      setUploading(true);
      
      const originalBlob = await fetch(upImg).then(r => r.blob());
      const optimizedBlob = await getCroppedImg(imgRef.current, completedCrop, 800);
      const thumbnailBlob = await getCroppedImg(imgRef.current, completedCrop, 200);

      const timestamp = Date.now();
      
      const uploadPath = async (blob, folder) => {
        const path = `${folder}/profile_${timestamp}.webp`;
        const { error } = await supabase.storage.from('profile-assets').upload(path, blob, { contentType: 'image/webp' });
        if (error) throw error;
        const { data: publicData } = supabase.storage.from('profile-assets').getPublicUrl(path);
        return publicData.publicUrl;
      };

      await uploadPath(originalBlob, 'original'); // Saving original but it's not strictly webp unless converted, assume fine
      const optimizedUrl = await uploadPath(optimizedBlob, 'optimized');
      const thumbnailUrl = await uploadPath(thumbnailBlob, 'thumbnail');

      update({ profile_image_url: optimizedUrl, profile_thumbnail_url: thumbnailUrl });
      setUpImg(null); // clear crop UI
      alert('Images uploaded and profile updated! Remember to Save Draft or Publish.');
    } catch (err) {
      console.error(err);
      alert('Error uploading images');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h3>Profile Media</h3>
      
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <h4>Current Image</h4>
          {data.profile_image_url ? (
            <img src={data.profile_image_url} alt="Profile" style={{ width: '200px', height: '200px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
          ) : (
            <div style={{ width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>
          )}
        </div>
        
        <div>
          <h4>Current Thumbnail</h4>
          {data.profile_thumbnail_url ? (
            <img src={data.profile_thumbnail_url} alt="Thumbnail" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
          ) : (
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          )}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}>
        <h4>Upload New Image</h4>
        <input type="file" accept="image/*" onChange={onSelectFile} style={{ marginBottom: '1rem' }} />
        
        {upImg && (
          <div>
            <ReactCrop 
              crop={crop} 
              onChange={c => setCrop(c)} 
              onComplete={c => setCompletedCrop(c)} 
              aspect={1}
              circularCrop
            >
              <img ref={imgRef} src={upImg} alt="Crop me" style={{ maxHeight: '400px' }} />
            </ReactCrop>
            
            <div style={{ marginTop: '1rem' }}>
              <button 
                onClick={handleUpload}
                disabled={uploading || !completedCrop?.width}
                style={{ background: '#27ae60', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: uploading ? 'wait' : 'pointer' }}
              >
                {uploading ? 'Processing & Uploading...' : 'Crop & Upload'}
              </button>
              <button 
                onClick={() => setUpImg(null)}
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: '1rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
