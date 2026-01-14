import { createContext, useContext, useState, useEffect } from 'react';

/**
 * @typedef {'optimist' | 'laser' | 'ilca4' | 'ilca6' | '420er' | '29er'} BoatType
 * @typedef {'ausstehend' | 'bezahlt' | 'storniert'} BookingStatus
 *
 * @typedef {Object} CharterBoat
 * @property {string} id
 * @property {string} name
 * @property {BoatType} boat_type
 * @property {string} sail_number
 * @property {boolean} available
 * @property {string} [notes]
 *
 * @typedef {Object} CharterSeason
 * @property {string} id
 * @property {number} year
 * @property {string} start_date
 * @property {string} end_date
 * @property {number} price
 * @property {boolean} active
 *
 * @typedef {Object} CharterBooking
 * @property {string} id
 * @property {string} season_id
 * @property {CharterSeason} [season]
 * @property {string} boat_id
 * @property {CharterBoat} [boat]
 * @property {string} sailor_first_name
 * @property {string} sailor_last_name
 * @property {string} sailor_birth_date
 * @property {string} contact_email
 * @property {string} [contact_phone]
 * @property {string} reason
 * @property {string} [notes]
 * @property {BookingStatus} status
 * @property {string} created_at
 */

const DataContext = createContext(null);

// Demo-Daten für Development
const DEMO_BOATS = [
  { id: 'boat_1', name: 'Opti 1', boat_type: 'optimist', sail_number: 'GER 1001', available: true },
  { id: 'boat_2', name: 'Opti 2', boat_type: 'optimist', sail_number: 'GER 1002', available: true },
  { id: 'boat_3', name: 'Opti 3', boat_type: 'optimist', sail_number: 'GER 1003', available: true },
  { id: 'boat_4', name: 'Opti 4', boat_type: 'optimist', sail_number: 'GER 1004', available: true },
  { id: 'boat_5', name: 'Opti 5', boat_type: 'optimist', sail_number: 'GER 1005', available: false, notes: 'In Reparatur' },
  { id: 'boat_6', name: 'ILCA 4 - 1', boat_type: 'ilca4', sail_number: 'GER 2001', available: true },
  { id: 'boat_7', name: 'ILCA 4 - 2', boat_type: 'ilca4', sail_number: 'GER 2002', available: true },
  { id: 'boat_8', name: 'ILCA 6 - 1', boat_type: 'ilca6', sail_number: 'GER 3001', available: true },
  { id: 'boat_9', name: '420er - 1', boat_type: '420er', sail_number: 'GER 4001', available: true },
  { id: 'boat_10', name: '420er - 2', boat_type: '420er', sail_number: 'GER 4002', available: true },
];

const currentYear = new Date().getFullYear();

const DEMO_SEASONS = [
  {
    id: 'season_2024',
    year: 2024,
    start_date: '2024-04-01',
    end_date: '2024-09-30',
    price: 250,
    active: false,
  },
  {
    id: 'season_2025',
    year: 2025,
    start_date: '2025-04-01',
    end_date: '2025-09-30',
    price: 250,
    active: true,
  },
];

const CHARTER_REASONS = [
  'Training',
  'Regatta-Teilnahme',
  'Trainingslager',
  'Vereinsregatta',
  'Sonstiges',
];

export function DataProvider({ children }) {
  const [boats, setBoats] = useState(DEMO_BOATS);
  const [seasons, setSeasons] = useState(DEMO_SEASONS);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // TODO: Replace with Supabase queries when connected
  const devMode = true;

  useEffect(() => {
    if (devMode) {
      const stored = localStorage.getItem('tsc_charter_bookings');
      if (stored) {
        setBookings(JSON.parse(stored));
      }
    }
  }, []);

  useEffect(() => {
    if (devMode && bookings.length > 0) {
      localStorage.setItem('tsc_charter_bookings', JSON.stringify(bookings));
    }
  }, [bookings]);

  /**
   * Get current active season
   * @returns {CharterSeason | undefined}
   */
  const getActiveSeason = () => {
    return seasons.find(s => s.active);
  };

  /**
   * Get boat by ID
   * @param {string} id
   * @returns {CharterBoat | undefined}
   */
  const getBoat = (id) => {
    return boats.find(b => b.id === id);
  };

  /**
   * Get available boats (not already booked for current season)
   * @returns {CharterBoat[]}
   */
  const getAvailableBoats = () => {
    const activeSeason = getActiveSeason();
    if (!activeSeason) return [];

    const bookedBoatIds = bookings
      .filter(b => b.season_id === activeSeason.id && b.status !== 'storniert')
      .map(b => b.boat_id);

    return boats.filter(b => b.available && !bookedBoatIds.includes(b.id));
  };

  /**
   * Get boats by type
   * @param {BoatType} type
   * @returns {CharterBoat[]}
   */
  const getBoatsByType = (type) => {
    return boats.filter(b => b.boat_type === type);
  };

  /**
   * Check if a boat is booked for a specific season
   * @param {string} boatId
   * @param {string} seasonId
   * @returns {CharterBooking | undefined}
   */
  const getBoatBooking = (boatId, seasonId) => {
    return bookings.find(
      b => b.boat_id === boatId && b.season_id === seasonId && b.status !== 'storniert'
    );
  };

  /**
   * Add a new booking
   * @param {Object} booking
   * @returns {Promise<CharterBooking>}
   */
  const addBooking = async (booking) => {
    setLoading(true);

    try {
      const season = getActiveSeason();
      const boat = getBoat(booking.boat_id);

      const newBooking = {
        id: `booking_${Date.now()}`,
        ...booking,
        season_id: season.id,
        season,
        boat,
        status: 'ausstehend',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setBookings(prev => [newBooking, ...prev]);

      // TODO: In production:
      // 1. Insert into database
      // 2. Send confirmation email
      // 3. Generate contract PDF

      return newBooking;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel a booking
   * @param {string} bookingId
   */
  const cancelBooking = async (bookingId) => {
    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId
          ? { ...b, status: 'storniert', updated_at: new Date().toISOString() }
          : b
      )
    );
  };

  /**
   * Update booking status (admin)
   * @param {string} bookingId
   * @param {BookingStatus} status
   */
  const updateBookingStatus = async (bookingId, status) => {
    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId
          ? { ...b, status, updated_at: new Date().toISOString() }
          : b
      )
    );
  };

  /**
   * Get bookings for current user (by email in demo mode)
   * @param {string} email
   * @returns {CharterBooking[]}
   */
  const getUserBookings = (email) => {
    return bookings.filter(b => b.contact_email === email);
  };

  /**
   * Get all bookings for a season
   * @param {string} seasonId
   * @returns {CharterBooking[]}
   */
  const getSeasonBookings = (seasonId) => {
    return bookings.filter(b => b.season_id === seasonId);
  };

  const value = {
    boats,
    seasons,
    bookings,
    loading,
    charterReasons: CHARTER_REASONS,
    getActiveSeason,
    getBoat,
    getAvailableBoats,
    getBoatsByType,
    getBoatBooking,
    addBooking,
    cancelBooking,
    updateBookingStatus,
    getUserBookings,
    getSeasonBookings,
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
