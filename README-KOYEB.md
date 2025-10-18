# Despliegue en Koyeb - Sistema de Préstamos

Este proyecto está configurado para desplegarse en Koyeb usando Docker y orquestación de servicios.

## Estructura del Proyecto

```
Prestamos/
├── backend/                 # API PHP con PostgreSQL
├── dashboard/              # Frontend React
├── Dockerfile.backend      # Docker para PHP/Apache
├── Dockerfile.frontend     # Docker para React/Nginx
├── docker-compose.yml      # Orquestación local
├── koyeb.yaml             # Configuración de Koyeb
├── nginx.conf             # Configuración Nginx
├── .dockerignore          # Archivos excluidos de Docker
└── prestamodb.sql         # Schema de base de datos
```

## Servicios

### 1. Backend (PHP + Apache)
- **Puerto**: 80
- **Base**: php:8.2-apache
- **Extensiones**: pdo, pdo_pgsql
- **Archivos**: `/var/www/html/`

### 2. Frontend (React + Nginx)
- **Puerto**: 80
- **Build**: Multi-stage (Node.js → Nginx)
- **Proxy**: Configurado para API backend

### 3. Base de Datos
- **Tipo**: PostgreSQL 15
- **Inicialización**: prestamodb.sql

## Variables de Entorno Requeridas

```bash
# Base de datos
DB_PASSWORD=tu_password_seguro
DB_USER=postgres

# Koyeb (se configuran automáticamente)
DATABASE_URL=postgresql://...
KOYEB_APP_ID=tu_app_id
```

## Despliegue en Koyeb

### Opción 1: Usando koyeb.yaml
```bash
# Conectar repositorio Git a Koyeb
# El archivo koyeb.yaml se detectará automáticamente
```

### Opción 2: Configuración Manual
1. Crear aplicación en Koyeb
2. Configurar servicios:
   - Backend: Dockerfile.backend
   - Frontend: Dockerfile.frontend
3. Configurar base de datos PostgreSQL
4. Establecer variables de entorno

## Desarrollo Local

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar servicios
docker-compose down
```

## URLs de Acceso

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8080
- **Base de datos**: localhost:5432

## Características Implementadas

✅ Sincronización en tiempo real
✅ Sistema de notificaciones
✅ Gestión de préstamos y pagos
✅ Dashboard administrativo
✅ Arquitectura de microservicios
✅ Configuración para producción

## Notas Importantes

- Los Dockerfiles están optimizados para producción
- La configuración de nginx incluye proxy para la API
- El sistema de sincronización funciona entre servicios
- Las variables de entorno se configuran automáticamente en Koyeb