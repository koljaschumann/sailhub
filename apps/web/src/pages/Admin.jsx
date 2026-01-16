import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard, Button, Icons, IconBadge, useTheme, useToast, Modal } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { roles, roleLabels, getRoleLabel } from '@tsc/data';

// Mock users for development (will be replaced with Supabase data)
const mockUsers = [
  { id: '1', email: 'admin@tsc-jugend.de', full_name: 'Max Mustermann', role: 'admin', membership_number: '1001', created_at: '2024-01-15' },
  { id: '2', email: 'trainer@tsc-jugend.de', full_name: 'Lisa Schmidt', role: 'trainer', membership_number: '1002', created_at: '2024-02-20' },
  { id: '3', email: 'eltern@tsc-jugend.de', full_name: 'Thomas Meyer', role: 'eltern', membership_number: '1003', created_at: '2024-03-10' },
  { id: '4', email: 'segler1@tsc-jugend.de', full_name: 'Anna Weber', role: 'segler', membership_number: '1004', created_at: '2024-04-05' },
  { id: '5', email: 'segler2@tsc-jugend.de', full_name: 'Paul Fischer', role: 'segler', membership_number: '', created_at: '2024-05-12' },
  { id: '6', email: 'trainer2@tsc-jugend.de', full_name: 'Maria Hoffmann', role: 'trainer', membership_number: '1006', created_at: '2024-06-01' },
];

