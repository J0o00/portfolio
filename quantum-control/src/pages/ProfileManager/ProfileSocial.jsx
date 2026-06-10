import React from 'react';

export default function ProfileSocial({ data, update }) {
  const social = data.social_links || {};
  const handleChange = (e) => {
    update({ social_links: { ...social, [e.target.name]: e.target.value } });
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <h3>Social Links</h3>
      <label className="admin-label">LinkedIn</label>
      <input className="admin-input" name="linkedin" value={social.linkedin || ''} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
      <label className="admin-label">GitHub</label>
      <input className="admin-input" name="github" value={social.github || ''} onChange={handleChange} placeholder="https://github.com/..." />
      <label className="admin-label">Google Scholar</label>
      <input className="admin-input" name="google_scholar" value={social.google_scholar || ''} onChange={handleChange} placeholder="https://scholar.google.com/..." />
      <label className="admin-label">ORCID</label>
      <input className="admin-input" name="orcid" value={social.orcid || ''} onChange={handleChange} placeholder="https://orcid.org/..." />
      <label className="admin-label">ResearchGate</label>
      <input className="admin-input" name="researchgate" value={social.researchgate || ''} onChange={handleChange} placeholder="https://researchgate.net/profile/..." />
      <label className="admin-label">YouTube</label>
      <input className="admin-input" name="youtube" value={social.youtube || ''} onChange={handleChange} placeholder="https://youtube.com/c/..." />
      <label className="admin-label">X/Twitter</label>
      <input className="admin-input" name="twitter" value={social.twitter || ''} onChange={handleChange} placeholder="https://twitter.com/..." />
    </div>
  );
}
