import { useState } from 'react';
import { useTheme, GlassCard, Button, Modal, IconBadge, Icons } from '@tsc/ui';
import { boatClasses, getBoatClassName, getBoatClassColor, getMotorboatName } from '@tsc/data';
import { useData } from '../context/DataContext';
import { formatDateRange } from '../utils/dateUtils';
import { SeasonTimeline } from '../components/calendar/SeasonTimeline';
import { exportSeasonCalendar, exportByBoatClass } from '../utils/pdfExport';

export function OverviewPage() {
  const { isDark } = useTheme();
  const { events, season } = useData();
  const [selectedEvent, setSelectedEvent] = useState(null);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Saisonübersicht
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            {season.name} - Alle Veranstaltungen im Überblick
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Icons.download}
            onClick={() => exportSeasonCalendar(events, season)}
          >
            Kalender PDF
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Icons.download}
            onClick={() => exportByBoatClass(events, season)}
          >
            Nach Klassen PDF
          </Button>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {boatClasses.map(bc => {
          const count = events.filter(e => e.boatClassId === bc.id).length;
          return (
            <div
              key={bc.id}
              className={`
                p-3 rounded-xl border flex items-center gap-3
                ${isDark ? 'bg-navy-800/50 border-navy-700' : 'bg-white border-light-border'}
              `}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: bc.color }}
              >
                {count}
              </div>
              <span className={`text-sm ${isDark ? 'text-cream' : 'text-light-text'}`}>
                {bc.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      {events.length > 0 ? (
        <SeasonTimeline
          events={events}
          season={season}
          onEventClick={setSelectedEvent}
        />
      ) : (
        <GlassCard className="text-center py-12">
          <div className="flex justify-center mb-4">
            <IconBadge icon={Icons.calendar} color="slate" size="lg" />
          </div>
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Noch keine Veranstaltungen
          </h3>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Sobald Trainer Veranstaltungen hinzufügen, werden sie hier angezeigt.
          </p>
        </GlassCard>
      )}

      {/* Event Detail Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Veranstaltungsdetails"
        size="sm"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getBoatClassColor(selectedEvent.boatClassId) }}
              />
              <span className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                {getBoatClassName(selectedEvent.boatClassId)}
              </span>
              <span className={`text-sm px-2 py-0.5 rounded-full ${
                selectedEvent.type === 'regatta'
                  ? isDark ? 'bg-amber-400/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                  : isDark ? 'bg-emerald-400/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {selectedEvent.type === 'regatta' ? 'Regatta' : 'Trainingslager'}
              </span>
            </div>

            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                {selectedEvent.name}
              </h3>
              {(selectedEvent.organizer || selectedEvent.location) && (
                <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
                  {selectedEvent.organizer || selectedEvent.location}
                </p>
              )}
            </div>

            <div className={`p-3 rounded-lg space-y-2 ${isDark ? 'bg-navy-800' : 'bg-light-border/30'}`}>
              <div className="flex items-center gap-2 text-sm">
                <span className={`w-4 h-4 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>{Icons.calendar}</span>
                <span className={isDark ? 'text-cream' : 'text-light-text'}>
                  {formatDateRange(selectedEvent.startDate, selectedEvent.endDate)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`w-4 h-4 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>{Icons.boat}</span>
                <span className={isDark ? 'text-cream' : 'text-light-text'}>
                  {getMotorboatName(selectedEvent.requestedMotorboat)}
                  {selectedEvent.assignedMotorboat && selectedEvent.assignedMotorboat !== selectedEvent.requestedMotorboat && (
                    <span className="text-coral ml-1">
                      (zugewiesen: {getMotorboatName(selectedEvent.assignedMotorboat)})
                    </span>
                  )}
                </span>
              </div>
            </div>

            <Button onClick={() => setSelectedEvent(null)} className="w-full">
              Schließen
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default OverviewPage;
