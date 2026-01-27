# 📊 Guía de Sentry - Logging Estructurado

## 🎯 ¿Qué es Sentry?

**Sentry** es una plataforma de monitoreo de errores y performance que te permite:
- ✅ Capturar errores en producción automáticamente
- ✅ Ver qué hizo el usuario antes del error (breadcrumbs)
- ✅ Recibir alertas cuando ocurren errores críticos
- ✅ Identificar patrones: "Este error solo pasa en Safari"
- ✅ Priorizar bugs por impacto (cuántos usuarios afecta)
- ✅ Monitorear performance de tu aplicación

---

## 🚀 Configuración Inicial

### 1. Crear Cuenta en Sentry

1. Ve a https://sentry.io/
2. Crea una cuenta gratuita (5,000 errores/mes gratis)
3. Crea un nuevo proyecto:
   - Plataforma: **React**
   - Nombre: `bank-loan-simulator-frontend`

### 2. Obtener DSN (Data Source Name)

Después de crear el proyecto, Sentry te mostrará un DSN como este:
```
https://abc123def456@o123456.ingest.sentry.io/7890123
```

### 3. Configurar en tu Proyecto

1. Abre el archivo `.env` en la raíz del proyecto frontend
2. Añade tu DSN:
```env
VITE_SENTRY_DSN=https://abc123def456@o123456.ingest.sentry.io/7890123
```

3. Reinicia el servidor de desarrollo:
```bash
npm run dev
```

---

## ✅ Características Implementadas

### 1. **Captura Automática de Errores de React**

Todos los errores de React son capturados automáticamente por `ErrorBoundary`:

```tsx
// Esto será capturado automáticamente
function ProblematicComponent() {
  const data = null;
  return <div>{data.field}</div>; // ❌ Error: Cannot read property 'field' of null
}
```

**En Sentry verás:**
- Stack trace completo
- Componente que falló
- Props del componente
- Navegador y SO del usuario
- Breadcrumbs (pasos previos)

---

### 2. **Captura de Errores HTTP (Axios)**

Todos los errores de API son enviados automáticamente a Sentry:

```tsx
// Errores 401, 403, 404, 500, 503 son capturados automáticamente
try {
  await api.get('/loans');
} catch (error) {
  // Ya está en Sentry automáticamente ✅
}
```

**En Sentry verás:**
- Status code (401, 500, etc.)
- URL del endpoint
- Método HTTP (GET, POST, etc.)
- Response data (si está disponible)
- Request data (filtrado por seguridad)

---

### 3. **Breadcrumbs (Pistas antes del error)**

Sentry registra automáticamente:
- ✅ Navegación entre páginas
- ✅ Peticiones HTTP (request y response)
- ✅ Login/logout de usuarios
- ✅ Clicks en botones
- ✅ Logs de consola (solo errors/warnings)

**Ejemplo de breadcrumbs:**
```
1. Usuario visitó /loans
2. HTTP GET /api/loans → 200 OK
3. Usuario hizo click en "Solicitar Préstamo"
4. Usuario navegó a /loans/request
5. HTTP POST /api/loans → 400 Bad Request
6. ❌ ERROR: Validation failed
```

---

### 4. **Contexto de Usuario**

Después de login, Sentry asocia errores con usuarios específicos:

```tsx
// Esto se hace automáticamente en AuthContext
setUserContext({
  id: "user-123",
  email: "juan@example.com",
  username: "juan",
  role: "User"
});
```

**Beneficio:** Sabes exactamente qué usuario experimentó el error.

---

### 5. **Tracking de Performance**

Sentry monitorea automáticamente:
- Tiempo de carga de páginas
- Duración de peticiones HTTP
- Navegación entre rutas

---

## 🛠️ Uso Manual (Opcional)

### Capturar Error Manualmente

```tsx
import { captureError } from '../config/sentry';

try {
  const result = complexCalculation();
} catch (error) {
  captureError(error, {
    context: "Loan Calculation",
    loanAmount: 50000,
    termMonths: 120,
    interestRate: 3.5
  });
  
  // También mostrar al usuario
  toast.error("Error calculando préstamo");
}
```

---

### Capturar Mensaje Informativo

```tsx
import { captureMessage } from '../config/sentry';

// Registrar evento importante (no error)
captureMessage("Usuario intentó aprobar préstamo sin permisos", {
  level: "warning",
  extra: {
    userId: user.id,
    loanId: loan.id
  }
});
```

