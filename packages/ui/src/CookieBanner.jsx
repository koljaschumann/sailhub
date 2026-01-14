import { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { Button } from './Button';
import { Icons } from './Icons';

const COOKIE_CONSENT_KEY = 'tsc_cookie_consent';

/**
 * Cookie Consent Banner - DSGVO konform
 * Zeigt beim ersten Besuch ein Banner zur Cookie-Zustimmung
 */
export function CookieBanner() {
  const { isDark } = useTheme();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Prüfe ob bereits Zustimmung erteilt wurde
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Kurze Verzögerung für bessere UX
      const timer = setTimeout(() => setShowBanner(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      necessary: true,
      functional: true,
      analytics: false, // Wir nutzen keine Analytics
      timestamp: Date.now()
    }));
    setShowBanner(false);
  };

  const handleAcceptNecessary = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      necessary: true,
      functional: false,
      analytics: false,
      timestamp: Date.now()
    }));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
        onClick={() => {}} // Prevent closing by clicking backdrop
      />

      {/* Banner */}
      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl pointer-events-auto animate-slide-up ${
          isDark
            ? 'bg-navy-800 border border-navy-700'
            : 'bg-white border border-light-border'
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isDark ? 'bg-gold-400/10' : 'bg-teal-100'
            }`}>
              <span className={`w-5 h-5 ${isDark ? 'text-gold-400' : 'text-teal-600'}`}>
                {Icons.lock}
              </span>
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Cookie-Einstellungen
              </h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Wir respektieren Ihre Privatsphäre
              </p>
            </div>
          </div>

          {/* Content */}
          <div className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
            <p className="mb-3">
              Diese Website verwendet Cookies, um Ihre Anmeldung zu speichern und die Plattform
              funktionsfähig zu halten. Wir verwenden <strong>keine Tracking- oder Analytics-Cookies</strong>.
            </p>
            <p>
              Weitere Informationen finden Sie in unseren{' '}
              <a
                href="/datenschutz"
                target="_blank"
                className={`underline ${isDark ? 'text-gold-400 hover:text-gold-300' : 'text-teal-600 hover:text-teal-700'}`}
              >
                Datenschutzinformationen
              </a>.
            </p>
          </div>

          {/* Cookie Types Info */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-xs ${
            isDark ? 'text-cream/60' : 'text-light-muted'
          }`}>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-navy-700/50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="font-medium">Notwendig</span>
              </div>
              <p>Authentifizierung, Session-Verwaltung</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-navy-700/50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="font-medium">Funktional</span>
              </div>
              <p>Theme-Einstellungen, Präferenzen</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleAcceptAll}
              className="flex-1"
            >
              Alle akzeptieren
            </Button>
            <Button
              variant="outline"
              onClick={handleAcceptNecessary}
              className="flex-1"
            >
              Nur notwendige
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

/**
 * Hook zum Prüfen der Cookie-Zustimmung
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      try {
        setConsent(JSON.parse(stored));
      } catch {
        setConsent(null);
      }
    }
  }, []);

  return {
    hasConsent: !!consent,
    consent,
    hasFunctionalConsent: consent?.functional === true,
    resetConsent: () => {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      setConsent(null);
    }
  };
}

export default CookieBanner;
