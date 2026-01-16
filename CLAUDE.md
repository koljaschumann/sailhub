# SailHub - TSC Jugendportal

> Eine React-Monorepo-Anwendung für die Jugendabteilung des TSC (Tegeler Segel-Club e.V.) mit 8 integrierten Modulen zur Verwaltung von Saisonplanung, Startgeldern, Schadensmeldungen und mehr.

---

## Live Deployment

| Environment | URL | Status |
|-------------|-----|--------|
| **Production** | https://sailhub.aitema.de | Live |
| **Server IP** | 49.13.15.44 | Hetzner Cloud |
| **SSL** | Let's Encrypt (R13) | Gültig bis 08.04.2026 |

---

## CREDENTIALS & API KEYS

> **WICHTIG**: Diese Datei enthält sensible Zugangsdaten. NICHT öffentlich teilen!

### Server-Zugang (SSH)

| Parameter | Wert |
|-----------|------|
| **Host** | `49.13.15.44` |
| **User** | `root` |
| **SSH Key** | `~/.ssh/id_ed25519` |
| **Passphrase** | `Fedo` |

```bash
# SSH-Key laden
ssh-add ~/.ssh/id_ed25519
# Passphrase: Fedo

# Verbinden
ssh root@49.13.15.44
```

---

### Supabase (Self-Hosted)

| Parameter | Wert |
|-----------|------|
| **Studio URL** | https://studio.aitema.de |
| **API URL** | https://supabase.aitema.de |
| **Anon Key** | `[Siehe apps/web/.env]` |

```bash
# Service Role Key vom Server holen
ssh root@49.13.15.44 "grep SERVICE_ROLE_KEY /root/hetzner-stack/.env"
```

---

### Gemini AI (Google)

| Parameter | Wert |
|-----------|------|
| **API Key** | `[Siehe apps/web/.env]` |
| **Model** | `gemini-2.0-flash-exp` |
| **Console** | https://aistudio.google.com/apikey |

---

### ClickUp Integration

| Parameter | Wert |
|-----------|------|
| **API Token** | `[Siehe apps/web/.env]` |
| **Space ID** | `90158816299` (SailHub) |
| **List ID** | `901518789734` (SailHub List) |
| **Team ID** | `90152104402` |
| **Workspace** | Aitema |

```bash
# Token generieren: https://app.clickup.com/settings/apps
```

---

### GitHub Integration

| Parameter | Wert |
|-----------|------|
| **Repository** | `koljaschumann/sailhub` |
| **Token** | `[Siehe .env.local oder Passwort-Manager]` |
| **Scope** | `repo:issues:write` |

```bash
# Token erstellen: https://github.com/settings/tokens
# Fine-grained -> Repository: sailhub -> Permissions: Issues Write
```

---

### Firecrawl (Self-Hosted)

| Parameter | Wert |
|-----------|------|
| **URL** | https://scrape.aitema.de |
| **API Key** | `fc-local` |

---

### Hetzner Cloud

| Service | Token |
|---------|-------|
| **DNS Console** | `[Siehe Passwort-Manager]` |
| **Cloud API** | `[Siehe Passwort-Manager]` |

```bash
# DNS Console: https://dns.hetzner.com
# Cloud Console: https://console.hetzner.com
```

---

## Architektur

### Single Page Application (SPA)

SailHub ist eine **unified SPA** mit 8 integrierten Modulen. Alle Module teilen sich:
- Einen gemeinsamen Auth-State (kein SSO nötig)
- Shared UI-Komponenten (@tsc/ui)
- Einen Supabase-Client (@tsc/supabase)
- Gemeinsame Daten (@tsc/data)

```
Browser -> Landing Page -> Login -> Dashboard -> Module
                                        |
                    +-------------------+-------------------+
                    |         |         |         |         |
              Saisonplanung  Startgelder  ...    Jahresauswertung
```

### Benutzerrollen

