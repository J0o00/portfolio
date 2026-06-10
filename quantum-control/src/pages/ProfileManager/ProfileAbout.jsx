import React from 'react';

const inputStyle = { width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', marginBottom: '1rem', fontSize: '1rem' };
const labelStyle = { display: 'block', marginBottom: '0.5rem', color: '#ccc', fontSize: '0.9rem' };

export default function ProfileAbout({ data, update }) {
  const about = data.about_settings || {};
  const handleChange = (e) => {
    update({ about_settings: { ...about, [e.target.name]: e.target.value } });
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h3>About Section</h3>
      <label style={labelStyle}>Biography (Markdown supported)</label>
      <textarea style={{...inputStyle, height: '150px'}} name="biography" value={about.biography || data.bio || ''} onChange={handleChange} placeholder="Write your full bio..." />
      <label style={labelStyle}>Career Summary</label>
      <textarea style={{...inputStyle, height: '100px'}} name="career_summary" value={about.career_summary || ''} onChange={handleChange} placeholder="Brief career overview..." />
      <label style={labelStyle}>Research Interests (Comma separated)</label>
      <input style={inputStyle} name="research_interests" value={about.research_interests || ''} onChange={handleChange} placeholder="Quantum Computing, AI, Systems" />
      <label style={labelStyle}>Core Domains</label>
      <input style={inputStyle} name="core_domains" value={about.core_domains || ''} onChange={handleChange} placeholder="Software Architecture, Machine Learning" />
    </div>
  );
}
