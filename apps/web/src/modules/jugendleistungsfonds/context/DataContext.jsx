import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@tsc/supabase';
import { useAuth } from '@tsc/supabase';

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
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =============================================
  // Daten aus Supabase laden
  // =============================================

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Anträge laden mit Kostenpositionen und Dokumenten
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('funding_applications')
        .select(`
          *,
          cost_items:funding_cost_items(*),
          documents:funding_documents(*)
        `)
        .order('created_at', { ascending: false });

      if (applicationsError) throw applicationsError;
      setApplications(applicationsData || []);

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
  // Anträge
  // =============================================

  /**
   * Submit a new funding application
   */
  const submitApplication = async (application) => {
    setLoading(true);

    try {
      const totalAmount = application.cost_items.reduce((sum, item) => sum + item.amount, 0);

      // Hauptantrag erstellen
      const { data: appData, error: appError } = await supabase
        .from('funding_applications')
        .insert({
          user_id: user?.id || null,
          applicant_first_name: application.applicant_first_name,
          applicant_last_name: application.applicant_last_name,
          applicant_birth_date: application.applicant_birth_date,
          contact_email: application.contact_email,
          contact_phone: application.contact_phone || null,
          category: application.category,
          title: application.title,
          description: application.description,
          total_amount: totalAmount,
          status: 'eingereicht',
        })
        .select()
        .single();

      if (appError) throw appError;

      // Kostenpositionen erstellen
      const costItemsToInsert = application.cost_items.map(item => ({
        application_id: appData.id,
        description: item.description,
        amount: item.amount,
      }));

      const { data: costItemsData, error: costItemsError } = await supabase
        .from('funding_cost_items')
        .insert(costItemsToInsert)
        .select();

      if (costItemsError) throw costItemsError;

      // Dokumente hochladen und speichern
      const uploadedDocs = [];
      if (application.documents && application.documents.length > 0) {
        for (const doc of application.documents) {
          const fileName = `${Date.now()}_${doc.file.name}`;
          const storagePath = `funding-docs/${appData.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('funding-documents')
            .upload(storagePath, doc.file);

          if (uploadError) {
            console.error('Error uploading document:', uploadError);
            continue;
          }

          const { data: docData, error: docError } = await supabase
            .from('funding_documents')
            .insert({
              application_id: appData.id,
              name: doc.file.name,
              storage_path: storagePath,
              file_type: doc.file.type,
              file_size: doc.file.size,
            })
            .select()
            .single();

          if (!docError && docData) {
            uploadedDocs.push(docData);
          }
        }
      }

      const newApplication = {
        ...appData,
        cost_items: costItemsData || [],
        documents: uploadedDocs,
      };

      setApplications(prev => [newApplication, ...prev]);
      return newApplication;

    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update application status (admin)
   */
  const updateApplicationStatus = async (applicationId, status, approvedAmount, adminNotes) => {
    try {
      const updateData = { status };
      if (approvedAmount !== undefined) updateData.approved_amount = approvedAmount;
      if (adminNotes !== undefined) updateData.admin_notes = adminNotes;

      const { error } = await supabase
        .from('funding_applications')
        .update(updateData)
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId
            ? {
                ...app,
                status,
                approved_amount: approvedAmount ?? app.approved_amount,
                admin_notes: adminNotes ?? app.admin_notes,
              }
            : app
        )
      );
    } catch (err) {
      console.error('Error updating application status:', err);
      setError(err.message);
    }
  };

  /**
   * Get applications by status
   */
  const getApplicationsByStatus = (status) => {
    return applications.filter(app => app.status === status);
  };

  /**
   * Get applications for a specific year
   */
  const getApplicationsByYear = (year) => {
    return applications.filter(app => {
      const appYear = new Date(app.created_at).getFullYear();
      return appYear === year;
    });
  };

  /**
   * Calculate statistics
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
    error,
    categories: FUNDING_CATEGORIES,
    submitApplication,
    updateApplicationStatus,
    getApplicationsByStatus,
    getApplicationsByYear,
    getStatistics,
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
