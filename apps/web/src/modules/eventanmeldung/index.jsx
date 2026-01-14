import { useState } from 'react';
import { useTheme, FeedbackWidget, ToastProvider, DonateButton } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { DataProvider } from './context/DataContext';
import { Navigation } from './components/Navigation';
import RegistrationFormPage from './pages/RegistrationForm';
import RegistrationListPage from './pages/RegistrationList';
import EventListPage from './pages/EventList';
import AdminPage from './pages/Admin';
import TrainerEventManagerPage from './pages/TrainerEventManager';
import SailorEventListPage from './pages/SailorEventList';

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
          Lade Eventanmeldung...
        </p>
      </div>
    </div>
  );
}

// Main App Content
function EventanmeldungContent({ onBackToDashboard }) {
  const { isTrainer, isAdmin } = useAuth();
  // Default page based on role
  const defaultPage = isTrainer || isAdmin ? 'trainer' : 'sailor-events';
  const [currentPage, setCurrentPage] = useState(defaultPage);
  const { isDark } = useTheme();

  const renderPage = () => {
    switch (currentPage) {
      // New Trainer-Event System
      case 'trainer':
        return <TrainerEventManagerPage setCurrentPage={setCurrentPage} />;
      case 'sailor-events':
        return <SailorEventListPage setCurrentPage={setCurrentPage} />;
      // Legacy pages (kept for backwards compatibility)
      case 'register':
        return <RegistrationFormPage setCurrentPage={setCurrentPage} />;
      case 'events':
        return <EventListPage setCurrentPage={setCurrentPage} />;
      case 'list':
        return <RegistrationListPage setCurrentPage={setCurrentPage} />;
      case 'admin':
        return <AdminPage setCurrentPage={setCurrentPage} />;
      default:
        return isTrainer || isAdmin
          ? <TrainerEventManagerPage setCurrentPage={setCurrentPage} />
          : <SailorEventListPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      <Navigation
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onBackToDashboard={onBackToDashboard}
      />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {renderPage()}
      </main>
      <FeedbackWidget appName="Eventanmeldung" />
      <DonateButton />
    </div>
  );
}

// Root Component with DataProvider
export default function Eventanmeldung({ onBackToDashboard }) {
  return (
    <ToastProvider>
      <DataProvider>
        <EventanmeldungContent onBackToDashboard={onBackToDashboard} />
      </DataProvider>
    </ToastProvider>
  );
}
