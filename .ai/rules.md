# 🎯 SailHub – Coding Rules & Conventions

> Diese Regeln gelten für alle AI-Assistenten (Claude, Gemini, etc.) und menschliche Entwickler.
>
> **Aktueller Status:** v1.3-stable (16.01.2026) - Security Fix + Alle 8 Module + Edge Functions

---

## 🚀 Session-Start & Ende

### Session starten
```
Lies .ai/CURRENT_STATE.md und .ai/rules.md
```

### Session beenden
Vor dem Beenden einer Session sollte Claude:
1. **CURRENT_STATE.md aktualisieren** mit:
   - Was wurde gemacht?
   - Was ist der aktuelle Status?
   - Was sind die nächsten Schritte?
2. **Bei Infrastruktur-Änderungen:** Befehle dokumentieren, die beim nächsten Mal nötig sind

### Schnellbefehle für den Benutzer
```bash
# Session starten (für Claude)
Lies .ai/CURRENT_STATE.md und .ai/rules.md

# Session beenden (für Claude)
Aktualisiere .ai/CURRENT_STATE.md mit dem aktuellen Stand

# Code nach /tmp kopieren (vor Build)
rm -rf /tmp/sailhub-build22
mkdir -p /tmp/sailhub-build22
cp "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/package.json" /tmp/sailhub-build22/
cp "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/pnpm-workspace.yaml" /tmp/sailhub-build22/
cp -r "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/packages" /tmp/sailhub-build22/
mkdir -p /tmp/sailhub-build22/apps/web
cp -r "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/apps/web/src" /tmp/sailhub-build22/apps/web/
cp -r "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/apps/web/public" /tmp/sailhub-build22/apps/web/
cp "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/apps/web/"*.* /tmp/sailhub-build22/apps/web/

# Build & Deploy
cd /tmp/sailhub-build22 && pnpm install && cd apps/web && pnpm build

# ⚠️ WICHTIG: Nach Änderungen zurück synchronisieren!
cp -r /tmp/sailhub-build22/apps/web/src "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/apps/web/"
cp -r /tmp/sailhub-build22/packages/data/src "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/packages/data/"
```

---

## 📦 Projektstruktur

```
apps/web/          → Haupt-SPA (IMMER hier entwickeln für neue Features)
apps/[modul]/      → Legacy Standalone-Apps (NICHT verwenden)
packages/ui/       → Shared UI-Komponenten (@tsc/ui)
packages/supabase/ → Backend-Services (@tsc/supabase)
packages/data/     → Shared Data & Types (@tsc/data)
packages/config/   → Shared Configs (Tailwind, PostCSS)
```

---

## 🚀 Build & Deploy

### ⚠️ WICHTIG: Nicht auf Google Drive builden!

Das Projekt liegt auf Google Drive (`G:\Geteilte Ablagen\...`), aber **dort kann NICHT gebaut werden** wegen File-Locking durch den Sync-Prozess.

**Lösung:** Arbeiten in `/tmp/sailhub-build2`, dann zurück nach Google Drive synchronisieren.

| Zweck | Pfad |
|-------|------|
| **Persistente Speicherung** | `G:\Geteilte Ablagen\Sailhub\Sailiing bring money money money\` |
| **Build & Entwicklung** | `/tmp/sailhub-build22/` (lokale Kopie) |
| **Desktop-Verknüpfung** | `C:\Users\kolja\OneDrive\Desktop\Sailhub - Verknüpfung.lnk` → `G:\Geteilte Ablagen\Sailhub` |

### 🔄 Automatischer Sync-Workflow (WICHTIG!)

**Nach JEDER Code-Änderung in /tmp/sailhub-build2 müssen die Änderungen zurück nach Google Drive synchronisiert werden!**

```bash
# Sync von /tmp nach Google Drive (nach Änderungen)
rsync -av --delete --exclude='node_modules' --exclude='.pnpm-store' --exclude='dist' \
  /tmp/sailhub-build22/ \
  "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/"
