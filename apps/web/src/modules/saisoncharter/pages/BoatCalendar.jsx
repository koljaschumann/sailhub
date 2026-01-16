import { useState } from 'react';
import { useTheme, GlassCard, Button, Icons, IconBadge } from '@tsc/ui';
import { useData } from '../context/DataContext';

const BOAT_TYPE_LABELS = {
  optimist: 'Optimist',
  ilca4: 'ILCA 4',
  ilca6: 'ILCA 6',
  '420er': '420er',
  '29er': '29er',
  laser: 'Laser',
};

export function BoatCalendarPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { boats, getActiveSeason, getBoatBooking } = useData();

  const [filterType, setFilterType] = useState('');

  const season = getActiveSeason();

  const filteredBoats = boats.filter(boat => {
    if (filterType && boat.boat_type !== filterType) return false;
    return true;
  });

  // Group boats by type
  const boatsByType = filteredBoats.reduce((acc, boat) => {
    if (!acc[boat.boat_type]) {
      acc[boat.boat_type] = [];
    }
    acc[boat.boat_type].push(boat);
    return acc;
  }, {});

  const uniqueTypes = [...new Set(boats.map(b => b.boat_type))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Bootskalender
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Übersicht aller Charterboote für Saison {season?.year || '-'}
          </p>
        </div>
        <Button onClick={() => setCurrentPage('booking')} icon={Icons.plus}>
          Boot buchen
        </Button>
      </div>

      {/* Filter */}
      <GlassCard className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[150px]">
          <label className={`block text-xs mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Bootstyp
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border text-sm ${
              isDark
                ? 'bg-navy-800 border-navy-700 text-cream'
                : 'bg-white border-light-border text-light-text'
            }`}
          >
            <option value="">Alle Typen</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{BOAT_TYPE_LABELS[type] || type}</option>
            ))}
          </select>
        </div>
        <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
          <span className="font-medium">{filteredBoats.length}</span> Boote
        </div>
      </GlassCard>

      {/* Boats by Type */}
      {Object.entries(boatsByType).map(([type, typeBoats]) => (
        <div key={type} className="space-y-3">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
            {BOAT_TYPE_LABELS[type] || type}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {typeBoats.map(boat => {
              const booking = season ? getBoatBooking(boat.id, season.id) : null;
              const isBooked = !!booking;
              const isAvailable = boat.available && !isBooked;

              return (
                <GlassCard
                  key={boat.id}
                  className={`${isAvailable ? 'cursor-pointer hover:scale-[1.02]' : 'opacity-75'}`}
                  onClick={() => isAvailable && setCurrentPage('booking')}
                >
                  <div className="flex items-start gap-3">
                    <IconBadge
                      icon={Icons.sailboat}
                      color={isAvailable ? 'emerald' : isBooked ? 'blue' : 'slate'}
                      size="md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                          {boat.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          isAvailable
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isBooked
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {isAvailable ? 'Verfügbar' : isBooked ? 'Gebucht' : 'Nicht verfügbar'}
                        </span>
                      </div>

                      <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                        {boat.sail_number}
                      </p>

                      {boat.notes && (
                        <p className={`text-xs mt-1 ${isDark ? 'text-coral/80' : 'text-red-500'}`}>
                          {boat.notes}
                        </p>
                      )}

                      {isBooked && booking && (
                        <div className={`mt-2 pt-2 border-t text-xs ${
                          isDark ? 'border-navy-700 text-cream/50' : 'border-light-border text-light-muted'
                        }`}>
                          Gechartert von: {booking.sailor_name}
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      ))}

      {/* Legend */}
      <GlassCard>
        <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
          Legende
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Verfügbar
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Bereits gebucht
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500" />
            <span className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Nicht verfügbar (z.B. in Reparatur)
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export default BoatCalendarPage;
