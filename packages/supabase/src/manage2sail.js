/**
 * Manage2Sail Scraper Service
 *
 * Hybrid-Ansatz für zuverlässige Regatta-Suche:
 * 1. Primär: Direktes Scraping von manage2sail.com/search
 * 2. Fallback 1: Firecrawl für JavaScript-Rendering
 * 3. Fallback 2: Lokale Fuzzy-Suche über existierende Regatten
 *
 * Die manage2sail-Suche ist server-side gerendert und kann direkt gescrapt werden.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Gemini API für Detail-Extraktion (nicht für Suche!)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Firecrawl für JavaScript-Rendering als Fallback
const FIRECRAWL_URL = import.meta.env.VITE_FIRECRAWL_URL || 'https://scrape.aitema.de';

// manage2sail Base-URL
const MANAGE2SAIL_BASE = 'https://www.manage2sail.com';

const EXTRACTION_PROMPT = `Du bist ein Experte für Segel-Regatta-Ergebnisse.

AUFGABE: Finde die Ergebnisse dieser Regatta und extrahiere alle Daten.

KONTEXT: Die URL zeigt auf eine Manage2Sail Regatta-Seite. Suche im Internet nach:
- Dem Event-Namen aus der URL
- "manage2sail [event-name] Ergebnisse"
- Den offiziellen Regatta-Ergebnissen

EXTRAHIERE diese Informationen:
1. Regatta-Name (vollständig, z.B. "IDM ILCA 4/6/7 2024")
2. Datum (YYYY-MM-DD Format)
3. Austragungsort (z.B. "Steinhuder Meer", "Travemünder Woche")
4. Anzahl Teilnehmer
5. Anzahl Wettfahrten
6. Ergebnisliste mit: Platz, Segelnummer, Name, Club, Punkte

AUSGABE als JSON (NUR JSON, keine Erklärungen):
{
  "regattaName": "string",
  "regattaDate": "YYYY-MM-DD",
  "location": "string",
  "totalParticipants": number,
  "raceCount": number,
  "results": [
    {"placement": 1, "sailNumber": "GER 12345", "crew": "Max Mustermann", "club": "YC Berlin", "points": 5.0}
  ]
}

WICHTIG:
- Segelnummern im Format "NATION NUMMER" (z.B. "GER 12345")
- Wenn Daten nicht gefunden werden, nutze null
- Gib NUR das JSON zurück, KEINE Markdown-Formatierung`;

/**
 * Scrape a Manage2Sail results page using Gemini with Google Search
 * @param {string} url - The Manage2Sail URL
 * @returns {Promise<{regattaName: string, regattaDate: string, location: string, results: Array}>}
 */
export async function scrapeManage2Sail(url) {
  if (!url.includes('manage2sail.com')) {
    throw new Error('URL must be from manage2sail.com');
  }

  if (!GEMINI_API_KEY) {
    console.warn('VITE_GEMINI_API_KEY not set, falling back to Firecrawl');
    return scrapeManage2SailFirecrawl(url);
  }

  // Extract event ID for better search
  const eventIdMatch = url.match(/event\/([^\/#?]+)/);
  const eventId = eventIdMatch ? eventIdMatch[1] : '';

  // Create readable event name from ID (e.g., "a77bff8e-d7c3" -> search terms)
  const searchHint = eventId ? `Event-ID: ${eventId}` : '';

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: EXTRACTION_PROMPT },
            { text: `\nRegatta-URL: ${url}\n${searchHint}\n\nSuche nach den Ergebnissen dieser Regatta.` }
          ]
        }],
        // Enable Google Search grounding for live data
        tools: [{
          googleSearch: {}
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);

      // Try without Google Search if tool fails
      return await scrapeManage2SailWithoutSearch(url);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.warn('Gemini returned empty response, trying Firecrawl');
      return scrapeManage2SailFirecrawl(url);
    }

    // Clean and parse JSON response
    const cleanedText = cleanJsonResponse(text);
    const parsed = JSON.parse(cleanedText);

    // Add metadata
    parsed.manage2sailId = eventId || null;
    parsed.manage2sailUrl = url;
    if (!parsed.totalParticipants) {
      parsed.totalParticipants = parsed.results?.length || 0;
    }

    console.log('Successfully extracted Manage2Sail data:', parsed.regattaName);
    return parsed;

  } catch (error) {
    console.error('Gemini scraping failed:', error.message);
    console.log('Trying Firecrawl fallback...');
    return scrapeManage2SailFirecrawl(url);
  }
}

/**
 * Fallback: Try Gemini without Google Search tool
 */
