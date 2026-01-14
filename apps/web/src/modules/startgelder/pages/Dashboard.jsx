import { useTheme, GlassCard, Button, IconBadge, Icons } from '@tsc/ui';
import { useData } from '../context/DataContext';

export function DashboardPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { regatten, stats, boatData, currentSeason } = useData();

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className={`relative rounded-2xl p-6 md:p-8 overflow-hidden shimmer gradient-flow ${
        isDark
          ? 'bg-gradient-to-br from-navy-800 via-navy-900 to-navy-800 border border-gold-400/20'
          : 'bg-gradient-to-br from-teal-500 via-teal-600 to-teal-500'
      }`}>
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            {/* Season Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm mb-4 ${
              isDark ? 'bg-gold-400/20 text-gold-400' : 'bg-white/20 text-white'
            }`}>
              {Icons.calendar}
              <span>Saison {currentSeason} aktiv</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              <span className="text-shimmer">Deine Regatta-Übersicht</span>
            </h2>
            <p className={`mb-6 ${isDark ? 'text-cream/70' : 'text-white/80'}`}>
              Verwalte deine Startgeld-Erstattungen einfach und übersichtlich.
            </p>

            {/* Stats inline */}
            <div className="flex flex-wrap gap-6 md:gap-10">
              <div>
                <div className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-gold-400' : 'text-white'}`}>
                  {stats.totalRegatten}
                </div>
                <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-white/70'}`}>Regatten</div>
              </div>
              <div>
                <div className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-gold-400' : 'text-white'}`}>
                  {stats.totalAmount.toFixed(2)} €
                </div>
                <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-white/70'}`}>Erstattung</div>
              </div>
              <div>
                <div className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-gold-400' : 'text-white'}`}>
                  {stats.bestPlacement ? `${stats.bestPlacement}.` : '-'}
                </div>
                <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-white/70'}`}>Beste Platz.</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 lg:min-w-[200px]">
            <Button
              onClick={() => setCurrentPage('add')}
              className={`${isDark ? 'bg-gold-400 text-navy-900 hover:bg-gold-300' : 'bg-white text-teal-600 hover:bg-gray-100'}`}
              icon={Icons.plus}
            >
              Regatta hinzufügen
            </Button>
            <Button
              onClick={() => setCurrentPage('export')}
              variant="secondary"
              className={`${isDark ? 'bg-navy-700 text-cream border-gold-400/20' : 'bg-teal-700 text-white'}`}
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
              <h2 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Deine Regatten
              </h2>
            </div>

            {regatten.length > 0 ? (
              <div className="space-y-2">
                {regatten
                  .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
                  .map(r => (
                    <div
                      key={r.id}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                        isDark ? 'hover:bg-navy-800/50' : 'hover:bg-light-border/50'
                      }`}
                    >
                      {/* Platzierung Badge */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                        isDark ? 'bg-gold-400/20 text-gold-400' : 'bg-teal-500/20 text-teal-600'
                      }`}>
                        {r.placement || '-'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${isDark ? 'text-cream' : 'text-light-text'}`}>
                          {r.regattaName}
                        </div>
                        <div className={`text-sm flex items-center gap-3 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                          <span className="flex items-center gap-1">{Icons.calendar} {r.date || '-'}</span>
                          <span>{r.raceCount || 0} WF</span>
                          <span>{r.totalParticipants || '-'} Starter</span>
                        </div>
                      </div>

                      {/* Betrag */}
                      <div className={`text-lg font-bold ${isDark ? 'text-sea-300' : 'text-teal-600'}`}>
                        {(r.invoiceAmount || 0).toFixed(2)} €
                      </div>

                      {/* Arrow */}
                      <div className={isDark ? 'text-cream/30' : 'text-light-muted'}>
                        {Icons.chevronRight}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                  isDark ? 'bg-gold-400/10 text-gold-400' : 'bg-teal-500/10 text-teal-500'
                }`}>
                  {Icons.boat}
                </div>
                <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  Noch keine Regatten
                </h3>
                <p className={`mb-4 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                  Füge deine erste Regatta hinzu.
                </p>
                <Button onClick={() => setCurrentPage('add')}>
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
              <IconBadge icon={Icons.users} color="gold" />
              <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Segler-Profil
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={isDark ? 'text-cream/60' : 'text-light-muted'}>Segler:in</span>
                <span className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  {boatData.seglername || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-cream/60' : 'text-light-muted'}>Segelnummer</span>
                <span className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  {boatData.segelnummer || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-cream/60' : 'text-light-muted'}>Bootsklasse</span>
                <span className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  {boatData.bootsklasse || '-'}
                </span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full mt-4"
              onClick={() => setCurrentPage('settings')}
            >
              Profil bearbeiten
            </Button>
          </GlassCard>

          {/* Stats Card */}
          <GlassCard>
            <h3 className={`font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Saison-Statistik
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={isDark ? 'text-cream/60' : 'text-light-muted'}>Wettfahrten</span>
                <span className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  {stats.totalRaces}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-cream/60' : 'text-light-muted'}>Ø Platzierung</span>
                <span className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  {stats.avgPlacement ? `${stats.avgPlacement}.` : '-'}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