export default function Admin() {
  const { isDark, toggleTheme } = useTheme();
  const { user, profile, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [users, setUsers] = useState(mockUsers);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter users based on role and search term
  const filteredUsers = users.filter(u => {
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesSearch = searchTerm === '' ||
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.membership_number && u.membership_number.includes(searchTerm));
    return matchesRole && matchesSearch;
  });

  // Role statistics
  const roleStats = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    trainer: users.filter(u => u.role === 'trainer').length,
    eltern: users.filter(u => u.role === 'eltern').length,
    segler: users.filter(u => u.role === 'segler').length,
  };

  const handleRoleChange = (userId, newRole) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, role: newRole } : u
    ));
    addToast(`Rolle wurde zu "${getRoleLabel(newRole)}" geändert`, 'success');
    setShowRoleModal(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    addToast('Benutzer wurde gelöscht', 'success');
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'gold';
      case 'trainer': return 'blue';
      case 'eltern': return 'emerald';
      case 'segler': return 'purple';
      default: return 'slate';
    }
  };

  const inputClasses = `w-full px-4 py-2 rounded-lg border transition-colors ${
    isDark
      ? 'bg-navy-800 border-navy-600 text-cream placeholder-cream/40 focus:border-gold-400'
      : 'bg-white border-light-border text-light-text placeholder-light-muted focus:border-teal-500'
  } focus:outline-none`;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      {/* Header */}
      <header className={`border-b ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
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
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gold-400/10' : 'bg-teal-100'}`}>
              <span className={`w-6 h-6 ${isDark ? 'text-gold-400' : 'text-teal-600'}`}>
                {Icons.settings}
              </span>
            </div>
            <div>
              <h1 className={`font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Benutzerverwaltung
              </h1>
              <p className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Administration
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Modul-Verwaltung */}
        <GlassCard className="mb-8">
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Modul-Verwaltung
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/saisoncharter?page=admin"
              className={`p-4 rounded-xl border transition-colors flex flex-col items-center gap-2 ${
                isDark
                  ? 'bg-navy-800/50 border-navy-700 hover:border-cyan-400 hover:bg-navy-800'
                  : 'bg-light-border/30 border-light-border hover:border-teal-500'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-cyan-400/10 text-cyan-400' : 'bg-cyan-100 text-cyan-600'
              }`}>
                {Icons.sailboat}
              </div>
              <span className={`text-sm font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Charter-Boote
              </span>
              <span className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                Boote & Buchungen
              </span>
            </Link>

            <Link
              to="/schadensmeldung"
              className={`p-4 rounded-xl border transition-colors flex flex-col items-center gap-2 ${
                isDark
                  ? 'bg-navy-800/50 border-navy-700 hover:border-coral hover:bg-navy-800'
                  : 'bg-light-border/30 border-light-border hover:border-red-500'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-coral/10 text-coral' : 'bg-red-100 text-red-600'
              }`}>
                {Icons.warning}
              </div>
              <span className={`text-sm font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Schadensmeldungen
              </span>
              <span className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                Meldungen & Equipment
              </span>
            </Link>

            <Link
              to="/saisonplanung"
              className={`p-4 rounded-xl border transition-colors flex flex-col items-center gap-2 ${
                isDark
                  ? 'bg-navy-800/50 border-navy-700 hover:border-gold-400 hover:bg-navy-800'
                  : 'bg-light-border/30 border-light-border hover:border-amber-500'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-gold-400/10 text-gold-400' : 'bg-amber-100 text-amber-600'
              }`}>
                {Icons.calendar}
              </div>
              <span className={`text-sm font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Saisonplanung
              </span>
              <span className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                Events & Motorboote
              </span>
            </Link>

            <Link
              to="/eventanmeldung"
              className={`p-4 rounded-xl border transition-colors flex flex-col items-center gap-2 ${
                isDark
                  ? 'bg-navy-800/50 border-navy-700 hover:border-purple-400 hover:bg-navy-800'
                  : 'bg-light-border/30 border-light-border hover:border-purple-500'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-purple-400/10 text-purple-400' : 'bg-purple-100 text-purple-600'
              }`}>
                {Icons.users}
              </div>
              <span className={`text-sm font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Eventanmeldung
              </span>
              <span className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                Anmeldungen verwalten
              </span>
            </Link>
          </div>
        </GlassCard>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <GlassCard className="text-center">
            <div className={`text-2xl font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
              {roleStats.total}
            </div>
            <div className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Gesamt
            </div>
          </GlassCard>
          <GlassCard className="text-center">
            <div className={`text-2xl font-bold ${isDark ? 'text-gold-400' : 'text-amber-600'}`}>
              {roleStats.admin}
            </div>
            <div className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Admins
            </div>
          </GlassCard>
          <GlassCard className="text-center">
            <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {roleStats.trainer}
            </div>
            <div className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Trainer
            </div>
          </GlassCard>
          <GlassCard className="text-center">
            <div className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {roleStats.eltern}
            </div>
            <div className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Eltern
            </div>
          </GlassCard>
          <GlassCard className="text-center">
            <div className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              {roleStats.segler}
            </div>
            <div className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Segler
            </div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Suche nach Name, E-Mail oder Mitgliedsnummer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'admin', 'trainer', 'eltern', 'segler'].map((role) => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterRole === role
                      ? isDark
                        ? 'bg-gold-400 text-navy-900'
                        : 'bg-teal-500 text-white'
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
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Benutzer ({filteredUsers.length})
            </h2>
          </div>

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
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                    isDark ? 'bg-navy-700 text-cream' : 'bg-white text-light-text'
                  }`}>
                    {u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium truncate ${isDark ? 'text-cream' : 'text-light-text'}`}>
                        {u.full_name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'admin'
                          ? isDark ? 'bg-gold-400/20 text-gold-400' : 'bg-amber-100 text-amber-700'
                          : u.role === 'trainer'
                            ? isDark ? 'bg-blue-400/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                            : u.role === 'eltern'
                              ? isDark ? 'bg-emerald-400/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                              : isDark ? 'bg-purple-400/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {getRoleLabel(u.role)}
                      </span>
                    </div>
                    <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                      {u.email}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
                      {u.membership_number ? `Nr. ${u.membership_number}` : 'Keine Mitgliedsnr.'} • Registriert: {new Date(u.created_at).toLocaleDateString('de-DE')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
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
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setShowDeleteModal(true);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark
                          ? 'text-coral/60 hover:text-coral hover:bg-navy-700'
                          : 'text-red-400 hover:text-red-600 hover:bg-light-border'
                      }`}
                      title="Benutzer löschen"
                    >
                      <span className="w-5 h-5 block">{Icons.trash}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Dev Mode Notice */}
        <div className={`mt-6 p-4 rounded-xl text-sm text-center ${
          isDark ? 'bg-gold-400/10 text-gold-400' : 'bg-amber-50 text-amber-700'
        }`}>
          <strong>Entwicklungsmodus:</strong> Die Benutzerdaten sind Mock-Daten.
          Im Produktionsbetrieb werden echte Daten aus Supabase geladen.
        </div>
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
              Rolle für <strong>{selectedUser.full_name}</strong> ändern:
            </p>
            <div className="space-y-2">
              {Object.entries(roleLabels).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => handleRoleChange(selectedUser.id, value)}
                  className={`w-full p-3 rounded-lg text-left transition-colors flex items-center justify-between ${
                    selectedUser.role === value
                      ? isDark
                        ? 'bg-gold-400/20 border border-gold-400'
                        : 'bg-teal-50 border border-teal-500'
                      : isDark
                        ? 'bg-navy-700 hover:bg-navy-600'
                        : 'bg-light-border hover:bg-gray-200'
                  }`}
                >
                  <span className={isDark ? 'text-cream' : 'text-light-text'}>
                    {label}
                  </span>
                  {selectedUser.role === value && (
                    <span className={`text-sm ${isDark ? 'text-gold-400' : 'text-teal-600'}`}>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        title="Benutzer löschen"
      >
        {selectedUser && (
          <div>
            <p className={`mb-4 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Möchtest du <strong>{selectedUser.full_name}</strong> wirklich löschen?
            </p>
            <p className={`mb-6 text-sm ${isDark ? 'text-coral' : 'text-red-600'}`}>
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
              >
                Abbrechen
              </Button>
              <button
                onClick={() => handleDeleteUser(selectedUser.id)}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
