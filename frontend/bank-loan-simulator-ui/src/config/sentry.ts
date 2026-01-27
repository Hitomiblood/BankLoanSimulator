/**
 * Configuración de Sentry para monitoring de errores y performance
 * 
 * Sentry captura:
 * - Errores de JavaScript/TypeScript
 * - Errores de React (via ErrorBoundary)
 * - Errores HTTP (via Axios interceptor)
 * - Performance metrics
 * - Breadcrumbs (navegación, clicks, API calls)
 * - Contexto de usuario
 */

import * as Sentry from "@sentry/react";

/**
 * Helper para obtener variables de entorno de forma compatible con tests
 * En entorno de test (Jest/Node), usa process.env
 * En entorno de browser (Vite), usa import.meta.env
 */
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // Detectar si estamos en entorno de test (Jest/Node)
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return process.env[key] || defaultValue;
  }
  
  // En browser usar import.meta.env (Vite)
  try {
    return (import.meta.env?.[key] as string) || defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * Detecta si estamos en entorno de test
 */
const isTestEnvironment = (): boolean => {
  return typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
};

/**
 * Flag para saber si Sentry fue inicializado correctamente
 */
let sentryInitialized = false;

/**
 * Inicializa Sentry con configuración completa
 * 
 * IMPORTANTE: Obtén tu DSN en https://sentry.io/
 * 1. Crea una cuenta gratuita
 * 2. Crea un proyecto React
 * 3. Copia el DSN y reemplaza en .env
 */
export const initializeSentry = () => {
  // No inicializar en entorno de test
  if (isTestEnvironment()) {
    console.log('🧪 Test environment detected - Sentry disabled');
    return;
  }

  // Solo inicializar en producción o si hay DSN configurado
  const dsn = getEnvVar('VITE_SENTRY_DSN');
  
  if (!dsn) {
    console.warn(
      "⚠️ Sentry DSN no configurado. Para habilitar error tracking:\n" +
      "1. Crea cuenta en https://sentry.io/\n" +
      "2. Crea proyecto React\n" +
      "3. Añade VITE_SENTRY_DSN=tu-dsn en .env"
    );
    return;
  }

  Sentry.init({
    // DSN (Data Source Name) - Identifica tu proyecto en Sentry
    dsn,

    // Integrations: Funcionalidades adicionales
    integrations: [
      // BrowserTracing: Performance monitoring (ya incluido en @sentry/react)
      Sentry.browserTracingIntegration(),

      // Replay: Grabación de sesiones (opcional, consume más recursos)
      // Sentry.replayIntegration({
      //   maskAllText: true, // Oculta texto sensible
      //   blockAllMedia: true, // Bloquea imágenes/videos
      // }),
    ],

    // Performance Monitoring
    tracesSampleRate: getEnvVar('PROD') === 'true' ? 0.1 : 1.0, // 10% en prod, 100% en dev
    // tracesSampleRate: 1.0 significa 100% de transacciones son enviadas
    // En producción usa 0.1 (10%) para no exceder el límite gratuito

    // Session Replay (deshabilitado por defecto)
    // replaysSessionSampleRate: 0.1, // 10% de sesiones normales
    // replaysOnErrorSampleRate: 1.0, // 100% de sesiones con error

    // Environment: dev, staging, production
    environment: getEnvVar('MODE', 'development'),

    // Release tracking: Asocia errores con versión del código
    release: getEnvVar('VITE_APP_VERSION', '1.0.0'),

    // Filtros: Ignorar errores conocidos o irrelevantes
    // NOTA: En desarrollo capturamos TODO para facilitar debugging
    // En producción, filtramos errores comunes que no son bugs
    ignoreErrors: getEnvVar('PROD') === 'true' ? [
      // SOLO EN PRODUCCIÓN: Filtrar errores de conectividad genéricos
      // Estos son inevitables (usuarios sin WiFi, móviles sin señal, etc.)
      "Network Error",
      "NetworkError",
      "Failed to fetch",
      "Load failed",
      
      // Errores de extensiones del navegador
      "Non-Error promise rejection captured",
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      
      // Errores de navegación cancelada
      "cancelled",
      "canceled",
      "Navigation cancelled",
    ] : [
      // EN DESARROLLO: Solo filtrar errores de extensiones/navegador
      // Capturamos TODOS los errores de red para debugging
      "Non-Error promise rejection captured",
      "ResizeObserver loop limit exceeded",
    ],

    // Filtros de URL: Ignorar errores de scripts externos
    denyUrls: [
      // Extensiones de Chrome
      /extensions\//i,
      /^chrome:\/\//i,
      // Scripts de third-party
      /google-analytics\.com/i,
      /googletagmanager\.com/i,
    ],

    // Antes de enviar evento: Enriquecer con contexto adicional
    beforeSend(event, hint) {
      // En desarrollo, también loguear a consola
      if (getEnvVar('DEV') === 'true') {
        console.log("📤 Sentry - Enviando error:", event?.exception?.values?.[0]?.value || event.message);
        console.error("🔴 Sentry Event:", event);
        console.error("🔴 Original Error:", hint.originalException);
      }

      // PRODUCCIÓN: Filtrado inteligente de errores de red genéricos
      // Capturamos errores HTTP con status codes (son bugs) pero no errores de conectividad pura
      if (getEnvVar('PROD') === 'true') {
        const error = hint.originalException as { 
          response?: { status?: number }; 
          request?: unknown; 
          config?: { url?: string; method?: string } 
        };
        
        // Si es error de Axios con respuesta (400, 401, 500, etc.), SÍ capturarlo
        if (error?.response) {
          // Añadir contexto del status code
          event.contexts = event.contexts || {};
          event.contexts.http = {
            status_code: error.response.status,
            url: error.config?.url,
            method: error.config?.method,
          };
          // Continuar enviando (estos son importantes)
        }
        // Si es error de red sin respuesta (timeout, offline), NO capturarlo en producción
        else if (error?.request && !error?.response) {
          // Usuario offline o timeout - común y no es bug
          return null; // No enviar a Sentry
        }
      }

      // Filtrar información sensible
      if (event.request) {
        // No enviar tokens o contraseñas
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers["Authorization"];
        }
      }

      // Filtrar datos sensibles en el body de requests
      if (event.request?.data) {
        const data = event.request.data as Record<string, unknown>;
        if (data.password) data.password = "[FILTERED]";
        if (data.token) data.token = "[FILTERED]";
      }

      return event;
    },

    // Breadcrumbs: Pistas antes del error
    beforeBreadcrumb(breadcrumb) {
      // Filtrar breadcrumbs de console.log/debug
      if (breadcrumb.category === "console" && breadcrumb.level === "log") {
        return null; // No enviar logs normales
      }

      // Ocultar datos sensibles en breadcrumbs HTTP
      if (breadcrumb.category === "xhr" || breadcrumb.category === "fetch") {
        if (breadcrumb.data?.url?.includes("password")) {
          breadcrumb.data.url = "[FILTERED]";
        }
      }

      return breadcrumb;
    },
  });

  sentryInitialized = true;
  console.log("✅ Sentry inicializado:", {
    environment: getEnvVar('MODE', 'development'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  });
};

/**
 * Helper: Capturar error manualmente
 * 
 * @example
 * try {
 *   riskyOperation();
 * } catch (error) {
 *   captureError(error, {
 *     context: "PaymentProcessing",
 *     userId: user.id,
 *     amount: 50000
 *   });
 * }
 */
export const captureError = (
  error: unknown,
  context?: Record<string, unknown>
) => {
  if (!sentryInitialized || isTestEnvironment()) {
    return;
  }
  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Helper: Capturar mensaje informativo (no error)
 * 
 * @example
 * captureMessage("Usuario intentó acceder sin permisos", {
 *   level: "warning",
 *   userId: user.id
 * });
 */
export const captureMessage = (
  message: string,
  context?: { level?: Sentry.SeverityLevel; extra?: Record<string, unknown> }
) => {
  if (!sentryInitialized || isTestEnvironment()) {
    return;
  }
  Sentry.captureMessage(message, {
    level: context?.level || "info",
    extra: context?.extra,
  });
};

/**
 * Helper: Establecer contexto de usuario
 * Útil después de login
 * 
 * @example
 * setUserContext({
 *   id: user.id,
 *   email: user.email,
 *   role: user.role
 * });
 */
export const setUserContext = (user: {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}) => {
  if (!sentryInitialized || isTestEnvironment()) {
    return;
  }
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });
};

