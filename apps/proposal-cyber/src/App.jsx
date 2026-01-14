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
    { to: '/', icon: Icons.grid, label: 'MISSION' },
    { to: '/add', icon: Icons.plus, label: 'ADD_TARGET' },
    { to: '/export', icon: Icons.chart, label: 'DATA_EXPORT', badge: regatten.length },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-black/90 border-b border-cyber-neon/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-8 h-8 border border-cyber-neon flex items-center justify-center text-cyber-neon group-hover:bg-cyber-neon group-hover:text-black transition-colors">
              ▷
            </div>
            <span className="font-mono text-xl text-cyber-neon tracking-[0.2em] animate-pulse">SYSTEM_ONLINE</span>
          </div>

          {/* Code Rain Effect Placeholder or similar could go here */}

          {/* Tabs */}
          <div className="flex gap-8">
            {tabs.map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) => `
                   font-mono text-sm tracking-widest py-2 border-b-2 transition-all
                   ${isActive
                    ? 'border-cyber-neon text-cyber-neon shadow-[0_0_10px_#39FF14]'
                    : 'border-transparent text-gray-500 hover:text-cyber-neon/70'
                  }
                 `}
              >
                [{tab.label}]
              </NavLink>
            ))}
          </div>

          {/* Profile */}
          <div className="border border-cyber-neon/30 px-4 py-1 text-cyber-neon/60 font-mono text-xs cursor-pointer hover:border-cyber-neon hover:text-cyber-neon" onClick={() => navigate('/settings')}>
            USER: {boatData.seglername ? boatData.seglername.toUpperCase() : 'UNKNOWN'}
          </div>
        </div>
      </div>
      {/* Progress Line */}
      <div className="h-[2px] w-full bg-cyber-neon/20">
        <div className="h-full bg-cyber-neon w-[30%] animate-gradient-flow"></div>
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{
        backgroundImage: 'linear-gradient(rgba(57, 255, 20, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}></div>

      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="hud-panel p-6 min-h-[700px]">
          <div className="absolute top-0 right-0 p-2 text-cyber-neon/40 text-xs font-mono">SYS.VER.3.0.1</div>
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
