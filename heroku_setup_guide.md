# 🚀 Guía de Despliegue en Heroku

## 📋 **PASOS PARA DESPLEGAR:**

### 1. **CREAR CUENTA EN HEROKU**
- Ve a: https://heroku.com
- Crea cuenta gratuita
- Instala Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli

### 2. **COMANDOS PARA DESPLEGAR**
```bash
# Login en Heroku
heroku login

# Crear aplicación
heroku create tu-app-prestamos

# Agregar PostgreSQL (GRATIS)
heroku addons:create heroku-postgresql:mini

# Subir código
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### 3. **CONFIGURAR BASE DE DATOS**
```bash
# Ver logs del setup automático
heroku logs --tail

# Si hay problemas, ejecutar manualmente:
heroku run php setup_heroku_database.php
```

### 4. **OBTENER URL DE TU API**
```bash
heroku open
```
Tu URL será: `https://tu-app-prestamos.herokuapp.com`

### 5. **ACTUALIZAR APK**
En tu APK, cambia la URL de:
```javascript
// ANTES
const API_URL = "http://localhost/backend/api_postgres.php"

// DESPUÉS  
const API_URL = "https://tu-app-prestamos.herokuapp.com/backend/api_postgres.php"
```

## ✅ **¡LISTO!**
- ✅ Backend en la nube
- ✅ PostgreSQL configurado
- ✅ APK funcionando

## 🆘 **SI HAY PROBLEMAS:**
```bash
# Ver logs
heroku logs --tail

# Reiniciar app
heroku restart

# Ver estado de la base de datos
heroku pg:info
```