```

**Alternativ mit cp (falls rsync nicht verfügbar):**
```bash
# Nur die Source-Dateien synchronisieren (ohne node_modules/dist)
cp -r /tmp/sailhub-build22/apps "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/"
cp -r /tmp/sailhub-build22/packages "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/"
cp /tmp/sailhub-build22/package.json "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/"
cp /tmp/sailhub-build22/pnpm-workspace.yaml "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/"
cp /tmp/sailhub-build22/pnpm-lock.yaml "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/"
```

### Vollständiger Build & Deploy Workflow

```bash
# 1. Google Drive → /tmp kopieren
rm -rf /tmp/sailhub-build2
cp -r "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money" /tmp/sailhub-build2

# 2. Dependencies installieren & Build
cd /tmp/sailhub-build2 && pnpm install
cd apps/web && pnpm build

# 3. Deploy auf Server
tar -czf /tmp/sailhub-dist.tar.gz -C dist .
scp -i ~/.ssh/id_ed25519 /tmp/sailhub-dist.tar.gz root@49.13.15.44:/tmp/
ssh -i ~/.ssh/id_ed25519 root@49.13.15.44 "docker cp /tmp/sailhub-dist.tar.gz sailhub:/tmp/ && docker exec sailhub sh -c 'tar -xzf /tmp/sailhub-dist.tar.gz -C /usr/share/nginx/html/'"

# 4. ⚠️ WICHTIG: Änderungen zurück nach Google Drive synchen!
cp -r /tmp/sailhub-build22/apps "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/"
cp -r /tmp/sailhub-build22/packages "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/"
```

### Für Claude Code: Auto-Sync nach Änderungen

**Claude MUSS nach jeder Änderung in /tmp/sailhub-build2 diese Schritte ausführen:**

1. ✅ Änderung in `/tmp/sailhub-build22/...` durchführen
2. ✅ Direkt danach: Sync nach Google Drive ausführen
3. ✅ Bei Build: Nach Deploy den Sync ausführen

```bash
# Quick-Sync Befehl (nur src-Ordner, ohne node_modules)
cp -r /tmp/sailhub-build22/apps/web/src "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/apps/web/"
cp -r /tmp/sailhub-build22/packages/ui/src "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/packages/ui/"
cp -r /tmp/sailhub-build22/packages/supabase/src "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/packages/supabase/"
cp -r /tmp/sailhub-build22/packages/data/src "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/packages/data/"
```

**Hinweis:** node_modules werden NICHT synchronisiert (verursacht Fehler wegen symbolischer Links).

---

## 🔐 Server-Zugang

| Was | Wert |
|-----|------|
| Server | 49.13.15.44 (Hetzner) |
| User | root |
| SSH-Key | `~/.ssh/id_ed25519` |
| Passphrase | `Fedo` |
| Stack-Pfad | `/root/hetzner-stack/` |

**SSH-Verbindung (Git Bash):**
```bash
eval $(ssh-agent -s)
ssh-add ~/.ssh/id_ed25519
ssh root@49.13.15.44
```

---

## 🎨 Styling

| ✅ DO | ❌ DON'T |
|-------|---------|
| Tailwind CSS Klassen | Rohes CSS / `<style>` Tags |
| `className="..."` | `style={{...}}` Inline-Styles |
| Bestehende @tsc/ui Komponenten nutzen | Neue UI-Komponenten in Apps bauen |
| Dark Mode via `dark:` Prefix | Hardcoded Farben |

**Farb-Palette (Tailwind):**
- Primary: `blue-500`, `blue-600`
- Success: `emerald-500`
- Warning: `amber-500`
- Danger: `red-500`
- Background: `slate-900` (dark), `white` (light)

---

## ⚛️ React

| ✅ DO | ❌ DON'T |
|-------|---------|
| Functional Components | Class Components |
| Hooks (useState, useEffect, etc.) | this.state, lifecycle methods |
| Named Exports + Default Export | Nur Default Exports |
| Props destructuring | props.xyz Zugriff |

**Datei-Struktur für Komponenten:**
```jsx
// Imports
import { useState } from 'react'
import { GlassCard, Button } from '@tsc/ui'

