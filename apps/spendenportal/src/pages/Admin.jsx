import { useState } from 'react';
import { useTheme, GlassCard, Button, Icons, IconBadge } from '@tsc/ui';
import { useData } from '../context/DataContext';

const STATUS_LABELS = {
  pending: 'Ausstehend',
  completed: 'Abgeschlossen',
  failed: 'Fehlgeschlagen',
  refunded: 'Erstattet',
};

export function AdminPage() {
  const { isDark } = useTheme();
  const { campaigns, donations, getStatistics, getCampaignTotal, getCampaignDonorCount } = useData();

  const currentYear = new Date().getFullYear();
  const stats = getStatistics(currentYear);
  const allTimeStats = getStatistics();

  const [filterStatus, setFilterStatus] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');

  const filteredDonations = donations.filter(d => {
    if (filterStatus && d.status !== filterStatus) return false;
    if (filterCampaign && d.campaign_id !== filterCampaign) return false;
    return true;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount) => {
    return amount.toFixed(2).replace('.', ',') + ' €';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Verwaltung
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Spendenübersicht und Statistiken
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard>
          <div className={`text-2xl font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
            {stats.totalDonations}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Spenden {currentYear}
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-2xl font-bold text-rose-400">
            {formatAmount(stats.totalAmount)}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Einnahmen {currentYear}
          </div>
        </GlassCard>
        <GlassCard>
          <div className={`text-2xl font-bold ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
            {formatAmount(stats.averageAmount)}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Durchschnitt
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-2xl font-bold text-emerald-400">
            {formatAmount(allTimeStats.totalAmount)}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Gesamt (alle Zeit)
          </div>
        </GlassCard>
      </div>

      {/* Campaign Stats */}
      <div>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Kampagnen-Übersicht
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {campaigns.map(campaign => {
            const raised = getCampaignTotal(campaign.id);
            const donorCount = getCampaignDonorCount(campaign.id);
            const hasGoal = campaign.goal > 0;
            const progress = hasGoal ? Math.min((raised / campaign.goal) * 100, 100) : 0;

            return (
              <GlassCard key={campaign.id}>
                <div className="flex items-start gap-3">
                  <IconBadge
                    icon={Icons.heart}
                    color={campaign.active ? 'rose' : 'slate'}
                    size="md"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                        {campaign.name}
                      </h3>
                      {!campaign.active && (
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-500/20 text-slate-400">
                          Inaktiv
                        </span>
                      )}
                    </div>

                    <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                      <span className={isDark ? 'text-rose-400' : 'text-rose-600'}>
                        {formatAmount(raised)}
                      </span>
                      {hasGoal && (
                        <span>
                          / {formatAmount(campaign.goal)} ({progress.toFixed(0)}%)
                        </span>
                      )}
                      <span>{donorCount} Spender</span>
                    </div>

                    {hasGoal && (
                      <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-navy-700' : 'bg-light-border'}`}>
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Donations List */}
      <div>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Spenden
        </h2>

        {/* Filters */}
        <GlassCard className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[150px]">
            <label className={`block text-xs mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream'
                  : 'bg-white border-light-border text-light-text'
              }`}
            >
              <option value="">Alle Status</option>
              <option value="completed">Abgeschlossen</option>
              <option value="pending">Ausstehend</option>
              <option value="failed">Fehlgeschlagen</option>
              <option value="refunded">Erstattet</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className={`block text-xs mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Kampagne
            </label>
            <select
              value={filterCampaign}
              onChange={(e) => setFilterCampaign(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream'
                  : 'bg-white border-light-border text-light-text'
              }`}
            >
              <option value="">Alle Kampagnen</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </GlassCard>

        {/* Donations Table */}
        {filteredDonations.length > 0 ? (
          <div className="space-y-3">
            {filteredDonations.map(donation => (
              <GlassCard key={donation.id}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-500'
                  }`}>
                    {donation.anonymous ? '?' : (donation.donor_name?.[0] || '?').toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                        {donation.anonymous ? 'Anonym' : (donation.donor_name || 'Ohne Namen')}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        donation.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : donation.status === 'pending'
                            ? 'bg-gold-400/20 text-gold-400'
                            : donation.status === 'failed'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {STATUS_LABELS[donation.status]}
                      </span>
                    </div>

                    <div className={`flex items-center gap-3 text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                      <span>{donation.campaign?.name || 'Allgemeine Spende'}</span>
                      {donation.donor_email && <span>{donation.donor_email}</span>}
                    </div>

                    {donation.message && (
                      <p className={`text-sm mt-1 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                        "{donation.message}"
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className={`text-lg font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                      {formatAmount(donation.amount)}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                      {formatDate(donation.created_at)}
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard className="text-center py-12">
            <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
              Keine Spenden gefunden
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
