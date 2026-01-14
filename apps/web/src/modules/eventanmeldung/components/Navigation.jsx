import { useTheme, Icons } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';

export function Navigation({ currentPage, setCurrentPage, onBackToDashboard }) {
  const { isDark, toggleTheme } = useTheme();
  const { isAdmin, isTrainer } = useAuth();

  // Build navigation based on role
  const navItems = [];

  // Trainer/Admin: Show event management
  if (isTrainer || isAdmin) {
    navItems.push({ id: 'trainer', label: 'Meine Events', icon: Icons.calendar });
  }

  // Everyone: Show available events
  navItems.push({ id: 'sailor-events', label: 'Events', icon: Icons.list });

  // Everyone: Show my registrations
  navItems.push({ id: 'list', label: 'Meine Anmeldungen', icon: Icons.checkCircle });

  // Verwaltung nur für Admin
  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Verwaltung', icon: Icons.settings });
  }

  return (
    <header className={`border-b ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'text-cream/60 hover:text-cream hover:bg-navy-800'
                    : 'text-light-muted hover:text-light-text hover:bg-light-border'
                }`}
                title="Zum Hauptportal"
              >
                <span className="w-5 h-5 block">{Icons.home}</span>
              </button>
            )}

            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gold-400/10' : 'bg-teal-100'}`}>
              <span className={`w-6 h-6 ${isDark ? 'text-gold-400' : 'text-teal-600'}`}>
                {Icons.calendar}
              </span>
            </div>
            <div>
              <h1 className={`font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Eventanmeldung
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
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  currentPage === item.id
                    ? isDark
                      ? 'bg-navy-800 text-cream'
                      : 'bg-white text-light-text'
                    : isDark
                      ? 'text-cream/60 hover:text-cream hover:bg-navy-800/50'
                      : 'text-light-muted hover:text-light-text hover:bg-light-border/50'
                }`}
              >
                <span className="w-4 h-4">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
