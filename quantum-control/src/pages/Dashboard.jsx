import React, { useState } from 'react';
import { ExternalLink, RefreshCw, Monitor, Smartphone, LayoutDashboard, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'preview'
  const [device, setDevice] = useState('desktop'); // 'desktop' or 'mobile'
  const [key, setKey] = useState(0);

  const refreshPreview = () => setKey(k => k + 1);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      
      {/* Dashboard Tabs Header */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--admin-border-color)', marginBottom: '1.5rem', gap: '2rem' }}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={{ 
            background: 'none', border: 'none', padding: '1rem 0', cursor: 'pointer',
            borderBottom: activeTab === 'overview' ? '2px solid var(--admin-accent)' : '2px solid transparent',
            color: activeTab === 'overview' ? 'var(--admin-accent)' : 'var(--admin-text)',
            fontWeight: activeTab === 'overview' ? 600 : 400,
            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem'
          }}
        >
          <LayoutDashboard size={18} /> Overview
        </button>
        <button 
          onClick={() => setActiveTab('preview')}
          style={{ 
            background: 'none', border: 'none', padding: '1rem 0', cursor: 'pointer',
            borderBottom: activeTab === 'preview' ? '2px solid var(--admin-accent)' : '2px solid transparent',
            color: activeTab === 'preview' ? 'var(--admin-accent)' : 'var(--admin-text)',
            fontWeight: activeTab === 'preview' ? 600 : 400,
            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem'
          }}
        >
          <Eye size={18} /> Live Preview
        </button>
      </div>

      {activeTab === 'overview' && (
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 1rem 0' }}>Welcome back, {userProfile?.role || 'Admin'}!</h2>
          <p style={{ color: 'var(--admin-placeholder)', marginBottom: '2rem' }}>
            This is your central control panel. Navigate using the sidebar to manage your portfolio content, users, and media.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.5)' }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Profile Status</h3>
              <p style={{ margin: 0, color: 'var(--admin-placeholder)' }}>Your portfolio profile is currently live. You can make draft changes in the Profile Manager.</p>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.5)' }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Media Assets</h3>
              <p style={{ margin: 0, color: 'var(--admin-placeholder)' }}>Manage images, PDFs, and background assets in the Media Library.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Real-time view of your public portfolio</p>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div className="glass-panel" style={{ display: 'flex', padding: '0.25rem', gap: '0.25rem', borderRadius: '8px' }}>
                <button 
                  onClick={() => setDevice('desktop')}
                  title="Desktop View"
                  style={{ padding: '0.5rem', background: device === 'desktop' ? 'var(--admin-accent)' : 'transparent', color: device === 'desktop' ? 'white' : 'var(--admin-text)', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Monitor size={18} />
                </button>
                <button 
                  onClick={() => setDevice('mobile')}
                  title="Mobile View"
                  style={{ padding: '0.5rem', background: device === 'mobile' ? 'var(--admin-accent)' : 'transparent', color: device === 'mobile' ? 'white' : 'var(--admin-text)', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Smartphone size={18} />
                </button>
              </div>
              
              <button onClick={refreshPreview} className="admin-button-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
                <RefreshCw size={16} /> Refresh
              </button>
              <a href="/" target="_blank" rel="noopener noreferrer" className="admin-button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                Open Site <ExternalLink size={16} />
              </a>
            </div>
          </div>

          <div className="glass-panel" style={{ 
            flex: 1, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'stretch',
            padding: '1rem',
            overflow: 'hidden',
            background: '#e5e7eb',
            borderRadius: '12px'
          }}>
            <div style={{
              width: device === 'mobile' ? '375px' : '100%',
              background: 'white',
              borderRadius: device === 'mobile' ? '36px' : '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: device === 'mobile' ? '12px solid #1f2937' : '1px solid #d1d5db',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {device === 'mobile' && (
                <div style={{ height: '24px', background: '#1f2937', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ width: '40%', height: '18px', background: 'black', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', marginTop: '-4px' }}></div>
                </div>
              )}
              <iframe
                key={key}
                src="/?preview=true"
                title="Portfolio Preview"
                style={{ flex: 1, width: '100%', border: 'none', paddingTop: device === 'mobile' ? '20px' : '0' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
