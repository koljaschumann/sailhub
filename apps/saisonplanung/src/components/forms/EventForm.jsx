import { useState } from 'react';
import { useTheme, Button, Icons, useToast } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { motorboats, getMotorboatsSortedByPriority } from '@tsc/data';
import { useData } from '../../context/DataContext';

export function EventForm({ onSuccess, editEvent = null }) {
  const { isDark } = useTheme();
  const { profile } = useAuth();
  const { addEvent, updateEvent, isDeadlinePassed } = useData();
  const { addToast } = useToast();

  const currentBoatClassId = profile?.primary_boat_class;
  const isAdmin = profile?.role === 'admin';

  const [formData, setFormData] = useState({
    type: editEvent?.type || 'regatta',
    name: editEvent?.name || '',
    organizer: editEvent?.organizer || '',
    location: editEvent?.location || '',
    startDate: editEvent?.startDate || '',
    endDate: editEvent?.endDate || '',
    motorboatLoadingDate: editEvent?.motorboatLoadingTime?.split('T')[0] || '',
    motorboatLoadingTime: editEvent?.motorboatLoadingTime?.split('T')[1]?.slice(0, 5) || '08:00',
    requestedMotorboat: editEvent?.requestedMotorboat || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deadlinePassed = isDeadlinePassed();
  const canEdit = !deadlinePassed || isAdmin;

  // Motorboote sortiert nach Priorität für die aktuelle Bootsklasse
  const sortedMotorboats = currentBoatClassId
    ? getMotorboatsSortedByPriority(currentBoatClassId)
    : motorboats;

  const inputClass = `
    w-full px-3 py-2 rounded-lg border text-sm
    ${isDark
      ? 'bg-navy-700 border-navy-600 text-cream placeholder-cream/40'
      : 'bg-white border-light-border text-light-text placeholder-light-muted'}
    focus:outline-none focus:ring-2
    ${isDark ? 'focus:ring-gold-400' : 'focus:ring-teal-400'}
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-cream/80' : 'text-light-muted'}`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Startdatum ist erforderlich';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Enddatum ist erforderlich';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'Enddatum muss nach Startdatum liegen';
    }

    if (!formData.motorboatLoadingDate) {
      newErrors.motorboatLoadingDate = 'Verladedatum ist erforderlich';
    }

    if (!formData.requestedMotorboat) {
      newErrors.requestedMotorboat = 'Bitte Motorboot auswählen';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canEdit) {
      addToast('Die Eingabefrist ist abgelaufen', 'error');
      return;
    }

    if (!validate()) {
      addToast('Bitte alle Pflichtfelder ausfüllen', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const eventData = {
        type: formData.type,
        name: formData.name.trim(),
        boatClassId: currentBoatClassId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        motorboatLoadingTime: `${formData.motorboatLoadingDate}T${formData.motorboatLoadingTime}`,
        requestedMotorboat: formData.requestedMotorboat,
        ...(formData.type === 'regatta'
          ? { organizer: formData.organizer.trim() }
          : { location: formData.location.trim() })
      };

      if (editEvent) {
        await updateEvent(editEvent.id, eventData);
        addToast('Veranstaltung aktualisiert', 'success');
      } else {
        await addEvent(eventData);
        addToast('Veranstaltung hinzugefügt', 'success');
      }

      onSuccess?.();
    } catch (err) {
      addToast('Fehler beim Speichern', 'error');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Event Type Toggle */}
      <div>
        <label className={labelClass}>Art der Veranstaltung</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleChange({ target: { name: 'type', value: 'regatta' } })}
            className={`
              flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
              flex items-center justify-center gap-2
              ${formData.type === 'regatta'
                ? isDark
                  ? 'bg-gold-400/20 text-gold-400 border border-gold-400/30'
                  : 'bg-teal-100 text-teal-700 border border-teal-300'
                : isDark
                  ? 'bg-navy-800 text-cream/60 border border-navy-700 hover:text-cream'
                  : 'bg-white text-light-muted border border-light-border hover:text-light-text'}
            `}
          >
            <span className="w-4 h-4">{Icons.trophy}</span>
            Regatta
          </button>
          <button
            type="button"
            onClick={() => handleChange({ target: { name: 'type', value: 'trainingslager' } })}
            className={`
              flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
              flex items-center justify-center gap-2
              ${formData.type === 'trainingslager'
                ? isDark
                  ? 'bg-gold-400/20 text-gold-400 border border-gold-400/30'
                  : 'bg-teal-100 text-teal-700 border border-teal-300'
                : isDark
                  ? 'bg-navy-800 text-cream/60 border border-navy-700 hover:text-cream'
                  : 'bg-white text-light-muted border border-light-border hover:text-light-text'}
            `}
          >
            <span className="w-4 h-4">{Icons.mapPin}</span>
            Trainingslager
          </button>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className={labelClass}>
          {formData.type === 'regatta' ? 'Regattaname' : 'Bezeichnung'} *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={!canEdit}
          className={inputClass}
          placeholder={formData.type === 'regatta' ? 'z.B. Berliner Opti-Cup' : 'z.B. Ostertrainingslager Greifswald'}
        />
        {errors.name && <p className="mt-1 text-xs text-coral">{errors.name}</p>}
      </div>

      {/* Organizer (Regatta) or Location (Trainingslager) */}
      {formData.type === 'regatta' ? (
        <div>
          <label className={labelClass}>Ausrichter / Veranstalter</label>
          <input
            type="text"
            name="organizer"
            value={formData.organizer}
            onChange={handleChange}
            disabled={!canEdit}
            className={inputClass}
            placeholder="z.B. Berliner Yacht-Club"
          />
        </div>
      ) : (
        <div>
          <label className={labelClass}>Ort</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            disabled={!canEdit}
            className={inputClass}
            placeholder="z.B. Greifswald"
          />
        </div>
      )}

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Startdatum *</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            disabled={!canEdit}
            className={inputClass}
          />
          {errors.startDate && <p className="mt-1 text-xs text-coral">{errors.startDate}</p>}
        </div>
        <div>
          <label className={labelClass}>Enddatum *</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            disabled={!canEdit}
            className={inputClass}
          />
          {errors.endDate && <p className="mt-1 text-xs text-coral">{errors.endDate}</p>}
        </div>
      </div>

      {/* Motorboat Loading */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}`}>
        <h3 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          <span className="w-4 h-4">{Icons.boat}</span>
          Motorboot-Verladung
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>Verladedatum *</label>
            <input
              type="date"
              name="motorboatLoadingDate"
              value={formData.motorboatLoadingDate}
              onChange={handleChange}
              disabled={!canEdit}
              className={inputClass}
            />
            {errors.motorboatLoadingDate && <p className="mt-1 text-xs text-coral">{errors.motorboatLoadingDate}</p>}
          </div>
          <div>
            <label className={labelClass}>Uhrzeit</label>
            <input
              type="time"
              name="motorboatLoadingTime"
              value={formData.motorboatLoadingTime}
              onChange={handleChange}
              disabled={!canEdit}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Gewünschtes Motorboot *</label>
          <select
            name="requestedMotorboat"
            value={formData.requestedMotorboat}
            onChange={handleChange}
            disabled={!canEdit}
            className={inputClass}
          >
            <option value="">Bitte wählen...</option>
            {sortedMotorboats.map(boat => {
              const hasPriority = boat.priority.includes(currentBoatClassId);
              return (
                <option key={boat.id} value={boat.id}>
                  {boat.name} {hasPriority ? '⭐' : ''} - {boat.description}
                </option>
              );
            })}
          </select>
          {errors.requestedMotorboat && <p className="mt-1 text-xs text-coral">{errors.requestedMotorboat}</p>}

          {(currentBoatClassId === '29er' || currentBoatClassId === 'j70') && (
            <p className={`mt-2 text-xs ${isDark ? 'text-gold-400/80' : 'text-teal-600'}`}>
              ⭐ = Priorisiertes Boot für deine Klasse
            </p>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1" disabled={!canEdit || isSubmitting}>
          {isSubmitting ? 'Speichern...' : editEvent ? 'Speichern' : 'Hinzufügen'}
        </Button>
      </div>

      {!canEdit && (
        <p className={`text-sm text-center ${isDark ? 'text-coral' : 'text-red-500'}`}>
          Die Eingabefrist ist abgelaufen. Nur Admins können noch Änderungen vornehmen.
        </p>
      )}
    </form>
  );
}

export default EventForm;
