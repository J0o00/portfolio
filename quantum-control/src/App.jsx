import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Users from './pages/Users';
import ProfileManager from './pages/ProfileManager';
import Dashboard from './pages/Dashboard';
import MediaLibrary from './pages/MediaLibrary/MediaLibrary';

// Placeholder Pages
const Settings = () => <div><h2>Settings</h2><p>Backup, Restore, and Audit logs.</p></div>;

const ProtectedRoute = ({ children }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Quantum Control...</div>;
  
  if (!user || !userProfile) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  console.log('[App] Quantum Control SPA starting...');
  return (
    <AuthProvider>
      <BrowserRouter basename="/quantum-control">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<ProfileManager />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
