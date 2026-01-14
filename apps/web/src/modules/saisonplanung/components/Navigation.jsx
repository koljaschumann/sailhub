import { useState } from 'react';
import { useTheme, IconBadge, Icons } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { boatClasses, getBoatClassName, getBoatClassColor } from '@tsc/data';
import { useData } from '../context/DataContext';

export function Navigation({ currentPage, setCurrentPage, onBackToDashboard }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, profile, signOut, isAdmin, isTrainer } = useAuth();
  const { isDeadlinePassed } = useData();
  const [showBoatClassMenu, setShowBoatClassMenu] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.home },
    { id: 'events', label: 'Veranstaltungen', icon: Icons.calendar },
    { id: 'overview', label: 'Saisonübersicht', icon: Icons.trophy },
    { id: 'boats', label: 'Motorboote', icon: Icons.boat },
  ];

  // Verwaltung nur für Admin
  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Verwaltung', icon: Icons.settings });
  }

  // Aktuelle Bootsklasse des Benutzers (aus Profile)
  const currentBoatClassId = profile?.primary_boat_class;
  const currentBoatClass = boatClasses.find(bc => bc.id === currentBoatClassId);

  return (
    <nav className={`
      sticky top-0 z-40 border-b backdrop-blur-xl
      ${isDark ? 'bg-navy-900/80 border-navy-700' : 'bg-white/80 border-light-border'}
    `}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToDashboard}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                isDark
                  ? 'text-cream/50 hover:text-cream hover:bg-navy-800'
                  : 'text-light-muted hover:text-light-text hover:bg-light-border'
              }`}
              title="Zum Hauptportal"
            >
              <span className="w-5 h-5">{Icons.home}</span>
            </button>
            <div className="flex items-center gap-2">
              <IconBadge icon={Icons.sailboat} color="gold" size="sm" />
              <span className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                TSC Saisonplanung
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all
                  flex items-center gap-2
                  ${currentPage === item.id
                    ? isDark
                      ? 'bg-navy-700 text-cream'
                      : 'bg-white text-light-text shadow-sm'
                    : isDark
                      ? 'text-cream/60 hover:text-cream hover:bg-navy-800/50'
                      : 'text-light-muted hover:text-light-text hover:bg-light-border/50'}
                `}
              >
                <span className="w-4 h-4">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`
                w-9 h-9 rounded-lg flex items-center justify-center
                ${isDark
                  ? 'text-cream/60 hover:text-cream hover:bg-navy-800'
                  : 'text-light-muted hover:text-light-text hover:bg-light-border'}
              `}
            >
              <span className="w-5 h-5">
                {isDark ? Icons.sun : Icons.moon}
              </span>
            </button>

            {/* User Info */}
            <div className="relative">
              <div className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full
                ${isDark ? 'bg-navy-800' : 'bg-light-border/50'}
              `}>
                {currentBoatClass && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentBoatClass.color }}
                  />
                )}
                <span className={`text-sm ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  {profile?.full_name || user?.email?.split('@')[0] || 'Benutzer'}
                </span>
                {isAdmin && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-gold-400/20 text-gold-400' : 'bg-teal-100 text-teal-600'}`}>
                    Admin
                  </span>
                )}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={signOut}
              className={`
                w-9 h-9 rounded-lg flex items-center justify-center
                ${isDark
                  ? 'text-cream/60 hover:text-coral hover:bg-navy-800'
                  : 'text-light-muted hover:text-red-500 hover:bg-light-border'}
              `}
              title="Abmelden"
            >
              <span className="w-5 h-5">{Icons.x}</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                flex items-center gap-1.5
                ${currentPage === item.id
                  ? isDark
                    ? 'bg-navy-700 text-cream'
                    : 'bg-white text-light-text shadow-sm'
                  : isDark
                    ? 'text-cream/60 hover:text-cream'
                    : 'text-light-muted hover:text-light-text'}
              `}
            >
              <span className="w-3.5 h-3.5">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
