import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useTheme, Icons, ToastProvider, FeedbackWidget } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { getCentralDashboardUrl } from '@tsc/config/modules';
import { DataProvider, useData } from './context/DataContext';
import { DashboardPage, SettingsPage, AddRegattaPage, ExportPage } from './pages';

function Navigation() {
  const navigate = useNavigate();
  const { regatten, boatData } = useData();

  const tabs = [
    { to: '/', icon: Icons.grid, label: 'Übersicht' },
    { to: '/add', icon: Icons.plus, label: 'Hinzufügen' },
    { to: '/export', icon: Icons.chart, label: 'Export', badge: regatten.length },
  ];

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-4xl rounded-full glass-panel px-6 py-3 shadow-2xl border border-white/20">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-kinetic-teal to-kinetic-blue shadow-lg shadow-kinetic-teal/50 flex items-center justify-center text-white">
            {Icons.boat}
          </div>
          <span className="font-bold text-lg tracking-wider hidden sm:block">SAILHUB</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => `
                  px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2
                  ${isActive
                  ? 'bg-gradient-to-r from-kinetic-orange to-red-500 text-white shadow-lg scale-105'
                  : 'hover:bg-white/10 text-white/80'
                }
                `}
            >
              {tab.icon}
              <span className="hidden sm:block">{tab.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Profile */}
        <div onClick={() => navigate('/settings')} className="w-10 h-10 rounded-full border-2 border-kinetic-teal p-0.5 cursor-pointer hover:scale-110 transition-transform">
          <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center font-bold text-kinetic-teal text-xs">
            {boatData.seglername ? boatData.seglername.substring(0, 2).toUpperCase() : 'ME'}
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <Navigation />

      <main className="max-w-6xl mx-auto relative z-10">
        <div className="glass-panel rounded-3xl p-8 min-h-[600px] shadow-2xl backdrop-blur-3xl">
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
