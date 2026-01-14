import { useEffect } from 'react';
import { useTheme, GlassCard, Icons } from '@tsc/ui';
import { useData } from '../context/DataContext';

const CATEGORY_INFO = {
  most_events: {
    title: 'Meiste Veranstaltungen',
    description: 'Auszeichnung für die meisten Teilnahmen an Trainings, Regatten und Trainingslagern',
    icon: Icons.calendar,
    color: 'blue',
  },
  most_distance: {
    title: 'Weiteste Strecke',
    description: 'Auszeichnung für die größte Gesamtdistanz zu allen Veranstaltungen',
    icon: Icons.mapPin,
    color: 'emerald',
  },
  most_regattas: {
    title: 'Regatta-König:in',
    description: 'Auszeichnung für die meisten Regatta-Teilnahmen',
    icon: Icons.trophy,
    color: 'gold',
  },
  most_championships: {
    title: 'Meisterschafts-Teilnehmer:in',
    description: 'Auszeichnung für die meisten Teilnahmen an Landes- und Deutschen Meisterschaften',
    icon: Icons.medal,
    color: 'purple',
  },
};

export function AwardsPage() {
  const { isDark } = useTheme();
  const { selectedYear, setSelectedYear, getAvailableYears, getAwards, calculateAwards } = useData();

  const years = getAvailableYears();
  const awards = getAwards(selectedYear);

  useEffect(() => {
    calculateAwards(selectedYear);
  }, [selectedYear]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Auszeichnungen {selectedYear}
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Die besten Segler:innen des Jahres
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

      {/* Awards Grid */}
      {awards.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {awards.map(award => {
            const info = CATEGORY_INFO[award.category];
            if (!info) return null;

            return (
              <GlassCard key={award.id} shimmer className="relative overflow-hidden">
                {/* Trophy Background */}
                <div className={`absolute -right-4 -top-4 w-32 h-32 rounded-full opacity-10 ${
                  isDark ? 'bg-amber-400' : 'bg-amber-500'
                }`} />

                <div className="relative">
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      info.color === 'gold'
                        ? isDark ? 'bg-amber-400/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                        : info.color === 'blue'
                          ? isDark ? 'bg-blue-400/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                          : info.color === 'emerald'
                            ? isDark ? 'bg-emerald-400/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                            : isDark ? 'bg-purple-400/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                    }`}>
                      <span className="w-6 h-6">{info.icon}</span>
                    </div>
                    <div>
                      <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                        {info.title}
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                        {info.description}
                      </p>
                    </div>
                  </div>

                  {/* Winner */}
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-navy-800' : 'bg-light-border/50'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold ${
                        isDark ? 'bg-amber-400/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {Icons.medal}
                      </div>
                      <div>
                        <h4 className={`text-xl font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                          {award.sailor_first_name} {award.sailor_last_name}
                        </h4>
                        <p className={`text-lg font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          {award.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <GlassCard className="text-center py-12">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
            isDark ? 'bg-amber-400/10 text-amber-400' : 'bg-amber-100 text-amber-500'
          }`}>
            <span className="w-10 h-10">{Icons.medal}</span>
          </div>
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Keine Auszeichnungen
          </h3>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Für das Jahr {selectedYear} wurden noch keine Auszeichnungen vergeben.
          </p>
        </GlassCard>
      )}

      {/* Info Section */}
      <GlassCard>
        <h3 className={`font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Über die Jahresauszeichnungen
        </h3>
        <div className={`space-y-4 text-sm ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
          <p>
            Die Jahresauszeichnungen werden automatisch anhand der erfassten Teilnahmen berechnet.
            Berücksichtigt werden alle Regatten, Trainingslager und Trainings, für die eine Anmeldung
            über das TSC-Jugendportal vorliegt.
          </p>
          <p>
            Die <strong>Distanzberechnung</strong> erfolgt anhand der Luftlinie vom Tegeler Segel-Club
            zum jeweiligen Veranstaltungsort (Hin- und Rückweg). Die Koordinaten werden über
            OpenStreetMap/Nominatim ermittelt.
          </p>
          <p>
            Die Auszeichnungen werden am Ende jeder Saison auf der Jahresabschlussfeier verliehen.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

export default AwardsPage;
