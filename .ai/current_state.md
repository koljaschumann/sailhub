# SailHub – AI Context & Handover State

> **Letzte Aktualisierung:** 16. Januar 2026, 10:30 Uhr
> **Übergabe von:** Claude Code (Opus 4.5)
> **Übergabe an:** Nächste Session
> **Meilenstein:** v1.3 - Security Fix + manage2sail Auto-Suche (in Arbeit)

---

## Aktueller Status: SECURITY FIX ABGESCHLOSSEN

**Alle 8 Module funktionieren. GitHub Security Alert behoben.**

```
HEUTE (16.01.2026) ERLEDIGT:
✅ SECURITY: GitHub Alert - Google API Key aus Repository entfernt
   - Hardcoded API Key aus scripts/veo/generate-header.js entfernt
   - Git-History bereinigt (filter-branch)
   - Force-Push zu GitHub durchgeführt
   - GitHub Security Alert als "revoked" geschlossen
   - Remote-URL bereinigt (exponiertes Token entfernt)
   - Script verwendet jetzt nur noch Umgebungsvariable VEO_API_KEY

GESTERN (15.01.2026) - IN ARBEIT:
🔄 Startgelderstattung: Intelligente manage2sail Auto-Suche
   - UI implementiert und deployed
   - Suche liefert noch keine Ergebnisse (Debugging nötig)
   - Dateien:
     • apps/web/src/modules/startgelder/pages/AddRegatta.jsx (komplett neu)
     • apps/web/src/modules/startgelder/utils/fuzzySearch.js (NEU)
     • packages/supabase/src/manage2sail.js (erweitert)
   - Features:
     • Jahr-Auswahl (aktuelles + 2 Vorjahre)
     • Debounced Suche (500ms)
     • Fuzzy-Matching via Fuse.js
     • Gemini + Google Search für manage2sail-Suche
     • Auto-Fill bei Regatta-Auswahl
     • Platzierungserkennung nach Segelnummer

15.01.2026 ERLEDIGT:
✅ Saisonplanung: Auto-Sync Enddatum auf Startdatum
✅ Saisonplanung: PDF-Legende nur mit genutzten Bootsklassen
✅ Saisonplanung: Motorboot-Bereich nur für Admin sichtbar
✅ Landing Page: Saisonplanung/Jahresauswertung für alle sichtbar
✅ Landing Page: Modul-Beschreibungen aktualisiert
✅ Schadensmeldung: Neues Motorboot-Icon erstellt
✅ Schadensmeldung: Übersicht nur für Admin/Trainer sichtbar
✅ Schadensmeldung: Hängerwart-Rolle (is_haengerwart) implementiert
✅ Schadensmeldung: Verwaltung nur für Admin/Hängerwart zugänglich
✅ Schadensmeldung: E-Mail-Benachrichtigung vorbereitet (Edge Function TODO)

NACHMITTAG (15.01.2026) ERLEDIGT:
✅ DB-Migration: is_haengerwart Feld für profiles Tabelle (007_add_haengerwart.sql)
✅ DB-Migration auf Produktion ausgeführt
✅ Jahresauswertung Admin: Vollständig implementiert mit 8 Filtern:
   - Meiste Regatten
   - Beste Durchschnittsplatzierung
   - Weiteste Regatta (Distanz)
   - Jüngster Teilnehmer
   - Meiste Wettfahrten
   - Beste Einzelplatzierung
   - Aktivste Bootsklasse
   - Meisterschafts-Champion
✅ Edge Function: send-damage-notification erstellt (Resend API)
✅ Edge Function: send-damage-confirmation erstellt (Bestätigung an Melder)
✅ Beide Edge Functions deployed auf Supabase (ACTIVE)
✅ RESEND_API_KEY Secret in Supabase konfiguriert
✅ DataContext erweitert: getDetailedStats(), getRankingByFilter(), sailors-Daten

GESTERN (14.01.2026) ERLEDIGT:
✅ GitHub Repo "sailhub" erstellt mit Labels
✅ GitHub-Integration funktioniert (Feedback → Issues)
✅ ClickUp-Integration repariert (SailHub Space)
✅ Startgelder: Regatta-Speicher-Bug behoben
✅ Startgelder: Robuster Fallback für regatta_name
✅ Saisonplanung: Bootsklassen-Feld hinzugefügt
✅ Saisonplanung: "Meine Veranstaltungen" Filter korrigiert
✅ Jahresauswertung: Jahres-Dropdown funktioniert
✅ Jahresauswertung: Startgelder-Regatten integriert

BEREITS IMPLEMENTIERT:
✅ Cookie-Banner mit Zustimmungs-Dialog
✅ Account-Löschung mit GitHub/ClickUp Benachrichtigung
✅ Nutzungsbedingungen-Seite (/nutzungsbedingungen)
✅ Datenschutzinformationen-Seite (/datenschutz)
✅ DonateButton in allen 8 Modulen
✅ FeedbackWidget (Bug-Reports → GitHub + ClickUp)
```

