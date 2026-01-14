import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@tsc/supabase';
import { CLUB_LOCATION } from '@tsc/config/email';

/**
 * @typedef {'regatta' | 'training' | 'trainingslager' | 'sonstiges'} EventType
 *
 * @typedef {Object} SailorStats
 * @property {string} sailor_id
 * @property {string} first_name
 * @property {string} last_name
 * @property {number} event_count
 * @property {number} regatta_count
 * @property {number} training_count
 * @property {number} total_distance_km
 * @property {string[]} boat_classes
 * @property {number} championships_attended
 *
 * @typedef {Object} YearlyAward
 * @property {string} id
 * @property {number} year
 * @property {string} category
 * @property {string} sailor_first_name
 * @property {string} sailor_last_name
 * @property {string} [boat_class]
 * @property {number} [value]
 * @property {string} [description]
 */

const DataContext = createContext(null);

// Known locations with coordinates
const KNOWN_LOCATIONS = {
  'tegeler see': { lat: 52.5833, lon: 13.2833, name: 'Tegeler See' },
  'wannsee, berlin': { lat: 52.4167, lon: 13.1667, name: 'Wannsee' },
  'warnemünde': { lat: 54.1833, lon: 12.0833, name: 'Warnemünde' },
  'kiel': { lat: 54.3233, lon: 10.1394, name: 'Kiel' },
  'travemünde': { lat: 53.9667, lon: 10.8667, name: 'Travemünde' },
  'steinhuder meer': { lat: 52.4500, lon: 9.3333, name: 'Steinhuder Meer' },
};

const AWARD_CATEGORIES = [
  { id: 'most_events', label: 'Meiste Veranstaltungen', description: 'Teilnahme an den meisten Events' },
  { id: 'most_distance', label: 'Weiteste Strecke', description: 'Größte Gesamtdistanz zu Events' },
  { id: 'most_regattas', label: 'Regatta-König:in', description: 'Meiste Regatta-Teilnahmen' },
  { id: 'most_championships', label: 'Meisterschafts-Teilnehmer:in', description: 'Meiste Meisterschafts-Teilnahmen' },
];

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get coordinates for a location
 */
async function geocodeLocation(location) {
  const normalized = location.toLowerCase().trim();

  if (KNOWN_LOCATIONS[normalized]) {
    return KNOWN_LOCATIONS[normalized];
  }

  return null;
}

