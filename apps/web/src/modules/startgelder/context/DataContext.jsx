import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@tsc/supabase';
import { useAuth } from '@tsc/supabase';

const DataContext = createContext();

// Bootsklassen-Konfiguration
export const BOAT_CLASSES = {
  'Optimist': { crew: 1, alias: ['Opti', 'Optimist A', 'Optimist B'] },
  'ILCA 4': { crew: 1, alias: ['Laser 4.7', 'Laser4.7'] },
  'ILCA 6': { crew: 1, alias: ['Laser Radial', 'LaserRadial'] },
  'ILCA 7': { crew: 1, alias: ['Laser Standard', 'Laser', 'LaserStandard'] },
  'Europe': { crew: 1 },
  'Finn': { crew: 1 },
  'Contender': { crew: 1 },
  'OK-Jolle': { crew: 1, alias: ['OK', 'OK Jolle'] },
  'O-Jolle': { crew: 1 },
  'RS Aero': { crew: 1, alias: ['RSAero', 'RS Aero 5', 'RS Aero 7', 'RS Aero 9'] },
  '420er': { crew: 2, alias: ['420', '420er'] },
  '470er': { crew: 2, alias: ['470', '470er'] },
  '29er': { crew: 2 },
  '49er': { crew: 2 },
  '49er FX': { crew: 2 },
  'Nacra 17': { crew: 2 },
  'Korsar': { crew: 2 },
  'Pirat': { crew: 2 },
  'Flying Dutchman': { crew: 2, alias: ['FD'] },
  'Flying Junior': { crew: 2, alias: ['FJ'] },
  'Vaurien': { crew: 2 },
  'Cadet': { crew: 2 },
  'Teeny': { crew: 2 },
  'Yngling': { crew: 3 },
  'Soling': { crew: 3 },
  'Drachen': { crew: 3, alias: ['Dragon'] },
  'H-Boot': { crew: 3 },
  'Folkeboot': { crew: 3, alias: ['Folke'] },
  'Kielzugvogel': { crew: 2, alias: ['Zugvogel'] },
  'Varianta': { crew: 3 },
  'J/70': { crew: 5, alias: ['J70', 'J 70'] },
  'J/80': { crew: 5, alias: ['J80', 'J 80'] },
  'J/24': { crew: 5, alias: ['J24', 'J 24'] },
  'Platu 25': { crew: 5 },
  'Melges 24': { crew: 5 },
  'SB20': { crew: 3 },
  'Tempest': { crew: 2 },
};

const CURRENT_YEAR = new Date().getFullYear();