async function scrapeManage2SailWithoutSearch(url) {
  const eventIdMatch = url.match(/event\/([^\/#?]+)/);
  const eventId = eventIdMatch ? eventIdMatch[1] : '';

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: EXTRACTION_PROMPT },
          { text: `Regatta-URL: ${url}\nEvent-ID: ${eventId}` }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192
      }
    })
  });

  if (!response.ok) {
    throw new Error('Gemini API failed');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Empty Gemini response');
  }

  const cleanedText = cleanJsonResponse(text);
  const parsed = JSON.parse(cleanedText);

  parsed.manage2sailId = eventId || null;
  parsed.manage2sailUrl = url;
  parsed.totalParticipants = parsed.results?.length || 0;

  return parsed;
}

/**
 * Clean JSON response from Gemini (remove markdown code blocks, etc.)
 */
function cleanJsonResponse(text) {
  let cleaned = text.trim();

  // Remove markdown code blocks
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  // Find JSON object boundaries
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.slice(startIdx, endIdx + 1);
  }

  return cleaned;
}

/**
 * Fallback: Scrape using Firecrawl with Puppeteer
 */
async function scrapeManage2SailFirecrawl(url) {
  // Use correct Firecrawl endpoint: /v1/scrape
  const baseUrl = FIRECRAWL_URL.replace(/\/+$/, ''); // Remove trailing slashes

  const response = await fetch(`${baseUrl}/v1/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'html'],
      waitFor: 5000, // Wait for SPA to render
      timeout: 30000,
      onlyMainContent: true
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Firecrawl error: ${error}`);
  }

  const data = await response.json();

  if (!data.success || !data.data?.markdown) {
    throw new Error('Firecrawl returned empty content - SPA may not have rendered');
  }

  // Parse the markdown content
  return parseRegattaResults(data.data.markdown, url);
}

/**
 * Parse regatta results from scraped Markdown content
 */
