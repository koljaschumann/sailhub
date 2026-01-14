import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@tsc/supabase';
import { useAuth } from '@tsc/supabase';

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

const CHARTER_REASONS = [
  'Training',
  'Regatta-Teilnahme',
  'Trainingslager',
  'Vereinsregatta',
  'Sonstiges',
];

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [boats, setBoats] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =============================================
  // Daten aus Supabase laden
  // =============================================

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Charter-Boote laden
      const { data: boatsData, error: boatsError } = await supabase
        .from('charter_boats')
        .select('*')
        .order('name', { ascending: true });

      if (boatsError) throw boatsError;
      setBoats(boatsData || []);

      // Saisons laden
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('charter_seasons')
        .select('*')
        .order('year', { ascending: false });

      if (seasonsError) throw seasonsError;
      setSeasons(seasonsData || []);

      // Buchungen laden (alle für Übersicht)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('charter_bookings')
        .select(`
          *,
          season:charter_seasons(*),
          boat:charter_boats(*)
        `)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Daten beim Start laden
  useEffect(() => {
    loadData();
  }, [loadData]);

  // =============================================
  // Hilfsfunktionen
  // =============================================

  /**
   * Get current active season
   */
  const getActiveSeason = () => {
    return seasons.find(s => s.active);
  };

  /**
   * Get boat by ID
   */
  const getBoat = (id) => {
    return boats.find(b => b.id === id);
  };

  /**
   * Get available boats (not already booked for current season)
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
   */
  const getBoatsByType = (type) => {
    return boats.filter(b => b.boat_type === type);
  };

  /**
   * Check if a boat is booked for a specific season
   */
  const getBoatBooking = (boatId, seasonId) => {
    return bookings.find(
      b => b.boat_id === boatId && b.season_id === seasonId && b.status !== 'storniert'
    );
  };

  // =============================================
  // Buchungen
  // =============================================

  /**
   * Add a new booking
   */
  const addBooking = async (booking) => {
    setLoading(true);

    try {
      const season = getActiveSeason();

      const { data, error } = await supabase
        .from('charter_bookings')
        .insert({
          user_id: user?.id || null,
          season_id: season.id,
          boat_id: booking.boat_id,
          sailor_first_name: booking.sailor_first_name,
          sailor_last_name: booking.sailor_last_name,
          sailor_birth_date: booking.sailor_birth_date,
          contact_email: booking.contact_email,
          contact_phone: booking.contact_phone || null,
          reason: booking.reason,
          notes: booking.notes || null,
          status: 'ausstehend',
        })
        .select(`
          *,
          season:charter_seasons(*),
          boat:charter_boats(*)
        `)
        .single();

      if (error) throw error;

      setBookings(prev => [data, ...prev]);
      return data;

    } catch (err) {
      console.error('Error adding booking:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel a booking
   */
  const cancelBooking = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('charter_bookings')
        .update({ status: 'storniert' })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev =>
        prev.map(b =>
          b.id === bookingId ? { ...b, status: 'storniert' } : b
        )
      );
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError(err.message);
    }
  };

  /**
   * Update booking status (admin)
   */
  const updateBookingStatus = async (bookingId, status) => {
    try {
      const { error } = await supabase
        .from('charter_bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev =>
        prev.map(b =>
          b.id === bookingId ? { ...b, status } : b
        )
      );
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError(err.message);
    }
  };

  /**
   * Get bookings for current user
   */
  const getUserBookings = (email) => {
    if (user) {
      return bookings.filter(b => b.user_id === user.id);
    }
    return bookings.filter(b => b.contact_email === email);
  };

  /**
   * Get all bookings for a season
   */
  const getSeasonBookings = (seasonId) => {
    return bookings.filter(b => b.season_id === seasonId);
  };

  const value = {
    boats,
    seasons,
    bookings,
    loading,
    error,
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