---

### Añadir Breadcrumb Personalizado

```tsx
import { addBreadcrumb } from '../config/sentry';

function handleLoanApproval(loanId: string) {
  addBreadcrumb({
    category: "loan-management",
    message: "Admin aprobó préstamo",
    level: "info",
    data: {
      loanId,
      adminId: user.id
    }
  });
  
  // ... lógica de aprobación
}
```

---

### Tracking de Performance Manual

```tsx
import { startTransaction } from '../config/sentry';

async function calculateAmortization() {
  const transaction = startTransaction("amortization-calculation");
  
  try {
    // Operación costosa
    const result = await heavyCalculation();
    return result;
  } finally {
    transaction.finish(); // Registra duración
  }
}
```

---

## 📊 Usando el Dashboard de Sentry

### 1. **Ver Errores**

1. Ve a tu proyecto en Sentry
2. En "Issues" verás lista de errores agrupados
3. Click en un error para ver:
   - Stack trace
   - Breadcrumbs
   - Datos del usuario
   - Navegador y dispositivo
   - Cuántos usuarios afectó

### 2. **Filtros Útiles**

- **Por ambiente:** `environment:production`
- **Por usuario:** `user.email:juan@example.com`
- **Por versión:** `release:1.0.0`
- **Por navegador:** `browser.name:Chrome`
- **Errores no resueltos:** `is:unresolved`

### 3. **Configurar Alertas**

1. Project Settings → Alerts
2. Crear regla:
   - "Si un nuevo error aparece"
   - "Si un error afecta a más de 10 usuarios"
   - "Si tasa de error sube 200%"
3. Enviar notificación a:
   - Email
   - Slack
   - Discord
   - PagerDuty

---

## 🎯 Mejores Prácticas

### ✅ DO: Hacer esto

```tsx
// ✅ Capturar con contexto útil
try {
  await processPayment(loanId);
} catch (error) {
  captureError(error, {
    context: "Payment Processing",
    loanId,
    amount: loan.amount,
    userId: user.id
  });
  throw error; // Re-lanzar para manejo local
}
```

```tsx
// ✅ Breadcrumbs en acciones importantes
addBreadcrumb({
  category: "loan-approval",
  message: "Admin revisando documentos",
  data: { loanId, documentCount: 5 }
});
```

---

### ❌ DON'T: Evitar esto

```tsx
// ❌ NO capturar errores esperados/comunes
try {
  const data = JSON.parse(input);
} catch (error) {
  captureError(error); // ❌ Inunda Sentry con errores triviales
}
```

```tsx
// ❌ NO incluir información sensible
captureError(error, {
  password: user.password, // ❌ NUNCA
  creditCard: card.number, // ❌ NUNCA
  token: authToken // ❌ NUNCA
});
```

---

## 🔒 Seguridad y Privacy

### Información Filtrada Automáticamente

El archivo `sentry.ts` ya está configurado para filtrar:
- ✅ Cookies
- ✅ Headers `Authorization`
- ✅ URLs con "password"
- ✅ Console.logs normales (solo errors/warnings)

### Antes de Enviar

```tsx
beforeSend(event) {
  // Filtra información sensible antes de enviar
  if (event.request?.headers) {
    delete event.request.headers['Authorization'];
  }
  return event;
}
```

---

## 📈 Optimización de Costos

### Plan Gratuito: 5,000 errores/mes

**Cómo no exceder el límite:**

1. **Ignorar errores conocidos:** Ya configurado en `ignoreErrors`
   ```tsx
   ignoreErrors: [
     "ResizeObserver loop limit exceeded",
     "Network Error", // Común en móviles
     "cancelled", // Navegación cancelada
   ]
   ```

2. **Sampling en producción:** Solo 10% de transacciones
   ```tsx
   tracesSampleRate: 0.1 // 10% en producción
   ```

3. **Filtrar por ambiente:**
   - Development: 100% de eventos (testing)
   - Production: 10-20% de eventos (optimización)

4. **Agrupar errores similares:**
   Sentry agrupa automáticamente errores idénticos

---

## 🧪 Testing de Sentry

### 1. **Test de Error de React**

Crea un componente de prueba:

```tsx
// TestErrorButton.tsx
function TestErrorButton() {
  const throwError = () => {
    throw new Error("🧪 Test de Sentry - Error de React");
  };

  return (
    <button onClick={throwError}>
      Simular Error de React
    </button>
  );
}
```

