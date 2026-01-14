import { useState } from 'react';
import { useTheme, GlassCard, Button, Icons, IconBadge } from '@tsc/ui';
import { useData } from '../context/DataContext';

export function EventListPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { events } = useData();

  const [filterType, setFilterType] = useState('');
  const [showPast, setShowPast] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const filteredEvents = events.filter(e => {
    if (!e.active) return false;
    if (!showPast && e.end_date < today) return false;
    if (filterType && e.event_type !== filterType) return false;
    return true;
  }).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const formatDateRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const startStr = startDate.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
    });

    if (start === end) {
      return startDate.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }

    const endStr = endDate.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return `${startStr} - ${endStr}`;
  };

  const getEventTypeLabel = (type) => {
    const labels = {
      regatta: 'Regatta',
      training: 'Training',
      trainingslager: 'Trainingslager',
      sonstiges: 'Sonstiges',
    };
    return labels[type] || type;
  };

  const getEventTypeColor = (type) => {
    const colors = {
      regatta: 'gold',
      training: 'emerald',
      trainingslager: 'blue',
      sonstiges: 'slate',
    };
    return colors[type] || 'slate';
  };

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    return deadline < today;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Events
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            {filteredEvents.length} Event{filteredEvents.length !== 1 ? 's' : ''} verfügbar
          </p>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[150px]">
          <label className={`block text-xs mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Typ
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
            <option value="regatta">Regatta</option>
            <option value="trainingslager">Trainingslager</option>
            <option value="training">Training</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showPast}
            onChange={(e) => setShowPast(e.target.checked)}
            className={`w-4 h-4 rounded ${isDark ? 'bg-navy-700' : 'bg-white'}`}
          />
          <span className={`text-sm ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
            Vergangene anzeigen
          </span>
        </label>
      </GlassCard>

      {/* Event List */}
      {filteredEvents.length > 0 ? (
        <div className="grid gap-4">
          {filteredEvents.map(event => (
            <GlassCard
              key={event.id}
              hoverLift
              className="cursor-pointer"
              onClick={() => setCurrentPage('register')}
            >
              <div className="flex items-start gap-4">
                <IconBadge
                  icon={event.event_type === 'trainingslager' ? Icons.users : Icons.trophy}
                  color={getEventTypeColor(event.event_type)}
                  size="lg"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                      {event.name}
                    </h3>
                    {event.is_championship && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        isDark ? 'bg-gold-400/20 text-gold-400' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {event.championship_level === 'deutsche_meisterschaft' ? 'DM' : 'LM'}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      isDark ? 'bg-navy-700 text-cream/60' : 'bg-light-border text-light-muted'
                    }`}>
                      {getEventTypeLabel(event.event_type)}
                    </span>
                  </div>

                  <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-4">{Icons.calendar}</span>
                      {formatDateRange(event.start_date, event.end_date)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <span className="w-4 h-4">{Icons.mapPin}</span>
                        {event.location}
                      </span>
                    )}
                  </div>

                  {event.registration_deadline && (
                    <div className={`mt-2 text-xs ${
                      isDeadlinePassed(event.registration_deadline)
                        ? 'text-coral'
                        : isDark ? 'text-cream/50' : 'text-light-muted'
                    }`}>
                      Anmeldeschluss: {new Date(event.registration_deadline).toLocaleDateString('de-DE')}
                      {isDeadlinePassed(event.registration_deadline) && ' (abgelaufen)'}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {event.external_url && (
                    <a
                      href={event.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark
                          ? 'text-cream/60 hover:text-cream hover:bg-navy-700'
                          : 'text-light-muted hover:text-light-text hover:bg-light-border'
                      }`}
                    >
                      <span className="w-5 h-5 block">{Icons.download}</span>
                    </a>
                  )}
                  <Button
                    size="sm"
                    disabled={isDeadlinePassed(event.registration_deadline)}
                  >
                    Anmelden
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="text-center py-12">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
            isDark ? 'bg-gold-400/10 text-gold-400' : 'bg-teal-500/10 text-teal-500'
          }`}>
            {Icons.calendar}
          </div>
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Keine Events gefunden
          </h3>
          <p className={`${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            {filterType || !showPast
              ? 'Passe deine Filter an, um mehr Events zu sehen.'
              : 'Aktuell sind keine Events geplant.'}
          </p>
        </GlassCard>
      )}
    </div>
  );
}

export default EventListPage;
