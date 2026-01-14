import { useState } from 'react';
import { useTheme, FeedbackWidget } from '@tsc/ui';
import { DataProvider } from './context/DataContext';
import { Navigation } from './components/Navigation';
import DonateFormPage from './pages/DonateForm';
import CampaignsPage from './pages/Campaigns';
import ThankYouPage from './pages/ThankYou';
import AdminPage from './pages/Admin';

// Loading Spinner Component
function LoadingScreen() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      <div className="text-center">
        <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${
          isDark ? 'border-rose-400' : 'border-rose-500'
        }`} />
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Lade Spendenportal...
        </p>
      </div>
    </div>
  );
}

// Main App Content
function SpendenportalContent({ onBackToDashboard }) {
  const [currentPage, setCurrentPage] = useState('donate');
  const { isDark } = useTheme();

  const renderPage = () => {
    switch (currentPage) {
      case 'donate':
        return <DonateFormPage setCurrentPage={setCurrentPage} />;
      case 'campaigns':
        return <CampaignsPage setCurrentPage={setCurrentPage} />;
      case 'thankyou':
        return <ThankYouPage setCurrentPage={setCurrentPage} />;
      case 'admin':
        return <AdminPage setCurrentPage={setCurrentPage} />;
      default:
        return <DonateFormPage setCurrentPage={setCurrentPage} />;
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
      <FeedbackWidget appName="Spendenportal" />
    </div>
  );
}

// Root Component with DataProvider
export default function Spendenportal({ onBackToDashboard }) {
  return (
    <DataProvider>
      <SpendenportalContent onBackToDashboard={onBackToDashboard} />
    </DataProvider>
  );
}
