import { useTheme, GlassCard, Icons } from '@tsc/ui';

/**
 * Event type badges with colors
 */
const eventTypeBadges = {
  regatta: { label: 'Regatta', color: 'bg-blue-500' },
  trainingslager: { label: 'Trainingslager', color: 'bg-amber-500' },
  training: { label: 'Training', color: 'bg-green-500' },
  sonstiges: { label: 'Sonstiges', color: 'bg-gray-500' },
};

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format date range for display
 */
function formatDateRange(startDate, endDate) {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  if (start === end) return start;
  return `${start} - ${end}`;
}

/**
 * EventCard Component
 * Displays a trainer event with all relevant info
 */
export function EventCard({
  event,
  showTrainer = true,
  showBoatClass = true,
  onRegister,
  onEdit,
  onDelete,
  isTrainerView = false,
}) {
  const { isDark } = useTheme();
  const badge = eventTypeBadges[event.event_type] || eventTypeBadges.sonstiges;

  const isTrainingslager = event.event_type === 'trainingslager';
  const hasCosts = event.has_costs;
  const spotsLeft = event.max_participants
    ? event.max_participants - (event.registration_count || 0)
    : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  return (
    <GlassCard className="relative overflow-hidden">
      {/* Event Type Badge */}
      <div className="absolute top-3 right-3">
        <span className={`${badge.color} text-white text-xs font-semibold px-2 py-1 rounded-full`}>
          {badge.label}
        </span>
      </div>

      {/* Boat Class Badge */}
      {showBoatClass && event.boat_class_display_name && (
        <div
          className="absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full"
          style={{ backgroundColor: event.boat_class_color + '20', color: event.boat_class_color }}
        >
          {event.boat_class_display_name}
        </div>
      )}

      <div className="pt-8 space-y-4">
        {/* Title */}
        <h3 className={`text-lg font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
          {event.title}
        </h3>

        {/* Event Details */}
        <div className="space-y-2">
          {/* Date */}
          <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
            <span className="w-5 h-5">{Icons.calendar}</span>
            <span>{formatDateRange(event.start_date, event.end_date)}</span>
          </div>

          {/* Location */}
          {event.location && (
            <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
              <span className="w-5 h-5">{Icons.mapPin}</span>
              <span>{event.location}</span>
            </div>
          )}

          {/* Trainer */}
          {showTrainer && event.trainer_name && (
            <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
              <span className="w-5 h-5">{Icons.user}</span>
              <span>Trainer: {event.trainer_name}</span>
            </div>
          )}

          {/* Participants */}
          {event.max_participants && (
            <div className={`flex items-center gap-2 text-sm ${
              isFull
                ? 'text-coral'
                : isDark ? 'text-cream/70' : 'text-light-muted'
            }`}>
              <span className="w-5 h-5">{Icons.users}</span>
              <span>
                {isFull
                  ? 'Ausgebucht'
                  : `${event.registration_count || 0} / ${event.max_participants} Plätze`
                }
              </span>
            </div>
          )}
        </div>

        {/* Cost Warning for Trainingslager */}
        {isTrainingslager && hasCosts && (
          <div className={`p-3 rounded-lg ${isDark ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'}`}>
            <div className={`flex items-start gap-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
              <span className="w-5 h-5 flex-shrink-0 mt-0.5">{Icons.alertTriangle}</span>
              <div className="text-sm">
                <span className="font-semibold">Kostenpflichtig</span>
                {event.estimated_cost && (
                  <span className="ml-1">- ca. {event.estimated_cost.toLocaleString('de-DE')} EUR</span>
                )}
                {event.cost_description && (
                  <p className="mt-1 opacity-80">{event.cost_description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            {event.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {isTrainerView ? (
            <>
              {onEdit && (
                <button
                  onClick={() => onEdit(event)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark
                      ? 'bg-navy-700 hover:bg-navy-600 text-cream'
                      : 'bg-light-card hover:bg-light-hover text-light-text'
                  }`}
                >
                  Bearbeiten
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(event)}
                  className="px-4 py-2 rounded-lg font-medium transition-colors bg-coral/10 hover:bg-coral/20 text-coral"
                >
                  {Icons.trash}
                </button>
              )}
            </>
          ) : (
            onRegister && (
              <button
                onClick={() => onRegister(event)}
                disabled={isFull || !event.registration_open}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  isFull || !event.registration_open
                    ? isDark
                      ? 'bg-navy-800 text-cream/30 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDark
                      ? 'bg-gold-400 hover:bg-gold-500 text-navy-900'
                      : 'bg-teal-500 hover:bg-teal-600 text-white'
                }`}
              >
                {isFull ? 'Ausgebucht' : !event.registration_open ? 'Geschlossen' : 'Anmelden'}
              </button>
            )
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export default EventCard;
