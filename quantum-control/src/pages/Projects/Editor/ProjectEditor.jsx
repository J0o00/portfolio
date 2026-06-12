import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../../../services/projectService';
import { useAuth } from '../../../context/AuthContext';
import { Save, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

import ProjectIdentity from './ProjectIdentity';
import ProjectContent from './ProjectContent';
import ProjectSettings from './ProjectSettings';
import ProjectMedia from './ProjectMedia';
import ProjectTags from './ProjectTags';

export default function ProjectEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('identity');
  const [projectData, setProjectData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const canEdit = ['Owner', 'Admin', 'Editor'].includes(userProfile?.role);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProject(id);
      const galleryData = await projectService.getProjectGallery(id);
      const tagsData = await projectService.getProjectTags(id);
      data.gallery = galleryData.map(item => item.media_library).filter(Boolean);
      data.tags = tagsData;
      setProjectData(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load project.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (updater) => {
    setProjectData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const payload = {
        title: projectData.title,
        slug: projectData.slug,
        excerpt: projectData.excerpt,
        short_description: projectData.short_description,
        full_description: projectData.full_description,
        featured: projectData.featured,
        featured_order: projectData.featured_order,
        status: projectData.status,
        updated_by: userProfile.id
      };
      
      await projectService.updateProject(id, payload);

      await projectService.saveProjectMedia(id, {
        coverMediaId: projectData.cover_media_id,
        galleryMediaIds: projectData.gallery ? projectData.gallery.map(g => g.id) : []
      });

      await projectService.saveProjectTags(id, projectData.tags ? projectData.tags.map(t => t.id) : []);

      setHasChanges(false);
      alert('Changes saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading Project...</div>;
  if (!projectData) return <div style={{ padding: '2rem' }}>Project not found or you don't have access.</div>;

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
            onClick={() => navigate('/projects')}
            className="admin-button-secondary"
            style={{ padding: '0.5rem' }}
          >
            <ArrowLeft size={16} />
          </button>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Edit Project
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
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar Tabs */}
        <div style={{ 
          width: '250px', borderRight: '1px solid rgba(255,255,255,0.1)', 
          background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column',
          padding: '1rem', gap: '0.5rem'
        }}>
          {['identity', 'content', 'media', 'tags', 'settings'].map(tab => (
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
            {activeTab === 'identity' && <ProjectIdentity data={projectData} update={handleUpdate} />}
            {activeTab === 'content' && <ProjectContent data={projectData} update={handleUpdate} />}
            {activeTab === 'media' && <ProjectMedia data={projectData} update={handleUpdate} />}
            {activeTab === 'tags' && <ProjectTags data={projectData} update={handleUpdate} />}
            {activeTab === 'settings' && <ProjectSettings data={projectData} update={handleUpdate} />}
          </div>
        </div>
      </div>
    </div>
  );
}
