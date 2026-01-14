import { useNavigate } from 'react-router-dom';
import { useTheme, GlassCard, Button, IconBadge, Icons } from '@tsc/ui';
import { useData } from '../context/DataContext';

export function DashboardPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { regatten, stats, boatData, currentSeason } = useData();

  return (
    <div className="space-y-6">
      {/* Hero Card - SailHub Style with Rich Decorations */}
      <div className={`relative rounded-3xl p-6 md:p-8 overflow-hidden border-2 ${
        isDark
          ? 'bg-gradient-to-br from-navy-800 via-navy-850 to-navy-900 border-mint-400/30'
          : 'bg-gradient-to-br from-mint-400 via-mint-400 to-mint-500 border-navy-900'
      }`}>
        {/* Noise texture overlay for depth */}
        <div className="noise-texture absolute inset-0 pointer-events-none" />

        {/* Decorative dots pattern - top right */}
        <div className="dots-pattern absolute top-0 right-0 w-32 h-32 pointer-events-none" />

        {/* Decorative dots pattern - bottom left */}
        <div className="dots-pattern-bottom-left absolute bottom-0 left-0 w-24 h-24 pointer-events-none" />

        {/* Corner accent bars */}
        <div className="corner-accent absolute top-4 left-4" />

        {/* Geometric ring decoration */}
        <div className={`geometric-ring absolute -bottom-16 -right-16 w-48 h-48 rounded-full pointer-events-none ${
          isDark ? 'border-mint-400' : 'border-navy-900'
        }`} />

        {/* Diamond shape accent */}
        <div className={`diamond-shape absolute top-1/2 right-8 -translate-y-1/2 pointer-events-none ${
          isDark ? 'bg-mint-400/10' : 'bg-navy-900/10'
        }`} />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            {/* Season Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-4 border ${
              isDark
                ? 'bg-mint-400/15 text-mint-400 border-mint-400/30'
                : 'bg-white/20 text-navy-900 border-navy-900/20'
            }`}>
              <span className="w-4 h-4">{Icons.calendar}</span>
              <span>Saison {currentSeason} aktiv</span>
            </div>

            <h2 className={`text-2xl md:text-3xl font-display font-bold mb-2 ${
              isDark ? 'text-cream' : 'text-navy-900'
            }`}>
              Deine Regatta-Übersicht
            </h2>
            <p className={`mb-6 ${isDark ? 'text-cream/70' : 'text-navy-900/70'}`}>
              Verwalte deine Startgeld-Erstattungen einfach und übersichtlich.
            </p>

            {/* Stats inline */}
            <div className="flex flex-wrap gap-6 md:gap-10">
              <div>
                <div className={`text-3xl md:text-4xl font-bold ${
                  isDark ? 'text-mint-400' : 'text-navy-900'
                }`}>
                  {stats.totalRegatten}
                </div>
                <div className={`text-sm font-medium ${isDark ? 'text-cream/60' : 'text-navy-900/60'}`}>Regatten</div>
              </div>
              <div>
                <div className={`text-3xl md:text-4xl font-bold ${
                  isDark ? 'text-mint-400' : 'text-navy-900'
                }`}>
                  {stats.totalAmount.toFixed(2)} €
                </div>
                <div className={`text-sm font-medium ${isDark ? 'text-cream/60' : 'text-navy-900/60'}`}>Erstattung</div>
              </div>
              <div>
                <div className={`text-3xl md:text-4xl font-bold ${
                  isDark ? 'text-mint-400' : 'text-navy-900'
                }`}>
                  {stats.bestPlacement ? `${stats.bestPlacement}.` : '-'}
                </div>
                <div className={`text-sm font-medium ${isDark ? 'text-cream/60' : 'text-navy-900/60'}`}>Beste Platz.</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 lg:min-w-[220px]">
            <Button
              onClick={() => navigate('/add')}
              variant={isDark ? 'primary' : 'white'}
              icon={Icons.plus}
            >
              Regatta hinzufügen
            </Button>
            <Button
              onClick={() => navigate('/export')}
              variant={isDark ? 'outline' : 'dark'}
              icon={Icons.send}
            >
              Antrag senden
            </Button>
          </div>
        </div>
      </div>

      {/* 2-Spalten Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regatten Liste (2/3) */}
        <div className="lg:col-span-2">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-display font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                Deine Regatten
              </h2>
              {regatten.length > 0 && (
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                  isDark
                    ? 'bg-mint-400/15 text-mint-400'
                    : 'bg-mint-100 text-mint-600'
                }`}>
                  {regatten.length} Einträge
                </span>
              )}
            </div>

            {regatten.length > 0 ? (
              <div className="space-y-2">
                {regatten
                  .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
                  .map(r => (
                    <div
                      key={r.id}
                      onClick={() => navigate(`/regatta/${r.id}`)}
                      className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${
                        isDark
                          ? 'hover:bg-mint-400/5 border-transparent hover:border-mint-400/20'
                          : 'hover:bg-mint-100/50 border-transparent hover:border-mint-500/20'
                      }`}
                    >
                      {/* Platzierung Badge */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 border-2 ${
                        isDark
                          ? 'bg-mint-400/15 text-mint-400 border-mint-400/30'
                          : 'bg-mint-100 text-mint-600 border-mint-500/30'
                      }`}>
                        {r.placement || '-'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold truncate ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                          {r.regattaName}
                        </div>
                        <div className={`text-sm flex items-center gap-3 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                          <span className="flex items-center gap-1">
                            <span className="w-3.5 h-3.5">{Icons.calendar}</span>
                            {r.date || '-'}
                          </span>
                          <span>{r.raceCount || 0} WF</span>
                          <span>{r.totalParticipants || '-'} Starter</span>
                        </div>
                      </div>

                      {/* Betrag */}
                      <div className={`text-lg font-bold ${isDark ? 'text-mint-400' : 'text-mint-600'}`}>
                        {(r.invoiceAmount || 0).toFixed(2)} €
                      </div>

                      {/* Arrow */}
                      <div className={`w-5 h-5 ${isDark ? 'text-cream/30' : 'text-light-muted'}`}>
                        {Icons.chevronRight}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="relative text-center py-12 overflow-hidden">
                {/* Grid pattern background for empty state */}
                <div className="grid-pattern absolute inset-0 pointer-events-none" />

                <div className={`relative w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center border-2 ${
                  isDark
                    ? 'bg-mint-400/15 text-mint-400 border-mint-400/30'
                    : 'bg-mint-100 text-mint-600 border-mint-500/30'
                }`}>
                  {/* Glowing dot accent */}
                  <div className="glow-dot absolute -top-1 -right-1" />
                  <span className="w-8 h-8">{Icons.boat}</span>
                </div>
                <h3 className={`relative text-lg font-display font-semibold mb-2 ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                  Noch keine Regatten
                </h3>
                <p className={`relative mb-6 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                  Füge deine erste Regatta hinzu.
                </p>
                <Button onClick={() => navigate('/add')} icon={Icons.plus}>
                  Regatta hinzufügen
                </Button>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Segler Profil Sidebar (1/3) */}
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center gap-3 mb-4">
              <IconBadge icon={Icons.users} color="mint" variant="soft" />
              <h3 className={`font-display font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                Segler-Profil
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={isDark ? 'text-cream/60' : 'text-light-muted'}>Segler:in</span>
                <span className={`font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                  {boatData.seglername || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isDark ? 'text-cream/60' : 'text-light-muted'}>Segelnummer</span>
                <span className={`font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                  {boatData.segelnummer || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isDark ? 'text-cream/60' : 'text-light-muted'}>Bootsklasse</span>
                <span className={`font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                  {boatData.bootsklasse || '-'}
                </span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full mt-4"
              onClick={() => navigate('/settings')}
            >
              Profil bearbeiten
            </Button>
          </GlassCard>

          {/* Stats Card with decorative elements */}
          <GlassCard className="relative overflow-hidden">
            {/* Subtle dots pattern */}
            <div className="dots-pattern absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-50" />

            <div className="relative flex items-center gap-3 mb-4">
              <IconBadge icon={Icons.chart} color="mint" variant="soft" size="sm" />
              <h3 className={`font-display font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                Saison-Statistik
              </h3>
            </div>
            <div className="relative space-y-3">
              <div className="flex justify-between items-center">
                <span className={isDark ? 'text-cream/60' : 'text-light-muted'}>Wettfahrten</span>
                <span className={`font-bold text-lg ${isDark ? 'text-mint-400' : 'text-mint-600'}`}>
                  {stats.totalRaces}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isDark ? 'text-cream/60' : 'text-light-muted'}>Ø Platzierung</span>
                <span className={`font-bold text-lg ${isDark ? 'text-mint-400' : 'text-mint-600'}`}>
                  {stats.avgPlacement ? `${stats.avgPlacement}.` : '-'}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Quick Actions with shimmer accent */}
          <GlassCard variant="mint" padding="compact" className="relative overflow-hidden">
            {/* Animated shimmer effect */}
            <div className="shimmer absolute inset-0 pointer-events-none" />

            {/* Corner accent bottom right */}
            <div className="corner-accent-br absolute bottom-2 right-2" />

            <div className="relative flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-mint-400 text-navy-900' : 'bg-mint-500 text-white'
              }`}>
                {/* Glowing sparkle */}
                <div className="glow-dot absolute -top-0.5 -right-0.5" />
                <span className="w-5 h-5">{Icons.sparkles}</span>
              </div>
              <div className="flex-1">
                <div className={`font-semibold text-sm ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                  Tipp: Export bereit
                </div>
                <div className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                  {regatten.length} Regatten können exportiert werden
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
