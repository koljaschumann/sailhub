import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@tsc/ui';
import { supabase } from '@tsc/supabase';

export default function AuthCallback() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
      } else {
        navigate('/dashboard');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-400 border-t-transparent mx-auto mb-4" />
        <p className={`${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
          Anmeldung wird verarbeitet...
        </p>
      </div>
    </div>
  );
}
