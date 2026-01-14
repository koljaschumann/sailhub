import { useState } from 'react';
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

export function AdminPage() {
  const { isDark } = useTheme();
  const { addToast } = useToast();
  const { events, registrations, boatClasses, updateRegistrationStatus, addEvent } = useData();

  const [activeTab, setActiveTab] = useState('registrations');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [eventModalOpen, setEventModalOpen] = useState(false);

  // New event form state
  const [newEvent, setNewEvent] = useState({
    name: '',
    location: '',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    event_type: 'regatta',
    is_championship: false,
    championship_level: '',
    external_url: '',
  });

  const filteredRegistrations = registrations.filter(r => {
    if (filterEvent && r.event_id !== filterEvent) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleStatusChange = async (registrationId, newStatus) => {
    await updateRegistrationStatus(registrationId, newStatus);
    addToast(`Status geändert auf "${STATUS_LABELS[newStatus]}"`, 'success');
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();

    if (!newEvent.name || !newEvent.start_date || !newEvent.end_date) {
      addToast('Bitte fülle alle Pflichtfelder aus', 'error');
      return;
    }

    await addEvent({
      ...newEvent,
      is_championship: newEvent.is_championship,
      championship_level: newEvent.is_championship ? newEvent.championship_level : null,
    });

    addToast('Event wurde erstellt', 'success');
    setEventModalOpen(false);
    setNewEvent({
      name: '',
      location: '',
      start_date: '',
      end_date: '',
      registration_deadline: '',
      event_type: 'regatta',
      is_championship: false,
      championship_level: '',
      external_url: '',
    });
  };

  const getEventStats = (eventId) => {
    const eventRegs = registrations.filter(r => r.event_id === eventId);
    return {
      total: eventRegs.length,
      angemeldet: eventRegs.filter(r => r.status === 'angemeldet').length,
      bestaetigt: eventRegs.filter(r => r.status === 'bestaetigt').length,
      abgesagt: eventRegs.filter(r => r.status === 'abgesagt').length,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Verwaltung
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Events und Anmeldungen verwalten
          </p>
        </div>
        <Button onClick={() => setEventModalOpen(true)} icon={Icons.plus}>
          Neues Event
        </Button>
      </div>

      {/* Tabs */}
      <div className={`flex gap-2 border-b ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
        <button
          onClick={() => setActiveTab('registrations')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'registrations'
              ? isDark
                ? 'border-gold-400 text-gold-400'
                : 'border-teal-500 text-teal-600'
              : isDark
                ? 'border-transparent text-cream/60 hover:text-cream'
                : 'border-transparent text-light-muted hover:text-light-text'
          }`}
        >
          Anmeldungen ({registrations.length})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'events'
              ? isDark
                ? 'border-gold-400 text-gold-400'
                : 'border-teal-500 text-teal-600'
              : isDark
                ? 'border-transparent text-cream/60 hover:text-cream'
                : 'border-transparent text-light-muted hover:text-light-text'
          }`}
        >
          Events ({events.length})
        </button>
      </div>

      {/* Registrations Tab */}
      {activeTab === 'registrations' && (
        <div className="space-y-4">
          {/* Filters */}
          <GlassCard className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className={`block text-xs mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Event
              </label>
              <select
                value={filterEvent}
                onChange={(e) => setFilterEvent(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              >
                <option value="">Alle Events</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className={`block text-xs mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              >
                <option value="">Alle Status</option>
                <option value="angemeldet">Angemeldet</option>
                <option value="bestaetigt">Bestätigt</option>
                <option value="abgesagt">Abgesagt</option>
                <option value="teilgenommen">Teilgenommen</option>
              </select>
            </div>
          </GlassCard>

          {/* Registrations List */}
          {filteredRegistrations.length > 0 ? (
            <div className="space-y-3">
              {filteredRegistrations.map(registration => (
                <GlassCard key={registration.id}>
                  <div className="flex items-start gap-4">
                    <IconBadge
                      icon={Icons.user}
                      color={STATUS_COLORS[registration.status]}
                      size="md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                          {registration.sailor_first_name} {registration.sailor_last_name}
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
                      </div>

                      <p className={`text-sm ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                        {registration.event?.name}
                        {registration.boat_class && ` • ${registration.boat_class.display_name}`}
                        {registration.sail_number && ` (${registration.sail_number})`}
                      </p>

                      <div className={`flex items-center gap-4 mt-2 text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                        <span>{registration.contact_email}</span>
                        {registration.contact_phone && <span>{registration.contact_phone}</span>}
                        <span>Angemeldet: {formatDate(registration.created_at)}</span>
                      </div>

                      {registration.crew_members?.length > 0 && (
                        <div className={`mt-2 text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                          Crew: {registration.crew_members.map(m => `${m.first_name} ${m.last_name}`).join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={registration.status}
                        onChange={(e) => handleStatusChange(registration.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm border ${
                          isDark
                            ? 'bg-navy-800 border-navy-700 text-cream'
                            : 'bg-white border-light-border text-light-text'
                        }`}
                      >
                        <option value="angemeldet">Angemeldet</option>
                        <option value="bestaetigt">Bestätigt</option>
                        <option value="abgesagt">Abgesagt</option>
                        <option value="teilgenommen">Teilgenommen</option>
                      </select>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard className="text-center py-12">
              <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
                Keine Anmeldungen gefunden
              </p>
            </GlassCard>
          )}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {events.map(event => {
            const stats = getEventStats(event.id);
            return (
              <GlassCard key={event.id}>
                <div className="flex items-start gap-4">
                  <IconBadge
                    icon={event.event_type === 'trainingslager' ? Icons.users : Icons.trophy}
                    color={event.is_championship ? 'gold' : 'blue'}
                    size="lg"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                        {event.name}
                      </h3>
                      {event.is_championship && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          isDark ? 'bg-gold-400/20 text-gold-400' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {event.championship_level === 'deutsche_meisterschaft' ? 'DM' : 'LM'}
                        </span>
                      )}
                    </div>

                    <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                      <span>{formatDate(event.start_date)} - {formatDate(event.end_date)}</span>
                      {event.location && <span>{event.location}</span>}
                    </div>

                    <div className={`flex items-center gap-4 mt-3 text-sm`}>
                      <span className={isDark ? 'text-cream/80' : 'text-light-text'}>
                        <strong>{stats.total}</strong> Anmeldungen
                      </span>
                      <span className="text-blue-400">{stats.angemeldet} offen</span>
                      <span className="text-emerald-400">{stats.bestaetigt} bestätigt</span>
                      <span className="text-red-400">{stats.abgesagt} abgesagt</span>
                    </div>
                  </div>

                  <div className={`text-right text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                    <p>Anmeldeschluss:</p>
                    <p className="font-medium">
                      {event.registration_deadline ? formatDate(event.registration_deadline) : '-'}
                    </p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* New Event Modal */}
      <Modal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title="Neues Event erstellen"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Name *
            </label>
            <input
              type="text"
              value={newEvent.name}
              onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="z.B. Frühjahrsregatta"
              className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                  : 'bg-white border-light-border text-light-text'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Ort
            </label>
            <input
              type="text"
              value={newEvent.location}
              onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
              placeholder="z.B. Tegeler See"
              className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                  : 'bg-white border-light-border text-light-text'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Startdatum *
              </label>
              <input
                type="date"
                value={newEvent.start_date}
                onChange={(e) => setNewEvent(prev => ({ ...prev, start_date: e.target.value }))}
                required
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Enddatum *
              </label>
              <input
                type="date"
                value={newEvent.end_date}
                onChange={(e) => setNewEvent(prev => ({ ...prev, end_date: e.target.value }))}
                required
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Anmeldeschluss
            </label>
            <input
              type="date"
              value={newEvent.registration_deadline}
              onChange={(e) => setNewEvent(prev => ({ ...prev, registration_deadline: e.target.value }))}
              className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream'
                  : 'bg-white border-light-border text-light-text'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Event-Typ
              </label>
              <select
                value={newEvent.event_type}
                onChange={(e) => setNewEvent(prev => ({ ...prev, event_type: e.target.value }))}
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
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Externe URL
              </label>
              <input
                type="url"
                value={newEvent.external_url}
                onChange={(e) => setNewEvent(prev => ({ ...prev, external_url: e.target.value }))}
                placeholder="https://..."
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                    : 'bg-white border-light-border text-light-text'
                }`}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={newEvent.is_championship}
                onChange={(e) => setNewEvent(prev => ({
                  ...prev,
                  is_championship: e.target.checked,
                  championship_level: e.target.checked ? 'landesmeisterschaft' : '',
                }))}
                className={`w-5 h-5 rounded ${isDark ? 'bg-navy-700' : 'bg-white'}`}
              />
              <span className={`text-sm ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Meisterschaft
              </span>
            </label>

            {newEvent.is_championship && (
              <select
                value={newEvent.championship_level}
                onChange={(e) => setNewEvent(prev => ({ ...prev, championship_level: e.target.value }))}
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              >
                <option value="landesmeisterschaft">Landesmeisterschaft</option>
                <option value="deutsche_meisterschaft">Deutsche Meisterschaft</option>
                <option value="internationale_meisterschaft">Internationale Meisterschaft</option>
              </select>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => setEventModalOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" icon={Icons.check}>
              Event erstellen
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminPage;
