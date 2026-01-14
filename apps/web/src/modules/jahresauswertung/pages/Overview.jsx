import { useState, useEffect } from 'react';
import { useTheme, GlassCard, Button, Icons, IconBadge } from '@tsc/ui';
import { useData } from '../context/DataContext';

export function OverviewPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { selectedYear, setSelectedYear, getAvailableYears, getYearlySummary, getAwards, calculateAwards } = useData();

  const years = getAvailableYears();
  const summary = getYearlySummary(selectedYear);
  const awards = getAwards(selectedYear);

  useEffect(() => {
    calculateAwards(selectedYear);
  }, [selectedYear]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Jahresauswertung {selectedYear}
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Statistiken und Auswertungen der TSC-Jugend
          </p>
        </div>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className={`px-4 py-2 rounded-xl border text-lg font-medium ${
            isDark
              ? 'bg-navy-800 border-navy-700 text-cream'
              : 'bg-white border-light-border text-light-text'
          }`}
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <GlassCard className="text-center">
          <div className={`text-3xl font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
            {summary.uniqueSailors}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Aktive Segler:innen
          </div>
        </GlassCard>

        <GlassCard className="text-center">
          <div className="text-3xl font-bold text-amber-400">
            {summary.totalEvents}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Teilnahmen gesamt
          </div>
        </GlassCard>

        <GlassCard className="text-center">
          <div className="text-3xl font-bold text-blue-400">
            {summary.regattas}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Regatta-Teilnahmen
          </div>
        </GlassCard>

        <GlassCard className="text-center">
          <div className="text-3xl font-bold text-emerald-400">
            {summary.championships}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Meisterschaften
          </div>
        </GlassCard>

        <GlassCard className="text-center">
          <div className={`text-3xl font-bold ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
            {summary.uniqueLocations}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Verschiedene Orte
          </div>
        </GlassCard>
      </div>

      {/* Awards Preview */}
      {awards.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Auszeichnungen {selectedYear}
            </h2>
            <Button variant="secondary" size="sm" onClick={() => setCurrentPage('awards')}>
              Alle ansehen
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {awards.slice(0, 4).map(award => (
              <GlassCard key={award.id} shimmer>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    isDark ? 'bg-amber-400/20' : 'bg-amber-100'
                  }`}>
                    <span className={`w-8 h-8 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      {Icons.medal}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                      {award.sailor_first_name} {award.sailor_last_name}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                      {award.category === 'most_events' && 'Meiste Veranstaltungen'}
                      {award.category === 'most_distance' && 'Weiteste Strecke'}
                      {award.category === 'most_regattas' && 'Regatta-König:in'}
                      {award.category === 'most_championships' && 'Meisterschafts-Teilnehmer:in'}
                    </p>
                    <p className={`text-xs font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      {award.description}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <GlassCard
          hoverLift
          className="cursor-pointer"
          onClick={() => setCurrentPage('rankings')}
        >
          <div className="flex items-center gap-4">
            <IconBadge icon={Icons.trophy} color="gold" size="lg" />
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Rangliste
              </h3>
              <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Detaillierte Statistiken aller Segler:innen
              </p>
            </div>
            <div className={`ml-auto ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
              {Icons.chevronRight}
            </div>
          </div>
        </GlassCard>

        <GlassCard
          hoverLift
          className="cursor-pointer"
          onClick={() => setCurrentPage('awards')}
        >
          <div className="flex items-center gap-4">
            <IconBadge icon={Icons.medal} color="amber" size="lg" />
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Auszeichnungen
              </h3>
              <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Jahressieger:innen in verschiedenen Kategorien
              </p>
            </div>
            <div className={`ml-auto ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
              {Icons.chevronRight}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default OverviewPage;
