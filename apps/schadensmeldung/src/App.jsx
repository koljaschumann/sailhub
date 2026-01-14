import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useTheme, Icons, ToastProvider, FeedbackWidget } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { getCentralDashboardUrl } from '@tsc/config/modules';
import { DataProvider } from './context/DataContext';
import { ReportFormPage, ReportListPage, AdminPage, EquipmentPage } from './pages';

function Navigation() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { profile, getAuthUrl } = useAuth();

  // TODO: Remove devMode when Supabase connection is fixed
  const devMode = true;
  const isAdmin = devMode || profile?.role === 'admin';

  const tabs = [
    { to: '/', icon: Icons.plus, label: 'Melden' },
    { to: '/liste', icon: Icons.list, label: 'Übersicht' },
  ];

  if (isAdmin) {
    tabs.push({ to: '/admin', icon: Icons.settings, label: 'Admin' });
  }

  return (
    <nav className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
      isDark
        ? 'bg-navy-900/90 border-gold-400/20'
        : 'bg-white/90 border-light-border'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <a
              href={getAuthUrl(getCentralDashboardUrl())}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                isDark
                  ? 'text-cream/50 hover:text-cream hover:bg-navy-800'
                  : 'text-light-muted hover:text-light-text hover:bg-light-border'
              }`}
              title="Zum Hauptportal"
            >
              <span className="w-5 h-5">{Icons.home}</span>
            </a>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center ${
                isDark
                  ? 'from-coral to-red-600 text-white'
                  : 'from-red-500 to-red-600 text-white'
              }`}>
                {Icons.warning}
              </div>
              <div className="hidden sm:block">
                <h1 className={`font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  Schadensmeldung
                </h1>
                <div className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                  TSC-Jugendportal
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className={`hidden md:flex items-center gap-1 px-2 py-1.5 rounded-full ${
            isDark ? 'bg-navy-800/50' : 'bg-light-border/30'
          }`}>
            {tabs.map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) => `
                  px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2
                  ${isActive
                    ? isDark ? 'bg-navy-700 text-cream' : 'bg-white text-light-text shadow-sm'
                    : isDark ? 'text-cream/60 hover:text-cream' : 'text-light-muted hover:text-light-text'
                  }
                `}
              >
                <span className="w-4 h-4">{tab.icon}</span>
                <span>{tab.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isDark ? 'text-cream/50 hover:text-cream' : 'text-light-muted hover:text-light-text'
              }`}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? Icons.sun : Icons.moon}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className={`md:hidden border-t ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
        <div className="flex">
          {tabs.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) => `
                flex-1 py-3 flex flex-col items-center gap-1 text-xs
                ${isActive
                  ? isDark ? 'text-gold-400' : 'text-teal-600'
                  : isDark ? 'text-cream/50' : 'text-light-muted'
                }
              `}
            >
              <span className="w-5 h-5">{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Routes>
          <Route path="/" element={<ReportFormPage />} />
          <Route path="/liste" element={<ReportListPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/equipment" element={<EquipmentPage />} />
        </Routes>
      </main>
      <FeedbackWidget appName="Schadensmeldung" />
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
