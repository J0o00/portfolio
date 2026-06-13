import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { researchService } from '../../../services/researchService';
import { useAuth } from '../../../context/AuthContext';
import { Save, ArrowLeft, Loader2, AlertCircle, Globe } from 'lucide-react';

import ResearchIdentity from './ResearchIdentity';
import ResearchContent from './ResearchContent';
import ResearchSettings from './ResearchSettings';
import ResearchMedia from './ResearchMedia';
import ResearchTags from './ResearchTags';
import ResearchRevisions from './ResearchRevisions';

export default function ResearchEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('identity');
  const [researchData, setResearchData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const canEdit = ['Owner', 'Admin', 'Editor'].includes(userProfile?.role);

  useEffect(() => {
    loadResearch();
  }, [id]);

  const loadResearch = async () => {
    try {
      setLoading(true);
      const data = await researchService.getResearchById(id);
      const tagsData = await researchService.getResearchTags(id);
      data.tags = tagsData;
      setResearchData(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load research item.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (updater) => {
    setResearchData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const payload = {
        title: researchData.title,
        slug: researchData.slug,
        type: researchData.type,
        reference_number: researchData.reference_number,
        venue: researchData.venue,
        authors: researchData.authors,
        published_date: researchData.published_date,
        
        abstract: researchData.abstract,
        content: researchData.content,
        research_status: researchData.research_status,
        next_steps: researchData.next_steps,
        url: researchData.url,

        status: researchData.status,
        featured: researchData.featured,
        featured_order: researchData.featured_order,
        is_ongoing: researchData.is_ongoing,
        cover_media_id: researchData.cover_media_id,
        updated_by: userProfile.id
      };
      
      await researchService.updateResearch(id, payload);

      await researchService.saveResearchTags(id, researchData.tags ? researchData.tags.map(t => t.id) : []);

      setHasChanges(false);
      alert('Changes saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setSaving(true);
      
      const payload = {
        title: researchData.title,
        slug: researchData.slug,
        type: researchData.type,
        reference_number: researchData.reference_number,
        venue: researchData.venue,
        authors: researchData.authors,
        published_date: researchData.published_date,
        
        abstract: researchData.abstract,
        content: researchData.content,
        research_status: researchData.research_status,
        next_steps: researchData.next_steps,
        url: researchData.url,

        featured: researchData.featured,
        featured_order: researchData.featured_order,
        is_ongoing: researchData.is_ongoing,
        cover_media_id: researchData.cover_media_id,
        status: 'published',
        updated_by: userProfile.id
      };
      
      await researchService.updateResearch(id, payload);
      await researchService.saveResearchTags(id, researchData.tags ? researchData.tags.map(t => t.id) : []);

      // Auto snapshot upon publish
      await researchService.createResearchRevision(id, userProfile.id, 'Auto-Snapshot: Published');

      setResearchData(prev => ({ ...prev, status: 'published' }));
      setHasChanges(false);
      alert('Research item published successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to publish research item.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading Research...</div>;
  if (!researchData) return <div style={{ padding: '2rem' }}>Research not found or you don't have access.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Bar */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', 
        backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/research')}
            className="admin-button-secondary"
            style={{ padding: '0.5rem' }}
          >
            <ArrowLeft size={16} />
          </button>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Edit Research
            {hasChanges && <span style={{ fontSize: '0.8rem', color: '#f39c12', backgroundColor: 'rgba(243, 156, 18, 0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Unsaved Changes</span>}
          </h2>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={handleSave}
            disabled={!hasChanges || saving || !canEdit}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: hasChanges && canEdit ? '#2980b9' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '6px', cursor: hasChanges && canEdit ? 'pointer' : 'not-allowed' }}
          >
            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            Save Changes
          </button>
          <button 
            onClick={handlePublish}
            disabled={saving || !canEdit}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: (saving || !canEdit) ? 'not-allowed' : 'pointer' }}
          >
            {saving ? <Loader2 size={16} className="spin" /> : <Globe size={16} />}
            {researchData.status === 'published' ? 'Republish' : 'Publish'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar Tabs */}
        <div style={{ 
          width: '250px', borderRight: '1px solid rgba(255,255,255,0.1)', 
          background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column',
          padding: '1rem', gap: '0.5rem'
        }}>
          {['identity', 'content', 'media', 'tags', 'settings', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.75rem 1rem', textAlign: 'left', background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeTab === tab ? '#fff' : '#aaa', border: 'none', borderRadius: '6px', cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {error && (
            <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255, 50, 50, 0.1)', color: '#ff3333', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}
          
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {activeTab === 'identity' && <ResearchIdentity data={researchData} update={handleUpdate} />}
            {activeTab === 'content' && <ResearchContent data={researchData} update={handleUpdate} />}
            {activeTab === 'media' && <ResearchMedia data={researchData} update={handleUpdate} />}
            {activeTab === 'tags' && <ResearchTags data={researchData} update={handleUpdate} />}
            {activeTab === 'settings' && <ResearchSettings data={researchData} update={handleUpdate} />}
            {activeTab === 'history' && <ResearchRevisions data={researchData} refreshResearch={loadResearch} />}
          </div>
        </div>
      </div>
    </div>
  );
}
