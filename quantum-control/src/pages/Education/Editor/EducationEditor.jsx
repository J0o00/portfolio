import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import * as educationService from '../../../services/educationService';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';

export default function EducationEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [education, setEducation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const canEdit = ['Owner', 'Admin', 'Editor'].includes(userProfile?.role);

  useEffect(() => {
    const fetchEducation = async () => {
      try {
        setLoading(true);
        const data = await educationService.getEducationById(id);
        setEducation(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load education entry');
      } finally {
        setLoading(false);
      }
    };
    fetchEducation();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEducation(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    if (!canEdit) return;
    try {
      setSaving(true);
      setError(null);
      await educationService.updateEducation(id, {
        institution: education.institution,
        degree: education.degree,
        field_of_study: education.field_of_study,
        cgpa: education.cgpa,
        start_date: education.start_date || null,
        end_date: education.end_date || null,
        status: education.status || 'draft',
        featured: education.featured || false,
        display_order: parseInt(education.display_order) || 0,
        description: education.description
      }, userProfile.id);
      alert('Education entry saved successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to save education entry');
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

  if (error || !education) {
    return (
      <div style={{ padding: '1rem', background: 'rgba(255, 50, 50, 0.1)', color: '#ff3333', borderRadius: '8px' }}>
        {error || 'Education entry not found'}
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
            onClick={() => navigate('/education')}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.75rem' }}>Edit Education</h1>
            <p style={{ margin: 0, color: 'var(--admin-text-muted)' }}>{education.institution}</p>
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
        
        <div className="admin-form-group">
          <label>Institution *</label>
          <input 
            type="text" 
            name="institution"
            className="admin-input" 
            value={education.institution || ''} 
            onChange={handleChange}
            disabled={!canEdit}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="admin-form-group">
            <label>Degree</label>
            <input 
              type="text" 
              name="degree"
              className="admin-input" 
              value={education.degree || ''} 
              onChange={handleChange}
              placeholder="e.g. Bachelor of Science"
              disabled={!canEdit}
            />
          </div>
          <div className="admin-form-group">
            <label>Field of Study</label>
            <input 
              type="text" 
              name="field_of_study"
              className="admin-input" 
              value={education.field_of_study || ''} 
              onChange={handleChange}
              placeholder="e.g. Computer Science"
              disabled={!canEdit}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
          <div className="admin-form-group">
            <label>Start Date</label>
            <input 
              type="date" 
              name="start_date"
              className="admin-input" 
              value={education.start_date || ''} 
              onChange={handleChange}
              disabled={!canEdit}
            />
          </div>
          <div className="admin-form-group">
            <label>End Date</label>
            <input 
              type="date" 
              name="end_date"
              className="admin-input" 
              value={education.end_date || ''} 
              onChange={handleChange}
              disabled={!canEdit}
            />
          </div>
          <div className="admin-form-group">
            <label>CGPA / Grade</label>
            <input 
              type="text" 
              name="cgpa"
              className="admin-input" 
              value={education.cgpa || ''} 
              onChange={handleChange}
              placeholder="e.g. 3.8/4.0"
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
            value={education.description || ''} 
            onChange={handleChange}
            placeholder="Activities, societies, specific coursework..."
            disabled={!canEdit}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
          <div className="admin-form-group">
            <label>Status</label>
            <select 
              name="status"
              className="admin-input" 
              value={education.status || 'draft'} 
              onChange={handleChange}
              disabled={!canEdit}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="admin-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <input 
              type="checkbox" 
              name="featured"
              id="featured"
              checked={education.featured || false} 
              onChange={handleChange}
              disabled={!canEdit}
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="featured" style={{ margin: 0, cursor: 'pointer' }}>Featured</label>
          </div>
          <div className="admin-form-group">
            <label>Display Order</label>
            <input 
              type="number" 
              name="display_order"
              className="admin-input" 
              value={education.display_order || 0} 
              onChange={handleChange}
              disabled={!canEdit}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
