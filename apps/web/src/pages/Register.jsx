import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GlassCard, Button, Icons, useTheme, useToast } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { registrationRoles } from '@tsc/data';

export default function Register() {
  const { isDark } = useTheme();
  const { signUp } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('segler');
  const [membershipNumber, setMembershipNumber] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Prüfe ob es eine Ziel-URL gibt (wird nach Login verwendet)
  const redirectUrl = sessionStorage.getItem('redirectAfterLogin');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      addToast('Passwörter stimmen nicht überein', 'error');
      return;
    }

    if (password.length < 6) {
      addToast('Passwort muss mindestens 6 Zeichen haben', 'error');
      return;
    }

    if (!privacyConsent) {
      addToast('Bitte akzeptiere die Nutzungsbedingungen und Datenschutzinformationen', 'error');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, fullName, role, membershipNumber);

    if (error) {
      addToast(error.message, 'error');
    } else {
      addToast('Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse.', 'success');
      navigate('/login');
    }

    setLoading(false);
  };

  const inputClasses = `w-full px-4 py-3 rounded-xl border transition-colors ${
    isDark
      ? 'bg-navy-700 border-navy-600 text-cream placeholder-cream/40 focus:border-gold-400'
      : 'bg-white border-light-border text-light-text placeholder-light-muted focus:border-teal-500'
  } focus:outline-none`;

  const labelClasses = `block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`;

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="flex items-center justify-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center glow-pulse ${isDark ? 'bg-gold-400/10' : 'bg-teal-100'}`}>
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

        <GlassCard shimmer>
          <h2 className={`text-xl font-semibold mb-4 text-center ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Konto erstellen
          </h2>

          {/* Redirect Notice */}
          {redirectUrl && (
            <div className={`mb-6 p-3 rounded-lg text-sm text-center ${
              isDark ? 'bg-gold-400/10 text-gold-400' : 'bg-teal-50 text-teal-700'
            }`}>
              <span className="inline-block w-4 h-4 mr-1 align-text-bottom">{Icons.lock}</span>
              Erstelle ein Konto, um fortzufahren.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="mb-4">
              <label className={labelClasses}>
                Vollständiger Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className={inputClasses}
                placeholder="Max Mustermann"
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className={labelClasses}>
                E-Mail *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClasses}
                placeholder="deine@email.de"
              />
            </div>

            {/* Role */}
            <div className="mb-4">
              <label className={labelClasses}>
                Rolle *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className={inputClasses}
              >
                {registrationRoles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Membership Number */}
            <div className="mb-4">
              <label className={labelClasses}>
                Mitgliedsnummer
              </label>
              <input
                type="text"
                value={membershipNumber}
                onChange={(e) => setMembershipNumber(e.target.value)}
                className={inputClasses}
                placeholder="z.B. 12345"
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
                Optional - falls vorhanden
              </p>
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className={labelClasses}>
                Passwort *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={inputClasses}
                placeholder="Mindestens 6 Zeichen"
              />
            </div>

            {/* Confirm Password */}
            <div className="mb-4">
              <label className={labelClasses}>
                Passwort bestätigen *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={inputClasses}
                placeholder="Passwort wiederholen"
              />
            </div>

            {/* Terms & Privacy Consent */}
            <div className="mb-6">
              <label className={`flex items-start gap-3 cursor-pointer ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className={`mt-1 w-4 h-4 rounded border ${
                    isDark
                      ? 'bg-navy-700 border-navy-600 accent-gold-400'
                      : 'bg-white border-light-border accent-teal-500'
                  }`}
                />
                <span className="text-sm">
                  Ich akzeptiere die{' '}
                  <Link
                    to="/nutzungsbedingungen"
                    target="_blank"
                    className={`underline ${isDark ? 'text-gold-400 hover:text-gold-300' : 'text-teal-600 hover:text-teal-700'}`}
                  >
                    Nutzungsbedingungen
                  </Link>
                  {' '}und habe die{' '}
                  <Link
                    to="/datenschutz"
                    target="_blank"
                    className={`underline ${isDark ? 'text-gold-400 hover:text-gold-300' : 'text-teal-600 hover:text-teal-700'}`}
                  >
                    Datenschutzinformationen
                  </Link>
                  {' '}zur Kenntnis genommen. *
                </span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !privacyConsent}
            >
              {loading ? 'Bitte warten...' : 'Registrieren'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Bereits ein Konto?{' '}
              <Link
                to="/login"
                className={`font-medium ${isDark ? 'text-gold-400 hover:text-gold-300' : 'text-teal-600 hover:text-teal-700'}`}
              >
                Jetzt anmelden
              </Link>
            </p>
          </div>
        </GlassCard>

        <p className={`mt-6 text-center text-xs ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
          * Pflichtfelder
        </p>
      </div>
    </div>
  );
}
