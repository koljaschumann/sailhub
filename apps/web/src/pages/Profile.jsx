import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, Button, Modal, Icons, useTheme, useToast } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { getRoleLabel } from '@tsc/data';

export default function Profile() {
  const { isDark } = useTheme();
  const { user, profile, updateProfile, deleteAccount, signOut } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    membership_number: profile?.membership_number || '',
  });

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Benutzer';
  const displayRole = profile?.role ? getRoleLabel(profile.role) : 'Mitglied';

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await updateProfile(formData);
      if (error) throw error;
      addToast('Profil gespeichert', 'success');
      setIsEditing(false);
    } catch (err) {
      addToast('Fehler beim Speichern: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'KONTO LOESCHEN') {
      addToast('Bitte gib "KONTO LOESCHEN" zur Bestaetigung ein', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteAccount(deletionReason);
      if (result.error) throw result.error;

      addToast('Dein Konto wurde zur Loeschung markiert. Du erhaeltst eine Bestaetigung per E-Mail.', 'success');

      // Redirect to landing page after short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      addToast('Fehler: ' + err.message, 'error');
      setIsDeleting(false);
    }
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border transition-colors ${
    isDark
      ? 'bg-navy-800 border-navy-700 text-cream placeholder-cream/40 focus:border-gold-400'
      : 'bg-white border-light-border text-light-text placeholder-light-muted focus:border-teal-500'
  } focus:outline-none`;

  const labelClass = `block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      {/* Header */}
      <header className={`border-b ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-cream/60 hover:text-cream hover:bg-navy-800'
                  : 'text-light-muted hover:text-light-text hover:bg-light-border'
              }`}
            >
              <span className="w-5 h-5 block">{Icons.arrowLeft}</span>
            </button>
            <div>
              <h1 className={`font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Profil-Einstellungen
              </h1>
              <p className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Konto verwalten
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Info */}
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Persoenliche Daten
            </h2>
            {!isEditing && (
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                Bearbeiten
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className={inputClass}
                  placeholder="Dein vollstaendiger Name"
                />
              </div>

              <div>
                <label className={labelClass}>Mitgliedsnummer</label>
                <input
                  type="text"
                  value={formData.membership_number}
                  onChange={(e) => setFormData({ ...formData, membership_number: e.target.value })}
                  className={inputClass}
                  placeholder="TSC Mitgliedsnummer"
                />
              </div>

              <div>
                <label className={labelClass}>E-Mail</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className={`${inputClass} opacity-50 cursor-not-allowed`}
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                  E-Mail kann nicht geaendert werden
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Speichern...' : 'Speichern'}
                </Button>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-gold-400/10' : 'bg-teal-100'
                }`}>
                  <span className={`w-8 h-8 ${isDark ? 'text-gold-400' : 'text-teal-600'}`}>
                    {Icons.user}
                  </span>
                </div>
                <div>
                  <h3 className={`text-xl font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                    {displayName}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                    {displayRole}
                  </p>
                </div>
              </div>

              <div className={`pt-4 border-t ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>E-Mail</p>
                    <p className={`text-sm ${isDark ? 'text-cream' : 'text-light-text'}`}>{user?.email}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>Mitgliedsnummer</p>
                    <p className={`text-sm ${isDark ? 'text-cream' : 'text-light-text'}`}>
                      {profile?.membership_number || '-'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>Mitglied seit</p>
                    <p className={`text-sm ${isDark ? 'text-cream' : 'text-light-text'}`}>
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('de-DE') : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard className={`border ${isDark ? 'border-red-500/30' : 'border-red-200'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isDark ? 'bg-red-500/10' : 'bg-red-100'
            }`}>
              <span className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                {Icons.warning}
              </span>
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold mb-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                Konto loeschen
              </h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                Wenn du dein Konto loeschst, werden alle deine Daten unwiderruflich entfernt.
                Diese Aktion kann nicht rueckgaengig gemacht werden.
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
              >
                Konto loeschen
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Data Protection Info */}
        <div className={`text-center text-sm ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
          <p>
            Gemaess DSGVO hast du das Recht auf Loeschung deiner Daten (Art. 17).{' '}
            <a href="/datenschutz" className={`underline ${isDark ? 'text-gold-400' : 'text-teal-600'}`}>
              Datenschutzerklaerung
            </a>
          </p>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmation('');
          setDeletionReason('');
        }}
        title="Konto wirklich loeschen?"
        size="md"
      >
        <div className="space-y-4">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
              <strong>Achtung:</strong> Diese Aktion ist unwiderruflich. Alle deine Daten werden geloescht:
            </p>
            <ul className={`text-sm mt-2 list-disc list-inside ${isDark ? 'text-red-300/80' : 'text-red-600'}`}>
              <li>Profildaten und Einstellungen</li>
              <li>Anmeldungen und Registrierungen</li>
              <li>Eingereichte Antraege und Meldungen</li>
            </ul>
          </div>

          <div>
            <label className={labelClass}>
              Grund fuer die Loeschung (optional)
            </label>
            <textarea
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
              className={`${inputClass} min-h-[80px]`}
              placeholder="Hilf uns, den Service zu verbessern..."
            />
          </div>

          <div>
            <label className={labelClass}>
              Gib zur Bestaetigung <strong>KONTO LOESCHEN</strong> ein:
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className={inputClass}
              placeholder="KONTO LOESCHEN"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmation !== 'KONTO LOESCHEN'}
            >
              {isDeleting ? 'Loesche Konto...' : 'Endgueltig loeschen'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmation('');
                setDeletionReason('');
              }}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
