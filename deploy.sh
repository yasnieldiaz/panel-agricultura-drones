#!/bin/bash
# Script de despliegue para panel-agricultura-drones

SERVER_PATH="/var/www/cieniowanie.droneagri.pl"
API_PATH="$SERVER_PATH/api"

echo "=== Desplegando Panel Agricultura Drones ==="

# 1. Actualizar contraseña del admin
echo "Actualizando contraseña del admin..."
cd $API_PATH
node -e "
const bcrypt = require('bcryptjs');
const db = require('better-sqlite3')('./database.sqlite');
const hash = bcrypt.hashSync('FisherYou1983', 10);
db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hash, 'admin@drone-partss.com');
console.log('Password actualizado correctamente');
"

echo "=== Despliegue completado ==="
echo "Credenciales admin:"
echo "  Email: admin@drone-partss.com"
echo "  Password: FisherYou1983"
