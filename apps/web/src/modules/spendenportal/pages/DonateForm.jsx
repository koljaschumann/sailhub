import { useState } from 'react';
import { useTheme, GlassCard, Button, Icons, IconBadge, useToast } from '@tsc/ui';
import { useData } from '../context/DataContext';

export function DonateFormPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { addToast } = useToast();
  const { getActiveCampaigns, getCampaign, donationAmounts, submitDonation, loading } = useData();

  const campaigns = getActiveCampaigns();

  // Form state
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  const finalAmount = customAmount ? parseFloat(customAmount) : amount;
  const campaign = selectedCampaign ? getCampaign(selectedCampaign) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (finalAmount < 1) {
      addToast('Bitte gib einen gültigen Betrag ein', 'error');
      return;
    }

    if (!anonymous && !donorEmail) {
      addToast('Bitte gib eine E-Mail-Adresse ein oder spende anonym', 'error');
      return;
    }

    try {
      await submitDonation({
        campaign_id: selectedCampaign || undefined,
        amount: finalAmount,
        donor_name: anonymous ? undefined : donorName.trim() || undefined,
        donor_email: anonymous ? undefined : donorEmail.trim(),
        message: message.trim() || undefined,
        anonymous,
      });

      setCurrentPage('thankyou');
    } catch (err) {
      console.error('Error submitting donation:', err);
      addToast('Fehler bei der Verarbeitung', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="float inline-block">
          <span className={`w-16 h-16 block mb-4 ${isDark ? 'text-rose-400' : 'text-rose-500'}`}>
            {Icons.heart}
          </span>
        </div>
        <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Unterstütze die TSC-Jugend
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Deine Spende hilft uns, junge Segler:innen zu fördern
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <GlassCard className="space-y-6">
          {/* Campaign Selection */}
          {campaigns.length > 0 && (
            <div>
              <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Spendenzweck
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedCampaign('')}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    !selectedCampaign
                      ? isDark
                        ? 'bg-rose-500/20 border-rose-500 text-cream'
                        : 'bg-rose-50 border-rose-500 text-light-text'
                      : isDark
                        ? 'bg-navy-800 border-navy-700 text-cream/80 hover:border-navy-600'
                        : 'bg-white border-light-border text-light-text hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Allgemeine Spende</div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                    Unterstütze die gesamte Jugendarbeit des TSC
                  </div>
                </button>

                {campaigns.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCampaign(c.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      selectedCampaign === c.id
                        ? isDark
                          ? 'bg-rose-500/20 border-rose-500 text-cream'
                          : 'bg-rose-50 border-rose-500 text-light-text'
                        : isDark
                          ? 'bg-navy-800 border-navy-700 text-cream/80 hover:border-navy-600'
                          : 'bg-white border-light-border text-light-text hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{c.name}</div>
                    <div className={`text-xs mt-1 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                      {c.description.length > 80 ? c.description.slice(0, 80) + '...' : c.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount Selection */}
          <div className={campaigns.length > 0 ? `border-t pt-6 ${isDark ? 'border-navy-700' : 'border-light-border'}` : ''}>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Spendenbetrag
            </label>

            <div className="grid grid-cols-5 gap-2 mb-4">
              {donationAmounts.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => { setAmount(amt); setCustomAmount(''); }}
                  className={`py-3 rounded-xl border font-medium transition-all ${
                    amount === amt && !customAmount
                      ? isDark
                        ? 'bg-rose-500/20 border-rose-500 text-cream'
                        : 'bg-rose-50 border-rose-500 text-light-text'
                      : isDark
                        ? 'bg-navy-800 border-navy-700 text-cream/80 hover:border-navy-600'
                        : 'bg-white border-light-border text-light-text hover:border-gray-300'
                  }`}
                >
                  {amt}€
                </button>
              ))}
            </div>

            <div>
              <label className={`block text-xs mb-2 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Oder eigenen Betrag eingeben:
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Eigener Betrag"
                  min="1"
                  step="0.01"
                  className={`w-full px-4 py-3 pr-10 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
                <span className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                  €
                </span>
              </div>
            </div>

            {/* Amount Preview */}
            <div className={`mt-4 p-4 rounded-xl text-center ${isDark ? 'bg-rose-500/10' : 'bg-rose-50'}`}>
              <span className={`text-3xl font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                {finalAmount.toFixed(2).replace('.', ',')} €
              </span>
            </div>
          </div>

          {/* Donor Info */}
          <div className={`border-t pt-6 ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Deine Angaben
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className={`w-4 h-4 rounded ${isDark ? 'bg-navy-700' : 'bg-white'}`}
                />
                <span className={`text-sm ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  Anonym spenden
                </span>
              </label>
            </div>

            {!anonymous && (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Dein Name"
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      isDark
                        ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                        : 'bg-white border-light-border text-light-text'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                    E-Mail *
                  </label>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    required={!anonymous}
                    placeholder="deine@email.de"
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      isDark
                        ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                        : 'bg-white border-light-border text-light-text'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                    Für die Spendenquittung
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Message */}
          <div className={`border-t pt-6 ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Nachricht (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Eine persönliche Nachricht..."
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                  : 'bg-white border-light-border text-light-text'
              }`}
            />
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              icon={Icons.heart}
            >
              {loading ? 'Wird verarbeitet...' : `${finalAmount.toFixed(2).replace('.', ',')} € spenden`}
            </Button>

            <p className={`text-xs text-center mt-4 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
              Sichere Zahlung über Stripe. Der TSC ist als gemeinnützig anerkannt -
              deine Spende ist steuerlich absetzbar.
            </p>
          </div>
        </GlassCard>
      </form>
    </div>
  );
}

export default DonateFormPage;
