import { useTheme, GlassCard, Button, IconBadge, Icons } from '@tsc/ui';
import { useData, BOAT_CLASSES } from '../context/DataContext';

export function SettingsPage() {
  const { isDark } = useTheme();
  const { boatData, setBoatData, crewDatabase, addCrewMember, deleteCrewMember, currentSeason, changeSeason } = useData();

  const handleChange = (field, value) => {
    setBoatData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCrew = () => {
    const name = prompt('Name des Crew-Mitglieds:');
    if (name) {
      addCrewMember({ name, verein: '' });
    }
  };

  const inputClassName = `w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${
    isDark
      ? 'bg-navy-800/50 border-navy-700 text-cream placeholder:text-cream/30 focus:border-mint-400/50 focus:bg-navy-800'
      : 'bg-white border-navy-900/10 text-navy-900 placeholder:text-light-muted focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20'
  }`;

  const selectClassName = `w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none appearance-none cursor-pointer ${
    isDark
      ? 'bg-navy-800/50 border-navy-700 text-cream focus:border-mint-400/50 focus:bg-navy-800'
      : 'bg-white border-navy-900/10 text-navy-900 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20'
  }`;

  const labelClassName = `block text-sm font-medium mb-2 ${isDark ? 'text-cream/70' : 'text-light-muted'}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
          isDark
            ? 'bg-mint-400/15 text-mint-400 border-mint-400/30'
            : 'bg-mint-100 text-mint-600 border-mint-500/30'
        }`}>
          <span className="w-6 h-6">{Icons.settings}</span>
        </div>
        <div>
          <h1 className={`text-2xl font-display font-bold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
            Einstellungen
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Bootsdaten und Profil-Einstellungen
          </p>
        </div>
      </div>

      {/* Bootsdaten with decorative elements */}
      <GlassCard className="relative overflow-hidden">
        {/* Noise texture for depth */}
        <div className="noise-texture absolute inset-0 pointer-events-none" />

        {/* Dots pattern accent */}
        <div className="dots-pattern absolute top-0 right-0 w-20 h-20 pointer-events-none opacity-40" />

        <div className="relative flex items-center gap-3 mb-6">
          <IconBadge icon={Icons.boat} color="mint" variant="soft" />
          <h2 className={`text-lg font-display font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
            Bootsdaten
          </h2>
        </div>

        <div className="relative space-y-5">
          <div>
            <label className={labelClassName}>
              Name Segler:in
            </label>
            <input
              type="text"
              value={boatData.seglername}
              onChange={(e) => handleChange('seglername', e.target.value)}
              placeholder="Max Mustermann"
              className={inputClassName}
            />
          </div>

          <div>
            <label className={labelClassName}>
              Segelnummer
            </label>
            <input
              type="text"
              value={boatData.segelnummer}
              onChange={(e) => handleChange('segelnummer', e.target.value)}
              placeholder="GER 12345"
              className={inputClassName}
            />
            <p className={`text-xs mt-2 flex items-center gap-1.5 ${isDark ? 'text-mint-400/70' : 'text-mint-600'}`}>
              <span className="w-3.5 h-3.5">{Icons.sparkles}</span>
              Wichtig für die automatische Erkennung in PDFs
            </p>
          </div>

          <div>
            <label className={labelClassName}>
              Bootsklasse
            </label>
            <div className="relative">
              <select
                value={boatData.bootsklasse}
                onChange={(e) => handleChange('bootsklasse', e.target.value)}
                className={selectClassName}
              >
                {Object.keys(BOAT_CLASSES).map(bc => (
                  <option key={bc} value={bc}>{bc}</option>
                ))}
              </select>
              <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 ${
                isDark ? 'text-cream/50' : 'text-light-muted'
              }`}>
                {Icons.chevronDown}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Bankverbindung */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <IconBadge icon={Icons.euro} color="mint" variant="soft" />
          <h2 className={`text-lg font-display font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
            Bankverbindung
          </h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className={labelClassName}>
              IBAN
            </label>
            <input
              type="text"
              value={boatData.iban}
              onChange={(e) => handleChange('iban', e.target.value)}
              placeholder="DE89 3704 0044 0532 0130 00"
              className={`${inputClassName} font-mono tracking-wider`}
            />
          </div>

          <div>
            <label className={labelClassName}>
              Kontoinhaber (falls abweichend)
            </label>
            <input
              type="text"
              value={boatData.kontoinhaber}
              onChange={(e) => handleChange('kontoinhaber', e.target.value)}
              placeholder={boatData.seglername || 'Kontoinhaber'}
              className={inputClassName}
            />
          </div>
        </div>
      </GlassCard>

      {/* Crew-Datenbank */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <IconBadge icon={Icons.users} color="mint" variant="soft" />
            <h2 className={`text-lg font-display font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
              Crew-Datenbank
            </h2>
          </div>
          <Button size="sm" variant="mint" onClick={handleAddCrew} icon={Icons.plus}>
            Hinzufügen
          </Button>
        </div>

        {crewDatabase.length > 0 ? (
          <div className="space-y-2">
            {crewDatabase.map(member => (
              <div
                key={member.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isDark
                    ? 'bg-navy-800/30 border-navy-700/50 hover:border-mint-400/20'
                    : 'bg-sage/30 border-navy-900/5 hover:border-mint-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isDark
                      ? 'bg-mint-400/15 text-mint-400'
                      : 'bg-mint-100 text-mint-600'
                  }`}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`font-medium ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                    {member.name}
                  </span>
                </div>
                <button
                  onClick={() => deleteCrewMember(member.id)}
                  className={`p-2 rounded-lg transition-all ${
                    isDark
                      ? 'text-cream/40 hover:text-red-400 hover:bg-red-400/10'
                      : 'text-light-muted hover:text-red-500 hover:bg-red-50'
                  }`}
                >
                  <span className="w-4 h-4 block">{Icons.x}</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-8 rounded-xl border-2 border-dashed ${
            isDark ? 'border-navy-700 text-cream/50' : 'border-navy-900/10 text-light-muted'
          }`}>
            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-navy-800 text-cream/30' : 'bg-sage text-light-muted'
            }`}>
              <span className="w-6 h-6">{Icons.users}</span>
            </div>
            <p className="text-sm">Noch keine Crew-Mitglieder gespeichert</p>
          </div>
        )}
      </GlassCard>

      {/* Saison with decorative elements */}
      <GlassCard className="relative overflow-hidden">
        {/* Geometric ring decoration */}
        <div className={`geometric-ring absolute -bottom-12 -right-12 w-32 h-32 rounded-full pointer-events-none ${
          isDark ? 'border-mint-400' : 'border-navy-900'
        }`} />

        {/* Corner accent */}
        <div className="corner-accent absolute top-3 left-3" />

        <div className="relative flex items-center gap-3 mb-6">
          <IconBadge icon={Icons.calendar} color="mint" variant="soft" />
          <h2 className={`text-lg font-display font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
            Saison
          </h2>
        </div>

        <div className="relative">
          <label className={labelClassName}>
            Aktive Saison
          </label>
          <div className="relative">
            <select
              value={currentSeason}
              onChange={(e) => changeSeason(e.target.value)}
              className={selectClassName}
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 ${
              isDark ? 'text-cream/50' : 'text-light-muted'
            }`}>
              {Icons.chevronDown}
            </div>
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
            Alle Regatten werden der aktiven Saison zugeordnet
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

export default SettingsPage;
