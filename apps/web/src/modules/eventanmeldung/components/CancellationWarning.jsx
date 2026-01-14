import { useTheme, Icons } from '@tsc/ui';

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Check if date is in the past
 */
function isPastDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * CancellationWarning Component
 * Prominente Storno-Warnung mit Pflicht-Checkbox
 */
export function CancellationWarning({
  cancellationDeadline,
  cancellationFee,
  cancellationWarning,
  eventType,
  checked,
  onChange,
  required = true,
}) {
  const { isDark } = useTheme();

  const isTrainingslager = eventType === 'trainingslager';
  const isPastDeadline = isPastDate(cancellationDeadline);
  const hasFee = cancellationFee && cancellationFee > 0;

  // Determine severity based on event type and deadline
  const isHighSeverity = isTrainingslager || isPastDeadline || hasFee;

  return (
    <div className={`rounded-lg overflow-hidden ${
      isHighSeverity
        ? isDark
          ? 'bg-coral/10 border-2 border-coral/50'
          : 'bg-red-50 border-2 border-red-300'
        : isDark
          ? 'bg-navy-800 border border-navy-700'
          : 'bg-gray-50 border border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-4 ${
        isHighSeverity
          ? isDark ? 'bg-coral/20' : 'bg-red-100'
          : isDark ? 'bg-navy-700' : 'bg-gray-100'
      }`}>
        <div className={`flex items-start gap-3 ${
          isHighSeverity
            ? isDark ? 'text-coral' : 'text-red-800'
            : isDark ? 'text-cream' : 'text-light-text'
        }`}>
          <span className="w-6 h-6 flex-shrink-0">{Icons.alertTriangle}</span>
          <div>
            <h4 className="font-bold text-lg">
              Stornobedingungen
            </h4>
            {isTrainingslager && (
              <p className="text-sm mt-1 opacity-90">
                Besonders wichtig bei Trainingslagern!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Deadline Info */}
        <div className={`space-y-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          {cancellationDeadline && (
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              isPastDeadline
                ? isDark ? 'bg-coral/20' : 'bg-red-100'
                : isDark ? 'bg-navy-900/50' : 'bg-white'
            }`}>
              <span className="font-medium">Kostenfreie Stornierung bis:</span>
              <span className={`font-bold ${
                isPastDeadline
                  ? isDark ? 'text-coral' : 'text-red-700'
                  : isDark ? 'text-green-400' : 'text-green-600'
              }`}>
                {formatDate(cancellationDeadline)}
                {isPastDeadline && (
                  <span className="ml-2 text-sm">(abgelaufen)</span>
                )}
              </span>
            </div>
          )}

          {/* Fee Info */}
          {hasFee && (
            <div className={`p-3 rounded-lg ${
              isDark ? 'bg-coral/10' : 'bg-red-50'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-medium ${isDark ? 'text-coral' : 'text-red-700'}`}>
                  {isPastDeadline ? 'Aktuelle Stornogebühr:' : 'Stornogebühr nach Deadline:'}
                </span>
                <span className={`text-xl font-bold ${isDark ? 'text-coral' : 'text-red-700'}`}>
                  {cancellationFee.toLocaleString('de-DE')} EUR
                </span>
              </div>
            </div>
          )}

          {/* Custom Warning */}
          {cancellationWarning && (
            <div className={`p-3 rounded-lg ${isDark ? 'bg-navy-900/50' : 'bg-white'}`}>
              <p className={`text-sm ${isDark ? 'text-cream/80' : 'text-light-muted'}`}>
                {cancellationWarning}
              </p>
            </div>
          )}

          {/* Standard Warning for Trainingslager */}
          {isTrainingslager && !cancellationWarning && (
            <div className={`p-3 rounded-lg ${isDark ? 'bg-navy-900/50' : 'bg-white'}`}>
              <p className={`text-sm ${isDark ? 'text-cream/80' : 'text-light-muted'}`}>
                <strong>Wichtig:</strong> Bei Trainingslagern entstehen durch Stornierungen oft erhebliche Kosten
                (gebuchte Unterkünfte, Verpflegung, etc.), die nicht immer vollständig erstattet werden können.
                Bitte melde dich daher nur an, wenn du verbindlich teilnehmen kannst.
              </p>
            </div>
          )}
        </div>

        {/* Checkbox */}
        {required && (
          <label className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
            isDark
              ? 'bg-navy-800 hover:bg-navy-700'
              : 'bg-white hover:bg-gray-50'
          }`}>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              className={`w-5 h-5 mt-0.5 rounded border-2 ${
                isHighSeverity
                  ? isDark
                    ? 'bg-navy-900 border-coral text-coral focus:ring-coral'
                    : 'border-red-500 text-red-500 focus:ring-red-500'
                  : isDark
                    ? 'bg-navy-900 border-cream/50 text-gold-400 focus:ring-gold-400'
                    : 'border-gray-400 text-teal-500 focus:ring-teal-500'
              }`}
            />
            <span className={`text-sm ${isDark ? 'text-cream' : 'text-light-text'}`}>
              <strong>Ich habe die Stornobedingungen gelesen</strong> und verstanden.
              {isPastDeadline && hasFee && (
                <span className={`block mt-1 ${isDark ? 'text-coral' : 'text-red-700'}`}>
                  Mir ist bewusst, dass die Stornofrist bereits abgelaufen ist und bei einer Absage
                  eine Gebühr von {cancellationFee.toLocaleString('de-DE')} EUR anfällt.
                </span>
              )}
            </span>
          </label>
        )}
      </div>
    </div>
  );
}

export default CancellationWarning;
