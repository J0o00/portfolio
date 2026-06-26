import React, { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '../../../../src/lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function MediaUpload({ onUploadSuccess }) {
  const { userProfile } = useAuth();
  const [file, setFile] = useState(null);
  const [bucket, setBucket] = useState('media-library');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Determine asset type
      let assetType = 'other';
      if (file.type.startsWith('image/')) assetType = 'image';
      else if (file.type === 'application/pdf') assetType = 'pdf';

      // Insert Metadata into media_library
      const { data: newAsset, error: dbError } = await supabase
        .from('media_library')
        .insert({
          filename: file.name,
          bucket: bucket,
          storage_path: filePath,
          asset_type: assetType,
          mime_type: file.type,
          file_size: file.size,
          status: 'active',
          uploaded_by: userProfile.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setFile(null);
      if (onUploadSuccess) onUploadSuccess(newAsset);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h3 style={{ margin: '0 0 1.5rem 0' }}>Upload New Asset</h3>
      
      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <label className="admin-label">Target Bucket</label>
          <select 
            className="admin-input" 
            value={bucket} 
            onChange={(e) => setBucket(e.target.value)}
            disabled={uploading}
          >
            <option value="media-library">media-library (Public)</option>
            <option value="profile-assets">profile-assets</option>
            <option value="projects">projects</option>
          </select>
        </div>

        <div style={{ flex: 2, minWidth: '300px' }}>
          <label className="admin-label">Select File</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="file" 
              onChange={handleFileChange} 
              className="admin-input" 
              style={{ flex: 1 }}
              disabled={uploading}
            />
            {file && (
              <button 
                onClick={() => setFile(null)} 
                className="admin-button-secondary" 
                style={{ padding: '0 1rem', height: '46px' }}
                disabled={uploading}
                title="Clear file"
              >
                <X size={18} />
              </button>
            )}
            <button 
              onClick={handleUpload} 
              className="admin-button" 
              disabled={!file || uploading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '46px' }}
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
