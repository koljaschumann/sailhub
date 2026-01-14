import { useState } from 'react';
import { useTheme, Icons } from '@tsc/ui';

/**
 * CostWarning Component
 * Prominente Kosten-Warnung für Trainingslager mit Pflicht-Checkbox
 */
export function CostWarning({
  hasCosts,
  estimatedCost,
  costDescription,
  eventType,
  checked,
  onChange,
  required = true,
}) {
  const { isDark } = useTheme();
  const [showDetails, setShowDetails] = useState(false);

  const isTrainingslager = eventType === 'trainingslager';

  // Für normale Events ohne Kosten: Hinweis anzeigen
  if (!hasCosts && !isTrainingslager) {
    return (
      <div className={`p-4 rounded-lg ${isDark ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
        <div className={`flex items-center gap-2 ${isDark ? 'text-green-400' : 'text-green-700'}`}>
          <span className="w-5 h-5">{Icons.checkCircle}</span>
          <span className="text-sm font-medium">
            In der Regel entstehen keine zusätzlichen Kosten für Segler
          </span>
        </div>
      </div>
    );
  }

  // Keine Warnung wenn keine Kosten
  if (!hasCosts) return null;

  return (
    <div className={`rounded-lg overflow-hidden ${
      isDark
        ? 'bg-amber-500/10 border-2 border-amber-500/50'
        : 'bg-amber-50 border-2 border-amber-300'
    }`}>
      {/* Header */}
      <div className={`p-4 ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
        <div className={`flex items-start gap-3 ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
          <span className="w-6 h-6 flex-shrink-0">{Icons.alertTriangle}</span>
          <div>
            <h4 className="font-bold text-lg">
              {isTrainingslager ? 'Trainingslager - Kostenpflichtig!' : 'Kostenpflichtiges Event'}
            </h4>
            <p className="text-sm mt-1 opacity-90">
              Bitte lies die Kosteninformationen sorgfältig durch
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Kosten-Info */}
        <div className={`space-y-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          {estimatedCost && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Geschätzte Kosten:</span>
              <span className={`text-xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                {estimatedCost.toLocaleString('de-DE')} EUR
              </span>
            </div>
          )}

          {costDescription && (
            <div>
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className={`flex items-center gap-2 text-sm font-medium ${
                  isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-700 hover:text-amber-600'
                }`}
              >
                <span className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`}>
                  {Icons.chevronRight}
                </span>
                Details anzeigen
              </button>

              {showDetails && (
                <div className={`mt-2 p-3 rounded-lg text-sm ${
                  isDark ? 'bg-navy-800/50' : 'bg-white'
                }`}>
                  {costDescription}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wichtiger Hinweis für Trainingslager */}
        {isTrainingslager && (
          <div className={`p-3 rounded-lg ${isDark ? 'bg-navy-800/50' : 'bg-white'}`}>
            <p className={`text-sm ${isDark ? 'text-cream/80' : 'text-light-muted'}`}>
              <strong>Wichtig:</strong> Die Kosten für Trainingslager (Unterkunft, Verpflegung, etc.)
              werden separat in Rechnung gestellt. Die genauen Kosten können je nach Teilnehmerzahl variieren.
            </p>
          </div>
        )}

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
                isDark
                  ? 'bg-navy-900 border-amber-400 text-amber-400 focus:ring-amber-400'
                  : 'border-amber-500 text-amber-500 focus:ring-amber-500'
              }`}
            />
            <span className={`text-sm ${isDark ? 'text-cream' : 'text-light-text'}`}>
              <strong>Ich habe die Kosteninformationen gelesen</strong> und bin mir bewusst,
              dass für dieses {isTrainingslager ? 'Trainingslager' : 'Event'} zusätzliche Kosten entstehen.
            </span>
          </label>
        )}
      </div>
    </div>
  );
}

export default CostWarning;
