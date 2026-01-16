import { useState, useEffect } from 'react';
import { useTheme, GlassCard, Button, Icons } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { useData } from '../context/DataContext';

/**
 * Admin page for Jahresauswertung - Detailed statistics and filters
 */
export function AdminPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { isAdmin, userRole } = useAuth();
  const {
    filterTypes,
    selectedYear,
    setSelectedYear,
    getAvailableYears,
    getYearlySummary,
    getDetailedStats,
    calculateAwards,
    loading,
  } = useData();

  const [activeFilter, setActiveFilter] = useState('most_regattas');
  const [detailedStats, setDetailedStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const availableYears = getAvailableYears();

  // Load stats when year or filter changes
  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const stats = await getDetailedStats(selectedYear);
        setDetailedStats(stats);
        setSummary(getYearlySummary(selectedYear));
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    if (!loading) {
      loadStats();
    }
  }, [selectedYear, loading, getDetailedStats, getYearlySummary]);

  // Access control
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

  // Get current filter data
  const getCurrentFilterData = () => {
    if (!detailedStats) return [];

    switch (activeFilter) {
      case 'most_regattas':
        return detailedStats.topByRegattas || [];
      case 'best_avg_placement':
        return detailedStats.topByAvgPlacement || [];
      case 'furthest_regatta':
        return detailedStats.topByDistance || [];
      case 'youngest_participant':
        return detailedStats.youngestParticipants || [];
      case 'most_races':
        return detailedStats.topByRaceCount || [];
      case 'best_single_placement':
        return detailedStats.bestSinglePlacements || [];
      case 'most_active_boat_class':
        return detailedStats.boatClassStats || [];
      case 'most_championships':
        return detailedStats.topByChampionships || [];
      default:
        return detailedStats.sailors || [];
    }
  };

  const filterData = getCurrentFilterData();
  const currentFilterInfo = filterTypes.find(f => f.id === activeFilter);

  // Handle awards recalculation
  const handleRecalculateAwards = async () => {
    setStatsLoading(true);
    try {
      await calculateAwards(selectedYear);
      const stats = await getDetailedStats(selectedYear);
      setDetailedStats(stats);
    } catch (err) {
      console.error('Error recalculating awards:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Get medal color for ranking
  const getMedalColor = (index) => {
    if (index === 0) return isDark ? 'text-amber-400' : 'text-amber-500';
    if (index === 1) return isDark ? 'text-slate-300' : 'text-slate-400';
    if (index === 2) return isDark ? 'text-orange-400' : 'text-orange-500';
    return isDark ? 'text-cream/40' : 'text-light-muted';
  };

  // Render result item based on filter type
  const renderResultItem = (item, index) => {
    const isBoatClass = activeFilter === 'most_active_boat_class';
    const isSinglePlacement = activeFilter === 'best_single_placement';

    if (isBoatClass) {
      return (
        <div
          key={item.name}
          className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold ${getMedalColor(index)}`}>
                {index + 1}.
              </span>
              <div>
                <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  {item.name}
                </h3>
                <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                  {item.uniqueSailors} Segler · {item.uniqueRegattas} Regatten
                </p>
              </div>
            </div>
            <div className={`text-right ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              <span className="text-2xl font-bold">{item.participations}</span>
              <p className={`text-xs ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>Teilnahmen</p>
            </div>
          </div>
        </div>
      );
    }

    if (isSinglePlacement) {
      return (
        <div
          key={`${item.sailor_id}-${item.regatta_name}`}
          className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold ${getMedalColor(index)}`}>
                {item.placement}.
              </span>
              <div>
                <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  {item.first_name} {item.last_name}
                </h3>
                <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                  {item.regatta_name}
                </p>
              </div>
            </div>
            <div className={`text-right`}>
              <span className={`text-lg font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                {item.placement}/{item.total_participants}
              </span>
              <p className={`text-xs ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
                Platzierung
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Default sailor rendering
    return (
      <div
        key={item.sailor_id || index}
        className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-bold ${getMedalColor(index)}`}>
              {index + 1}.
            </span>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                {item.first_name} {item.last_name}
              </h3>
              <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                {activeFilter === 'youngest_participant' && item.age
                  ? `${item.age} Jahre · ${item.regattaCount} Regatten`
                  : activeFilter === 'best_avg_placement'
                    ? `${item.regattaCount} Regatten · Ø ${(item.avgRelativePlacement * 100).toFixed(0)}% des Feldes`
                    : activeFilter === 'most_races'
                      ? `${item.regattaCount} Regatten`
                      : item.boat_classes?.join(', ') || ''}
              </p>
            </div>
          </div>
          <div className={`text-right ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            <span className="text-2xl font-bold">
              {activeFilter === 'most_regattas'
                ? item.regatta_count
                : activeFilter === 'best_avg_placement'
                  ? item.avgPlacement?.toFixed(1)
                  : activeFilter === 'furthest_regatta'
                    ? item.total_distance_km?.toLocaleString('de-DE')
                    : activeFilter === 'youngest_participant'
                      ? item.age
                      : activeFilter === 'most_races'
                        ? item.totalRaces
                        : activeFilter === 'most_championships'
                          ? item.championships_attended
                          : item.event_count}
            </span>
            <p className={`text-xs ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
              {activeFilter === 'most_regattas'
                ? 'Regatten'
                : activeFilter === 'best_avg_placement'
                  ? 'Ø Platz'
                  : activeFilter === 'furthest_regatta'
                    ? 'km'
                    : activeFilter === 'youngest_participant'
                      ? 'Jahre'
                      : activeFilter === 'most_races'
                        ? 'Wettfahrten'
                        : activeFilter === 'most_championships'
                          ? 'Meistersch.'
                          : 'Events'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Verwaltung
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Detaillierte Statistiken und Auswertungen
          </p>
        </div>

        {/* Year Selector */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className={`px-4 py-2 rounded-lg border ${
            isDark
              ? 'bg-white/5 border-white/10 text-cream'
              : 'bg-white border-slate-200 text-light-text'
          }`}
        >
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="text-center py-4">
            <div className={`text-3xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              {summary.uniqueSailors}
            </div>
            <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Aktive Segler
            </div>
          </GlassCard>

          <GlassCard className="text-center py-4">
            <div className={`text-3xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {summary.regattas}
            </div>
            <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Regatta-Teilnahmen
            </div>
          </GlassCard>

          <GlassCard className="text-center py-4">
            <div className={`text-3xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {summary.totalEvents}
            </div>
            <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Events gesamt
            </div>
          </GlassCard>

          <GlassCard className="text-center py-4">
            <div className={`text-3xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              {summary.championships}
            </div>
            <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Meisterschaften
            </div>
          </GlassCard>
        </div>
      )}

      {/* Filter Selection */}
      <GlassCard>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Auswertung wählen
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {filterTypes.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`p-3 rounded-lg text-left transition-all ${
                activeFilter === filter.id
                  ? isDark
                    ? 'bg-amber-500/20 border-amber-500/50 border'
                    : 'bg-amber-100 border-amber-300 border'
                  : isDark
                    ? 'bg-white/5 hover:bg-white/10 border border-transparent'
                    : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <div className={`text-sm font-medium ${
                activeFilter === filter.id
                  ? isDark ? 'text-amber-400' : 'text-amber-700'
                  : isDark ? 'text-cream' : 'text-light-text'
              }`}>
                {filter.label}
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Results */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
            {currentFilterInfo?.label || 'Ergebnisse'}
          </h2>
          <span className={`text-sm ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
            Top {filterData.length}
          </span>
        </div>

        {statsLoading || loading ? (
          <div className="text-center py-8">
            <div className={`animate-spin w-8 h-8 mx-auto border-2 rounded-full ${
              isDark ? 'border-amber-400 border-t-transparent' : 'border-amber-600 border-t-transparent'
            }`} />
            <p className={`mt-4 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Lade Statistiken...
            </p>
          </div>
        ) : filterData.length === 0 ? (
          <div className="text-center py-8">
            <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
              Keine Daten für diese Auswertung verfügbar.
            </p>
            <p className={`text-sm mt-2 ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
              {activeFilter === 'youngest_participant'
                ? 'Für diese Auswertung werden Geburtsdaten benötigt.'
                : activeFilter === 'best_avg_placement'
                  ? 'Mindestens 3 Regatten mit Platzierung erforderlich.'
                  : 'Starte mit der Erfassung von Regatta-Teilnahmen.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filterData.map((item, index) => renderResultItem(item, index))}
          </div>
        )}
      </GlassCard>

      {/* Actions */}
      <GlassCard>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Aktionen
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleRecalculateAwards}
            disabled={statsLoading}
            icon={Icons.refresh}
          >
            Awards neu berechnen
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // CSV Export
              const csv = filterData.map((item, i) => {
                if (activeFilter === 'most_active_boat_class') {
                  return `${i + 1};${item.name};${item.participations};${item.uniqueSailors}`;
                }
                return `${i + 1};${item.first_name} ${item.last_name};${
                  item.regatta_count || item.totalRaces || item.age || item.championships_attended || ''
                }`;
              }).join('\n');

              const blob = new Blob([`Rang;Name;Wert\n${csv}`], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `jahresauswertung_${selectedYear}_${activeFilter}.csv`;
              a.click();
            }}
            icon={Icons.download}
          >
            Als CSV exportieren
          </Button>
        </div>
      </GlassCard>

      {/* Info Box */}
      <GlassCard className={isDark ? 'bg-blue-500/10' : 'bg-blue-50'}>
        <div className="flex items-start gap-3">
          <span className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {Icons.info}
          </span>
          <div>
            <h3 className={`font-medium mb-1 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
              Hinweise zur Auswertung
            </h3>
            <ul className={`text-sm space-y-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              <li>• <strong>Durchschnittsplatzierung:</strong> Relativ zur Feldgröße (niedriger = besser), min. 3 Regatten</li>
              <li>• <strong>Distanz:</strong> Luftlinie × 2 (Hin- & Rückweg) basierend auf bekannten Segelrevieren</li>
              <li>• <strong>Jüngster Teilnehmer:</strong> Alter am Jahresende, basierend auf erfasstem Geburtsdatum</li>
              <li>• <strong>Meisterschaften:</strong> Automatisch erkannt anhand von Regatta-Namen (DM, EM, WM, Meisterschaft)</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export default AdminPage;
