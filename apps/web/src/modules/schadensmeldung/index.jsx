import { useState } from 'react';
import { useTheme, FeedbackWidget, DonateButton } from '@tsc/ui';
import { DataProvider } from './context/DataContext';
import { Navigation } from './components/Navigation';
import { ReportFormPage, ReportListPage, AdminPage, EquipmentPage } from './pages';

// Loading Spinner Component
function LoadingScreen() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      <div className="text-center">
        <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${
          isDark ? 'border-coral' : 'border-red-500'
        }`} />
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Lade Schadensmeldung...
        </p>
      </div>
    </div>
  );
}

// Main App Content
function SchadensmeldungContent({ onBackToDashboard }) {
  const [currentPage, setCurrentPage] = useState('report');
  const { isDark } = useTheme();

  const renderPage = () => {
    switch (currentPage) {
      case 'report':
        return <ReportFormPage setCurrentPage={setCurrentPage} />;
      case 'list':
        return <ReportListPage setCurrentPage={setCurrentPage} />;
      case 'admin':
        return <AdminPage setCurrentPage={setCurrentPage} />;
      case 'equipment':
        return <EquipmentPage setCurrentPage={setCurrentPage} />;
      default:
        return <ReportFormPage setCurrentPage={setCurrentPage} />;
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
      <FeedbackWidget appName="Schadensmeldung" />
      <DonateButton />
    </div>
  );
}

// Root Component with DataProvider
export default function Schadensmeldung({ onBackToDashboard }) {
  return (
    <DataProvider>
      <SchadensmeldungContent onBackToDashboard={onBackToDashboard} />
    </DataProvider>
  );
}
