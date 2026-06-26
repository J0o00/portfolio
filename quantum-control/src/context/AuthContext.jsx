import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { ShieldAlert, RefreshCw } from 'lucide-react';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maintenanceError, setMaintenanceError] = useState(null);

  useEffect(() => {
    console.log('[Auth] Session detection starting...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[Auth] Get session error:', error);
        if (error.message?.includes('Failed to fetch') || error.status >= 500) {
          setMaintenanceError("Database cluster unreachable. Platform is under temporary maintenance.");
        }
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error('[Auth] Fatal initialization crash:', err);
      setMaintenanceError("Unable to establish connection with Supabase backend.");
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[Auth] Auth state changed: ${event}`);
      if (event === 'SIGNED_IN') {
         if (session?.user) {
           supabase.from('users_profile').update({ last_login: new Date().toISOString() }).eq('id', session.user.id).then();
         }
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  // 45-Minute Inactivity Auto-Logout Safeguard
  useEffect(() => {
    if (!session) return;
    let timeoutId;
    const INACTIVITY_LIMIT_MS = 45 * 60 * 1000; // 45 minutes

    const handleUserActivity = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        console.warn('[Auth] Session expired due to 45m inactivity.');
        await supabase.auth.signOut();
        alert('Security Notice: Your session expired due to 45 minutes of inactivity. Please authenticate again.');
      }, INACTIVITY_LIMIT_MS);
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));
    handleUserActivity();

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach(evt => window.removeEventListener(evt, handleUserActivity));
    };
  }, [session]);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data && data.status === 'Suspended') {
        await supabase.auth.signOut();
        throw new Error('Account is suspended.');
      }
      
      setUserProfile(data);
    } catch (error) {
      console.error('[Auth] Error fetching user profile:', error.message);
      if (error.message?.includes('Failed to fetch') || error.code === 'PGRST301') {
        setMaintenanceError("Database RLS endpoint timeout. Please try reloading.");
      } else {
        await supabase.auth.signOut();
        setUserProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const redirectBase = import.meta.env.BASE_URL !== '/' ? window.location.origin + import.meta.env.BASE_URL : window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectBase
      }
    });
    if (error) console.error("Error signing in:", error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (maintenanceError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-950 text-center font-sans">
        <div className="max-w-md p-8 rounded-2xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-xl shadow-2xl">
          <div className="p-4 inline-block rounded-full bg-amber-500/10 text-amber-400 mb-4 animate-pulse">
            <ShieldAlert className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Platform Maintenance</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            {maintenanceError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 font-semibold text-sm rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-600/20 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Connection
          </button>
        </div>
      </div>
    );
  }

  const value = {
    session,
    user,
    userProfile,
    loading,
    signInWithGoogle,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
