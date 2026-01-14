import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, GlassCard, Button, Icons, IconBadge } from '@tsc/ui';
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

export function MyApplicationsPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { applications } = useData();

  const [expandedId, setExpandedId] = useState(null);

  const sortedApplications = [...applications].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Meine Anträge
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            {applications.length} Antrag{applications.length !== 1 ? 'Anträge' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/')} icon={Icons.plus}>
          Neuer Antrag
        </Button>
      </div>

      {sortedApplications.length > 0 ? (
        <div className="space-y-4">
          {sortedApplications.map(application => (
            <GlassCard
              key={application.id}
              className="cursor-pointer transition-all hover:scale-[1.01]"
              onClick={() => setExpandedId(expandedId === application.id ? null : application.id)}
            >
              <div className="flex items-start gap-4">
                <IconBadge
                  icon={Icons.euro}
                  color={STATUS_COLORS[application.status]}
                  size="lg"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                      {application.title}
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

                  <p className={`text-sm ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                    {application.applicant_first_name} {application.applicant_last_name}
                  </p>

                  <div className={`flex items-center gap-4 mt-2 text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                    <span className="flex items-center gap-1">
                      {Icons.calendar}
                      {formatDate(application.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      {Icons.euro}
                      {formatAmount(application.total_amount)}
                    </span>
                    {application.approved_amount && (
                      <span className="text-emerald-400">
                        Genehmigt: {formatAmount(application.approved_amount)}
                      </span>
                    )}
                  </div>
                </div>

                <div className={`w-6 h-6 transition-transform ${expandedId === application.id ? 'rotate-180' : ''} ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
                  {Icons.chevronDown}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === application.id && (
                <div className={`mt-4 pt-4 border-t ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
                  {/* Description */}
                  <div className="mb-4">
                    <h4 className={`text-xs font-medium mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                      Begründung
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                      {application.description}
                    </p>
                  </div>

                  {/* Cost Items */}
                  <div className="mb-4">
                    <h4 className={`text-xs font-medium mb-2 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                      Kostenpositionen
                    </h4>
                    <div className="space-y-1">
                      {application.cost_items.map((item, idx) => (
                        <div key={idx} className={`flex justify-between text-sm ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                          <span>{item.description}</span>
                          <span>{formatAmount(item.amount)}</span>
                        </div>
                      ))}
                      <div className={`flex justify-between text-sm font-medium pt-2 border-t ${
                        isDark ? 'border-navy-700 text-cream' : 'border-light-border text-light-text'
                      }`}>
                        <span>Gesamt</span>
                        <span>{formatAmount(application.total_amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  {application.documents?.length > 0 && (
                    <div className="mb-4">
                      <h4 className={`text-xs font-medium mb-2 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                        Dokumente
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {application.documents.map((doc, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              isDark ? 'bg-navy-700 text-cream/70' : 'bg-light-border text-light-muted'
                            }`}
                          >
                            {Icons.file}
                            {doc.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  {application.admin_notes && (
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-navy-800' : 'bg-light-border/50'}`}>
                      <h4 className={`text-xs font-medium mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                        Anmerkung der Verwaltung
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                        {application.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="text-center py-12">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
            isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-500'
          }`}>
            {Icons.euro}
          </div>
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Noch keine Anträge
          </h3>
          <p className={`mb-4 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Du hast noch keinen Förderantrag gestellt.
          </p>
          <Button onClick={() => navigate('/')}>
            Antrag stellen
          </Button>
        </GlassCard>
      )}
    </div>
  );
}

export default MyApplicationsPage;
