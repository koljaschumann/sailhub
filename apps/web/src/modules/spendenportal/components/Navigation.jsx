import { useTheme, Icons } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';

export function Navigation({ currentPage, setCurrentPage, onBackToDashboard }) {
  const { isDark, toggleTheme } = useTheme();
  const { isAdmin, isTrainer } = useAuth();

  const navItems = [
    { id: 'donate', label: 'Spenden', icon: Icons.heart },
    { id: 'campaigns', label: 'Kampagnen', icon: Icons.list },
  ];

  // Verwaltung nur für Admin (nicht Trainer)
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

            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-rose-500/10' : 'bg-rose-100'}`}>
              <span className={`w-6 h-6 ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                {Icons.heart}
              </span>
            </div>
            <div>
              <h1 className={`font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Spendenportal
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
                      ? 'bg-navy-800 text-rose-400 border-b-2 border-rose-400'
                      : 'bg-white text-rose-600 border-b-2 border-rose-600'
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
