import { useState } from 'react';
import { useTheme, GlassCard, Button, Icons, IconBadge, useToast } from '@tsc/ui';
import { useAuth } from '@tsc/supabase';
import { useData } from '../context/DataContext';

const STATUS_OPTIONS = [
  { value: 'offen', label: 'Offen', color: 'red' },
  { value: 'in_bearbeitung', label: 'In Bearbeitung', color: 'gold' },
  { value: 'erledigt', label: 'Erledigt', color: 'emerald' },
];

export function AdminPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { addToast } = useToast();
  const { isAdmin, isTrainer, userRole } = useAuth();
  const { damageReports, updateReportStatus, equipmentTypes, equipment } = useData();

  const [selectedReport, setSelectedReport] = useState(null);

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
          <Button onClick={() => setCurrentPage('list')} icon={Icons.arrowLeft}>
            Zurück zur Übersicht
          </Button>
        </GlassCard>
      </div>
    );
  }

  const handleStatusChange = async (reportId, newStatus) => {
    await updateReportStatus(reportId, newStatus);
    addToast(`Status auf "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}" geändert`, 'success');
    setSelectedReport(null);
  };

  const openReports = damageReports.filter(r => r.status === 'offen').length;
  const inProgressReports = damageReports.filter(r => r.status === 'in_bearbeitung').length;
  const completedReports = damageReports.filter(r => r.status === 'erledigt').length;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Administration
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Schadensmeldungen verwalten und Equipment pflegen
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard className="text-center">
          <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-coral' : 'text-red-500'}`}>
            {openReports}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Offen
          </div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-gold-400' : 'text-amber-500'}`}>
            {inProgressReports}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            In Bearbeitung
          </div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-success' : 'text-green-500'}`}>
            {completedReports}
          </div>
          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Erledigt
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <GlassCard>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Schnellzugriff
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="secondary"
            onClick={() => setCurrentPage('equipment')}
            icon={Icons.settings}
            className="justify-start"
          >
            Equipment verwalten
          </Button>
          <Button
            variant="secondary"
            onClick={() => setCurrentPage('list')}
            icon={Icons.list}
            className="justify-start"
          >
            Alle Meldungen
          </Button>
        </div>
      </GlassCard>

      {/* Pending Reports */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Offene Meldungen
          </h2>
          <span className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-coral/20 text-coral' : 'bg-red-100 text-red-600'}`}>
            {openReports} offen
          </span>
        </div>

        {damageReports.filter(r => r.status !== 'erledigt').length > 0 ? (
          <div className="space-y-3">
            {damageReports
              .filter(r => r.status !== 'erledigt')
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map(report => (
                <div
                  key={report.id}
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-navy-800/50 border-navy-700' : 'bg-light-border/20 border-light-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                          {report.equipment?.name || 'Unbekannt'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          report.status === 'offen'
                            ? 'bg-coral/20 text-coral'
                            : 'bg-gold-400/20 text-gold-400'
                        }`}>
                          {report.status === 'offen' ? 'Offen' : 'In Bearbeitung'}
                        </span>
                      </div>
                      <p className={`text-sm line-clamp-2 mb-2 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                        {report.description}
                      </p>
                      <div className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                        {formatDate(report.created_at)} • {report.reporter_name}
                      </div>
                    </div>

                    {/* Status Buttons */}
                    <div className="flex flex-col gap-2">
                      {report.status === 'offen' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleStatusChange(report.id, 'in_bearbeitung')}
                        >
                          Bearbeiten
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(report.id, 'erledigt')}
                      >
                        Erledigt
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-success/10 text-success' : 'bg-green-100 text-green-500'
            }`}>
              {Icons.check}
            </div>
            <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
              Alle Meldungen erledigt!
            </p>
          </div>
        )}
      </GlassCard>

      {/* Equipment Overview */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Equipment-Übersicht
          </h2>
          <Button variant="secondary" size="sm" onClick={() => setCurrentPage('equipment')}>
            Verwalten
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {equipmentTypes.map(type => {
            const count = equipment.filter(e => e.type_id === type.id && e.active).length;
            return (
              <div
                key={type.id}
                className={`p-4 rounded-xl ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}`}
              >
                <div className={`w-8 h-8 mb-2 ${isDark ? 'text-gold-400' : 'text-teal-500'}`}>
                  {type.name === 'segelboot' && Icons.sailboat}
                  {type.name === 'motorboot' && Icons.boat}
                  {type.name === 'haenger' && Icons.truck}
                </div>
                <div className={`text-lg font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  {count}
                </div>
                <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                  {type.display_name}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

export default AdminPage;
