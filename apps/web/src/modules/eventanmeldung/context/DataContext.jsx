import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, useAuth } from '@tsc/supabase';

/**
 * @typedef {'regatta' | 'training' | 'trainingslager' | 'sonstiges'} EventType
 * @typedef {'landesmeisterschaft' | 'deutsche_meisterschaft' | 'internationale_meisterschaft'} ChampionshipLevel
 * @typedef {'angemeldet' | 'bestaetigt' | 'abgesagt' | 'teilgenommen'} RegistrationStatus
 * @typedef {'steuermann' | 'vorschoter' | 'crew'} CrewRole
 *
 * @typedef {Object} BoatClass
 * @property {string} id
 * @property {string} name
 * @property {string} display_name
 * @property {string} color
 * @property {number} crew_size
 * @property {number} [min_age]
 * @property {number} [max_age]
 * @property {boolean} active
 *
 * @typedef {Object} Event
 * @property {string} id
 * @property {string} name
 * @property {string} [location]
 * @property {string} start_date
 * @property {string} end_date
 * @property {string} [registration_deadline]
 * @property {EventType} event_type
 * @property {boolean} is_championship
 * @property {ChampionshipLevel} [championship_level]
 * @property {string} [external_url]
 * @property {boolean} active
 *
 * @typedef {Object} TrainerEvent
 * @property {string} id
 * @property {string} trainer_id
 * @property {string} trainer_name
 * @property {string} boat_class_id
 * @property {string} boat_class_name
 * @property {string} boat_class_display_name
 * @property {string} boat_class_color
 * @property {string} [event_id]
 * @property {string} title
 * @property {EventType} event_type
 * @property {string} start_date
 * @property {string} end_date
 * @property {string} [location]
 * @property {string} [description]
 * @property {boolean} has_costs
 * @property {string} [cost_description]
 * @property {number} [estimated_cost]
 * @property {string} [cancellation_deadline]
 * @property {number} [cancellation_fee]
 * @property {string} [cancellation_warning]
 * @property {boolean} registration_open
 * @property {number} [max_participants]
 * @property {number} registration_count
 *
 * @typedef {Object} CrewMember
 * @property {string} [id]
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} [birth_date]
 * @property {CrewRole} role
 *
 * @typedef {Object} EventRegistration
 * @property {string} id
 * @property {string} event_id
 * @property {Event} [event]
 * @property {string} [trainer_event_id]
 * @property {TrainerEvent} [trainer_event]
 * @property {string} sailor_first_name
 * @property {string} sailor_last_name
 * @property {string} sailor_birth_date
 * @property {string} [boat_class_id]
 * @property {BoatClass} [boat_class]
 * @property {string} [sail_number]
 * @property {string} contact_email
 * @property {string} [contact_phone]
 * @property {CrewMember[]} [crew_members]
 * @property {boolean} disclaimer_accepted
 * @property {boolean} cost_confirmed
 * @property {boolean} cancellation_acknowledged
 * @property {RegistrationStatus} status
 * @property {string} created_at
 */

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user, isTrainer, isAdmin } = useAuth();
  const [boatClasses, setBoatClasses] = useState([]);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [trainerEvents, setTrainerEvents] = useState([]);
  const [myBoatClasses, setMyBoatClasses] = useState([]);
  const [trainerBoatClasses, setTrainerBoatClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =============================================
  // Daten aus Supabase laden
  // =============================================

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Bootsklassen laden
      const { data: boatClassesData, error: boatClassesError } = await supabase
        .from('boat_classes')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (boatClassesError) throw boatClassesError;
      setBoatClasses(boatClassesData || []);

      // Events aus Saisonplanung laden
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('active', true)
        .order('start_date', { ascending: true });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Trainer-Events aus der View laden (alle offenen)
      const { data: trainerEventsData, error: trainerEventsError } = await supabase
        .from('trainer_events_full')
        .select('*')
        .eq('registration_open', true)
        .order('start_date', { ascending: true });

      if (trainerEventsError) throw trainerEventsError;
      setTrainerEvents(trainerEventsData || []);

      // Anmeldungen laden (mit trainer_event Info)
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('event_registrations')
        .select(`
          *,
          event:events(*),
          boat_class:boat_classes(*)
        `)
        .order('created_at', { ascending: false });

      if (registrationsError) throw registrationsError;
      setRegistrations(registrationsData || []);

      // Wenn Benutzer eingeloggt: eigene Bootsklassen laden
      if (user) {
        const { data: myBoatClassesData } = await supabase
          .from('sailor_boat_classes')
          .select('boat_class_id')
          .eq('sailor_id', user.id);

        setMyBoatClasses(myBoatClassesData?.map(bc => bc.boat_class_id) || []);

        // Wenn Trainer: Trainer-Bootsklassen laden
        if (isTrainer || isAdmin) {
          const { data: trainerBCData } = await supabase
            .from('trainer_boat_classes')
            .select('boat_class_id')
            .eq('trainer_id', user.id);

          setTrainerBoatClasses(trainerBCData?.map(bc => bc.boat_class_id) || []);
        }
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, isTrainer, isAdmin]);

  // Daten beim Start laden
  useEffect(() => {
    loadData();
  }, [loadData]);

  // =============================================
  // Hilfsfunktionen
  // =============================================

  /**
   * Get boat class by ID
   */
  const getBoatClass = (id) => {
    return boatClasses.find(bc => bc.id === id);
  };

  /**
   * Get event by ID
   */
  const getEvent = (id) => {
    return events.find(e => e.id === id);
  };

  /**
   * Get active events (upcoming or within registration deadline)
   */
  const getActiveEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(e => e.active && e.start_date >= today);
  };

  // =============================================
  // Trainer-Events Funktionen
  // =============================================

  /**
   * Get trainer events for a specific boat class
   */
  const getTrainerEventsForBoatClass = (boatClassId) => {
    return trainerEvents.filter(te => te.boat_class_id === boatClassId);
  };

  /**
   * Get trainer events available for the current sailor (based on their boat classes)
   */
  const getSailorAvailableEvents = () => {
    if (myBoatClasses.length === 0) return trainerEvents;
    return trainerEvents.filter(te => myBoatClasses.includes(te.boat_class_id));
  };

  /**
   * Get events grouped by event (title + date) for showing multiple trainer options
   */
  const getEventsGroupedByEvent = () => {
    const availableEvents = getSailorAvailableEvents();
    const grouped = {};

    availableEvents.forEach(te => {
      const key = `${te.title}_${te.start_date}`;
      if (!grouped[key]) {
        grouped[key] = {
          title: te.title,
          event_type: te.event_type,
          start_date: te.start_date,
          end_date: te.end_date,
          location: te.location,
          trainers: [],
        };
      }
      grouped[key].trainers.push(te);
    });

    return Object.values(grouped).sort((a, b) =>
      new Date(a.start_date) - new Date(b.start_date)
    );
  };

  /**
   * Get my trainer events (for trainers to manage)
   */
  const getMyTrainerEvents = () => {
    if (!user) return [];
    return trainerEvents.filter(te => te.trainer_id === user.id);
  };

  /**
   * Create a new trainer event
   */
  const createTrainerEvent = async (eventData) => {
    if (!user || (!isTrainer && !isAdmin)) {
      throw new Error('Nur Trainer können Events erstellen');
    }

    try {
      const { data, error } = await supabase
        .from('trainer_events')
        .insert({
          trainer_id: user.id,
          boat_class_id: eventData.boat_class_id,
          event_id: eventData.event_id || null,
          title: eventData.title || null,
          event_type: eventData.event_type || 'regatta',
          start_date: eventData.start_date,
          end_date: eventData.end_date,
          location: eventData.location || null,
          description: eventData.description || null,
          has_costs: eventData.has_costs || false,
          cost_description: eventData.cost_description || null,
          estimated_cost: eventData.estimated_cost || null,
          cancellation_deadline: eventData.cancellation_deadline || null,
          cancellation_fee: eventData.cancellation_fee || 0,
          cancellation_warning: eventData.cancellation_warning || null,
          registration_open: true,
          max_participants: eventData.max_participants || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Reload to get the full view data
      await loadData();
      return data;

    } catch (err) {
      console.error('Error creating trainer event:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update a trainer event
   */
  const updateTrainerEvent = async (eventId, updates) => {
    try {
      const { error } = await supabase
        .from('trainer_events')
        .update(updates)
        .eq('id', eventId);

      if (error) throw error;

      await loadData();
    } catch (err) {
      console.error('Error updating trainer event:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Delete a trainer event
   */
  const deleteTrainerEvent = async (eventId) => {
    try {
      const { error } = await supabase
        .from('trainer_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setTrainerEvents(prev => prev.filter(te => te.id !== eventId));
    } catch (err) {
      console.error('Error deleting trainer event:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Register for a trainer event (with cost and cancellation confirmations)
   */
  const registerForTrainerEvent = async (registration) => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          trainer_event_id: registration.trainer_event_id,
          event_id: registration.event_id || null,
          sailor_first_name: registration.sailor_first_name,
          sailor_last_name: registration.sailor_last_name,
          sailor_birth_date: registration.sailor_birth_date,
          boat_class_id: registration.boat_class_id || null,
          sail_number: registration.sail_number || null,
          contact_email: registration.contact_email,
          contact_phone: registration.contact_phone || null,
          disclaimer_accepted: registration.disclaimer_accepted,
          disclaimer_accepted_at: new Date().toISOString(),
          cost_confirmed: registration.cost_confirmed || false,
          cost_confirmed_at: registration.cost_confirmed ? new Date().toISOString() : null,
          cancellation_acknowledged: registration.cancellation_acknowledged || false,
          cancellation_acknowledged_at: registration.cancellation_acknowledged ? new Date().toISOString() : null,
          status: 'angemeldet',
          user_id: user?.id || null,
        })
        .select(`
          *,
          event:events(*),
          boat_class:boat_classes(*)
        `)
        .single();

      if (error) throw error;

      setRegistrations(prev => [data, ...prev]);
      await loadData(); // Refresh to update registration counts
      return data;

    } catch (err) {
      console.error('Error registering for trainer event:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get registrations for a specific trainer event
   */
  const getRegistrationsForTrainerEvent = (trainerEventId) => {
    return registrations.filter(r => r.trainer_event_id === trainerEventId);
  };

  // =============================================
  // Anmeldungen
  // =============================================

  /**
   * Add a new registration
   */
  const addRegistration = async (registration) => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: registration.event_id,
          sailor_first_name: registration.sailor_first_name,
          sailor_last_name: registration.sailor_last_name,
          sailor_birth_date: registration.sailor_birth_date,
          boat_class_id: registration.boat_class_id || null,
          sail_number: registration.sail_number || null,
          contact_email: registration.contact_email,
          contact_phone: registration.contact_phone || null,
          crew_members: registration.crew_members || [],
          disclaimer_accepted: registration.disclaimer_accepted,
          disclaimer_accepted_at: new Date().toISOString(),
          status: 'angemeldet',
        })
        .select(`
          *,
          event:events(*),
          boat_class:boat_classes(*)
        `)
        .single();

      if (error) throw error;

      setRegistrations(prev => [data, ...prev]);
      return data;

    } catch (err) {
      console.error('Error adding registration:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel a registration
   */
  const cancelRegistration = async (registrationId, reason) => {
    try {
      const registration = registrations.find(r => r.id === registrationId);
      if (!registration) return;

      const event = registration.event || getEvent(registration.event_id);
      const sixWeeksBefore = new Date(event.start_date);
      sixWeeksBefore.setDate(sixWeeksBefore.getDate() - 42);

      const cancellationCostApplicable = new Date() > sixWeeksBefore;

      const { error } = await supabase
        .from('event_registrations')
        .update({
          status: 'abgesagt',
          cancellation_date: new Date().toISOString(),
          cancellation_reason: reason,
          cancellation_cost_applicable: cancellationCostApplicable,
        })
        .eq('id', registrationId);

      if (error) throw error;

      setRegistrations(prev =>
        prev.map(r =>
          r.id === registrationId
            ? {
                ...r,
                status: 'abgesagt',
                cancellation_date: new Date().toISOString(),
                cancellation_reason: reason,
                cancellation_cost_applicable: cancellationCostApplicable,
              }
            : r
        )
      );
    } catch (err) {
      console.error('Error cancelling registration:', err);
      setError(err.message);
    }
  };

  /**
   * Update registration status (admin)
   */
  const updateRegistrationStatus = async (registrationId, status) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({ status })
        .eq('id', registrationId);

      if (error) throw error;

      setRegistrations(prev =>
        prev.map(r =>
          r.id === registrationId ? { ...r, status } : r
        )
      );
    } catch (err) {
      console.error('Error updating registration status:', err);
      setError(err.message);
    }
  };

  /**
   * Add a new event (admin)
   */
  const addEvent = async (event) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          name: event.name,
          location: event.location || null,
          start_date: event.start_date,
          end_date: event.end_date,
          registration_deadline: event.registration_deadline || null,
          event_type: event.event_type,
          is_championship: event.is_championship || false,
          championship_level: event.championship_level || null,
          external_url: event.external_url || null,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setEvents(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error adding event:', err);
      setError(err.message);
      return null;
    }
  };

  const value = {
    // State
    boatClasses,
    events,
    registrations,
    trainerEvents,
    myBoatClasses,
    trainerBoatClasses,
    loading,
    error,

    // Hilfsfunktionen
    getBoatClass,
    getEvent,
    getActiveEvents,

    // Trainer-Event Funktionen
    getTrainerEventsForBoatClass,
    getSailorAvailableEvents,
    getEventsGroupedByEvent,
    getMyTrainerEvents,
    createTrainerEvent,
    updateTrainerEvent,
    deleteTrainerEvent,
    registerForTrainerEvent,
    getRegistrationsForTrainerEvent,

    // Legacy Anmeldungen (für bestehende Funktionalität)
    addRegistration,
    cancelRegistration,
    updateRegistrationStatus,
    addEvent,
    reload: loadData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export default DataContext;
