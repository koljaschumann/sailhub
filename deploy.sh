#!/bin/bash
# Sailhub Deployment Script
# Run this on the Hetzner server (49.13.15.44)

set -e

echo "🚀 Sailhub Deployment - sailhub.aitema.de"
echo "========================================="

# Configuration
DEPLOY_DIR="/root/sailhub"
STACK_DIR="/root/hetzner-stack"

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# Extract deployment package (if tar exists)
if [ -f "sailhub-deploy.tar.gz" ]; then
    echo "📦 Extracting deployment package..."
    tar -xzf sailhub-deploy.tar.gz
else
    echo "❌ Error: sailhub-deploy.tar.gz not found!"
    echo "   Please upload it first: scp sailhub-deploy.tar.gz root@49.13.15.44:$DEPLOY_DIR/"
    exit 1
fi

# Run Supabase migrations
echo "🗄️ Running Supabase migrations..."
for migration in supabase/migrations/*.sql; do
    echo "   Running: $(basename $migration)"
    docker exec -i supabase-db psql -U postgres -d postgres < "$migration" || echo "   Warning: Migration may have already been applied"
done

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t sailhub:latest .

# Add to docker-compose if not exists
if ! grep -q "sailhub:" $STACK_DIR/docker-compose.yml; then
    echo "📝 Adding sailhub service to docker-compose..."
    cat >> $STACK_DIR/docker-compose.yml << 'EOF'

  # Sailhub - TSC Jugend Plattform
  sailhub:
    image: sailhub:latest
    container_name: sailhub
    restart: unless-stopped
    networks:
      - web
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.sailhub.rule=Host(\`sailhub.aitema.de\`)"
      - "traefik.http.routers.sailhub.entrypoints=websecure"
      - "traefik.http.routers.sailhub.tls.certresolver=letsencrypt"
      - "traefik.http.services.sailhub.loadbalancer.server.port=80"
EOF
fi

# Restart services
echo "🔄 Starting sailhub container..."
cd $STACK_DIR
docker compose up -d sailhub

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Add DNS A record: sailhub.aitema.de -> 49.13.15.44"
echo "   2. Wait for SSL certificate (automatic via Traefik)"
echo "   3. Access: https://sailhub.aitema.de/"
echo ""
echo "🧪 Test URLs:"
echo "   - Main:          https://sailhub.aitema.de/"
echo "   - Startgelder:   https://sailhub.aitema.de/startgelder/"
echo "   - Saisonplanung: https://sailhub.aitema.de/saisonplanung/"
