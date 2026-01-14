import { useState } from 'react';
import { useTheme, GlassCard, Button, Modal, Icons, useToast } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { useData } from '../context/DataContext';
import { EventCard } from '../components/EventCard';
import { CostWarning } from '../components/CostWarning';
import { CancellationWarning } from '../components/CancellationWarning';

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
 * SailorEventList Page
 * Shows available events for sailors to register
 */
export function SailorEventListPage() {
  const { isDark } = useTheme();
  const { addToast } = useToast();
  const { user, profile } = useAuth();
  const {
    boatClasses,
    myBoatClasses,
    getEventsGroupedByEvent,
    getSailorAvailableEvents,
    registerForTrainerEvent,
    loading,
  } = useData();

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  // Registration form state
  const [formData, setFormData] = useState({
    sailor_first_name: '',
    sailor_last_name: '',
    sailor_birth_date: '',
    sail_number: '',
    contact_email: '',
    contact_phone: '',
    disclaimer_accepted: false,
    cost_confirmed: false,
    cancellation_acknowledged: false,
  });

  const groupedEvents = getEventsGroupedByEvent();
  const availableEvents = getSailorAvailableEvents();

  // Get boat class names for display
  const myBoatClassNames = myBoatClasses
    .map(id => boatClasses.find(bc => bc.id === id)?.display_name || id)
    .join(', ');

  const openRegistrationModal = (trainerEvent) => {
    setSelectedEvent(trainerEvent);
    setSelectedTrainer(trainerEvent);
    setFormData({
      sailor_first_name: profile?.full_name?.split(' ')[0] || '',
      sailor_last_name: profile?.full_name?.split(' ').slice(1).join(' ') || '',
      sailor_birth_date: '',
      sail_number: '',
      contact_email: user?.email || '',
      contact_phone: '',
      disclaimer_accepted: false,
      cost_confirmed: false,
      cancellation_acknowledged: false,
    });
    setIsModalOpen(true);
  };

  const handleTrainerSelect = (trainer) => {
    setSelectedTrainer(trainer);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.sailor_first_name || !formData.sailor_last_name) {
      addToast('Bitte gib deinen Namen an', 'error');
      return;
    }

    if (!formData.sailor_birth_date) {
      addToast('Bitte gib dein Geburtsdatum an', 'error');
      return;
    }

    if (!formData.contact_email) {
      addToast('Bitte gib deine E-Mail-Adresse an', 'error');
      return;
    }

    if (!formData.disclaimer_accepted) {
      addToast('Bitte akzeptiere die Teilnahmebedingungen', 'error');
      return;
    }

    // Check cost confirmation for events with costs
    if (selectedTrainer.has_costs && !formData.cost_confirmed) {
      addToast('Bitte bestätige die Kosteninformationen', 'error');
      return;
    }

    // Check cancellation acknowledgement
    if (!formData.cancellation_acknowledged) {
      addToast('Bitte bestätige die Stornobedingungen', 'error');
      return;
    }

    try {
      await registerForTrainerEvent({
        trainer_event_id: selectedTrainer.id,
        event_id: selectedTrainer.event_id,
        boat_class_id: selectedTrainer.boat_class_id,
        ...formData,
      });

      addToast('Erfolgreich angemeldet!', 'success');
      setIsModalOpen(false);
    } catch (err) {
      addToast('Fehler bei der Anmeldung', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Events
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Melde dich für Regatten und Trainings an
          {myBoatClassNames && (
            <span className="ml-1">
              ({myBoatClassNames})
            </span>
          )}
        </p>
      </div>

      {/* Event List */}
      {availableEvents.length === 0 ? (
        <GlassCard className="text-center py-12">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isDark ? 'bg-gold-400/10 text-gold-400' : 'bg-teal-500/10 text-teal-500'
          }`}>
            {Icons.calendar}
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Keine Events verfügbar
          </h3>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Es gibt derzeit keine offenen Events für deine Bootsklasse(n).
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-8">
          {groupedEvents.map((group, index) => (
            <div key={index}>
              {/* Event Header (if multiple trainers) */}
              {group.trainers.length > 1 && (
                <div className={`mb-4 p-4 rounded-xl ${isDark ? 'bg-navy-800' : 'bg-light-card'}`}>
                  <h2 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                    {group.title}
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                    {formatDate(group.start_date)} - {formatDate(group.end_date)}
                    {group.location && ` | ${group.location}`}
                  </p>
                  <p className={`text-sm mt-2 ${isDark ? 'text-gold-400' : 'text-teal-600'}`}>
                    {group.trainers.length} Trainer bieten dieses Event an - wähle deinen Trainer
                  </p>
                </div>
              )}

              {/* Trainer Cards */}
              <div className={`grid ${group.trainers.length > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
                {group.trainers.map(trainer => (
                  <EventCard
                    key={trainer.id}
                    event={trainer}
                    showTrainer={group.trainers.length > 1}
                    onRegister={() => openRegistrationModal(trainer)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTrainer ? `Anmeldung: ${selectedTrainer.title}` : 'Anmeldung'}
      >
        {selectedTrainer && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Info */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-navy-800' : 'bg-light-card'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  {selectedTrainer.title}
                </span>
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: selectedTrainer.boat_class_color + '20', color: selectedTrainer.boat_class_color }}
                >
                  {selectedTrainer.boat_class_display_name}
                </span>
              </div>
              <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                {formatDate(selectedTrainer.start_date)} - {formatDate(selectedTrainer.end_date)}
                {selectedTrainer.location && ` | ${selectedTrainer.location}`}
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Trainer: {selectedTrainer.trainer_name}
              </p>
            </div>

            {/* Personal Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                    Vorname *
                  </label>
                  <input
                    type="text"
                    value={formData.sailor_first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, sailor_first_name: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      isDark
                        ? 'bg-navy-800 border-navy-700 text-cream'
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
                    value={formData.sailor_last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, sailor_last_name: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      isDark
                        ? 'bg-navy-800 border-navy-700 text-cream'
                        : 'bg-white border-light-border text-light-text'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                    Geburtsdatum *
                  </label>
                  <input
                    type="date"
                    value={formData.sailor_birth_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, sailor_birth_date: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      isDark
                        ? 'bg-navy-800 border-navy-700 text-cream'
                        : 'bg-white border-light-border text-light-text'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                    Segelnummer
                  </label>
                  <input
                    type="text"
                    value={formData.sail_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, sail_number: e.target.value }))}
                    placeholder="z.B. GER 12345"
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      isDark
                        ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                        : 'bg-white border-light-border text-light-text'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  E-Mail *
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  Telefon (optional)
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="+49 123 456789"
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
            </div>

            {/* Cost Warning */}
            <CostWarning
              hasCosts={selectedTrainer.has_costs}
              estimatedCost={selectedTrainer.estimated_cost}
              costDescription={selectedTrainer.cost_description}
              eventType={selectedTrainer.event_type}
              checked={formData.cost_confirmed}
              onChange={(checked) => setFormData(prev => ({ ...prev, cost_confirmed: checked }))}
              required={selectedTrainer.has_costs}
            />

            {/* Cancellation Warning */}
            <CancellationWarning
              cancellationDeadline={selectedTrainer.cancellation_deadline}
              cancellationFee={selectedTrainer.cancellation_fee}
              cancellationWarning={selectedTrainer.cancellation_warning}
              eventType={selectedTrainer.event_type}
              checked={formData.cancellation_acknowledged}
              onChange={(checked) => setFormData(prev => ({ ...prev, cancellation_acknowledged: checked }))}
              required={true}
            />

            {/* Disclaimer */}
            <label className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer ${
              isDark ? 'bg-navy-800 hover:bg-navy-700' : 'bg-light-card hover:bg-light-hover'
            }`}>
              <input
                type="checkbox"
                checked={formData.disclaimer_accepted}
                onChange={(e) => setFormData(prev => ({ ...prev, disclaimer_accepted: e.target.checked }))}
                className={`w-5 h-5 mt-0.5 rounded ${isDark ? 'bg-navy-900 border-cream/50' : 'border-gray-400'}`}
              />
              <span className={`text-sm ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Ich bestätige, dass die angegebenen Daten korrekt sind und ich die
                Teilnahmebedingungen des TSC akzeptiere.
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Wird gesendet...' : 'Anmelden'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default SailorEventListPage;