// Component
export function MyComponent({ prop1, prop2 }) {
  // Hooks first
  const [state, setState] = useState()
  
  // Handlers
  const handleClick = () => { ... }
  
  // Render
  return (...)
}

export default MyComponent
```

---

## 🔐 Authentication & Supabase

| ✅ DO | ❌ DON'T |
|-------|---------|
| `useAuth()` aus `@tsc/supabase` | Eigene Auth-Logik bauen |
| `supabase` Client aus `@tsc/supabase` | Neuen Supabase-Client erstellen |
| RLS Policies in Migrations | Client-seitige Berechtigungsprüfung |

**Auth-Pattern:**
```jsx
import { useAuth } from '@tsc/supabase'

function MyPage() {
  const { user, profile, isAdmin, loading } = useAuth()

  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" />

  return (...)
}
```

### Benutzerrollen & Berechtigungen

| Rolle | Zugriff |
|-------|---------|
| `admin` | Alle Module + Admin-Bereiche + Super-Backend |
| `trainer` | Saisonplanung + alle anderen Module (ohne Admin-Bereiche) |
| `eltern` | Alle Module außer Saisonplanung (ohne Admin-Bereiche) |
| `segler` | Alle Module außer Saisonplanung (ohne Admin-Bereiche) |

**Admin-Bereich Pattern:**
```jsx
// In Navigation.jsx - Admin-Tab nur für Admins
if (isAdmin) {
  navItems.push({ id: 'admin', label: 'Verwaltung', icon: Icons.settings });
}

// In Admin.jsx - Zugriffskontrolle (ALLE Hooks zuerst!)
export function AdminPage() {
  const { isAdmin } = useAuth();
  const [state, setState] = useState();  // ← Hooks IMMER zuerst!

  if (!isAdmin) {
    return <AccessDenied />;  // ← Dann erst Access Check
  }
  // ...
}
```

**Modul-Sichtbarkeit (Dashboard/Landing):**
```jsx
const modules = [
  { id: 'saisonplanung', trainerOnly: true, ... },  // Nur für Trainer/Admin
  { id: 'startgelder', ... },  // Für alle authentifizierten User
];

const visibleModules = modules.filter(m => {
  if (m.adminOnly && !isAdmin) return false;
  if (m.trainerOnly && !isTrainer) return false;  // isTrainer ist true für Trainer UND Admin
  return true;
});
```

---

## 🌐 Environment Variables

| ✅ DO | ❌ DON'T |
|-------|---------|
| `import.meta.env.VITE_*` | `process.env.*` |
| Prefix mit `VITE_` | Ohne Prefix (wird nicht exposed) |

**WICHTIG:** Die `.env` Datei muss in `apps/web/` liegen für den Vite-Build!

**Inhalt von `apps/web/.env`:**
```env
VITE_SUPABASE_URL=https://supabase.aitema.de
VITE_SUPABASE_ANON_KEY=[Anon Key hier einfügen]
```

> **Hinweis:** Die echten Keys befinden sich in der lokalen `.env` Datei, die nicht in Git eingecheckt wird.

---

## 🔐 API Keys & Secrets (KRITISCH!)

### ❌ NIEMALS hardcoden

| ❌ VERBOTEN | ✅ RICHTIG |
|-------------|-----------|
| `const API_KEY = 'AIzaSy...'` | `const API_KEY = process.env.API_KEY` |
| `const TOKEN = 'ghp_...'` | `const TOKEN = import.meta.env.VITE_TOKEN` |
| Fallback mit echtem Key | Fehler werfen wenn Key fehlt |

**Beispiel für sicheres Pattern:**
```javascript
// ✅ RICHTIG - Fehler wenn nicht gesetzt
const API_KEY = process.env.VEO_API_KEY;
if (!API_KEY) {
    console.error('Error: VEO_API_KEY environment variable is not set');
    process.exit(1);
}

