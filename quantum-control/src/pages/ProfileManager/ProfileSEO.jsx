import React from 'react';

const inputStyle = { width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', marginBottom: '1rem', fontSize: '1rem' };
const labelStyle = { display: 'block', marginBottom: '0.5rem', color: '#ccc', fontSize: '0.9rem' };

export default function ProfileSEO({ data, update }) {
  const seo = data.seo_settings || {};
  const handleChange = (e) => {
    update({ seo_settings: { ...seo, [e.target.name]: e.target.value } });
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <h3>SEO Settings</h3>
      <label style={labelStyle}>Meta Title</label>
      <input style={inputStyle} name="meta_title" value={seo.meta_title || ''} onChange={handleChange} placeholder="John Doe | Software Engineer" />
      <label style={labelStyle}>Meta Description</label>
      <textarea style={{...inputStyle, height: '80px'}} name="meta_description" value={seo.meta_description || ''} onChange={handleChange} placeholder="Portfolio and research of..." />
      <label style={labelStyle}>Open Graph Title</label>
      <input style={inputStyle} name="og_title" value={seo.og_title || ''} onChange={handleChange} />
      <label style={labelStyle}>Open Graph Description</label>
      <textarea style={{...inputStyle, height: '80px'}} name="og_description" value={seo.og_description || ''} onChange={handleChange} />
      <label style={labelStyle}>Open Graph Image URL</label>
      <input style={inputStyle} name="og_image" value={seo.og_image || ''} onChange={handleChange} placeholder="https://..." />
    </div>
  );
}
