import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme, GlassCard, Button, Icons, useToast } from '@tsc/ui';
import { useData } from '../context/DataContext';
import { DISCLAIMER_TEXTS } from '@tsc/config/email';

const DISCLAIMER_TEXT = DISCLAIMER_TEXTS?.eventRegistration ||
  `Ich nehme zur Kenntnis, dass bei einer Absage weniger als 6 Wochen vor Veranstaltungsbeginn entstehende Kosten (Startgeld, Meldegebühren, ggf. Unterbringung) auf mich bzw. die Erziehungsberechtigten umgelegt werden müssen, sofern diese nicht anderweitig erstattet werden.`;

export function RegistrationFormPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const { boatClasses, getBoatClass, addRegistration, loading } = useData();


  // Form state
  const [eventName, setEventName] = useState(searchParams.get('event') || '');
  const [sailorFirstName, setSailorFirstName] = useState('');
  const [sailorLastName, setSailorLastName] = useState('');
  const [sailorBirthDate, setSailorBirthDate] = useState('');
  const [boatClassId, setBoatClassId] = useState('');
  const [sailNumber, setSailNumber] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [crewMembers, setCrewMembers] = useState([]);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // Get selected boat class to check crew_size
  const selectedBoatClass = getBoatClass(boatClassId);
  const needsCrew = selectedBoatClass && selectedBoatClass.crew_size > 1;

  // Initialize crew members when boat class changes
  useEffect(() => {
    if (selectedBoatClass && selectedBoatClass.crew_size > 1) {
      const crewCount = selectedBoatClass.crew_size - 1;
      setCrewMembers(
        Array(crewCount).fill(null).map((_, i) => ({
          first_name: '',
          last_name: '',
          birth_date: '',
          role: i === 0 ? 'vorschoter' : 'crew',
        }))
      );
    } else {
      setCrewMembers([]);
    }
  }, [boatClassId, selectedBoatClass]);

  const updateCrewMember = (index, field, value) => {
    setCrewMembers(prev =>
      prev.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eventName) {
      addToast('Bitte wähle ein Event aus', 'error');
      return;
    }

    if (!disclaimerAccepted) {
      addToast('Bitte akzeptiere die Teilnahmebedingungen', 'error');
      return;
    }

    // Validate crew members if needed
    if (needsCrew) {
      const invalidCrew = crewMembers.some(m => !m.first_name.trim() || !m.last_name.trim());
      if (invalidCrew) {
        addToast('Bitte fülle alle Crew-Mitglieder aus', 'error');
        return;
      }
    }

    try {
      await addRegistration({
        event_name: eventName,
        sailor_first_name: sailorFirstName.trim(),
        sailor_last_name: sailorLastName.trim(),
        sailor_birth_date: sailorBirthDate,
        boat_class_id: boatClassId,
        sail_number: sailNumber.trim() || undefined,
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim() || undefined,
        crew_members: needsCrew ? crewMembers : [],
        disclaimer_accepted: true,
      });

      addToast('Anmeldung erfolgreich eingereicht!', 'success');
      navigate('/liste');
    } catch (err) {
      console.error('Error submitting registration:', err);
      addToast('Fehler beim Einreichen der Anmeldung', 'error');
    }
  };


  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Eventanmeldung
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Melde dich für Regatten und Trainingslager an
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <GlassCard className="space-y-6">
          {/* Event Name Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Event / Regatta *
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
              placeholder="z.B. Berliner Jugendmeisterschaft 2025, Trainingslager Steinhuder Meer..."
              className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                  : 'bg-white border-light-border text-light-text'
              }`}
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
              Gib den Namen der Regatta oder des Trainingslagers ein
            </p>
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

          {/* Boat Class & Sail Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Bootsklasse *
              </label>
              <select
                value={boatClassId}
                onChange={(e) => setBoatClassId(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              >
                <option value="">Bitte wählen...</option>
                {boatClasses.filter(bc => bc.active).map(bc => (
                  <option key={bc.id} value={bc.id}>
                    {bc.display_name} {bc.crew_size > 1 && `(${bc.crew_size}er)`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Segelnummer (optional)
              </label>
              <input
                type="text"
                value={sailNumber}
                onChange={(e) => setSailNumber(e.target.value)}
                placeholder="GER 12345"
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                    : 'bg-white border-light-border text-light-text'
                }`}
              />
            </div>
          </div>

          {/* Crew Members (for multi-person boats) */}
          {needsCrew && (
            <div className={`border-t pt-6 ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Crew-Mitglieder
              </h3>
              {crewMembers.map((member, index) => (
                <div key={index} className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                      Crew {index + 1}
                    </span>
                    <select
                      value={member.role}
                      onChange={(e) => updateCrewMember(index, 'role', e.target.value)}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        isDark
                          ? 'bg-navy-700 border-navy-600 text-cream'
                          : 'bg-white border-light-border text-light-text'
                      }`}
                    >
                      <option value="vorschoter">Vorschoter</option>
                      <option value="steuermann">Steuermann</option>
                      <option value="crew">Crew</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={member.first_name}
                      onChange={(e) => updateCrewMember(index, 'first_name', e.target.value)}
                      placeholder="Vorname *"
                      required
                      className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                        isDark
                          ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                          : 'bg-white border-light-border text-light-text'
                      }`}
                    />
                    <input
                      type="text"
                      value={member.last_name}
                      onChange={(e) => updateCrewMember(index, 'last_name', e.target.value)}
                      placeholder="Nachname *"
                      required
                      className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                        isDark
                          ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                          : 'bg-white border-light-border text-light-text'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

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
                  Telefon Erziehungsberechtigte
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

          {/* Disclaimer */}
          <div className={`border-t pt-6 ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                required
                className={`mt-1 w-5 h-5 rounded border-2 ${
                  isDark ? 'border-navy-600' : 'border-light-border'
                }`}
              />
              <span className={`text-sm ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                {DISCLAIMER_TEXT} *
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/events')}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading}
              icon={Icons.check}
            >
              {loading ? 'Wird gesendet...' : 'Anmeldung abschicken'}
            </Button>
          </div>
        </GlassCard>
      </form>
    </div>
  );
}

export default RegistrationFormPage;
