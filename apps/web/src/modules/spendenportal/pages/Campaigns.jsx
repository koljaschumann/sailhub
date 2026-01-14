import { useTheme, GlassCard, Button, Icons, IconBadge } from '@tsc/ui';
import { useData } from '../context/DataContext';

export function CampaignsPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { getActiveCampaigns, getCampaignTotal, getCampaignDonorCount, getRecentDonations } = useData();

  const campaigns = getActiveCampaigns();
  const recentDonations = getRecentDonations(5);

  const formatAmount = (amount) => {
    return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Spendenkampagnen
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Unterstütze unsere aktuellen Projekte
        </p>
      </div>

      {/* Campaigns Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {campaigns.map(campaign => {
          const raised = getCampaignTotal(campaign.id);
          const donorCount = getCampaignDonorCount(campaign.id);
          const hasGoal = campaign.goal > 0;
          const progress = hasGoal ? Math.min((raised / campaign.goal) * 100, 100) : 0;

          return (
            <GlassCard key={campaign.id} shimmer hoverLift>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <IconBadge icon={Icons.heart} color="rose" size="lg" />
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                      {campaign.name}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                      {campaign.description}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                {hasGoal && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className={isDark ? 'text-rose-400' : 'text-rose-600'}>
                        {formatAmount(raised)}
                      </span>
                      <span className={isDark ? 'text-cream/60' : 'text-light-muted'}>
                        Ziel: {formatAmount(campaign.goal)}
                      </span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-navy-700' : 'bg-light-border'}`}>
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                      {progress.toFixed(0)}% erreicht • {donorCount} Spender:innen
                    </p>
                  </div>
                )}

                {!hasGoal && (
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-navy-800' : 'bg-light-border/50'}`}>
                    <div className="flex items-center gap-4">
                      <div>
                        <div className={`text-lg font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                          {formatAmount(raised)}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                          gesammelt
                        </div>
                      </div>
                      <div className={`border-l pl-4 ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
                        <div className={`text-lg font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                          {donorCount}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                          Spender:innen
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => setCurrentPage('donate')}
                  icon={Icons.heart}
                >
                  Jetzt spenden
                </Button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Recent Donations */}
      {recentDonations.length > 0 && (
        <div>
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Letzte Spenden
          </h2>
          <GlassCard>
            <div className="space-y-3">
              {recentDonations.map(donation => (
                <div
                  key={donation.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-500'
                  }`}>
                    {donation.anonymous ? '?' : (donation.donor_name?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                      {donation.anonymous ? 'Anonyme Spende' : (donation.donor_name || 'Unbekannt')}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                      {donation.campaign?.name || 'Allgemeine Spende'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                      {donation.amount}€
                    </div>
                    <div className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                      {formatDate(donation.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {campaigns.length === 0 && (
        <GlassCard className="text-center py-12">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
            isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-100 text-rose-500'
          }`}>
            {Icons.heart}
          </div>
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Keine aktiven Kampagnen
          </h3>
          <p className={`mb-4 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Du kannst trotzdem die Jugendarbeit mit einer allgemeinen Spende unterstützen.
          </p>
          <Button onClick={() => setCurrentPage('donate')}>
            Jetzt spenden
          </Button>
        </GlassCard>
      )}
    </div>
  );
}

export default CampaignsPage;
