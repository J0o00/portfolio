import React from 'react';

export default function ProfileHero({ data, update }) {
  const hero = data.hero_settings || {};
  const handleChange = (e) => {
    update({ hero_settings: { ...hero, [e.target.name]: e.target.value } });
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <h3>Hero Section</h3>
      <label className="admin-label">Greeting Text</label>
      <input className="admin-input" name="greeting" value={hero.greeting || ''} onChange={handleChange} placeholder="Hello, I'm" />
      <label className="admin-label">Professional Title</label>
      <input className="admin-input" name="title" value={hero.title || ''} onChange={handleChange} placeholder="Software Engineer" />
      <label className="admin-label">Featured Badge Text</label>
      <input className="admin-input" name="badge" value={hero.badge || ''} onChange={handleChange} placeholder="Currently building X" />
      <label className="admin-label">CTA Button 1 Text</label>
      <input className="admin-input" name="cta1_text" value={hero.cta1_text || ''} onChange={handleChange} placeholder="View Work" />
      <label className="admin-label">CTA Button 2 Text</label>
      <input className="admin-input" name="cta2_text" value={hero.cta2_text || ''} onChange={handleChange} placeholder="Contact Me" />
      <label className="admin-label">Resume URL (If overriding default)</label>
      <input className="admin-input" name="resume_url" value={hero.resume_url || data.resume_url || ''} onChange={handleChange} placeholder="https://..." />
    </div>
  );
}
