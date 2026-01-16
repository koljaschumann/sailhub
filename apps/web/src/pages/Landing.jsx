import { Link, useNavigate } from 'react-router-dom';
import { GlassCard, Button, Icons, IconBadge, useTheme } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';

export default function Landing() {
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated, profile, signOut, isAdmin, isTrainer } = useAuth();
  const navigate = useNavigate();

  const handleModuleClick = (e, module) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate(module.href);
    } else {
      sessionStorage.setItem('redirectAfterLogin', module.href);
      navigate('/login');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
    window.location.reload();
  };

  const modules = [
    {
      id: 'saisonplanung',
      title: 'Saisonplanung',
      description: 'Plane als Trainer oder Sportwart die Regatten und Trainingslager deiner Trainingsgruppen.',
      icon: Icons.sailboat,
      color: 'amber',
      href: '/saisonplanung',
      features: ['Regatta-Kalender', 'Motorboot-Zuteilung', 'Trainingslager', 'PDF-Export'],
      trainerOnly: true,
      showOnLanding: true  // Immer auf Landing Page anzeigen
    },
    {
      id: 'startgelder',
      title: 'Startgeld-Erstattung',
      description: 'Erfasse deine Regatta-Teilnahmen über manage2sail und erstelle Erstattungsanträge.',
      icon: Icons.euro,
      color: 'mint',
      href: '/startgelder',
      features: ['manage2sail Integration', 'Rechnungs-Upload', 'SEPA-Export', 'Auto-Berechnung']
    },
    {
      id: 'schadensmeldung',
      title: 'Schadensmeldung',
      description: 'Melde Schäden an Booten und Hängern schnell und dokumentiere mit Fotos.',
      icon: Icons.warning,
      color: 'red',
      href: '/schadensmeldung',
      features: ['Foto-Upload', 'Status-Tracking', 'Equipment-Verwaltung', 'Admin-Dashboard']
    },
    {
      id: 'eventanmeldung',
      title: 'Eventanmeldung',
      description: 'Melde dich für Regatten und Trainingslager vereinsintern an. Verwalte Crew für Mehrpersonenboote.',
      icon: Icons.calendar,
      color: 'purple',
      href: '/eventanmeldung',
      features: ['Regatta-Anmeldung', 'Crew-Verwaltung', 'Absage-Management', 'Meisterschaften']
    },
    {
      id: 'saisoncharter',
      title: 'Saison-Charter',
      description: 'Chartere ein Vereinsboot für längere Zeiträume.',
      icon: Icons.anchor,
      color: 'cyan',
      href: '/saisoncharter',
      features: ['Boot-Auswahl', 'Saison-Buchung', 'Verfügbarkeits-Kalender', 'Vertrags-PDF']
    },
    {
      id: 'jugendleistungsfonds',
      title: 'Jugendleistungsfonds',
      description: 'Beantrage finanzielle Unterstützung für Ausrüstung, Training oder Regatten.',
      icon: Icons.sparkles,
      color: 'mint',
      href: '/jugendleistungsfonds',
      features: ['Förderantrag', 'Beleg-Upload', 'Status-Tracking', 'Auszahlung']
    },
    {
      id: 'spendenportal',
      title: 'Spendenportal',
      description: 'Unterstütze die Jugendabteilung mit einer Spende für die Nachwuchsförderung.',
      icon: Icons.heart,
      color: 'red',
      href: '/spendenportal',
      features: ['Online-Spenden', 'Kampagnen', 'Spendenquittung', 'Fortschritt']
    },
    {
      id: 'jahresauswertung',
      title: 'Jahresauswertung',
      description: 'Statistiken der Saison, Bestenauswertung, Jahresauszeichnungen.',
      icon: Icons.trophy,
      color: 'amber',
      href: '/jahresauswertung',
      features: ['Ranglisten', 'Distanz-Berechnung', 'Jahres-Awards', 'Statistiken'],
      adminOnly: true,
      showOnLanding: true  // Immer auf Landing Page anzeigen
    }
  ];

  // Filter modules based on user role
  // Auf der Landing Page: Module mit showOnLanding werden immer angezeigt
  const visibleModules = modules.filter(module => {
    // Module mit showOnLanding immer anzeigen
    if (module.showOnLanding) return true;
    if (module.adminOnly && !isAdmin) return false;
    if (module.trainerOnly && !isTrainer) return false;  // isTrainer ist true für Trainer UND Admin
    return true;
  });

  return (
    <div className={`min-h-screen ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      {/* Header - SailHub Style */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${
        isDark ? 'bg-navy-900/80 border-mint-400/20' : 'bg-white/80 border-navy-900/10'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${
              isDark
                ? 'bg-mint-400/15 border-mint-400/30'
                : 'bg-mint-100 border-mint-500/30'
            }`}>
              <span className={`w-6 h-6 ${isDark ? 'text-mint-400' : 'text-mint-600'}`}>
                {Icons.sailboat}
              </span>
            </div>
            <div>
              <h1 className={`font-display font-bold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                SailHub
              </h1>
              <p className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                TSC Jugendportal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all border ${
                isDark
                  ? 'text-cream/60 hover:text-mint-400 hover:bg-mint-400/10 border-transparent hover:border-mint-400/30'
                  : 'text-light-muted hover:text-mint-600 hover:bg-mint-50 border-transparent hover:border-mint-500/30'
              }`}
            >
              <span className="w-5 h-5 block">
                {isDark ? Icons.sun : Icons.moon}
              </span>
            </button>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className={`text-sm hidden sm:inline ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                  {profile?.full_name || 'Angemeldet'}
                </span>
                <Link to="/dashboard">
                  <Button size="sm">Dashboard</Button>
                </Link>
                <button
                  onClick={handleSignOut}
                  className={`px-3 py-1.5 text-sm rounded-xl transition-all border ${
                    isDark
                      ? 'text-cream/60 hover:text-cream hover:bg-navy-800 border-navy-700'
                      : 'text-light-muted hover:text-navy-900 hover:bg-sage border-navy-900/10'
                  }`}
                >
                  Abmelden
                </button>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="secondary" size="sm">Anmelden</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section - Compact SailHub Design */}
      <section className={`relative overflow-hidden border-b ${
        isDark
          ? 'bg-gradient-to-br from-navy-800 via-navy-850 to-navy-900 border-mint-400/20'
          : 'bg-gradient-to-br from-mint-400 via-mint-400 to-mint-500'
      }`}>
        {/* Decorative Elements */}
        <div className="noise-texture absolute inset-0 pointer-events-none" />
        <div className="dots-pattern absolute top-0 right-0 w-48 h-48 pointer-events-none" />
        <div className={`geometric-ring absolute -bottom-24 -right-24 w-64 h-64 rounded-full pointer-events-none ${
          isDark ? 'border-mint-400' : 'border-navy-900'
        }`} />
        <div className="corner-accent absolute top-6 left-6" />

        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-3 border ${
            isDark
              ? 'bg-mint-400/15 text-mint-400 border-mint-400/30'
              : 'bg-white/20 text-navy-900 border-navy-900/20'
          }`}>
            <span className="w-4 h-4">{Icons.sailboat}</span>
            <span>TSC Jugendportal</span>
          </div>

          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-3 ${
            isDark ? 'text-cream' : 'text-navy-900'
          }`}>
            SailHub
          </h2>
          <p className={`text-lg md:text-xl font-medium mb-2 ${
            isDark ? 'text-mint-400' : 'text-navy-900'
          }`}>
            Dein digitales Zuhause auf dem Tegeler See
          </p>
          <p className={`text-base max-w-2xl mx-auto mb-8 ${
            isDark ? 'text-cream/70' : 'text-navy-900/70'
          }`}>
            Plane die Saison mit dem Team, melde Schäden bevor sie zum Problem werden
            und hol dir deine Startgelder zurück - alles mit einem Login, von überall.
          </p>

          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button size="lg" variant={isDark ? 'primary' : 'dark'} icon={Icons.chart}>
                Zum Dashboard
              </Button>
            </Link>
          ) : (
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/register">
                <Button size="lg" variant={isDark ? 'primary' : 'white'} icon={Icons.sparkles}>
                  Jetzt registrieren
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant={isDark ? 'outline' : 'dark'}>
                  Anmelden
                </Button>
              </Link>
            </div>
          )}

          {/* Stats Bar */}
          <div className={`mt-12 inline-flex flex-wrap justify-center gap-8 px-8 py-4 rounded-2xl border ${
            isDark
              ? 'bg-navy-800/50 border-mint-400/20'
              : 'bg-white/30 border-navy-900/10'
          }`}>
            <div className="text-center">
              <div className={`text-2xl font-bold ${isDark ? 'text-mint-400' : 'text-navy-900'}`}>8</div>
              <div className={`text-xs ${isDark ? 'text-cream/60' : 'text-navy-900/60'}`}>Module</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${isDark ? 'text-mint-400' : 'text-navy-900'}`}>100+</div>
              <div className={`text-xs ${isDark ? 'text-cream/60' : 'text-navy-900/60'}`}>Segler</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${isDark ? 'text-mint-400' : 'text-navy-900'}`}>24/7</div>
              <div className={`text-xs ${isDark ? 'text-cream/60' : 'text-navy-900/60'}`}>Zugriff</div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className={`text-3xl font-display font-bold mb-3 ${isDark ? 'text-cream' : 'text-navy-900'}`}>
            Unsere Module
          </h3>
          <p className={`max-w-xl mx-auto ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Alles was du für eine erfolgreiche Saison brauchst - in einer Plattform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:-mx-6">
          {visibleModules.map((module, index) => (
            <a
              key={module.id}
              href={module.href}
              onClick={(e) => handleModuleClick(e, module)}
              className="block group"
            >
              <GlassCard
                hoverLift
                className="relative overflow-hidden cursor-pointer h-full"
              >
                {/* Decorative dot pattern */}
                <div className="dots-pattern absolute top-0 right-0 w-20 h-20 pointer-events-none opacity-50" />

                {/* Corner accent on hover */}
                <div className={`absolute top-3 left-3 w-8 h-1 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                  isDark ? 'bg-mint-400' : 'bg-mint-500'
                }`} />

                <div className="relative flex items-start gap-4">
                  <IconBadge icon={module.icon} color={module.color} size="lg" variant="soft" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className={`text-lg font-display font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                        {module.title}
                      </h4>
                      {!isAuthenticated && (
                        <span className={`w-4 h-4 ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
                          {Icons.lock}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mb-3 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                      {module.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {module.features.map((feature) => (
                        <span
                          key={feature}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                            isDark
                              ? 'bg-navy-700/50 text-cream/60 group-hover:bg-mint-400/10 group-hover:text-mint-400'
                              : 'bg-sage text-light-muted group-hover:bg-mint-100 group-hover:text-mint-600'
                          }`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </a>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className={`relative py-20 overflow-hidden ${
        isDark ? 'bg-navy-800/50' : 'bg-sage'
      }`}>
        {/* Decorative background */}
        <div className="grid-pattern absolute inset-0 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className={`text-3xl font-display font-bold mb-3 ${isDark ? 'text-cream' : 'text-navy-900'}`}>
              Warum SailHub?
            </h3>
            <p className={`max-w-xl mx-auto ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Die Plattform, die von Seglern für Segler entwickelt wurde
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Icons.lock,
                title: 'Sicher',
                description: 'Geschützter Zugang mit Rollen für Admin, Trainer, Eltern und Segler',
                color: 'mint'
              },
              {
                icon: Icons.users,
                title: 'Kollaborativ',
                description: 'Trainer planen, Eltern reichen ein, alle melden Schäden - zusammen',
                color: 'purple'
              },
              {
                icon: Icons.download,
                title: 'Exportierbar',
                description: 'PDF-Exporte für Kalender, Anträge und Berichte auf Knopfdruck',
                color: 'cyan'
              }
            ].map((feature, index) => (
              <GlassCard key={index} className="relative overflow-hidden text-center">
                {/* Glowing dot */}
                <div className="glow-dot absolute top-4 right-4" />

                <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center border-2 ${
                  isDark
                    ? 'bg-mint-400/15 text-mint-400 border-mint-400/30'
                    : 'bg-mint-100 text-mint-600 border-mint-500/30'
                }`}>
                  <span className="w-7 h-7">{feature.icon}</span>
                </div>
                <h4 className={`font-display font-semibold mb-2 ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                  {feature.title}
                </h4>
                <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                  {feature.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <GlassCard variant="mint" className="relative overflow-hidden text-center">
            {/* Decorations */}
            <div className={`geometric-ring absolute -top-16 -left-16 w-48 h-48 rounded-full pointer-events-none ${
              isDark ? 'border-mint-400' : 'border-navy-900'
            }`} />
            <div className="dots-pattern-lg absolute bottom-0 right-0 w-32 h-32 pointer-events-none opacity-40" />
            <div className="shimmer absolute inset-0 pointer-events-none" />

            <div className="relative">
              <h3 className={`text-2xl font-display font-bold mb-3 ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                Bereit für die Saison?
              </h3>
              <p className={`mb-6 max-w-md mx-auto ${isDark ? 'text-cream/70' : 'text-navy-900/70'}`}>
                Registriere dich jetzt und nutze alle Module des TSC-Jugendportals.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/register">
                  <Button size="lg" variant={isDark ? 'primary' : 'dark'} icon={Icons.sparkles}>
                    Kostenlos starten
                  </Button>
                </Link>
              </div>
            </div>
          </GlassCard>
        </section>
      )}

      {/* Footer */}
      <footer className={`border-t py-8 ${isDark ? 'border-navy-700' : 'border-navy-900/10'}`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-mint-400/15 text-mint-400' : 'bg-mint-100 text-mint-600'
              }`}>
                <span className="w-4 h-4">{Icons.sailboat}</span>
              </div>
              <span className={`text-sm font-medium ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                SailHub by TSC
              </span>
            </div>
            <p className={`text-sm ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
              &copy; {new Date().getFullYear()} Tegeler Segel-Club e.V. - Jugendabteilung
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Donate Button */}
      <Link
        to="/spendenportal"
        className={`fixed bottom-6 right-6 p-3 rounded-full shadow-lg transition-all hover:scale-110 group z-40 ${
          isDark
            ? 'bg-rose-500/90 hover:bg-rose-500 text-white'
            : 'bg-rose-500 hover:bg-rose-600 text-white'
        }`}
        title="Jetzt spenden"
      >
        <span className="w-5 h-5 block">{Icons.heart}</span>
        <span className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${
          isDark ? 'bg-navy-800 text-cream' : 'bg-white text-navy-900 shadow-md'
        }`}>
          Jetzt spenden
        </span>
      </Link>
    </div>
  );
}
