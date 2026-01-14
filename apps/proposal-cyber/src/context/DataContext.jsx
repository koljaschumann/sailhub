import { createContext, useContext, useState, useEffect } from 'react';
import { scrapeManage2Sail, parseRegattaResults, findSailorResult } from '@tsc/supabase/manage2sail';

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
  // Saison State
  const [currentSeason, setCurrentSeason] = useState(() => {
    return localStorage.getItem('tsc-current-season') || CURRENT_YEAR.toString();
  });
  const [seasons, setSeasons] = useState(() => {
    const saved = localStorage.getItem('tsc-seasons');
    return saved ? JSON.parse(saved) : [CURRENT_YEAR.toString()];
  });

  // Bootsdaten / Profil
  const [boatData, setBoatData] = useState(() => {
    const saved = localStorage.getItem('tsc-boat-data');
    return saved ? JSON.parse(saved) : {
      seglername: '',
      segelnummer: '',
      bootsklasse: 'Optimist',
      iban: '',
      kontoinhaber: '',
    };
  });

  // Crew-Datenbank
  const [crewDatabase, setCrewDatabase] = useState(() => {
    const saved = localStorage.getItem('tsc-crew-database');
    return saved ? JSON.parse(saved) : [];
  });

  // Regatten (pro Saison)
  const [allRegatten, setAllRegatten] = useState(() => {
    const saved = localStorage.getItem('tsc-all-regatten');
    return saved ? JSON.parse(saved) : {};
  });

  // PDF Attachments
  const [pdfAttachments, setPdfAttachments] = useState(() => {
    const saved = localStorage.getItem('tsc-pdf-attachments');
    return saved ? JSON.parse(saved) : [];
  });

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('tsc-onboarding-done');
  });

  // Aktuelle Regatten der Saison
  const regatten = allRegatten[currentSeason] || [];

  const setRegatten = (newRegatten) => {
    const updated = typeof newRegatten === 'function'
      ? newRegatten(regatten)
      : newRegatten;
    setAllRegatten(prev => ({ ...prev, [currentSeason]: updated }));
  };

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('tsc-current-season', currentSeason);
  }, [currentSeason]);

  useEffect(() => {
    localStorage.setItem('tsc-seasons', JSON.stringify(seasons));
  }, [seasons]);

  useEffect(() => {
    localStorage.setItem('tsc-boat-data', JSON.stringify(boatData));
  }, [boatData]);

  useEffect(() => {
    localStorage.setItem('tsc-crew-database', JSON.stringify(crewDatabase));
  }, [crewDatabase]);

  useEffect(() => {
    localStorage.setItem('tsc-all-regatten', JSON.stringify(allRegatten));
  }, [allRegatten]);

  useEffect(() => {
    localStorage.setItem('tsc-pdf-attachments', JSON.stringify(pdfAttachments));
  }, [pdfAttachments]);

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

  // Helper functions
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

  const addRegatta = (regatta) => {
    const newRegatta = {
      ...regatta,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setRegatten(prev => [...prev, newRegatta]);
    return newRegatta;
  };

  /**
   * Import regatta data from Manage2Sail URL
   * @param {string} url - Manage2Sail URL (e.g., https://www.manage2sail.com/de-AT/event/xyz#!/results)
   * @returns {Promise<{regattaName, regattaDate, placement, totalParticipants, manage2sailId}>}
   */
  const importFromManage2Sail = async (url) => {
    const scraped = await scrapeManage2Sail(url);

    // Gemini returns direct JSON, Firecrawl returns HTML that needs parsing
    let parsed;
    if (scraped.regattaName) {
      // Direct Gemini response - already parsed
      parsed = scraped;
    } else {
      // Firecrawl fallback - needs HTML parsing
      const content = scraped.markdown || scraped.rawHtml || scraped.content || '';
      parsed = parseRegattaResults(content, url);
    }

    // Try to find the sailor's result based on their sail number
    const sailorResult = boatData.segelnummer
      ? findSailorResult(parsed.results || [], boatData.segelnummer)
      : null;

    return {
      regattaName: parsed.regattaName,
      regattaDate: parsed.regattaDate ? (typeof parsed.regattaDate === 'string' ? parsed.regattaDate : parsed.regattaDate.toISOString().split('T')[0]) : '',
      placement: sailorResult?.placement || '',
      totalParticipants: parsed.totalParticipants || parsed.results?.length || '',
      raceCount: parsed.raceCount || '',
      manage2sailId: parsed.manage2sailId,
      manage2sailUrl: url,
      location: parsed.location || '',
    };
  };

  const updateRegatta = (id, updates) => {
    setRegatten(prev => prev.map(r =>
      r.id === id ? { ...r, ...updates } : r
    ));
  };

  const deleteRegatta = (id) => {
    setRegatten(prev => prev.filter(r => r.id !== id));
    // Also remove attachments
    setPdfAttachments(prev => prev.filter(a => a.regattaId !== id));
  };

  const addCrewMember = (member) => {
    const newMember = { ...member, id: Date.now().toString() };
    setCrewDatabase(prev => [...prev, newMember]);
    return newMember;
  };

  const updateCrewMember = (id, updates) => {
    setCrewDatabase(prev => prev.map(m =>
      m.id === id ? { ...m, ...updates } : m
    ));
  };

  const deleteCrewMember = (id) => {
    setCrewDatabase(prev => prev.filter(m => m.id !== id));
  };

  const addPdfAttachment = (attachment) => {
    setPdfAttachments(prev => [...prev, attachment]);
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('tsc-onboarding-done', 'true');
  };

  const changeSeason = (season) => {
    if (!seasons.includes(season)) {
      setSeasons(prev => [...prev, season]);
    }
    setCurrentSeason(season);
  };

  return (
    <DataContext.Provider value={{
      // Season
      currentSeason,
      seasons,
      changeSeason,

      // Boat/Profile
      boatData,
      setBoatData,

      // Regatten
      regatten,
      addRegatta,
      updateRegatta,
      deleteRegatta,
      importFromManage2Sail,

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