// ❌ FALSCH - Hardcoded Fallback (NIEMALS!)
const API_KEY = process.env.VEO_API_KEY || 'AIzaSy...';
```

### Git Remote URLs

**Niemals Tokens in Remote-URLs speichern:**
```bash
# ❌ FALSCH - Token exponiert
git remote set-url origin https://ghp_xxx@github.com/user/repo.git

# ✅ RICHTIG - Ohne Token
git remote set-url origin https://github.com/user/repo.git
```

### Bei versehentlicher Exposition

Falls ein Secret in Git committed wurde:

1. **Secret sofort rotieren** (bei Provider löschen/neu erstellen)
2. **Git-History bereinigen:**
   ```bash
   git stash  # Lokale Änderungen sichern
   FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force --tree-filter \
     "sed -i 's/EXPOSED_KEY/REMOVED/g' path/to/file 2>/dev/null || true" \
     --tag-name-filter cat -- --all
   git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git stash pop  # Änderungen zurückholen
   ```
3. **Force-Push:** `git push --force origin master`
4. **GitHub Security Alert schließen** als "revoked"

---

## 📧 Edge Functions & E-Mail (Supabase + Resend)

### Aktive Edge Functions

| Function | Zweck | Datei |
|----------|-------|-------|
| `send-damage-notification` | E-Mail an Sportwart/Hängerwart bei neuer Schadensmeldung | `supabase/functions/send-damage-notification/index.ts` |
| `send-damage-confirmation` | Bestätigungs-E-Mail an den Melder | `supabase/functions/send-damage-confirmation/index.ts` |

### Edge Function erstellen/deployen

**Via Supabase MCP-Tool:**
```javascript
mcp__plugin_supabase_supabase__deploy_edge_function({
  project_id: "uyjelstoccrgexpxqiit",
  name: "function-name",
  entrypoint_path: "index.ts",
  verify_jwt: true,
  files: [{ name: "index.ts", content: "..." }]
})
```

### Resend E-Mail-Versand

**Pattern für E-Mail-Versand:**
```typescript
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${RESEND_API_KEY}`,
  },
  body: JSON.stringify({
    from: "SailHub <noreply@sailhub.aitema.de>",
    to: [recipientEmail],
    subject: "Betreff",
    html: htmlContent,
  }),
});
```

**Wichtig:**
- `RESEND_API_KEY` ist als Secret in Supabase Edge Functions konfiguriert
- Absender-Domain `sailhub.aitema.de` muss in Resend verifiziert sein
- E-Mails werden auf Deutsch verfasst

### Edge Function aufrufen (Client-seitig)

```javascript
import { supabase } from '@tsc/supabase';

const { data, error } = await supabase.functions.invoke('send-damage-notification', {
  body: {
    recipients: ['email@example.com'],
    equipmentName: 'Boot XY',
    description: 'Schaden beschreibung...',
    // ... weitere Felder
  },
});
```

---

## 📝 Code-Kommentare & Dokumentation

| Was | Sprache |
|-----|---------|
| Code-Kommentare | **Englisch** |
| JSDoc / TypeDoc | **Englisch** |
| Commit Messages | **Deutsch** |
| User-facing Text | **Deutsch** |
| CLAUDE.md, README | **Deutsch** |

---

## 🧪 Testing

- Framework: **Vitest** (NICHT Jest)
- Test-Dateien: `*.test.js` oder `*.spec.js`
- Co-located mit Komponente: `Button.jsx` → `Button.test.jsx`

---

## 📦 Package Management

- **pnpm** (NICHT npm oder yarn)
- Workspace-Packages: `pnpm add @tsc/ui --filter apps/web`
- Scripts via Turborepo: `pnpm turbo run build`

---

## ⚠️ Don't Touch (Ohne Absprache)

