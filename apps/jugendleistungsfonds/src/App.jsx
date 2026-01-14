import { Routes, Route, NavLink } from 'react-router-dom';
import { useTheme, Icons, FeedbackWidget } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { getCentralDashboardUrl } from '@tsc/config/modules';
import ApplicationFormPage from './pages/ApplicationForm';
import MyApplicationsPage from './pages/MyApplications';
import AdminPage from './pages/Admin';

function Navigation() {
  const { isDark, toggleTheme } = useTheme();
  const { getAuthUrl } = useAuth();

  const navItems = [
    { path: '/', label: 'Antrag stellen', icon: Icons.plus },
    { path: '/antraege', label: 'Meine Anträge', icon: Icons.list },
    { path: '/admin', label: 'Verwaltung', icon: Icons.settings },
  ];

  return (
    <header className={`border-b ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Home Link */}
            <a
              href={getAuthUrl(getCentralDashboardUrl())}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-cream/60 hover:text-cream hover:bg-navy-800'
                  : 'text-light-muted hover:text-light-text hover:bg-light-border'
              }`}
              title="Zum Hauptportal"
            >
              <span className="w-5 h-5 block">{Icons.home}</span>
            </a>

            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-500/10' : 'bg-purple-100'}`}>
              <span className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                {Icons.euro}
              </span>
            </div>
            <div>
              <h1 className={`font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Jugendleistungsfonds
              </h1>
              <p className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                TSC-Jugendportal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-cream/60 hover:text-cream hover:bg-navy-800'
                  : 'text-light-muted hover:text-light-text hover:bg-light-border'
              }`}
            >
              <span className="w-5 h-5 block">
                {isDark ? Icons.sun : Icons.moon}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="mt-4 -mb-4">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? isDark
                        ? 'bg-navy-800 text-purple-400 border-b-2 border-purple-400'
                        : 'bg-white text-purple-600 border-b-2 border-purple-500'
                      : isDark
                        ? 'text-cream/60 hover:text-cream hover:bg-navy-800/50'
                        : 'text-light-muted hover:text-light-text hover:bg-light-border/50'
                  }`
                }
              >
                <span className="w-4 h-4">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

function AppContent() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Routes>
          <Route path="/" element={<ApplicationFormPage />} />
          <Route path="/antraege" element={<MyApplicationsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      <FeedbackWidget appName="Jugendleistungsfonds" />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
