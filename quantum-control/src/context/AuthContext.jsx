import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../../src/lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth] Session detection starting...');
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('[Auth] Get session error:', error);
      console.log('[Auth] Initial session detected:', session ? 'Yes' : 'No');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[Auth] Auth state changed: ${event}`);
      if (event === 'SIGNED_IN') {
         console.log('[Auth] OAuth redirect return or sign in successful.');
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

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    console.log(`[Auth] Profile lookup for user: ${userId}`);
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      console.log(`[Auth] Profile lookup successful. Role: ${data.role}`);
      
      // If user exists but is suspended, sign them out immediately
      if (data && data.status === 'Suspended') {
        console.warn('[Auth] Access denied: Account is suspended.');
        await supabase.auth.signOut();
        throw new Error('Account is suspended.');
      }
      
      setUserProfile(data);
    } catch (error) {
      console.error('[Auth] Error fetching user profile:', error.message);
      console.warn('[Auth] Access denied: Not an approved user.');
      await supabase.auth.signOut();
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/quantum-control/'
      }
    });
    if (error) console.error("Error signing in:", error.message);
  };

  const signOut = async () => {
    console.log('[Auth] Sign out initiated.');
    await supabase.auth.signOut();
  };

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
