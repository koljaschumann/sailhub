import { useState } from 'react';
import { useTheme, GlassCard, Button, Icons, IconBadge, useToast, Modal } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { useData } from '../context/DataContext';
import { downloadInvoicePdf } from '../utils/invoicePdf';

const STATUS_LABELS = {
  beantragt: 'Beantragt',
  genehmigt: 'Genehmigt',
  boot_zugewiesen: 'Boot zugewiesen',
  aktiv: 'Aktiv',
  beendet: 'Beendet',
  abgelehnt: 'Abgelehnt',
};

const STATUS_COLORS = {
  beantragt: 'gold',
  genehmigt: 'blue',
  boot_zugewiesen: 'cyan',
  aktiv: 'emerald',
  beendet: 'slate',
  abgelehnt: 'red',
};

const INVOICE_STATUS_LABELS = {
  erstellt: 'Rechnung erstellt',
  versendet: 'Rechnung versendet',
  bezahlt: 'Bezahlt',
  storniert: 'Storniert',
};

const INVOICE_STATUS_COLORS = {
  erstellt: 'blue',
  versendet: 'gold',
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
  const { boats, seasons, bookings, invoices, getActiveSeason, updateBookingStatus, getSeasonBookings, addBoat, updateBoat, deleteBoat, getBookingInvoice, createInvoice, updateInvoiceStatus } = useData();

  // All hooks must be called before any conditional returns
  const [activeTab, setActiveTab] = useState('bookings');
  const [filterSeason, setFilterSeason] = useState(getActiveSeason()?.id || '');
  const [filterStatus, setFilterStatus] = useState('');

  // Boot-Verwaltung State
  const [showBoatModal, setShowBoatModal] = useState(false);
  const [editingBoat, setEditingBoat] = useState(null);
  const [boatForm, setBoatForm] = useState({
    name: '',
    boat_type: 'optimist',
    sail_number: '',
    available: true,
    charter_fee: '',
    notes: '',
  });
  const [savingBoat, setSavingBoat] = useState(false);

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

  // Boot-Verwaltung Funktionen
  const openBoatModal = (boat = null) => {
    if (boat) {
      setEditingBoat(boat);
      setBoatForm({
        name: boat.name,
        boat_type: boat.boat_type,
        sail_number: boat.sail_number,
        available: boat.available,
        charter_fee: boat.charter_fee || '',
        notes: boat.notes || '',
      });
    } else {
      setEditingBoat(null);
      setBoatForm({
        name: '',
        boat_type: 'optimist',
        sail_number: '',
        available: true,
        charter_fee: '',
        notes: '',
      });
    }
    setShowBoatModal(true);
  };

  const closeBoatModal = () => {
    setShowBoatModal(false);
    setEditingBoat(null);
  };

  const handleSaveBoat = async () => {
    if (!boatForm.name.trim() || !boatForm.sail_number.trim()) {
      addToast('Name und Segelnummer sind erforderlich', 'error');
      return;
    }

    setSavingBoat(true);
    try {
      const boatData = {
        ...boatForm,
        charter_fee: boatForm.charter_fee ? parseFloat(boatForm.charter_fee) : null,
      };

      if (editingBoat) {
        await updateBoat(editingBoat.id, boatData);
        addToast('Boot aktualisiert', 'success');
      } else {
        await addBoat(boatData);
        addToast('Boot hinzugefügt', 'success');
      }
      closeBoatModal();
    } catch (err) {
      addToast(err.message || 'Fehler beim Speichern', 'error');
    } finally {
      setSavingBoat(false);
    }
  };

  const handleDeleteBoat = async (boat) => {
    if (!confirm(`Boot "${boat.name}" wirklich löschen?`)) return;

    try {
      await deleteBoat(boat.id);
      addToast('Boot gelöscht', 'success');
    } catch (err) {
      addToast(err.message || 'Fehler beim Löschen', 'error');
    }
  };

  // Rechnungs-Funktionen
  const handleCreateInvoice = async (booking) => {
    try {
      await createInvoice(booking);
      addToast('Rechnung erstellt', 'success');
    } catch (err) {
      addToast(err.message || 'Fehler beim Erstellen der Rechnung', 'error');
    }
  };

  const handleDownloadInvoice = (booking) => {
    const invoice = getBookingInvoice(booking.id);
    if (!invoice) {
      addToast('Keine Rechnung vorhanden', 'error');
      return;
    }
    downloadInvoicePdf(invoice, booking);
    addToast('PDF wird heruntergeladen', 'success');
  };

  const handleMarkInvoiceSent = async (invoiceId) => {
    try {
      await updateInvoiceStatus(invoiceId, 'versendet');
      addToast('Rechnung als versendet markiert', 'success');
    } catch (err) {
      addToast(err.message || 'Fehler beim Aktualisieren', 'error');
    }
  };

  const handleMarkInvoicePaid = async (invoiceId, bookingId) => {
    try {
      await updateInvoiceStatus(invoiceId, 'bezahlt');
      await updateBookingStatus(bookingId, 'bezahlt');
      addToast('Als bezahlt markiert', 'success');
    } catch (err) {
      addToast(err.message || 'Fehler beim Aktualisieren', 'error');
    }
  };

  // Statistics
  const activeSeason = getActiveSeason();
  const activeSeasonBookings = activeSeason ? getSeasonBookings(activeSeason.id) : [];

  // Helper: Preis für Buchung ermitteln (Boot-spezifisch oder Season-Standard)
  const getBookingPrice = (booking) => booking.boat?.charter_fee || booking.season?.price || 0;

  const stats = {
    total: activeSeasonBookings.length,
    beantragt: activeSeasonBookings.filter(b => b.status === 'beantragt').length,
    aktiv: activeSeasonBookings.filter(b => b.status === 'aktiv').length,
    abgelehnt: activeSeasonBookings.filter(b => b.status === 'abgelehnt').length,
    revenue: activeSeasonBookings
      .filter(b => b.status !== 'abgelehnt')
      .reduce((sum, b) => sum + getBookingPrice(b), 0),
    paidRevenue: activeSeasonBookings
      .filter(b => b.status === 'aktiv')
      .reduce((sum, b) => sum + getBookingPrice(b), 0),
  };

  // Boats per type
  const boatsPerType = boats.reduce((acc, boat) => {
    acc[boat.boat_type] = (acc[boat.boat_type] || 0) + 1;
    return acc;
  }, {});

  const bookedBoatsPerType = activeSeasonBookings
    .filter(b => b.status !== 'abgelehnt')
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
                <option value="beantragt">Beantragt</option>
                <option value="genehmigt">Genehmigt</option>
                <option value="boot_zugewiesen">Boot zugewiesen</option>
                <option value="aktiv">Aktiv</option>
                <option value="beendet">Beendet</option>
                <option value="abgelehnt">Abgelehnt</option>
              </select>
            </div>
          </GlassCard>

          {/* Bookings List */}
          {filteredBookings.length > 0 ? (
            <div className="space-y-3">
              {filteredBookings.map(booking => {
                const invoice = getBookingInvoice(booking.id);
                return (
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
                            {booking.sailor_name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${
                            booking.status === 'beantragt'
                              ? 'bg-gold-400/20 text-gold-400 border-gold-400/30'
                              : booking.status === 'genehmigt' || booking.status === 'boot_zugewiesen'
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                : booking.status === 'aktiv'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : booking.status === 'abgelehnt'
                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                    : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                          }`}>
                            {STATUS_LABELS[booking.status] || booking.status}
                          </span>
                        </div>

                        <p className={`text-sm ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                          {booking.boat?.name} ({booking.boat?.sail_number})
                          <span className="mx-2">•</span>
                          Saison {booking.season?.year}
                        </p>

                        <div className={`flex items-center gap-4 mt-2 text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                          <span>{booking.guardian_email}</span>
                          {booking.guardian_phone && <span>{booking.guardian_phone}</span>}
                          <span>Gebucht: {formatDate(booking.created_at)}</span>
                        </div>

                        {booking.charter_reason && (
                          <p className={`mt-1 text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                            Zweck: {booking.charter_reason}
                          </p>
                        )}

                        {/* Rechnungs-Bereich */}
                        <div className={`mt-3 pt-3 border-t ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                                Rechnung:
                              </span>
                              {invoice ? (
                                <>
                                  <span className={`text-xs font-mono ${isDark ? 'text-cream' : 'text-light-text'}`}>
                                    {invoice.invoice_number}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                                    invoice.status === 'erstellt'
                                      ? 'bg-blue-500/20 text-blue-400'
                                      : invoice.status === 'versendet'
                                        ? 'bg-gold-400/20 text-gold-400'
                                        : invoice.status === 'bezahlt'
                                          ? 'bg-emerald-500/20 text-emerald-400'
                                          : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {INVOICE_STATUS_LABELS[invoice.status]}
                                  </span>
                                </>
                              ) : (
                                <span className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                                  Noch nicht erstellt
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {!invoice && booking.status !== 'abgelehnt' && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleCreateInvoice(booking)}
                                >
                                  Rechnung erstellen
                                </Button>
                              )}
                              {invoice && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleDownloadInvoice(booking)}
                                    icon={Icons.download}
                                  >
                                    PDF
                                  </Button>
                                  {invoice.status === 'erstellt' && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => handleMarkInvoiceSent(invoice.id)}
                                    >
                                      Als versendet markieren
                                    </Button>
                                  )}
                                  {invoice.status === 'versendet' && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleMarkInvoicePaid(invoice.id, booking.id)}
                                    >
                                      Als bezahlt markieren
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className={`text-right text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {getBookingPrice(booking)}€
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
                          <option value="beantragt">Beantragt</option>
                          <option value="genehmigt">Genehmigt</option>
                          <option value="boot_zugewiesen">Boot zugewiesen</option>
                          <option value="aktiv">Aktiv</option>
                          <option value="beendet">Beendet</option>
                          <option value="abgelehnt">Abgelehnt</option>
                        </select>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
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
          {/* Add Boat Button */}
          <div className="flex justify-end">
            <Button onClick={() => openBoatModal()} icon={Icons.plus}>
              Neues Boot
            </Button>
          </div>

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
                b => b.assigned_boat_id === boat.id && b.status !== 'abgelehnt'
              ) : null;
              const boatPrice = boat.charter_fee || activeSeason?.price || 0;

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
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {boatPrice}€
                        </span>
                      </div>

                      <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                        {boat.sail_number}
                        {boat.charter_fee && (
                          <span className="ml-2 text-xs">(individueller Preis)</span>
                        )}
                      </p>

                      {!boat.available && (
                        <p className={`text-xs mt-1 ${isDark ? 'text-coral/80' : 'text-red-500'}`}>
                          Nicht verfügbar {boat.notes && `- ${boat.notes}`}
                        </p>
                      )}

                      {booking && (
                        <div className={`mt-2 pt-2 border-t text-xs ${
                          isDark ? 'border-navy-700 text-cream/50' : 'border-light-border text-light-muted'
                        }`}>
                          Gechartert: {booking.sailor_name}
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                            booking.status === 'aktiv'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : booking.status === 'abgelehnt'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gold-400/20 text-gold-400'
                          }`}>
                            {STATUS_LABELS[booking.status] || booking.status}
                          </span>
                        </div>
                      )}

                      {/* Edit/Delete Buttons */}
                      <div className={`mt-3 pt-3 border-t flex gap-2 ${
                        isDark ? 'border-navy-700' : 'border-light-border'
                      }`}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openBoatModal(boat)}
                          icon={Icons.settings}
                        >
                          Bearbeiten
                        </Button>
                        {!booking && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteBoat(boat)}
                            icon={Icons.trash}
                          >
                            Löschen
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Boot Modal */}
      <Modal
        isOpen={showBoatModal}
        onClose={closeBoatModal}
        title={editingBoat ? 'Boot bearbeiten' : 'Neues Boot hinzufügen'}
      >
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Name *
            </label>
            <input
              type="text"
              value={boatForm.name}
              onChange={(e) => setBoatForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="z.B. Opti 1"
              className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                  : 'bg-white border-light-border text-light-text'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Bootstyp *
              </label>
              <select
                value={boatForm.boat_type}
                onChange={(e) => setBoatForm(prev => ({ ...prev, boat_type: e.target.value }))}
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              >
                {Object.entries(BOAT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Segelnummer *
              </label>
              <input
                type="text"
                value={boatForm.sail_number}
                onChange={(e) => setBoatForm(prev => ({ ...prev, sail_number: e.target.value }))}
                placeholder="z.B. GER 12345"
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                    : 'bg-white border-light-border text-light-text'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Charterpauschale (€)
            </label>
            <input
              type="number"
              value={boatForm.charter_fee}
              onChange={(e) => setBoatForm(prev => ({ ...prev, charter_fee: e.target.value }))}
              placeholder={`Standard: ${activeSeason?.price || 250}€`}
              className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                  : 'bg-white border-light-border text-light-text'
              }`}
            />
            <p className={`mt-1 text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
              Leer lassen für Saison-Standardpreis ({activeSeason?.price || 250}€)
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Notizen
            </label>
            <input
              type="text"
              value={boatForm.notes}
              onChange={(e) => setBoatForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="z.B. In Reparatur"
              className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                  : 'bg-white border-light-border text-light-text'
              }`}
            />
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={boatForm.available}
                onChange={(e) => setBoatForm(prev => ({ ...prev, available: e.target.checked }))}
                className={`w-5 h-5 rounded border-2 ${
                  isDark ? 'border-navy-600' : 'border-light-border'
                }`}
              />
              <span className={`text-sm ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Boot ist verfügbar für Charter
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={closeBoatModal}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveBoat} disabled={savingBoat} icon={Icons.check}>
              {savingBoat ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminPage;
