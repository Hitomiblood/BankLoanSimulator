import axios from "axios";
import { showErrorToast } from "../utils/errorHandler";

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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Manejo centralizado de errores HTTP
api.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, simplemente la devolvemos
    return response;
  },
  (error) => {
    // Manejo centralizado de errores
    if (error.response) {
      const status = error.response.status;
      
      // 401 - No autenticado: redirigir a login
      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        
        // Solo mostrar toast si no estamos ya en login
        if (!window.location.pathname.includes('/login')) {
          showErrorToast(error, 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
          
          // Redirigir a login después de un breve delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
      }
      
      // 403 - Sin permisos
      else if (status === 403) {
        showErrorToast(error, 'No tienes permisos para realizar esta acción.');
      }
      
      // 404 - No encontrado
      else if (status === 404) {
        showErrorToast(error, 'El recurso solicitado no fue encontrado.');
      }
      
      // 500 - Error del servidor
      else if (status === 500) {
        showErrorToast(error, 'Error del servidor. Por favor intenta más tarde.');
      }
      
      // 503 - Servicio no disponible
      else if (status === 503) {
        showErrorToast(error, 'Servicio temporalmente no disponible. Por favor intenta más tarde.');
      }
      
      // Otros errores no se muestran automáticamente para dar control al componente
      // El componente puede decidir si mostrar el error o no
    } else if (error.request) {
      // Error de red - no hubo respuesta del servidor
      showErrorToast(error, 'No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    }
    
    // Siempre re-lanzamos el error para que el componente pueda manejarlo si lo necesita
    return Promise.reject(error);
  }
);

export default api;
