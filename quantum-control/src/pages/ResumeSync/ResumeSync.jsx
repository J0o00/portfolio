import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../../../src/lib/supabase';
import { FileText, Upload, Loader2, AlertCircle, RefreshCw, Key, ShieldCheck, Check, Clock, Eye } from 'lucide-react';

import PipelineProgressBar from '../../resume/ui/PipelineProgressBar';
import ConfidenceDashboard from '../../resume/ui/ConfidenceDashboard';
import ResumeAIKeyModal from '../../resume/ui/ResumeAIKeyModal';
import ResumeTextPreviewModal from '../../resume/ui/ResumeTextPreviewModal';
import ResumeReviewModal from '../../resume/ui/ResumeReviewModal';
import { runExtractionStage, runAIParseAndMatchStage } from '../../resume/pipeline/resumePipelineService';
import { syncApprovedChanges } from '../../resume/sync/resumeSyncService';

export default function ResumeSync() {
  const { userProfile } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Pipeline State
  const [currentStage, setCurrentStage] = useState('UPLOADED');
  const [currentUpload, setCurrentUpload] = useState(null);
  const [extResult, setExtResult] = useState(null);
  const [pipelineData, setPipelineData] = useState(null);
  const [activeDbRecords, setActiveDbRecords] = useState({});

  // Modals
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [hasSessionKey, setHasSessionKey] = useState(() => !!(sessionStorage.getItem('RESUME_SESSION_AI_KEY') || import.meta.env.VITE_GEMINI_API_KEY));

  const fetchUploadsAndDbRecords = async () => {
    try {
      setLoading(true);
      const { data: uploadList, error: upErr } = await supabase
        .from('resume_uploads')
        .select('*')
        .order('uploaded_at', { ascending: false });
      if (upErr) throw upErr;
      setUploads(uploadList || []);
      if (uploadList && uploadList.length > 0) {
        setCurrentUpload(uploadList[0]);
      }

      // Fetch active CMS records for diff comparison
      const [sk, ex, ed, pr, re, sp] = await Promise.all([
        supabase.from('skills').select('*'),
        supabase.from('experience').select('*'),
        supabase.from('education').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('research').select('*'),
        supabase.from('site_profile').select('*').limit(1)
      ]);

      setActiveDbRecords({
        skills: sk.data || [],
        experience: ex.data || [],
        education: ed.data || [],
        projects: pr.data || [],
        research: re.data || [],
        profile: sp.data?.[0] || null
      });
    } catch (err) {
      console.error(err);
      setError('Failed to initialize resume ingestion state.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploadsAndDbRecords();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type) && !file.name.match(/\.(pdf|docx)$/i)) {
      alert('Only PDF and DOCX files are supported.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setCurrentStage('UPLOADED');

      // 1. Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `resume_${Date.now()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('profile-assets').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('profile-assets').getPublicUrl(filePath);
      const nextVersion = uploads.length > 0 ? Math.max(...uploads.map(u => u.version || 1)) + 1 : 1;

      // 2. Insert DB record
      const { data: insertedUploads, error: dbError } = await supabase
        .from('resume_uploads')
        .insert([{
          file_name: file.name,
          file_url: urlData.publicUrl,
          original_filename: file.name,
          version: nextVersion,
          status: 'uploaded',
          processing_stage: 'UPLOADED'
        }])
        .select();

      if (dbError) throw dbError;
      const upRecord = insertedUploads?.[0];
      setCurrentUpload(upRecord);

      // 3. Trigger Phase 2A.12.1 — Extraction
      const extracted = await runExtractionStage(file, upRecord?.id);
      setExtResult({ ...extracted, fileName: file.name });
      setCurrentStage('TEXT_EXTRACTED');
      setIsPreviewModalOpen(true);
      await fetchUploadsAndDbRecords();
    } catch (err) {
      console.error(err);
      setError(`Upload or extraction failed: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const handleConfirmTextAndParse = async () => {
    setIsPreviewModalOpen(false);
    const sessionKey = sessionStorage.getItem('RESUME_SESSION_AI_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
    if (!sessionKey) {
      setIsKeyModalOpen(true);
      return;
    }

    try {
      setCurrentStage('AI_PARSED');
      setLoading(true);
      const matched = await runAIParseAndMatchStage(extResult?.rawText, sessionKey, activeDbRecords, currentUpload?.id);
      setPipelineData(matched);
      setCurrentStage('MATCHED');
      await fetchUploadsAndDbRecords();
    } catch (err) {
      console.error(err);
      setError(`AI Parsing failed: ${err.message}`);
      setCurrentStage('UPLOADED');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToCMS = async (reviewedDiff) => {
    try {
      setCurrentStage('SYNCED');
      await syncApprovedChanges(reviewedDiff, userProfile?.id, currentUpload?.id, currentUpload?.file_url);
      setIsReviewModalOpen(false);
      alert('⚡ Resume successfully synchronized to active portfolio tables!');
      await fetchUploadsAndDbRecords();
    } catch (err) {
      console.error(err);
      setError(`CMS Synchronization failed: ${err.message}`);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>Resume Intelligence Portal</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Enterprise Upload → Extract → Parse → Normalize → Review → Sync Pipeline</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="admin-button-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.25rem', borderColor: hasSessionKey ? '#10b981' : undefined, color: hasSessionKey ? '#059669' : undefined }}
            onClick={() => setIsKeyModalOpen(true)}
          >
            <Key size={18} /> {hasSessionKey ? 'AI Key Active' : 'Configure AI Key'}
          </button>

          <input type="file" id="resume-upload" accept=".pdf,.docx" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
          <label htmlFor="resume-upload" className="admin-button-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: uploading ? 'not-allowed' : 'pointer', padding: '0.7rem 1.5rem', opacity: uploading ? 0.7 : 1 }}>
            {uploading ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}
            {uploading ? 'Extracting Text...' : 'Ingest New Resume'}
          </label>
        </div>
      </header>

      {/* Progress Bar */}
      <PipelineProgressBar currentStage={currentStage} />

      {error && (
        <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={22} /> <strong>Error:</strong> {error}
        </div>
      )}

      {/* AI Confidence Dashboard (Renders when Stage >= MATCHED) */}
      {(currentStage === 'MATCHED' || currentStage === 'REVIEWED' || currentStage === 'SYNCED') && pipelineData && (
        <ConfidenceDashboard 
          confidenceSummary={pipelineData.confidenceSummary} 
          summaryBreakdown={pipelineData.diffModel?.summary?.breakdown}
          onOpenReview={() => setIsReviewModalOpen(true)}
        />
      )}

      {/* Uploads History Registry Table */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
        <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#1e293b' }}>
          <Clock size={18} color="#64748b" /> Ingestion Audit Registry
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 size={32} className="spin" color="#3b82f6" /></div>
        ) : uploads.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>No resumes ingested yet. Ingest a PDF or DOCX file above to launch the pipeline.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '1rem 1.5rem' }}>Version</th>
                <th style={{ padding: '1rem' }}>File Name</th>
                <th style={{ padding: '1rem' }}>Processing Stage</th>
                <th style={{ padding: '1rem' }}>Schema</th>
                <th style={{ padding: '1rem' }}>Timestamp</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#0f172a' }}>v{u.version || 1}</td>
                  <td style={{ padding: '1rem' }}>
                    <a href={u.file_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                      <FileText size={16} /> {u.original_filename || u.file_name}
                    </a>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: u.processing_stage === 'SYNCED' ? '#dcfce7' : '#e0e7ff', color: u.processing_stage === 'SYNCED' ? '#166534' : '#3730a3' }}>
                      {u.processing_stage || u.status?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>{u.schema_version || '2026.06'}</td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>{formatDate(u.uploaded_at)}</td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    {u.raw_text && (
                      <button className="admin-button-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => { setExtResult({ rawText: u.raw_text, fileName: u.original_filename, wordCount: u.raw_text.split(/\s+/).length }); setCurrentUpload(u); setIsPreviewModalOpen(true); }}>
                        <Eye size={14} /> Inspect Text
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <ResumeAIKeyModal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} onSave={() => setHasSessionKey(true)} />
      <ResumeTextPreviewModal isOpen={isPreviewModalOpen} rawText={extResult?.rawText} fileName={extResult?.fileName} wordCount={extResult?.wordCount} onClose={() => setIsPreviewModalOpen(false)} onConfirm={handleConfirmTextAndParse} />
      <ResumeReviewModal isOpen={isReviewModalOpen} diffModel={pipelineData?.diffModel} onClose={() => setIsReviewModalOpen(false)} onSync={handleSyncToCMS} />
    </div>
  );
}
