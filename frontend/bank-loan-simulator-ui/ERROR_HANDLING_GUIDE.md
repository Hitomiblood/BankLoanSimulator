# 🛡️ Guía de Manejo de Errores

## 📋 Resumen de Implementación

Esta guía documenta el sistema completo de manejo de errores implementado en la aplicación Bank Loan Simulator.

## 🎯 Componentes Implementados

### 1. **ErrorBoundary** - Captura de Errores de React

**Ubicación:** `src/components/ErrorBoundary.tsx`

**Funcionalidad:**
- Captura errores de React en cualquier componente hijo
- Muestra una UI de fallback elegante
- Previene que toda la aplicación se rompa
- Muestra detalles técnicos en modo desarrollo

**Uso:**
```tsx
// Ya integrado en App.tsx envolviendo toda la aplicación
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Características:**
- ✅ UI amigable con mensaje de error
- ✅ Botón para reintentar
- ✅ Detalles técnicos en desarrollo
- ✅ Logging a consola
- ✅ **Integrado con Sentry** - Envía errores automáticamente 🆕

---

### 2. **Interceptor de Axios** - Manejo Centralizado HTTP

**Ubicación:** `src/api/axios.tsx`

**Funcionalidad:**
- Manejo automático de errores HTTP comunes
- Redirección automática en 401 (no autenticado)
- Toast notifications automáticas para errores críticos
- Re-lanzamiento del error para manejo específico

**Errores Manejados Automáticamente:**

| Código | Acción Automática |
|--------|-------------------|
| 401 | Logout + Toast + Redirect a /login |
| 403 | Toast: "No tienes permisos" |
| 404 | Toast: "Recurso no encontrado" |
| 500 | Toast: "Error del servidor" |
| 503 | Toast: "Servicio no disponible" |
| Red | Toast: "Sin conexión al servidor" |

**Código:**
```tsx
// Request interceptor - Añade token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

// Response interceptor - Manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejo centralizado según status code
    // Toast automático para errores críticos
    return Promise.reject(error);
  }
);
```

---

### 3. **Utilidades de Manejo de Errores**

**Ubicación:** `src/utils/errorHandler.ts`

**Funciones Disponibles:**

#### `parseAxiosError(error: unknown): string`
Parsea errores de Axios y devuelve mensajes amigables.

```tsx
try {
  await api.post('/endpoint', data);
} catch (error) {
  const message = parseAxiosError(error);
  console.log(message); // "Solicitud inválida. Por favor verifica..."
}
```

#### `showErrorToast(error: unknown, customMessage?: string)`
Muestra toast de error con mensaje personalizado o automático.

```tsx
try {
  await api.post('/loans', loanData);
} catch (error) {
  showErrorToast(error, 'No se pudo crear el préstamo');
}
```

#### `showSuccessToast(message: string)`
Muestra toast de éxito.

```tsx
showSuccessToast('¡Préstamo creado exitosamente!');
```

#### `showInfoToast(message: string)`
Muestra toast informativo.

```tsx
showInfoToast('Procesando tu solicitud...');
```

#### `showWarningToast(message: string)`
Muestra toast de advertencia.

```tsx
showWarningToast('Por favor completa todos los campos');
```

#### `handleError(error: unknown, customMessage?: string, logToConsole?: boolean)`
Manejo completo: log + toast.

```tsx
try {
  // operación
} catch (error) {
  handleError(error, 'Operación fallida', true);
}
```

#### `withErrorHandling<T>(fn: T, customErrorMessage?: string): T`
Wrapper para funciones asíncronas con manejo automático.

```tsx
const safeFetchLoans = withErrorHandling(
  async () => {
    const response = await api.get('/loans');
    return response.data;
  },
  'Error al cargar préstamos'
);

// Uso
await safeFetchLoans();
```

---

### 4. **Sistema de Toast Notifications**

**Biblioteca:** `react-toastify`
**Configuración:** `App.tsx`

**Estilos de Toast:**
- ✅ Success (verde) - Operaciones exitosas
- ❌ Error (rojo) - Errores y fallos
- ⚠️ Warning (amarillo) - Advertencias
- ℹ️ Info (azul) - Información general

**Configuración Global:**
```tsx
<ToastContainer 
  position="top-right"
  autoClose={5000}
  hideProgressBar={false}
  newestOnTop
  closeOnClick
  draggable
  pauseOnHover
  theme="light"
/>
```

**Personalización:**
```tsx
toast.success('Mensaje', {
  position: 'bottom-center',
  autoClose: 3000,
  hideProgressBar: true,
});
```

---

## 📚 Ejemplos de Uso en Componentes

### Ejemplo 1: Login con Manejo de Errores

```tsx
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

