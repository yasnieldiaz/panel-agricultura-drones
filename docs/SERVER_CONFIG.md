# Configuracion del Servidor de Produccion

## Informacion del Servidor

| Campo | Valor |
|-------|-------|
| **IP** | 188.137.65.235 |
| **Dominio** | cieniowanie.droneagri.pl |
| **Panel** | Plesk |
| **OS** | AlmaLinux |

## Servicios PM2

```bash
# Ver estado de los servicios
pm2 list

# Servicios activos:
# - academy         (puerto 8080) - Next.js academy
# - cieniowanie-api (puerto 3001) - API Express para panel-agricultura-drones
# - droneagri       (puerto 3000) - Next.js principal
```

### Comandos utiles PM2

```bash
# Reiniciar todos los servicios
pm2 restart all

# Reiniciar solo la API de cieniowanie
pm2 restart cieniowanie-api

# Ver logs
pm2 logs cieniowanie-api

# Guardar configuracion (para que inicie al reiniciar)
pm2 save

# Ver estado detallado
pm2 show cieniowanie-api
```

## Estructura de Archivos

```
/var/www/vhosts/droneagri.pl/cieniowanie.droneagri.pl/
├── index.html          # Frontend React (build de Vite)
├── assets/             # JS, CSS compilados
├── api/                # Backend Express
│   ├── index.js        # Servidor principal
│   ├── package.json    # Dependencias
│   ├── .env            # Variables de entorno
│   └── node_modules/   # Dependencias instaladas
├── logo.png
├── manifest.json       # PWA manifest
└── sw.js               # Service Worker
```

## Configuracion Nginx

La configuracion de proxy para la API esta en:
```
/var/www/vhosts/system/cieniowanie.droneagri.pl/conf/vhost_nginx.conf
```

Contenido:
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

### Recargar Nginx

```bash
nginx -t && systemctl reload nginx
```

## Base de Datos

- **Tipo**: MySQL (produccion)
- **Conexion**: Configurada en `/var/www/vhosts/droneagri.pl/cieniowanie.droneagri.pl/api/.env`

## URLs de la Aplicacion

| Endpoint | URL |
|----------|-----|
| **Frontend** | https://cieniowanie.droneagri.pl |
| **API Health** | https://cieniowanie.droneagri.pl/api/health |
| **API Login** | https://cieniowanie.droneagri.pl/api/auth/login |

## Troubleshooting

### API devuelve 502 Bad Gateway

1. Verificar que PM2 este corriendo la API:
   ```bash
   pm2 list
   ```

2. Si no esta corriendo, iniciarla:
   ```bash
   cd /var/www/vhosts/droneagri.pl/cieniowanie.droneagri.pl/api
   pm2 start index.js --name 'cieniowanie-api'
   pm2 save
   ```

3. Recargar nginx:
   ```bash
   systemctl reload nginx
   ```

### Ver logs de errores

```bash
# Logs de la API
pm2 logs cieniowanie-api

# Logs de Nginx
tail -f /var/www/vhosts/system/cieniowanie.droneagri.pl/logs/proxy_error_log
```

## Despliegue

Para desplegar una nueva version:

1. Hacer build local:
   ```bash
   npm run build
   ```

2. Subir archivos al servidor:
   ```bash
   scp -r dist/* root@188.137.65.235:/var/www/vhosts/droneagri.pl/cieniowanie.droneagri.pl/
   ```

3. Si hay cambios en la API:
   ```bash
   scp -r api/* root@188.137.65.235:/var/www/vhosts/droneagri.pl/cieniowanie.droneagri.pl/api/
   pm2 restart cieniowanie-api
   ```

---

## Prevencion de Caidas (Auto-recovery)

### 1. PM2 Startup (Inicio automatico)

PM2 esta configurado para iniciar automaticamente cuando el servidor se reinicia:

```bash
# Verificar que este habilitado
systemctl is-enabled pm2-root

# Si necesitas reconfigurarlo
pm2 startup
pm2 save
```

### 2. Script de Monitoreo

Hay un script que verifica la API cada 5 minutos y la reinicia si esta caida:

**Ubicacion**: `/root/check-api.sh`

```bash
#!/bin/bash
API_URL="http://localhost:3001/api/health"
LOG_FILE="/var/log/api-monitor.log"

response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ "$response" != "200" ]; then
    echo "$(date): API caida. Reiniciando..." >> $LOG_FILE
    pm2 restart cieniowanie-api
else
    echo "$(date): API OK" >> $LOG_FILE
fi
```

### 3. Cron Job

El script se ejecuta automaticamente cada 5 minutos:

```bash
# Ver cron job
crontab -l | grep check-api

# Resultado: */5 * * * * /root/check-api.sh
```

### 4. Ver Logs de Monitoreo

```bash
tail -f /var/log/api-monitor.log
```

---

*Ultima actualizacion: 2026-01-15*
