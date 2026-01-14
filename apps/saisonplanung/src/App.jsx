import { useState } from 'react';
import { useAuth } from '@tsc/supabase';
import { useTheme, FeedbackWidget } from '@tsc/ui';
import { Navigation } from './components/Navigation';
import { DashboardPage } from './pages/Dashboard';
import { EventsPage } from './pages/Events';
import { OverviewPage } from './pages/Overview';
import { BoatsPage } from './pages/Boats';
import { AdminPage } from './pages/Admin';
import { useData } from './context/DataContext';

// Loading Spinner Component
function LoadingScreen() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      <div className="text-center">
        <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${
          isDark ? 'border-gold-400' : 'border-teal-500'
        }`} />
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Lade Saisonplanung...
        </p>
      </div>
    </div>
  );
}

// Login Redirect Screen
function LoginRedirect() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      <div className="text-center max-w-md mx-auto px-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
          isDark ? 'bg-gold-400/20' : 'bg-teal-100'
        }`}>
          <svg className={`w-8 h-8 ${isDark ? 'text-gold-400' : 'text-teal-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Anmeldung erforderlich
        </h1>
        <p className={`mb-6 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
          Bitte melde dich auf der Hauptseite an, um auf die Saisonplanung zuzugreifen.
        </p>
        <a
          href="/"
          className={`
            inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
            ${isDark
              ? 'bg-gold-400 text-navy-900 hover:bg-gold-300'
              : 'bg-teal-500 text-white hover:bg-teal-600'}
          `}
        >
          Zur Anmeldung
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </div>
  );
}

// Main App Content
function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { loading: dataLoading } = useData();

  if (dataLoading) {
    return <LoadingScreen />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage setCurrentPage={setCurrentPage} />;
      case 'events':
        return <EventsPage />;
      case 'overview':
        return <OverviewPage />;
      case 'boats':
        return <BoatsPage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <DashboardPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {renderPage()}
      <FeedbackWidget appName="Saisonplanung" />
    </div>
  );
}

// Root App with Auth Check
export default function App() {
  // TODO: Remove devMode when Supabase connection is fixed
  const devMode = true;

  const { user, loading: authLoading } = useAuth();

  // Skip auth check in devMode
  if (devMode) {
    return <AppContent />;
  }

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginRedirect />;
  }

  return <AppContent />;
}
