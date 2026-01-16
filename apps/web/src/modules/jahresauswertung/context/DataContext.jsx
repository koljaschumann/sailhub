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

// Filter types for Admin statistics
const FILTER_TYPES = [
  { id: 'most_regattas', label: 'Meiste Regatten', icon: 'trophy' },
  { id: 'best_avg_placement', label: 'Beste Durchschnittsplatzierung', icon: 'medal' },
  { id: 'furthest_regatta', label: 'Weiteste Regatta', icon: 'mapPin' },
  { id: 'youngest_participant', label: 'Jüngster Teilnehmer', icon: 'user' },
  { id: 'most_races', label: 'Meiste Wettfahrten', icon: 'sailboat' },
  { id: 'best_single_placement', label: 'Beste Einzelplatzierung', icon: 'star' },
  { id: 'most_active_boat_class', label: 'Aktivste Bootsklasse', icon: 'chart' },
  { id: 'most_championships', label: 'Meisterschafts-Champion', icon: 'award' },
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
  const [sailors, setSailors] = useState([]);
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

      // Sailors laden (für Geburtsdatum)
      const { data: sailorsData, error: sailorsError } = await supabase
        .from('sailors')
        .select('id, name, birth_date, boat_class');

      if (sailorsError && sailorsError.code !== 'PGRST116') {
        console.warn('Sailors error:', sailorsError);
      }
      setSailors(sailorsData || []);

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

  // =============================================
  // Extended Statistics for Admin
  // =============================================

  /**
   * Get detailed statistics with all filter options
   */
  const getDetailedStats = async (year) => {
    const yearRegistrations = registrations.filter(r => r.year === year);
    const stats = await calculateYearlyStats(year);

    // Top by regattas
    const topByRegattas = [...stats]
      .filter(s => s.regatta_count > 0)
      .sort((a, b) => b.regatta_count - a.regatta_count)
      .slice(0, 10);

    // Calculate average placement for each sailor
    const sailorPlacements = new Map();
    yearRegistrations
      .filter(r => r.placement && r.total_participants)
      .forEach(r => {
        if (!sailorPlacements.has(r.sailor_id)) {
          sailorPlacements.set(r.sailor_id, {
            sailor_id: r.sailor_id,
            first_name: r.first_name,
            last_name: r.last_name,
            placements: [],
            relativePlacements: [],
          });
        }
        const sailor = sailorPlacements.get(r.sailor_id);
        sailor.placements.push(r.placement);
        sailor.relativePlacements.push(r.placement / r.total_participants);
      });

    // Top by average placement (relative to field size)
    const topByAvgPlacement = [...sailorPlacements.values()]
      .map(s => ({
        ...s,
        avgPlacement: s.placements.reduce((a, b) => a + b, 0) / s.placements.length,
        avgRelativePlacement: s.relativePlacements.reduce((a, b) => a + b, 0) / s.relativePlacements.length,
        regattaCount: s.placements.length,
      }))
      .filter(s => s.regattaCount >= 3) // Minimum 3 regattas for fair comparison
      .sort((a, b) => a.avgRelativePlacement - b.avgRelativePlacement)
      .slice(0, 10);

    // Best single placements
    const bestSinglePlacements = yearRegistrations
      .filter(r => r.placement && r.total_participants)
      .map(r => ({
        sailor_id: r.sailor_id,
        first_name: r.first_name,
        last_name: r.last_name,
        regatta_name: r.event_name,
        placement: r.placement,
        total_participants: r.total_participants,
        relativePlacement: r.placement / r.total_participants,
      }))
      .sort((a, b) => a.placement - b.placement || a.relativePlacement - b.relativePlacement)
      .slice(0, 10);

    // Most races (Wettfahrten)
    const sailorRaces = new Map();
    yearRegistrations
      .filter(r => r.race_count)
      .forEach(r => {
        if (!sailorRaces.has(r.sailor_id)) {
          sailorRaces.set(r.sailor_id, {
            sailor_id: r.sailor_id,
            first_name: r.first_name,
            last_name: r.last_name,
            totalRaces: 0,
            regattaCount: 0,
          });
        }
        const sailor = sailorRaces.get(r.sailor_id);
        sailor.totalRaces += r.race_count;
        sailor.regattaCount += 1;
      });

    const topByRaceCount = [...sailorRaces.values()]
      .sort((a, b) => b.totalRaces - a.totalRaces)
      .slice(0, 10);

    // Youngest participants (requires birth_date from sailors table)
    const youngestParticipants = [];
    const participatingSailorIds = [...new Set(yearRegistrations.map(r => r.sailor_id))];

    for (const sailorId of participatingSailorIds) {
      const sailor = sailors.find(s => s.id === sailorId);
      if (sailor?.birth_date) {
        const reg = yearRegistrations.find(r => r.sailor_id === sailorId);
        const birthDate = new Date(sailor.birth_date);
        const ageAtYearEnd = year - birthDate.getFullYear();

        youngestParticipants.push({
          sailor_id: sailorId,
          first_name: reg?.first_name || sailor.name?.split(' ')[0] || '',
          last_name: reg?.last_name || sailor.name?.split(' ').slice(1).join(' ') || '',
          birth_date: sailor.birth_date,
          age: ageAtYearEnd,
          regattaCount: yearRegistrations.filter(r => r.sailor_id === sailorId).length,
        });
      }
    }

    youngestParticipants.sort((a, b) => new Date(b.birth_date) - new Date(a.birth_date));
    const topYoungest = youngestParticipants.slice(0, 10);

    // Boat class statistics
    const boatClassStats = {};
    yearRegistrations.forEach(r => {
      if (r.boat_class) {
        if (!boatClassStats[r.boat_class]) {
          boatClassStats[r.boat_class] = {
            name: r.boat_class,
            participations: 0,
            uniqueSailors: new Set(),
            regattas: new Set(),
          };
        }
        boatClassStats[r.boat_class].participations += 1;
        boatClassStats[r.boat_class].uniqueSailors.add(r.sailor_id);
        boatClassStats[r.boat_class].regattas.add(r.event_name);
      }
    });

    const mostActiveBoatClasses = Object.values(boatClassStats)
      .map(bc => ({
        name: bc.name,
        participations: bc.participations,
        uniqueSailors: bc.uniqueSailors.size,
        uniqueRegattas: bc.regattas.size,
      }))
      .sort((a, b) => b.participations - a.participations)
      .slice(0, 10);

    // Top by distance
    const topByDistance = [...stats]
      .filter(s => s.total_distance_km > 0)
      .sort((a, b) => b.total_distance_km - a.total_distance_km)
      .slice(0, 10);

    // Top by championships
    const topByChampionships = [...stats]
      .filter(s => s.championships_attended > 0)
      .sort((a, b) => b.championships_attended - a.championships_attended)
      .slice(0, 10);

    return {
      sailors: stats,
      topByRegattas,
      topByAvgPlacement,
      topByDistance,
      youngestParticipants: topYoungest,
      topByRaceCount,
      bestSinglePlacements,
      boatClassStats: mostActiveBoatClasses,
      topByChampionships,
    };
  };

  /**
   * Get ranking by specific filter type
   */
  const getRankingByFilter = async (year, filterType) => {
    const detailedStats = await getDetailedStats(year);

    switch (filterType) {
      case 'most_regattas':
        return detailedStats.topByRegattas;
      case 'best_avg_placement':
        return detailedStats.topByAvgPlacement;
      case 'furthest_regatta':
        return detailedStats.topByDistance;
      case 'youngest_participant':
        return detailedStats.youngestParticipants;
      case 'most_races':
        return detailedStats.topByRaceCount;
      case 'best_single_placement':
        return detailedStats.bestSinglePlacements;
      case 'most_active_boat_class':
        return detailedStats.boatClassStats;
      case 'most_championships':
        return detailedStats.topByChampionships;
      default:
        return detailedStats.sailors;
    }
  };

  const value = {
    registrations,
    awards,
    sailors,
    loading,
    error,
    selectedYear,
    setSelectedYear,
    awardCategories: AWARD_CATEGORIES,
    filterTypes: FILTER_TYPES,
    clubLocation,
    getAvailableYears,
    calculateYearlyStats,
    getYearlySummary,
    calculateAwards,
    getAwards,
    getDetailedStats,
    getRankingByFilter,
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
