import { useTheme, GlassCard, Button, IconBadge, Icons, useToast } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { motorboats, getBoatClassName, getBoatClassColor, getMotorboatName } from '@tsc/data';
import { useData } from '../context/DataContext';
import { formatDateRange } from '../utils/dateUtils';
import { findConflicts, getMotorboatUsage, applySuggestion } from '../utils/conflictResolver';
import { exportMotorboatPlan } from '../utils/pdfExport';

export function BoatsPage() {
  const { isDark } = useTheme();
  const { profile } = useAuth();
  const { events, season, assignMotorboat } = useData();
  const { addToast } = useToast();

  // TODO: Remove devMode when Supabase connection is fixed
  const devMode = true;
  const isAdmin = devMode || profile?.role === 'admin';

  const conflicts = findConflicts(events);
  const usage = getMotorboatUsage(events);

  const handleResolveConflict = async (conflict) => {
    try {
      if (applySuggestion(events, conflict, (id, updates) => assignMotorboat(id, updates.assignedMotorboat))) {
        addToast('Konflikt wurde aufgelöst', 'success');
      }
    } catch (err) {
      addToast('Fehler beim Auflösen', 'error');
    }
  };

  const handleChangeAssignment = async (eventId, newMotorboatId) => {
    try {
      await assignMotorboat(eventId, newMotorboatId);
      addToast('Motorboot-Zuweisung geändert', 'success');
    } catch (err) {
      addToast('Fehler beim Ändern', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Motorboot-Einsatzplan
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Übersicht und Konfliktauflösung
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={Icons.download}
          onClick={() => exportMotorboatPlan(events, season)}
        >
          PDF Export
        </Button>
      </div>

      {/* Conflicts Warning */}
      {conflicts.length > 0 && (
        <GlassCard className={`mb-6 border-2 breathe-warning ${isDark ? 'border-coral/50' : 'border-red-300'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="pulse-soft">
              <IconBadge icon={Icons.alertTriangle} color="red" />
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                {conflicts.length} Konflikt{conflicts.length > 1 ? 'e' : ''} gefunden
              </h3>
              <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Mehrere Gruppen benötigen das gleiche Motorboot zur gleichen Zeit
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {conflicts.map(conflict => (
              <div
                key={conflict.id}
                className={`p-4 rounded-xl ${isDark ? 'bg-navy-800' : 'bg-red-50'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`font-medium mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                      {getMotorboatName(conflict.motorboatId)} - Überschneidung
                    </p>
                    <div className="space-y-1">
                      {conflict.events.map(event => (
                        <div key={event.id} className="flex items-center gap-2 text-sm">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getBoatClassColor(event.boatClassId) }}
                          />
                          <span className={isDark ? 'text-cream/80' : 'text-light-text'}>
                            {getBoatClassName(event.boatClassId)}: {event.name}
                          </span>
                          <span className={isDark ? 'text-cream/60' : 'text-light-muted'}>
                            ({formatDateRange(event.startDate, event.endDate)})
                          </span>
                        </div>
                      ))}
                    </div>
                    {conflict.suggestion && (
                      <p className={`mt-2 text-sm ${isDark ? 'text-gold-400' : 'text-teal-600'}`}>
                        Vorschlag: {conflict.suggestion.reason}
                      </p>
                    )}
                  </div>
                  {isAdmin && conflict.suggestion?.newMotorboat && (
                    <Button
                      size="sm"
                      onClick={() => handleResolveConflict(conflict)}
                    >
                      Auflösen
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Motorboat Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {motorboats.map(mb => {
          const boatUsage = usage[mb.id];
          const hasConflict = conflicts.some(c => c.motorboatId === mb.id);

          return (
            <GlassCard
              key={mb.id}
              shimmer
              hoverLift
              className={hasConflict ? `border-2 ${isDark ? 'border-coral/30' : 'border-red-200'}` : ''}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <IconBadge icon={Icons.boat} color={hasConflict ? 'red' : 'gold'} />
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                      {mb.name}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                      {mb.description}
                    </p>
                  </div>
                </div>
                <span className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  ${boatUsage?.count > 0
                    ? isDark ? 'bg-gold-400/20 text-gold-400' : 'bg-teal-100 text-teal-600'
                    : isDark ? 'bg-navy-700 text-cream/60' : 'bg-gray-100 text-light-muted'}
                `}>
                  {boatUsage?.count || 0} Einsätze
                </span>
              </div>

              {mb.priority.length > 0 && (
                <p className={`text-xs mb-3 ${isDark ? 'text-gold-400/80' : 'text-teal-600'}`}>
                  Priorität: {mb.priority.map(id => getBoatClassName(id)).join(', ')}
                </p>
              )}

              {boatUsage?.events.length > 0 ? (
                <div className="space-y-2">
                  {boatUsage.events.map(event => (
                    <div
                      key={event.id}
                      className={`
                        flex items-center justify-between p-2 rounded-lg
                        ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getBoatClassColor(event.boatClassId) }}
                        />
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                            {event.name}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                            {formatDateRange(event.startDate, event.endDate)}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <select
                          value={event.assignedMotorboat}
                          onChange={(e) => handleChangeAssignment(event.id, e.target.value)}
                          className={`
                            text-xs px-2 py-1 rounded border
                            ${isDark
                              ? 'bg-navy-700 border-navy-600 text-cream'
                              : 'bg-white border-light-border text-light-text'}
                          `}
                        >
                          {motorboats.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-sm text-center py-4 ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
                  Keine Einsätze geplant
                </p>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

export default BoatsPage;
