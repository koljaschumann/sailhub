import { useTheme, GlassCard, Button, Icons } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';

export function AdminPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { isAdmin, isTrainer, userRole } = useAuth();

  // Access control: Only admin can access this page
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <GlassCard className="text-center py-12">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isDark ? 'bg-red-500/20' : 'bg-red-100'
          }`}>
            <span className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {Icons.warning}
            </span>
          </div>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Kein Zugang
          </h2>
          <p className={`mb-4 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Der Verwaltungsbereich ist nur für Administratoren zugänglich.
          </p>
          <p className={`text-sm mb-6 ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
            Deine aktuelle Rolle: <span className="font-medium">{userRole || 'Nicht erkannt'}</span>
          </p>
          <Button onClick={() => setCurrentPage('overview')} icon={Icons.arrowLeft}>
            Zurück zur Übersicht
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Verwaltung
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Jahresauswertung verwalten
        </p>
      </div>

      <GlassCard>
        <div className="text-center py-8">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isDark ? 'bg-amber-500/20' : 'bg-amber-100'
          }`}>
            <span className={`w-8 h-8 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              {Icons.settings}
            </span>
          </div>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Verwaltungsbereich
          </h2>
          <p className={`mb-4 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Hier kannst du Jahresauswertungen und Auszeichnungen verwalten.
          </p>
          <p className={`text-sm ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
            Diese Funktion wird in Kürze verfügbar sein.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

export default AdminPage;
