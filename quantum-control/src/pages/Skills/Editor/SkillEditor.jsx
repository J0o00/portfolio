import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import * as skillsService from '../../../services/skillsService';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';

export default function SkillEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const canEdit = ['Owner', 'Admin', 'Editor'].includes(userProfile?.role);

  useEffect(() => {
    const fetchSkill = async () => {
      try {
        setLoading(true);
        const data = await skillsService.getSkillById(id);
        setSkill(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load skill');
      } finally {
        setLoading(false);
      }
    };
    fetchSkill();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSkill(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    if (!canEdit) return;
    try {
      setSaving(true);
      setError(null);
      await skillsService.updateSkill(id, {
        name: skill.name,
        slug: skill.slug,
        category: skill.category,
        proficiency: parseInt(skill.proficiency) || 0,
        featured: skill.featured,
        display_order: parseInt(skill.display_order) || 0,
        description: skill.description
      });
      alert('Skill saved successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to save skill');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--admin-accent)' }} />
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div style={{ padding: '1rem', background: 'rgba(255, 50, 50, 0.1)', color: '#ff3333', borderRadius: '8px' }}>
        {error || 'Skill not found'}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="admin-button-secondary" 
            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}
            onClick={() => navigate('/skills')}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.75rem' }}>Edit Skill</h1>
            <p style={{ margin: 0, color: 'var(--admin-text-muted)' }}>{skill.name}</p>
          </div>
        </div>
        {canEdit && (
          <button 
            className="admin-button-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
            Save Changes
          </button>
        )}
      </header>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(255, 50, 50, 0.1)', color: '#ff3333', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="admin-form-group">
            <label>Name *</label>
            <input 
              type="text" 
              name="name"
              className="admin-input" 
              value={skill.name || ''} 
              onChange={handleChange}
              disabled={!canEdit}
            />
          </div>
          <div className="admin-form-group">
            <label>Slug *</label>
            <input 
              type="text" 
              name="slug"
              className="admin-input" 
              value={skill.slug || ''} 
              onChange={handleChange}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="admin-form-group">
            <label>Category</label>
            <input 
              type="text" 
              name="category"
              className="admin-input" 
              value={skill.category || ''} 
              onChange={handleChange}
              placeholder="e.g. Control, Hardware, Intelligence"
              disabled={!canEdit}
            />
          </div>
          <div className="admin-form-group">
            <label>Proficiency (0-100)</label>
            <input 
              type="number" 
              name="proficiency"
              min="0" max="100"
              className="admin-input" 
              value={skill.proficiency || ''} 
              onChange={handleChange}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="admin-form-group">
          <label>Description</label>
          <textarea 
            name="description"
            className="admin-input" 
            style={{ minHeight: '100px', resize: 'vertical' }}
            value={skill.description || ''} 
            onChange={handleChange}
            placeholder="Brief description of your experience with this skill..."
            disabled={!canEdit}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="admin-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              name="featured"
              id="featured"
              checked={skill.featured || false} 
              onChange={handleChange}
              disabled={!canEdit}
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="featured" style={{ margin: 0, cursor: 'pointer' }}>Featured Skill</label>
          </div>
          <div className="admin-form-group">
            <label>Display Order</label>
            <input 
              type="number" 
              name="display_order"
              className="admin-input" 
              value={skill.display_order || 0} 
              onChange={handleChange}
              disabled={!canEdit}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