export function parseRegattaResults(content, url) {
  const eventIdMatch = url.match(/event\/([^\/#?]+)/);
  const eventId = eventIdMatch ? eventIdMatch[1] : null;

  // Parse regatta name from content
  const nameMatch = content.match(/# ([^\n]+)/);
  const regattaName = nameMatch ? nameMatch[1].trim() : `Regatta ${eventId}`;

  // Parse date
  const dateMatch = content.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/);
  let regattaDate = null;
  if (dateMatch) {
    regattaDate = new Date(
      parseInt(dateMatch[3]),
      parseInt(dateMatch[2]) - 1,
      parseInt(dateMatch[1])
    );
  }

  // Parse location
  const locationMatch = content.match(/(?:Location|Ort|Venue)[:\s]+([^\n|]+)/i);
  const location = locationMatch ? locationMatch[1].trim() : '';

  // Parse results table
  const results = [];
  const rowPattern = /\|\s*(\d+)\s*\|\s*([A-Z]{2,3}\s*\d+)\s*\|\s*([^|]+)\|\s*([^|]*)\|\s*([^|]*)/g;
  let match;

  while ((match = rowPattern.exec(content)) !== null) {
    results.push({
      placement: parseInt(match[1]),
      sailNumber: match[2].trim(),
      crew: match[3].trim(),
      club: match[4].trim(),
      points: parseFloat(match[5]) || 0
    });
  }

  return {
    regattaName,
    regattaDate,
    location,
    manage2sailId: eventId,
    manage2sailUrl: url,
    results,
    totalParticipants: results.length
  };
}

/**
 * Find a specific sailor's result in the parsed data
 */
export function findSailorResult(results, sailNumber) {
  const normalized = sailNumber.replace(/\s+/g, ' ').toUpperCase();
  return results.find(r =>
    r.sailNumber.replace(/\s+/g, ' ').toUpperCase() === normalized
  ) || null;
}

/**
 * Format result for database insert
 */
export function formatForDatabase(parsed, sailorResult, sailorId) {
  return {
    sailor_id: sailorId,
    season: parsed.regattaDate ? parsed.regattaDate.getFullYear().toString() : new Date().getFullYear().toString(),
    regatta_name: parsed.regattaName,
    regatta_date: parsed.regattaDate?.toISOString().split('T')[0] || null,
    regatta_location: parsed.location,
    placement: sailorResult?.placement || null,
    total_participants: parsed.totalParticipants,
    manage2sail_id: parsed.manage2sailId,
    status: 'pending'
  };
}

/**
 * ============================================================================
 * DIREKTE MANAGE2SAIL SUCHE (Primärer Ansatz)
 * ============================================================================
 */

/**
 * Sucht Regatten direkt auf manage2sail.com via HTML-Scraping
 * @param {string} query - Suchbegriff
 * @param {number} year - Jahr für Filter
 * @param {string} country - Ländercode (default: GER)
 * @returns {Promise<Array>} - Array von Regatta-Objekten
 */
async function searchManage2SailDirect(query, year, country = 'GER') {
  if (!query || query.length < 2) return [];

  // WICHTIG: manage2sail verwendet filterText, nicht q!
  const searchUrl = `${MANAGE2SAIL_BASE}/de-DE/search?filterYear=${year}&filterMonth=&filterCountry=${country}&filterRegion=&filterClass=&filterClubId=&filterScoring=&paged=true&filterText=${encodeURIComponent(query)}`;

  console.log('[manage2sail] Direkte Suche:', searchUrl);

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error('[manage2sail] HTTP Fehler:', response.status);
      return [];
    }

    const html = await response.text();
    return parseManage2SailSearchResults(html, year);

  } catch (error) {
    console.error('[manage2sail] Direkte Suche fehlgeschlagen:', error.message);
    return [];
  }
}

/**
 * Parst die HTML-Suchergebnisse von manage2sail
 * @param {string} html - HTML-Content
 * @param {number} year - Jahr für Filterung
 * @returns {Array} - Geparste Ergebnisse
 */
function parseManage2SailSearchResults(html, year) {
  const results = [];

  // Event-Links extrahieren: /en-US/event/UUID oder /en-US/event/slug
  // Format: <a href="/en-US/event/...">Event Name</a>
  const eventLinkRegex = /<a[^>]*href="(\/[a-z]{2}-[A-Z]{2}\/event\/[^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let match;

  while ((match = eventLinkRegex.exec(html)) !== null) {
    const eventPath = match[1];
    const eventName = match[2].trim();

    // Nur wenn kein Edit/Admin-Link und kein leerer Name
    if (eventName && !eventPath.includes('/edit') && !eventPath.includes('/admin')) {
      results.push({
        name: decodeHTMLEntities(eventName),
        url: `${MANAGE2SAIL_BASE}${eventPath}`,
        confidence: 'high',
        source: 'manage2sail-direct'
      });
    }
  }

  // Datumsangaben aus Tabelle extrahieren (optional, verbessert UX)
  // Format: <td>01.05.2024</td> oder <td>2024-05-01</td>
  const dateRegex = /(\d{2}\.\d{2}\.\d{4}|\d{4}-\d{2}-\d{2})/g;
  const locationRegex = /<td[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/td>/gi;

  // Deduplizieren basierend auf URL
  const seen = new Set();
  const uniqueResults = results.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  console.log(`[manage2sail] ${uniqueResults.length} Events gefunden`);
  return uniqueResults.slice(0, 20); // Max 20 Ergebnisse
}

/**
 * Sucht via Firecrawl mit JavaScript-Rendering
 */
async function searchManage2SailFirecrawl(query, year, country = 'GER') {
  // WICHTIG: manage2sail verwendet filterText, nicht q!
  const countryParam = country || '';
  const searchUrl = `${MANAGE2SAIL_BASE}/de-DE/search?filterYear=${year}&filterMonth=&filterCountry=${countryParam}&filterRegion=&filterClass=&filterClubId=&filterScoring=&paged=true&filterText=${encodeURIComponent(query)}`;

  console.log('[manage2sail] Firecrawl:', searchUrl);

  try {
    const response = await fetch(`${FIRECRAWL_URL}/v1/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['rawHtml'],  // WICHTIG: rawHtml statt html!
        waitFor: 3000,
        timeout: 15000
      })
    });

    if (!response.ok) {
      console.error('[manage2sail] Firecrawl HTTP Fehler:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.success) {
      console.error('[manage2sail] Firecrawl API Fehler:', data.error || data.details);
      return [];
    }

    const html = data.data?.rawHtml;
    if (!html) {
      console.warn('[manage2sail] Firecrawl: Kein HTML erhalten');
      return [];
    }

    return parseManage2SailSearchResults(html, year);

  } catch (error) {
    console.error('[manage2sail] Firecrawl Exception:', error.message);
    return [];
  }
}

/**
 * Sucht via öffentlichen CORS-Proxy (letzter Fallback)
 */
async function searchManage2SailCorsProxy(query, year, country = 'GER') {
  // WICHTIG: manage2sail verwendet filterText, nicht q!
  const countryParam = country || '';
  const searchUrl = `${MANAGE2SAIL_BASE}/de-DE/search?filterYear=${year}&filterMonth=&filterCountry=${countryParam}&filterRegion=&filterClass=&filterClubId=&filterScoring=&paged=true&filterText=${encodeURIComponent(query)}`;

  // Öffentliche CORS-Proxies (Fallback, wenn Firecrawl nicht läuft)
  const corsProxies = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url='
  ];

  for (const proxy of corsProxies) {
    try {
      console.log('[manage2sail] CORS-Proxy:', proxy);

      const response = await fetch(proxy + encodeURIComponent(searchUrl), {
        headers: { 'Accept': 'text/html' }
      });

      if (!response.ok) continue;

      const html = await response.text();
      const results = parseManage2SailSearchResults(html, year);

      if (results.length > 0) return results;

    } catch (error) {
      console.warn('[manage2sail] CORS-Proxy fehlgeschlagen:', error.message);
    }
  }

  return [];
}

/**
 * HTML-Entities dekodieren (benannte UND numerische)
 */
function decodeHTMLEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&auml;': 'ä',
    '&ouml;': 'ö',
    '&uuml;': 'ü',
    '&Auml;': 'Ä',
    '&Ouml;': 'Ö',
    '&Uuml;': 'Ü',
    '&szlig;': 'ß'
  };

  // Erst benannte Entities ersetzen
  let result = text.replace(/&[a-zA-Z]+;/g, match => entities[match] || match);

  // Dann numerische Entities ersetzen (&#252; → ü)
  result = result.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));

  // Auch hex-Entities (&#x00FC; → ü)
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

  return result;
}

const EXTRACT_DETAILS_PROMPT = `Du bist ein Experte für Segel-Regatta-Ergebnisse.

AUFGABE: Extrahiere ALLE verfügbaren Daten von dieser Regatta-Seite.

REGATTA-URL: {url}
SEGELNUMMER DES NUTZERS: {sailNumber}

FINDE auf manage2sail.com:
1. Vollständiger Regatta-Name
2. Datum (im Format YYYY-MM-DD)
3. Austragungsort
4. Bootsklasse(n)
5. Anzahl Teilnehmer in der relevanten Klasse
6. Anzahl Wettfahrten
7. Platzierung des Seglers mit Segelnummer "{sailNumber}"

WICHTIG:
- Suche nach der Segelnummer in den Ergebnislisten
- Die Segelnummer kann Varianten haben: "GER 12345", "GER12345", "12345"
- Falls mehrere Klassen existieren, wähle die passende zur Segelnummer

AUSGABE als JSON (NUR JSON, keine Markdown):
{
  "regattaName": "string",
  "date": "YYYY-MM-DD",
  "location": "string",
  "boatClass": "string oder null",
  "totalParticipants": number oder null,
  "raceCount": number oder null,
  "sailorResult": {
    "found": true/false,
    "placement": number oder null,
    "points": number oder null,
    "sailNumber": "gefundene Segelnummer",
    "name": "Name des Seglers"
  }
}`;

/**
 * Generiert Suchvarianten aus dem Eingabetext
 * "rahnsdorfer opti" → ["rahnsdorfer opti", "rahnsdorfer", "opti", "optipokal"]
 */
function generateSearchVariants(query) {
  const variants = new Set();
  const normalized = query.trim().toLowerCase();

  // Original-Query
  variants.add(normalized);

  // Einzelne Wörter (mindestens 4 Zeichen)
  const words = normalized.split(/\s+/).filter(w => w.length >= 4);
  words.forEach(w => variants.add(w));

  // Häufige Abkürzungen expandieren
  const expansions = {
    'opti': ['optipokal', 'optimist'],
    'ilca': ['ilca 4', 'ilca 6', 'ilca 7'],
    'idm': ['deutsche meisterschaft'],
    'djm': ['jugendmeisterschaft'],
    'ldm': ['landesmeisterschaft'],
  };

  words.forEach(w => {
    if (expansions[w]) {
      expansions[w].forEach(exp => variants.add(exp));
    }
  });

  // Umlaute normalisieren
  const umlautMap = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
  const withoutUmlauts = normalized.replace(/[äöüß]/g, c => umlautMap[c]);
  if (withoutUmlauts !== normalized) {
    variants.add(withoutUmlauts);
  }

  return Array.from(variants).slice(0, 5); // Max 5 Varianten
}

/**
 * Berechnet Ähnlichkeit zwischen zwei Strings (0-1)
 */
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Exakter Match
  if (s1 === s2) return 1;

  // Enthält den Suchbegriff
  if (s2.includes(s1) || s1.includes(s2)) return 0.9;

  // Wort-basierte Übereinstimmung
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);

  let matchCount = 0;
  words1.forEach(w1 => {
    if (words2.some(w2 => w2.includes(w1) || w1.includes(w2))) {
      matchCount++;
    }
  });

  return matchCount / Math.max(words1.length, 1);
}

/**
 * Filtert und rankt Ergebnisse nach Ähnlichkeit zum Suchbegriff
 */
function rankResultsByRelevance(results, originalQuery) {
  return results
    .map(r => ({
      ...r,
      similarity: calculateSimilarity(originalQuery, r.name),
      confidence: calculateSimilarity(originalQuery, r.name) > 0.5 ? 'high' :
                  calculateSimilarity(originalQuery, r.name) > 0.2 ? 'medium' : 'low'
    }))
    .sort((a, b) => b.similarity - a.similarity);
}

/**
 * Sucht Regatten auf manage2sail.com (Enhanced mit Multi-Search + Ranking)
 *
 * Verbesserungen:
 * 1. Mehrfach-Suche mit Suchbegriff-Varianten
 * 2. Fuzzy-Ranking der Ergebnisse nach Ähnlichkeit
 * 3. Deduplizierung
 *
 * @param {string} query - Suchbegriff (Regatta-Name)
 * @param {number} year - Jahr für Filter
 * @param {string} country - Ländercode (default: GER)
 * @returns {Promise<Array<{name, url, date, location, confidence, source, similarity}>>}
 */
export async function searchManage2SailRegattas(query, year, country = 'GER') {
  if (!query || query.length < 2) {
    return [];
  }

  const originalQuery = query.trim();
  const variants = generateSearchVariants(originalQuery);

  console.log(`[manage2sail] Suche: "${originalQuery}" → Varianten:`, variants);

  // Alle Varianten parallel suchen
  const allResults = [];
  const seenUrls = new Set();

  for (const variant of variants) {
    // Firecrawl-Suche
    let results = await searchManage2SailFirecrawl(variant, year, country);

    // Fallback: ohne Länderfilter
    if (results.length === 0) {
      results = await searchManage2SailFirecrawl(variant, year, '');
    }

    // Fallback: CORS-Proxy
    if (results.length === 0) {
      results = await searchManage2SailCorsProxy(variant, year, country);
    }

    // Deduplizieren
    results.forEach(r => {
      if (!seenUrls.has(r.url)) {
        seenUrls.add(r.url);
        allResults.push(r);
      }
    });

    // Frühzeitiger Abbruch wenn genug Ergebnisse
    if (allResults.length >= 20) break;
  }

  if (allResults.length === 0) {
    console.log('[manage2sail] Keine Ergebnisse gefunden');
    return [];
  }

  // Nach Relevanz ranken
  const ranked = rankResultsByRelevance(allResults, originalQuery);

  console.log(`[manage2sail] ${ranked.length} Ergebnisse gefunden, Top-Match: "${ranked[0]?.name}" (${(ranked[0]?.similarity * 100).toFixed(0)}%)`);

  return ranked.slice(0, 15); // Max 15 Ergebnisse
}

/**
 * Extrahiert detaillierte Regatta-Informationen inkl. Segler-Platzierung
 * @param {string} url - manage2sail Event-URL
 * @param {string} sailNumber - Segelnummer des Nutzers
 * @returns {Promise<{regattaName, date, location, totalParticipants, raceCount, sailorResult}>}
 */
export async function extractRegattaDetails(url, sailNumber) {
  if (!url || !url.includes('manage2sail.com')) {
    throw new Error('Ungültige manage2sail URL');
  }

  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY nicht konfiguriert');
  }

  const prompt = EXTRACT_DETAILS_PROMPT
    .replace('{url}', url)
    .replace(/{sailNumber}/g, sailNumber || 'NICHT ANGEGEBEN');

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        tools: [{
          googleSearch: {}
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini extraction failed:', errorText);
      throw new Error('Gemini API Fehler');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Leere Antwort von Gemini');
    }

    const cleaned = cleanJsonResponse(text);
    const result = JSON.parse(cleaned);

    return {
      regattaName: result.regattaName || null,
      date: result.date || null,
      location: result.location || null,
      boatClass: result.boatClass || null,
      totalParticipants: result.totalParticipants || null,
      raceCount: result.raceCount || null,
      sailorResult: result.sailorResult || { found: false },
      manage2sailUrl: url
    };

  } catch (error) {
    console.error('Detail extraction error:', error);
    throw error;
  }
}

export default {
  scrapeManage2Sail,
  parseRegattaResults,
  findSailorResult,
  formatForDatabase,
  searchManage2SailRegattas,
  extractRegattaDetails
};
