/**
 * Fuzzy Search Utility für Regatta-Suche
 * Nutzt Fuse.js für fehlertolerante Suche
 */
import Fuse from 'fuse.js';

/**
 * Erstellt einen Fuse.js Searcher für Regatten
 * @param {Array} regattas - Array von Regatta-Objekten
 * @returns {Fuse} Fuse.js Instanz
 */
export function createRegattaSearcher(regattas) {
  return new Fuse(regattas, {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'regattaName', weight: 0.7 },
      { name: 'location', weight: 0.3 },
    ],
    threshold: 0.4, // 40% Unähnlichkeit erlaubt
    distance: 100,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
  });
}

/**
 * Führt Fuzzy-Suche durch und gibt formatierte Ergebnisse zurück
 * @param {string} query - Suchbegriff
 * @param {Array} regattas - Array von Regatta-Objekten
 * @returns {Array} Sortierte Ergebnisse mit Confidence-Score
 */
export function fuzzySearchRegattas(query, regattas) {
  if (!query || query.length < 2 || !regattas?.length) {
    return [];
  }

  const fuse = createRegattaSearcher(regattas);
  const results = fuse.search(query);

  return results.map(result => ({
    ...result.item,
    fuzzyScore: result.score,
    confidence: getConfidenceLevel(result.score),
    source: 'local',
  })).slice(0, 5); // Max 5 lokale Ergebnisse
}

/**
 * Wandelt Fuse.js Score in Confidence-Level um
 * @param {number} score - Fuse.js Score (0 = perfekt, 1 = keine Übereinstimmung)
 * @returns {string} 'high' | 'medium' | 'low'
 */
function getConfidenceLevel(score) {
  if (score < 0.2) return 'high';
  if (score < 0.4) return 'medium';
  return 'low';
}

/**
 * Normalisiert einen Regatta-Namen für besseren Vergleich
 * @param {string} name - Regatta-Name
 * @returns {string} Normalisierter Name
 */
export function normalizeRegattaName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Prüft ob zwei Namen ähnlich sind (für Deduplizierung)
 * @param {string} name1
 * @param {string} name2
 * @returns {boolean}
 */
export function areNamesSimilar(name1, name2) {
  const n1 = normalizeRegattaName(name1);
  const n2 = normalizeRegattaName(name2);

  // Exakte Übereinstimmung nach Normalisierung
  if (n1 === n2) return true;

  // Einer ist Substring des anderen
  if (n1.includes(n2) || n2.includes(n1)) return true;

  // Levenshtein-ähnliche Prüfung via Fuse.js
  const fuse = new Fuse([{ name: n1 }], { keys: ['name'], threshold: 0.3 });
  const result = fuse.search(n2);

  return result.length > 0;
}

/**
 * Entfernt Duplikate aus kombinierten Suchergebnissen
 * @param {Array} results - Kombinierte Ergebnisse aus lokal + Gemini
 * @returns {Array} Deduplizierte Ergebnisse
 */
export function deduplicateResults(results) {
  const seen = new Set();
  const unique = [];

  for (const result of results) {
    const normalized = normalizeRegattaName(result.name || result.regattaName);

    // Prüfe ob ähnlicher Name bereits vorhanden
    let isDuplicate = false;
    for (const seenName of seen) {
      if (areNamesSimilar(normalized, seenName)) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.add(normalized);
      unique.push(result);
    }
  }

  return unique;
}

export default {
  createRegattaSearcher,
  fuzzySearchRegattas,
  normalizeRegattaName,
  areNamesSimilar,
  deduplicateResults,
};