| Bereich | Grund |
|---------|-------|
| `supabase/migrations/` | Produktive DB, Migrationen nur nach Review |
| `packages/supabase/src/client.js` | Core Supabase-Setup |
| `apps/web/src/main.jsx` | Entry Point |
| `/root/hetzner-stack/docker-compose.yml` | Produktiv-Infrastruktur (siehe Lessons Learned unten) |
| `/root/hetzner-stack/.env` | Enthält alle Secrets und API-Keys |

---

## 🔄 Git Workflow

```bash
# Feature-Branch erstellen
git checkout -b feature/[kurze-beschreibung]

# Commit mit aussagekräftiger Message
git commit -m "feat(modul): Beschreibung der Änderung

- Detail 1
- Detail 2

Für Kollegen: [Erklärung der Logik-Änderungen]"

# Push & PR erstellen
git push -u origin feature/[kurze-beschreibung]
```

**Commit-Prefixes:**
- `feat:` – Neues Feature
- `fix:` – Bugfix
- `refactor:` – Code-Umbau ohne Funktionsänderung
- `docs:` – Dokumentation
- `style:` – Formatierung, keine Code-Änderung
- `chore:` – Build, Dependencies, etc.

---

## 🐛 Debugging-Dokumentation

Nach jedem größeren Debugging-Session, dokumentiere in `.ai/logs/`:

```markdown
# Debugging: [Thema] - [Datum]

## Problem
[Was war das Symptom?]

## Root Cause
[Was war die eigentliche Ursache?]

## Fehlgeschlagene Versuche
1. [Was probiert?] → [Warum hat es nicht funktioniert?]
2. ...

## Lösung
[Was hat funktioniert?]

## Lessons Learned
[Was sollten wir in Zukunft anders machen?]
```

---

## 🚨 Bekannte Fallstricke

### Supabase URLs
- ✅ `https://supabase.aitema.de` (Self-Hosted)
- ❌ `https://xyz.supabase.co` (Cloud - NICHT verwenden)
- ✅ Studio: `https://studio.aitema.de`

### Import-Pfade
- ✅ `import { X } from '@tsc/ui'`
- ❌ `import { X } from '../../packages/ui'`

### Entwicklungs-Pfad
- ✅ Neue Features in `apps/web/src/modules/[modul]/`
- ❌ NICHT in `apps/[modul]/` (Legacy Standalone-Apps)

### Shell-Befehle
- **Git Bash:** Linux-Syntax (`/c/Dev/sailhub`, `tar`, `ssh`)
- **PowerShell:** Windows-Syntax (`C:\Dev\sailhub`, andere Befehle)
- **CMD:** Wieder anders (`cd`, `rmdir /s /q`)
- **Server (SSH):** Linux, aber `nano` ist nicht installiert, nutze `vi`

---

## 📚 Lessons Learned

### Server-Konfiguration bearbeiten (12.01.2026)

**Problem:** Shell-Befehle wurden versehentlich in `docker-compose.yml` eingefügt statt ausgeführt.

**Ursache:** Beim Kopieren von Befehlen (z.B. `sed -i "s/..."`) in ein Terminal wurden diese manchmal in die geöffnete Datei eingefügt statt ausgeführt.

**Vermeidung:**
1. **Immer Backup erstellen** vor Änderungen:
   ```bash
   cp docker-compose.yml docker-compose.yml.backup-$(date +%Y%m%d)
   ```
2. **YAML validieren** nach jeder Änderung:
   ```bash
   docker compose config > /dev/null && echo "OK" || echo "FEHLER"
   ```
3. **Nicht kopieren und einfügen** in vi/vim wenn eine Datei geöffnet ist
4. **Befehle einzeln ausführen**, nicht mehrere auf einmal

### .env Dateien (12.01.2026)

**Problem:** .env wurde überschrieben und enthielt nur noch 3 statt 40 Zeilen.

