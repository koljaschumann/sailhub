import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@tsc/supabase';
import { useAuth } from '@tsc/supabase';

const DataContext = createContext();

// Initiale Deadline: 1. März des aktuellen Jahres
const getDefaultDeadline = () => {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-03-01`;
};

// Initiale Saison: April bis Oktober
const getDefaultSeason = () => {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
  return {
    start: `${year}-04-01`,
    end: `${year}-10-31`,
    name: `Saison ${year}`
  };
};

export function DataProvider({ children }) {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState([]);
  const [deadline, setDeadlineState] = useState(getDefaultDeadline());
  const [season, setSeasonState] = useState(getDefaultSeason());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lade Events aus Supabase
  const loadEvents = useCallback(async () => {
    try {
      console.log('Loading events...');
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      console.log('Events loaded:', data?.length || 0, error);
      if (error) throw error;

      // Transformiere Supabase Daten zu App-Format
      const transformedEvents = (data || []).map(e => ({
        id: e.id,
        type: e.type,
        name: e.name,
        organizer: e.organizer,
        location: e.location,
        boatClassId: e.boat_class_id,
        startDate: e.start_date,
        endDate: e.end_date,
        motorboatLoadingTime: e.motorboat_loading_time,
        requestedMotorboat: e.requested_motorboat,
        assignedMotorboat: e.assigned_motorboat,
        createdAt: e.created_at,
        trainerId: e.trainer_id,
        seasonId: e.season_id
      }));

      setEvents(transformedEvents);
    } catch (err) {
      console.error('Error loading events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lade aktuelle Saison aus Supabase
  const loadSeason = useCallback(async () => {
    try {
      console.log('Loading season...');
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .limit(1)
        .single();

      console.log('Season loaded:', data, error);
      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSeasonState({
          id: data.id,
          start: data.start_date,
          end: data.end_date,
          name: data.name
        });
        if (data.deadline) {
          setDeadlineState(data.deadline);
        }
      }
    } catch (err) {
      console.error('Error loading season:', err);
      // Verwende Defaults wenn keine Saison gefunden
    }
  }, []);

  // Initial Load with timeout
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.warn('Data loading timed out');
      setLoading(false);
    }, 10000);

    Promise.all([loadEvents(), loadSeason()])
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => clearTimeout(timeoutId);
  }, [loadEvents, loadSeason]);

  // Realtime Subscription für Events
  useEffect(() => {
    const channel = supabase
      .channel('events-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadEvents]);

  // Event hinzufügen
  const addEvent = async (event) => {
    try {
      const newEvent = {
        type: event.type,
        name: event.name,
        organizer: event.organizer || null,
        location: event.location || null,
        boat_class_id: event.boatClassId,
        start_date: event.startDate,
        end_date: event.endDate,
        motorboat_loading_time: event.motorboatLoadingTime,
        requested_motorboat: event.requestedMotorboat,
        assigned_motorboat: event.requestedMotorboat, // Initial gleich
        trainer_id: user?.id,
        season_id: season.id || null
      };

      const { data, error } = await supabase
        .from('events')
        .insert(newEvent)
        .select()
        .single();

      if (error) throw error;

      // Optimistic Update
      const transformedEvent = {
        id: data.id,
        type: data.type,
        name: data.name,
        organizer: data.organizer,
        location: data.location,
        boatClassId: data.boat_class_id,
        startDate: data.start_date,
        endDate: data.end_date,
        motorboatLoadingTime: data.motorboat_loading_time,
        requestedMotorboat: data.requested_motorboat,
        assignedMotorboat: data.assigned_motorboat,
        createdAt: data.created_at,
        trainerId: data.trainer_id,
        seasonId: data.season_id
      };

      setEvents(prev => [...prev, transformedEvent]);
      return transformedEvent;
    } catch (err) {
      console.error('Error adding event:', err);
      throw err;
    }
  };

  // Event aktualisieren
  const updateEvent = async (id, updates) => {
    try {
      const dbUpdates = {};
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.organizer !== undefined) dbUpdates.organizer = updates.organizer;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.boatClassId !== undefined) dbUpdates.boat_class_id = updates.boatClassId;
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
      if (updates.motorboatLoadingTime !== undefined) dbUpdates.motorboat_loading_time = updates.motorboatLoadingTime;
      if (updates.requestedMotorboat !== undefined) dbUpdates.requested_motorboat = updates.requestedMotorboat;
      if (updates.assignedMotorboat !== undefined) dbUpdates.assigned_motorboat = updates.assignedMotorboat;

      const { error } = await supabase
        .from('events')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      // Optimistic Update
      setEvents(prev => prev.map(event =>
        event.id === id ? { ...event, ...updates } : event
      ));
    } catch (err) {
      console.error('Error updating event:', err);
      throw err;
    }
  };

  // Event löschen
  const deleteEvent = async (id) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Optimistic Update
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      console.error('Error deleting event:', err);
      throw err;
    }
  };

  // Events für eine Bootsklasse
  const getEventsByBoatClass = (boatClassId) => {
    return events.filter(event => event.boatClassId === boatClassId);
  };

  // Events für einen Zeitraum
  const getEventsInRange = (startDate, endDate) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const rangeStart = new Date(startDate);
      const rangeEnd = new Date(endDate);
      return eventStart <= rangeEnd && eventEnd >= rangeStart;
    });
  };

  // Prüfen ob Eingabefrist abgelaufen
  const isDeadlinePassed = () => {
    return new Date() > new Date(deadline);
  };

  // Motorboot-Zuweisung ändern
  const assignMotorboat = async (eventId, motorboatId) => {
    await updateEvent(eventId, { assignedMotorboat: motorboatId });
  };

  // Deadline setzen (Admin)
  const setDeadline = async (newDeadline) => {
    try {
      if (season.id) {
        const { error } = await supabase
          .from('seasons')
          .update({ deadline: newDeadline })
          .eq('id', season.id);

        if (error) throw error;
      }
      setDeadlineState(newDeadline);
    } catch (err) {
      console.error('Error setting deadline:', err);
      throw err;
    }
  };

  // Saison setzen (Admin)
  const setSeason = async (newSeason) => {
    try {
      if (season.id) {
        const { error } = await supabase
          .from('seasons')
          .update({
            name: newSeason.name,
            start_date: newSeason.start,
            end_date: newSeason.end
          })
          .eq('id', season.id);

        if (error) throw error;
      } else {
        // Neue Saison erstellen
        const { data, error } = await supabase
          .from('seasons')
          .insert({
            name: newSeason.name,
            start_date: newSeason.start,
            end_date: newSeason.end
          })
          .select()
          .single();

        if (error) throw error;
        newSeason.id = data.id;
      }
      setSeasonState(newSeason);
    } catch (err) {
      console.error('Error setting season:', err);
      throw err;
    }
  };

  // Alle Daten zurücksetzen (für Admin)
  const resetAllData = async () => {
    try {
      // Lösche alle Events der aktuellen Saison
      if (season.id) {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('season_id', season.id);

        if (error) throw error;
      }

      setEvents([]);
      setDeadlineState(getDefaultDeadline());
      setSeasonState(getDefaultSeason());
    } catch (err) {
      console.error('Error resetting data:', err);
      throw err;
    }
  };

  // Demo-Daten laden (für Admin)
  const loadDemoData = async () => {
    const year = new Date().getFullYear();

    // Vereinfachte Demo-Daten
    const demoEvents = [
      {
        type: 'trainingslager',
        name: 'Ostertrainingslager Greifswald',
        location: 'Greifswald',
        boatClassId: 'opti-b',
        startDate: `${year}-04-12`,
        endDate: `${year}-04-18`,
        motorboatLoadingTime: `${year}-04-11T14:00`,
        requestedMotorboat: 'zodiac'
      },
      {
        type: 'regatta',
        name: 'Frühjahrspokal Wannsee',
        organizer: 'Verein Seglerhaus',
        boatClassId: 'opti-c',
        startDate: `${year}-04-26`,
        endDate: `${year}-04-27`,
        motorboatLoadingTime: `${year}-04-25T08:00`,
        requestedMotorboat: 'zodiac'
      },
      {
        type: 'regatta',
        name: 'Opti A Auftaktregatta',
        organizer: 'Berliner Yacht-Club',
        boatClassId: 'opti-a',
        startDate: `${year}-04-26`,
        endDate: `${year}-04-27`,
        motorboatLoadingTime: `${year}-04-25T09:00`,
        requestedMotorboat: 'zodiac'
      },
      {
        type: 'regatta',
        name: '29er Frühjahrsregatta',
        organizer: 'Potsdamer YC',
        boatClassId: '29er',
        startDate: `${year}-04-19`,
        endDate: `${year}-04-21`,
        motorboatLoadingTime: `${year}-04-18T07:00`,
        requestedMotorboat: 'tornado-rot'
      },
      {
        type: 'regatta',
        name: 'J70 Saisonauftakt',
        organizer: 'TSC Berlin',
        boatClassId: 'j70',
        startDate: `${year}-04-19`,
        endDate: `${year}-04-20`,
        motorboatLoadingTime: `${year}-04-18T08:00`,
        requestedMotorboat: 'tornado-rot'
      },
      {
        type: 'regatta',
        name: 'Berliner Jugendpokal',
        organizer: 'Berliner Yacht-Club',
        boatClassId: 'opti-c',
        startDate: `${year}-05-03`,
        endDate: `${year}-05-04`,
        motorboatLoadingTime: `${year}-05-02T08:00`,
        requestedMotorboat: 'narwhal'
      },
      {
        type: 'regatta',
        name: 'Piraten Pfingstcup',
        organizer: 'Müggelsee YC',
        boatClassId: 'pirat',
        startDate: `${year}-05-10`,
        endDate: `${year}-05-12`,
        motorboatLoadingTime: `${year}-05-09T07:00`,
        requestedMotorboat: 'narwhal'
      },
      {
        type: 'trainingslager',
        name: 'Sommertrainingslager Travemünde',
        location: 'Travemünde',
        boatClassId: '29er',
        startDate: `${year}-06-01`,
        endDate: `${year}-06-07`,
        motorboatLoadingTime: `${year}-05-31T06:00`,
        requestedMotorboat: 'tornado-grau'
      },
      {
        type: 'regatta',
        name: 'J70 Deutsche Meisterschaft',
        organizer: 'Kieler Woche',
        boatClassId: 'j70',
        startDate: `${year}-07-12`,
        endDate: `${year}-07-16`,
        motorboatLoadingTime: `${year}-07-11T07:00`,
        requestedMotorboat: 'tornado-rot'
      },
      {
        type: 'regatta',
        name: 'Opti C Abschlussregatta',
        organizer: 'TSC Berlin',
        boatClassId: 'opti-c',
        startDate: `${year}-10-25`,
        endDate: `${year}-10-26`,
        motorboatLoadingTime: `${year}-10-24T08:00`,
        requestedMotorboat: 'zodiac'
      }
    ];

    try {
      for (const event of demoEvents) {
        await addEvent(event);
      }

      await setSeason({
        start: `${year}-04-01`,
        end: `${year}-10-31`,
        name: `Saison ${year}`
      });

      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      await setDeadline(futureDate.toISOString().split('T')[0]);

      return demoEvents.length;
    } catch (err) {
      console.error('Error loading demo data:', err);
      throw err;
    }
  };

  return (
    <DataContext.Provider value={{
      events,
      deadline,
      season,
      loading,
      error,
      setDeadline,
      setSeason,
      addEvent,
      updateEvent,
      deleteEvent,
      getEventsByBoatClass,
      getEventsInRange,
      isDeadlinePassed,
      assignMotorboat,
      resetAllData,
      loadDemoData,
      refreshEvents: loadEvents
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
