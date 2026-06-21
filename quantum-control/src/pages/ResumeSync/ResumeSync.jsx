import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { FileText, Upload, Loader2, AlertCircle, RefreshCw, Eye, Check } from 'lucide-react';

export default function ResumeSync() {
  const { userProfile } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resume_uploads')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setUploads(data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load resume uploads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      alert('Only PDF and DOCX files are supported.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // 1. Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `resume_${Date.now()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media_library')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media_library')
        .getPublicUrl(filePath);

      // Determine next version
      const nextVersion = uploads.length > 0 ? Math.max(...uploads.map(u => u.version)) + 1 : 1;

      // 2. Create resume_uploads record
      const { error: dbError } = await supabase
        .from('resume_uploads')
        .insert([{
          file_url: urlData.publicUrl,
          original_filename: file.name,
          version: nextVersion,
          status: 'uploaded',
          // extracted_text and parsed_json will be filled later by the extraction pipeline
        }]);

      if (dbError) throw dbError;

      await fetchUploads();
    } catch (err) {
      console.error(err);
      setError('Failed to upload resume');
    } finally {
      setUploading(false);
      // reset file input
      e.target.value = null;
    }
  };

  const handleExtractAndParse = async (uploadId) => {
    alert('Extraction and Parsing pipeline will be implemented in the next phase.');
    // Here we will eventually call an Edge Function or local text extractor.
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>Resume Sync</h1>
          <p style={{ margin: 0, color: 'var(--admin-text-muted)' }}>Upload resumes to automatically extract and draft portfolio updates.</p>
        </div>
        
        <div>
          <input 
            type="file" 
            id="resume-upload" 
            accept=".pdf,.docx" 
            style={{ display: 'none' }} 
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label 
            htmlFor="resume-upload" 
            className="admin-button-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}
          >
            {uploading ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}
            {uploading ? 'Uploading...' : 'Upload Resume'}
          </label>
        </div>
      </header>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(255, 50, 50, 0.1)', color: '#ff3333', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--admin-accent)' }} />
        </div>
      ) : uploads.length === 0 ? (
        <div style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '4rem 2rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>No resumes uploaded</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
            Upload a PDF or DOCX resume to begin the intelligence extraction process.
          </p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Version</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>File</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Status</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Uploaded</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>v{u.version}</td>
                  <td style={{ padding: '1rem' }}>
                    <a href={u.file_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--admin-accent)', textDecoration: 'none', fontWeight: 500 }}>
                      <FileText size={16} />
                      {u.original_filename}
                    </a>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: u.status === 'processed' ? 'rgba(0, 200, 100, 0.1)' : u.status === 'parsed' ? 'rgba(50, 150, 255, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                      color: u.status === 'processed' ? '#00aa55' : u.status === 'parsed' ? '#0066cc' : '#cc8800'
                    }}>
                      {u.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--admin-text-muted)' }}>
                    {formatDate(u.uploaded_at)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      {u.status === 'uploaded' && (
                        <button 
                          className="admin-button-primary" 
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                          onClick={() => handleExtractAndParse(u.id)}
                        >
                          Extract Data
                        </button>
                      )}
                      {(u.status === 'parsed' || u.status === 'processed') && (
                        <button 
                          className="admin-button-secondary" 
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          Review Changes
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
