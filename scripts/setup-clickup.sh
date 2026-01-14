#!/bin/bash
# ClickUp TSC Jugend Plattform Setup Script
# Creates a new folder and lists for TSC project with documentation

set -e

# Configuration - UPDATE THIS TOKEN!
CLICKUP_TOKEN="${CLICKUP_API_TOKEN:-pk_90152104402_YOUR_TOKEN_HERE}"
SPACE_ID="90158816288"  # Aitema Space
BASE_URL="https://api.clickup.com/api/v2"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Setting up Sailhub in ClickUp...${NC}"

# 1. Create Folder for Sailhub
echo -e "\n${GREEN}1. Creating Sailhub Folder...${NC}"
FOLDER_RESPONSE=$(curl -s -X POST "$BASE_URL/space/$SPACE_ID/folder" \
  -H "Authorization: $CLICKUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "⛵ Sailhub"}')

FOLDER_ID=$(echo $FOLDER_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   Folder ID: $FOLDER_ID"

# 2. Create Lists
echo -e "\n${GREEN}2. Creating Lists...${NC}"

# Bugs List
BUGS_RESPONSE=$(curl -s -X POST "$BASE_URL/folder/$FOLDER_ID/list" \
  -H "Authorization: $CLICKUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "🐛 Bugs", "status": "to do"}')
BUGS_LIST_ID=$(echo $BUGS_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   Bugs List ID: $BUGS_LIST_ID"

# Features List
FEATURES_RESPONSE=$(curl -s -X POST "$BASE_URL/folder/$FOLDER_ID/list" \
  -H "Authorization: $CLICKUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "✨ Features", "status": "to do"}')
FEATURES_LIST_ID=$(echo $FEATURES_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   Features List ID: $FEATURES_LIST_ID"

# Documentation List
DOCS_RESPONSE=$(curl -s -X POST "$BASE_URL/folder/$FOLDER_ID/list" \
  -H "Authorization: $CLICKUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "📚 Documentation", "status": "to do"}')
DOCS_LIST_ID=$(echo $DOCS_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   Docs List ID: $DOCS_LIST_ID"

# 3. Create Documentation Tasks
echo -e "\n${GREEN}3. Creating Documentation Tasks...${NC}"

# Project Overview
curl -s -X POST "$BASE_URL/list/$DOCS_LIST_ID/task" \
  -H "Authorization: $CLICKUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "📋 Project Overview",
    "markdown_description": "# TSC Jugend Plattform\n\n## Übersicht\nDie TSC Jugend Plattform ist eine modulare Web-Applikation für den Tegeler Segel-Club. Sie besteht aus 9 Apps:\n\n- **web** - Hauptportal mit Dashboard\n- **startgelder** - Regatta-Startgelder Verwaltung\n- **saisonplanung** - Saisonplanung und Kalender\n- **eventanmeldung** - Event-Registrierung\n- **schadensmeldung** - Schadensberichte\n- **saisoncharter** - Boot-Charter\n- **jugendleistungsfonds** - Förderanträge\n- **jahresauswertung** - Jahresstatistiken\n- **spendenportal** - Spenden-Management\n\n## Tech Stack\n- React 18 + Vite\n- TailwindCSS\n- Supabase (Self-hosted)\n- Gemini AI Integration\n\n## Deployment\n- URL: https://sailhub.aitema.de\n- Server: Hetzner (49.13.15.44)\n- Container: Docker + Nginx + Traefik",
    "status": "complete",
    "priority": 3
  }' > /dev/null
echo "   ✓ Project Overview"

# Architecture Doc
curl -s -X POST "$BASE_URL/list/$DOCS_LIST_ID/task" \
  -H "Authorization: $CLICKUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "🏗️ Architektur & Infrastruktur",
    "markdown_description": "# Architektur\n\n## Monorepo Struktur\n```\ntsc-jugend-plattform/\n├── apps/           # 9 React Apps\n├── packages/\n│   ├── ui/         # Shared Components\n│   ├── supabase/   # Auth + API Client\n│   ├── config/     # Shared Config\n│   └── data/       # Shared Types\n└── supabase/\n    └── migrations/ # DB Schema\n```\n\n## Infrastructure\n- **Traefik**: Reverse Proxy + SSL\n- **Nginx**: Static File Serving\n- **Supabase**: PostgreSQL + Auth + Storage\n- **Gemini AI**: Manage2Sail Scraping + Ticket Analysis\n\n## CI/CD\n- Local Build: `pnpm build`\n- Deploy: Docker Image → Server",
    "status": "complete",
    "priority": 3
  }' > /dev/null
echo "   ✓ Architecture Doc"

# Ticket System Doc
curl -s -X POST "$BASE_URL/list/$DOCS_LIST_ID/task" \
  -H "Authorization: $CLICKUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "🎫 Ticket System (ClickUp + GitHub)",
    "markdown_description": "# AI-Powered Ticket System\n\n## Workflow\n1. User klickt Feedback-Button in der App\n2. Formular wird ausgefüllt\n3. **Gemini AI** analysiert:\n   - Kategorie (bug/feature/ux/question)\n   - Priorität (critical/high/medium/low)\n   - Aufwandschätzung\n4. **GitHub Issue** wird erstellt mit Labels\n5. **ClickUp Task** wird erstellt mit GitHub-Link\n\n## Files\n- `packages/supabase/src/tickets.js` - Service\n- `packages/ui/src/FeedbackWidget.jsx` - UI\n\n## Environment Variables\n```\nVITE_CLICKUP_API_TOKEN=pk_...\nVITE_GITHUB_TOKEN=ghp_...\nVITE_GEMINI_API_KEY=...\n```",
    "status": "complete",
    "priority": 2
  }' > /dev/null
echo "   ✓ Ticket System Doc"

# Manage2Sail Integration
curl -s -X POST "$BASE_URL/list/$DOCS_LIST_ID/task" \
  -H "Authorization: $CLICKUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "⛵ Manage2Sail Integration",
    "markdown_description": "# Manage2Sail Scraping\n\n## Übersicht\nAutomatische Extraktion von Regatta-Daten aus manage2sail.com URLs.\n\n## Technologie\n- **Gemini 3.0 Flash** mit Google Search Grounding\n- Fallback: Firecrawl/Puppeteer\n\n## Extrahierte Daten\n- Regatta Name + Datum\n- Location\n- Teilnehmerzahl\n- Wettfahrten\n- Ergebnisliste (mit Segelnummern)\n\n## Automatisches Matching\nWenn Sailor-Profil eine Segelnummer hat, wird die Platzierung automatisch gefunden.\n\n## Files\n- `packages/supabase/src/manage2sail.js`\n- `apps/startgelder/src/context/DataContext.jsx`",
    "status": "complete",
    "priority": 2
  }' > /dev/null
echo "   ✓ Manage2Sail Integration"

# Deployment Guide
curl -s -X POST "$BASE_URL/list/$DOCS_LIST_ID/task" \
  -H "Authorization: $CLICKUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "🚀 Deployment Guide",
    "markdown_description": "# Deployment auf sailhub.aitema.de\n\n## Quick Deploy\n```bash\ncd /path/to/tsc-jugend-plattform\npnpm build\ntar -czf sailhub-deploy.tar.gz Dockerfile nginx.conf apps/*/dist\nscp sailhub-deploy.tar.gz root@49.13.15.44:/root/sailhub/\nssh root@49.13.15.44 \"cd /root/sailhub && tar -xzf sailhub-deploy.tar.gz && docker build -t sailhub:latest . && docker stop sailhub && docker rm sailhub && docker run -d --name sailhub --restart unless-stopped --network hetzner-stack_web -l traefik.enable=true -l traefik.http.routers.sailhub.rule=Host(sailhub.aitema.de) -l traefik.http.routers.sailhub.entrypoints=websecure -l traefik.http.routers.sailhub.tls.certresolver=letsencrypt -l traefik.http.services.sailhub.loadbalancer.server.port=80 sailhub:latest\"\n```\n\n## DNS\nA Record: `sailhub → 49.13.15.44`",
    "status": "complete",
    "priority": 2
  }' > /dev/null
echo "   ✓ Deployment Guide"

# Update .env with new List IDs
echo -e "\n${GREEN}4. Updating configuration...${NC}"
echo ""
echo "Add these to your .env file:"
echo "VITE_CLICKUP_TSC_LIST_ID=$BUGS_LIST_ID"
echo ""

echo -e "\n${BLUE}✅ TSC Jugend Plattform setup complete!${NC}"
echo ""
echo "Created:"
echo "  - Folder: TSC Jugend Plattform"
echo "  - Lists: Bugs, Features, Documentation"
echo "  - 5 Documentation Tasks"
echo ""
echo "View in ClickUp: https://app.clickup.com/$SPACE_ID/v/li/$DOCS_LIST_ID"
