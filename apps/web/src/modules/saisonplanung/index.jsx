import { useState } from 'react';
import { useTheme, FeedbackWidget, DonateButton } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { DataProvider, useData } from './context/DataContext';
import { Navigation } from './components/Navigation';
import { DashboardPage } from './pages/Dashboard';
import { EventsPage } from './pages/Events';
import { OverviewPage } from './pages/Overview';
import { BoatsPage } from './pages/Boats';
import { AdminPage } from './pages/Admin';

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

// Main App Content
function SaisonplanungContent({ onBackToDashboard }) {
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
      <Navigation
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onBackToDashboard={onBackToDashboard}
      />
      {renderPage()}
      <FeedbackWidget appName="Saisonplanung" />
      <DonateButton />
    </div>
  );
}

// Root Component with DataProvider
export default function Saisonplanung({ onBackToDashboard }) {
  return (
    <DataProvider>
      <SaisonplanungContent onBackToDashboard={onBackToDashboard} />
    </DataProvider>
  );
}