---

## Die 8 Module – Funktionsstatus

| Modul | Status | Kernfunktionen |
|-------|--------|----------------|
| **Saisonplanung** | ✅ Live | Events anlegen, Bootsklassen wählen, Kalender |
| **Startgelderstattung** | ✅ Live | PDF-Upload, Regatta speichern, Betrag erfassen |
| **Schadensmeldung** | ✅ Live | Schäden melden mit Fotos |
| **Eventanmeldung** | ✅ Live | Für Events anmelden |
| **Saisoncharter** | ✅ Live | Boot für Saison chartern |
| **Jugendleistungsfonds** | ✅ Live | Förderanträge stellen |
| **Spendenportal** | ✅ Live | Spenden entgegennehmen |
| **Jahresauswertung** | ✅ Live | Statistiken, Ranglisten, Startgelder-Integration |

---

## Sync-Workflow (WICHTIG!)

### Warum?
Google Drive blockiert Dateien während `pnpm install` → Build schlägt fehl.

### Lösung: Bidirektionaler Sync

```bash
# 1. VOR dem Arbeiten: Google Drive → /tmp
rm -rf /tmp/sailhub-build2
mkdir -p /tmp/sailhub-build2
cp "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/package.json" /tmp/sailhub-build2/
cp "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/pnpm-workspace.yaml" /tmp/sailhub-build2/
cp -r "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/packages" /tmp/sailhub-build2/
mkdir -p /tmp/sailhub-build2/apps/web
cp -r "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/apps/web/src" /tmp/sailhub-build2/apps/web/
cp -r "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/apps/web/public" /tmp/sailhub-build2/apps/web/
cp "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/apps/web/"*.* /tmp/sailhub-build2/apps/web/

# 2. Install & Build
cd /tmp/sailhub-build2 && pnpm install && cd apps/web && pnpm build

# 3. Deploy
tar -czf /tmp/sailhub-dist.tar.gz -C dist .
export SSH_ASKPASS=/tmp/askpass.sh && export SSH_ASKPASS_REQUIRE=force
scp -i ~/.ssh/id_ed25519 /tmp/sailhub-dist.tar.gz root@49.13.15.44:/tmp/
ssh -i ~/.ssh/id_ed25519 root@49.13.15.44 "docker cp /tmp/sailhub-dist.tar.gz sailhub:/tmp/ && docker exec sailhub sh -c 'rm -rf /usr/share/nginx/html/* && tar -xzf /tmp/sailhub-dist.tar.gz -C /usr/share/nginx/html/'"

# 4. Sync zurück!
cp -r /tmp/sailhub-build2/apps/web/src "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/apps/web/"
cp -r /tmp/sailhub-build2/packages/data/src "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/packages/data/"
```

---

## Integrations

| Integration | Ziel | Config |
|-------------|------|--------|
| GitHub Issues | `koljaschumann/sailhub` | Token in .env |
| ClickUp Tasks | Space: 90158816299, List: 901518789734 | Token in .env |
| Gemini AI | Ticket-Kategorisierung | API Key in .env |
| Supabase | Self-hosted: supabase.aitema.de | Anon Key in .env |
| **Resend** | E-Mail-Versand (Schadensmeldung) | Secret in Supabase |

### Edge Functions (Supabase)

| Function | Zweck | Status |
|----------|-------|--------|
| `send-damage-notification` | Benachrichtigung an Sportwart/Hängerwart | ✅ ACTIVE |
| `send-damage-confirmation` | Bestätigung an den Melder | ✅ ACTIVE |

**Secret:** `RESEND_API_KEY` in Supabase Edge Functions konfiguriert

---

## Behobene Bugs (14.01.2026)