/**
 * Helper: Limpiar contexto de usuario (en logout)
 */
export const clearUserContext = () => {
  if (!sentryInitialized || isTestEnvironment()) {
    return;
  }
  Sentry.setUser(null);
};

/**
 * Helper: Añadir breadcrumb personalizado
 * 
 * @example
 * addBreadcrumb({
 *   category: "loan-application",
 *   message: "Usuario solicitó préstamo de €50,000",
 *   level: "info",
 *   data: { amount: 50000, term: 120 }
 * });
 */
export const addBreadcrumb = (breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, unknown>;
}) => {
  if (!sentryInitialized || isTestEnvironment()) {
    return;
  }
  Sentry.addBreadcrumb({
    category: breadcrumb.category || "custom",
    message: breadcrumb.message,
    level: breadcrumb.level || "info",
    data: breadcrumb.data,
  });
};

/**
 * Helper: Crear transacción de performance
 * 
 * @example
 * const transaction = startTransaction("loan-calculation");
 * // ... operación costosa ...
 * transaction.finish();
 */
export const startTransaction = (name: string, op?: string) => {
  if (!sentryInitialized || isTestEnvironment()) {
    return null;
  }
  return Sentry.startSpan({
    name,
    op: op || "custom",
  }, (span) => span);
};

export default Sentry;
