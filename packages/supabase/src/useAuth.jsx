import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from './client';
import { submitDeletionNotice } from './tickets';

const AuthContext = createContext(null);

// SSO Token key for cross-origin auth
const SSO_TOKEN_KEY = 'tsc_sso_token';

// Generate SSO token from user/profile
const generateSSOToken = (user, profile) => {
  if (!user || !profile) return null;
  return btoa(JSON.stringify({ user, profile, timestamp: Date.now() }));
};

// Parse SSO token
const parseSSOToken = (token) => {
  try {
    const data = JSON.parse(atob(token));
    // Token expires after 1 hour
    if (Date.now() - data.timestamp > 3600000) return null;
    return data;
  } catch {
    return null;
  }
};

// Get auth URL with SSO token
export const getAuthUrl = (baseUrl, user, profile) => {
  const token = generateSSOToken(user, profile);
  if (!token) return baseUrl;
  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set('sso', token);
  return url.toString();
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use refs to track state in closures
  const authCheckedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Clear old sessions
    sessionStorage.removeItem('tsc_dev_user');

    // Function to fetch profile
    const loadProfile = async (userId, userEmail) => {
      console.log('Fetching profile for:', userId, 'email:', userEmail);
      try {
        let { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        console.log('Profile by ID - data:', data, 'error:', error);

        // If ID lookup fails, try by email as fallback
        if ((error || !data) && userEmail) {
          console.log('Trying profile lookup by email...');
          const emailResult = await supabase
            .from('profiles')
            .select('*')
            .eq('email', userEmail)
            .single();

          data = emailResult.data;
          error = emailResult.error;
          console.log('Profile by email - data:', data, 'error:', error);
        }

        if (error) {
          console.error('Profile fetch error:', error.message, error.code);
          if (isMountedRef.current) setProfile(null);
        } else if (data) {
          console.log('Profile loaded:', data?.email, 'Role:', data?.role);

          // Try to get trainer_boat_classes
          try {
            const { data: boatClasses } = await supabase
              .from('trainer_boat_classes')
              .select('boat_class_id, is_primary')
              .eq('trainer_id', userId);

            if (boatClasses) {
              data.trainer_boat_classes = boatClasses;
            }
          } catch (e) {
            console.log('Could not fetch trainer_boat_classes:', e);
          }

          if (isMountedRef.current) setProfile(data);
        } else {
          console.error('No profile found');
          if (isMountedRef.current) setProfile(null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (isMountedRef.current) setProfile(null);
      } finally {
        console.log('fetchProfile finished');
        if (isMountedRef.current) setLoading(false);
        authCheckedRef.current = true;
      }
    };

    // Listen for auth changes FIRST (this catches the initial session too)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        if (!isMountedRef.current) return;

        authCheckedRef.current = true;

        if (session?.user) {
          setUser(session.user);

          // SOFORT ein temporäres Profil aus user_metadata setzen
          // Das stellt sicher, dass die Rolle sofort verfügbar ist
          const tempProfile = {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            role: session.user.user_metadata?.role || 'eltern',
          };
          console.log('Setting temp profile from user_metadata:', tempProfile);
          setProfile(tempProfile);
          setLoading(false);

          // Dann parallel das echte Profil aus der DB laden
          loadProfile(session.user.id, session.user.email);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Also do an initial check (belt and suspenders)
    const initAuth = async () => {
      // Skip if auth already checked by onAuthStateChange
      if (authCheckedRef.current) {
        console.log('initAuth: skipping, auth already checked');
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', session?.user?.email || 'no session');

        if (!isMountedRef.current) return;

        // Double-check ref in case onAuthStateChange fired during getSession
        if (authCheckedRef.current) {
          console.log('initAuth: skipping profile load, auth already handled');
          return;
        }

        if (session?.user) {
          setUser(session.user);

          // SOFORT ein temporäres Profil aus user_metadata setzen
          const tempProfile = {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            role: session.user.user_metadata?.role || 'eltern',
          };
          console.log('initAuth: Setting temp profile:', tempProfile);
          setProfile(tempProfile);
          setLoading(false);
          authCheckedRef.current = true;

          // Dann das echte Profil aus der DB laden
          loadProfile(session.user.id, session.user.email);
        } else {
          setLoading(false);
          authCheckedRef.current = true;
        }
      } catch (err) {
        console.error('Session check error:', err);
        if (isMountedRef.current) setLoading(false);
        authCheckedRef.current = true;
      }
    };

    // Small delay to let onAuthStateChange fire first
    const initTimeoutId = setTimeout(() => {
      if (!authCheckedRef.current) {
        initAuth();
      }
    }, 150);

    // Absolute fallback timeout - only if nothing has happened
    const fallbackTimeoutId = setTimeout(() => {
      if (isMountedRef.current && !authCheckedRef.current) {
        console.warn('Auth check timed out after 10s');
        setLoading(false);
        authCheckedRef.current = true;
      }
    }, 10000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initTimeoutId);
      clearTimeout(fallbackTimeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signUp = async (email, password, fullName, role = 'segler', membershipNumber = '') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          membership_number: membershipNumber
        }
      }
    });
    return { data, error };
  };

  const signInWithMagicLink = async (email) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    return { data, error };
  };

  const signOut = async () => {
    console.log('SignOut: Starting...');

    // Clear React state first
    setUser(null);
    setProfile(null);

    // Clear all storage
    sessionStorage.removeItem('tsc_dev_user');
    sessionStorage.clear();

    // Clear all Supabase localStorage items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });

    // Call Supabase signOut with global scope
    try {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('SignOut: Supabase signOut successful');
    } catch (e) {
      console.error('SignOut: Supabase error:', e);
    }

    console.log('SignOut: Complete');
    return { error: null };
  };

  // Dev-only login (no real authentication)
  const devSignIn = (role = 'admin') => {
    const devUser = {
      id: 'dev_user_' + Date.now(),
      email: 'dev@tsc-jugend.de',
    };
    const devProfile = {
      id: devUser.id,
      email: devUser.email,
      full_name: 'Dev User (' + role + ')',
      role: role,
    };
    setUser(devUser);
    setProfile(devProfile);
    sessionStorage.setItem('tsc_dev_user', JSON.stringify({ user: devUser, profile: devProfile }));
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (!error && data) setProfile(prev => ({ ...prev, ...data }));
    return { data, error };
  };

  // Account löschen - DSGVO-konform mit Benachrichtigung
  const deleteAccount = async (deletionReason = '') => {
    if (!user) return { error: new Error('Not authenticated') };

    console.log('DeleteAccount: Starting deletion process...');

    try {
      // 1. Löschbenachrichtigung an GitHub/ClickUp senden
      const ticketResult = await submitDeletionNotice({
        userId: user.id,
        email: user.email,
        fullName: profile?.full_name,
        role: profile?.role,
        deletionReason
      });
      console.log('DeleteAccount: Deletion notice created:', ticketResult);

      // 2. Profil aus der Datenbank löschen
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.error('DeleteAccount: Profile deletion error:', profileError);
      } else {
        console.log('DeleteAccount: Profile deleted from database');
      }

      // 3. Benutzer ausloggen und lokale Daten löschen
      setUser(null);
      setProfile(null);
      sessionStorage.clear();

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });

      await supabase.auth.signOut({ scope: 'global' });
      console.log('DeleteAccount: User signed out');

      return {
        success: true,
        ticketId: ticketResult.ticketId,
        message: 'Ihr Konto wurde zur Löschung markiert. Sie werden per E-Mail benachrichtigt, sobald alle Daten gelöscht wurden.'
      };
    } catch (error) {
      console.error('DeleteAccount: Error:', error);
      return { error };
    }
  };

  // Rolle aus profile oder user_metadata (Fallback für neue Registrierungen)
  const userRole = profile?.role || user?.user_metadata?.role;

  // Debug: Log role detection
  console.log('useAuth Context - userRole:', userRole, 'profile?.role:', profile?.role, 'isAdmin:', userRole === 'admin', 'isTrainer:', userRole === 'trainer' || userRole === 'admin');

  // Modulspezifische Berechtigungen aus dem Profil
  const isHaengerwart = profile?.is_haengerwart === true;

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithMagicLink,
    signOut,
    deleteAccount,
    devSignIn,
    updateProfile,
    getAuthUrl: (url) => getAuthUrl(url, user, profile),
    isAuthenticated: !!user,
    isAdmin: userRole === 'admin',
    isTrainer: userRole === 'trainer' || userRole === 'admin',
    isParent: userRole === 'eltern',
    isSailor: userRole === 'segler',
    isHaengerwart,  // Modulspezifisch: Kann Schadensmeldungen bearbeiten
    canManageDamages: userRole === 'admin' || isHaengerwart,  // Admin oder Hängerwart
    userRole,
    trainerBoatClasses: profile?.trainer_boat_classes?.map(t => t.boat_class_id) || [],
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
