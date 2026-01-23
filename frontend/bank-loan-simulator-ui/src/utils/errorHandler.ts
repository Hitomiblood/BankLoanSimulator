import { AxiosError } from 'axios';
import { toast } from 'react-toastify';

/**
 * Interfaz para errores de API estandarizados
 */
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

/**
 * Parsea errores de Axios y extrae el mensaje apropiado
 */
export const parseAxiosError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    // Error de respuesta del servidor
    if (error.response) {
      const data = error.response.data as ApiErrorResponse;
      
      // Si hay errores de validación, formatearlos
      if (data.errors) {
        const errorMessages = Object.entries(data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        return errorMessages;
      }
      
      // Mensaje del servidor
      if (data.message) {
        return data.message;
      }
      
      // Mensajes por código de estado
      switch (error.response.status) {
        case 400:
          return 'Solicitud inválida. Por favor verifica los datos ingresados.';
        case 401:
          return 'No estás autenticado. Por favor inicia sesión.';
        case 403:
          return 'No tienes permisos para realizar esta acción.';
        case 404:
          return 'Recurso no encontrado.';
        case 409:
          return 'Ya existe un registro con estos datos.';
        case 422:
          return 'Los datos proporcionados no son válidos.';
        case 500:
          return 'Error del servidor. Por favor intenta más tarde.';
        case 503:
          return 'Servicio no disponible. Por favor intenta más tarde.';
        default:
          return `Error del servidor (${error.response.status}). Por favor intenta más tarde.`;
      }
    }
    
    // Error de red (sin respuesta del servidor)
    if (error.request) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    }
  }
  
  // Error genérico
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Ha ocurrido un error inesperado. Por favor intenta nuevamente.';
};

/**
 * Muestra un mensaje de error usando toast
 */
export const showErrorToast = (error: unknown, customMessage?: string): void => {
  const message = customMessage || parseAxiosError(error);
  toast.error(message, {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

/**
 * Muestra un mensaje de éxito usando toast
 */
export const showSuccessToast = (message: string): void => {
  toast.success(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

/**
 * Muestra un mensaje de información usando toast
 */
export const showInfoToast = (message: string): void => {
  toast.info(message, {
    position: 'top-right',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

/**
 * Muestra un mensaje de advertencia usando toast
 */
export const showWarningToast = (message: string): void => {
  toast.warning(message, {
    position: 'top-right',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

/**
 * Maneja errores de forma centralizada
 * Útil para try-catch blocks
 */
export const handleError = (
  error: unknown,
  customMessage?: string,
  logToConsole: boolean = true
): void => {
  if (logToConsole) {
    console.error('Error capturado:', error);
  }
  showErrorToast(error, customMessage);
};

/**
 * Envuelve una función asíncrona con manejo de errores
 */
export const withErrorHandling = <T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  customErrorMessage?: string
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, customErrorMessage);
      throw error; // Re-lanzar para que el llamador pueda manejarlo si lo necesita
    }
  }) as T;
};