**Vermeidung:**
1. **Backup der .env existiert:** `.env.bak-multiline`
2. **Niemals .env komplett überschreiben** - immer nur einzelne Werte ändern
3. **Bei JWT-Keys:** Müssen EINZEILIG sein, keine Zeilenumbrüche!

### SSH-Key Passphrase (für Claude Code)

**Problem:** SSH-Key erfordert Passphrase `Fedo`, aber interaktive Eingabe nicht möglich.

**Lösung:** SSH_ASKPASS Trick verwenden:
```bash
eval $(ssh-agent -s) && \
echo '#!/bin/bash
echo "Fedo"' > /tmp/askpass.sh && \
chmod +x /tmp/askpass.sh && \
DISPLAY=dummy SSH_ASKPASS=/tmp/askpass.sh ssh-add ~/.ssh/id_ed25519 </dev/null && \
ssh root@49.13.15.44 "BEFEHL"
```

### React Hooks Order (14.01.2026)

**Problem:** Seite friert komplett ein nach Login, nichts ist klickbar.

**Ursache:** React Rules of Hooks Violation - useState wurde NACH conditional return aufgerufen.

**Regel:** ALLE Hooks müssen VOR conditional returns aufgerufen werden!

```javascript
// ❌ FALSCH - führt zu Crash/Freeze
export function AdminPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <AccessDenied />;  // ← Return VOR Hook!
  }

  const [state, setState] = useState();  // ← Hook NACH conditional return = CRASH
}

// ✅ RICHTIG
export function AdminPage() {
  const { isAdmin } = useAuth();
  const [state, setState] = useState();  // ← Alle Hooks zuerst!

  if (!isAdmin) {
    return <AccessDenied />;  // ← Return NACH allen Hooks
  }
}
```

**Vermeidung:**
1. Bei JEDER Admin-Seite: Alle useState/useEffect etc. ZUERST deklarieren
2. Access Control Check DANACH
3. ESLint react-hooks/rules-of-hooks Plugin aktivieren

### Google Drive Build-Problem (14.01.2026)

**Problem:** `pnpm install` schlägt auf Google Drive fehl mit "ENOENT: no such file or directory, rename..."

**Ursache:** Google Drive Sync-Prozess blockiert Dateien während pnpm sie umbenennen will.

**Lösung:** Bidirektionaler Sync-Workflow:
1. **Vor Build:** Google Drive → /tmp kopieren
2. **Nach Änderungen:** /tmp → Google Drive synchronisieren

```bash
# Schritt 1: Projekt kopieren
rm -rf /tmp/sailhub-build2
cp -r "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money" /tmp/sailhub-build2

# Schritt 2: Build
cd /tmp/sailhub-build2 && pnpm install && cd apps/web && pnpm build

# Schritt 3: WICHTIG - Änderungen zurück synchronisieren!
cp -r /tmp/sailhub-build22/apps /tmp/sailhub-build22/packages "G:/Geteilte Ablagen/Sailhub/Sailiing bring money money money/"
```

**Desktop-Verknüpfung:** Eine Verknüpfung auf dem Desktop zeigt direkt auf `G:\Geteilte Ablagen\Sailhub` für schnellen Zugriff.

### Package Exports prüfen (14.01.2026)

**Problem:** Build schlägt fehl mit "is not exported by index.js"

**Ursache:** Neue Funktion/Variable in einer Datei definiert, aber nicht aus dem Package-Index exportiert.

**Lösung:**
1. In `packages/[package]/src/index.js` prüfen, ob der Export vorhanden ist
2. Falls nicht: Export hinzufügen
3. Beispiel: `boatClassCategories` in `@tsc/data`:

```javascript
// packages/data/src/index.js
export {
  boatClasses,
  boatClassCategories,  // ← Hinzugefügt
  getBoatClass,
  ...
} from './boatClasses';
```

### Filter-Logik bei "Meine X" Seiten (14.01.2026)

**Problem:** "Meine Veranstaltungen" zeigt keine Events an