const handleLogin = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    showSuccessToast('¡Inicio de sesión exitoso!');
    navigate('/dashboard');
  } catch (error) {
    // El interceptor ya maneja errores comunes (401, 500, etc.)
    // Solo manejamos casos específicos
    if (error.response?.status === 400) {
      showErrorToast(error, 'Credenciales inválidas');
    } else {
      showErrorToast(error);
    }
  }
};
```

### Ejemplo 2: Solicitar Préstamo

```tsx
import { showErrorToast, showSuccessToast, showWarningToast } from '../utils/errorHandler';

const handleSubmit = async () => {
  // Validación con warning
  if (!amount || !interestRate) {
    showWarningToast('Por favor completa todos los campos');
    return;
  }

  setLoading(true);
  try {
    await api.post('/loans', { amount, interestRate, termInMonths });
    showSuccessToast('¡Préstamo solicitado exitosamente!');
    navigate('/loans');
  } catch (error) {
    showErrorToast(error, 'No se pudo procesar tu solicitud');
  } finally {
    setLoading(false);
  }
};
```

### Ejemplo 3: Carga de Datos con Manejo de Errores

```tsx
import { showErrorToast } from '../utils/errorHandler';

const fetchLoans = async () => {
  try {
    setLoading(true);
    const response = await api.get('/loans');
    setLoans(response.data);
  } catch (error) {
    // El interceptor ya mostró el toast para errores críticos
    // Solo mostramos mensaje específico si es necesario
    showErrorToast(error, 'Error al cargar los préstamos');
  } finally {
    setLoading(false);
  }
};
```

### Ejemplo 4: Actualización con Confirmación

```tsx
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

const handleUpdateLoan = async (loanId: string, status: string) => {
  try {
    await api.put(`/loans/${loanId}/review`, { status });
    showSuccessToast('Préstamo actualizado correctamente');
    fetchLoans(); // Recargar lista
  } catch (error) {
    showErrorToast(error, 'No se pudo actualizar el préstamo');
  }
};
```

---

## 🎨 Mejores Prácticas

### ✅ DO (Hacer)

1. **Usar toast para feedback inmediato:**
```tsx
showSuccessToast('¡Operación exitosa!');
```

2. **Proporcionar mensajes específicos:**
```tsx
showErrorToast(error, 'No se pudo crear el usuario');
```

3. **Deshabilitar formularios durante loading:**
```tsx
<TextField disabled={loading} />
<Button disabled={loading}>
  {loading ? 'Guardando...' : 'Guardar'}
</Button>
```

4. **Validar antes de enviar:**
```tsx
if (!isValid) {
  showWarningToast('Completa todos los campos requeridos');
  return;
}
```

5. **Re-lanzar errores cuando sea necesario:**
```tsx
try {
  await operation();
} catch (error) {
  showErrorToast(error);
  throw error; // Para que el componente padre también lo maneje
}
```

### ❌ DON'T (No hacer)

1. **No usar Alert components para errores temporales:**
```tsx
// ❌ Evitar
{error && <Alert severity="error">{error}</Alert>}

// ✅ Usar
showErrorToast(error);
```

2. **No capturar errores sin manejarlos:**
```tsx
// ❌ Evitar
try {
  await api.post('/data');
} catch (error) {
  // No hacer nada
}

// ✅ Usar
try {
  await api.post('/data');
} catch (error) {
  showErrorToast(error);
}
```

3. **No mostrar detalles técnicos al usuario:**
```tsx
// ❌ Evitar
showErrorToast(error, error.stack);

// ✅ Usar
showErrorToast(error, 'No se pudo completar la operación');
```

4. **No duplicar manejo de errores:**
```tsx
// ❌ El interceptor ya maneja 401, no duplicar
if (error.response?.status === 401) {
  showErrorToast(error);
}

// ✅ Confiar en el interceptor para casos comunes
```

---

## 🔧 Configuración Avanzada

### Integración con Sentry (Futuro)

```tsx
// ErrorBoundary.tsx
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  console.error('Error:', error, errorInfo);
  
  // Enviar a Sentry
  if (window.Sentry) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        }
      }
    });
  }
}
```

### Custom Toast Styles

```tsx
// Añadir en index.css o App.css
.Toastify__toast--success {
  background-color: #4caf50 !important;
}