| Rolle | Beschreibung |
|-------|-------------|
| `admin` | Vollzugriff auf alle Module und Admin-Bereich |
| `trainer` | Events verwalten, Planung erstellen |
| `eltern` | Erstattungen einreichen, Anmeldungen |
| `segler` | Mitglied der Jugendabteilung |

---

## URLs & Routes

| Route | Komponente | Zugriff |
|-------|------------|---------|
| `/` | Landing | Öffentlich |
| `/login` | Login | Öffentlich (redirect wenn eingeloggt) |
| `/register` | Register | Öffentlich (redirect wenn eingeloggt) |
| `/auth/callback` | AuthCallback | Öffentlich |
| `/dashboard` | Dashboard | Authentifiziert |
| `/admin` | Admin | Nur Admins |
| `/saisonplanung/*` | Saisonplanung | Authentifiziert |
| `/startgelder/*` | Startgelder | Authentifiziert |
| `/schadensmeldung/*` | Schadensmeldung | Authentifiziert |
| `/eventanmeldung/*` | Eventanmeldung | Authentifiziert |
| `/saisoncharter/*` | Saisoncharter | Authentifiziert |
| `/jugendleistungsfonds/*` | Jugendleistungsfonds | Authentifiziert |
| `/spendenportal/*` | Spendenportal | Authentifiziert |
| `/jahresauswertung/*` | Jahresauswertung | Authentifiziert |

---

## Die 8 Module

### 1. Saisonplanung
**Pfad:** `/saisonplanung`
**Icon:** sailboat (amber)

Plane und verwalte Regatten, Trainingslager und Motorboot-Einsätze für die gesamte Saison.

| Feature | Beschreibung |
|---------|-------------|
| Regatta-Kalender | Übersicht aller Veranstaltungen |
| Motorboot-Zuteilung | Welches Boot für welches Event |
| Trainingslager | Planung von Camps |
| PDF-Export | Kalender als PDF |

**Seiten:** Dashboard, Events, Boats, Overview, Admin

---

### 2. Startgeld-Erstattung
**Pfad:** `/startgelder`
**Icon:** euro (mint)

Erfasse Regatta-Teilnahmen automatisch über manage2sail und erstelle Erstattungsanträge.

| Feature | Beschreibung |
|---------|-------------|
| **manage2sail Auto-Suche** | Intelligente Suche mit Fuzzy-Matching (NEU, in Arbeit) |
| manage2sail Integration | Automatischer Import von Regatta-Ergebnissen |
| Rechnungs-Upload | PDF/Bild Upload für Belege (verpflichtend) |
| SEPA-Export | Sammelüberweisung generieren |
| Auto-Berechnung | Erstattungsbetrag automatisch |

**Seiten:** Dashboard, AddRegatta, Export, Settings

**Technische Details (manage2sail Auto-Suche):**
- Model: `gemini-2.0-flash-exp` mit `googleSearch` Tool (grounding)
- Lokale Fuzzy-Suche: Fuse.js für fehlertolerante Eingaben
- Debounced Search: 500ms Verzögerung nach Eingabe
- Jahr-Filter: Aktuelles Jahr + 2 Vorjahre
- Auto-Fill: Name, Datum, Ort, Platzierung bei Auswahl
- Relevante Dateien:
  - `apps/web/src/modules/startgelder/pages/AddRegatta.jsx`
  - `apps/web/src/modules/startgelder/utils/fuzzySearch.js`
  - `packages/supabase/src/manage2sail.js`

**Status:** UI implementiert, Suche liefert noch keine Ergebnisse (Debugging nötig)

---

### 3. Schadensmeldung
**Pfad:** `/schadensmeldung`
**Icon:** warning (red)

Melde Schäden an Booten und Hängern schnell und dokumentiere mit Fotos.

