import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GlassCard, Button, Icons, IconBadge, useTheme, useToast, Modal } from '@tsc/ui';
import { useAuth, supabase } from '@tsc/supabase';
import { getRoleLabel } from '@tsc/data';

export default function SuperAdmin() {
  const { isDark, toggleTheme } = useTheme();
  const { user, profile, isAdmin, signIn } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Re-authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Data state
  const [users, setUsers] = useState([]);
  const [damages, setDamages] = useState([]);
  const [events, setEvents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [donations, setDonations] = useState([]);
  const [charters, setCharters] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Re-authentication handler
  const handleReAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (error) {
        setAuthError('Falsches Passwort. Bitte erneut versuchen.');
      } else {
        setIsAuthenticated(true);
        setPassword('');
        loadAllData();
      }
    } catch (err) {
      setAuthError('Authentifizierung fehlgeschlagen.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Load all data from Supabase
  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load users from profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!profilesError && profilesData) {
        setUsers(profilesData);
      }

      // Load damages
      const { data: damagesData } = await supabase
        .from('damage_reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (damagesData) setDamages(damagesData);

      // Load events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      if (eventsData) setEvents(eventsData);

      // Load fund applications
      const { data: appsData } = await supabase
        .from('funding_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (appsData) setApplications(appsData);

      // Load donations
      const { data: donationsData } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });
      if (donationsData) setDonations(donationsData);

      // Load charters
      const { data: chartersData } = await supabase
        .from('charter_bookings')
        .select('*')
        .order('created_at', { ascending: false });
      if (chartersData) setCharters(chartersData);

    } catch (err) {
      console.error('Error loading data:', err);
      addToast('Fehler beim Laden der Daten', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ));
      addToast(`Rolle wurde zu "${getRoleLabel(newRole)}" geändert`, 'success');
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (err) {
      addToast('Fehler beim Ändern der Rolle', 'error');
    }
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesSearch = searchTerm === '' ||
      (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  // Role statistics
  const roleStats = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    trainer: users.filter(u => u.role === 'trainer').length,
    eltern: users.filter(u => u.role === 'eltern').length,
  };

  // Data statistics
  const dataStats = {
    damages: damages.length,
    events: events.length,
    applications: applications.length,
    donations: donations.length,
    charters: charters.length,
  };

  const inputClasses = `w-full px-4 py-2 rounded-lg border transition-colors ${
    isDark
      ? 'bg-navy-800 border-navy-600 text-cream placeholder-cream/40 focus:border-gold-400'
      : 'bg-white border-light-border text-light-text placeholder-light-muted focus:border-teal-500'
  } focus:outline-none`;

  const tabs = [
    { id: 'users', label: 'Benutzer', icon: Icons.users, count: users.length },
    { id: 'damages', label: 'Schadensmeldungen', icon: Icons.warning, count: damages.length },
    { id: 'events', label: 'Events', icon: Icons.calendar, count: events.length },
    { id: 'applications', label: 'Förderanträge', icon: Icons.sparkles, count: applications.length },
    { id: 'donations', label: 'Spenden', icon: Icons.heart, count: donations.length },
    { id: 'charters', label: 'Saison-Charter', icon: Icons.anchor, count: charters.length },
  ];

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
        <GlassCard className="text-center max-w-md">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isDark ? 'bg-red-500/20' : 'bg-red-100'
          }`}>
            <span className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {Icons.lock}
            </span>
          </div>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Kein Zugang
          </h2>
          <p className={`mb-6 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Das Super-Backend ist nur für Administratoren zugänglich.
          </p>
          <Button onClick={() => navigate('/dashboard')} icon={Icons.home}>
            Zurück zum Dashboard
          </Button>
        </GlassCard>
      </div>
    );
  }

  // Re-authentication screen
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
        <GlassCard className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDark ? 'bg-gold-400/20' : 'bg-amber-100'
            }`}>
              <span className={`w-8 h-8 ${isDark ? 'text-gold-400' : 'text-amber-600'}`}>
                {Icons.lock}
              </span>
            </div>
            <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Super-Backend
            </h2>
            <p className={`${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Bitte bestätige deine Identität
            </p>
          </div>

          <form onSubmit={handleReAuth} className="space-y-4">
            <div>
              <label className={`block text-sm mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                E-Mail
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className={`${inputClasses} opacity-60`}
              />
            </div>

            <div>
              <label className={`block text-sm mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Dein Passwort"
                className={inputClasses}
                autoFocus
                required
              />
            </div>

            {authError && (
              <p className="text-red-500 text-sm">{authError}</p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                loading={authLoading}
                className="flex-1"
              >
                Bestätigen
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      {/* Header */}
      <header className={`border-b ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-cream/60 hover:text-cream hover:bg-navy-800'
                  : 'text-light-muted hover:text-light-text hover:bg-light-border'
              }`}
            >
              <span className="w-5 h-5 block">{Icons.home}</span>
            </Link>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gold-400/10' : 'bg-amber-100'}`}>
              <span className={`w-6 h-6 ${isDark ? 'text-gold-400' : 'text-amber-600'}`}>
                {Icons.database}
              </span>
            </div>
            <div>
              <h1 className={`font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Super-Backend
              </h1>
              <p className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Vollständige Datenübersicht
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              disabled={loading}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-cream/60 hover:text-cream hover:bg-navy-800'
                  : 'text-light-muted hover:text-light-text hover:bg-light-border'
              }`}
              title="Daten neu laden"
            >
              <span className={`w-5 h-5 block ${loading ? 'animate-spin' : ''}`}>{Icons.refresh}</span>
            </button>
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${
              isDark ? 'border-gold-400' : 'border-amber-500'
            }`} />
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
              <GlassCard className="text-center">
                <div className={`text-2xl font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  {roleStats.total}
                </div>
                <div className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                  Benutzer
                </div>
              </GlassCard>
              <GlassCard className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {dataStats.damages}
                </div>
                <div className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                  Schäden
                </div>
              </GlassCard>
              <GlassCard className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {dataStats.events}
                </div>
                <div className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                  Events
                </div>
              </GlassCard>
              <GlassCard className="text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  {dataStats.applications}
                </div>
                <div className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                  Anträge
                </div>
              </GlassCard>
              <GlassCard className="text-center">
                <div className="text-2xl font-bold text-rose-400">
                  {dataStats.donations}
                </div>
                <div className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                  Spenden
                </div>
              </GlassCard>
              <GlassCard className="text-center">
                <div className="text-2xl font-bold text-cyan-400">
                  {dataStats.charters}
                </div>
                <div className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                  Charters
                </div>
              </GlassCard>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? isDark
                        ? 'bg-gold-400 text-navy-900'
                        : 'bg-amber-500 text-white'
                      : isDark
                        ? 'bg-navy-800 text-cream/70 hover:text-cream'
                        : 'bg-light-border text-light-muted hover:text-light-text'
                  }`}
                >
                  <span className="w-4 h-4">{tab.icon}</span>
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    activeTab === tab.id
                      ? 'bg-white/20'
                      : isDark ? 'bg-navy-700' : 'bg-white'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Content based on active tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* User Filters */}
                <GlassCard>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Suche nach Name oder E-Mail..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {['all', 'admin', 'trainer', 'eltern'].map((role) => (
                        <button
                          key={role}
                          onClick={() => setFilterRole(role)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filterRole === role
                              ? isDark
                                ? 'bg-gold-400 text-navy-900'
                                : 'bg-amber-500 text-white'
                              : isDark
                                ? 'bg-navy-700 text-cream/70 hover:text-cream'
                                : 'bg-light-border text-light-muted hover:text-light-text'
                          }`}
                        >
                          {role === 'all' ? 'Alle' : getRoleLabel(role)}
                        </button>
                      ))}
                    </div>
                  </div>
                </GlassCard>

                {/* User List */}
                <GlassCard>
                  <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                    Benutzer ({filteredUsers.length})
                  </h2>
                  <div className="space-y-3">
                    {filteredUsers.length === 0 ? (
                      <p className={`text-center py-8 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                        Keine Benutzer gefunden
                      </p>
                    ) : (
                      filteredUsers.map((u) => (
                        <div
                          key={u.id}
                          className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                            isDark ? 'bg-navy-800/50 hover:bg-navy-800' : 'bg-light-border/30 hover:bg-light-border/50'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                            isDark ? 'bg-navy-700 text-cream' : 'bg-white text-light-text'
                          }`}>
                            {(u.full_name || u.email || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium truncate ${isDark ? 'text-cream' : 'text-light-text'}`}>
                                {u.full_name || 'Kein Name'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                u.role === 'admin'
                                  ? isDark ? 'bg-gold-400/20 text-gold-400' : 'bg-amber-100 text-amber-700'
                                  : u.role === 'trainer'
                                    ? isDark ? 'bg-blue-400/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                                    : isDark ? 'bg-emerald-400/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {getRoleLabel(u.role)}
                              </span>
                            </div>
                            <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                              {u.email}
                            </div>
                            <div className={`text-xs ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
                              ID: {u.id.slice(0, 8)}... • Registriert: {new Date(u.created_at).toLocaleDateString('de-DE')}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowRoleModal(true);
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? 'text-cream/60 hover:text-cream hover:bg-navy-700'
                                : 'text-light-muted hover:text-light-text hover:bg-light-border'
                            }`}
                            title="Rolle ändern"
                          >
                            <span className="w-5 h-5 block">{Icons.edit}</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </GlassCard>
              </div>
            )}

            {activeTab === 'damages' && (
              <GlassCard>
                <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  Schadensmeldungen ({damages.length})
                </h2>
                {damages.length === 0 ? (
                  <p className={`text-center py-8 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                    Keine Schadensmeldungen vorhanden
                  </p>
                ) : (
                  <div className="space-y-3">
                    {damages.map(d => (
                      <div key={d.id} className={`p-4 rounded-xl ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                              {d.title || d.equipment_name || 'Schadensmeldung'}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                              {d.description?.slice(0, 100)}...
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            d.status === 'open' ? 'bg-red-500/20 text-red-400' :
                            d.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {d.status || 'open'}
                          </span>
                        </div>
                        <div className={`text-xs mt-2 ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
                          {new Date(d.created_at).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {activeTab === 'events' && (
              <GlassCard>
                <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  Events ({events.length})
                </h2>
                {events.length === 0 ? (
                  <p className={`text-center py-8 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                    Keine Events vorhanden
                  </p>
                ) : (
                  <div className="space-y-3">
                    {events.map(e => (
                      <div key={e.id} className={`p-4 rounded-xl ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}`}>
                        <h3 className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                          {e.name || e.title}
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                          {e.date && new Date(e.date).toLocaleDateString('de-DE')} • {e.location || 'Kein Ort'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {activeTab === 'applications' && (
              <GlassCard>
                <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  Förderanträge ({applications.length})
                </h2>
                {applications.length === 0 ? (
                  <p className={`text-center py-8 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                    Keine Förderanträge vorhanden
                  </p>
                ) : (
                  <div className="space-y-3">
                    {applications.map(a => (
                      <div key={a.id} className={`p-4 rounded-xl ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                              {a.purpose || 'Förderantrag'}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                              Betrag: {a.amount?.toFixed(2).replace('.', ',')} €
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            a.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            a.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {a.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {activeTab === 'donations' && (
              <GlassCard>
                <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  Spenden ({donations.length})
                </h2>
                {donations.length === 0 ? (
                  <p className={`text-center py-8 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                    Keine Spenden vorhanden
                  </p>
                ) : (
                  <div className="space-y-3">
                    {donations.map(d => (
                      <div key={d.id} className={`p-4 rounded-xl ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                              {d.anonymous ? 'Anonym' : (d.donor_name || 'Unbekannt')}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                              {d.message?.slice(0, 50) || 'Keine Nachricht'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-rose-400">
                              {d.amount?.toFixed(2).replace('.', ',')} €
                            </div>
                            <div className={`text-xs ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
                              {new Date(d.created_at).toLocaleDateString('de-DE')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {activeTab === 'charters' && (
              <GlassCard>
                <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  Saison-Charter ({charters.length})
                </h2>
                {charters.length === 0 ? (
                  <p className={`text-center py-8 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                    Keine Saison-Charter vorhanden
                  </p>
                ) : (
                  <div className="space-y-3">
                    {charters.map(c => (
                      <div key={c.id} className={`p-4 rounded-xl ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                              {c.boat_name || 'Boot'}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                              Saison {c.season || new Date().getFullYear()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            c.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            c.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {c.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}
          </>
        )}
      </main>

      {/* Role Change Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedUser(null);
        }}
        title="Rolle ändern"
      >
        {selectedUser && (
          <div>
            <p className={`mb-4 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Rolle für <strong>{selectedUser.full_name || selectedUser.email}</strong> ändern:
            </p>
            <div className="space-y-2">
              {['admin', 'trainer', 'eltern'].map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(selectedUser.id, role)}
                  className={`w-full p-3 rounded-lg text-left transition-colors flex items-center justify-between ${
                    selectedUser.role === role
                      ? isDark
                        ? 'bg-gold-400/20 border border-gold-400'
                        : 'bg-amber-50 border border-amber-500'
                      : isDark
                        ? 'bg-navy-700 hover:bg-navy-600'
                        : 'bg-light-border hover:bg-gray-200'
                  }`}
                >
                  <span className={isDark ? 'text-cream' : 'text-light-text'}>
                    {getRoleLabel(role)}
                  </span>
                  {selectedUser.role === role && (
                    <span className={`text-sm ${isDark ? 'text-gold-400' : 'text-amber-600'}`}>
                      Aktuell
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
