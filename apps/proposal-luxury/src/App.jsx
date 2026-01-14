import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useTheme, Icons, ToastProvider, FeedbackWidget } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { getCentralDashboardUrl } from '@tsc/config/modules';
import { DataProvider, useData } from './context/DataContext';
import { DashboardPage, SettingsPage, AddRegattaPage, ExportPage } from './pages';

function Navigation() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { getAuthUrl } = useAuth();
  const { regatten, boatData } = useData();

  const tabs = [
    { to: '/', icon: Icons.grid, label: 'Übersicht' },
    { to: '/add', icon: Icons.plus, label: 'Hinzufügen' },
    { to: '/export', icon: Icons.chart, label: 'Export', badge: regatten.length },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-luxury-cream/95 backdrop-blur-md border-b-2 border-luxury-gold shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-12 h-12 rounded-sm bg-luxury-navy flex items-center justify-center text-luxury-gold border border-luxury-gold shadow-lg">
                {Icons.boat}
              </div>
              <div className="hidden sm:block">
                <h1 className="font-serif font-bold text-2xl text-luxury-navy tracking-wide">
                  TSC Startgelder
                </h1>
                <div className="text-xs text-luxury-navy/60 uppercase tracking-widest font-sans">
                  Tegeler Segel-Club e.V.
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:flex items-center gap-6">
            {tabs.map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) => `
                  px-2 py-2 text-sm font-serif font-medium transition-all flex items-center gap-2 border-b-2
                  ${isActive
                    ? 'border-luxury-gold text-luxury-navy'
                    : 'border-transparent text-luxury-navy/60 hover:text-luxury-navy hover:border-luxury-gold/30'
                  }
                `}
              >
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs bg-luxury-navy text-luxury-gold">
                    {tab.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-3 px-4 py-2 rounded-sm border border-luxury-navy/10 hover:border-luxury-gold transition-colors bg-white/50"
            >
              <div className="w-8 h-8 rounded-full bg-luxury-navy text-luxury-gold flex items-center justify-center text-sm font-serif font-bold">
                {boatData.seglername
                  ? boatData.seglername.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'XX'}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-luxury-navy font-serif">
                {boatData.seglername || 'Profil'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-transparent">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="bg-luxury-white/90 backdrop-blur-xl shadow-2xl rounded-sm border border-luxury-gold/20 p-8 min-h-[600px]">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/add" element={<AddRegattaPage />} />
            <Route path="/export" element={<ExportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
      <FeedbackWidget appName="Startgeld-Erstattung" />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ToastProvider>
  );
}
