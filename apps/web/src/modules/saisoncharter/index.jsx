import { useState } from 'react';
import { useTheme, FeedbackWidget, DonateButton } from '@tsc/ui';
import { DataProvider } from './context/DataContext';
import { Navigation } from './components/Navigation';
import BookingFormPage from './pages/BookingForm';
import MyBookingsPage from './pages/MyBookings';
import BoatCalendarPage from './pages/BoatCalendar';
import AdminPage from './pages/Admin';

// Loading Spinner Component
function LoadingScreen() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      <div className="text-center">
        <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${
          isDark ? 'border-emerald-400' : 'border-emerald-500'
        }`} />
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Lade Saison-Charter...
        </p>
      </div>
    </div>
  );
}

// Main App Content
function SaisoncharterContent({ onBackToDashboard }) {
  const [currentPage, setCurrentPage] = useState('booking');
  const { isDark } = useTheme();

  const renderPage = () => {
    switch (currentPage) {
      case 'booking':
        return <BookingFormPage setCurrentPage={setCurrentPage} />;
      case 'calendar':
        return <BoatCalendarPage setCurrentPage={setCurrentPage} />;
      case 'mybookings':
        return <MyBookingsPage setCurrentPage={setCurrentPage} />;
      case 'admin':
        return <AdminPage setCurrentPage={setCurrentPage} />;
      default:
        return <BookingFormPage setCurrentPage={setCurrentPage} />;
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
      <FeedbackWidget appName="Saison-Charter" />
      <DonateButton />
    </div>
  );
}

// Root Component with DataProvider
export default function Saisoncharter({ onBackToDashboard }) {
  return (
    <DataProvider>
      <SaisoncharterContent onBackToDashboard={onBackToDashboard} />
    </DataProvider>
  );
}
