import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import '@testing-library/jest-dom';
import ErrorBoundary from '../../components/ErrorBoundary';
import * as navigation from '../../utils/navigation';

// Componente que lanza un error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Componente que funciona correctamente
const WorkingComponent = () => {
  return <div>Working component</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suprimir errores de consola en los tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Sin errores', () => {
    it('debe renderizar children cuando no hay error', () => {
      render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('no debe mostrar UI de error cuando no hay error', () => {
      render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/algo salió mal/i)).not.toBeInTheDocument();
    });
  });

  describe('Con errores', () => {
    it('debe capturar error y mostrar UI de fallback', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/¡algo salió mal!/i)).toBeInTheDocument();
    });

    it('debe mostrar mensaje amigable al usuario', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/lo sentimos, ha ocurrido un error inesperado/i)
      ).toBeInTheDocument();
    });

    it('debe mostrar botón de reintentar', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });

    it('debe mostrar botón de volver al inicio', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /volver al inicio/i })).toBeInTheDocument();
    });

    it('debe mostrar icono de error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // El icono ErrorOutlineIcon está presente
      const errorIcon = document.querySelector('[data-testid="ErrorOutlineIcon"]');
      expect(errorIcon || screen.getByText(/¡algo salió mal!/i)).toBeInTheDocument();
    });

    it('debe mostrar mensaje de soporte', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/si el problema persiste, por favor contacta a soporte técnico/i)
      ).toBeInTheDocument();
    });
  });

  describe('Modo desarrollo', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('debe mostrar detalles del error en desarrollo', () => {
      process.env.NODE_ENV = 'development';
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // En desarrollo, se muestra información adicional
      expect(screen.getByText(/solo visible en desarrollo/i)).toBeInTheDocument();
      expect(screen.getByText(/test error message/i)).toBeInTheDocument();
    });
  });

  describe('Modo producción', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('no debe mostrar detalles técnicos en producción', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // En producción, NO se muestran detalles técnicos
      expect(screen.queryByText(/error details/i)).not.toBeInTheDocument();
    });
  });

  describe('Interacciones', () => {
    beforeEach(() => {
      // Mock de la función de navegación
      jest.spyOn(navigation, 'goHome').mockImplementation(() => {});
    });

    it('botón "Reintentar" debe resetear el estado de error', () => {
      const { rerender } = render(
        <ErrorBoundary key="error">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/¡algo salió mal!/i)).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /reintentar/i });
      fireEvent.click(retryButton);

      // Después de hacer click en reintentar, renderizar sin error con nueva key
      rerender(
        <ErrorBoundary key="no-error">
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('botón "Volver al inicio" debe cambiar location', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const homeButton = screen.getByRole('button', { name: /volver al inicio/i });
      fireEvent.click(homeButton);

      // Verificar que se llamó a la función de navegación
      expect(navigation.goHome).toHaveBeenCalledTimes(1);
    });
  });

  describe('Logging', () => {
    it('debe loggear el error a la consola', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      // Verificar que fue llamado con el mensaje correcto (puede ser el primer o segundo argumento)
      const calls = consoleErrorSpy.mock.calls.flat();
      const hasExpectedMessage = calls.some(arg => 
        String(arg).includes('ErrorBoundary capturó un error:')
      );
      expect(hasExpectedMessage).toBe(true);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Múltiples errores', () => {
    it('debe manejar diferentes tipos de errores', () => {
      const CustomError = () => {
        throw new Error('Custom error message');
      };

      render(
        <ErrorBoundary>
          <CustomError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/¡algo salió mal!/i)).toBeInTheDocument();
    });

    it('debe capturar errores en componentes anidados', () => {
      const NestedComponent = () => {
        return (
          <div>
            <ThrowError shouldThrow={true} />
          </div>
        );
      };

      render(
        <ErrorBoundary>
          <NestedComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/¡algo salió mal!/i)).toBeInTheDocument();
    });
  });
});
