import { createContext, useContext, useState, useEffect } from 'react';

/**
 * @typedef {'eingereicht' | 'in_pruefung' | 'genehmigt' | 'abgelehnt' | 'ausgezahlt'} ApplicationStatus
 * @typedef {'equipment' | 'training' | 'regatta' | 'trainingslager' | 'sonstiges'} FundingCategory
 *
 * @typedef {Object} CostItem
 * @property {string} id
 * @property {string} description
 * @property {number} amount
 * @property {string} [receipt_url]
 *
 * @typedef {Object} FundingDocument
 * @property {string} id
 * @property {string} name
 * @property {string} url
 * @property {string} type
 * @property {number} size
 *
 * @typedef {Object} FundingApplication
 * @property {string} id
 * @property {string} applicant_first_name
 * @property {string} applicant_last_name
 * @property {string} applicant_birth_date
 * @property {string} contact_email
 * @property {string} [contact_phone]
 * @property {FundingCategory} category
 * @property {string} title
 * @property {string} description
 * @property {CostItem[]} cost_items
 * @property {number} total_amount
 * @property {number} [approved_amount]
 * @property {FundingDocument[]} documents
 * @property {ApplicationStatus} status
 * @property {string} [admin_notes]
 * @property {string} created_at
 * @property {string} updated_at
 */

const DataContext = createContext(null);

const FUNDING_CATEGORIES = [
  { id: 'equipment', label: 'Ausrüstung', description: 'Segel, Segelkleidung, Zubehör' },
  { id: 'training', label: 'Training', description: 'Trainerstunden, Kurse' },
  { id: 'regatta', label: 'Regatta', description: 'Startgelder, Reisekosten' },
  { id: 'trainingslager', label: 'Trainingslager', description: 'Teilnahmegebühren, Unterkunft' },
  { id: 'sonstiges', label: 'Sonstiges', description: 'Andere förderfähige Ausgaben' },
];

export function DataProvider({ children }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  // TODO: Replace with Supabase queries when connected
  const devMode = true;

  useEffect(() => {
    if (devMode) {
      const stored = localStorage.getItem('tsc_funding_applications');
      if (stored) {
        setApplications(JSON.parse(stored));
      }
    }
  }, []);

  useEffect(() => {
    if (devMode && applications.length > 0) {
      localStorage.setItem('tsc_funding_applications', JSON.stringify(applications));
    }
  }, [applications]);

  /**
   * Submit a new funding application
   * @param {Object} application
   * @returns {Promise<FundingApplication>}
   */
  const submitApplication = async (application) => {
    setLoading(true);

    try {
      const totalAmount = application.cost_items.reduce((sum, item) => sum + item.amount, 0);

      const newApplication = {
        id: `app_${Date.now()}`,
        ...application,
        total_amount: totalAmount,
        status: 'eingereicht',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setApplications(prev => [newApplication, ...prev]);

      // TODO: In production:
      // 1. Insert into database
      // 2. Upload documents to storage
      // 3. Send confirmation email to applicant
      // 4. Notify admin

      return newApplication;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update application status (admin)
   * @param {string} applicationId
   * @param {ApplicationStatus} status
   * @param {number} [approvedAmount]
   * @param {string} [adminNotes]
   */
  const updateApplicationStatus = async (applicationId, status, approvedAmount, adminNotes) => {
    setApplications(prev =>
      prev.map(app =>
        app.id === applicationId
          ? {
              ...app,
              status,
              approved_amount: approvedAmount ?? app.approved_amount,
              admin_notes: adminNotes ?? app.admin_notes,
              updated_at: new Date().toISOString(),
            }
          : app
      )
    );

    // TODO: In production, send email notification to applicant
  };

  /**
   * Get applications by status
   * @param {ApplicationStatus} status
   * @returns {FundingApplication[]}
   */
  const getApplicationsByStatus = (status) => {
    return applications.filter(app => app.status === status);
  };

  /**
   * Get applications for a specific year
   * @param {number} year
   * @returns {FundingApplication[]}
   */
  const getApplicationsByYear = (year) => {
    return applications.filter(app => {
      const appYear = new Date(app.created_at).getFullYear();
      return appYear === year;
    });
  };

  /**
   * Calculate statistics
   * @param {number} [year]
   * @returns {Object}
   */
  const getStatistics = (year) => {
    const apps = year ? getApplicationsByYear(year) : applications;

    return {
      total: apps.length,
      eingereicht: apps.filter(a => a.status === 'eingereicht').length,
      in_pruefung: apps.filter(a => a.status === 'in_pruefung').length,
      genehmigt: apps.filter(a => a.status === 'genehmigt').length,
      abgelehnt: apps.filter(a => a.status === 'abgelehnt').length,
      ausgezahlt: apps.filter(a => a.status === 'ausgezahlt').length,
      totalRequested: apps.reduce((sum, a) => sum + a.total_amount, 0),
      totalApproved: apps
        .filter(a => ['genehmigt', 'ausgezahlt'].includes(a.status))
        .reduce((sum, a) => sum + (a.approved_amount || a.total_amount), 0),
      totalPaid: apps
        .filter(a => a.status === 'ausgezahlt')
        .reduce((sum, a) => sum + (a.approved_amount || a.total_amount), 0),
    };
  };

  const value = {
    applications,
    loading,
    categories: FUNDING_CATEGORIES,
    submitApplication,
    updateApplicationStatus,
    getApplicationsByStatus,
    getApplicationsByYear,
    getStatistics,
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
