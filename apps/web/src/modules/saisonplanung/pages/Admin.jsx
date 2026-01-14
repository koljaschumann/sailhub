import { useState } from 'react';
import { useTheme, GlassCard, Button, Modal, IconBadge, Icons, useToast } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { useData } from '../context/DataContext';
import { formatDate } from '../utils/dateUtils';

export function AdminPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { isAdmin, isTrainer, userRole } = useAuth();
  const { events, deadline, season, setDeadline, setSeason, resetAllData, loadDemoData } = useData();
  const { addToast } = useToast();

  // All hooks must be called before any conditional returns
  const [newDeadline, setNewDeadline] = useState(deadline);
  const [newSeasonStart, setNewSeasonStart] = useState(season.start);
  const [newSeasonEnd, setNewSeasonEnd] = useState(season.end);
  const [newSeasonName, setNewSeasonName] = useState(season.name);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Access control: Only admin can access this page
  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <GlassCard className="text-center py-12">
          <IconBadge icon={Icons.lock} color="red" size="lg" className="mx-auto mb-4" />
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Kein Zugang
          </h2>
          <p className={`mb-4 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Der Verwaltungsbereich ist nur für Administratoren zugänglich.
          </p>
          <p className={`text-sm mb-6 ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
            Deine aktuelle Rolle: <span className="font-medium">{userRole || 'Nicht erkannt'}</span>
          </p>
          <Button onClick={() => setCurrentPage('dashboard')} icon={Icons.arrowLeft}>
            Zurück zur Übersicht
          </Button>
        </GlassCard>
      </div>
    );
  }

  const handleSaveDeadline = async () => {
    try {
      setIsLoading(true);
      await setDeadline(newDeadline);
      addToast('Eingabefrist aktualisiert', 'success');
    } catch (err) {
      addToast('Fehler beim Speichern', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSeason = async () => {
    try {
      setIsLoading(true);
      await setSeason({
        id: season.id,
        start: newSeasonStart,
        end: newSeasonEnd,
        name: newSeasonName
      });
      addToast('Saison-Einstellungen aktualisiert', 'success');
    } catch (err) {
      addToast('Fehler beim Speichern', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsLoading(true);
      await resetAllData();
      setShowResetConfirm(false);
      addToast('Alle Daten wurden zurückgesetzt', 'warning');
    } catch (err) {
      addToast('Fehler beim Zurücksetzen', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadDemoData = async () => {
    try {
      setIsLoading(true);
      const count = await loadDemoData();
      addToast(`${count} Demo-Veranstaltungen geladen`, 'success');
    } catch (err) {
      addToast('Fehler beim Laden der Demo-Daten', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = `
    w-full px-3 py-2 rounded-lg border text-sm
    ${isDark
      ? 'bg-navy-700 border-navy-600 text-cream'
      : 'bg-white border-light-border text-light-text'}
    focus:outline-none focus:ring-2
    ${isDark ? 'focus:ring-gold-400' : 'focus:ring-teal-400'}
  `;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Admin-Bereich
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Einstellungen und Verwaltung
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadline Settings */}
        <GlassCard shimmer hoverLift>
          <div className="flex items-center gap-3 mb-4">
            <IconBadge icon={Icons.clock} color="gold" />
            <h2 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Eingabefrist
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-cream/80' : 'text-light-muted'}`}>
                Frist für Trainer-Eingaben
              </label>
              <input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className={inputClass}
              />
              <p className={`mt-1 text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Nach diesem Datum können Trainer keine Änderungen mehr vornehmen
              </p>
            </div>
            <Button onClick={handleSaveDeadline} disabled={isLoading}>
              Frist speichern
            </Button>
          </div>
        </GlassCard>

        {/* Season Settings */}
        <GlassCard shimmer hoverLift>
          <div className="flex items-center gap-3 mb-4">
            <IconBadge icon={Icons.calendar} color="purple" />
            <h2 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Saison-Einstellungen
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-cream/80' : 'text-light-muted'}`}>
                Saisonname
              </label>
              <input
                type="text"
                value={newSeasonName}
                onChange={(e) => setNewSeasonName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-cream/80' : 'text-light-muted'}`}>
                  Start
                </label>
                <input
                  type="date"
                  value={newSeasonStart}
                  onChange={(e) => setNewSeasonStart(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-cream/80' : 'text-light-muted'}`}>
                  Ende
                </label>
                <input
                  type="date"
                  value={newSeasonEnd}
                  onChange={(e) => setNewSeasonEnd(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <Button onClick={handleSaveSeason} disabled={isLoading}>
              Saison speichern
            </Button>
          </div>
        </GlassCard>

        {/* Statistics */}
        <GlassCard shimmer hoverLift>
          <div className="flex items-center gap-3 mb-4">
            <IconBadge icon={Icons.info} color="emerald" />
            <h2 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Statistiken
            </h2>
          </div>

          <div className="space-y-3">
            <div className={`flex justify-between p-3 rounded-lg ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}`}>
              <span className={isDark ? 'text-cream/80' : 'text-light-text'}>Gesamte Veranstaltungen</span>
              <span className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>{events.length}</span>
            </div>
            <div className={`flex justify-between p-3 rounded-lg ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}`}>
              <span className={isDark ? 'text-cream/80' : 'text-light-text'}>Regatten</span>
              <span className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                {events.filter(e => e.type === 'regatta').length}
              </span>
            </div>
            <div className={`flex justify-between p-3 rounded-lg ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}`}>
              <span className={isDark ? 'text-cream/80' : 'text-light-text'}>Trainingslager</span>
              <span className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                {events.filter(e => e.type === 'trainingslager').length}
              </span>
            </div>
            <div className={`flex justify-between p-3 rounded-lg ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}`}>
              <span className={isDark ? 'text-cream/80' : 'text-light-text'}>Aktive Bootsklassen</span>
              <span className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                {new Set(events.map(e => e.boatClassId)).size}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Demo Data */}
        <GlassCard shimmer hoverLift gradientBorder className={`border-2 ${isDark ? 'border-gold-400/30' : 'border-amber-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="pulse-soft">
              <IconBadge icon={Icons.plus} color="amber" />
            </div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Demo-Daten
            </h2>
          </div>

          <div className="space-y-3">
            <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Lade Beispieldaten mit vorgefertigten Konflikten zum Testen der Konfliktauflösung.
            </p>
            <Button
              onClick={handleLoadDemoData}
              icon={Icons.download}
              className="w-full"
              disabled={isLoading}
            >
              Demo-Daten laden
            </Button>
            <p className={`text-xs ${isDark ? 'text-gold-400/80' : 'text-amber-600'}`}>
              Enthält 10 Veranstaltungen mit Motorboot-Konflikten
            </p>
          </div>
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard className={`lg:col-span-2 border-2 ${isDark ? 'border-coral/30' : 'border-red-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <IconBadge icon={Icons.alertTriangle} color="red" />
            <h2 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Gefahrenzone
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Alle Daten zurücksetzen
              </p>
              <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Löscht alle Veranstaltungen und setzt Einstellungen zurück
              </p>
            </div>
            <Button
              variant="danger"
              onClick={() => setShowResetConfirm(true)}
              disabled={isLoading}
            >
              Zurücksetzen
            </Button>
          </div>
        </GlassCard>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Daten zurücksetzen?"
        size="sm"
      >
        <div className="space-y-4">
          <p className={isDark ? 'text-cream/80' : 'text-light-text'}>
            Bist du sicher, dass du <strong>alle Daten löschen</strong> möchtest?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowResetConfirm(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              variant="danger"
              onClick={handleReset}
              className="flex-1"
              disabled={isLoading}
            >
              Ja, alles löschen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminPage;
