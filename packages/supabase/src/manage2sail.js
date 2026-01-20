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

/**
 * ============================================================================
 * DIREKTES EVENT-SCRAPING (Alternative zu Gemini)
 * Findet automatisch die richtige Bootsklasse anhand der Segelnummer
 * ============================================================================
 */

/**
 * Normalisiert Segelnummer für Vergleich
 * "GER 12345" → "ger12345", "GER12345" → "ger12345"
 */
function normalizeSailNumber(sailNumber) {
  if (!sailNumber) return '';
  return sailNumber.toLowerCase().replace(/[\s\-]+/g, '');
}

/**
 * Lädt eine Event-Seite via Firecrawl mit verbesserter SPA-Unterstützung
 *
 * WICHTIG: manage2sail ist eine Angular-SPA
 * - Hash-Routen (#!/results) werden client-seitig gehandhabt
 * - Firecrawl muss lange genug warten für vollständiges Rendering
 * - Wir entfernen den Hash-Teil aus der URL für Firecrawl
 */
async function scrapeEventPage(url, options = {}) {
  const baseUrl = FIRECRAWL_URL.replace(/\/+$/, '');

  // Entferne Hash-Teil aus URL (Firecrawl kann das nicht verarbeiten)
  const cleanUrl = url.split('#')[0];

  const waitTime = options.waitFor || 8000; // Längere Wartezeit für SPA

  console.log('[manage2sail] Scraping Event-Seite:', cleanUrl, '(wait:', waitTime, 'ms)');

  try {
    const response = await fetch(`${baseUrl}/v1/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: cleanUrl,
        formats: ['rawHtml'],  // WICHTIG: Nur rawHtml, nicht 'html'!
        waitFor: waitTime,
        timeout: 45000
        // KEINE actions - wird von Firecrawl nicht unterstützt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[manage2sail] Firecrawl response:', errorText.substring(0, 200));
      throw new Error(`Firecrawl HTTP ${response.status}`);
    }

    const data = await response.json();
    const html = data.data?.rawHtml || '';

    if (!data.success || !html || html.length < 500) {
      console.warn('[manage2sail] Firecrawl returned empty/short HTML:', html.length, 'chars');
      throw new Error('Firecrawl returned empty HTML - SPA not rendered');
    }

    console.log('[manage2sail] Firecrawl erfolgreich:', html.length, 'chars');
    return html;
  } catch (error) {
    console.error('[manage2sail] scrapeEventPage Fehler:', error.message);
    throw error;
  }
}

/**
 * Extrahiert Metadaten (Name, Datum) aus Event-HTML
 */
function parseEventMetadata(html) {
  let regattaName = null;
  let date = null;

  // Name aus <title> - manage2sail Format: "Regattaname manage2sail"
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    let title = decodeHTMLEntities(titleMatch[1]);
    // Entferne " manage2sail" Suffix
    title = title.replace(/\s*manage2sail\s*$/i, '').trim();
    // Entferne " - manage2sail" Format
    title = title.split(' - ')[0].trim();
    if (title && title.length > 3) {
      regattaName = title;
    }
  }

  // Datum (DD.MM.YYYY - DD.MM.YYYY oder einzeln)
  // Suche nach Datumsbereich zuerst
  const dateRangeMatch = html.match(/(\d{2})\.(\d{2})\.(\d{4})\s*[-–]\s*(\d{2})\.(\d{2})\.(\d{4})/);
  if (dateRangeMatch) {
    // Nehme das Startdatum
    date = `${dateRangeMatch[3]}-${dateRangeMatch[2]}-${dateRangeMatch[1]}`;
  } else {
    // Einzelnes Datum
    const dateMatch = html.match(/(\d{2})\.(\d{2})\.(\d{4})/) || html.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      if (dateMatch[0].includes('.')) {
        date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
      } else {
        date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      }
    }
  }

  return { regattaName, date };
}

/**
 * Versucht eingebettete Klassenliste aus Angular-App zu extrahieren
 * manage2sail speichert manchmal Klassen-IDs in data-Attributen oder JavaScript-Objekten
 */
function extractEmbeddedClassData(html) {
  const classes = [];

  // Methode 1: Suche nach class/regatta IDs in URLs
  // Format: classId=UUID oder regattaId=UUID
  const classIdRegex = /classId[=:][\s"']*([a-f0-9-]{36})/gi;
  let match;
  const seenIds = new Set();

  while ((match = classIdRegex.exec(html)) !== null) {
    const classId = match[1];
    if (!seenIds.has(classId)) {
      seenIds.add(classId);
      classes.push({ id: classId, name: null });
    }
  }

  // Methode 2: Suche nach Klassennamen in der Nähe von select/option Elementen
  const optionRegex = /<option[^>]*value="(\d+)"[^>]*>([^<]+)<\/option>/gi;
  while ((match = optionRegex.exec(html)) !== null) {
    const name = decodeHTMLEntities(match[2].trim());
    // Typische Klassennamen: Optimist A, ILCA 4, 29er, etc.
    if (name && /\b(Optimist|ILCA|Laser|29er|420|470|Europe|Finn|OK-Jolle)\b/i.test(name)) {
      classes.push({ id: match[1], name });
    }
  }

  // Methode 3: Suche nach JSON-artigen Strukturen mit Regatta-Daten
  const jsonMatch = html.match(/\{"classes":\s*\[(.*?)\]/);
  if (jsonMatch) {
    try {
      const classArray = JSON.parse(`[${jsonMatch[1]}]`);
      classArray.forEach(c => {
        if (c.id && c.name) {
          classes.push({ id: c.id, name: c.name });
        }
      });
    } catch (e) {
      // JSON-Parsing fehlgeschlagen, ignorieren
    }
  }

  return classes;
}

/**
 * Findet alle Bootsklassen-Links auf der Event-Seite
 */
function findClassResultsLinks(html, baseUrl) {
  const classes = [];
  const seenUrls = new Set();

  // Pattern: Links zu /results/ mit Klassennamen
  const resultsLinkRegex = /<a[^>]*href="([^"]*\/results\/[^"]*)"[^>]*>([^<]+)<\/a>/gi;
  let match;

  while ((match = resultsLinkRegex.exec(html)) !== null) {
    const href = match[1];
    const name = decodeHTMLEntities(match[2].trim());

    if (!name || name.length < 2 || seenUrls.has(href)) continue;
    if (name.toLowerCase().includes('all') || name.toLowerCase().includes('overall')) continue;

    seenUrls.add(href);

    let resultsUrl = href;
    if (href.startsWith('/')) {
      resultsUrl = `${MANAGE2SAIL_BASE}${href}`;
    }

    classes.push({ name, resultsUrl });
  }

  console.log('[manage2sail] Gefundene Klassen:', classes.map(c => c.name));
  return classes;
}

/**
 * Parst Ergebnistabelle und sucht nach Segelnummer
 */
function parseResultsAndFindSailor(html, sailNumber) {
  const normalizedSearch = normalizeSailNumber(sailNumber);
  const numberOnly = normalizedSearch.replace(/[a-z]/g, '');

  let raceCount = 0;
  const results = [];

  // Wettfahrten zählen (R1, R2, R3...)
  const raceMatches = html.match(/\bR(\d+)\b/gi) || [];
  raceMatches.forEach(r => {
    const num = parseInt(r.replace(/\D/g, ''));
    if (num > raceCount && num < 20) raceCount = num;
  });

  // Ergebniszeilen parsen (HTML-Tabellen)
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowContent = trMatch[1];
    const cells = [];
    let tdMatch;

    while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
      const cellText = tdMatch[1].replace(/<[^>]+>/g, '').trim();
      cells.push(decodeHTMLEntities(cellText));
    }
    tdRegex.lastIndex = 0;

    if (cells.length >= 3) {
      const placement = parseInt(cells[0]);
      const sailNumRegex = /([A-Z]{2,3})[\s\-]?(\d{2,6})/i;

      let foundSailNumber = null;
      let name = null;

      for (let i = 1; i < Math.min(cells.length, 5); i++) {
        const sailMatch = cells[i].match(sailNumRegex);
        if (sailMatch && !foundSailNumber) {
          foundSailNumber = `${sailMatch[1].toUpperCase()} ${sailMatch[2]}`;
        } else if (cells[i] && cells[i].length > 2 && !name && !cells[i].match(/^\d+$/)) {
          name = cells[i];
        }
      }

      if (!isNaN(placement) && placement > 0 && placement < 500 && foundSailNumber) {
        results.push({ placement, sailNumber: foundSailNumber, name: name || '' });
      }
    }
  }

  // Segler suchen
  let sailorResult = null;
  for (const result of results) {
    const normalizedResult = normalizeSailNumber(result.sailNumber);
    const resultNumberOnly = normalizedResult.replace(/[a-z]/g, '');

    if (normalizedResult === normalizedSearch ||
        (numberOnly && resultNumberOnly === numberOnly)) {
      sailorResult = result;
      break;
    }
  }

  return {
    raceCount,
    totalParticipants: results.length,
    sailorResult
  };
}

/**
 * Sucht nach Segelnummer im HTML und extrahiert Platzierung
 *
 * Robuster Ansatz:
 * 1. Suche die Segelnummer im HTML (verschiedene Formate)
 * 2. Analysiere den Kontext vor/nach der Segelnummer
 * 3. Die Platzierung steht typischerweise VOR der Segelnummer in der gleichen Zeile
 */
function searchSailNumberInText(html, sailNumber) {
  const normalizedSearch = normalizeSailNumber(sailNumber);
  const numberOnly = normalizedSearch.replace(/[a-z]/g, '');

  if (!numberOnly || numberOnly.length < 3) return null;

  console.log('[manage2sail] Suche Segelnummer:', sailNumber, '→', numberOnly);

  // Verschiedene Varianten der Segelnummer suchen
  // GER 13162, GER13162, GER&nbsp;13162, etc.
  const sailNumPatterns = [
    `GER\\s*${numberOnly}`,           // GER 13162 oder GER13162
    `GER[\\s\\u00A0]+${numberOnly}`,  // GER&nbsp;13162
    `>\\s*${numberOnly}\\s*<`,        // >13162< (nur Nummer in einer Zelle)
  ];

  let foundContext = null;
  let matchedPattern = null;

  for (const pattern of sailNumPatterns) {
    // Suche mit Kontext: 300 Zeichen vor und 200 nach der Segelnummer
    const contextRegex = new RegExp(`.{0,300}${pattern}.{0,200}`, 'gi');
    const match = contextRegex.exec(html);
    if (match) {
      foundContext = match[0];
      matchedPattern = pattern;
      console.log('[manage2sail] Gefunden mit Pattern:', pattern);
      break;
    }
  }

  if (!foundContext) {
    console.log('[manage2sail] Segelnummer nicht gefunden');
    return null;
  }

  console.log('[manage2sail] Kontext gefunden:', foundContext.substring(0, 150).replace(/\s+/g, ' ') + '...');

  // Extrahiere alle HTML-Tags für Struktur-Analyse
  // Suche nach dem Pattern: >PLATZIERUNG<...>SEGELNUMMER<...>NAME<

  let placement = null;
  let name = null;

  // Methode 1: Suche nach >ZAHL< Pattern VOR der Segelnummer
  // Die Platzierung ist die letzte alleinstehende Zahl vor der Segelnummer
  const beforeSailNum = foundContext.split(new RegExp(`GER[\\s\\u00A0]*${numberOnly}`, 'i'))[0] || '';

  // Alle Zahlen in Tabellenzellen vor der Segelnummer finden
  const cellNumbers = [...beforeSailNum.matchAll(/>[\s]*(\d{1,3})[\s\.]*</g)];
  if (cellNumbers.length > 0) {
    // Die letzte Zahl vor der Segelnummer ist typischerweise die Platzierung
    const lastNum = parseInt(cellNumbers[cellNumbers.length - 1][1]);
    if (lastNum > 0 && lastNum < 500) {
      placement = lastNum;
      console.log('[manage2sail] Platzierung aus Zelle gefunden:', placement);
    }
  }

  // Methode 2: Suche nach "Nr." oder Rang-Spalte
  if (!placement) {
    const rankMatch = beforeSailNum.match(/(?:Nr\.?|Rang|Pos\.?|#)[\s:]*(\d{1,3})/i);
    if (rankMatch) {
      placement = parseInt(rankMatch[1]);
      console.log('[manage2sail] Platzierung aus Label gefunden:', placement);
    }
  }

  // Methode 3: Erste Zahl in der Zeile (oft die Platzierung)
  if (!placement) {
    // Suche nach dem letzten <tr> vor der Segelnummer und extrahiere die erste Zahl
    const trStart = beforeSailNum.lastIndexOf('<tr');
    if (trStart !== -1) {
      const rowContent = beforeSailNum.substring(trStart);
      const firstNumMatch = rowContent.match(/<td[^>]*>[\s]*(\d{1,3})[\s\.]*<\/td>/i);
      if (firstNumMatch) {
        placement = parseInt(firstNumMatch[1]);
        console.log('[manage2sail] Platzierung aus erster Zelle gefunden:', placement);
      }
    }
  }

  // Name extrahieren: Nach der Segelnummer suchen
  const afterSailNum = foundContext.split(new RegExp(`GER[\\s\\u00A0]*${numberOnly}`, 'i'))[1] || '';

  // Suche nach Namen-Pattern in Tabellenzellen
  // Typisch: <td>SCHUMANN</td> oder <td>Moritz SCHUMANN</td>
  const nameMatch = afterSailNum.match(/>[\s]*([A-ZÄÖÜ][a-zäöüß]*[\s]+[A-ZÄÖÜ]{2,}|[A-ZÄÖÜ]{2,}[\s,]+[A-ZÄÖÜ][a-zäöüß]*)[\s]*</);
  if (nameMatch) {
    name = decodeHTMLEntities(nameMatch[1].trim());
    console.log('[manage2sail] Name gefunden:', name);
  } else {
    // Versuche einzelnen Nachnamen zu finden
    const surnameMatch = afterSailNum.match(/>[\s]*([A-ZÄÖÜ]{2,}[a-zäöüß]*)[\s]*</);
    if (surnameMatch && surnameMatch[1].length > 2) {
      name = decodeHTMLEntities(surnameMatch[1]);
    }
  }

  // Teilnehmerzahl: Zähle alle Zeilen mit Platzierungen in der gleichen Tabelle
  let totalParticipants = null;

  // Finde die Tabelle, die die Segelnummer enthält
  const tableStartIdx = html.lastIndexOf('<table', html.indexOf(numberOnly));
  const tableEndIdx = html.indexOf('</table>', html.indexOf(numberOnly));

  if (tableStartIdx !== -1 && tableEndIdx !== -1) {
    const tableContent = html.substring(tableStartIdx, tableEndIdx);
    // Zähle alle Zeilen mit einer Platzierung (Zahl in erster Spalte)
    const dataRows = tableContent.match(/<tr[^>]*>[\s\S]*?<td[^>]*>[\s]*\d{1,3}[\s\.]*<\/td>/gi);
    if (dataRows) {
      totalParticipants = dataRows.length;
      console.log('[manage2sail] Teilnehmer gezählt:', totalParticipants);
    }
  }

  // Ergebnis validieren
  if (placement && (placement < 1 || placement > 500)) {
    console.log('[manage2sail] Ungültige Platzierung ignoriert:', placement);
    placement = null;
  }

  console.log('[manage2sail] Finales Ergebnis - Platz:', placement, ', Name:', name, ', Teilnehmer:', totalParticipants);

  return {
    found: true,
    sailNumber: `GER ${numberOnly}`,
    placement: placement,
    name: name,
    totalParticipants: totalParticipants
  };
}

/**
 * Extrahiert Event-Details und findet automatisch die richtige Bootsklasse
 * anhand der Segelnummer
 *
 * HYBRID-ANSATZ:
 * 1. Firecrawl für Metadaten (Name, Datum) - funktioniert zuverlässig
 * 2. Textsuche nach Segelnummer im HTML
 * 3. Parsing von Tabellen wenn vorhanden
 * 4. Fallback: Gemini für fehlende Daten
 */
export async function extractEventDetails(url, sailNumber) {
  if (!url || !url.includes('manage2sail.com')) {
    throw new Error('Ungültige manage2sail URL');
  }

  console.log('[manage2sail] extractEventDetails:', url, 'Segelnummer:', sailNumber);

  let metadata = { regattaName: null, date: null };
  let sailorResult = { found: false };
  let raceCount = null;
  let totalParticipants = null;
  let boatClass = null;

  try {
    // 1. Event-Seite laden (mit längerer Wartezeit für SPA)
    const html = await scrapeEventPage(url, { waitFor: 10000 });
    metadata = parseEventMetadata(html);

    console.log('[manage2sail] Metadata extrahiert:', metadata);

    // 2. Schnelle Textsuche nach Segelnummer
    const textSearchResult = searchSailNumberInText(html, sailNumber);
    if (textSearchResult?.found) {
      console.log('[manage2sail] Segelnummer per Textsuche gefunden:', textSearchResult);
      sailorResult = textSearchResult;
      // Nutze Teilnehmerzahl aus der Textsuche wenn verfügbar
      if (textSearchResult.totalParticipants) {
        totalParticipants = textSearchResult.totalParticipants;
      }
    }

    // 3. Versuche eingebettete Klassendaten zu extrahieren
    const embeddedClasses = extractEmbeddedClassData(html);
    if (embeddedClasses.length > 0) {
      console.log('[manage2sail] Eingebettete Klassen gefunden:', embeddedClasses.length);
    }

    // 4. Alle Bootsklassen-Links finden und durchsuchen
    const classLinks = findClassResultsLinks(html, url);

    if (classLinks.length === 0) {
      // Keine Klassen-Links, versuche direkt auf der Seite
      console.log('[manage2sail] Keine Klassen-Links, parse Hauptseite');
      const parsed = parseResultsAndFindSailor(html, sailNumber);

      if (parsed.sailorResult) {
        sailorResult = {
          found: true,
          placement: parsed.sailorResult.placement,
          name: parsed.sailorResult.name,
          sailNumber: parsed.sailorResult.sailNumber
        };
      }
      raceCount = parsed.raceCount || null;
      totalParticipants = parsed.totalParticipants || null;

    } else {
      // Durchsuche jede Klasse
      for (const classInfo of classLinks) {
        console.log('[manage2sail] Durchsuche Klasse:', classInfo.name);

        try {
          const classHtml = await scrapeEventPage(classInfo.resultsUrl, { waitFor: 8000 });

          // Erst Textsuche
          const classTextResult = searchSailNumberInText(classHtml, sailNumber);
          if (classTextResult?.found) {
            console.log('[manage2sail] Segelnummer per Textsuche in Klasse gefunden:', classInfo.name);
            sailorResult = classTextResult;
            boatClass = classInfo.name;

            // Versuche noch Tabellen zu parsen für bessere Daten
            const parsed = parseResultsAndFindSailor(classHtml, sailNumber);
            if (parsed.sailorResult) {
              sailorResult = {
                found: true,
                placement: parsed.sailorResult.placement,
                name: parsed.sailorResult.name,
                sailNumber: parsed.sailorResult.sailNumber
              };
            }
            raceCount = parsed.raceCount || raceCount;
            totalParticipants = parsed.totalParticipants || totalParticipants;
            break;
          }

          // Dann Tabellen-Parsing
          const parsed = parseResultsAndFindSailor(classHtml, sailNumber);
          if (parsed.sailorResult) {
            console.log('[manage2sail] Segelnummer per Tabelle gefunden in:', classInfo.name);
            sailorResult = {
              found: true,
              placement: parsed.sailorResult.placement,
              name: parsed.sailorResult.name,
              sailNumber: parsed.sailorResult.sailNumber
            };
            boatClass = classInfo.name;
            raceCount = parsed.raceCount || null;
            totalParticipants = parsed.totalParticipants || null;
            break;
          }
        } catch (err) {
          console.warn('[manage2sail] Fehler bei Klasse', classInfo.name, ':', err.message);
        }
      }
    }

    // 5. Ergebnis zusammenstellen
    return {
      ...metadata,
      boatClass,
      raceCount,
      totalParticipants,
      sailorResult,
      manage2sailUrl: url
    };

  } catch (error) {
    console.error('[manage2sail] extractEventDetails Fehler:', error.message);

    // Auch bei Fehler: Gib zumindest die Metadaten zurück, die wir haben
    return {
      ...metadata,
      boatClass: null,
      raceCount: null,
      totalParticipants: null,
      sailorResult: { found: false },
      manage2sailUrl: url,
      error: error.message
    };
  }
}

const EXTRACT_DETAILS_PROMPT = `Suche im Internet nach den Ergebnissen dieser Segelregatta:

Regatta-URL: {url}
Segelnummer zum Suchen: {sailNumber}

AUFGABEN:
1. Finde die Ergebnisliste dieser Regatta auf manage2sail.com
2. Suche die Segelnummer {sailNumber} (auch als GER{sailNumber} oder GER {sailNumber})
3. Extrahiere: Teilnehmerzahl, Anzahl Wettfahrten, Platzierung

Gib das Ergebnis als JSON zurück:
{"regattaName":"Regattaname","date":"2025-05-24","totalParticipants":45,"raceCount":6,"sailorResult":{"found":true,"placement":2,"name":"Max Mustermann","sailNumber":"GER 13162"}}

Falls die Segelnummer nicht gefunden wird:
{"regattaName":"Regattaname","date":"2025-05-24","totalParticipants":45,"raceCount":6,"sailorResult":{"found":false}}

WICHTIG: Antworte NUR mit dem JSON-Objekt.`;

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
          maxOutputTokens: 4096
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

    console.log('[manage2sail] Gemini raw response:', text.substring(0, 200));

    const cleaned = cleanJsonResponse(text);

    // Prüfe ob gültiges JSON extrahiert werden konnte
    if (!cleaned || !cleaned.startsWith('{')) {
      console.error('[manage2sail] Kein JSON in Gemini-Antwort gefunden:', text.substring(0, 100));
      throw new Error('Gemini hat kein JSON zurückgegeben');
    }

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[manage2sail] JSON Parse Error:', parseErr.message, 'Cleaned:', cleaned.substring(0, 100));
      throw new Error('Ungültiges JSON von Gemini');
    }

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
  extractRegattaDetails,
  extractEventDetails
};
