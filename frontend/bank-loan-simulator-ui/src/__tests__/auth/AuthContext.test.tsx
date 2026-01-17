import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../../auth/AuthContext';

describe('AuthContext', () => {
  beforeEach(() => {
    // Limpiar localStorage antes de cada test
    localStorage.clear();
  });

  describe('Inicialización', () => {
    it('debe inicializar con token null si no hay token en localStorage', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.token).toBeNull();
    });

    it('debe inicializar con token si existe en localStorage', () => {
      localStorage.setItem('token', 'existing-token');

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.token).toBe('existing-token');
    });
  });

  describe('Función login', () => {
    it('debe guardar el token en el estado', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        result.current.login('new-token');
      });

      expect(result.current.token).toBe('new-token');
    });

    it('debe guardar el token en localStorage', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        result.current.login('new-token');
      });

      expect(localStorage.getItem('token')).toBe('new-token');
    });

    it('debe permitir actualizar el token múltiples veces', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        result.current.login('token-1');
      });
      expect(result.current.token).toBe('token-1');

      act(() => {
        result.current.login('token-2');
      });
      expect(result.current.token).toBe('token-2');
      expect(localStorage.getItem('token')).toBe('token-2');
    });
  });

  describe('Función logout', () => {
    it('debe eliminar el token del estado', () => {
      localStorage.setItem('token', 'existing-token');

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Token inicial existe
      expect(result.current.token).toBe('existing-token');

      act(() => {
        result.current.logout();
      });

      expect(result.current.token).toBeNull();
    });

    it('debe eliminar el token de localStorage', () => {
      localStorage.setItem('token', 'existing-token');

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem('token')).toBeNull();
    });

    it('debe funcionar correctamente si no hay token previo', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.token).toBeNull();

      act(() => {
        result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('Flujo completo login/logout', () => {
    it('debe permitir login y logout en secuencia', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Estado inicial
      expect(result.current.token).toBeNull();

      // Login
      act(() => {
        result.current.login('test-token');
      });
      expect(result.current.token).toBe('test-token');
      expect(localStorage.getItem('token')).toBe('test-token');

      // Logout
      act(() => {
        result.current.logout();
      });
      expect(result.current.token).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('debe permitir múltiples ciclos de login/logout', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Ciclo 1
      act(() => {
        result.current.login('token-1');
      });
      expect(result.current.token).toBe('token-1');

      act(() => {
        result.current.logout();
      });
      expect(result.current.token).toBeNull();

      // Ciclo 2
      act(() => {
        result.current.login('token-2');
      });
      expect(result.current.token).toBe('token-2');

      act(() => {
        result.current.logout();
      });
      expect(result.current.token).toBeNull();
    });
  });

  describe('Persistencia entre re-renders', () => {
    it('debe mantener el token después de login entre re-renders', () => {
      const { result, rerender } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        result.current.login('persistent-token');
      });

      rerender();

      expect(result.current.token).toBe('persistent-token');
    });
  });
});
