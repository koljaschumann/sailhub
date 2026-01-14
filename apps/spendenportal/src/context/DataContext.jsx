import { createContext, useContext, useState, useEffect } from 'react';

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

// Demo-Daten für Development
const DEMO_CAMPAIGNS = [
  {
    id: 'campaign_1',
    name: 'Neue Optimisten für die Jugendgruppe',
    description: 'Wir möchten 3 neue Optimisten für unsere wachsende Jugendgruppe anschaffen. Mit Ihrer Spende helfen Sie uns, mehr Kindern das Segeln beizubringen.',
    goal: 6000,
    active: true,
    start_date: '2025-01-01',
    end_date: '2025-12-31',
  },
  {
    id: 'campaign_2',
    name: 'Trainingslager Ostsee 2025',
    description: 'Unterstützen Sie unser Jugend-Trainingslager an der Ostsee. Die Spenden helfen bei den Kosten für Unterkunft und Verpflegung.',
    goal: 2500,
    active: true,
    start_date: '2025-03-01',
    end_date: '2025-06-30',
  },
  {
    id: 'campaign_3',
    name: 'Allgemeine Jugendförderung',
    description: 'Ihre Spende fließt direkt in die Jugendarbeit des TSC: Trainingsmaterial, Bootsreparaturen und Nachwuchsförderung.',
    goal: 0, // No specific goal
    active: true,
    start_date: '2025-01-01',
  },
];

const DONATION_AMOUNTS = [25, 50, 100, 250, 500];

export function DataProvider({ children }) {
  const [campaigns, setCampaigns] = useState(DEMO_CAMPAIGNS);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);

  // TODO: Replace with Supabase queries when connected
  const devMode = true;

  useEffect(() => {
    if (devMode) {
      const stored = localStorage.getItem('tsc_donations');
      if (stored) {
        setDonations(JSON.parse(stored));
      }
    }
  }, []);

  useEffect(() => {
    if (devMode && donations.length > 0) {
      localStorage.setItem('tsc_donations', JSON.stringify(donations));
    }
  }, [donations]);

  /**
   * Get campaign by ID
   * @param {string} id
   * @returns {DonationCampaign | undefined}
   */
  const getCampaign = (id) => {
    return campaigns.find(c => c.id === id);
  };

  /**
   * Get active campaigns
   * @returns {DonationCampaign[]}
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
   * @param {string} campaignId
   * @returns {number}
   */
  const getCampaignTotal = (campaignId) => {
    return donations
      .filter(d => d.campaign_id === campaignId && d.status === 'completed')
      .reduce((sum, d) => sum + d.amount, 0);
  };

  /**
   * Get donation count for a campaign
   * @param {string} campaignId
   * @returns {number}
   */
  const getCampaignDonorCount = (campaignId) => {
    return donations.filter(d => d.campaign_id === campaignId && d.status === 'completed').length;
  };

  /**
   * Submit a new donation (placeholder for Stripe integration)
   * @param {Object} donation
   * @returns {Promise<Donation>}
   */
  const submitDonation = async (donation) => {
    setLoading(true);

    try {
      // In production, this would:
      // 1. Create Stripe checkout session
      // 2. Redirect to Stripe
      // 3. Handle webhook for completion

      const campaign = donation.campaign_id ? getCampaign(donation.campaign_id) : null;

      const newDonation = {
        id: `donation_${Date.now()}`,
        ...donation,
        campaign,
        payment_method: 'stripe',
        stripe_payment_id: `pi_demo_${Date.now()}`,
        status: 'completed', // In demo mode, immediately mark as completed
        created_at: new Date().toISOString(),
      };

      setDonations(prev => [newDonation, ...prev]);

      return newDonation;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get recent donations (for public display)
   * @param {number} limit
   * @returns {Donation[]}
   */
  const getRecentDonations = (limit = 10) => {
    return donations
      .filter(d => d.status === 'completed')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  };

  /**
   * Get statistics
   * @param {number} [year]
   * @returns {Object}
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
    donationAmounts: DONATION_AMOUNTS,
    getCampaign,
    getActiveCampaigns,
    getCampaignTotal,
    getCampaignDonorCount,
    submitDonation,
    getRecentDonations,
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
