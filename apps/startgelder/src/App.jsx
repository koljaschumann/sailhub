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
    <nav className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
      isDark
        ? 'bg-navy-900/95 border-mint-400/20'
        : 'bg-white/95 border-navy-900/10'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <a
              href={getAuthUrl(getCentralDashboardUrl())}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isDark
                  ? 'text-cream/50 hover:text-mint-400 hover:bg-mint-400/10'
                  : 'text-light-muted hover:text-mint-600 hover:bg-mint-100'
              }`}
              title="Zum Hauptportal"
            >
              <span className="w-5 h-5">{Icons.home}</span>
            </a>
            <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/')}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all group-hover:scale-105 ${
                isDark
                  ? 'bg-mint-400 text-navy-900 border-navy-900'
                  : 'bg-mint-400 text-navy-900 border-navy-900'
              }`}>
                <span className="w-5 h-5">{Icons.boat}</span>
              </div>
              <div className="hidden sm:block">
                <h1 className={`font-display font-bold tracking-tight ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                  SailHub
                </h1>
                <div className={`text-xs font-medium ${isDark ? 'text-mint-400' : 'text-mint-600'}`}>
                  Startgelder
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className={`hidden md:flex items-center gap-1 p-1.5 rounded-full border ${
            isDark
              ? 'bg-navy-800/60 border-mint-400/10'
              : 'bg-sage/50 border-navy-900/10'
          }`}>
            {tabs.map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) => `
                  px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2
                  ${isActive
                    ? isDark
                      ? 'bg-mint-400 text-navy-900 shadow-sm'
                      : 'bg-white text-navy-900 shadow-sailhub border border-navy-900/10'
                    : isDark
                      ? 'text-cream/60 hover:text-mint-400 hover:bg-mint-400/10'
                      : 'text-light-muted hover:text-mint-600 hover:bg-mint-100/50'
                  }
                `}
              >
                <span className="w-4 h-4">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isDark
                      ? 'bg-navy-900 text-mint-400'
                      : 'bg-mint-400 text-navy-900 border border-navy-900'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isDark
                  ? 'text-cream/50 hover:text-mint-400 hover:bg-mint-400/10'
                  : 'text-light-muted hover:text-mint-600 hover:bg-mint-100'
              }`}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? Icons.sun : Icons.moon}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition-all border ${
                isDark
                  ? 'bg-navy-800 hover:bg-navy-700 border-mint-400/20 hover:border-mint-400/40'
                  : 'bg-white hover:bg-sage border-navy-900/10 hover:border-mint-500/30 shadow-sm'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                isDark
                  ? 'bg-mint-400 text-navy-900 border-navy-900'
                  : 'bg-mint-400 text-navy-900 border-navy-900'
              }`}>
                {boatData.seglername
                  ? boatData.seglername.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'XX'}
              </div>
              <span className={`hidden sm:inline text-sm font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                {boatData.seglername || 'Profil'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className={`md:hidden border-t ${isDark ? 'border-navy-700' : 'border-navy-900/10'}`}>
        <div className="flex">
          {tabs.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) => `
                flex-1 py-3 flex flex-col items-center gap-1 text-xs font-medium transition-all
                ${isActive
                  ? isDark ? 'text-mint-400' : 'text-mint-600'
                  : isDark ? 'text-cream/50 hover:text-cream' : 'text-light-muted hover:text-navy-900'
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
          <Route path="/" element={<DashboardPage />} />
          <Route path="/add" element={<AddRegattaPage />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
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
