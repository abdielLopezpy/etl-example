# CrmETL - Sistema de ETL para CRM

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-lightgrey.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3.0+-orange.svg)](https://www.sqlite.org/)
[![Jest](https://img.shields.io/badge/Jest-29+-red.svg)](https://jestjs.io/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 🚀 **Sistema ETL robusto y escalable** para sincronización de datos CRM con HubSpot, implementado con TypeScript y arquitectura por capas.

## 📋 Descripción

CrmETL es un servicio de backend autocontenido que implementa un pipeline completo de ETL (Extracción, Transformación y Carga) para sincronizar datos de CRM desde HubSpot, junto con una API RESTful completa para operaciones CRUD sobre contactos y empresas.

### 🌟 Características Principales

- ✅ **Proceso ETL Completo**: Sincronización automática de datos desde la API de HubSpot
- ✅ **API RESTful**: Operaciones CRUD completas para Contactos y Empresas  
- ✅ **Arquitectura por Capas**: Patrón Controlador-Servicio-Repositorio
- ✅ **Validación Robusta**: Validación de datos con Zod y TypeScript
- ✅ **Logging Estructurado**: Sistema de logs JSON con Pino
- ✅ **Seguridad**: Middleware de seguridad con Helmet y rate limiting
- ✅ **Testing**: Suite de pruebas unitarias e integración con Jest (18 pruebas, 100% éxito)
- ✅ **TypeScript**: Tipado estático completo con configuración estricta
- ✅ **Base de Datos**: SQLite para simplicidad y portabilidad

### 📊 Estado del Proyecto

![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)
![Tests](https://img.shields.io/badge/Tests-18%2F18%20Passing-brightgreen)
![Coverage](https://img.shields.io/badge/Coverage-25%25-yellow)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

## 🏗️ Arquitectura

El proyecto sigue una arquitectura por capas limpia:

```
┌─────────────────────────────────────────┐
│              Controladores              │  ← Capa de Presentación (HTTP)
├─────────────────────────────────────────┤
│                Servicios                │  ← Capa de Lógica de Negocio
├─────────────────────────────────────────┤
│              Repositorios               │  ← Capa de Acceso a Datos
├─────────────────────────────────────────┤
│            Base de Datos SQLite         │  ← Capa de Persistencia
└─────────────────────────────────────────┘
```

### Estructura de Directorios

```
src/
├── controllers/          # Controladores HTTP (Express)
├── services/            # Lógica de negocio y orquestación
├── repositories/        # Acceso a datos y abstracción SQL
├── middleware/          # Middleware personalizado
├── types/              # Tipos TypeScript y esquemas Zod
├── utils/              # Utilidades y helpers
├── database/           # Configuración de base de datos
├── routes/             # Definición de rutas
├── test/               # Configuración de pruebas
└── server.ts           # Punto de entrada principal
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- npm 8+
- Token de acceso de HubSpot (App Privada)

### Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone <repository-url>
   cd crm-etl
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   ```

4. **Editar `.env`** con tus valores:
   ```env
   PORT=3000
   DB_PATH=./data/crm_etl.db
   HUBSPOT_ACCESS_TOKEN=your_hubspot_token_here
   HUBSPOT_API_BASE_URL=https://api.hubapi.com
   LOG_LEVEL=info
   NODE_ENV=development
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

### Configuración de HubSpot

1. **Crear una App Privada en HubSpot**:
   - Ve a tu cuenta de HubSpot → Settings → Integrations → Private Apps
   - Crear nueva app privada
   - Configurar scopes: `crm.objects.contacts.read` y `crm.objects.companies.read`

2. **Obtener el token de acceso**:
   - Copiar el token generado a la variable `HUBSPOT_ACCESS_TOKEN`

## 🎯 Uso

### Desarrollo

```bash
# Ejecutar en modo desarrollo (con hot reload)
npm run dev

# Construir el proyecto
npm run build

# Ejecutar en producción
npm start
```

### Inicializar Base de Datos

La base de datos se inicializa automáticamente al arrancar la aplicación. Para inicializar manualmente:

```bash
npm run db:init
```

### Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch

# Ejecutar pruebas con cobertura
npm run test:coverage
```

### Linting y Formateo

```bash
# Análisis estático con ESLint
npm run lint

# Corregir errores de linting automáticamente  
npm run lint:fix

# Formatear código con Prettier
npm run format
```

## 📚 API Documentation

El servidor expone los siguientes endpoints:

### Health Check
- **GET** `/health` - Estado del servidor

### API Information
- **GET** `/api` - Información de la API y endpoints disponibles

### ETL Endpoints
- **POST** `/api/etl/sync-crm` - Iniciar sincronización desde HubSpot
- **GET** `/api/etl/status` - Estado del proceso de sincronización
- **GET** `/api/etl/info` - Información de la última sincronización
- **GET** `/api/etl/health` - Health check del servicio ETL

### Companies Endpoints
- **GET** `/api/companies` - Obtener todas las empresas
- **GET** `/api/companies/:id` - Obtener empresa por ID
- **POST** `/api/companies` - Crear nueva empresa
- **PATCH** `/api/companies/:id` - Actualizar empresa
- **DELETE** `/api/companies/:id` - Eliminar empresa
- **GET** `/api/companies/stats` - Estadísticas de empresas

### Contacts Endpoints  
- **GET** `/api/contacts` - Obtener todos los contactos
- **GET** `/api/contacts/:id` - Obtener contacto por ID
- **GET** `/api/contacts/company/:companyId` - Obtener contactos por empresa
- **POST** `/api/contacts` - Crear nuevo contacto
- **PATCH** `/api/contacts/:id` - Actualizar contacto
- **DELETE** `/api/contacts/:id` - Eliminar contacto
- **GET** `/api/contacts/stats` - Estadísticas de contactos

### Ejemplos de Uso

#### Sincronizar datos desde HubSpot:
```bash
curl -X POST http://localhost:3000/api/etl/sync-crm
```

#### Obtener todas las empresas:
```bash
curl http://localhost:3000/api/companies
```

#### Crear un nuevo contacto:
```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "hubspot_id": "12345",
    "firstname": "John",
    "lastname": "Doe", 
    "email": "john.doe@example.com"
  }'
```

## 🗄️ Modelo de Datos

### Tabla: Companies
| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | TEXT | ID único local (UUID v4) | PK, No Nulo |
| hubspot_id | TEXT | ID del registro en HubSpot | No Nulo, Único |
| name | TEXT | Nombre de la empresa | No Nulo |
| domain | TEXT | Dominio web de la empresa | No Nulo |
| created_at | TEXT | Fecha de creación (ISO 8601) | No Nulo |

### Tabla: Contacts
| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | TEXT | ID único local (UUID v4) | PK, No Nulo |
| hubspot_id | TEXT | ID del registro en HubSpot | No Nulo, Único |
| firstname | TEXT | Nombre del contacto | - |
| lastname | TEXT | Apellido del contacto | - |
| email | TEXT | Email del contacto | No Nulo, Único |
| company_id | TEXT | Clave foránea a Companies | FK |
| created_at | TEXT | Fecha de creación (ISO 8601) | No Nulo |

### Relaciones
- Una empresa puede tener muchos contactos (1:N)
- Un contacto puede pertenecer a una empresa (opcional)

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Valor por Defecto | Requerido |
|----------|-------------|-------------------|-----------|
| `PORT` | Puerto del servidor | `3000` | No |
| `DB_PATH` | Ruta de la base de datos SQLite | `./data/crm_etl.db` | No |
| `HUBSPOT_ACCESS_TOKEN` | Token de acceso de HubSpot | - | **Sí** |
| `HUBSPOT_API_BASE_URL` | URL base de la API de HubSpot | `https://api.hubapi.com` | No |
| `LOG_LEVEL` | Nivel de logging | `info` | No |
| `NODE_ENV` | Entorno de ejecución | `development` | No |
| `RATE_LIMIT_WINDOW_MS` | Ventana de rate limiting (ms) | `900000` (15 min) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Máximo requests por ventana | `100` | No |

### Logging

El sistema utiliza Pino para logging estructurado:

- **Desarrollo**: Pretty print para mejor legibilidad
- **Producción**: JSON estructurado para análisis automatizado

Niveles de log disponibles: `fatal`, `error`, `warn`, `info`, `debug`, `trace`

### Rate Limiting

Por defecto, la API está limitada a:
- **100 requests** por IP cada **15 minutos**
- Personalizable via variables de entorno

### Seguridad

- **Helmet**: Headers de seguridad HTTP
- **CORS**: Configurado para desarrollo/producción
- **Rate Limiting**: Protección contra DoS
- **Validación**: Todos los inputs validados con Zod
- **Gestión de Secretos**: Tokens en variables de entorno

## 🧪 Testing

### Cobertura de Pruebas

El proyecto incluye una suite completa de pruebas:

- **Pruebas Unitarias**: Servicios, repositorios, utilidades
- **Pruebas de Integración**: API endpoints completos
- **Cobertura**: Objetivo del 90%+ en branches, funciones, líneas y statements

### Ejecutar Pruebas

```bash
# Todas las pruebas
npm test

# Pruebas específicas
npm test -- --testPathPattern=repositories

# Con cobertura
npm run test:coverage

# Modo watch durante desarrollo
npm run test:watch
```

### Configuración de Test

Las pruebas utilizan:
- **Jest** como framework de testing
- **Supertest** para pruebas de API
- **Base de datos en memoria** (`:memory:`) para isolation
- **Nock** para mocking de APIs externas (HubSpot)

## 📈 Monitoreo y Logging

### Estructura de Logs

```json
{
  "level": "info",
  "time": "2024-10-18T10:30:00.000Z",
  "service": "crm-etl",
  "version": "2.0.0",
  "msg": "CRM data synchronization completed",
  "contactsSynced": 150,
  "companiesSynced": 30,
  "duration": 5432
}
```

### Métricas Importantes

- Tiempo de respuesta de API
- Número de registros sincronizados
- Errores de sincronización
- Rate limiting hits
- Uptime del servicio

## 🚀 Despliegue

### Docker (Recomendado)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Proceso Manual

1. **Construir el proyecto**:
   ```bash
   npm run build
   ```

2. **Instalar solo dependencias de producción**:
   ```bash
   npm ci --only=production
   ```

3. **Configurar variables de entorno de producción**

4. **Ejecutar**:
   ```bash
   npm start
   ```

### Consideraciones de Producción

- [ ] Configurar CORS para orígenes específicos
- [ ] Usar HTTPS/SSL
- [ ] Configurar proxy reverso (nginx)
- [ ] Monitoreo y alertas
- [ ] Backup de base de datos SQLite
- [ ] Rotación de logs
- [ ] Health checks para load balancer

## 🔍 Troubleshooting

### Problemas Comunes

#### Error: "HUBSPOT_ACCESS_TOKEN is required"
- **Solución**: Verificar que la variable de entorno esté configurada correctamente

#### Error: "HubSpot API health check failed"  
- **Solución**: Verificar conectividad a internet y validez del token

#### Error: "SQLITE_CONSTRAINT"
- **Solución**: Violación de constraint (datos duplicados), verificar datos de entrada

#### Error de Rate Limiting (429)
- **Solución**: Esperar o ajustar límites en configuración

### Logs de Debug

Para debugging detallado:
```bash
LOG_LEVEL=debug npm run dev
```

### Verificar Conectividad HubSpot

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api.hubapi.com/crm/v3/objects/contacts?limit=1"
```

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit de cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Standards

- Seguir guía de estilo con ESLint/Prettier
- Mantener cobertura de pruebas >90%
- Documentar nuevas funcionalidades
- Usar conventional commits

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🎯 Roadmap

### Version 2.1
- [ ] Soporte para más CRMs (Salesforce, Pipedrive)
- [ ] Webhooks para sincronización en tiempo real
- [ ] API de GraphQL
- [ ] Dashboard web básico

### Version 2.2
- [ ] Soporte para PostgreSQL/MySQL
- [ ] Containerización completa con Docker Compose
- [ ] CI/CD con GitHub Actions
- [ ] Métricas con Prometheus

## 💬 Soporte

Si tienes preguntas o necesitas soporte:

- �‍💻 **Desarrollador**: [Abdiel López](https://github.com/abdielLopezpy)
- 🐛 **Issues**: [GitHub Issues](https://github.com/abdielLopezpy/crm-etl/issues)
- 📚 **Documentación**: Ver este README y comentarios en el código

## 🙏 Créditos

Este proyecto fue desarrollado siguiendo las mejores prácticas de desarrollo de software, implementando una arquitectura limpia y patrones de diseño modernos.

### Tecnologías Utilizadas

- **Backend**: Node.js con TypeScript y Express.js
- **Base de Datos**: SQLite3 con abstracción personalizada
- **Validación**: Zod para validación de esquemas TypeScript-first
- **Testing**: Jest para pruebas unitarias e integración
- **Logging**: Pino para logging estructurado de alto rendimiento
- **Seguridad**: Helmet, CORS, y rate limiting
- **Desarrollo**: ESLint, Prettier, ts-node-dev

---

**Desarrollado con ❤️ por [Abdiel López](https://github.com/abdielLopezpy)**
