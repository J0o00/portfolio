import React from 'react';

const inputStyle = { width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', marginBottom: '1rem', fontSize: '1rem' };
const labelStyle = { display: 'block', marginBottom: '0.5rem', color: '#ccc', fontSize: '0.9rem' };

export default function ProfileHero({ data, update }) {
  const hero = data.hero_settings || {};
  const handleChange = (e) => {
    update({ hero_settings: { ...hero, [e.target.name]: e.target.value } });
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <h3>Hero Section</h3>
      <label style={labelStyle}>Greeting Text</label>
      <input style={inputStyle} name="greeting" value={hero.greeting || ''} onChange={handleChange} placeholder="Hello, I'm" />
      <label style={labelStyle}>Professional Title</label>
      <input style={inputStyle} name="title" value={hero.title || ''} onChange={handleChange} placeholder="Software Engineer" />
      <label style={labelStyle}>Featured Badge Text</label>
      <input style={inputStyle} name="badge" value={hero.badge || ''} onChange={handleChange} placeholder="Currently building X" />
      <label style={labelStyle}>CTA Button 1 Text</label>
      <input style={inputStyle} name="cta1_text" value={hero.cta1_text || ''} onChange={handleChange} placeholder="View Work" />
      <label style={labelStyle}>CTA Button 2 Text</label>
      <input style={inputStyle} name="cta2_text" value={hero.cta2_text || ''} onChange={handleChange} placeholder="Contact Me" />
      <label style={labelStyle}>Resume URL (If overriding default)</label>
      <input style={inputStyle} name="resume_url" value={hero.resume_url || data.resume_url || ''} onChange={handleChange} placeholder="https://..." />
    </div>
  );
}
