import { useState } from 'react';
import { useTheme, GlassCard, Button, Icons, IconBadge, useToast } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { useData } from '../context/DataContext';

const STATUS_LABELS = {
  ausstehend: 'Zahlung ausstehend',
  bezahlt: 'Bezahlt',
  storniert: 'Storniert',
};

const STATUS_COLORS = {
  ausstehend: 'gold',
  bezahlt: 'emerald',
  storniert: 'red',
};

const BOAT_TYPE_LABELS = {
  optimist: 'Optimist',
  ilca4: 'ILCA 4',
  ilca6: 'ILCA 6',
  '420er': '420er',
  '29er': '29er',
  laser: 'Laser',
};

export function AdminPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { addToast } = useToast();
  const { isAdmin, isTrainer, userRole } = useAuth();
  const { boats, seasons, bookings, getActiveSeason, updateBookingStatus, getSeasonBookings } = useData();

  // All hooks must be called before any conditional returns
  const [activeTab, setActiveTab] = useState('bookings');
  const [filterSeason, setFilterSeason] = useState(getActiveSeason()?.id || '');
  const [filterStatus, setFilterStatus] = useState('');

  // Access control: Only admin can access this page
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <GlassCard className="text-center py-12">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isDark ? 'bg-red-500/20' : 'bg-red-100'
          }`}>
            <span className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {Icons.warning}
            </span>
          </div>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Kein Zugang
          </h2>
          <p className={`mb-4 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Der Verwaltungsbereich ist nur für Administratoren zugänglich.
          </p>
          <p className={`text-sm mb-6 ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
            Deine aktuelle Rolle: <span className="font-medium">{userRole || 'Nicht erkannt'}</span>
          </p>
          <Button onClick={() => setCurrentPage('booking')} icon={Icons.arrowLeft}>
            Zurück zur Übersicht
          </Button>
        </GlassCard>
      </div>
    );
  }

  const seasonBookings = filterSeason ? getSeasonBookings(filterSeason) : bookings;
  const filteredBookings = seasonBookings.filter(b => {
    if (filterStatus && b.status !== filterStatus) return false;
    return true;
  });

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    await updateBookingStatus(bookingId, newStatus);
    addToast(`Status geändert auf "${STATUS_LABELS[newStatus]}"`, 'success');
  };

  // Statistics
  const activeSeason = getActiveSeason();
  const activeSeasonBookings = activeSeason ? getSeasonBookings(activeSeason.id) : [];
  const stats = {
    total: activeSeasonBookings.length,
    ausstehend: activeSeasonBookings.filter(b => b.status === 'ausstehend').length,
    bezahlt: activeSeasonBookings.filter(b => b.status === 'bezahlt').length,
    storniert: activeSeasonBookings.filter(b => b.status === 'storniert').length,
    revenue: activeSeasonBookings
      .filter(b => b.status !== 'storniert')
      .reduce((sum, b) => sum + (b.season?.price || 0), 0),
    paidRevenue: activeSeasonBookings
      .filter(b => b.status === 'bezahlt')
      .reduce((sum, b) => sum + (b.season?.price || 0), 0),
  };

  // Boats per type
  const boatsPerType = boats.reduce((acc, boat) => {
    acc[boat.boat_type] = (acc[boat.boat_type] || 0) + 1;
    return acc;
  }, {});

  const bookedBoatsPerType = activeSeasonBookings
    .filter(b => b.status !== 'storniert')
    .reduce((acc, booking) => {
      const boatType = booking.boat?.boat_type;
      if (boatType) {
        acc[boatType] = (acc[boatType] || 0) + 1;
      }
      return acc;
    }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Verwaltung
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Charter-Buchungen und Statistiken
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard>
          <div className={`text-2xl font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
            {stats.total}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Buchungen gesamt
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-2xl font-bold text-gold-400">
            {stats.ausstehend}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Zahlung offen
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-2xl font-bold text-emerald-400">
            {stats.paidRevenue}€
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Einnahmen bezahlt
          </div>
        </GlassCard>
        <GlassCard>
          <div className={`text-2xl font-bold ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
            {stats.revenue}€
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Einnahmen erwartet
          </div>
        </GlassCard>
      </div>

      {/* Tabs */}
      <div className={`flex gap-2 border-b ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'bookings'
              ? isDark
                ? 'border-emerald-400 text-emerald-400'
                : 'border-emerald-500 text-emerald-600'
              : isDark
                ? 'border-transparent text-cream/60 hover:text-cream'
                : 'border-transparent text-light-muted hover:text-light-text'
          }`}
        >
          Buchungen ({filteredBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('boats')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'boats'
              ? isDark
                ? 'border-emerald-400 text-emerald-400'
                : 'border-emerald-500 text-emerald-600'
              : isDark
                ? 'border-transparent text-cream/60 hover:text-cream'
                : 'border-transparent text-light-muted hover:text-light-text'
          }`}
        >
          Boote ({boats.length})
        </button>
      </div>

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Filters */}
          <GlassCard className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className={`block text-xs mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Saison
              </label>
              <select
                value={filterSeason}
                onChange={(e) => setFilterSeason(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              >
                <option value="">Alle Saisons</option>
                {seasons.map(season => (
                  <option key={season.id} value={season.id}>
                    {season.year} {season.active && '(aktiv)'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className={`block text-xs mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              >
                <option value="">Alle Status</option>
                <option value="ausstehend">Zahlung ausstehend</option>
                <option value="bezahlt">Bezahlt</option>
                <option value="storniert">Storniert</option>
              </select>
            </div>
          </GlassCard>

          {/* Bookings List */}
          {filteredBookings.length > 0 ? (
            <div className="space-y-3">
              {filteredBookings.map(booking => (
                <GlassCard key={booking.id}>
                  <div className="flex items-start gap-4">
                    <IconBadge
                      icon={Icons.user}
                      color={STATUS_COLORS[booking.status]}
                      size="md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                          {booking.sailor_first_name} {booking.sailor_last_name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${
                          booking.status === 'ausstehend'
                            ? 'bg-gold-400/20 text-gold-400 border-gold-400/30'
                            : booking.status === 'bezahlt'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          {STATUS_LABELS[booking.status]}
                        </span>
                      </div>

                      <p className={`text-sm ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                        {booking.boat?.name} ({booking.boat?.sail_number})
                        <span className="mx-2">•</span>
                        Saison {booking.season?.year}
                      </p>

                      <div className={`flex items-center gap-4 mt-2 text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                        <span>{booking.contact_email}</span>
                        {booking.contact_phone && <span>{booking.contact_phone}</span>}
                        <span>Gebucht: {formatDate(booking.created_at)}</span>
                      </div>

                      {booking.reason && (
                        <p className={`mt-1 text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                          Zweck: {booking.reason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`text-right text-sm font-medium mr-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                        {booking.season?.price}€
                      </div>
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm border ${
                          isDark
                            ? 'bg-navy-800 border-navy-700 text-cream'
                            : 'bg-white border-light-border text-light-text'
                        }`}
                      >
                        <option value="ausstehend">Ausstehend</option>
                        <option value="bezahlt">Bezahlt</option>
                        <option value="storniert">Storniert</option>
                      </select>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard className="text-center py-12">
              <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
                Keine Buchungen gefunden
              </p>
            </GlassCard>
          )}
        </div>
      )}

      {/* Boats Tab */}
      {activeTab === 'boats' && (
        <div className="space-y-4">
          {/* Boats per Type Overview */}
          <GlassCard>
            <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Auslastung nach Bootstyp (Saison {activeSeason?.year || '-'})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(boatsPerType).map(([type, total]) => {
                const booked = bookedBoatsPerType[type] || 0;
                const percentage = Math.round((booked / total) * 100);

                return (
                  <div key={type} className={`p-3 rounded-lg ${isDark ? 'bg-navy-800' : 'bg-light-border/30'}`}>
                    <div className={`text-sm font-medium mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                      {BOAT_TYPE_LABELS[type] || type}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                      {booked} / {total} gebucht ({percentage}%)
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-navy-700 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Boats List */}
          <div className="grid md:grid-cols-2 gap-4">
            {boats.map(boat => {
              const booking = activeSeason ? activeSeasonBookings.find(
                b => b.boat_id === boat.id && b.status !== 'storniert'
              ) : null;

              return (
                <GlassCard key={boat.id}>
                  <div className="flex items-start gap-3">
                    <IconBadge
                      icon={Icons.sailboat}
                      color={boat.available ? (booking ? 'blue' : 'emerald') : 'slate'}
                      size="md"
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                          {boat.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          isDark ? 'bg-navy-700 text-cream/60' : 'bg-light-border text-light-muted'
                        }`}>
                          {BOAT_TYPE_LABELS[boat.boat_type] || boat.boat_type}
                        </span>
                      </div>

                      <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                        {boat.sail_number}
                      </p>

                      {!boat.available && boat.notes && (
                        <p className={`text-xs mt-1 ${isDark ? 'text-coral/80' : 'text-red-500'}`}>
                          {boat.notes}
                        </p>
                      )}

                      {booking && (
                        <div className={`mt-2 pt-2 border-t text-xs ${
                          isDark ? 'border-navy-700 text-cream/50' : 'border-light-border text-light-muted'
                        }`}>
                          Gechartert: {booking.sailor_first_name} {booking.sailor_last_name}
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                            booking.status === 'bezahlt'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-gold-400/20 text-gold-400'
                          }`}>
                            {STATUS_LABELS[booking.status]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
