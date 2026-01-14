# Debugging: Rollen-Anzeige & Seiten-Freeze - 14. Januar 2026

## Problem

Nach Login wurden zwei kritische Bugs gemeldet:
1. Dashboard zeigt "Rolle: Mitglied" statt der tatsächlichen Admin/Trainer-Rolle
2. Seite ist komplett eingefroren - nichts klickbar nach Login

## Root Cause

### Problem 1: Falsche Rolle
Die profiles-Tabelle in Supabase hatte die falschen Rollen gespeichert:
- `kolja.schumann@outlook.de` → role = 'eltern' (sollte 'admin' sein)
- `admin@tsc-jugend.de` → role = 'eltern' (sollte 'admin' sein)

### Problem 2: Seiten-Freeze
React Rules of Hooks Violation in mehreren Admin.jsx Dateien:
- useState wurde NACH conditional return aufgerufen
- React erwartet, dass Hooks in JEDER Render-Ausführung in der gleichen Reihenfolge aufgerufen werden
- Wenn ein early return VOR einem Hook kommt, wird der Hook manchmal aufgerufen und manchmal nicht → Crash

## Fehlgeschlagene Versuche

1. **pnpm install auf Google Drive** → Scheitert wegen File-Locking durch Sync-Prozess
2. **npm install** → Scheitert wegen workspace: Protocol (pnpm-spezifisch)

## Lösung

### Fix 1: Rollen in DB
```sql
UPDATE profiles SET role = 'admin'
WHERE email IN ('kolja.schumann@outlook.de', 'admin@tsc-jugend.de');
```

### Fix 2: React Hooks Order
Alle useState Hooks VOR die Access Control Checks verschoben in:
- `eventanmeldung/pages/Admin.jsx`
- `saisoncharter/pages/Admin.jsx`
- `jugendleistungsfonds/pages/Admin.jsx`
- `spendenportal/pages/Admin.jsx`

**Vorher (falsch):**
```javascript
if (!isAdmin && !isTrainer) {
  return <AccessDenied />;
}
const [state, setState] = useState();  // ← Nach return!
```

**Nachher (korrekt):**
```javascript
const [state, setState] = useState();  // ← Vor return!
if (!isAdmin && !isTrainer) {
  return <AccessDenied />;
}
```

### Build-Workaround
Projekt in lokalen /tmp Ordner kopiert und dort gebaut:
```bash
mkdir -p /tmp/sailhub-build
cp -r apps packages package.json pnpm-* /tmp/sailhub-build/
cd /tmp/sailhub-build && pnpm install && pnpm --filter web build
```

### Deployment
```bash
tar -czf /tmp/sailhub-dist.tar.gz -C apps/web/dist .
scp /tmp/sailhub-dist.tar.gz root@49.13.15.44:/tmp/
ssh root@49.13.15.44 "docker cp ... && docker exec sailhub sh -c '...'"
```

## Lessons Learned

1. **React Hooks Rules sind KRITISCH** - Niemals Hooks nach conditional returns
2. **Kommentar einfügen** in Admin-Seiten: `// All hooks must be called before any conditional returns`
3. **Google Drive + pnpm** vertragen sich nicht - Lokale Kopie für Build verwenden
4. **DB-Rollen prüfen** wenn Auth-Probleme auftreten: `SELECT email, role FROM profiles;`

## Status

- ✅ Fixes deployed auf https://sailhub.aitema.de
- ⏳ User-Test steht noch aus (morgen)
