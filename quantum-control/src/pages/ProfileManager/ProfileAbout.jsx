import React from 'react';

export default function ProfileAbout({ data, update }) {
  const about = data.about_settings || {};
  const handleChange = (e) => {
    update({ about_settings: { ...about, [e.target.name]: e.target.value } });
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h3>About Section</h3>
      <label className="admin-label">Biography (Markdown supported)</label>
      <textarea className="admin-input" style={{height: '150px'}} name="biography" value={about.biography || data.bio || ''} onChange={handleChange} placeholder="Write your full bio..." />
      <label className="admin-label">Career Summary</label>
      <textarea className="admin-input" style={{height: '100px'}} name="career_summary" value={about.career_summary || ''} onChange={handleChange} placeholder="Brief career overview..." />
      <label className="admin-label">Research Interests (Comma separated)</label>
      <input className="admin-input" name="research_interests" value={about.research_interests || ''} onChange={handleChange} placeholder="Quantum Computing, AI, Systems" />
      <label className="admin-label">Core Domains</label>
      <input className="admin-input" name="core_domains" value={about.core_domains || ''} onChange={handleChange} placeholder="Software Architecture, Machine Learning" />
    </div>
  );
}