**Resultado esperado:**
- ErrorBoundary muestra UI de fallback
- Error aparece en Sentry con stack trace

---

### 2. **Test de Error HTTP**

```tsx
function TestHTTPError() {
  const testError = async () => {
    try {
      await api.get('/nonexistent-endpoint');
    } catch (error) {
      console.log("Error capturado ✅");
    }
  };

  return <button onClick={testError}>Simular 404</button>;
}
```

**Resultado esperado:**
- Toast de error
- Error 404 en Sentry con URL y método

---

### 3. **Test de Breadcrumbs**

```tsx
import { addBreadcrumb } from '../config/sentry';

function TestBreadcrumbs() {
  const testBreadcrumb = () => {
    addBreadcrumb({
      category: "test",
      message: "🧪 Breadcrumb de prueba",
      data: { timestamp: new Date().toISOString() }
    });
    
    // Luego causar un error para ver el breadcrumb
    throw new Error("Error después de breadcrumb");
  };

  return <button onClick={testBreadcrumb}>Test Breadcrumbs</button>;
}
```

**Resultado esperado:**
- En Sentry verás el breadcrumb antes del error

---

## 📚 Recursos Adicionales

### Documentación Oficial
- **Sentry Docs:** https://docs.sentry.io/
- **React Integration:** https://docs.sentry.io/platforms/javascript/guides/react/
- **Performance Monitoring:** https://docs.sentry.io/product/performance/

### Videos Tutoriales
- Sentry Crash Course: https://www.youtube.com/watch?v=xXrHkBc8g2Q
- Error Tracking Best Practices: https://docs.sentry.io/product/issues/

### Alternativas a Considerar
- **LogRocket:** Session replay + error tracking (más caro)
- **Rollbar:** Similar a Sentry
- **Bugsnag:** Enfoque en estabilidad móvil
- **Datadog:** APM completo (enterprise)

---

## ❓ Troubleshooting

### "Sentry DSN no configurado"

**Causa:** No has añadido `VITE_SENTRY_DSN` en `.env`

**Solución:**
1. Obtén tu DSN de Sentry.io
2. Añádelo en `.env`:
   ```env
   VITE_SENTRY_DSN=tu-dsn-aqui
   ```
3. Reinicia: `npm run dev`

---

### "No veo errores en Sentry"

**Checklist:**
1. ✅ DSN configurado correctamente
2. ✅ Servidor reiniciado después de añadir DSN
3. ✅ Error realmente ocurrió (check consola)
4. ✅ Ambiente correcto seleccionado en Sentry
5. ✅ Esperar 30-60 segundos (delay de envío)

---

### "Demasiados errores idénticos"

**Solución:** Añadir a `ignoreErrors` en `sentry.ts`:
```tsx
ignoreErrors: [
  "Tu error específico aquí",
]
```

---

## 🎓 Conclusión

Con Sentry configurado, ahora tienes:

✅ **Visibilidad completa** de errores en producción  
✅ **Contexto detallado** de cada error  
✅ **Alertas automáticas** cuando algo falla  
✅ **Performance monitoring** de tu app  
✅ **Priorización basada en datos** (qué arreglar primero)  

**Próximos pasos:**
1. Configura tu DSN
2. Haz tests locales
3. Deploya a producción
4. Configura alertas en Sentry
5. Monitorea dashboards semanalmente

---

## 💡 Tips Pro

### Release Tracking

Asocia errores con versiones del código:

```bash
# En package.json
"version": "1.2.0"
```

```env
# En .env
VITE_APP_VERSION=1.2.0
```

Luego en Sentry puedes filtrar: "Errores en v1.2.0"

---

### Ambientes Múltiples

```env
# .env.development
VITE_SENTRY_DSN=dsn-development
NODE_ENV=development

# .env.production
VITE_SENTRY_DSN=dsn-production
NODE_ENV=production
```

Filtra en Sentry: `environment:production`

---

### Integración con CI/CD

Notifica a Sentry cuando haces deploy:

```bash
# En GitHub Actions
- name: Create Sentry release
  run: |
    sentry-cli releases new ${{ github.sha }}
    sentry-cli releases set-commits ${{ github.sha }} --auto
    sentry-cli releases finalize ${{ github.sha }}
```

---

¡Feliz debugging! 🐛🔍
