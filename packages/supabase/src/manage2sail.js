/**
 * Manage2Sail Scraper Service
 * 
 * Uses Gemini 2.0 Flash with Google Search grounding to extract regatta results 
 * from manage2sail.com and parse them into structured data for the Startgelder module.
 * 
 * Strategy: Since Manage2Sail is a SPA, we use Gemini's Google Search capability
 * to find and extract the regatta data from indexed pages.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Use the Gemini API with Google Search grounding (v1beta works with googleSearch tool)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Fallback to Firecrawl if Gemini fails (correct endpoint!)
const FIRECRAWL_URL = import.meta.env.VITE_FIRECRAWL_URL || 'https://scrape.aitema.de';

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

export default {
  scrapeManage2Sail,
  parseRegattaResults,
  findSailorResult,
  formatForDatabase
};
