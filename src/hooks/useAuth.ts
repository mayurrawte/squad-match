import { useState, useEffect } from 'react';
import { 
  User, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Check for redirect result on component mount
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error('Redirect sign-in error:', error);
        setError(error.message);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // First try popup method
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (error: any) {
      console.error('Popup sign-in error:', error);
      
      // If popup is blocked, fall back to redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        try {
          console.log('Popup blocked, trying redirect method...');
          await signInWithRedirect(auth, googleProvider);
          // Note: redirect will reload the page, so we don't set loading to false here
        } catch (redirectError: any) {
          console.error('Redirect sign-in error:', redirectError);
          setError('Sign-in failed. Please try again or check your browser settings.');
          setLoading(false);
        }
      } else {
        setError(error.message || 'Sign-in failed. Please try again.');
        setLoading(false);
      }
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError(error.message);
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut
  };
};