**Ursache:** Filter war nach `boatClassId` (von Profil), nicht nach Creator.

**Lösung:** Filter nach `trainerId === user?.id` (wer hat es erstellt):

```javascript
// ❌ FALSCH - filtert nach Profil-Einstellung
const myEvents = events.filter(e => e.boatClassId === currentBoatClassId);

// ✅ RICHTIG - filtert nach Ersteller
const myEvents = events.filter(e => e.trainerId === user?.id);
```

### Datenquellen für Statistiken kombinieren (14.01.2026)

**Problem:** Jahresauswertung zeigte nur Saisonplanung-Events, nicht Startgelder-Regatten.

**Lösung:** Mehrere Tabellen laden und zusammenführen:

```javascript
// 1. Event-Registrierungen laden
const { data: eventRegs } = await supabase.from('event_registrations').select('...');

// 2. Startgelder-Einträge laden
const { data: regattaEntries } = await supabase.from('regatta_entries').select('...');

// 3. Zusammenführen mit einheitlichem Format
const allRegistrations = [...formatEventRegs(eventRegs), ...formatRegattaEntries(regattaEntries)];
```

### UI-Komponenten Positionierung (14.01.2026)

**Floating Buttons (unten links):**
- **Feedback-Button:** `fixed bottom-6 left-6` - runder Button (w-10 h-10)
- **Donate-Button:** `fixed bottom-6 left-[4.5rem]` - daneben positioniert (h-10)

Beide Buttons haben die gleiche Höhe (`h-10` = 40px) für einheitliches Aussehen.

**Rechts unten reserviert für:** "Powered by Aitema" Badge

### API Key in Git-History exponiert (16.01.2026)

**Problem:** GitHub Security Alert - Google API Key wurde in `scripts/veo/generate-header.js` exponiert.

**Ursache:** Hardcoded API Key als Fallback: `process.env.VEO_API_KEY || 'AIzaSy...'`

**Lösung:**
1. Hardcoded Fallback entfernt, nur noch Umgebungsvariable
2. Git-History mit `filter-branch` bereinigt
3. Alte Refs und Reflog gelöscht
4. Force-Push zu GitHub
5. GitHub Security Alert als "revoked" geschlossen

**Vermeidung:**
1. **NIEMALS** API Keys hardcoden, auch nicht als Fallback
2. **IMMER** Umgebungsvariablen verwenden
3. **Fehler werfen** wenn Key nicht gesetzt ist, nicht stillschweigend Fallback nutzen
4. **Pre-commit hooks** einrichten um Secrets zu erkennen (z.B. `detect-secrets`)
5. `.gitignore` für `.env` Dateien sicherstellen

**Befehle für History-Bereinigung:**
```bash
git stash
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force --tree-filter \
  "sed -i 's/EXPOSED_KEY/REMOVED/g' path/to/file 2>/dev/null || true" \
  --tag-name-filter cat -- --all
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git stash pop
git push --force origin master
```

---

## 🎁 Shared UI-Komponenten (@tsc/ui)

| Komponente | Beschreibung |
|------------|--------------|
| `GlassCard` | Glassmorphism Card mit shimmer/hover Effekten |
| `Button` | Multi-variant Button (primary, outline, dark, etc.) |
| `Modal` | Responsive Modal Dialog |
| `ToastProvider`, `useToast` | Toast Notifications |
| `IconBadge` | Farbige Icon Badges |
| `Icons` | SVG Icon Collection |
| `FeedbackWidget` | Bug/Feature Reporting Widget (unten links) |
| `DonateButton` | Dezenter Spenden-Button (neben FeedbackWidget) |
| `ThemeProvider`, `useTheme` | Dark/Light Mode |

### DonateButton verwenden

```jsx
import { FeedbackWidget, DonateButton } from '@tsc/ui';

// In jedem Modul (außer Spendenportal):
<FeedbackWidget appName="ModulName" />
<DonateButton />
```
