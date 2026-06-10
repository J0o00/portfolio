import React from 'react';

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '8px',
  color: 'white',
  marginBottom: '1rem',
  fontSize: '1rem'
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  color: '#ccc',
  fontSize: '0.9rem'
};

export default function ProfileIdentity({ data, update }) {
  const handleChange = (e) => {
    update({ [e.target.name]: e.target.value });
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <h3>Identity</h3>
      
      <label style={labelStyle}>Full Name</label>
      <input style={inputStyle} name="name" value={data.name || ''} onChange={handleChange} placeholder="John Doe" />
      
      <label style={labelStyle}>Professional Headline</label>
      <input style={inputStyle} name="headline" value={data.headline || ''} onChange={handleChange} placeholder="Senior Software Engineer" />
      
      <label style={labelStyle}>Location</label>
      <input style={inputStyle} name="location" value={data.location || ''} onChange={handleChange} placeholder="San Francisco, CA" />
      
      <label style={labelStyle}>Email</label>
      <input style={inputStyle} name="email" value={data.email || ''} onChange={handleChange} placeholder="john@example.com" />
      
      <label style={labelStyle}>Phone</label>
      <input style={inputStyle} name="phone" value={data.phone || ''} onChange={handleChange} placeholder="+1 555-0100" />
      
      <label style={labelStyle}>Personal Website URL</label>
      <input style={inputStyle} name="website_url" value={data.website_url || ''} onChange={handleChange} placeholder="https://johndoe.com" />
    </div>
  );
}
