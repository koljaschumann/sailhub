import { useState } from 'react';
import { useTheme, FeedbackWidget, DonateButton } from '@tsc/ui';
import { DataProvider } from './context/DataContext';
import { Navigation } from './components/Navigation';
import ApplicationFormPage from './pages/ApplicationForm';
import MyApplicationsPage from './pages/MyApplications';
import AdminPage from './pages/Admin';

// Loading Spinner Component
function LoadingScreen() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      <div className="text-center">
        <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${
          isDark ? 'border-purple-400' : 'border-purple-500'
        }`} />
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Lade Jugendleistungsfonds...
        </p>
      </div>
    </div>
  );
}

// Main App Content
function JugendleistungsfondsContent({ onBackToDashboard }) {
  const [currentPage, setCurrentPage] = useState('application');
  const { isDark } = useTheme();

  const renderPage = () => {
    switch (currentPage) {
      case 'application':
        return <ApplicationFormPage setCurrentPage={setCurrentPage} />;
      case 'myapplications':
        return <MyApplicationsPage setCurrentPage={setCurrentPage} />;
      case 'admin':
        return <AdminPage setCurrentPage={setCurrentPage} />;
      default:
        return <ApplicationFormPage setCurrentPage={setCurrentPage} />;
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
      <FeedbackWidget appName="Jugendleistungsfonds" />
      <DonateButton />
    </div>
  );
}

// Root Component with DataProvider
export default function Jugendleistungsfonds({ onBackToDashboard }) {
  return (
    <DataProvider>
      <JugendleistungsfondsContent onBackToDashboard={onBackToDashboard} />
    </DataProvider>
  );
}
