#!/bin/bash
# Script de despliegue para panel-agricultura-drones
# Uso: ./deploy.sh [--skip-build] [--restart-api]

set -e

# Configuración del servidor
SERVER_HOST="188.137.65.235"
SERVER_USER="root"
SERVER_PASS="FisherYou1983"
SERVER_PATH="/var/www/vhosts/droneagri.pl/cieniowanie.droneagri.pl"
API_PATH="$SERVER_PATH/api"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para ejecutar comandos SSH
ssh_cmd() {
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "$1"
}

# Función para copiar archivos
scp_cmd() {
    sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -r "$1" "$SERVER_USER@$SERVER_HOST:$2"
}

echo -e "${GREEN}=== Desplegando Panel Agricultura Drones ===${NC}"

# Parsear argumentos
SKIP_BUILD=false
RESTART_API=false
for arg in "$@"; do
    case $arg in
        --skip-build) SKIP_BUILD=true ;;
        --restart-api) RESTART_API=true ;;
    esac
done

# 1. Build del frontend
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${YELLOW}[1/4] Compilando frontend...${NC}"
    npm run build
    echo -e "${GREEN}✓ Build completado${NC}"
else
    echo -e "${YELLOW}[1/4] Saltando build...${NC}"
fi

# 2. Subir archivos al servidor
echo -e "${YELLOW}[2/4] Subiendo archivos al servidor...${NC}"
scp_cmd "dist/*" "$SERVER_PATH/"
echo -e "${GREEN}✓ Archivos subidos${NC}"

# 3. Reiniciar API si es necesario
if [ "$RESTART_API" = true ]; then
    echo -e "${YELLOW}[3/4] Reiniciando API...${NC}"
    ssh_cmd "pm2 restart cieniowanie-api"
    echo -e "${GREEN}✓ API reiniciada${NC}"
else
    echo -e "${YELLOW}[3/4] Verificando estado de API...${NC}"
    API_STATUS=$(ssh_cmd "pm2 jlist" | grep -o '"name":"cieniowanie-api"[^}]*"status":"[^"]*"' | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$API_STATUS" = "online" ]; then
        echo -e "${GREEN}✓ API está online${NC}"
    else
        echo -e "${RED}✗ API no está online, iniciando...${NC}"
        ssh_cmd "cd $API_PATH && pm2 start index.js --name cieniowanie-api --max-memory-restart 200M --restart-delay 5000 && pm2 save"
        echo -e "${GREEN}✓ API iniciada${NC}"
    fi
fi

# 4. Verificar health check
echo -e "${YELLOW}[4/4] Verificando health check...${NC}"
sleep 2
HEALTH=$(curl -s "https://cieniowanie.droneagri.pl/api/health" | grep -o '"status":"ok"' || echo "")
if [ -n "$HEALTH" ]; then
    echo -e "${GREEN}✓ Health check OK${NC}"
else
    echo -e "${RED}✗ Health check fallido${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Despliegue completado exitosamente ===${NC}"
echo ""
echo "URL: https://cieniowanie.droneagri.pl"
echo "API: https://cieniowanie.droneagri.pl/api/health"
echo ""
echo "Credenciales admin:"
echo "  Email: admin@drone-partss.com"
echo "  Password: FisherYou1983"
