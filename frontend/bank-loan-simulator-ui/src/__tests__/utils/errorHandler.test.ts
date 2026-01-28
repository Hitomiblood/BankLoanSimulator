import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  parseAxiosError,
  showErrorToast,
  showSuccessToast,
  showInfoToast,
  showWarningToast,
  handleError,
  withErrorHandling,
} from '../../utils/errorHandler';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

// Helper para crear AxiosError mock
const createAxiosError = (status: number, data: Record<string, unknown> = {}): AxiosError => {
  const error = new AxiosError(
    'Mock error',
    undefined,
    {} as InternalAxiosRequestConfig,
    {},
    {
      status,
      data,
      statusText: 'Mock Status',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    }
  );
  return error;
};

describe('errorHandler utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseAxiosError', () => {
    it('debe parsear error 400 con mensaje genérico', () => {
      const error = createAxiosError(400, {});

      const result = parseAxiosError(error);
      expect(result).toBe('Solicitud inválida. Por favor verifica los datos ingresados.');
    });

    it('debe parsear error 401', () => {
      const error = createAxiosError(401, {});

      const result = parseAxiosError(error);
      expect(result).toBe('No estás autenticado. Por favor inicia sesión.');
    });

    it('debe parsear error 403', () => {
      const error = createAxiosError(403, {});

      const result = parseAxiosError(error);
      expect(result).toBe('No tienes permisos para realizar esta acción.');
    });

    it('debe parsear error 404', () => {
      const error = createAxiosError(404, {});

      const result = parseAxiosError(error);
      expect(result).toBe('Recurso no encontrado.');
    });

    it('debe parsear error 409', () => {
      const error = createAxiosError(409, {});

      const result = parseAxiosError(error);
      expect(result).toBe('Ya existe un registro con estos datos.');
    });

    it('debe parsear error 422', () => {
      const error = createAxiosError(422, {});

      const result = parseAxiosError(error);
      expect(result).toBe('Los datos proporcionados no son válidos.');
    });

    it('debe parsear error 500', () => {
      const error = createAxiosError(500, {});

      const result = parseAxiosError(error);
      expect(result).toBe('Error del servidor. Por favor intenta más tarde.');
    });

    it('debe parsear error 503', () => {
      const error = createAxiosError(503, {});

      const result = parseAxiosError(error);
      expect(result).toBe('Servicio no disponible. Por favor intenta más tarde.');
    });

    it('debe usar el mensaje del servidor si está disponible', () => {
      const error = createAxiosError(400, { message: 'Mensaje personalizado del servidor' });

      const result = parseAxiosError(error);
      expect(result).toBe('Mensaje personalizado del servidor');
    });

    it('debe formatear errores de validación', () => {
      const error = createAxiosError(400, {
        errors: {
          email: ['Email es requerido', 'Email inválido'],
          password: ['Contraseña muy corta'],
        },
      });

      const result = parseAxiosError(error);
      expect(result).toContain('email:');
      expect(result).toContain('Email es requerido');
      expect(result).toContain('password:');
    });

    it('debe manejar errores de red sin respuesta', () => {
      const error = new AxiosError('Network Error', undefined, {} as InternalAxiosRequestConfig, {});
      error.request = {};

      const result = parseAxiosError(error);
      expect(result).toBe('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    });

    it('debe manejar errores genéricos', () => {
      const error = new Error('Error genérico');

      const result = parseAxiosError(error);
      expect(result).toBe('Error genérico');
    });

    it('debe manejar errores desconocidos', () => {
      const error = 'string error';

      const result = parseAxiosError(error);
      expect(result).toBe('Ha ocurrido un error inesperado. Por favor intenta nuevamente.');
    });
  });

  describe('showErrorToast', () => {
    it('debe llamar a toast.error con mensaje parseado', () => {
      const error = createAxiosError(404, {});

      showErrorToast(error);

      expect(toast.error).toHaveBeenCalledWith(
        'Recurso no encontrado.',
        expect.objectContaining({
          position: 'top-right',
          autoClose: 5000,
        })
      );
    });

    it('debe usar mensaje personalizado si se proporciona', () => {
      const error = new Error('Error');

      showErrorToast(error, 'Mensaje personalizado');

      expect(toast.error).toHaveBeenCalledWith(
        'Mensaje personalizado',
        expect.any(Object)
      );
    });
  });

  describe('showSuccessToast', () => {
    it('debe llamar a toast.success con el mensaje', () => {
      showSuccessToast('Operación exitosa');

      expect(toast.success).toHaveBeenCalledWith(
        'Operación exitosa',
        expect.objectContaining({
          position: 'top-right',
          autoClose: 3000,
        })
      );
    });
  });

  describe('showInfoToast', () => {
    it('debe llamar a toast.info con el mensaje', () => {
      showInfoToast('Información importante');

      expect(toast.info).toHaveBeenCalledWith(
        'Información importante',
        expect.objectContaining({
          position: 'top-right',
          autoClose: 4000,
        })
      );
    });
  });

  describe('showWarningToast', () => {
    it('debe llamar a toast.warning con el mensaje', () => {
      showWarningToast('Advertencia');

      expect(toast.warning).toHaveBeenCalledWith(
        'Advertencia',
        expect.objectContaining({
          position: 'top-right',
          autoClose: 4000,
        })
      );
    });
  });

  describe('handleError', () => {
    it('debe mostrar toast y loggear a consola', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');

      handleError(error, 'Error personalizado', true);

      expect(toast.error).toHaveBeenCalledWith('Error personalizado', expect.any(Object));
      expect(consoleSpy).toHaveBeenCalledWith('Error capturado:', error);

      consoleSpy.mockRestore();
    });

    it('no debe loggear si logToConsole es false', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');

      handleError(error, undefined, false);

      expect(toast.error).toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('withErrorHandling', () => {
    it('debe ejecutar la función y devolver resultado si tiene éxito', async () => {
      const successFn = jest.fn<(...args: unknown[]) => Promise<string>>().mockResolvedValue('success');
      const wrapped = withErrorHandling(successFn, 'Error message');

      const result = (await wrapped('arg1', 'arg2')) as string;

      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('debe mostrar toast y re-lanzar error si falla', async () => {
      const error = new Error('Test error');
      const failFn = jest.fn<() => Promise<never>>().mockRejectedValue(error);
      const wrapped = withErrorHandling(failFn, 'Custom error message');

      await expect(wrapped()).rejects.toThrow('Test error');
      expect(toast.error).toHaveBeenCalledWith('Custom error message', expect.any(Object));
    });

    it('debe usar mensaje automático si no se proporciona customMessage', async () => {
      const error = createAxiosError(500, {});
      const failFn = jest.fn<() => Promise<never>>().mockRejectedValue(error);
      const wrapped = withErrorHandling(failFn);

      await expect(wrapped()).rejects.toBeTruthy();
      expect(toast.error).toHaveBeenCalledWith(
        'Error del servidor. Por favor intenta más tarde.',
        expect.any(Object)
      );
    });
  });
});
