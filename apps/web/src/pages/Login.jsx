import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GlassCard, Button, Icons, useTheme, useToast } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';

export default function Login() {
  const { isDark } = useTheme();
  const { signIn, signInWithMagicLink, devSignIn, getAuthUrl } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState('password'); // 'password' or 'magic'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Prüfe ob es eine Ziel-URL gibt
  const redirectUrl = sessionStorage.getItem('redirectAfterLogin');

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      addToast(error.message, 'error');
    } else {
      addToast('Erfolgreich angemeldet!', 'success');

      // Redirect zum gespeicherten Modul oder Dashboard
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = getAuthUrl(redirectUrl);
      } else {
        navigate('/dashboard');
      }
    }

    setLoading(false);
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signInWithMagicLink(email);

    if (error) {
      addToast(error.message, 'error');
    } else {
      addToast('Magic Link wurde gesendet! Prüfe deine E-Mails.', 'success');
    }

    setLoading(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="flex items-center justify-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-gold-400/10' : 'bg-teal-100'}`}>
                <span className={`w-7 h-7 ${isDark ? 'text-gold-400' : 'text-teal-600'}`}>
                  {Icons.sailboat}
                </span>
              </div>
              <span className={`text-2xl font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                TSC-Jugendportal
              </span>
            </div>
          </Link>
        </div>

        <GlassCard animate>
          <h2 className={`text-xl font-semibold mb-4 text-center ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Anmelden
          </h2>

          {/* Redirect Notice */}
          {redirectUrl && (
            <div className={`mb-6 p-3 rounded-lg text-sm text-center ${
              isDark ? 'bg-gold-400/10 text-gold-400' : 'bg-teal-50 text-teal-700'
            }`}>
              <span className="inline-block w-4 h-4 mr-1 align-text-bottom">{Icons.lock}</span>
              Bitte melde dich an, um fortzufahren.
            </div>
          )}

          {/* Mode Toggle */}
          <div className={`flex rounded-xl p-1 mb-6 ${isDark ? 'bg-navy-700' : 'bg-light-border'}`}>
            <button
              onClick={() => setMode('password')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                mode === 'password'
                  ? isDark
                    ? 'bg-navy-600 text-cream'
                    : 'bg-white text-light-text shadow-sm'
                  : isDark
                    ? 'text-cream/60'
                    : 'text-light-muted'
              }`}
            >
              Passwort
            </button>
            <button
              onClick={() => setMode('magic')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                mode === 'magic'
                  ? isDark
                    ? 'bg-navy-600 text-cream'
                    : 'bg-white text-light-text shadow-sm'
                  : isDark
                    ? 'text-cream/60'
                    : 'text-light-muted'
              }`}
            >
              Magic Link
            </button>
          </div>

          <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}>
            {/* Email */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-700 border-navy-600 text-cream placeholder-cream/40 focus:border-gold-400'
                    : 'bg-white border-light-border text-light-text placeholder-light-muted focus:border-teal-500'
                } focus:outline-none`}
                placeholder="deine@email.de"
              />
            </div>

            {/* Password (only in password mode) */}
            {mode === 'password' && (
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  Passwort
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-navy-700 border-navy-600 text-cream placeholder-cream/40 focus:border-gold-400'
                      : 'bg-white border-light-border text-light-text placeholder-light-muted focus:border-teal-500'
                  } focus:outline-none`}
                  placeholder="••••••••"
                />
              </div>
            )}

            {mode === 'magic' && (
              <p className={`text-sm mb-6 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Wir senden dir einen Link per E-Mail, mit dem du dich ohne Passwort anmelden kannst.
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Bitte warten...' : mode === 'password' ? 'Anmelden' : 'Magic Link senden'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Noch kein Konto?{' '}
              <Link
                to="/register"
                className={`font-medium ${isDark ? 'text-gold-400 hover:text-gold-300' : 'text-teal-600 hover:text-teal-700'}`}
              >
                Jetzt registrieren
              </Link>
            </p>
          </div>

          {/* Dev Login - nur für Entwicklung */}
          {import.meta.env.DEV && (
            <div className={`mt-6 pt-6 border-t ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
              <p className={`text-xs mb-3 text-center ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
                Entwickler-Schnellzugang
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    devSignIn('admin');
                    navigate('/dashboard');
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isDark
                      ? 'bg-gold-400/10 text-gold-400 hover:bg-gold-400/20'
                      : 'bg-teal-50 text-teal-600 hover:bg-teal-100'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => {
                    devSignIn('trainer');
                    navigate('/dashboard');
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isDark
                      ? 'bg-navy-700 text-cream/60 hover:text-cream'
                      : 'bg-light-border text-light-muted hover:text-light-text'
                  }`}
                >
                  Trainer
                </button>
                <button
                  onClick={() => {
                    devSignIn('segler');
                    navigate('/dashboard');
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isDark
                      ? 'bg-navy-700 text-cream/60 hover:text-cream'
                      : 'bg-light-border text-light-muted hover:text-light-text'
                  }`}
                >
                  Segler
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