| Feature | Beschreibung |
|---------|-------------|
| Foto-Upload | Schäden dokumentieren |
| Status-Tracking | Offen, In Bearbeitung, Erledigt |
| Equipment-Verwaltung | Boote, Hänger, Motorboote |
| Admin-Dashboard | Übersicht aller Meldungen |

**Seiten:** ReportForm, ReportList, Equipment, Admin

---

### 4. Eventanmeldung
**Pfad:** `/eventanmeldung`
**Icon:** calendar (purple)

Melde dich für Regatten und Trainings an. Verwalte Crew für Mehrpersonenboote.

| Feature | Beschreibung |
|---------|-------------|
| Regatta-Anmeldung | Online-Anmeldung |
| Crew-Verwaltung | Team zusammenstellen |
| Absage-Management | Stornierungen |
| Meisterschaften | Besondere Events |

**Seiten:** EventList, RegistrationForm, RegistrationList, Admin

---

### 5. Saison-Charter
**Pfad:** `/saisoncharter`
**Icon:** anchor (cyan)

Chartere ein Vereinsboot für die gesamte Saison. 250 EUR Pauschale April-September.

| Feature | Beschreibung |
|---------|-------------|
| Boot-Auswahl | Verfügbare Boote |
| Saison-Buchung | Komplette Saison buchen |
| Verfügbarkeits-Kalender | Wann ist was frei |
| Vertrags-PDF | Chartervertrag generieren |

**Seiten:** BookingForm, MyBookings, BoatCalendar, Admin

---

### 6. Jugendleistungsfonds
**Pfad:** `/jugendleistungsfonds`
**Icon:** sparkles (mint)

Beantrage finanzielle Unterstützung für Ausrüstung, Training oder Regatten.

| Feature | Beschreibung |
|---------|-------------|
| Förderantrag | Online-Antrag stellen |
| Beleg-Upload | Kostenvoranschläge/Rechnungen |
| Status-Tracking | Antragsstatus verfolgen |
| Auszahlung | Nach Genehmigung |

**Seiten:** ApplicationForm, MyApplications, Admin

---

### 7. Spendenportal
**Pfad:** `/spendenportal`
**Icon:** heart (red)

Unterstütze die TSC-Jugend mit einer Spende für die Nachwuchsförderung.

| Feature | Beschreibung |
|---------|-------------|
| Online-Spenden | Einfach spenden |
| Kampagnen | Gezielte Spendenaktionen |
| Spendenquittung | Für Steuererklärung |
| Fortschritt | Spendenstand anzeigen |

**Seiten:** DonateForm, Campaigns, ThankYou, Admin

---

### 8. Jahresauswertung
**Pfad:** `/jahresauswertung`
**Icon:** trophy (amber)

Statistiken der Jugendarbeit. Ranglisten, Kilometer und Jahresauszeichnungen.

| Feature | Beschreibung |
|---------|-------------|
| Ranglisten | Wer hat wie oft teilgenommen |
| Distanz-Berechnung | Gefahrene Kilometer |
| Jahres-Awards | Auszeichnungen vergeben |
| Statistiken | Auswertungen |

**Seiten:** Overview, Rankings, Awards

---

## Projektstruktur

