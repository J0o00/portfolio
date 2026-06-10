import React from 'react';

export default function ProfileIdentity({ data, update }) {
  const handleChange = (e) => {
    update({ [e.target.name]: e.target.value });
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <h3>Identity</h3>
      
      <label className="admin-label">Full Name</label>
      <input className="admin-input" name="name" value={data.name || ''} onChange={handleChange} placeholder="John Doe" />
      
      <label className="admin-label">Professional Headline</label>
      <input className="admin-input" name="headline" value={data.headline || ''} onChange={handleChange} placeholder="Senior Software Engineer" />
      
      <label className="admin-label">Location</label>
      <input className="admin-input" name="location" value={data.location || ''} onChange={handleChange} placeholder="San Francisco, CA" />
      
      <label className="admin-label">Email</label>
      <input className="admin-input" name="email" value={data.email || ''} onChange={handleChange} placeholder="john@example.com" />
      
      <label className="admin-label">Phone</label>
      <input className="admin-input" name="phone" value={data.phone || ''} onChange={handleChange} placeholder="+1 555-0100" />
      
      <label className="admin-label">Personal Website URL</label>
      <input className="admin-input" name="website_url" value={data.website_url || ''} onChange={handleChange} placeholder="https://johndoe.com" />
    </div>
  );
}
