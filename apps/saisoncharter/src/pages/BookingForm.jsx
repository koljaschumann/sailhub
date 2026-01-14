import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, GlassCard, Button, Icons, IconBadge, useToast } from '@tsc/ui';
import { useData } from '../context/DataContext';

const BOAT_TYPE_LABELS = {
  optimist: 'Optimist',
  ilca4: 'ILCA 4',
  ilca6: 'ILCA 6',
  '420er': '420er',
  '29er': '29er',
  laser: 'Laser',
};

export function BookingFormPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { getActiveSeason, getAvailableBoats, charterReasons, addBooking, loading } = useData();

  const season = getActiveSeason();
  const availableBoats = getAvailableBoats();

  // Form state
  const [selectedBoatId, setSelectedBoatId] = useState('');
  const [sailorFirstName, setSailorFirstName] = useState('');
  const [sailorLastName, setSailorLastName] = useState('');
  const [sailorBirthDate, setSailorBirthDate] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Group boats by type for display
  const boatsByType = availableBoats.reduce((acc, boat) => {
    if (!acc[boat.boat_type]) {
      acc[boat.boat_type] = [];
    }
    acc[boat.boat_type].push(boat);
    return acc;
  }, {});

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedBoatId) {
      addToast('Bitte wähle ein Boot aus', 'error');
      return;
    }

    if (!termsAccepted) {
      addToast('Bitte akzeptiere die Charter-Bedingungen', 'error');
      return;
    }

    try {
      await addBooking({
        boat_id: selectedBoatId,
        sailor_first_name: sailorFirstName.trim(),
        sailor_last_name: sailorLastName.trim(),
        sailor_birth_date: sailorBirthDate,
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim() || undefined,
        reason,
        notes: notes.trim() || undefined,
      });

      addToast('Buchung erfolgreich eingereicht!', 'success');
      navigate('/buchungen');
    } catch (err) {
      console.error('Error submitting booking:', err);
      addToast('Fehler beim Einreichen der Buchung', 'error');
    }
  };

  if (!season) {
    return (
      <div className="max-w-2xl mx-auto">
        <GlassCard className="text-center py-12">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
            isDark ? 'bg-coral/10 text-coral' : 'bg-red-100 text-red-500'
          }`}>
            {Icons.calendar}
          </div>
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Keine aktive Saison
          </h3>
          <p className={`${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Aktuell gibt es keine offene Charter-Saison.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Saison-Charter {season.year}
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Chartere ein Vereinsboot für die Saison {season.year}
        </p>
      </div>

      {/* Season Info */}
      <GlassCard>
        <div className="flex items-start gap-4">
          <IconBadge icon={Icons.sailboat} color="emerald" size="lg" />
          <div className="flex-1">
            <h3 className={`font-semibold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Charter-Saison {season.year}
            </h3>
            <div className={`grid grid-cols-2 gap-4 text-sm ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
              <div>
                <span className="font-medium">Zeitraum:</span><br />
                {new Date(season.start_date).toLocaleDateString('de-DE')} - {new Date(season.end_date).toLocaleDateString('de-DE')}
              </div>
              <div>
                <span className="font-medium">Pauschale:</span><br />
                <span className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {season.price}€
                </span>
                <span className="text-xs ml-1">pro Saison</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      <form onSubmit={handleSubmit}>
        <GlassCard className="space-y-6">
          {/* Boat Selection */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Boot auswählen *
            </label>

            {Object.keys(boatsByType).length === 0 ? (
              <p className={`text-sm ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                Keine Boote verfügbar für diese Saison.
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(boatsByType).map(([type, boats]) => (
                  <div key={type}>
                    <h4 className={`text-xs font-medium mb-2 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                      {BOAT_TYPE_LABELS[type] || type}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {boats.map(boat => (
                        <button
                          key={boat.id}
                          type="button"
                          onClick={() => setSelectedBoatId(boat.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            selectedBoatId === boat.id
                              ? isDark
                                ? 'bg-emerald-500/20 border-emerald-500 text-cream'
                                : 'bg-emerald-50 border-emerald-500 text-light-text'
                              : isDark
                                ? 'bg-navy-800 border-navy-700 text-cream/80 hover:border-navy-600'
                                : 'bg-white border-light-border text-light-text hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">{boat.name}</div>
                          <div className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                            {boat.sail_number}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sailor Info */}
          <div className={`border-t pt-6 ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Segler:in
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  Vorname *
                </label>
                <input
                  type="text"
                  value={sailorFirstName}
                  onChange={(e) => setSailorFirstName(e.target.value)}
                  required
                  placeholder="Max"
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  Nachname *
                </label>
                <input
                  type="text"
                  value={sailorLastName}
                  onChange={(e) => setSailorLastName(e.target.value)}
                  required
                  placeholder="Mustermann"
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Geburtsdatum *
              </label>
              <input
                type="date"
                value={sailorBirthDate}
                onChange={(e) => setSailorBirthDate(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className={`border-t pt-6 ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Kontaktdaten
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  E-Mail *
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  placeholder="eltern@email.de"
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  Telefon
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+49 170 1234567"
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Reason & Notes */}
          <div className={`border-t pt-6 ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  Verwendungszweck *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                >
                  <option value="">Bitte wählen...</option>
                  {charterReasons.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  Anmerkungen
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional..."
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className={`border-t pt-6 ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                required
                className={`mt-1 w-5 h-5 rounded border-2 ${
                  isDark ? 'border-navy-600' : 'border-light-border'
                }`}
              />
              <span className={`text-sm ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Ich akzeptiere die Charter-Bedingungen des TSC. Die Pauschale von {season.price}€ für die Saison wird per Rechnung erhoben. Ich bin für die pflegliche Behandlung des Bootes verantwortlich und melde Schäden unverzüglich. *
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/boote')}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedBoatId}
              icon={Icons.check}
            >
              {loading ? 'Wird gesendet...' : 'Buchung abschicken'}
            </Button>
          </div>
        </GlassCard>
      </form>
    </div>
  );
}

export default BookingFormPage;
