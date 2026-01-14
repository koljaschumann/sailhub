import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@tsc/supabase';

/**
 * @typedef {'pending' | 'completed' | 'failed' | 'refunded'} DonationStatus
 * @typedef {'stripe' | 'paypal' | 'bank_transfer' | 'cash'} PaymentMethod
 *
 * @typedef {Object} DonationCampaign
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {number} goal
 * @property {string} [image_url]
 * @property {boolean} active
 * @property {string} start_date
 * @property {string} [end_date]
 *
 * @typedef {Object} Donation
 * @property {string} id
 * @property {string} [campaign_id]
 * @property {DonationCampaign} [campaign]
 * @property {number} amount
 * @property {string} [donor_name]
 * @property {string} [donor_email]
 * @property {string} [message]
 * @property {boolean} anonymous
 * @property {PaymentMethod} payment_method
 * @property {string} [stripe_payment_id]
 * @property {DonationStatus} status
 * @property {string} created_at
 */

const DataContext = createContext(null);

const DONATION_AMOUNTS = [25, 50, 100, 250, 500];

export function DataProvider({ children }) {
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =============================================
  // Daten aus Supabase laden
  // =============================================

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Kampagnen laden
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('donation_campaigns')
        .select('*')
        .order('start_date', { ascending: false });

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);

      // Spenden laden
      const { data: donationsData, error: donationsError } = await supabase
        .from('donations')
        .select(`
          *,
          campaign:donation_campaigns(*)
        `)
        .order('created_at', { ascending: false });

      if (donationsError) throw donationsError;
      setDonations(donationsData || []);

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
   * Get campaign by ID
   */
  const getCampaign = (id) => {
    return campaigns.find(c => c.id === id);
  };

  /**
   * Get active campaigns
   */
  const getActiveCampaigns = () => {
    const today = new Date().toISOString().split('T')[0];
    return campaigns.filter(c => {
      if (!c.active) return false;
      if (c.end_date && c.end_date < today) return false;
      return true;
    });
  };

  /**
   * Get total raised for a campaign
   */
  const getCampaignTotal = (campaignId) => {
    return donations
      .filter(d => d.campaign_id === campaignId && d.status === 'completed')
      .reduce((sum, d) => sum + d.amount, 0);
  };

  /**
   * Get donation count for a campaign
   */
  const getCampaignDonorCount = (campaignId) => {
    return donations.filter(d => d.campaign_id === campaignId && d.status === 'completed').length;
  };

  // =============================================
  // Spenden
  // =============================================

  /**
   * Submit a new donation
   */
  const submitDonation = async (donation) => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('donations')
        .insert({
          campaign_id: donation.campaign_id || null,
          amount: donation.amount,
          donor_name: donation.anonymous ? null : donation.donor_name,
          donor_email: donation.donor_email || null,
          message: donation.message || null,
          anonymous: donation.anonymous || false,
          payment_method: 'stripe',
          status: 'pending',
        })
        .select(`
          *,
          campaign:donation_campaigns(*)
        `)
        .single();

      if (error) throw error;

      setDonations(prev => [data, ...prev]);
      return data;

    } catch (err) {
      console.error('Error submitting donation:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update donation status (after payment)
   */
  const updateDonationStatus = async (donationId, status, stripePaymentId) => {
    try {
      const updateData = { status };
      if (stripePaymentId) updateData.stripe_payment_id = stripePaymentId;

      const { error } = await supabase
        .from('donations')
        .update(updateData)
        .eq('id', donationId);

      if (error) throw error;

      setDonations(prev =>
        prev.map(d =>
          d.id === donationId
            ? { ...d, status, stripe_payment_id: stripePaymentId || d.stripe_payment_id }
            : d
        )
      );
    } catch (err) {
      console.error('Error updating donation status:', err);
      setError(err.message);
    }
  };

  /**
   * Get recent donations (for public display)
   */
  const getRecentDonations = (limit = 10) => {
    return donations
      .filter(d => d.status === 'completed')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  };

  /**
   * Get statistics
   */
  const getStatistics = (year) => {
    const completedDonations = donations.filter(d => {
      if (d.status !== 'completed') return false;
      if (year) {
        const donationYear = new Date(d.created_at).getFullYear();
        return donationYear === year;
      }
      return true;
    });

    return {
      totalDonations: completedDonations.length,
      totalAmount: completedDonations.reduce((sum, d) => sum + d.amount, 0),
      averageAmount: completedDonations.length > 0
        ? completedDonations.reduce((sum, d) => sum + d.amount, 0) / completedDonations.length
        : 0,
      anonymousDonations: completedDonations.filter(d => d.anonymous).length,
    };
  };

  const value = {
    campaigns,
    donations,
    loading,
    error,
    donationAmounts: DONATION_AMOUNTS,
    getCampaign,
    getActiveCampaigns,
    getCampaignTotal,
    getCampaignDonorCount,
    submitDonation,
    updateDonationStatus,
    getRecentDonations,
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
