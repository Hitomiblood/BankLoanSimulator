# Bank Loan Simulator - Frontend

Aplicación web React + TypeScript + Vite para simulación y gestión de préstamos bancarios.

## 🚀 Características

- ✅ Autenticación JWT (Login/Register)
- ✅ Solicitud de préstamos
- ✅ Panel de administración para aprobar/rechazar préstamos
- ✅ Dashboard de usuario
- ✅ Manejo de errores robusto con ErrorBoundary
- ✅ Notificaciones Toast
- ✅ Testing con Jest + React Testing Library
- ✅ **Logging estructurado con Sentry** 🆕

## 📦 Tecnologías

- **React 19** con TypeScript
- **Vite** para bundling ultrarrápido
- **Material-UI (MUI)** para componentes
- **React Router v7** para navegación
- **Axios** para peticiones HTTP
- **React Toastify** para notificaciones
- **Sentry** para error tracking y monitoring 🆕
- **Jest + React Testing Library** para testing

## ⚙️ Configuración Inicial

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto frontend (copia `.env.example`):

```env
# Backend API
VITE_API_URL=http://localhost:5000

# Sentry Error Tracking (OPCIONAL)
# Obtén tu DSN en https://sentry.io/ después de crear una cuenta
# Deja vacío para deshabilitar Sentry en desarrollo
VITE_SENTRY_DSN=

# Información de la Aplicación
VITE_APP_VERSION=1.0.0
```

### 3. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## 📊 Sentry - Error Tracking (NUEVO)

### ¿Qué es?

Sentry captura automáticamente errores en producción y te proporciona:
- 🐛 Stack traces completos
- 👤 Información del usuario afectado
- 🔍 Breadcrumbs (pasos previos al error)
- 📊 Métricas de performance
- 🚨 Alertas automáticas

### Configuración Rápida

1. **Crear cuenta gratuita:** https://sentry.io/ (5,000 errores/mes gratis)
2. **Crear proyecto:** Selecciona plataforma "React"
3. **Obtener DSN:** Copia el DSN que te proporcionen
4. **Configurar:** Añade el DSN en tu archivo `.env`:
   ```env
   VITE_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7890123
   ```
5. **Reiniciar:** `npm run dev`

### Documentación Completa

Ver [SENTRY_GUIDE.md](./SENTRY_GUIDE.md) para:
- Guía completa de configuración
- Uso avanzado (breadcrumbs, contexto de usuario)
- Best practices
- Troubleshooting

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Modo normal
npm test

# Modo watch (recomendado en desarrollo)
npm run test:watch

# Con coverage
npm run test:coverage
```

### Coverage Actual

- **Statements:** 95%+
- **Branches:** 90%+
- **Functions:** 95%+
- **Lines:** 95%+

Ver [RESUMEN_TESTS_FRONTEND.md](./RESUMEN_TESTS_FRONTEND.md) para detalles completos.

---

## 🏗️ Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo con hot reload

# Build
npm run build        # Compilar para producción
npm run preview      # Preview del build de producción

# Testing
npm test             # Ejecutar tests una vez
npm run test:watch   # Ejecutar tests en modo watch
npm run test:coverage # Generar reporte de coverage

# Linting
npm run lint         # Ejecutar ESLint

# Git Hooks (automático)
# Pre-commit: lint + tests de archivos modificados
```

---

## 📁 Estructura del Proyecto

```
src/
├── api/
│   └── axios.tsx              # Cliente HTTP con interceptors + Sentry
├── auth/
│   └── AuthContext.tsx        # Context de autenticación + Sentry tracking
├── components/
│   ├── ErrorBoundary.tsx      # Captura errores de React + Sentry
│   ├── LoanCard.tsx
│   ├── Navbar.tsx
│   └── ProtectedRoute.tsx
├── config/
│   └── sentry.ts              # Configuración completa de Sentry 🆕
├── pages/
│   ├── AdminLoans.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── RequestLoan.tsx
│   └── UserLoans.tsx
├── utils/
│   └── errorHandler.ts        # Utilidades para manejo de errores
├── __tests__/                 # Tests unitarios e integración
└── main.tsx                   # Entry point + Inicialización Sentry
```

---

## 🛡️ Manejo de Errores

### Capas de Protección

1. **ErrorBoundary:** Captura errores de React → Sentry
2. **Axios Interceptor:** Maneja errores HTTP → Sentry
3. **Toast Notifications:** Feedback visual al usuario
4. **Sentry Logging:** Monitoreo en producción

### Ejemplo de Error Capturado en Sentry

```tsx
// Esto será capturado automáticamente
function ProblematicComponent() {
  const data = null;
  return <div>{data.field}</div>; // ❌ Error automático en Sentry
}

// O captura manual con contexto
import { captureError } from './config/sentry';

try {
  await processPayment(loanId);
} catch (error) {
  captureError(error, {
    context: "Payment Processing",
    loanId,
    userId: user.id
  });
}
```

Ver [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md) para más detalles.

---

## 🚀 Deployment

### Build de Producción

```bash
npm run build
```

Esto genera una carpeta `dist/` lista para deploy.

### Variables de Entorno en Producción

Asegúrate de configurar en tu proveedor de hosting:

```env
VITE_API_URL=https://api.tudominio.com
VITE_SENTRY_DSN=tu-dsn-de-produccion
VITE_APP_VERSION=1.0.0
```

### Proveedores Recomendados

- **Vercel:** Despliegue automático desde GitHub
- **Netlify:** CI/CD integrado
- **Azure Static Web Apps:** Integración con .NET backend
- **AWS Amplify:** Hosting escalable

---

## 📚 Documentación Adicional

- [TESTING.md](./TESTING.md) - Guía completa de testing
- [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md) - Manejo de errores
- [SENTRY_GUIDE.md](./SENTRY_GUIDE.md) - Guía completa de Sentry 🆕
- [RESUMEN_TESTS_FRONTEND.md](./RESUMEN_TESTS_FRONTEND.md) - Resumen de tests

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-feature`
3. Commit: `git commit -m 'Add nueva feature'`
4. Push: `git push origin feature/nueva-feature`
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

## 🆘 Soporte

¿Problemas? Revisa:
1. [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md)
2. [SENTRY_GUIDE.md](./SENTRY_GUIDE.md) - Sección Troubleshooting
3. Logs de consola del navegador
4. Dashboard de Sentry (si está configurado)

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
