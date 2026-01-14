import { useState } from 'react';
import { useTheme, GlassCard, Button, Modal, IconBadge, Icons, useToast } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { getBoatClassName, getMotorboatName } from '@tsc/data';
import { useData } from '../context/DataContext';
import { formatDate, formatDateRange } from '../utils/dateUtils';
import { EventForm } from '../components/forms/EventForm';

export function EventsPage() {
  const { isDark } = useTheme();
  const { profile } = useAuth();
  const { events, deleteEvent, isDeadlinePassed } = useData();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const currentBoatClassId = profile?.primary_boat_class;
  const isAdmin = profile?.role === 'admin';

  const myEvents = events.filter(e => e.boatClassId === currentBoatClassId);
  const deadlinePassed = isDeadlinePassed();
  const canEdit = !deadlinePassed || isAdmin;

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = async (event) => {
    if (confirm(`"${event.name}" wirklich löschen?`)) {
      try {
        await deleteEvent(event.id);
        addToast('Veranstaltung gelöscht', 'success');
      } catch (err) {
        addToast('Fehler beim Löschen', 'error');
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Meine Veranstaltungen
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Regatten und Trainingslager für {getBoatClassName(currentBoatClassId)}
          </p>
        </div>
        <Button
          onClick={() => { setEditingEvent(null); setShowForm(true); }}
          icon={Icons.plus}
          disabled={!canEdit}
        >
          Hinzufügen
        </Button>
      </div>

      {/* Events List */}
      {myEvents.length === 0 ? (
        <GlassCard className="text-center py-12">
          <div className="flex justify-center mb-4">
            <IconBadge icon={Icons.calendar} color="slate" size="lg" />
          </div>
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Noch keine Veranstaltungen
          </h3>
          <p className={`mb-4 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Füge deine erste Regatta oder dein erstes Trainingslager hinzu.
          </p>
          <Button
            onClick={() => setShowForm(true)}
            icon={Icons.plus}
            disabled={!canEdit}
          >
            Veranstaltung hinzufügen
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {myEvents.map(event => (
            <GlassCard key={event.id} className="p-4">
              <div className="flex items-start gap-4">
                <IconBadge
                  icon={event.type === 'regatta' ? Icons.trophy : Icons.mapPin}
                  color={event.type === 'regatta' ? 'amber' : 'emerald'}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                        {event.name}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                        {event.type === 'regatta' ? event.organizer : event.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(event)}
                        disabled={!canEdit}
                        className={`
                          w-8 h-8 rounded-lg flex items-center justify-center
                          ${canEdit
                            ? isDark
                              ? 'text-cream/60 hover:text-cream hover:bg-navy-700'
                              : 'text-light-muted hover:text-light-text hover:bg-light-border'
                            : 'opacity-50 cursor-not-allowed'}
                        `}
                      >
                        <span className="w-4 h-4">{Icons.edit}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(event)}
                        disabled={!canEdit}
                        className={`
                          w-8 h-8 rounded-lg flex items-center justify-center
                          ${canEdit
                            ? isDark
                              ? 'text-cream/60 hover:text-coral hover:bg-navy-700'
                              : 'text-light-muted hover:text-red-500 hover:bg-light-border'
                            : 'opacity-50 cursor-not-allowed'}
                        `}
                      >
                        <span className="w-4 h-4">{Icons.trash}</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <div className={`flex items-center gap-1.5 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                      <span className="w-4 h-4">{Icons.calendar}</span>
                      {formatDateRange(event.startDate, event.endDate)}
                    </div>
                    <div className={`flex items-center gap-1.5 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                      <span className="w-4 h-4">{Icons.boat}</span>
                      {getMotorboatName(event.requestedMotorboat)}
                    </div>
                    <div className={`flex items-center gap-1.5 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                      <span className="w-4 h-4">{Icons.clock}</span>
                      Verladung: {formatDate(event.motorboatLoadingTime?.split('T')[0])}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingEvent(null); }}
        title={editingEvent ? 'Veranstaltung bearbeiten' : 'Neue Veranstaltung'}
        size="md"
      >
        <EventForm
          onSuccess={handleFormSuccess}
          editEvent={editingEvent}
        />
      </Modal>
    </div>
  );
}

export default EventsPage;
