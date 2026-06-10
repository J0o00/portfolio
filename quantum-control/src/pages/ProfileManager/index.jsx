import React, { useState, useEffect } from 'react';
import { getPublishedProfile, getLatestDraft, saveDraft, publishRevision, getProfileHistory } from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';
import { Save, UploadCloud, Eye, RotateCcw, Clock } from 'lucide-react';
import ProfileIdentity from './ProfileIdentity';
import ProfileMedia from './ProfileMedia';
import ProfileHero from './ProfileHero';
import ProfileAbout from './ProfileAbout';
import ProfileSEO from './ProfileSEO';
import ProfileSocial from './ProfileSocial';
import ProfileRevisions from './ProfileRevisions';

export default function ProfileManager() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('identity');
  const [profileData, setProfileData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [revisions, setRevisions] = useState([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Try to get the latest draft first
      const draft = await getLatestDraft();
      if (draft) {
        setProfileData(draft.snapshot_json);
      } else {
        const published = await getPublishedProfile();
        setProfileData(published);
      }
      
      const history = await getProfileHistory();
      setRevisions(history);
    } catch (err) {
      console.error('Error loading profile:', err);
      alert('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (updater) => {
    setProfileData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      return next;
    });
    setHasChanges(true);
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      await saveDraft(profileData, userProfile.id);
      setHasChanges(false);
      
      const history = await getProfileHistory();
      setRevisions(history);
      alert('Draft saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setSaving(true);
      // Ensure we have a saved draft to publish
      let revisionToPublish = revisions[0];
      
      if (hasChanges || !revisionToPublish) {
        const newDraft = await saveDraft(profileData, userProfile.id);
        revisionToPublish = newDraft;
      }
      
      await publishRevision(revisionToPublish.id, userProfile.id);
      setHasChanges(false);
      alert('Profile published live!');
    } catch (err) {
      console.error(
        '[Profile Publish Error]',
        JSON.stringify(err, null, 2)
      );
      alert('Failed to publish.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    // Save draft then open preview
    if (hasChanges) {
      handleSaveDraft().then(() => {
        window.open('/?preview=true', '_blank');
      });
    } else {
      window.open('/?preview=true', '_blank');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading Profile Manager...</div>;
  if (!profileData) return <div>Failed to initialize profile.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Bar */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', 
        backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Profile Manager
          {hasChanges && <span style={{ fontSize: '0.8rem', color: '#f39c12', backgroundColor: 'rgba(243, 156, 18, 0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Unsaved Changes</span>}
        </h2>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setShowRevisions(!showRevisions)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', cursor: 'pointer' }}
          >
            <Clock size={16} /> History
          </button>
          <button 
            onClick={handlePreview}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            <Eye size={16} /> Preview
          </button>
          <button 
            onClick={handleSaveDraft}
            disabled={!hasChanges || saving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: hasChanges ? '#2980b9' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '6px', cursor: hasChanges ? 'pointer' : 'not-allowed' }}
          >
            <Save size={16} /> Save Draft
          </button>
          <button 
            onClick={handlePublish}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            <UploadCloud size={16} /> Publish
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ 
          width: '250px', borderRight: '1px solid rgba(255,255,255,0.1)', 
          background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column',
          padding: '1rem', gap: '0.5rem'
        }}>
          {['identity', 'media', 'hero', 'about', 'seo', 'social'].map(tab => (
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
          {activeTab === 'identity' && <ProfileIdentity data={profileData} update={handleUpdate} />}
          {activeTab === 'media' && <ProfileMedia data={profileData} update={handleUpdate} user={user} />}
          {activeTab === 'hero' && <ProfileHero data={profileData} update={handleUpdate} />}
          {activeTab === 'about' && <ProfileAbout data={profileData} update={handleUpdate} />}
          {activeTab === 'seo' && <ProfileSEO data={profileData} update={handleUpdate} />}
          {activeTab === 'social' && <ProfileSocial data={profileData} update={handleUpdate} />}
        </div>
        
        {/* Revisions Sidebar */}
        {showRevisions && (
          <div style={{ width: '300px', borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', padding: '1rem', overflowY: 'auto' }}>
            <ProfileRevisions revisions={revisions} onRestore={(rev) => {
              setProfileData(rev.snapshot_json);
              setHasChanges(true);
              setShowRevisions(false);
            }} />
          </div>
        )}
      </div>
    </div>
  );
}
