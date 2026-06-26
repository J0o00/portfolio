import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// Route-Level Lazy Loaded Admin Modules
const Users = lazy(() => import('./pages/Users'));
const ProfileManager = lazy(() => import('./pages/ProfileManager'));
const MediaLibrary = lazy(() => import('./pages/MediaLibrary/MediaLibrary'));
const Projects = lazy(() => import('./pages/Projects/Projects'));
const ProjectEditor = lazy(() => import('./pages/Projects/Editor/ProjectEditor'));
const Research = lazy(() => import('./pages/Research/Research'));
const ResearchEditor = lazy(() => import('./pages/Research/Editor/ResearchEditor'));
const Experience = lazy(() => import('./pages/Experience/Experience'));
const ExperienceEditor = lazy(() => import('./pages/Experience/Editor/ExperienceEditor'));
const Skills = lazy(() => import('./pages/Skills/Skills'));
const SkillEditor = lazy(() => import('./pages/Skills/Editor/SkillEditor'));
const Education = lazy(() => import('./pages/Education/Education'));
const EducationEditor = lazy(() => import('./pages/Education/Editor/EducationEditor'));
const ResumeSync = lazy(() => import('./pages/ResumeSync/ResumeSync'));

// Placeholder Pages
const Settings = () => <div><h2>Settings</h2><p>Backup, Restore, and Audit logs.</p></div>;

const RouteFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', width: '100%' }}>
    <Loader2 size={32} color="#0066cc" className="spin" />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Quantum Control...</div>;
  
  if (!user || !userProfile) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const getRouterBasename = () => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/quantum-control')) {
    return '/quantum-control';
  }
  return '';
};

export default function App() {
  console.log('[App] Quantum Control SPA starting...');
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter basename={getRouterBasename()}>
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="profile" element={<ProfileManager />} />
                  <Route path="media" element={<MediaLibrary />} />
                  <Route path="users" element={<Users />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/:id" element={<ProjectEditor />} />
                  <Route path="research" element={<Research />} />
                  <Route path="research/:id" element={<ResearchEditor />} />
                  <Route path="experience" element={<Experience />} />
                  <Route path="experience/:id" element={<ExperienceEditor />} />
                  <Route path="skills" element={<Skills />} />
                  <Route path="skills/:id" element={<SkillEditor />} />
                  <Route path="education" element={<Education />} />
                  <Route path="education/:id" element={<EducationEditor />} />
                  <Route path="resume-sync" element={<ResumeSync />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
