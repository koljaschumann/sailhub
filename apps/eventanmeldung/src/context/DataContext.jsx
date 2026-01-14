import { createContext, useContext, useState, useEffect } from 'react';

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
 * @property {RegistrationStatus} status
 * @property {string} created_at
 */

const DataContext = createContext(null);

// Demo-Daten für Development
const DEMO_BOAT_CLASSES = [
  { id: 'optimist', name: 'Optimist', display_name: 'Optimist', color: '#22c55e', crew_size: 1, min_age: 7, max_age: 15, active: true },
  { id: 'opti-c', name: 'Opti C', display_name: 'Opti C', color: '#22c55e', crew_size: 1, min_age: 7, max_age: 12, active: true },
  { id: 'opti-b', name: 'Opti B', display_name: 'Opti B', color: '#3b82f6', crew_size: 1, min_age: 10, max_age: 14, active: true },
  { id: 'opti-a', name: 'Opti A', display_name: 'Opti A', color: '#8b5cf6', crew_size: 1, min_age: 12, max_age: 15, active: true },
  { id: 'ilca4', name: 'ILCA 4', display_name: 'ILCA 4', color: '#14b8a6', crew_size: 1, min_age: 12, max_age: 18, active: true },
  { id: 'ilca6', name: 'ILCA 6', display_name: 'ILCA 6', color: '#0891b2', crew_size: 1, min_age: 14, max_age: null, active: true },
  { id: '420er', name: '420er', display_name: '420er', color: '#f59e0b', crew_size: 2, min_age: 12, max_age: 18, active: true },
  { id: '29er', name: '29er', display_name: '29er', color: '#f59e0b', crew_size: 2, min_age: 14, max_age: 20, active: true },
];

const DEMO_EVENTS = [
  {
    id: 'evt_1',
    name: 'Frühjahrsregatta Tegeler See',
    location: 'Berlin-Tegel',
    start_date: '2025-04-12',
    end_date: '2025-04-13',
    registration_deadline: '2025-04-01',
    event_type: 'regatta',
    is_championship: false,
    active: true,
  },
  {
    id: 'evt_2',
    name: 'Berliner Landesmeisterschaft Opti',
    location: 'Wannsee, Berlin',
    start_date: '2025-05-17',
    end_date: '2025-05-18',
    registration_deadline: '2025-05-03',
    event_type: 'regatta',
    is_championship: true,
    championship_level: 'landesmeisterschaft',
    external_url: 'https://www.manage2sail.com/de',
    active: true,
  },
  {
    id: 'evt_3',
    name: 'Pfingst-Trainingslager Ostsee',
    location: 'Warnemünde',
    start_date: '2025-06-07',
    end_date: '2025-06-09',
    registration_deadline: '2025-05-15',
    event_type: 'trainingslager',
    is_championship: false,
    active: true,
  },
  {
    id: 'evt_4',
    name: 'Deutsche Jugendmeisterschaft 420er',
    location: 'Kiel',
    start_date: '2025-07-21',
    end_date: '2025-07-25',
    registration_deadline: '2025-06-30',
    event_type: 'regatta',
    is_championship: true,
    championship_level: 'deutsche_meisterschaft',
    external_url: 'https://www.dsv.org',
    active: true,
  },
  {
    id: 'evt_5',
    name: 'Sommerregatta Müggelsee',
    location: 'Berlin-Köpenick',
    start_date: '2025-08-16',
    end_date: '2025-08-17',
    registration_deadline: '2025-08-01',
    event_type: 'regatta',
    is_championship: false,
    active: true,
  },
];

export function DataProvider({ children }) {
  const [boatClasses, setBoatClasses] = useState(DEMO_BOAT_CLASSES);
  const [events, setEvents] = useState(DEMO_EVENTS);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);

  // TODO: Replace with Supabase queries when connected
  const devMode = true;

  useEffect(() => {
    if (devMode) {
      // Load demo registrations from localStorage
      const stored = localStorage.getItem('tsc_event_registrations');
      if (stored) {
        setRegistrations(JSON.parse(stored));
      }
    }
  }, []);

  // Save registrations to localStorage
  useEffect(() => {
    if (devMode && registrations.length > 0) {
      localStorage.setItem('tsc_event_registrations', JSON.stringify(registrations));
    }
  }, [registrations]);

  /**
   * Get boat class by ID
   * @param {string} id
   * @returns {BoatClass | undefined}
   */
  const getBoatClass = (id) => {
    return boatClasses.find(bc => bc.id === id);
  };

  /**
   * Get event by ID
   * @param {string} id
   * @returns {Event | undefined}
   */
  const getEvent = (id) => {
    return events.find(e => e.id === id);
  };

  /**
   * Get active events (upcoming or within registration deadline)
   * @returns {Event[]}
   */
  const getActiveEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(e => e.active && e.start_date >= today);
  };

  /**
   * Add a new registration
   * @param {Object} registration
   * @returns {Promise<EventRegistration>}
   */
  const addRegistration = async (registration) => {
    setLoading(true);

    try {
      const event = getEvent(registration.event_id);
      const boatClass = getBoatClass(registration.boat_class_id);

      const newRegistration = {
        id: `reg_${Date.now()}`,
        ...registration,
        event,
        boat_class: boatClass,
        status: 'angemeldet',
        disclaimer_accepted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setRegistrations(prev => [newRegistration, ...prev]);

      // TODO: In production:
      // 1. Insert into database
      // 2. Send confirmation email

      return newRegistration;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel a registration
   * @param {string} registrationId
   * @param {string} reason
   */
  const cancelRegistration = async (registrationId, reason) => {
    const registration = registrations.find(r => r.id === registrationId);
    if (!registration) return;

    const event = getEvent(registration.event_id);
    const sixWeeksBefore = new Date(event.start_date);
    sixWeeksBefore.setDate(sixWeeksBefore.getDate() - 42);

    const cancellationCostApplicable = new Date() > sixWeeksBefore;

    setRegistrations(prev =>
      prev.map(r =>
        r.id === registrationId
          ? {
              ...r,
              status: 'abgesagt',
              cancellation_date: new Date().toISOString(),
              cancellation_reason: reason,
              cancellation_cost_applicable: cancellationCostApplicable,
              updated_at: new Date().toISOString(),
            }
          : r
      )
    );
  };

  /**
   * Update registration status (admin)
   * @param {string} registrationId
   * @param {RegistrationStatus} status
   */
  const updateRegistrationStatus = async (registrationId, status) => {
    setRegistrations(prev =>
      prev.map(r =>
        r.id === registrationId
          ? { ...r, status, updated_at: new Date().toISOString() }
          : r
      )
    );
  };

  /**
   * Add a new event (admin)
   * @param {Object} event
   */
  const addEvent = async (event) => {
    const newEvent = {
      id: `evt_${Date.now()}`,
      ...event,
      active: true,
      created_at: new Date().toISOString(),
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  };

  const value = {
    boatClasses,
    events,
    registrations,
    loading,
    getBoatClass,
    getEvent,
    getActiveEvents,
    addRegistration,
    cancelRegistration,
    updateRegistrationStatus,
    addEvent,
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
