import { useState } from 'react';
import { useTheme, GlassCard, Button, Icons, IconBadge } from '@tsc/ui';
import { useData } from '../context/DataContext';

const STATUS_LABELS = {
  offen: 'Offen',
  in_bearbeitung: 'In Bearbeitung',
  erledigt: 'Erledigt',
};

const STATUS_COLORS = {
  offen: 'status-offen',
  in_bearbeitung: 'status-in_bearbeitung',
  erledigt: 'status-erledigt',
};

export function ReportListPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { damageReports, equipmentTypes } = useData();

  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filteredReports = damageReports.filter(r => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterType && r.equipment?.type?.id !== filterType) return false;
    return true;
  });

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Schadensmeldungen
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            {filteredReports.length} Meldung{filteredReports.length !== 1 ? 'en' : ''}
          </p>
        </div>
        <Button onClick={() => setCurrentPage('report')} icon={Icons.plus}>
          Neue Meldung
        </Button>
      </div>

      {/* Filters */}
      <GlassCard className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[150px]">
          <label className={`block text-xs mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Typ
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border text-sm ${
              isDark
                ? 'bg-navy-800 border-navy-700 text-cream'
                : 'bg-white border-light-border text-light-text'
            }`}
          >
            <option value="">Alle Typen</option>
            {equipmentTypes.map(t => (
              <option key={t.id} value={t.id}>{t.display_name}</option>
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
            <option value="offen">Offen</option>
            <option value="in_bearbeitung">In Bearbeitung</option>
            <option value="erledigt">Erledigt</option>
          </select>
        </div>
      </GlassCard>

      {/* Reports List */}
      {filteredReports.length > 0 ? (
        <div className="space-y-4">
          {filteredReports.map(report => (
            <GlassCard
              key={report.id}
              className="cursor-pointer transition-all hover:scale-[1.01]"
              onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <IconBadge
                  icon={
                    report.equipment?.type?.name === 'motorboot'
                      ? Icons.boat
                      : report.equipment?.type?.name === 'haenger'
                        ? Icons.truck
                        : Icons.sailboat
                  }
                  color={report.status === 'erledigt' ? 'emerald' : report.status === 'in_bearbeitung' ? 'gold' : 'red'}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold truncate ${isDark ? 'text-cream' : 'text-light-text'}`}>
                      {report.equipment?.name || 'Unbekannt'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[report.status]}`}>
                      {STATUS_LABELS[report.status]}
                    </span>
                  </div>
                  <p className={`text-sm line-clamp-2 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                    {report.description}
                  </p>
                  <div className={`flex items-center gap-4 mt-2 text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                    <span className="flex items-center gap-1">
                      {Icons.calendar} {formatDate(report.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      {Icons.user} {report.reporter_name}
                    </span>
                    {report.photos?.length > 0 && (
                      <span className="flex items-center gap-1">
                        {Icons.camera} {report.photos.length} Foto{report.photos.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expand Icon */}
                <div className={`w-6 h-6 transition-transform ${expandedId === report.id ? 'rotate-180' : ''} ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
                  {Icons.chevronDown}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === report.id && (
                <div className={`mt-4 pt-4 border-t ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
                  {/* Full Description */}
                  <div className="mb-4">
                    <h4 className={`text-sm font-medium mb-1 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                      Beschreibung
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                      {report.description}
                    </p>
                  </div>

                  {/* Photos */}
                  {report.photos?.length > 0 && (
                    <div className="mb-4">
                      <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                        Fotos
                      </h4>
                      <div className="grid grid-cols-4 gap-2">
                        {report.photos.map((photo, index) => (
                          <img
                            key={photo.id}
                            src={photo.preview || `/api/storage/${photo.storage_path}`}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {report.pdf_url && (
                      <Button variant="secondary" size="sm" icon={Icons.download}>
                        PDF herunterladen
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="text-center py-12">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
            isDark ? 'bg-gold-400/10 text-gold-400' : 'bg-teal-500/10 text-teal-500'
          }`}>
            {Icons.check}
          </div>
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Keine Schadensmeldungen
          </h3>
          <p className={`mb-4 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            {filterStatus || filterType
              ? 'Keine Meldungen mit diesen Filtern gefunden.'
              : 'Es wurden noch keine Schäden gemeldet.'}
          </p>
          {!filterStatus && !filterType && (
            <Button onClick={() => setCurrentPage('report')}>
              Schaden melden
            </Button>
          )}
        </GlassCard>
      )}
    </div>
  );
}

export default ReportListPage;
