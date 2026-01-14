import { useState, useEffect } from 'react';
import { useTheme, GlassCard, Button, Icons, useToast } from '@tsc/ui';
import { useData, BOAT_CLASSES } from '../context/DataContext';

export function SettingsPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { addToast } = useToast();
  const { boatData, setBoatData, crewDatabase, addCrewMember, deleteCrewMember, currentSeason, changeSeason, showOnboarding } = useData();

  // Lokaler State - speichert NICHT bei jedem Tastendruck
  const [localData, setLocalData] = useState(boatData);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalData(boatData);
    setHasChanges(false);
  }, [boatData]);

  const handleChange = (field, value) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localData.seglername?.trim()) { addToast('Bitte gib deinen Namen ein', 'error'); return; }
    if (!localData.segelnummer?.trim()) { addToast('Bitte gib deine Segelnummer ein', 'error'); return; }
    setSaving(true);
    try {
      await setBoatData(localData);
      setHasChanges(false);
      addToast('Einstellungen gespeichert!', 'success');
      if (showOnboarding) setCurrentPage('dashboard');
    } catch (err) {
      console.error('[Settings] Save error:', err);
      addToast('Fehler beim Speichern: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  const handleAddCrew = () => {
    const name = prompt('Name des Crew-Mitglieds:');
    if (name) {
      addCrewMember({ name, verein: '' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Einstellungen
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Bootsdaten und Profil-Einstellungen
        </p>
      </div>

      {/* Bootsdaten */}
      <GlassCard>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Bootsdaten
        </h2>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm mb-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
              Name Segler:in *
            </label>
            <input
              type="text"
              value={localData.seglername}
              onChange={(e) => handleChange('seglername', e.target.value)}
              placeholder="Max Mustermann"
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                  : 'bg-white border-light-border text-light-text placeholder:text-light-muted'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm mb-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
              Segelnummer
            </label>
            <input
              type="text"
              value={localData.segelnummer}
              onChange={(e) => handleChange('segelnummer', e.target.value)}
              placeholder="GER 12345"
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                  : 'bg-white border-light-border text-light-text placeholder:text-light-muted'
              }`}
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
              Wichtig für die automatische Erkennung in PDFs
            </p>
          </div>

          <div>
            <label className={`block text-sm mb-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
              Bootsklasse
            </label>
            <select
              value={localData.bootsklasse}
              onChange={(e) => handleChange('bootsklasse', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream'
                  : 'bg-white border-light-border text-light-text'
              }`}
            >
              {Object.keys(BOAT_CLASSES).map(bc => (
                <option key={bc} value={bc}>{bc}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Bankverbindung */}
      <GlassCard>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Bankverbindung
        </h2>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm mb-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
              IBAN
            </label>
            <input
              type="text"
              value={localData.iban}
              onChange={(e) => handleChange('iban', e.target.value)}
              placeholder="DE89 3704 0044 0532 0130 00"
              className={`w-full px-4 py-2 rounded-lg border font-mono ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                  : 'bg-white border-light-border text-light-text placeholder:text-light-muted'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm mb-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
              Kontoinhaber (falls abweichend)
            </label>
            <input
              type="text"
              value={localData.kontoinhaber}
              onChange={(e) => handleChange('kontoinhaber', e.target.value)}
              placeholder={localData.seglername || 'Kontoinhaber'}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                  : 'bg-white border-light-border text-light-text placeholder:text-light-muted'
              }`}
            />
          </div>
        </div>
      </GlassCard>

      
      {/* Speichern Button */}
      <div className="flex justify-end gap-3">
        {!showOnboarding && (
          <Button variant="secondary" onClick={() => setCurrentPage('dashboard')}>
            Abbrechen
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving || (!hasChanges && !showOnboarding)} icon={saving ? null : Icons.save}>
          {saving ? 'Wird gespeichert...' : (showOnboarding ? 'Profil erstellen' : 'Speichern')}
        </Button>
      </div>

{/* Crew-Datenbank */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Crew-Datenbank
          </h2>
          <Button size="sm" variant="secondary" onClick={handleAddCrew} icon={Icons.plus}>
            Hinzufügen
          </Button>
        </div>

        {crewDatabase.length > 0 ? (
          <div className="space-y-2">
            {crewDatabase.map(member => (
              <div
                key={member.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isDark ? 'bg-navy-800/50' : 'bg-light-border/30'
                }`}
              >
                <span className={isDark ? 'text-cream' : 'text-light-text'}>
                  {member.name}
                </span>
                <button
                  onClick={() => deleteCrewMember(member.id)}
                  className={`p-1 rounded hover:bg-coral/20 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}
                >
                  {Icons.x}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
            Noch keine Crew-Mitglieder gespeichert
          </p>
        )}
      </GlassCard>

      {/* Saison */}
      <GlassCard>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Saison
        </h2>

        <div>
          <label className={`block text-sm mb-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
            Aktive Saison
          </label>
          <select
            value={currentSeason}
            onChange={(e) => changeSeason(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-navy-800 border-navy-700 text-cream'
                : 'bg-white border-light-border text-light-text'
            }`}
          >
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </div>
      </GlassCard>
    </div>
  );
}

export default SettingsPage;