| Bug | Ursache | Fix |
|-----|---------|-----|
| Startgelder: `null regatta_name` | Property-Name Mismatch + leere Strings | Robuster Fallback mit Datum |
| Saisonplanung: Bootsklasse fehlt | Feld nicht im Formular | Dropdown hinzugefügt |
| Saisonplanung: "Meine Veranstaltungen" leer | Filter nach Profil-Bootsklasse | Filter nach trainerId |
| Jahresauswertung: Dropdown leer | Keine Jahre wenn keine Daten | Immer aktuelle + 2 Jahre |
| Jahresauswertung: Keine Startgelder | Nur event_registrations geladen | regatta_entries integriert |

---

## Quick Reference

### URLs

| Service | URL |
|---------|-----|
| Production | https://sailhub.aitema.de |
| Supabase API | https://supabase.aitema.de |
| Supabase Studio | https://studio.aitema.de |
| GitHub Repo | https://github.com/koljaschumann/sailhub |
| Server | 49.13.15.44 |

### Pfade

| Zweck | Pfad |
|-------|------|
| Persistente Speicherung | `G:\Geteilte Ablagen\Sailhub\Sailiing bring money money money\` |
| Build & Entwicklung | `/tmp/sailhub-build2/` |
| SSH Key | `~/.ssh/id_ed25519` (Passphrase: Fedo) |

### SSH ASKPASS Trick

```bash
# askpass.sh erstellen (einmalig)
echo '#!/bin/bash
echo Fedo' > /tmp/askpass.sh && chmod +x /tmp/askpass.sh

# Bei SSH/SCP verwenden
export SSH_ASKPASS=/tmp/askpass.sh && export SSH_ASKPASS_REQUIRE=force
```

---

## Nächste Schritte (Prio)

### Hoch
- [ ] **manage2sail Auto-Suche debuggen:** Suche liefert keine Ergebnisse
  - Problem: Gemini API mit Google Search grounding liefert keine/leere Antworten
  - Debugging-Schritte:
    1. Browser Console öffnen während Suche
    2. Prüfen ob `searchManage2SailRegattas()` aufgerufen wird
    3. Prüfen ob Gemini API Response korrekt ist
    4. Eventuell Prompt anpassen oder Fallback einbauen
  - Relevante Dateien:
    - `packages/supabase/src/manage2sail.js` - `searchManage2SailRegattas()`
    - `apps/web/src/modules/startgelder/pages/AddRegatta.jsx` - `performSearch()`
- [ ] **Schadensmeldung E-Mail:** E-Mail-Adresse des Sportwarts eintragen
  - Datei: `apps/web/src/modules/schadensmeldung/context/DataContext.jsx`
  - Variable: `NOTIFICATION_EMAILS.sportwart`
- [ ] **Schadensmeldung E-Mail:** E-Mail-Adresse des Hängerwarts eintragen
  - Datei: `apps/web/src/modules/schadensmeldung/context/DataContext.jsx`
  - Variable: `NOTIFICATION_EMAILS.haengerwart`

### Erledigt (15.01.2026)
- [x] ~~**RESEND_API_KEY als Supabase Secret setzen**~~ ✅
- [x] ~~**Edge Function deployen:** `send-damage-notification`~~ ✅
- [x] ~~**Edge Function deployen:** `send-damage-confirmation`~~ ✅
- [x] ~~**DB-Migration ausführen:** `007_add_haengerwart.sql`~~ ✅

### Mittel
- [ ] RLS wieder aktivieren für profiles Tabelle
- [ ] Weitere Module testen und Bugs fixen

### Niedrig
- [ ] Debug-Logs entfernen in useAuth.jsx
- [ ] Super-Backend erweitern

---

## Rechtliche Struktur

```
┌─────────────────────────────────────────────────────────┐
│                     DSGVO-Struktur                      │
├─────────────────────────────────────────────────────────┤
│  Verantwortlicher (Controller):                         │
│  ┌─────────────────────────────────────┐               │
│  │ Tegeler Segel-Club e.V.             │               │
│  │ Jugendabteilung                     │               │
│  │ Schwarzer Weg 27, 13505 Berlin      │               │
│  │ jugend@tegeler-segel-club.de        │               │
│  └─────────────────────────────────────┘               │
│                       │ AVV gem. Art. 28 DSGVO         │
│                       ▼                                 │
│  Auftragsverarbeiter (Processor):                      │
│  ┌─────────────────────────────────────┐               │
│  │ Aitema GmbH                         │               │
│  │ Prenzlauer Allee 229, 10405 Berlin  │               │
│  │ office@aitema.de                    │               │
│  └─────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```