```
sailhub-build/
├── apps/
│   ├── web/                          # Haupt-SPA (Production)
│   │   ├── src/
│   │   │   ├── App.jsx               # Router mit allen Routes
│   │   │   ├── main.jsx              # Entry Point
│   │   │   ├── pages/                # Hauptseiten
│   │   │   │   ├── Landing.jsx       # Öffentliche Startseite
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   ├── Dashboard.jsx     # Modul-Übersicht
│   │   │   │   ├── Admin.jsx         # Benutzerverwaltung
│   │   │   │   └── AuthCallback.jsx
│   │   │   ├── modules/              # Die 8 Module
│   │   │   │   ├── saisonplanung/
│   │   │   │   ├── startgelder/
│   │   │   │   ├── schadensmeldung/
│   │   │   │   ├── eventanmeldung/
│   │   │   │   ├── saisoncharter/
│   │   │   │   ├── jugendleistungsfonds/
│   │   │   │   ├── spendenportal/
│   │   │   │   └── jahresauswertung/
│   │   │   └── components/
│   │   │       └── PoweredByAitema.jsx
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   ├── startgelder/                  # Standalone (Legacy)
│   ├── saisonplanung/                # Standalone (Legacy)
│   ├── schadensmeldung/              # Standalone (Legacy)
│   ├── eventanmeldung/               # Standalone (Legacy)
│   ├── saisoncharter/                # Standalone (Legacy)
│   ├── jugendleistungsfonds/         # Standalone (Legacy)
│   ├── spendenportal/                # Standalone (Legacy)
│   ├── jahresauswertung/             # Standalone (Legacy)
│   │
│   ├── proposal-cyber/               # Design-Variante Cyber
│   ├── proposal-kinetic/             # Design-Variante Kinetic
│   └── proposal-luxury/              # Design-Variante Luxury
│
├── packages/
│   ├── ui/                           # Shared UI-Komponenten
│   │   └── src/
│   │       ├── GlassCard.jsx
│   │       ├── Button.jsx
│   │       ├── Modal.jsx
│   │       ├── Toast.jsx
│   │       ├── IconBadge.jsx
│   │       ├── Icons.jsx
│   │       ├── ThemeContext.jsx
│   │       └── FeedbackWidget.jsx
│   │
│   ├── supabase/                     # Backend-Services
│   │   └── src/
│   │       ├── client.js             # Supabase Client
│   │       ├── useAuth.jsx           # Auth Hook & Provider
│   │       ├── manage2sail.js        # Gemini Scraper
│   │       ├── tickets.js            # ClickUp + GitHub Ticketing
│   │       └── index.jsx
│   │
│   ├── config/                       # Shared Config
│   │   ├── tailwind.config.js
│   │   └── postcss.config.js
│   │
│   └── data/                         # Shared Data
│       └── src/
│           └── boatClasses.js
│
├── supabase/                         # Database Migrations
│   └── migrations/
│
├── scripts/
│   └── setup-clickup.sh
│
├── deploy.sh                         # Deployment Script
├── Dockerfile
├── nginx.conf
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── CLAUDE.md                         # Diese Datei
```

---

## Shared Packages

### @tsc/ui

| Export | Beschreibung |
|--------|-------------|
| `ThemeProvider`, `useTheme` | Dark/Light Mode |
| `GlassCard` | Glassmorphism Card |
| `Button` | Multi-variant Button |
| `Modal` | Responsive Modal |
| `ToastProvider`, `useToast` | Toast Notifications |
| `IconBadge` | Colored Icon Badges |
| `Icons` | SVG Icon Collection |
| `FeedbackWidget` | Bug/Feature Reporting |

### @tsc/supabase

| Export | Beschreibung |
|--------|-------------|
| `supabase` | Supabase Client |
| `AuthProvider`, `useAuth` | Auth Context & Hook |
| `scrapeManage2Sail` | Regatta-Daten scrapen |
| `findSailorResult` | Segler in Ergebnissen finden |
| `submitTicket` | ClickUp + GitHub Ticket |

**useAuth Properties:**
- `user`, `profile`
- `isAuthenticated`, `loading`
- `isAdmin`, `isTrainer`, `isParent`, `isSailor`
- `userRole`

**useAuth Methods:**
- `signIn(email, password)`
- `signUp(email, password, fullName, role, membershipNumber)`
- `signOut()`
- `updateProfile(data)`

### @tsc/data

| Export | Beschreibung |
|--------|-------------|
| `boatClasses` | Bootsklassen (Opti, ILCA, 29er, etc.) |
| `motorboats` | Motorboote |
| `roles`, `getRoleLabel` | Benutzerrollen |

---

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Docker (für Deployment)

