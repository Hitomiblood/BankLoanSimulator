import axios from "axios";
import { showErrorToast } from "../utils/errorHandler";
import { captureError, addBreadcrumb } from "../config/sentry";

const api = axios.create({
  baseURL: "http://localhost:5094/api", 
});

// Request interceptor - Añade el token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Breadcrumb para Sentry: Registro de petición HTTP
    addBreadcrumb({
      category: 'http.request',
      message: `${config.method?.toUpperCase()} ${config.url}`,
      level: 'info',
      data: {
        url: config.url,
        method: config.method,
        // No incluir headers por seguridad (puede contener tokens)
      }
    });

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Manejo centralizado de errores HTTP
api.interceptors.response.use(
  (response) => {
    // Breadcrumb para respuestas exitosas
    addBreadcrumb({
      category: 'http.response',
      message: `${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
      level: 'info',
      data: {
        status: response.status,
        url: response.config.url,
      }
    });

    return response;
  },
  (error) => {
    // Contexto para Sentry
    const sentryContext = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    };

    // Manejo centralizado de errores
    if (error.response) {
      const status = error.response.status;

      // Breadcrumb de error HTTP
      addBreadcrumb({
        category: 'http.error',
        message: `${status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        level: 'error',
        data: sentryContext
      });
      
      // 401 - No autenticado: redirigir a login
      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        
        // Solo mostrar toast si no estamos ya en login
        if (!window.location.pathname.includes('/login')) {
          showErrorToast(error, 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
          
          // Capturar en Sentry como warning (esperado en producción)
          captureError(error, {
            ...sentryContext,
            level: 'warning',
            context: 'Sesión expirada - Redirección a login'
          });
          
          // Redirigir a login después de un breve delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
      }
      
      // 403 - Sin permisos
      else if (status === 403) {
        showErrorToast(error, 'No tienes permisos para realizar esta acción.');
        captureError(error, {
          ...sentryContext,
          level: 'warning',
          context: 'Acceso denegado - Permisos insuficientes'
        });
      }
      
      // 404 - No encontrado
      else if (status === 404) {
        showErrorToast(error, 'El recurso solicitado no fue encontrado.');
        // 404 es común, solo capturar si es inesperado
        captureError(error, {
          ...sentryContext,
          level: 'info',
          context: 'Recurso no encontrado'
        });
      }
      
      // 500 - Error del servidor
      else if (status === 500) {
        showErrorToast(error, 'Error del servidor. Por favor intenta más tarde.');
        // 500 es crítico, capturar como error
        captureError(error, {
          ...sentryContext,
          level: 'error',
          context: 'Error del servidor'
        });
      }
      
      // 503 - Servicio no disponible
      else if (status === 503) {
        showErrorToast(error, 'Servicio temporalmente no disponible. Por favor intenta más tarde.');
        captureError(error, {
          ...sentryContext,
          level: 'error',
          context: 'Servicio no disponible'
        });
      }
      
      // Otros errores no se muestran automáticamente para dar control al componente
      // El componente puede decidir si mostrar el error o no
    } else if (error.request) {
      // Error de red - no hubo respuesta del servidor
      showErrorToast(error, 'No se pudo conectar con el servidor. Verifica tu conexión a internet.');
      
      captureError(error, {
        context: 'Error de red',
        level: 'error',
        url: error.config?.url,
        message: 'No hay respuesta del servidor'
      });
    }
    
    // Siempre re-lanzamos el error para que el componente pueda manejarlo si lo necesita
    return Promise.reject(error);
  }
);

export default api;