export function DataProvider({ children }) {
  const { user } = useAuth();

  // Loading & Error State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Saison State
  const [currentSeason, setCurrentSeason] = useState(CURRENT_YEAR.toString());
  const [seasons, setSeasons] = useState([CURRENT_YEAR.toString()]);

  // Segler-Profil (aus sailors Tabelle)
  const [sailor, setSailor] = useState(null);

  // Bootsdaten / Profil (für Kompatibilität)
  const [boatData, setBoatDataState] = useState({
    seglername: '',
    segelnummer: '',
    bootsklasse: 'Optimist',
    iban: '',
    kontoinhaber: '',
  });

  // Crew-Datenbank
  const [crewDatabase, setCrewDatabase] = useState([]);

  // Regatten
  const [regatten, setRegattenState] = useState([]);

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);

  // =============================================
  // Daten aus Supabase laden
  // =============================================

  // UUID Validierung
  const isValidUUID = (str) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const loadData = useCallback(async () => {
    console.log('[Startgelder] loadData called, user:', user?.id);

    if (!user) {
      console.log('[Startgelder] No user, stopping load');
      setLoading(false);
      return;
    }

    // Dev-User haben keine gueltige UUID - direkt Onboarding zeigen
    if (!isValidUUID(user.id)) {
      console.log('[Startgelder] Dev user detected, showing onboarding');
      setShowOnboarding(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Timeout nach 10 Sekunden
    const timeoutId = setTimeout(() => {
      console.error('[Startgelder] Loading timeout after 10s');
      setError('Zeitüberschreitung beim Laden. Bitte Seite neu laden.');
      setLoading(false);
    }, 30000);

    try {
      console.log('[Startgelder] Fetching sailor for parent_id:', user.id);

      // Segler-Profil laden mit Query-Timeout (5 Sekunden)
      const sailorQuery = supabase
        .from('sailors')
        .select('*')
        .eq('parent_id', user.id)
        .limit(1);

      const queryTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('QUERY_TIMEOUT')), 15000)
      );

      let sailorsArray = [];
      let sailorError = null;

      try {
        const result = await Promise.race([sailorQuery, queryTimeout]);
        sailorsArray = result.data || [];
        sailorError = result.error;
      } catch (e) {
        if (e.message === 'QUERY_TIMEOUT') {
          console.log('[Startgelder] Sailor query timed out, assuming no profile');
          // Bei Timeout: Onboarding zeigen (kein Profil)
          setShowOnboarding(true);
          clearTimeout(timeoutId);
          setLoading(false);
          return;
        }
        throw e;
      }

      console.log('[Startgelder] Sailor result:', sailorsArray, sailorError);

      if (sailorError) {
        console.error('[Startgelder] Sailor query error:', sailorError);
        throw sailorError;
      }

      // Kein Segler gefunden - Onboarding anzeigen
      if (!sailorsArray || sailorsArray.length === 0) {
        console.log('[Startgelder] No sailor found, showing onboarding');
        setShowOnboarding(true);
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }

      const sailorData = sailorsArray[0];

      if (sailorData) {
        setSailor(sailorData);
        setBoatDataState({
          seglername: sailorData.name || '',
          segelnummer: sailorData.sail_number || '',
          bootsklasse: sailorData.boat_class || 'Optimist',
          iban: sailorData.iban || '',
          kontoinhaber: sailorData.account_holder || '',
        });
        setShowOnboarding(false);

        // Crew-Mitglieder laden
        const { data: crewData } = await supabase
          .from('crew_members')
          .select('*')
          .eq('sailor_id', sailorData.id);

        if (crewData) {
          setCrewDatabase(crewData.map(c => ({
            id: c.id,
            name: c.name,
            bootsklasse: c.boat_class,
          })));
        }

        // Regatten laden (für aktuelle Saison)
        const { data: regattaData } = await supabase
          .from('regatta_entries')
          .select('*')
          .eq('sailor_id', sailorData.id)
          .eq('season', currentSeason)
          .order('regatta_date', { ascending: false });

        if (regattaData) {
          setRegattenState(regattaData.map(r => ({
            id: r.id,
            regattaName: r.regatta_name,
            date: r.regatta_date,
            boatClass: r.boat_class,
            placement: r.placement,
            totalParticipants: r.total_participants,
            raceCount: r.race_count,
            invoiceAmount: parseFloat(r.invoice_amount) || 0,
            crewMembers: r.crew_members || [],
            manage2sailId: r.manage2sail_id,
            status: r.status,
            createdAt: r.created_at,
          })));
        }

        // Alle Saisons ermitteln
        const { data: seasonsData } = await supabase
          .from('regatta_entries')
          .select('season')
          .eq('sailor_id', sailorData.id);

        if (seasonsData) {
          const uniqueSeasons = [...new Set(seasonsData.map(s => s.season))];
          if (!uniqueSeasons.includes(CURRENT_YEAR.toString())) {
            uniqueSeasons.push(CURRENT_YEAR.toString());
          }
          setSeasons(uniqueSeasons.sort().reverse());
        }
      }
    } catch (err) {
      console.error('[Startgelder] Error loading data:', err);
      setError(err.message);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [user, currentSeason]);

  // Daten laden wenn User sich ändert
  useEffect(() => {
    loadData();
  }, [loadData]);

  // =============================================
  // Segler-Profil speichern
  // =============================================

  const setBoatData = async (newBoatDataOrFn) => {
    if (!user) return;

    // Handle functional updates
    let newBoatData;
    if (typeof newBoatDataOrFn === 'function') {
      newBoatData = newBoatDataOrFn(boatData);
    } else {
      newBoatData = newBoatDataOrFn;
    }

    setBoatDataState(newBoatData);

    // Skip if incomplete
    if (!newBoatData.seglername || !newBoatData.segelnummer) {
      console.log('[Startgelder] Skip save - incomplete');
      return;
    }

    console.log('[Startgelder] Saving:', newBoatData.seglername);

    try {
      if (sailor) {
        // Update existierenden Segler
        const { error } = await supabase
          .from('sailors')
          .update({
            name: newBoatData.seglername,
            sail_number: newBoatData.segelnummer,
            boat_class: newBoatData.bootsklasse,
            iban: newBoatData.iban,
            account_holder: newBoatData.kontoinhaber,
          })
          .eq('id', sailor.id);

        if (error) throw error;
      } else {
        // Neuen Segler erstellen mit Timeout
        console.log('[Startgelder] Creating sailor with data:', { parent_id: user.id, name: newBoatData.seglername, sail_number: newBoatData.segelnummer });
        
        const insertQuery = supabase
          .from('sailors')
          .insert({
            parent_id: user.id,
            name: newBoatData.seglername,
            sail_number: newBoatData.segelnummer,
            boat_class: newBoatData.bootsklasse,
            iban: newBoatData.iban,
            account_holder: newBoatData.kontoinhaber,
          })
          .select()
          .single();

        const insertTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('INSERT_TIMEOUT')), 30000)
        );

        try {
          const { data, error } = await Promise.race([insertQuery, insertTimeout]);
          if (error) throw error;
          console.log('[Startgelder] Sailor created:', data.id);
          setSailor(data);
          setShowOnboarding(false);
        } catch (e) {
          if (e.message === 'INSERT_TIMEOUT') {
            throw new Error('Zeitüberschreitung beim Speichern. Bitte versuche es erneut.');
          }
          throw e;
        }
      }
    } catch (err) {
      console.error('[Startgelder] Error saving:', err);
      setError(err.message);
      throw err; // Re-throw for caller to handle
    }
  };

  // =============================================
  // Regatten
  // =============================================

  const addRegatta = async (regatta) => {
    if (!user || !sailor) return null;

    // Robuste Extraktion des Regatta-Namens
    const regattaName = (regatta.regattaName && regatta.regattaName.trim()) ||
                        (regatta.name && regatta.name.trim()) ||
                        `Regatta ${new Date().toLocaleDateString('de-DE')}`;

    console.log('[Startgelder] addRegatta called with:', {
      regattaName,
      originalRegattaName: regatta.regattaName,
      originalName: regatta.name,
      date: regatta.date,
      invoiceAmount: regatta.invoiceAmount
    });

    try {
      const { data, error } = await supabase
        .from('regatta_entries')
        .insert({
          sailor_id: sailor.id,
          season: currentSeason,
          regatta_name: regattaName,
          regatta_date: regatta.date || null,
          boat_class: regatta.boatClass || boatData.bootsklasse,
          placement: regatta.placement || null,
          total_participants: regatta.totalParticipants || regatta.participants || null,
          race_count: regatta.raceCount || null,
          invoice_amount: regatta.invoiceAmount,
          crew_members: regatta.crew || regatta.crewMembers || [],
          manage2sail_id: regatta.manage2sailId || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      const newRegatta = {
        id: data.id,
        regattaName: data.regatta_name,
        date: data.regatta_date,
        boatClass: data.boat_class,
        placement: data.placement,
        totalParticipants: data.total_participants,
        raceCount: data.race_count,
        invoiceAmount: parseFloat(data.invoice_amount) || 0,
        crewMembers: data.crew_members || [],
        manage2sailId: data.manage2sail_id,
        status: data.status,
        createdAt: data.created_at,
      };

      setRegattenState(prev => [newRegatta, ...prev]);
      return newRegatta;
    } catch (err) {
      console.error('Error adding regatta:', err);
      setError(err.message);
      return null;
    }
  };

  const updateRegatta = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('regatta_entries')
        .update({
          regatta_name: updates.regattaName,
          regatta_date: updates.date,
          boat_class: updates.boatClass,
          placement: updates.placement,
          total_participants: updates.totalParticipants,
          race_count: updates.raceCount,
          invoice_amount: updates.invoiceAmount,
          crew_members: updates.crewMembers,
        })
        .eq('id', id);

      if (error) throw error;

      setRegattenState(prev => prev.map(r =>
        r.id === id ? { ...r, ...updates } : r
      ));
    } catch (err) {
      console.error('Error updating regatta:', err);
      setError(err.message);
    }
  };

  const deleteRegatta = async (id) => {
    try {
      const { error } = await supabase
        .from('regatta_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRegattenState(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error deleting regatta:', err);
      setError(err.message);
    }
  };

  // =============================================
  // Crew-Mitglieder
  // =============================================

  const addCrewMember = async (member) => {
    if (!sailor) return null;

    try {
      const { data, error } = await supabase
        .from('crew_members')
        .insert({
          sailor_id: sailor.id,
          name: member.name,
          boat_class: member.bootsklasse,
        })
        .select()
        .single();

      if (error) throw error;

      const newMember = {
        id: data.id,
        name: data.name,
        bootsklasse: data.boat_class,
      };

      setCrewDatabase(prev => [...prev, newMember]);
      return newMember;
    } catch (err) {
      console.error('Error adding crew member:', err);
      setError(err.message);
      return null;
    }
  };

  const updateCrewMember = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('crew_members')
        .update({
          name: updates.name,
          boat_class: updates.bootsklasse,
        })
        .eq('id', id);

      if (error) throw error;

      setCrewDatabase(prev => prev.map(m =>
        m.id === id ? { ...m, ...updates } : m
      ));
    } catch (err) {
      console.error('Error updating crew member:', err);
      setError(err.message);
    }
  };

  const deleteCrewMember = async (id) => {
    try {
      const { error } = await supabase
        .from('crew_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCrewDatabase(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Error deleting crew member:', err);
      setError(err.message);
    }
  };

  // =============================================
  // Hilfsfunktionen
  // =============================================

  const getMinCrewCount = (boatClass) => {
    const config = BOAT_CLASSES[boatClass];
    if (!config) return 1;
    const maxCrew = config.crew;
    if (maxCrew >= 4) return maxCrew - 1;
    return maxCrew;
  };

  const getMaxCrewCount = (boatClass) => {
    const config = BOAT_CLASSES[boatClass];
    return config ? config.crew : 1;
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  const changeSeason = (season) => {
    if (!seasons.includes(season)) {
      setSeasons(prev => [...prev, season].sort().reverse());
    }
    setCurrentSeason(season);
  };

  // Statistiken
  const totalAmount = regatten.reduce((sum, r) => sum + (r.invoiceAmount || 0), 0);
  const stats = {
    totalRegatten: regatten.length,
    totalAmount,
    bestPlacement: regatten.length > 0 ? Math.min(...regatten.map(r => r.placement || 999)) : null,
    avgPlacement: regatten.length > 0
      ? (regatten.reduce((sum, r) => sum + (r.placement || 0), 0) / regatten.length).toFixed(1)
      : null,
    totalRaces: regatten.reduce((sum, r) => sum + (r.raceCount || 0), 0),
  };

  // PDF Attachments (noch localStorage, TODO: Supabase Storage)
  const [pdfAttachments, setPdfAttachments] = useState([]);
  const addPdfAttachment = (attachment) => {
    setPdfAttachments(prev => [...prev, attachment]);
  };

  return (
    <DataContext.Provider value={{
      // Loading & Error
      loading,
      error,

      // Season
      currentSeason,
      seasons,
      changeSeason,

      // Boat/Profile
      boatData,
      setBoatData,
      sailor,

      // Regatten
      regatten,
      addRegatta,
      updateRegatta,
      deleteRegatta,

      // Crew
      crewDatabase,
      addCrewMember,
      updateCrewMember,
      deleteCrewMember,
      getMinCrewCount,
      getMaxCrewCount,

      // PDF
      pdfAttachments,
      addPdfAttachment,
      setPdfAttachments,

      // Stats
      stats,
      totalAmount,

      // Onboarding
      showOnboarding,
      completeOnboarding,

      // Constants
      BOAT_CLASSES,

      // Reload
      reload: loadData,
    }}>
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
