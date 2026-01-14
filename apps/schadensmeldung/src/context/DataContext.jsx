import { createContext, useContext, useState, useEffect } from 'react';

/**
 * @typedef {'segelboot' | 'motorboot' | 'haenger'} EquipmentTypeName
 *
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

// Demo-Daten für Development
const DEMO_EQUIPMENT_TYPES = [
  { id: '1', name: 'segelboot', display_name: 'Segelboot' },
  { id: '2', name: 'motorboot', display_name: 'Motorboot' },
  { id: '3', name: 'haenger', display_name: 'Hänger' },
];

const DEMO_EQUIPMENT = [
  // Segelboote
  { id: '1', type_id: '1', name: 'Optimist', description: 'Optimist Jolle', active: true },
  { id: '2', type_id: '1', name: 'Laser', description: 'Laser Standard', active: true },
  { id: '3', type_id: '1', name: 'Laser Bahia', description: 'Laser Bahia Zweihand-Jolle', active: true },
  // Motorboote
  { id: '4', type_id: '2', name: 'Tornado Orange', description: 'Motorboot Tornado (orange)', active: true },
  { id: '5', type_id: '2', name: 'Tornado Grau', description: 'Motorboot Tornado (grau)', active: true },
  { id: '6', type_id: '2', name: 'Zodiac', description: 'Schlauchboot Zodiac', active: true },
  { id: '7', type_id: '2', name: 'Narwhal', description: 'Schlauchboot Narwhal', active: true },
  // Hänger
  { id: '8', type_id: '3', name: '6er Opti-Hänger', description: 'Hänger für 6 Optimisten', active: true },
  { id: '9', type_id: '3', name: '9er Opti-Hänger', description: 'Hänger für 9 Optimisten', active: true },
  { id: '10', type_id: '3', name: '29er-Hänger', description: 'Hänger für 29er', active: true },
  { id: '11', type_id: '3', name: 'Hänger Narwhal', description: 'Hänger für Narwhal', active: true },
  { id: '12', type_id: '3', name: 'Hänger Zodiac', description: 'Hänger für Zodiac', active: true },
  { id: '13', type_id: '3', name: 'Hänger Tornado Grau', description: 'Hänger für Tornado Grau', active: true },
  { id: '14', type_id: '3', name: 'Hänger Tornado Orange', description: 'Hänger für Tornado Orange', active: true },
];

export function DataProvider({ children }) {
  const [equipmentTypes, setEquipmentTypes] = useState(DEMO_EQUIPMENT_TYPES);
  const [equipment, setEquipment] = useState(DEMO_EQUIPMENT);
  const [damageReports, setDamageReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // TODO: Replace with Supabase queries when connected
  const devMode = true;

  useEffect(() => {
    if (devMode) {
      // Load demo damage reports from localStorage
      const stored = localStorage.getItem('tsc_damage_reports');
      if (stored) {
        setDamageReports(JSON.parse(stored));
      }
    }
  }, []);

  // Save damage reports to localStorage
  useEffect(() => {
    if (devMode && damageReports.length > 0) {
      localStorage.setItem('tsc_damage_reports', JSON.stringify(damageReports));
    }
  }, [damageReports]);

  /**
   * Get equipment filtered by type
   * @param {string} [typeId]
   * @returns {Equipment[]}
   */
  const getEquipmentByType = (typeId) => {
    if (!typeId) return equipment.filter(e => e.active);
    return equipment.filter(e => e.type_id === typeId && e.active);
  };

  /**
   * Get equipment with type info
   * @param {string} equipmentId
   * @returns {Equipment | undefined}
   */
  const getEquipmentWithType = (equipmentId) => {
    const eq = equipment.find(e => e.id === equipmentId);
    if (!eq) return undefined;
    const type = equipmentTypes.find(t => t.id === eq.type_id);
    return { ...eq, type };
  };

  /**
   * Add a new damage report
   * @param {Object} report
   * @param {string} report.equipment_id
   * @param {string} report.description
   * @param {string} report.reporter_name
   * @param {string} [report.reporter_email]
   * @param {Array<{file: File, preview: string}>} report.photos
   * @returns {Promise<DamageReport>}
   */
  const addDamageReport = async (report) => {
    setLoading(true);

    try {
      const eq = getEquipmentWithType(report.equipment_id);

      // Create photo objects (in real app, upload to Supabase Storage)
      const photoObjects = report.photos.map((photo, index) => ({
        id: `photo_${Date.now()}_${index}`,
        storage_path: `damage-photos/${Date.now()}_${photo.file.name}`,
        file_name: photo.file.name,
        file_size: photo.file.size,
        mime_type: photo.file.type,
        // Store preview for demo mode
        preview: photo.preview,
      }));

      const newReport = {
        id: `report_${Date.now()}`,
        equipment_id: report.equipment_id,
        equipment: eq,
        description: report.description,
        reporter_name: report.reporter_name,
        reporter_email: report.reporter_email || null,
        status: 'offen',
        pdf_url: null,
        photos: photoObjects,
        created_at: new Date().toISOString(),
      };

      setDamageReports(prev => [newReport, ...prev]);

      // TODO: In production:
      // 1. Upload photos to Supabase Storage
      // 2. Insert report into database
      // 3. Call Edge Function to generate PDF and send email

      return newReport;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update damage report status
   * @param {string} reportId
   * @param {DamageStatus} status
   */
  const updateReportStatus = async (reportId, status) => {
    setDamageReports(prev =>
      prev.map(r =>
        r.id === reportId
          ? { ...r, status, updated_at: new Date().toISOString() }
          : r
      )
    );
  };

  /**
   * Add new equipment
   * @param {Object} eq
   * @param {string} eq.type_id
   * @param {string} eq.name
   * @param {string} [eq.description]
   */
  const addEquipment = async (eq) => {
    const newEquipment = {
      id: `eq_${Date.now()}`,
      type_id: eq.type_id,
      name: eq.name,
      description: eq.description || null,
      active: true,
    };
    setEquipment(prev => [...prev, newEquipment]);
    return newEquipment;
  };

  /**
   * Update equipment
   * @param {string} id
   * @param {Partial<Equipment>} updates
   */
  const updateEquipment = async (id, updates) => {
    setEquipment(prev =>
      prev.map(e => e.id === id ? { ...e, ...updates } : e)
    );
  };

  /**
   * Delete (deactivate) equipment
   * @param {string} id
   */
  const deleteEquipment = async (id) => {
    setEquipment(prev =>
      prev.map(e => e.id === id ? { ...e, active: false } : e)
    );
  };

  const value = {
    equipmentTypes,
    equipment,
    damageReports,
    loading,
    getEquipmentByType,
    getEquipmentWithType,
    addDamageReport,
    updateReportStatus,
    addEquipment,
    updateEquipment,
    deleteEquipment,
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
