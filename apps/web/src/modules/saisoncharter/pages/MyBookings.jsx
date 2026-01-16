import { useState } from 'react';
import { useTheme, GlassCard, Button, Icons, IconBadge, Modal, useToast } from '@tsc/ui';
import { useData } from '../context/DataContext';

const STATUS_LABELS = {
  beantragt: 'Beantragt',
  genehmigt: 'Genehmigt',
  boot_zugewiesen: 'Boot zugewiesen',
  aktiv: 'Aktiv',
  beendet: 'Beendet',
  abgelehnt: 'Abgelehnt',
};

const STATUS_COLORS = {
  beantragt: 'gold',
  genehmigt: 'blue',
  boot_zugewiesen: 'cyan',
  aktiv: 'emerald',
  beendet: 'slate',
  abgelehnt: 'red',
};

export function MyBookingsPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { addToast } = useToast();
  const { bookings, cancelBooking } = useData();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const sortedBookings = [...bookings].sort(
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

  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;

    await cancelBooking(selectedBooking.id);
    addToast('Buchung wurde storniert', 'success');
    setCancelModalOpen(false);
    setSelectedBooking(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Meine Buchungen
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            {bookings.length} Buchung{bookings.length !== 1 ? 'en' : ''}
          </p>
        </div>
        <Button onClick={() => setCurrentPage('booking')} icon={Icons.plus}>
          Neue Buchung
        </Button>
      </div>

      {sortedBookings.length > 0 ? (
        <div className="space-y-4">
          {sortedBookings.map(booking => (
            <GlassCard key={booking.id}>
              <div className="flex items-start gap-4">
                <IconBadge
                  icon={Icons.sailboat}
                  color={STATUS_COLORS[booking.status]}
                  size="lg"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                      {booking.boat?.name || 'Boot'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${
                      booking.status === 'beantragt'
                        ? 'bg-gold-400/20 text-gold-400 border-gold-400/30'
                        : booking.status === 'genehmigt' || booking.status === 'boot_zugewiesen'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : booking.status === 'aktiv'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : booking.status === 'abgelehnt'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                    }`}>
                      {STATUS_LABELS[booking.status] || booking.status}
                    </span>
                  </div>

                  <p className={`text-sm ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                    {booking.sailor_name}
                    {booking.boat?.sail_number && ` • ${booking.boat.sail_number}`}
                  </p>

                  <div className={`flex items-center gap-4 mt-2 text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                    <span className="flex items-center gap-1">
                      {Icons.calendar}
                      Saison {booking.season?.year}
                    </span>
                    <span className="flex items-center gap-1">
                      {Icons.euro}
                      {booking.season?.price}€
                    </span>
                    <span>
                      Gebucht: {formatDate(booking.created_at)}
                    </span>
                  </div>

                  {booking.reason && (
                    <p className={`mt-2 text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                      Verwendungszweck: {booking.reason}
                    </p>
                  )}
                </div>

                {booking.status === 'ausstehend' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCancelClick(booking)}
                  >
                    Stornieren
                  </Button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="text-center py-12">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
            isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-500'
          }`}>
            {Icons.sailboat}
          </div>
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Noch keine Buchungen
          </h3>
          <p className={`mb-4 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Du hast noch kein Boot für diese Saison gechartert.
          </p>
          <Button onClick={() => setCurrentPage('booking')}>
            Boot buchen
          </Button>
        </GlassCard>
      )}

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Buchung stornieren"
      >
        <div className="space-y-4">
          <p className={isDark ? 'text-cream/80' : 'text-light-text'}>
            Möchtest du die Buchung für <strong>{selectedBooking?.boat?.name}</strong> wirklich stornieren?
          </p>

          <div className={`p-3 rounded-lg ${isDark ? 'bg-gold-400/10' : 'bg-amber-50'}`}>
            <p className={`text-sm ${isDark ? 'text-gold-400' : 'text-amber-700'}`}>
              Hinweis: Bei einer Stornierung nach Saisonbeginn können anteilige Kosten entstehen.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setCancelModalOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleConfirmCancel}>
              Stornierung bestätigen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default MyBookingsPage;
