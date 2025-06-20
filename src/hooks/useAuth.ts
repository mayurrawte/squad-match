import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Import Supabase client
import { User } from '@supabase/supabase-js'; // Import User type from Supabase
import { User } from '../types'; // Import application-specific User type

// Helper function to map SupabaseUser to application-specific User
const mapSupabaseUserToAppUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser) return null;
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    displayName: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email, // Fallback to email if name not present
    photoURL: supabaseUser.user_metadata?.avatar_url,
  };
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null); // Use application-specific User type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // onAuthStateChanged equivalent for Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const appUser = mapSupabaseUserToAppUser(session?.user ?? null);
        setUser(appUser);
        setLoading(false);
      }
    );

    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(mapSupabaseUserToAppUser(session.user));
      }
      setLoading(false);
    };
    checkSession();

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (signInError) {
        throw signInError;
      }
      // Supabase handles redirect and session update, onAuthStateChange will update user state
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        throw signOutError;
      }
      setUser(null); // User will be set to null by onAuthStateChange as well
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Sign-out failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
  };
};