.Toastify__toast--error {
  background-color: #f44336 !important;
}
```

---

## 📊 Resultados de la Implementación

### Antes ❌
- ❌ Errores sin manejar crasheaban la app
- ❌ Alert components estáticos en cada página
- ❌ Mensajes de error técnicos
- ❌ Sin feedback visual consistente
- ❌ Duplicación de código de manejo de errores

### Después ✅
- ✅ ErrorBoundary captura todos los errores de React
- ✅ Toast notifications unificadas y elegantes
- ✅ Mensajes amigables y traducidos
- ✅ Manejo centralizado en interceptor de Axios
- ✅ Código limpio y reutilizable
- ✅ Mejor experiencia de usuario

---

## 🧪 Testing

### Test de ErrorBoundary

```tsx
// ErrorBoundary.test.tsx
describe('ErrorBoundary', () => {
  it('should catch errors and display fallback UI', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/algo salió mal/i)).toBeInTheDocument();
  });
});
```

### Test de errorHandler

```tsx
// errorHandler.test.ts
describe('parseAxiosError', () => {
  it('should parse 404 errors', () => {
    const error = {
      response: { status: 404 }
    };
    
    expect(parseAxiosError(error)).toBe('Recurso no encontrado.');
  });
});
```

---

---

## 🎯 Sentry Integration - Logging Estructurado 🆕

### ¿Qué es Sentry?

Sentry es una plataforma de monitoreo de errores que:
- ✅ Captura errores automáticamente en producción
- ✅ Proporciona stack traces completos
- ✅ Registra breadcrumbs (pasos previos al error)
- ✅ Asocia errores con usuarios específicos
- ✅ Monitorea performance de la aplicación
- ✅ Envía alertas cuando ocurren errores críticos

### Implementación en Esta Aplicación

**Archivo de Configuración:** `src/config/sentry.ts`

#### Captura Automática

1. **Errores de React** → Capturados por `ErrorBoundary`
2. **Errores HTTP** → Capturados por interceptor de Axios
3. **Breadcrumbs** → Automáticos en navegación y API calls
4. **Contexto de Usuario** → Automático en login/logout

#### Funciones Principales

```tsx
import { 
  captureError, 
  captureMessage, 
  setUserContext, 
  addBreadcrumb 
} from '../config/sentry';

// Capturar error con contexto
try {
  await processPayment(loanId);
} catch (error) {
  captureError(error, {
    context: "Payment Processing",
    loanId,
    amount: 50000,
    userId: user.id
  });
}

// Capturar mensaje informativo
captureMessage("Usuario intentó acceso no autorizado", {
  level: "warning",
  extra: { userId: user.id }
});

// Breadcrumb personalizado
addBreadcrumb({
  category: "loan-approval",
  message: "Admin revisando documentos",
  data: { loanId: loan.id }
});
```

### Configuración Inicial

1. Crear cuenta en https://sentry.io/
2. Crear proyecto React
3. Obtener DSN
4. Añadir en `.env`:
   ```env
   VITE_SENTRY_DSN=tu-dsn-aqui
   ```
5. Reiniciar servidor

### Documentación Completa

Ver **[SENTRY_GUIDE.md](./SENTRY_GUIDE.md)** para:
- Guía completa de configuración
- Uso avanzado
- Best practices
- Troubleshooting
- Dashboard de Sentry

---

## 🚀 Próximos Pasos

1. ✅ ~~Integración con Sentry~~ **COMPLETADO** 🎉
2. **Error retry logic** para peticiones fallidas
3. **Offline detection** con toast informativo
4. **Rate limiting notifications** cuando se exceda límite
5. **Error analytics** para monitorear errores frecuentes

---

## 📖 Referencias

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [React Toastify](https://fkhadra.github.io/react-toastify/introduction)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [Sentry React](https://docs.sentry.io/platforms/javascript/guides/react/)
- **[Sentry Guide - Esta Aplicación](./SENTRY_GUIDE.md)** 🆕

---

## ✅ Checklist de Implementación

- [x] Instalar react-toastify
- [x] Crear componente ErrorBoundary
- [x] Crear utilidades de manejo de errores
- [x] Configurar interceptor de Axios
- [x] Integrar ToastContainer en App.tsx
- [x] Actualizar Login con nuevo sistema
- [x] Actualizar RequestLoan con nuevo sistema
- [x] Actualizar AdminLoans con nuevo sistema
- [x] Actualizar UserLoans con nuevo sistema
- [x] Documentar sistema completo
- [x] Tests unitarios ✅
- [x] **Integración con Sentry** ✅ 🆕

---

**Última actualización:** Enero 2026  
**Versión:** 2.0.0 (Con Sentry)  
**Autor:** Bank Loan Simulator Team
