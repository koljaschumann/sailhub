import { useState } from 'react';
import { useTheme, FeedbackWidget, DonateButton } from '@tsc/ui';
import { DataProvider } from './context/DataContext';
import { Navigation } from './components/Navigation';
import OverviewPage from './pages/Overview';
import RankingsPage from './pages/Rankings';
import AwardsPage from './pages/Awards';
import AdminPage from './pages/Admin';

// Loading Spinner Component
function LoadingScreen() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      <div className="text-center">
        <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${
          isDark ? 'border-amber-400' : 'border-amber-500'
        }`} />
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Lade Jahresauswertung...
        </p>
      </div>
    </div>
  );
}

// Main App Content
function JahresauswertungContent({ onBackToDashboard }) {
  const [currentPage, setCurrentPage] = useState('overview');
  const { isDark } = useTheme();

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage setCurrentPage={setCurrentPage} />;
      case 'rankings':
        return <RankingsPage setCurrentPage={setCurrentPage} />;
      case 'awards':
        return <AwardsPage setCurrentPage={setCurrentPage} />;
      case 'admin':
        return <AdminPage setCurrentPage={setCurrentPage} />;
      default:
        return <OverviewPage setCurrentPage={setCurrentPage} />;
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
      <FeedbackWidget appName="Jahresauswertung" />
      <DonateButton />
    </div>
  );
}

// Root Component with DataProvider
export default function Jahresauswertung({ onBackToDashboard }) {
  return (
    <DataProvider>
      <JahresauswertungContent onBackToDashboard={onBackToDashboard} />
    </DataProvider>
  );
}
