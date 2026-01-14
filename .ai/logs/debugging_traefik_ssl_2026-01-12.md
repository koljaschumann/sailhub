# Debugging: Traefik/SSL & Build-Deployment - 2026-01-12

## Problem
1. Build auf Google Drive scheiterte wegen File-Locking
2. Nach Deploy: 500 Internal Server Error (Nginx Redirect Loop)
3. Supabase API nicht erreichbar (SSL-Zertifikat ungültig)
4. Equipment-Buttons werden nicht angezeigt

## Root Cause(s)
1. **Google Drive Sync** sperrt Dateien während pnpm Rename-Operationen
2. **Nginx-Config** war für alte Standalone-Module konfiguriert, nicht für SPA
3. **.env fehlte** im Build-Ordner → Vite nutzte Placeholder-URLs
4. **Traefik YAML-Fehler** → docker-compose.yml hat Syntax-Problem in Zeile 28
5. **SSL-Zertifikat** konnte nicht ausgestellt werden wegen fehlendem acme.json

## Fehlgeschlagene Versuche

### Build-Probleme
1. `pnpm install` auf Google Drive → ENOENT Fehler (File-Locking)
2. Google Drive beenden → Laufwerk nicht mehr verfügbar
3. Verschiedene Shells (CMD, PowerShell, Git Bash) → Alle scheiterten auf G:\

### SSL-Probleme
1. `docker compose restart kong` → docker-compose nicht installiert
2. SNIPPETS_MANAGEMENT_FOLDER setzen → Half nicht für Studio-Fehler
3. sailhub.rule mit escaped quotes `\'` → YAML-Fehler, musste Backticks sein
4. `tr -d '\r'` für Windows-Zeilenumbrüche → YAML-Fehler blieb

## Lösungen (teilweise)

### Build ✅
- Projekt nach `C:\Dev\sailhub` kopiert
- Dort `pnpm install` und `pnpm build` erfolgreich
- .env in `apps/web/` erstellt mit VITE_SUPABASE_URL und ANON_KEY

### Nginx ✅
- SPA-Config erstellt mit `try_files $uri $uri/ /index.html`
- In Container kopiert: `docker cp nginx-spa.conf sailhub:/etc/nginx/nginx.conf`
- Nginx reload: `docker exec sailhub nginx -s reload`

### Traefik ❌ (noch offen)
- sailhub.rule auf Backticks geändert: `Host(\`sailhub.aitema.de\`)`
- DOMAIN=aitema.de in .env gesetzt
- acme.json erstellt mit chmod 600
- **BLOCKIERT:** YAML-Fehler in Zeile 28 verhindert Stack-Start

## Offene Punkte
1. YAML-Fehler in `/root/hetzner-stack/docker-compose.yml` fixen
2. Traefik neu starten
3. SSL für supabase.aitema.de verifizieren
4. Equipment-Buttons in Schadensmeldung testen

## Lessons Learned
1. **Google Drive + pnpm = Probleme** → Immer lokal builden
2. **Vite braucht .env** in der App, nicht im Root
3. **YAML ist empfindlich** → Backticks für Traefik Labels, keine escaped Quotes
4. **Server hat kein nano** → vi nutzen oder sed
5. **Backup vor Änderungen** → docker-compose.yml.backup existiert

## Nützliche Befehle
```bash
# YAML prüfen
docker compose config

# Traefik Logs
docker logs traefik --tail 50

# PostgreSQL direkt
docker exec -it supabase-db psql -U postgres -d postgres

# Container Status
docker ps | grep supabase
```
