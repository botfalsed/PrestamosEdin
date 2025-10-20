# Despliegue en Koyeb - PrestamosEdin

## Configuración Completada ✅

### Archivos Creados/Modificados para Koyeb:

1. **`.htaccess`** - Configuración principal de Apache
   - DirectoryIndex configurado correctamente
   - Reglas de reescritura para API y dashboard
   - Configuración CORS
   - Manejo de archivos estáticos

2. **`dashboard/.htaccess`** - Configuración específica del directorio dashboard
   - DirectoryIndex para evitar error 403
   - Redirección al dashboard principal

3. **`build/`** - Directorio con el build del dashboard React
   - Generado automáticamente desde `dashboard/build`
   - Contiene todos los archivos estáticos del frontend

4. **`Dockerfile`** - Actualizado para Koyeb
   - Configuración completa de Apache
   - Build automático del frontend React
   - Configuración de permisos y directorios

5. **`koyeb.toml`** - Configuración específica de Koyeb
   - Comandos de build
   - Variables de entorno
   - Configuración de recursos

## ✅ Solución al Error AH01276

El error `AH01276: No se puede servir el directorio /workspace/dashboard/: No se encontró ningún DirectoryIndex` ha sido resuelto mediante:

1. **DirectoryIndex configurado** en `.htaccess` principal y del dashboard
2. **Build del dashboard** creado y copiado al directorio `build/`
3. **Archivo index.html** creado en el directorio dashboard como fallback
4. **Configuración de Apache** actualizada en el Dockerfile

## Instrucciones de Despliegue

### 1. Preparar el repositorio
```bash
git add .
git commit -m "Configuración para despliegue en Koyeb - Error 403 resuelto"
git push origin main
```

### 2. Configurar en Koyeb
1. Conectar el repositorio de GitHub
2. Seleccionar el Dockerfile como método de build
3. Configurar las variables de entorno si es necesario
4. Desplegar

### 3. Variables de Entorno Recomendadas
```
NODE_ENV=production
PHP_VERSION=8.2
DOCUMENT_ROOT=/var/www/html
```

## ✅ Verificación - Conexiones Funcionando

### Conexiones que siguen funcionando:
- ✅ Dashboard React en puerto 3000 (desarrollo)
- ✅ Backend PHP en puerto 8080 (desarrollo)  
- ✅ PrestamosMobile en Expo (desarrollo)

### Endpoints a verificar en producción:
- `/` - Página principal (debe mostrar el dashboard)
- `/dashboard/` - Dashboard React (no debe dar error 403)
- `/api/status` - API status
- `/api/prestamos` - API de préstamos

## Estructura Final del Proyecto

```
PrestamosEdin/
├── .htaccess                 # ✅ Configuración Apache principal
├── Dockerfile               # ✅ Configuración Docker actualizada
├── koyeb.toml              # ✅ Configuración Koyeb
├── index.php               # Router principal PHP
├── build/                  # ✅ Build del dashboard React
├── dashboard/
│   ├── .htaccess          # ✅ Configuración Apache del dashboard
│   ├── index.html         # ✅ Fallback para DirectoryIndex
│   └── build/             # Build original de React
├── backend/               # API PHP
└── PrestamosMobile/       # App móvil Expo
```

## 🎯 Resumen de Cambios

- ✅ Error 403 resuelto creando build del dashboard
- ✅ DirectoryIndex configurado en .htaccess
- ✅ Configuración Apache actualizada
- ✅ Conexiones locales preservadas
- ✅ Proyecto listo para Koyeb

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