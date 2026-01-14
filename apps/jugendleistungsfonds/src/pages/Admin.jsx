import { useState } from 'react';
import { useTheme, GlassCard, Button, Icons, IconBadge, Modal, useToast } from '@tsc/ui';
import { useData } from '../context/DataContext';

const STATUS_LABELS = {
  eingereicht: 'Eingereicht',
  in_pruefung: 'In Prüfung',
  genehmigt: 'Genehmigt',
  abgelehnt: 'Abgelehnt',
  ausgezahlt: 'Ausgezahlt',
};

const STATUS_COLORS = {
  eingereicht: 'blue',
  in_pruefung: 'gold',
  genehmigt: 'emerald',
  abgelehnt: 'red',
  ausgezahlt: 'purple',
};

const CATEGORY_LABELS = {
  equipment: 'Ausrüstung',
  training: 'Training',
  regatta: 'Regatta',
  trainingslager: 'Trainingslager',
  sonstiges: 'Sonstiges',
};

export function AdminPage() {
  const { isDark } = useTheme();
  const { addToast } = useToast();
  const { applications, updateApplicationStatus, getStatistics } = useData();

  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const currentYear = new Date().getFullYear();
  const stats = getStatistics(currentYear);

  const filteredApplications = applications.filter(app => {
    if (filterStatus && app.status !== filterStatus) return false;
    if (filterCategory && app.category !== filterCategory) return false;
    return true;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatAmount = (amount) => {
    return amount.toFixed(2).replace('.', ',') + ' €';
  };

  const openDecisionModal = (application, status) => {
    setSelectedApplication(application);
    setNewStatus(status);
    setApprovedAmount(application.total_amount.toString());
    setAdminNotes('');
    setDecisionModalOpen(true);
  };

  const handleDecision = async () => {
    if (!selectedApplication || !newStatus) return;

    const amount = newStatus === 'abgelehnt' ? 0 : parseFloat(approvedAmount) || 0;

    await updateApplicationStatus(
      selectedApplication.id,
      newStatus,
      amount,
      adminNotes.trim() || undefined
    );

    addToast(`Antrag ${STATUS_LABELS[newStatus].toLowerCase()}`, 'success');
    setDecisionModalOpen(false);
    setSelectedApplication(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Verwaltung
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Förderanträge prüfen und bearbeiten
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard>
          <div className={`text-2xl font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
            {stats.total}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Anträge {currentYear}
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-2xl font-bold text-blue-400">
            {stats.eingereicht + stats.in_pruefung}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Offen
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-2xl font-bold text-emerald-400">
            {formatAmount(stats.totalApproved)}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Genehmigt
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-2xl font-bold text-purple-400">
            {formatAmount(stats.totalPaid)}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Ausgezahlt
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard className="flex flex-wrap gap-4">
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
            <option value="eingereicht">Eingereicht</option>
            <option value="in_pruefung">In Prüfung</option>
            <option value="genehmigt">Genehmigt</option>
            <option value="abgelehnt">Abgelehnt</option>
            <option value="ausgezahlt">Ausgezahlt</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className={`block text-xs mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Kategorie
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border text-sm ${
              isDark
                ? 'bg-navy-800 border-navy-700 text-cream'
                : 'bg-white border-light-border text-light-text'
            }`}
          >
            <option value="">Alle Kategorien</option>
            <option value="equipment">Ausrüstung</option>
            <option value="training">Training</option>
            <option value="regatta">Regatta</option>
            <option value="trainingslager">Trainingslager</option>
            <option value="sonstiges">Sonstiges</option>
          </select>
        </div>
      </GlassCard>

      {/* Applications List */}
      {filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map(application => (
            <GlassCard key={application.id}>
              <div className="flex items-start gap-4">
                <IconBadge
                  icon={Icons.user}
                  color={STATUS_COLORS[application.status]}
                  size="md"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                      {application.applicant_first_name} {application.applicant_last_name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${
                      application.status === 'eingereicht'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : application.status === 'in_pruefung'
                          ? 'bg-gold-400/20 text-gold-400 border-gold-400/30'
                          : application.status === 'genehmigt'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : application.status === 'abgelehnt'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    }`}>
                      {STATUS_LABELS[application.status]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      isDark ? 'bg-navy-700 text-cream/60' : 'bg-light-border text-light-muted'
                    }`}>
                      {CATEGORY_LABELS[application.category]}
                    </span>
                  </div>

                  <p className={`text-sm font-medium ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                    {application.title}
                  </p>

                  <p className={`text-sm mt-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                    {application.description.length > 100
                      ? application.description.slice(0, 100) + '...'
                      : application.description}
                  </p>

                  <div className={`flex items-center gap-4 mt-2 text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                    <span>{application.contact_email}</span>
                    <span>{formatDate(application.created_at)}</span>
                    {application.documents?.length > 0 && (
                      <span className="flex items-center gap-1">
                        {Icons.file} {application.documents.length} Dokument(e)
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-lg font-bold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                    {formatAmount(application.total_amount)}
                  </div>

                  {application.status === 'eingereicht' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openDecisionModal(application, 'in_pruefung')}
                      >
                        Prüfen
                      </Button>
                    </div>
                  )}

                  {application.status === 'in_pruefung' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => openDecisionModal(application, 'genehmigt')}
                      >
                        Genehmigen
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openDecisionModal(application, 'abgelehnt')}
                      >
                        Ablehnen
                      </Button>
                    </div>
                  )}

                  {application.status === 'genehmigt' && (
                    <Button
                      size="sm"
                      onClick={() => openDecisionModal(application, 'ausgezahlt')}
                    >
                      Als ausgezahlt markieren
                    </Button>
                  )}

                  {application.approved_amount > 0 && (
                    <div className={`text-xs mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      Genehmigt: {formatAmount(application.approved_amount)}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="text-center py-12">
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Keine Anträge gefunden
          </p>
        </GlassCard>
      )}

      {/* Decision Modal */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title={`Antrag ${STATUS_LABELS[newStatus]?.toLowerCase() || 'bearbeiten'}`}
      >
        <div className="space-y-4">
          <div className={`p-3 rounded-lg ${isDark ? 'bg-navy-800' : 'bg-light-border/50'}`}>
            <p className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
              {selectedApplication?.title}
            </p>
            <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              {selectedApplication?.applicant_first_name} {selectedApplication?.applicant_last_name}
            </p>
            <p className={`text-sm font-medium mt-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Beantragt: {formatAmount(selectedApplication?.total_amount || 0)}
            </p>
          </div>

          {(newStatus === 'genehmigt' || newStatus === 'ausgezahlt') && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Genehmigter Betrag (€)
              </label>
              <input
                type="number"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                min="0"
                step="0.01"
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              />
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Anmerkung (optional)
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Begründung oder Hinweise..."
              className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                  : 'bg-white border-light-border text-light-text'
              }`}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDecisionModalOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleDecision}>
              Bestätigen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminPage;
