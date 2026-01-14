import { useState, useEffect } from 'react';
import { useTheme, GlassCard, Icons, IconBadge } from '@tsc/ui';
import { useData } from '../context/DataContext';

export function RankingsPage() {
  const { isDark } = useTheme();
  const { selectedYear, setSelectedYear, getAvailableYears, calculateYearlyStats } = useData();

  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('event_count');

  const years = getAvailableYears();

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      const data = await calculateYearlyStats(selectedYear);
      setStats(data);
      setLoading(false);
    };
    loadStats();
  }, [selectedYear]);

  const sortedStats = [...stats].sort((a, b) => {
    switch (sortBy) {
      case 'event_count':
        return b.event_count - a.event_count;
      case 'regatta_count':
        return b.regatta_count - a.regatta_count;
      case 'total_distance_km':
        return b.total_distance_km - a.total_distance_km;
      case 'championships_attended':
        return b.championships_attended - a.championships_attended;
      default:
        return 0;
    }
  });

  const getMedalColor = (index) => {
    if (index === 0) return 'gold';
    if (index === 1) return 'slate';
    if (index === 2) return 'amber';
    return 'blue';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Rangliste {selectedYear}
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            {stats.length} Segler:innen mit Teilnahmen
          </p>
        </div>

        <div className="flex gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-3 py-2 rounded-lg border text-sm ${
              isDark
                ? 'bg-navy-800 border-navy-700 text-cream'
                : 'bg-white border-light-border text-light-text'
            }`}
          >
            <option value="event_count">Nach Teilnahmen</option>
            <option value="regatta_count">Nach Regatten</option>
            <option value="total_distance_km">Nach Distanz</option>
            <option value="championships_attended">Nach Meisterschaften</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className={`px-3 py-2 rounded-lg border text-sm ${
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
      </div>

      {loading ? (
        <GlassCard className="text-center py-12">
          <div className={`animate-spin w-8 h-8 mx-auto mb-4 border-2 border-t-transparent rounded-full ${
            isDark ? 'border-amber-400' : 'border-amber-500'
          }`} />
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Statistiken werden berechnet...
          </p>
        </GlassCard>
      ) : sortedStats.length > 0 ? (
        <div className="space-y-3">
          {sortedStats.map((sailor, index) => (
            <GlassCard key={sailor.sailor_id}>
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                  index < 3
                    ? index === 0
                      ? 'bg-amber-400/20 text-amber-400'
                      : index === 1
                        ? 'bg-slate-400/20 text-slate-400'
                        : 'bg-orange-400/20 text-orange-400'
                    : isDark
                      ? 'bg-navy-700 text-cream/60'
                      : 'bg-light-border text-light-muted'
                }`}>
                  {index + 1}
                </div>

                {/* Sailor Info */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                    {sailor.first_name} {sailor.last_name}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {sailor.boat_classes.map(bc => (
                      <span
                        key={bc}
                        className={`text-xs px-2 py-0.5 rounded ${
                          isDark ? 'bg-navy-700 text-cream/60' : 'bg-light-border text-light-muted'
                        }`}
                      >
                        {bc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-center">
                  <div>
                    <div className={`text-xl font-bold ${
                      sortBy === 'event_count'
                        ? isDark ? 'text-amber-400' : 'text-amber-600'
                        : isDark ? 'text-cream' : 'text-light-text'
                    }`}>
                      {sailor.event_count}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                      Events
                    </div>
                  </div>

                  <div>
                    <div className={`text-xl font-bold ${
                      sortBy === 'regatta_count'
                        ? isDark ? 'text-amber-400' : 'text-amber-600'
                        : isDark ? 'text-cream' : 'text-light-text'
                    }`}>
                      {sailor.regatta_count}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                      Regatten
                    </div>
                  </div>

                  <div>
                    <div className={`text-xl font-bold ${
                      sortBy === 'total_distance_km'
                        ? isDark ? 'text-amber-400' : 'text-amber-600'
                        : isDark ? 'text-cream' : 'text-light-text'
                    }`}>
                      {sailor.total_distance_km > 0 ? sailor.total_distance_km.toLocaleString('de-DE') : '-'}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                      km
                    </div>
                  </div>

                  <div>
                    <div className={`text-xl font-bold ${
                      sortBy === 'championships_attended'
                        ? isDark ? 'text-amber-400' : 'text-amber-600'
                        : isDark ? 'text-cream' : 'text-light-text'
                    }`}>
                      {sailor.championships_attended}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                      Meistersch.
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="text-center py-12">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
            isDark ? 'bg-amber-400/10 text-amber-400' : 'bg-amber-100 text-amber-500'
          }`}>
            {Icons.trophy}
          </div>
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Keine Daten
          </h3>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Für das Jahr {selectedYear} liegen keine Teilnahmen vor.
          </p>
        </GlassCard>
      )}

      {/* Legend */}
      <GlassCard>
        <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
          Info zur Distanz-Berechnung
        </h3>
        <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
          Die Distanz wird anhand der Luftlinie vom Tegeler Segel-Club zu den Veranstaltungsorten berechnet
          (Hin- und Rückweg). Grundlage sind die Geo-Koordinaten der bekannten Segelorte.
        </p>
      </GlassCard>
    </div>
  );
}

export default RankingsPage;
