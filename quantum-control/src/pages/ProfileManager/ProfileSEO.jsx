import React from 'react';

export default function ProfileSEO({ data, update }) {
  const seo = data.seo_settings || {};
  const handleChange = (e) => {
    update({ seo_settings: { ...seo, [e.target.name]: e.target.value } });
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <h3>SEO Settings</h3>
      <label className="admin-label">Meta Title</label>
      <input className="admin-input" name="meta_title" value={seo.meta_title || ''} onChange={handleChange} placeholder="John Doe | Software Engineer" />
      <label className="admin-label">Meta Description</label>
      <textarea className="admin-input" style={{height: '80px'}} name="meta_description" value={seo.meta_description || ''} onChange={handleChange} placeholder="Portfolio and research of..." />
      <label className="admin-label">Open Graph Title</label>
      <input className="admin-input" name="og_title" value={seo.og_title || ''} onChange={handleChange} />
      <label className="admin-label">Open Graph Description</label>
      <textarea className="admin-input" style={{height: '80px'}} name="og_description" value={seo.og_description || ''} onChange={handleChange} />
      <label className="admin-label">Open Graph Image URL</label>
      <input className="admin-input" name="og_image" value={seo.og_image || ''} onChange={handleChange} placeholder="https://..." />
    </div>
  );
}
