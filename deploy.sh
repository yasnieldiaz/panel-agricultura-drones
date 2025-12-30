#!/bin/bash

# Deploy script for panel-agricultura-drones
# Usage: ./deploy.sh [frontend|api|all]

SERVER="root@188.137.65.235"
REMOTE_PATH="/var/www/vhosts/droneagri.pl/cieniowanie.droneagri.pl"
PASSWORD="Mariannadiaz1501"

deploy_frontend() {
    echo "📦 Building frontend..."
    npm run build

    if [ $? -ne 0 ]; then
        echo "❌ Build failed!"
        exit 1
    fi

    echo "🚀 Deploying frontend to server..."
    sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no -r dist/* "$SERVER:$REMOTE_PATH/"
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "chmod -R 755 $REMOTE_PATH && chmod 644 $REMOTE_PATH/assets/*"

    echo "✅ Frontend deployed!"
}

deploy_api() {
    echo "🚀 Deploying API to server..."
    sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no api/index.js api/package.json "$SERVER:$REMOTE_PATH/api/"

    echo "📦 Installing dependencies on server..."
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "cd $REMOTE_PATH/api && npm install"

    echo "🔄 Restarting API..."
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "pm2 restart panel-drones-api"

    echo "✅ API deployed!"
}

case "$1" in
    frontend)
        deploy_frontend
        ;;
    api)
        deploy_api
        ;;
    all|"")
        deploy_frontend
        deploy_api
        ;;
    *)
        echo "Usage: ./deploy.sh [frontend|api|all]"
        exit 1
        ;;
esac

echo ""
echo "🌐 Site: https://cieniowanie.droneagri.pl"
