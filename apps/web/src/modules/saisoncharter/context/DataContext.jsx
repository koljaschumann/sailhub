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
 * @property {number} [charter_fee] - Individuelle Charterpauschale (falls abweichend von Season-Preis)
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
 *
 * @typedef {'erstellt' | 'versendet' | 'bezahlt' | 'storniert'} InvoiceStatus
 *
 * @typedef {Object} CharterInvoice
 * @property {string} id
 * @property {string} booking_id
 * @property {string} invoice_number
 * @property {number} amount
 * @property {InvoiceStatus} status
 * @property {string} recipient_name
 * @property {string} recipient_email
 * @property {string} created_at
 * @property {string} [sent_at]
 * @property {string} [paid_at]
 * @property {string} [notes]
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
  const [invoices, setInvoices] = useState([]);
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
      // Relation über assigned_boat_id zur charter_boats Tabelle
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('charter_bookings')
        .select(`
          *,
          season:charter_seasons(*),
          boat:charter_boats!assigned_boat_id(*)
        `)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

      // Rechnungen laden
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('charter_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;
      setInvoices(invoicesData || []);

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
      .filter(b => b.season_id === activeSeason.id && b.status !== 'abgelehnt')
      .map(b => b.assigned_boat_id);

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
      b => b.assigned_boat_id === boatId && b.season_id === seasonId && b.status !== 'abgelehnt'
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

      // Spalten entsprechen der DB-Struktur
      const sailorName = `${booking.sailor_first_name} ${booking.sailor_last_name}`.trim();

      const { data, error } = await supabase
        .from('charter_bookings')
        .insert({
          user_id: user?.id || null,
          season_id: season.id,
          assigned_boat_id: booking.boat_id,
          boat_class_id: booking.boat_type || null,
          sailor_name: sailorName,
          sailor_birth_date: booking.sailor_birth_date,
          guardian_name: sailorName, // Vorläufig gleich wie sailor_name
          guardian_email: booking.contact_email,
          guardian_phone: booking.contact_phone || null,
          charter_reason: 'sonstiges', // Standardwert (DB erlaubt: alter, finanziell, einstieg, sonstiges)
          charter_reason_details: booking.notes || null,
          status: 'beantragt', // DB-Status (beantragt, genehmigt, boot_zugewiesen, aktiv, beendet, abgelehnt)
        })
        .select(`
          *,
          season:charter_seasons(*),
          boat:charter_boats!assigned_boat_id(*)
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
   * Cancel a booking (setzt Status auf 'abgelehnt')
   */
  const cancelBooking = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('charter_bookings')
        .update({ status: 'abgelehnt' })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev =>
        prev.map(b =>
          b.id === bookingId ? { ...b, status: 'abgelehnt' } : b
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
    return bookings.filter(b => b.guardian_email === email);
  };

  /**
   * Get all bookings for a season
   */
  const getSeasonBookings = (seasonId) => {
    return bookings.filter(b => b.season_id === seasonId);
  };

  // =============================================
  // Boot-Verwaltung (Admin)
  // =============================================

  /**
   * Add a new boat
   */
  const addBoat = async (boat) => {
    try {
      const { data, error } = await supabase
        .from('charter_boats')
        .insert({
          name: boat.name,
          boat_type: boat.boat_type,
          sail_number: boat.sail_number,
          available: boat.available ?? true,
          charter_fee: boat.charter_fee || null,
          notes: boat.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setBoats(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return data;
    } catch (err) {
      console.error('Error adding boat:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update an existing boat
   */
  const updateBoat = async (boatId, updates) => {
    try {
      const { error } = await supabase
        .from('charter_boats')
        .update({
          name: updates.name,
          boat_type: updates.boat_type,
          sail_number: updates.sail_number,
          available: updates.available,
          charter_fee: updates.charter_fee || null,
          notes: updates.notes || null,
        })
        .eq('id', boatId);

      if (error) throw error;

      setBoats(prev =>
        prev.map(b => b.id === boatId ? { ...b, ...updates } : b)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (err) {
      console.error('Error updating boat:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Delete a boat (only if no active bookings)
   */
  const deleteBoat = async (boatId) => {
    try {
      // Check for active bookings
      const activeBookings = bookings.filter(
        b => b.assigned_boat_id === boatId && b.status !== 'abgelehnt'
      );

      if (activeBookings.length > 0) {
        throw new Error('Boot hat aktive Buchungen und kann nicht gelöscht werden');
      }

      const { error } = await supabase
        .from('charter_boats')
        .delete()
        .eq('id', boatId);

      if (error) throw error;

      setBoats(prev => prev.filter(b => b.id !== boatId));
    } catch (err) {
      console.error('Error deleting boat:', err);
      setError(err.message);
      throw err;
    }
  };

  // =============================================
  // Rechnungen (Admin)
  // =============================================

  /**
   * Get invoice for a booking
   */
  const getBookingInvoice = (bookingId) => {
    return invoices.find(inv => inv.booking_id === bookingId);
  };

  /**
   * Create invoice for a booking
   */
  const createInvoice = async (booking) => {
    try {
      // Berechne den Rechnungsbetrag
      const amount = booking.boat?.charter_fee || booking.season?.price || 0;
      const recipientName = booking.sailor_name || 'Unbekannt';
      const recipientEmail = booking.guardian_email || '';

      // Generiere Rechnungsnummer im Client (Format: TSC-SC-YYYY-XXXX)
      const year = new Date().getFullYear();
      const existingCount = invoices.filter(inv =>
        inv.invoice_number?.startsWith(`TSC-SC-${year}`)
      ).length;
      const nextNum = existingCount + 1;
      const invoiceNumber = `TSC-SC-${year}-${String(nextNum).padStart(4, '0')}`;

      const { data, error } = await supabase
        .from('charter_invoices')
        .insert({
          booking_id: booking.id,
          invoice_number: invoiceNumber,
          amount: amount,
          status: 'erstellt',
          recipient_name: recipientName,
          recipient_email: recipientEmail,
        })
        .select()
        .single();

      if (error) throw error;

      setInvoices(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update invoice status
   */
  const updateInvoiceStatus = async (invoiceId, status) => {
    try {
      const updates = { status };

      // Setze Zeitstempel je nach Status
      if (status === 'versendet') {
        updates.sent_at = new Date().toISOString();
      } else if (status === 'bezahlt') {
        updates.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('charter_invoices')
        .update(updates)
        .eq('id', invoiceId);

      if (error) throw error;

      setInvoices(prev =>
        prev.map(inv =>
          inv.id === invoiceId ? { ...inv, ...updates } : inv
        )
      );
    } catch (err) {
      console.error('Error updating invoice status:', err);
      setError(err.message);
      throw err;
    }
  };

  const value = {
    boats,
    seasons,
    bookings,
    invoices,
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
    // Boot-Verwaltung
    addBoat,
    updateBoat,
    deleteBoat,
    // Rechnungen
    getBookingInvoice,
    createInvoice,
    updateInvoiceStatus,
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
