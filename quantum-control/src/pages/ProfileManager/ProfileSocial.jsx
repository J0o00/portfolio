import React from 'react';

const inputStyle = { width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', marginBottom: '1rem', fontSize: '1rem' };
const labelStyle = { display: 'block', marginBottom: '0.5rem', color: '#ccc', fontSize: '0.9rem' };

export default function ProfileSocial({ data, update }) {
  const social = data.social_links || {};
  const handleChange = (e) => {
    update({ social_links: { ...social, [e.target.name]: e.target.value } });
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <h3>Social Links</h3>
      <label style={labelStyle}>LinkedIn</label>
      <input style={inputStyle} name="linkedin" value={social.linkedin || ''} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
      <label style={labelStyle}>GitHub</label>
      <input style={inputStyle} name="github" value={social.github || ''} onChange={handleChange} placeholder="https://github.com/..." />
      <label style={labelStyle}>Google Scholar</label>
      <input style={inputStyle} name="google_scholar" value={social.google_scholar || ''} onChange={handleChange} placeholder="https://scholar.google.com/..." />
      <label style={labelStyle}>ORCID</label>
      <input style={inputStyle} name="orcid" value={social.orcid || ''} onChange={handleChange} placeholder="https://orcid.org/..." />
      <label style={labelStyle}>ResearchGate</label>
      <input style={inputStyle} name="researchgate" value={social.researchgate || ''} onChange={handleChange} placeholder="https://researchgate.net/profile/..." />
      <label style={labelStyle}>YouTube</label>
      <input style={inputStyle} name="youtube" value={social.youtube || ''} onChange={handleChange} placeholder="https://youtube.com/c/..." />
      <label style={labelStyle}>X/Twitter</label>
      <input style={inputStyle} name="twitter" value={social.twitter || ''} onChange={handleChange} placeholder="https://twitter.com/..." />
    </div>
  );
}