export function DataProvider({ children }) {
  const [registrations, setRegistrations] = useState([]);
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Club location
  const clubLocation = CLUB_LOCATION || { latitude: 52.5833, longitude: 13.2833 };

  // =============================================
  // Daten aus Supabase laden
  // =============================================

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let allRegistrations = [];

      // 1. Event-Registrierungen laden (Saisonplanung)
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('event_registrations')
        .select(`
          *,
          event:events(*)
        `)
        .eq('status', 'teilgenommen')
        .order('created_at', { ascending: false });

      if (registrationsError && registrationsError.code !== 'PGRST116') {
        console.warn('Event registrations error:', registrationsError);
      }

      // Daten für Auswertung aufbereiten
      const formattedEventRegistrations = (registrationsData || []).map(reg => ({
        sailor_id: reg.id,
        first_name: reg.sailor_first_name,
        last_name: reg.sailor_last_name,
        event_name: reg.event?.name || '',
        event_location: reg.event?.location || '',
        event_type: reg.event?.event_type || 'sonstiges',
        boat_class: reg.boat_class?.name || '',
        is_championship: reg.event?.is_championship || false,
        year: new Date(reg.event?.start_date || reg.created_at).getFullYear(),
        source: 'event_registrations',
      }));

      allRegistrations = [...formattedEventRegistrations];

      // 2. Startgelder Regatta-Einträge laden
      const { data: regattaEntries, error: regattaError } = await supabase
        .from('regatta_entries')
        .select(`
          *,
          sailor:sailors(id, name, sail_number)
        `)
        .order('regatta_date', { ascending: false });

      if (regattaError && regattaError.code !== 'PGRST116') {
        console.warn('Regatta entries error:', regattaError);
      }

      // Startgelder-Regatten für Auswertung aufbereiten
      const formattedRegattaEntries = (regattaEntries || []).map(entry => {
        // Namen aus sailor.name extrahieren (Format: "Vorname Nachname")
        const nameParts = (entry.sailor?.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Jahr aus regatta_date oder season extrahieren
        const year = entry.regatta_date
          ? new Date(entry.regatta_date).getFullYear()
          : parseInt(entry.season) || new Date().getFullYear();

        // Prüfen ob es eine Meisterschaft ist (Name enthält "Meisterschaft", "DM", "EM", "WM")
        const isChampionship = /meisterschaft|^dm\b|^em\b|^wm\b|deutsche|europa|welt/i.test(entry.regatta_name || '');

        return {
          sailor_id: entry.sailor_id,
          first_name: firstName,
          last_name: lastName,
          event_name: entry.regatta_name || '',
          event_location: '', // Könnte später aus regatta_name extrahiert werden
          event_type: 'regatta',
          boat_class: entry.boat_class || '',
          is_championship: isChampionship,
          year: year,
          placement: entry.placement,
          total_participants: entry.total_participants,
          race_count: entry.race_count,
          source: 'regatta_entries',
        };
      });

      allRegistrations = [...allRegistrations, ...formattedRegattaEntries];

      console.log('[Jahresauswertung] Loaded registrations:', {
        eventRegistrations: formattedEventRegistrations.length,
        regattaEntries: formattedRegattaEntries.length,
        total: allRegistrations.length
      });

      setRegistrations(allRegistrations);

      // Awards laden
      const { data: awardsData, error: awardsError } = await supabase
        .from('yearly_awards')
        .select('*')
        .order('year', { ascending: false });

      if (awardsError && awardsError.code !== 'PGRST116') {
        console.warn('Awards error:', awardsError);
      }
      setAwards(awardsData || []);

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
  // Statistik-Funktionen
  // =============================================

  /**
   * Get available years (immer mindestens aktuelle + letzte 2 Jahre)
   */
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [...new Set(registrations.map(r => r.year))];

    // Mindestens das aktuelle Jahr und die letzten 2 Jahre anzeigen
    for (let y = currentYear; y >= currentYear - 2; y--) {
      if (!years.includes(y)) {
        years.push(y);
      }
    }

    return years.sort((a, b) => b - a);
  };

  /**
   * Calculate statistics for a year
   */
  const calculateYearlyStats = async (year) => {
    const yearRegistrations = registrations.filter(r => r.year === year);

    const sailorMap = new Map();

    for (const reg of yearRegistrations) {
      if (!sailorMap.has(reg.sailor_id)) {
        sailorMap.set(reg.sailor_id, {
          sailor_id: reg.sailor_id,
          first_name: reg.first_name,
          last_name: reg.last_name,
          events: [],
          boat_classes: new Set(),
        });
      }

      const sailor = sailorMap.get(reg.sailor_id);
      sailor.events.push(reg);
      if (reg.boat_class) sailor.boat_classes.add(reg.boat_class);
    }

    const stats = [];

    for (const [, sailor] of sailorMap) {
      let totalDistance = 0;

      for (const event of sailor.events) {
        if (event.event_location) {
          const location = await geocodeLocation(event.event_location);
          if (location) {
            const distance = calculateDistance(
              clubLocation.latitude,
              clubLocation.longitude,
              location.lat,
              location.lon
            );
            totalDistance += distance * 2;
          }
        }
      }

      stats.push({
        sailor_id: sailor.sailor_id,
        first_name: sailor.first_name,
        last_name: sailor.last_name,
        event_count: sailor.events.length,
        regatta_count: sailor.events.filter(e => e.event_type === 'regatta').length,
        training_count: sailor.events.filter(e => ['training', 'trainingslager'].includes(e.event_type)).length,
        total_distance_km: Math.round(totalDistance),
        boat_classes: [...sailor.boat_classes],
        championships_attended: sailor.events.filter(e => e.is_championship).length,
      });
    }

    return stats.sort((a, b) => b.event_count - a.event_count);
  };

  /**
   * Get summary statistics for a year
   */
  const getYearlySummary = (year) => {
    const yearRegistrations = registrations.filter(r => r.year === year);

    const uniqueSailors = new Set(yearRegistrations.map(r => r.sailor_id)).size;
    const uniqueLocations = new Set(yearRegistrations.map(r => r.event_location)).size;
    const totalEvents = yearRegistrations.length;
    const regattas = yearRegistrations.filter(r => r.event_type === 'regatta').length;
    const championships = yearRegistrations.filter(r => r.is_championship).length;

    return {
      uniqueSailors,
      uniqueLocations,
      totalEvents,
      regattas,
      championships,
    };
  };

  /**
   * Calculate and save awards for a year
   */
  const calculateAwards = async (year) => {
    const stats = await calculateYearlyStats(year);
    if (stats.length === 0) return;

    const newAwards = [];

    // Most events
    const topEvents = [...stats].sort((a, b) => b.event_count - a.event_count)[0];
    if (topEvents) {
      newAwards.push({
        year,
        category: 'most_events',
        sailor_first_name: topEvents.first_name,
        sailor_last_name: topEvents.last_name,
        value: topEvents.event_count,
        description: `${topEvents.event_count} Veranstaltungen`,
      });
    }

    // Most distance
    const topDistance = [...stats].sort((a, b) => b.total_distance_km - a.total_distance_km)[0];
    if (topDistance && topDistance.total_distance_km > 0) {
      newAwards.push({
        year,
        category: 'most_distance',
        sailor_first_name: topDistance.first_name,
        sailor_last_name: topDistance.last_name,
        value: topDistance.total_distance_km,
        description: `${topDistance.total_distance_km.toLocaleString('de-DE')} km`,
      });
    }

    // Most regattas
    const topRegattas = [...stats].sort((a, b) => b.regatta_count - a.regatta_count)[0];
    if (topRegattas && topRegattas.regatta_count > 0) {
      newAwards.push({
        year,
        category: 'most_regattas',
        sailor_first_name: topRegattas.first_name,
        sailor_last_name: topRegattas.last_name,
        value: topRegattas.regatta_count,
        description: `${topRegattas.regatta_count} Regatten`,
      });
    }

    // Most championships
    const topChampionships = [...stats].sort((a, b) => b.championships_attended - a.championships_attended)[0];
    if (topChampionships && topChampionships.championships_attended > 0) {
      newAwards.push({
        year,
        category: 'most_championships',
        sailor_first_name: topChampionships.first_name,
        sailor_last_name: topChampionships.last_name,
        value: topChampionships.championships_attended,
        description: `${topChampionships.championships_attended} Meisterschaften`,
      });
    }

    // Save to database (optional - awards can also be calculated on-the-fly)
    try {
      // Delete existing awards for year
      await supabase
        .from('yearly_awards')
        .delete()
        .eq('year', year);

      // Insert new awards
      if (newAwards.length > 0) {
        await supabase
          .from('yearly_awards')
          .insert(newAwards);
      }
    } catch (err) {
      console.error('Error saving awards:', err);
    }

    // Update local state
    setAwards(prev => [...prev.filter(a => a.year !== year), ...newAwards.map((a, i) => ({ ...a, id: `temp_${year}_${i}` }))]);
  };

  /**
   * Get awards for a year
   */
  const getAwards = (year) => {
    return awards.filter(a => a.year === year);
  };

  const value = {
    registrations,
    awards,
    loading,
    error,
    selectedYear,
    setSelectedYear,
    awardCategories: AWARD_CATEGORIES,
    clubLocation,
    getAvailableYears,
    calculateYearlyStats,
    getYearlySummary,
    calculateAwards,
    getAwards,
    geocodeLocation,
    calculateDistance,
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
