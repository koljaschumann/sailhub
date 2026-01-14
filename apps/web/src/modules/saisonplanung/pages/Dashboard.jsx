import { useTheme, GlassCard, Button, IconBadge, Icons } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { getBoatClassName, getBoatClassColor } from '@tsc/data';
import { useData } from '../context/DataContext';
import { formatDate } from '../utils/dateUtils';

export function DashboardPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { profile, isAdmin, isTrainer } = useAuth();
  const { events, deadline, season, isDeadlinePassed } = useData();

  const currentBoatClassId = profile?.primary_boat_class;
  const canManageEvents = isAdmin || isTrainer;

  const myEvents = events.filter(e => e.boatClassId === currentBoatClassId);
  const deadlinePassed = isDeadlinePassed();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Willkommen, {profile?.full_name || 'Trainer'}!
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          {season.name} - Plane die Regatten und Trainingslager deiner Trainingsgruppen
          {currentBoatClassId && (
            <span className="ml-2 inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getBoatClassColor(currentBoatClassId) }}
              />
              {getBoatClassName(currentBoatClassId)}
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Deadline Card */}
        <GlassCard shimmer hoverLift animate>
          <div className="flex items-center gap-3 mb-3">
            <div className={deadlinePassed ? '' : 'pulse-soft'}>
              <IconBadge icon={Icons.clock} color={deadlinePassed ? 'red' : 'gold'} />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>Eingabefrist</p>
              <p className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                {formatDate(deadline)}
              </p>
            </div>
          </div>
          {deadlinePassed ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/20 text-coral breathe-warning">
              <span className="w-3 h-3">{Icons.lock}</span>
              Abgelaufen
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${isDark ? 'bg-success/20 text-success' : 'bg-green-100 text-green-600'}`}>
              <span className="w-3 h-3">{Icons.unlock}</span>
              Eingabe möglich
            </span>
          )}
        </GlassCard>

        {/* Events Count */}
        <GlassCard shimmer hoverLift animate className="float-delayed">
          <div className="flex items-center gap-3 mb-3">
            <div className="sparkle">
              <IconBadge icon={Icons.calendar} color="purple" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>Meine Veranstaltungen</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                {myEvents.length}
              </p>
            </div>
          </div>
          <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            {myEvents.filter(e => e.type === 'regatta').length} Regatten, {myEvents.filter(e => e.type === 'trainingslager').length} Trainingslager
          </p>
        </GlassCard>

        {/* Total Events */}
        <GlassCard shimmer hoverLift animate className="float-delayed-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="sparkle">
              <IconBadge icon={Icons.users} color="cyan" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>Alle Veranstaltungen</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                {events.length}
              </p>
            </div>
          </div>
          <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Von allen Trainingsgruppen
          </p>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <GlassCard shimmer glow className="mb-8">
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Schnellaktionen
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setCurrentPage('events')}
            icon={Icons.plus}
            disabled={deadlinePassed && !canManageEvents}
          >
            Veranstaltung hinzufügen
          </Button>
          <Button
            variant="secondary"
            onClick={() => setCurrentPage('overview')}
            icon={Icons.calendar}
          >
            Saisonübersicht
          </Button>
          <Button
            variant="secondary"
            onClick={() => setCurrentPage('boats')}
            icon={Icons.boat}
          >
            Motorboot-Plan
          </Button>
        </div>
      </GlassCard>

      {/* My Events List */}
      {myEvents.length > 0 && (
        <GlassCard>
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Meine Veranstaltungen
          </h2>
          <div className="space-y-3">
            {myEvents.slice(0, 5).map(event => (
              <div
                key={event.id}
                className={`
                  flex items-center gap-4 p-3 rounded-xl
                  ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}
                `}
              >
                <IconBadge
                  icon={event.type === 'regatta' ? Icons.trophy : Icons.mapPin}
                  color={event.type === 'regatta' ? 'amber' : 'emerald'}
                  size="sm"
                />
                <div className="flex-1">
                  <p className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                    {event.name}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                    {formatDate(event.startDate)} - {formatDate(event.endDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

export default DashboardPage;
