import { useState } from 'react';
import { useTheme, FeedbackWidget, DonateButton } from '@tsc/ui';
import { DataProvider, useData } from './context/DataContext';
import { Navigation } from './components/Navigation';
import { DashboardPage, SettingsPage, AddRegattaPage, ExportPage } from './pages';
import AdminPage from './pages/Admin';

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
          Lade Startgelder...
        </p>
      </div>
    </div>
  );
}

// Onboarding Component für neue Benutzer
function OnboardingScreen({ setCurrentPage }) {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      <div className={`max-w-md w-full mx-4 p-8 rounded-2xl ${isDark ? 'bg-navy-800 border border-gold-400/20' : 'bg-white shadow-lg'}`}>
        <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${isDark ? 'bg-gold-400/20 text-gold-400' : 'bg-teal-500/10 text-teal-500'}`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className={`text-2xl font-bold text-center mb-2 ${isDark ? 'text-cream' : 'text-gray-900'}`}>
          Willkommen!
        </h2>
        <p className={`text-center mb-6 ${isDark ? 'text-cream/60' : 'text-gray-600'}`}>
          Bevor du Startgelder einreichen kannst, richte bitte dein Segler-Profil ein.
        </p>
        <button
          onClick={() => setCurrentPage('settings')}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
            isDark
              ? 'bg-gold-400 text-navy-900 hover:bg-gold-300'
              : 'bg-teal-500 text-white hover:bg-teal-600'
          }`}
        >
          Profil einrichten
        </button>
      </div>
    </div>
  );
}

// Error Screen Component
function ErrorScreen({ error, onRetry }) {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      <div className={`max-w-md w-full mx-4 p-8 rounded-2xl ${isDark ? 'bg-navy-800 border border-red-500/20' : 'bg-white shadow-lg'}`}>
        <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-500'}`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className={`text-2xl font-bold text-center mb-2 ${isDark ? 'text-cream' : 'text-gray-900'}`}>
          Fehler beim Laden
        </h2>
        <p className={`text-center mb-4 ${isDark ? 'text-cream/60' : 'text-gray-600'}`}>
          {error || 'Ein unbekannter Fehler ist aufgetreten.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
              isDark
                ? 'bg-gold-400 text-navy-900 hover:bg-gold-300'
                : 'bg-teal-500 text-white hover:bg-teal-600'
            }`}
          >
            Erneut versuchen
          </button>
        )}
      </div>
    </div>
  );
}

// Main App Content
function StartgelderContent({ onBackToDashboard }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { loading: dataLoading, showOnboarding, error, reload } = useData();
  const { isDark } = useTheme();

  if (dataLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={reload} />;
  }

  if (showOnboarding && currentPage === 'dashboard') {
    return <OnboardingScreen setCurrentPage={setCurrentPage} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage setCurrentPage={setCurrentPage} />;
      case 'add':
        return <AddRegattaPage setCurrentPage={setCurrentPage} />;
      case 'export':
        return <ExportPage setCurrentPage={setCurrentPage} />;
      case 'settings':
        return <SettingsPage setCurrentPage={setCurrentPage} />;
      case 'admin':
        return <AdminPage setCurrentPage={setCurrentPage} />;
      default:
        return <DashboardPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      <Navigation
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onBackToDashboard={onBackToDashboard}
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {renderPage()}
      </main>
      <FeedbackWidget appName="Startgeld-Erstattung" />
      <DonateButton />
    </div>
  );
}

// Root Component with DataProvider
export default function Startgelder({ onBackToDashboard }) {
  return (
    <DataProvider>
      <StartgelderContent onBackToDashboard={onBackToDashboard} />
    </DataProvider>
  );
}
