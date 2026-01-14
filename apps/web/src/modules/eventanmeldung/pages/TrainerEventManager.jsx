import { useState } from 'react';
import { useTheme, GlassCard, Button, Modal, Icons, useToast } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { useData } from '../context/DataContext';
import { EventCard } from '../components/EventCard';

/**
 * Format date for input field
 */
function formatDateForInput(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
}

/**
 * TrainerEventManager Page
 * Allows trainers to create and manage their events
 */
export function TrainerEventManagerPage() {
  const { isDark } = useTheme();
  const { addToast } = useToast();
  const { isTrainer, isAdmin } = useAuth();
  const {
    boatClasses,
    events,
    trainerBoatClasses,
    getMyTrainerEvents,
    createTrainerEvent,
    updateTrainerEvent,
    deleteTrainerEvent,
    getRegistrationsForTrainerEvent,
    loading,
  } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedView, setSelectedView] = useState('events'); // 'events' | 'registrations'

  // Form state
  const [formData, setFormData] = useState({
    sourceType: 'manual', // 'season' | 'manual'
    event_id: '',
    boat_class_id: '',
    title: '',
    event_type: 'regatta',
    start_date: '',
    end_date: '',
    location: '',
    description: '',
    has_costs: false,
    cost_description: '',
    estimated_cost: '',
    cancellation_deadline: '',
    cancellation_fee: '',
    cancellation_warning: '',
    max_participants: '',
  });

  const myEvents = getMyTrainerEvents();
  const availableBoatClasses = boatClasses.filter(bc =>
    trainerBoatClasses.includes(bc.id) || isAdmin
  );

  // Get upcoming events from Saisonplanung
  const upcomingSeasonEvents = events.filter(e => {
    const eventDate = new Date(e.start_date);
    const today = new Date();
    return eventDate >= today;
  });

  const resetForm = () => {
    setFormData({
      sourceType: 'manual',
      event_id: '',
      boat_class_id: '',
      title: '',
      event_type: 'regatta',
      start_date: '',
      end_date: '',
      location: '',
      description: '',
      has_costs: false,
      cost_description: '',
      estimated_cost: '',
      cancellation_deadline: '',
      cancellation_fee: '',
      cancellation_warning: '',
      max_participants: '',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setFormData({
      sourceType: event.event_id ? 'season' : 'manual',
      event_id: event.event_id || '',
      boat_class_id: event.boat_class_id,
      title: event.title || '',
      event_type: event.event_type || 'regatta',
      start_date: formatDateForInput(event.start_date),
      end_date: formatDateForInput(event.end_date),
      location: event.location || '',
      description: event.description || '',
      has_costs: event.has_costs || false,
      cost_description: event.cost_description || '',
      estimated_cost: event.estimated_cost || '',
      cancellation_deadline: formatDateForInput(event.cancellation_deadline),
      cancellation_fee: event.cancellation_fee || '',
      cancellation_warning: event.cancellation_warning || '',
      max_participants: event.max_participants || '',
    });
    setIsModalOpen(true);
  };

  const handleSeasonEventSelect = (eventId) => {
    const seasonEvent = events.find(e => e.id === eventId);
    if (seasonEvent) {
      setFormData(prev => ({
        ...prev,
        event_id: eventId,
        title: seasonEvent.name,
        event_type: seasonEvent.event_type || seasonEvent.type || 'regatta',
        start_date: formatDateForInput(seasonEvent.start_date),
        end_date: formatDateForInput(seasonEvent.end_date),
        location: seasonEvent.location || '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.boat_class_id) {
      addToast('Bitte wähle eine Bootsklasse', 'error');
      return;
    }

    if (formData.sourceType === 'manual' && !formData.title) {
      addToast('Bitte gib einen Titel an', 'error');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      addToast('Bitte gib Start- und Enddatum an', 'error');
      return;
    }

    try {
      const eventData = {
        boat_class_id: formData.boat_class_id,
        event_id: formData.sourceType === 'season' ? formData.event_id : null,
        title: formData.sourceType === 'manual' ? formData.title : null,
        event_type: formData.event_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        location: formData.location || null,
        description: formData.description || null,
        has_costs: formData.has_costs,
        cost_description: formData.has_costs ? formData.cost_description : null,
        estimated_cost: formData.has_costs && formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        cancellation_deadline: formData.cancellation_deadline || null,
        cancellation_fee: formData.cancellation_fee ? parseFloat(formData.cancellation_fee) : 0,
        cancellation_warning: formData.cancellation_warning || null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
      };

      if (editingEvent) {
        await updateTrainerEvent(editingEvent.id, eventData);
        addToast('Event aktualisiert', 'success');
      } else {
        await createTrainerEvent(eventData);
        addToast('Event erstellt', 'success');
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      addToast('Fehler beim Speichern', 'error');
    }
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Möchtest du "${event.title}" wirklich löschen?`)) {
      return;
    }

    try {
      await deleteTrainerEvent(event.id);
      addToast('Event gelöscht', 'success');
    } catch (err) {
      addToast('Fehler beim Löschen', 'error');
    }
  };

  if (!isTrainer && !isAdmin) {
    return (
      <div className="text-center py-12">
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Nur Trainer können Events verwalten.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Meine Events
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Erstelle und verwalte Events für deine Trainingsgruppe
          </p>
        </div>
        <Button onClick={openCreateModal} icon={Icons.plus}>
          Event erstellen
        </Button>
      </div>

      {/* View Toggle */}
      <div className={`inline-flex rounded-lg p-1 ${isDark ? 'bg-navy-800' : 'bg-light-card'}`}>
        <button
          onClick={() => setSelectedView('events')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedView === 'events'
              ? isDark ? 'bg-gold-400 text-navy-900' : 'bg-teal-500 text-white'
              : isDark ? 'text-cream/60 hover:text-cream' : 'text-light-muted hover:text-light-text'
          }`}
        >
          Events ({myEvents.length})
        </button>
        <button
          onClick={() => setSelectedView('registrations')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedView === 'registrations'
              ? isDark ? 'bg-gold-400 text-navy-900' : 'bg-teal-500 text-white'
              : isDark ? 'text-cream/60 hover:text-cream' : 'text-light-muted hover:text-light-text'
          }`}
        >
          Anmeldungen
        </button>
      </div>

      {/* Content */}
      {selectedView === 'events' ? (
        myEvents.length === 0 ? (
          <GlassCard className="text-center py-12">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDark ? 'bg-gold-400/10 text-gold-400' : 'bg-teal-500/10 text-teal-500'
            }`}>
              {Icons.calendar}
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Noch keine Events
            </h3>
            <p className={`mb-4 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Erstelle dein erstes Event für deine Trainingsgruppe
            </p>
            <Button onClick={openCreateModal} icon={Icons.plus}>
              Event erstellen
            </Button>
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                showTrainer={false}
                isTrainerView={true}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )
      ) : (
        // Registrations View
        <div className="space-y-6">
          {myEvents.map(event => {
            const registrations = getRegistrationsForTrainerEvent(event.id);
            if (registrations.length === 0) return null;

            return (
              <GlassCard key={event.id}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  {event.title} - {event.boat_class_display_name}
                </h3>
                <div className="space-y-2">
                  {registrations.map(reg => (
                    <div
                      key={reg.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isDark ? 'bg-navy-800' : 'bg-light-hover'
                      }`}
                    >
                      <div>
                        <span className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                          {reg.sailor_first_name} {reg.sailor_last_name}
                        </span>
                        <span className={`ml-2 text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                          ({reg.contact_email})
                        </span>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded ${
                        reg.status === 'angemeldet'
                          ? 'bg-blue-500/20 text-blue-400'
                          : reg.status === 'bestaetigt'
                            ? 'bg-green-500/20 text-green-400'
                            : reg.status === 'abgesagt'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {reg.status}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            );
          })}
          {myEvents.every(e => getRegistrationsForTrainerEvent(e.id).length === 0) && (
            <GlassCard className="text-center py-12">
              <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
                Noch keine Anmeldungen vorhanden
              </p>
            </GlassCard>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEvent ? 'Event bearbeiten' : 'Neues Event erstellen'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Source Toggle */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Event-Quelle
            </label>
            <div className={`grid grid-cols-2 gap-2 p-1 rounded-lg ${isDark ? 'bg-navy-800' : 'bg-light-card'}`}>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, sourceType: 'season', event_id: '', title: '' }))}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  formData.sourceType === 'season'
                    ? isDark ? 'bg-gold-400 text-navy-900' : 'bg-teal-500 text-white'
                    : isDark ? 'text-cream/60' : 'text-light-muted'
                }`}
              >
                Aus Saisonplanung
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, sourceType: 'manual', event_id: '' }))}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  formData.sourceType === 'manual'
                    ? isDark ? 'bg-gold-400 text-navy-900' : 'bg-teal-500 text-white'
                    : isDark ? 'text-cream/60' : 'text-light-muted'
                }`}
              >
                Neues Event
              </button>
            </div>
          </div>

          {/* Season Event Select */}
          {formData.sourceType === 'season' && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Event aus Saisonplanung *
              </label>
              <select
                value={formData.event_id}
                onChange={(e) => handleSeasonEventSelect(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              >
                <option value="">Bitte wählen...</option>
                {upcomingSeasonEvents.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({new Date(e.start_date).toLocaleDateString('de-DE')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Manual Title */}
          {formData.sourceType === 'manual' && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Event-Titel *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="z.B. Frühjahrstrainingslager Gardasee"
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                    : 'bg-white border-light-border text-light-text'
                }`}
              />
            </div>
          )}

          {/* Boat Class */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Bootsklasse *
            </label>
            <select
              value={formData.boat_class_id}
              onChange={(e) => setFormData(prev => ({ ...prev, boat_class_id: e.target.value }))}
              className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream'
                  : 'bg-white border-light-border text-light-text'
              }`}
            >
              <option value="">Bitte wählen...</option>
              {availableBoatClasses.map(bc => (
                <option key={bc.id} value={bc.id}>
                  {bc.display_name || bc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Event Type */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Event-Typ
            </label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
              className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream'
                  : 'bg-white border-light-border text-light-text'
              }`}
            >
              <option value="regatta">Regatta</option>
              <option value="trainingslager">Trainingslager</option>
              <option value="training">Training</option>
              <option value="sonstiges">Sonstiges</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Start *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Ende *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Ort
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="z.B. Gardasee, Italien"
              className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                  : 'bg-white border-light-border text-light-text'
              }`}
            />
          </div>

          {/* Cost Toggle */}
          <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'}`}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.has_costs}
                onChange={(e) => setFormData(prev => ({ ...prev, has_costs: e.target.checked }))}
                className={`w-5 h-5 rounded ${isDark ? 'bg-navy-900 border-amber-400' : 'border-amber-500'}`}
              />
              <span className={`font-medium ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                Kostenpflichtig (besonders wichtig bei Trainingslagern)
              </span>
            </label>

            {formData.has_costs && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                    Geschätzte Kosten (EUR)
                  </label>
                  <input
                    type="number"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_cost: e.target.value }))}
                    placeholder="z.B. 350"
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      isDark
                        ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                        : 'bg-white border-light-border text-light-text'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                    Kosten-Details
                  </label>
                  <textarea
                    value={formData.cost_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost_description: e.target.value }))}
                    rows={2}
                    placeholder="z.B. Unterkunft, Verpflegung, Anreise..."
                    className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${
                      isDark
                        ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                        : 'bg-white border-light-border text-light-text'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cancellation Settings */}
          <div className={`p-4 rounded-xl ${isDark ? 'bg-navy-800' : 'bg-light-card'}`}>
            <h4 className={`font-medium mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Stornobedingungen
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                    Storno-Frist bis
                  </label>
                  <input
                    type="date"
                    value={formData.cancellation_deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, cancellation_deadline: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      isDark
                        ? 'bg-navy-900 border-navy-700 text-cream'
                        : 'bg-white border-light-border text-light-text'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                    Stornogebühr (EUR)
                  </label>
                  <input
                    type="number"
                    value={formData.cancellation_fee}
                    onChange={(e) => setFormData(prev => ({ ...prev, cancellation_fee: e.target.value }))}
                    placeholder="0"
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      isDark
                        ? 'bg-navy-900 border-navy-700 text-cream placeholder:text-cream/30'
                        : 'bg-white border-light-border text-light-text'
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  Storno-Hinweis
                </label>
                <textarea
                  value={formData.cancellation_warning}
                  onChange={(e) => setFormData(prev => ({ ...prev, cancellation_warning: e.target.value }))}
                  rows={2}
                  placeholder="z.B. Nach dem 15.03. ist keine Stornierung mehr möglich"
                  className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${
                    isDark
                      ? 'bg-navy-900 border-navy-700 text-cream placeholder:text-cream/30'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Max Participants */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Max. Teilnehmer (optional)
            </label>
            <input
              type="number"
              value={formData.max_participants}
              onChange={(e) => setFormData(prev => ({ ...prev, max_participants: e.target.value }))}
              placeholder="Kein Limit"
              className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                  : 'bg-white border-light-border text-light-text'
              }`}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Speichern...' : editingEvent ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TrainerEventManagerPage;
