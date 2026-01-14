import { Link, useNavigate } from 'react-router-dom';
import { GlassCard, Button, Icons, IconBadge, useTheme, useToast, DonateButton } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { getRoleLabel } from '@tsc/data';

export default function Dashboard() {
  const { isDark, toggleTheme } = useTheme();
  const { user, profile, signOut, isAdmin, isTrainer } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Fallback für Name: profile.full_name -> user.user_metadata.full_name -> user.email -> 'Benutzer'
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Benutzer';
  // Fallback für Rolle
  const displayRole = profile?.role ? getRoleLabel(profile.role) : 'Mitglied';

  const handleSignOut = async () => {
    console.log('Dashboard: Signing out...');
    await signOut();
    // Force full page reload to clear all state
    window.location.href = '/';
    window.location.reload();
  };

  const modules = [
    {
      id: 'saisonplanung',
      title: 'Saisonplanung',
      description: 'Plane die Regatten und Trainingslager deiner Trainingsgruppen.',
      icon: Icons.sailboat,
      color: 'gold',
      href: '/saisonplanung',
      features: ['Regatta-Kalender', 'Motorboot-Zuteilung', 'PDF-Export'],
      trainerOnly: true
    },
    {
      id: 'startgelder',
      title: 'Startgeld-Erstattung',
      description: 'Erfasse Regatta-Teilnahmen und erstelle Erstattungsanträge für die Buchhaltung.',
      icon: Icons.euro,
      color: 'emerald',
      href: '/startgelder',
      features: ['manage2sail Integration', 'SEPA-Export']
    },
    {
      id: 'schadensmeldung',
      title: 'Schadensmeldung',
      description: 'Melde Schäden an Booten und Equipment. Dokumentiere mit Fotos und verfolge Reparaturen.',
      icon: Icons.warning,
      color: 'red',
      href: '/schadensmeldung',
      features: ['Foto-Upload', 'Status-Tracking']
    },
    {
      id: 'eventanmeldung',
      title: 'Eventanmeldung',
      description: 'Melde dich für Regatten und Trainingslager an. Verwalte Crew für Mehrpersonenboote.',
      icon: Icons.calendar,
      color: 'blue',
      href: '/eventanmeldung',
      features: ['Regatta-Anmeldung', 'Crew-Verwaltung']
    },
    {
      id: 'saisoncharter',
      title: 'Saison-Charter',
      description: 'Chartere ein Vereinsboot für die Saison. 250€ Pauschale von April bis September.',
      icon: Icons.anchor,
      color: 'emerald',
      href: '/saisoncharter',
      features: ['Boot-Auswahl', 'Verfügbarkeits-Kalender']
    },
    {
      id: 'jugendleistungsfonds',
      title: 'Jugendleistungsfonds',
      description: 'Beantrage Unterstützung für Ausrüstung, Training oder Regatta-Teilnahmen.',
      icon: Icons.euro,
      color: 'purple',
      href: '/jugendleistungsfonds',
      features: ['Förderantrag', 'Beleg-Upload']
    },
    {
      id: 'spendenportal',
      title: 'Spendenportal',
      description: 'Unterstütze die TSC-Jugend mit einer Spende für die Nachwuchsförderung.',
      icon: Icons.heart,
      color: 'rose',
      href: '/spendenportal',
      features: ['Online-Spenden', 'Kampagnen']
    },
    {
      id: 'jahresauswertung',
      title: 'Jahresauswertung',
      description: 'Statistiken der Jugendarbeit: Ranglisten, gefahrene Kilometer und Auszeichnungen.',
      icon: Icons.trophy,
      color: 'amber',
      href: '/jahresauswertung',
      features: ['Ranglisten', 'Jahres-Awards'],
      adminOnly: true
    }
  ];

  // Filter modules based on user role
  const visibleModules = modules.filter(module => {
    if (module.adminOnly && !isAdmin) return false;
    if (module.trainerOnly && !isTrainer) return false;  // isTrainer ist true für Trainer UND Admin
    return true;
  });

  return (
    <div className={`min-h-screen ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      {/* Header */}
      <header className={`border-b ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center glow-pulse ${isDark ? 'bg-gold-400/10' : 'bg-teal-100'}`}>
              <span className={`w-6 h-6 ${isDark ? 'text-gold-400' : 'text-teal-600'}`}>
                {Icons.sailboat}
              </span>
            </div>
            <div>
              <h1 className={`font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                TSC-Jugendportal
              </h1>
              <p className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-cream/60 hover:text-cream hover:bg-navy-800'
                  : 'text-light-muted hover:text-light-text hover:bg-light-border'
              }`}
            >
              <span className="w-5 h-5 block">
                {isDark ? Icons.sun : Icons.moon}
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/profil')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                isDark
                  ? 'text-cream/60 hover:text-cream hover:bg-navy-800'
                  : 'text-light-muted hover:text-light-text hover:bg-light-border'
              }`}
            >
              <span className="w-4 h-4">{Icons.user}</span>
              Profil
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                isDark
                  ? 'text-cream/60 hover:text-cream hover:bg-navy-800'
                  : 'text-light-muted hover:text-light-text hover:bg-light-border'
              }`}
            >
              <span className="w-4 h-4">{Icons.logOut}</span>
              Abmelden
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <GlassCard className="mb-8" shimmer>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center glow-pulse ${isDark ? 'bg-gold-400/10' : 'bg-teal-100'}`}>
              <span className={`w-7 h-7 ${isDark ? 'text-gold-400' : 'text-teal-600'}`}>
                {Icons.user}
              </span>
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Willkommen, {displayName}!
              </h2>
              <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Rolle: {displayRole}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Modules */}
        <h3 className={`text-lg font-semibold mb-4 text-shimmer ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Verfügbare Module
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          {visibleModules.map((module) => (
            <Link key={module.id} to={module.href} className="block">
              <GlassCard hoverLift shimmer className="h-full">
                <div className="flex items-start gap-4">
                  <IconBadge icon={module.icon} color={module.color} size="lg" />
                  <div className="flex-1">
                    <h4 className={`text-lg font-semibold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                      {module.title}
                    </h4>
                    <p className={`text-sm mb-3 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                      {module.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {module.features.map((feature) => (
                        <span
                          key={feature}
                          className={`text-xs px-2 py-1 rounded-full ${
                            isDark
                              ? 'bg-navy-700 text-cream/60'
                              : 'bg-light-border text-light-muted'
                          }`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-12">
            <h3 className={`text-lg font-semibold mb-4 text-shimmer ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Administration
            </h3>
            <div className="space-y-4">
              <Link to="/admin">
                <GlassCard shimmer hoverLift>
                  <div className="flex items-center gap-4">
                    <IconBadge icon={Icons.settings} color="slate" size="lg" />
                    <div className="flex-1">
                      <h4 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                        Admin-Bereich
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                        Benutzer, Rollen und Einstellungen verwalten
                      </p>
                    </div>
                    <span className={`w-5 h-5 ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
                      {Icons.chevronRight}
                    </span>
                  </div>
                </GlassCard>
              </Link>

              {/* Super Admin - dezenter Button */}
              <Link to="/super-admin">
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                  isDark
                    ? 'border-navy-700 hover:border-gold-400/30 hover:bg-navy-800/50 text-cream/50 hover:text-cream/80'
                    : 'border-light-border hover:border-amber-300 hover:bg-amber-50/50 text-light-muted hover:text-light-text'
                }`}>
                  <span className={`w-4 h-4 ${isDark ? 'text-gold-400/50' : 'text-amber-500/50'}`}>
                    {Icons.database}
                  </span>
                  <span className="text-sm">
                    Super-Backend
                  </span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                    isDark ? 'bg-navy-700 text-cream/40' : 'bg-light-border text-light-muted'
                  }`}>
                    Erweitert
                  </span>
                </div>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Dezenter Spenden-Button */}
      <DonateButton onClick={() => navigate('/spendenportal')} />
    </div>
  );
}
