import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, GlassCard, Button, Icons, IconBadge, Modal, useToast } from '@tsc/ui';
import { useData } from '../context/DataContext';

const STATUS_LABELS = {
  angemeldet: 'Angemeldet',
  bestaetigt: 'Bestätigt',
  abgesagt: 'Abgesagt',
  teilgenommen: 'Teilgenommen',
};

const STATUS_COLORS = {
  angemeldet: 'blue',
  bestaetigt: 'emerald',
  abgesagt: 'red',
  teilgenommen: 'gold',
};

export function RegistrationListPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { registrations, cancelRegistration } = useData();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const sortedRegistrations = [...registrations].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleCancelClick = (registration) => {
    setSelectedRegistration(registration);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedRegistration) return;

    await cancelRegistration(selectedRegistration.id, cancelReason);
    addToast('Anmeldung wurde abgesagt', 'success');
    setCancelModalOpen(false);
    setSelectedRegistration(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Meine Anmeldungen
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            {registrations.length} Anmeldung{registrations.length !== 1 ? 'en' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/')} icon={Icons.plus}>
          Neue Anmeldung
        </Button>
      </div>

      {sortedRegistrations.length > 0 ? (
        <div className="space-y-4">
          {sortedRegistrations.map(registration => (
            <GlassCard
              key={registration.id}
              className="cursor-pointer transition-all hover:scale-[1.01]"
              onClick={() => setExpandedId(expandedId === registration.id ? null : registration.id)}
            >
              <div className="flex items-start gap-4">
                <IconBadge
                  icon={Icons.sailboat}
                  color={STATUS_COLORS[registration.status]}
                  size="lg"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                      {registration.event?.name || 'Event'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${
                      registration.status === 'angemeldet'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : registration.status === 'bestaetigt'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : registration.status === 'abgesagt'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-gold-400/20 text-gold-400 border-gold-400/30'
                    }`}>
                      {STATUS_LABELS[registration.status]}
                    </span>
                    {registration.cancellation_cost_applicable && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        isDark ? 'bg-coral/20 text-coral' : 'bg-red-100 text-red-600'
                      }`}>
                        Kosten entstanden
                      </span>
                    )}
                  </div>

                  <p className={`text-sm ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                    {registration.sailor_first_name} {registration.sailor_last_name}
                    {registration.boat_class && ` • ${registration.boat_class.display_name}`}
                    {registration.sail_number && ` (${registration.sail_number})`}
                  </p>

                  <div className={`flex items-center gap-4 mt-2 text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                    <span className="flex items-center gap-1">
                      {Icons.calendar}
                      {registration.event && formatDate(registration.event.start_date)}
                    </span>
                    {registration.event?.location && (
                      <span className="flex items-center gap-1">
                        {Icons.mapPin}
                        {registration.event.location}
                      </span>
                    )}
                    {registration.crew_members?.length > 0 && (
                      <span className="flex items-center gap-1">
                        {Icons.users}
                        {registration.crew_members.length} Crew
                      </span>
                    )}
                  </div>
                </div>

                <div className={`w-6 h-6 transition-transform ${expandedId === registration.id ? 'rotate-180' : ''} ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
                  {Icons.chevronDown}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === registration.id && (
                <div className={`mt-4 pt-4 border-t ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className={`text-xs font-medium mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                        Kontakt
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-cream' : 'text-light-text'}`}>
                        {registration.contact_email}
                      </p>
                      {registration.contact_phone && (
                        <p className={`text-sm ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                          {registration.contact_phone}
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className={`text-xs font-medium mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                        Angemeldet am
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-cream' : 'text-light-text'}`}>
                        {formatDate(registration.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Crew Members */}
                  {registration.crew_members?.length > 0 && (
                    <div className="mb-4">
                      <h4 className={`text-xs font-medium mb-2 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                        Crew-Mitglieder
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {registration.crew_members.map((member, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-full text-sm ${
                              isDark ? 'bg-navy-700 text-cream/80' : 'bg-light-border text-light-text'
                            }`}
                          >
                            {member.first_name} {member.last_name}
                            <span className={`ml-1 text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                              ({member.role === 'vorschoter' ? 'V' : member.role === 'steuermann' ? 'S' : 'C'})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cancellation Info */}
                  {registration.status === 'abgesagt' && (
                    <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-coral/10' : 'bg-red-50'}`}>
                      <p className={`text-sm ${isDark ? 'text-coral' : 'text-red-600'}`}>
                        <strong>Abgesagt am:</strong> {formatDate(registration.cancellation_date)}
                      </p>
                      {registration.cancellation_reason && (
                        <p className={`text-sm mt-1 ${isDark ? 'text-coral/80' : 'text-red-500'}`}>
                          Grund: {registration.cancellation_reason}
                        </p>
                      )}
                      {registration.cancellation_cost_applicable && (
                        <p className={`text-sm mt-2 font-medium ${isDark ? 'text-coral' : 'text-red-600'}`}>
                          ⚠️ Kosten können entstehen (Absage weniger als 6 Wochen vor Event)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {registration.status === 'angemeldet' && (
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelClick(registration);
                        }}
                      >
                        Absagen
                      </Button>
                    </div>
                  )}
                </div>
              )}
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
            Noch keine Anmeldungen
          </h3>
          <p className={`mb-4 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Du hast dich noch für kein Event angemeldet.
          </p>
          <Button onClick={() => navigate('/events')}>
            Events ansehen
          </Button>
        </GlassCard>
      )}

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Anmeldung absagen"
      >
        <div className="space-y-4">
          <p className={isDark ? 'text-cream/80' : 'text-light-text'}>
            Möchtest du deine Anmeldung für <strong>{selectedRegistration?.event?.name}</strong> wirklich absagen?
          </p>

          {selectedRegistration?.event && (() => {
            const sixWeeksBefore = new Date(selectedRegistration.event.start_date);
            sixWeeksBefore.setDate(sixWeeksBefore.getDate() - 42);
            const isLateCancel = new Date() > sixWeeksBefore;

            if (isLateCancel) {
              return (
                <div className={`p-3 rounded-lg ${isDark ? 'bg-coral/10' : 'bg-red-50'}`}>
                  <p className={`text-sm font-medium ${isDark ? 'text-coral' : 'text-red-600'}`}>
                    ⚠️ Diese Absage erfolgt weniger als 6 Wochen vor Veranstaltungsbeginn.
                  </p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-coral/80' : 'text-red-500'}`}>
                    Es können Kosten entstehen (Startgeld, Meldegebühren, ggf. Unterbringung).
                  </p>
                </div>
              );
            }
            return null;
          })()}

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Grund der Absage (optional)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="z.B. Krankheit, Terminkonflikt..."
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                  : 'bg-white border-light-border text-light-text'
              }`}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setCancelModalOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleConfirmCancel}>
              Absage bestätigen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default RegistrationListPage;
