import React, { useState, useEffect } from 'react';
import { FileText, Copy, Trash2, Check, File, FileIcon } from 'lucide-react';
import { supabase } from '../../../../src/lib/supabase';

export default function MediaCard({ asset, onDeleted }) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const resolveUrl = () => {
      // Get permanent public CDN URL for public buckets
      const { data } = supabase.storage
        .from(asset.bucket)
        .getPublicUrl(asset.storage_path);
        
      if (isMounted) {
        if (data && data.publicUrl) {
          setSignedUrl(data.publicUrl);
        }
        setLoadingUrl(false);
      }
    };
    
    resolveUrl();
    
    return () => { isMounted = false; };
  }, [asset]);

  const handleCopy = () => {
    if (signedUrl) {
      navigator.clipboard.writeText(signedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${asset.filename}?`)) {
      setDeleting(true);
      // Soft Delete
      const { error } = await supabase
        .from('media_library')
        .update({ status: 'deleted' })
        .eq('id', asset.id);
        
      if (!error) {
        if (onDeleted) onDeleted(asset.id);
      } else {
        console.error('Failed to soft delete asset:', error);
        alert('Failed to delete asset. Check console for details.');
      }
      setDeleting(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isImage = asset.asset_type === 'image' || (asset.mime_type && asset.mime_type.startsWith('image/'));

  return (
    <div className="admin-card" style={{ 
      border: '1px solid var(--admin-border-color)', 
      borderRadius: '8px', 
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.8)',
      display: 'flex',
      flexDirection: 'column',
      opacity: deleting ? 0.5 : 1
    }}>
      <div style={{ 
        height: '160px', 
        background: '#f3f4f6', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        borderBottom: '1px solid var(--admin-border-color)',
        overflow: 'hidden'
      }}>
        {loadingUrl ? (
          <div style={{ color: 'var(--admin-placeholder)', fontSize: '0.9rem' }}>Loading preview...</div>
        ) : isImage && signedUrl ? (
          <img 
            src={signedUrl} 
            alt={asset.alt_text || asset.filename} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : (
          <FileText size={48} color="var(--admin-placeholder)" opacity={0.5} />
        )}
      </div>
      
      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', wordBreak: 'break-all', fontSize: '0.95rem' }} title={asset.filename}>
          {asset.filename.length > 30 ? asset.filename.substring(0, 27) + '...' : asset.filename}
        </h4>
        <div style={{ fontSize: '0.8rem', color: 'var(--admin-placeholder)', marginBottom: '1rem' }}>
          <div>{formatSize(asset.file_size)} • {asset.bucket}</div>
          <div>{new Date(asset.created_at).toLocaleDateString()}</div>
        </div>
        
        <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={handleCopy}
            className="admin-button-secondary"
            style={{ flex: 1, padding: '0.4rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem', borderRadius: '4px', fontSize: '0.85rem' }}
            disabled={!signedUrl || loadingUrl}
          >
            {copied ? <Check size={14} color="green" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'URL'}
          </button>
          
          <button 
            onClick={handleDelete}
            className="admin-button-secondary"
            style={{ padding: '0.4rem', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '4px', color: '#dc2626', borderColor: '#fca5a5' }}
            disabled={deleting}
            title="Delete Asset"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