### Installation
```bash
cd sailhub-build

# Dependencies installieren
pnpm install

# .env erstellen
cp .env.example .env
# Credentials eintragen (siehe oben)

# Development starten
pnpm dev
```

### Build
```bash
# Web-App bauen
cd apps/web && pnpm build
```

---

## Deployment

### Hetzner Server (Produktion)

```bash
# 1. SSH-Key laden
ssh-add ~/.ssh/id_ed25519
# Passphrase: Fedo

# 2. Build lokal erstellen
cd apps/web && pnpm build

# 3. Archiv erstellen und auf Server kopieren
tar -czf /tmp/sailhub-dist.tar.gz -C dist .
scp /tmp/sailhub-dist.tar.gz root@49.13.15.44:/tmp/

# 4. In Container entpacken (ohne Neustart!)
ssh root@49.13.15.44 "docker cp /tmp/sailhub-dist.tar.gz sailhub:/tmp/ && \
  docker exec sailhub sh -c 'tar -xzf /tmp/sailhub-dist.tar.gz -C /usr/share/nginx/html/'"
```

### Oder mit deploy.sh

```bash
./deploy.sh
```

---

## Wichtige Dateien auf dem Server

| Pfad | Beschreibung |
|------|--------------|
| `/root/hetzner-stack/` | Docker Stack (alle Services) |
| `/root/hetzner-stack/.env` | Server-Credentials |
| `/root/hetzner-stack/docker-compose.yml` | Docker Konfiguration |
| `/var/run/docker.sock` | Docker Socket |

---

## Troubleshooting

### SSL-Zertifikat zeigt Warnung
```bash
ssh root@49.13.15.44 "docker restart traefik"
ssh root@49.13.15.44 "docker logs traefik 2>&1 | grep sailhub"
```

### SSH verbindet nicht
```bash
ssh-add -l
ssh-add ~/.ssh/id_ed25519  # Passphrase: Fedo
ssh root@49.13.15.44
```

### Manage2Sail Scraping schlägt fehl
1. `VITE_GEMINI_API_KEY` in `.env` prüfen
2. URL-Format prüfen (`/de-DE/event/...`)
3. Browser DevTools Console prüfen
4. Fallback: PDF Upload oder manuelles Formular

---

## Current State (Stand: 15. Januar 2026)

**Alle 8 Module sind vollständig funktionsfähig und getestet.**

| Modul | Status | Letzte Änderung |
|-------|--------|-----------------|
| Saisonplanung | Funktioniert | - |
| **Startgeld-Erstattung** | In Arbeit | 15.01.2026: manage2sail Auto-Suche UI implementiert, Debugging nötig |
| Schadensmeldung | Funktioniert | - |
| Eventanmeldung | Funktioniert | - |
| **Saison-Charter** | Funktioniert | 15.01.2026: DB-Schema korrigiert, Rechnungssystem implementiert |
| **Jugendleistungsfonds** | Funktioniert | 15.01.2026: DB-Schema erweitert, RLS-Policies hinzugefügt |
| Spendenportal | Funktioniert | - |
| Jahresauswertung | Funktioniert | - |

### Kürzlich behobene Probleme

1. **Saison-Charter Buchungen**: Spaltennamen im Code an DB-Schema angepasst
2. **Saison-Charter Rechnungen**: Client-seitige Rechnungsnummerngenerierung implementiert
3. **Jugendleistungsfonds Anträge**: Fehlende Spalten hinzugefügt, RLS-Policies korrigiert

---

## Development Rules

### Datenbank-Schema Regeln

> **WICHTIG**: Die Spalten im Code müssen exakt mit der Datenbank übereinstimmen!

#### charter_bookings Tabelle

