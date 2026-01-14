import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@tsc/supabase';

/**
 * @typedef {'segelboot' | 'motorboot' | 'haenger'} EquipmentTypeName
 * @typedef {Object} EquipmentType
 * @property {string} id
 * @property {EquipmentTypeName} name
 * @property {string} display_name
 *
 * @typedef {Object} Equipment
 * @property {string} id
 * @property {string} type_id
 * @property {string} name
 * @property {string} [description]
 * @property {boolean} active
 * @property {EquipmentType} [type]
 *
 * @typedef {'offen' | 'in_bearbeitung' | 'erledigt'} DamageStatus
 *
 * @typedef {Object} DamageReportPhoto
 * @property {string} id
 * @property {string} storage_path
 * @property {string} file_name
 * @property {number} file_size
 * @property {string} mime_type
 *
 * @typedef {Object} DamageReport
 * @property {string} id
 * @property {string} equipment_id
 * @property {Equipment} [equipment]
 * @property {string} description
 * @property {string} reporter_name
 * @property {string} [reporter_email]
 * @property {DamageStatus} status
 * @property {string} [pdf_url]
 * @property {DamageReportPhoto[]} [photos]
 * @property {string} created_at
 */

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [damageReports, setDamageReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =============================================
  // Daten aus Supabase laden
  // =============================================

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Equipment-Typen laden
      // Sortierung nach name statt display_order (Feld existiert nicht in DB)
      const { data: typesData, error: typesError } = await supabase
        .from('equipment_types')
        .select('*')
        .order('name', { ascending: true });

      if (typesError) throw typesError;
      setEquipmentTypes(typesData || []);

      // Equipment laden
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select(`
          *,
          type:equipment_types(*)
        `)
        .order('name', { ascending: true });

      if (equipmentError) throw equipmentError;
      setEquipment(equipmentData || []);

      // Schadensmeldungen laden
      const { data: reportsData, error: reportsError } = await supabase
        .from('damage_reports')
        .select(`
          *,
          equipment:equipment(
            *,
            type:equipment_types(*)
          ),
          photos:damage_report_photos(*)
        `)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;
      setDamageReports(reportsData || []);

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
   * Get equipment filtered by type
   */
  const getEquipmentByType = (typeId) => {
    if (!typeId) return equipment.filter(e => e.active);
    return equipment.filter(e => e.type_id === typeId && e.active);
  };

  /**
   * Get equipment with type info
   */
  const getEquipmentWithType = (equipmentId) => {
    return equipment.find(e => e.id === equipmentId);
  };

  // =============================================
  // E-Mail Versand
  // =============================================

  /**
   * Send confirmation email via Edge Function
   */
  const sendConfirmationEmail = async (payload) => {
    const { data, error } = await supabase.functions.invoke('send-damage-confirmation', {
      body: payload,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  // =============================================
  // Schadensmeldungen
  // =============================================

  /**
   * Add a new damage report
   */
  const addDamageReport = async (report) => {
    setLoading(true);

    try {
      // Schadensmeldung erstellen
      const { data: reportData, error: reportError } = await supabase
        .from('damage_reports')
        .insert({
          equipment_id: report.equipment_id,
          description: report.description,
          reporter_name: report.reporter_name,
          reporter_email: report.reporter_email || null,
          status: 'offen',
        })
        .select(`
          *,
          equipment:equipment(
            *,
            type:equipment_types(*)
          )
        `)
        .single();

      if (reportError) throw reportError;

      // Fotos hochladen und speichern
      const uploadedPhotos = [];
      for (const photo of report.photos) {
        const fileName = `${Date.now()}_${photo.file.name}`;
        const storagePath = `damage-photos/${reportData.id}/${fileName}`;

        // Foto in Supabase Storage hochladen
        const { error: uploadError } = await supabase.storage
          .from('damage-reports')
          .upload(storagePath, photo.file);

        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
          continue;
        }

        // Foto-Eintrag in Datenbank erstellen
        const { data: photoData, error: photoError } = await supabase
          .from('damage_report_photos')
          .insert({
            report_id: reportData.id,
            storage_path: storagePath,
            file_name: photo.file.name,
            file_size: photo.file.size,
            mime_type: photo.file.type,
          })
          .select()
          .single();

        if (!photoError && photoData) {
          uploadedPhotos.push(photoData);
        }
      }

      // Neuen Report mit Fotos zur Liste hinzufügen
      const newReport = {
        ...reportData,
        photos: uploadedPhotos,
      };

      setDamageReports(prev => [newReport, ...prev]);

      // Bestätigungs-E-Mail senden (async, ohne await - soll UI nicht blockieren)
      if (report.reporter_email) {
        sendConfirmationEmail({
          reporterName: report.reporter_name,
          reporterEmail: report.reporter_email,
          equipmentName: reportData.equipment?.name || 'Unbekannt',
          equipmentType: reportData.equipment?.type?.display_name || 'Equipment',
          description: report.description,
          reportId: reportData.id,
          createdAt: reportData.created_at,
        }).catch(err => {
          console.error('Error sending confirmation email:', err);
          // E-Mail-Fehler soll nicht die Schadensmeldung blockieren
        });
      }

      return newReport;

    } catch (err) {
      console.error('Error adding damage report:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update damage report status
   */
  const updateReportStatus = async (reportId, status) => {
    try {
      const { error } = await supabase
        .from('damage_reports')
        .update({ status })
        .eq('id', reportId);

      if (error) throw error;

      setDamageReports(prev =>
        prev.map(r =>
          r.id === reportId ? { ...r, status } : r
        )
      );
    } catch (err) {
      console.error('Error updating report status:', err);
      setError(err.message);
    }
  };

  // =============================================
  // Equipment verwalten
  // =============================================

  /**
   * Add new equipment
   */
  const addEquipment = async (eq) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .insert({
          type_id: eq.type_id,
          name: eq.name,
          description: eq.description || null,
          active: true,
        })
        .select(`
          *,
          type:equipment_types(*)
        `)
        .single();

      if (error) throw error;

      setEquipment(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error adding equipment:', err);
      setError(err.message);
      return null;
    }
  };

  /**
   * Update equipment
   */
  const updateEquipment = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .update({
          name: updates.name,
          description: updates.description,
        })
        .eq('id', id);

      if (error) throw error;

      setEquipment(prev =>
        prev.map(e => e.id === id ? { ...e, ...updates } : e)
      );
    } catch (err) {
      console.error('Error updating equipment:', err);
      setError(err.message);
    }
  };

  /**
   * Delete (deactivate) equipment
   */
  const deleteEquipment = async (id) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;

      setEquipment(prev =>
        prev.map(e => e.id === id ? { ...e, active: false } : e)
      );
    } catch (err) {
      console.error('Error deleting equipment:', err);
      setError(err.message);
    }
  };

  const value = {
    equipmentTypes,
    equipment,
    damageReports,
    loading,
    error,
    getEquipmentByType,
    getEquipmentWithType,
    addDamageReport,
    updateReportStatus,
    addEquipment,
    updateEquipment,
    deleteEquipment,
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
