import { createContext, useContext, useState, useEffect } from 'react';
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

// Demo-Daten für Development (representing past registrations)
const DEMO_REGISTRATIONS = [
  // 2024 Registrations
  { sailor_id: '1', first_name: 'Max', last_name: 'Müller', event_location: 'Warnemünde', event_type: 'regatta', boat_class: 'Optimist', is_championship: true, year: 2024 },
  { sailor_id: '1', first_name: 'Max', last_name: 'Müller', event_location: 'Kiel', event_type: 'regatta', boat_class: 'Optimist', is_championship: true, year: 2024 },
  { sailor_id: '1', first_name: 'Max', last_name: 'Müller', event_location: 'Wannsee, Berlin', event_type: 'regatta', boat_class: 'Optimist', is_championship: false, year: 2024 },
  { sailor_id: '1', first_name: 'Max', last_name: 'Müller', event_location: 'Warnemünde', event_type: 'trainingslager', boat_class: 'Optimist', is_championship: false, year: 2024 },

  { sailor_id: '2', first_name: 'Sophie', last_name: 'Schmidt', event_location: 'Kiel', event_type: 'regatta', boat_class: 'ILCA 4', is_championship: true, year: 2024 },
  { sailor_id: '2', first_name: 'Sophie', last_name: 'Schmidt', event_location: 'Travemünde', event_type: 'regatta', boat_class: 'ILCA 4', is_championship: false, year: 2024 },
  { sailor_id: '2', first_name: 'Sophie', last_name: 'Schmidt', event_location: 'Warnemünde', event_type: 'trainingslager', boat_class: 'ILCA 4', is_championship: false, year: 2024 },
  { sailor_id: '2', first_name: 'Sophie', last_name: 'Schmidt', event_location: 'Wannsee, Berlin', event_type: 'regatta', boat_class: 'ILCA 4', is_championship: false, year: 2024 },
  { sailor_id: '2', first_name: 'Sophie', last_name: 'Schmidt', event_location: 'Steinhuder Meer', event_type: 'regatta', boat_class: 'ILCA 4', is_championship: false, year: 2024 },

  { sailor_id: '3', first_name: 'Lena', last_name: 'Fischer', event_location: 'Wannsee, Berlin', event_type: 'regatta', boat_class: 'Optimist', is_championship: false, year: 2024 },
  { sailor_id: '3', first_name: 'Lena', last_name: 'Fischer', event_location: 'Warnemünde', event_type: 'regatta', boat_class: 'Optimist', is_championship: false, year: 2024 },
  { sailor_id: '3', first_name: 'Lena', last_name: 'Fischer', event_location: 'Tegeler See', event_type: 'training', boat_class: 'Optimist', is_championship: false, year: 2024 },

  { sailor_id: '4', first_name: 'Tim', last_name: 'Weber', event_location: 'Kiel', event_type: 'regatta', boat_class: '420er', is_championship: true, year: 2024 },
  { sailor_id: '4', first_name: 'Tim', last_name: 'Weber', event_location: 'Warnemünde', event_type: 'regatta', boat_class: '420er', is_championship: false, year: 2024 },
  { sailor_id: '4', first_name: 'Tim', last_name: 'Weber', event_location: 'Travemünde', event_type: 'trainingslager', boat_class: '420er', is_championship: false, year: 2024 },
];

// Known locations with coordinates (can be extended via Nominatim)
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
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
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
 * Get coordinates for a location (from cache or via Nominatim)
 * @param {string} location
 * @returns {Promise<{lat: number, lon: number} | null>}
 */
async function geocodeLocation(location) {
  const normalized = location.toLowerCase().trim();

  // Check cache first
  if (KNOWN_LOCATIONS[normalized]) {
    return KNOWN_LOCATIONS[normalized];
  }

  // In production, use Nominatim API
  // For demo, return null for unknown locations
  // const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&countrycodes=de`);
  // const data = await response.json();
  // if (data.length > 0) {
  //   return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  // }

  return null;
}

export function DataProvider({ children }) {
  const [registrations, setRegistrations] = useState(DEMO_REGISTRATIONS);
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2024);

  // Club location
  const clubLocation = CLUB_LOCATION || { latitude: 52.5833, longitude: 13.2833 };

  /**
   * Get available years
   * @returns {number[]}
   */
  const getAvailableYears = () => {
    const years = [...new Set(registrations.map(r => r.year))];
    return years.sort((a, b) => b - a);
  };

  /**
   * Calculate statistics for a year
   * @param {number} year
   * @returns {SailorStats[]}
   */
  const calculateYearlyStats = async (year) => {
    const yearRegistrations = registrations.filter(r => r.year === year);

    // Group by sailor
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
      sailor.boat_classes.add(reg.boat_class);
    }

    // Calculate stats for each sailor
    const stats = [];

    for (const [, sailor] of sailorMap) {
      let totalDistance = 0;

      for (const event of sailor.events) {
        const location = await geocodeLocation(event.event_location);
        if (location) {
          const distance = calculateDistance(
            clubLocation.latitude,
            clubLocation.longitude,
            location.lat,
            location.lon
          );
          totalDistance += distance * 2; // Round trip
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
   * @param {number} year
   * @returns {Object}
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
   * Calculate and set awards for a year
   * @param {number} year
   */
  const calculateAwards = async (year) => {
    const stats = await calculateYearlyStats(year);
    if (stats.length === 0) return;

    const newAwards = [];

    // Most events
    const topEvents = [...stats].sort((a, b) => b.event_count - a.event_count)[0];
    if (topEvents) {
      newAwards.push({
        id: `award_${year}_events`,
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
        id: `award_${year}_distance`,
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
        id: `award_${year}_regattas`,
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
        id: `award_${year}_championships`,
        year,
        category: 'most_championships',
        sailor_first_name: topChampionships.first_name,
        sailor_last_name: topChampionships.last_name,
        value: topChampionships.championships_attended,
        description: `${topChampionships.championships_attended} Meisterschaften`,
      });
    }

    setAwards(prev => [...prev.filter(a => a.year !== year), ...newAwards]);
  };

  /**
   * Get awards for a year
   * @param {number} year
   * @returns {YearlyAward[]}
   */
  const getAwards = (year) => {
    return awards.filter(a => a.year === year);
  };

  const value = {
    registrations,
    awards,
    loading,
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