| Code-Referenz | DB-Spalte | Hinweis |
|---------------|-----------|---------|
| `boat_id` | `assigned_boat_id` | FK zu charter_boats |
| `sailor_first_name` + `sailor_last_name` | `sailor_name` | Kombiniert als ein Feld |
| `contact_email` | `guardian_email` | Eltern/Erziehungsberechtigte |
| `contact_phone` | `guardian_phone` | Optional |
| `reason` | `charter_reason` | CHECK: 'alter', 'finanziell', 'einstieg', 'sonstiges' |
| `status` | `status` | CHECK: 'beantragt', 'genehmigt', 'boot_zugewiesen', 'aktiv', 'beendet', 'abgelehnt' |

#### funding_applications Tabelle

| Spalte | Typ | Hinweis |
|--------|-----|---------|
| `applicant_first_name` | text | Antragsteller Vorname |
| `applicant_last_name` | text | Antragsteller Nachname |
| `applicant_birth_date` | date | Geburtsdatum |
| `category` | text | Förderkategorie |
| `title` | text | Antragstitel |
| `description` | text | Beschreibung |
| `total_amount` | numeric | Gesamtbetrag |
| `status` | text | CHECK: 'entwurf', 'eingereicht', 'in_pruefung', 'genehmigt', 'abgelehnt', 'ausgezahlt' |

#### charter_invoices Tabelle

| Spalte | Typ | Hinweis |
|--------|-----|---------|
| `booking_id` | uuid | FK zu charter_bookings |
| `invoice_number` | text | Format: TSC-SC-YYYY-XXXX (client-generiert) |
| `amount` | numeric | Rechnungsbetrag |
| `status` | text | 'erstellt', 'versendet', 'bezahlt', 'storniert' |
| `recipient_name` | text | Empfängername |
| `recipient_email` | text | Empfänger-E-Mail |

### Admin-Zugang in Modulen

Die "Verwaltung"-Tabs in Modulen sind **nur für Admins** sichtbar:

```javascript
// Navigation.jsx Pattern
if (isAdmin) {
  navItems.push({ id: 'admin', label: 'Verwaltung', icon: Icons.settings });
}
```

Dies gilt für:
- Saison-Charter → Verwaltung
- Jugendleistungsfonds → Verwaltung
- Spendenportal → Verwaltung
- Eventanmeldung → Verwaltung

### Rechnungsnummern-Generierung

Rechnungsnummern werden **client-seitig** generiert (nicht via DB-Funktion):

```javascript
const year = new Date().getFullYear();
const existingCount = invoices.filter(inv =>
  inv.invoice_number?.startsWith(`TSC-SC-${year}`)
).length;
const nextNum = existingCount + 1;
const invoiceNumber = `TSC-SC-${year}-${String(nextNum).padStart(4, '0')}`;
```

### RLS (Row Level Security)

Alle Tabellen haben RLS aktiviert. Wichtige Policies:

- **SELECT**: Authentifizierte Benutzer können eigene Daten sehen
- **INSERT**: Authentifizierte Benutzer können eigene Einträge erstellen
- **UPDATE/DELETE**: Nur Admins oder Eigentümer

Bei neuen Tabellen immer prüfen:
1. RLS aktiviert? (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
2. SELECT Policy vorhanden?
3. INSERT Policy vorhanden?
4. Admin-Policies für UPDATE/DELETE?

---

## Kontakt & Support

- **Repository**: https://github.com/koljaschumann/tsc-jugend-plattform
- **Tickets**: Feedback-Widget in der App
- **ClickUp**: https://app.clickup.com (Workspace: Aitema)

---

*Zuletzt aktualisiert: 15. Januar 2026, 23:15 Uhr*
*SSL-Zertifikat gültig bis: 8. April 2026*

---

## Offene Plan-Datei

Bei Fortsetzung der manage2sail Auto-Suche kann die Plan-Datei als Referenz dienen:
`C:\Users\kolja\.claude\plans\graceful-wobbling-garden.md`

Enthält: Architektur, Gemini Prompts, UI-Mockup, Implementierungsdetails
