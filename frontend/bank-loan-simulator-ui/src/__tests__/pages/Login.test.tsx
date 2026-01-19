import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { AuthProvider } from '../../auth/AuthContext';
import api from '../../api/axios';

// Mock del módulo axios
jest.mock('../../api/axios');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock de react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...(jest.requireActual('react-router-dom') as any),
  useNavigate: () => mockNavigate,
}));

// Componente wrapper para tests
const LoginWithProviders = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Page - Integration Tests', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    mockNavigate.mockClear();
    mockedApi.post.mockClear();
    localStorage.clear();
  });

  describe('Renderizado de la página', () => {
    it('debe renderizar el formulario de login correctamente', () => {
      render(<LoginWithProviders />);
      
      expect(screen.getByText('Bank Loan Simulator')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
    });

    it('debe mostrar los usuarios de prueba', () => {
      render(<LoginWithProviders />);
      
      expect(screen.getByText(/Usuarios de prueba:/i)).toBeInTheDocument();
      expect(screen.getByText(/Admin: admin@test.com \/ 123/i)).toBeInTheDocument();
    });

    it('campos de email y password deben estar inicialmente vacíos', () => {
      render(<LoginWithProviders />);
      
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement;
      
      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });
  });

  describe('Interacción del usuario', () => {
    it('debe permitir escribir en el campo de email', () => {
      render(<LoginWithProviders />);
      
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput.value).toBe('test@example.com');
    });

    it('debe permitir escribir en el campo de contraseña', () => {
      render(<LoginWithProviders />);
      
      const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(passwordInput.value).toBe('password123');
    });

    it('el campo de contraseña debe tener type="password"', () => {
      render(<LoginWithProviders />);
      
      const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');
    });
  });

  describe('Login exitoso', () => {
    it('debe iniciar sesión correctamente y redirigir a /loans para usuario normal', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: {
          token: 'fake-token',
          isAdmin: false,
        },
      });

      render(<LoginWithProviders />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      
      fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
          email: 'user@test.com',
          password: '123',
        });
      });

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('fake-token');
        expect(mockNavigate).toHaveBeenCalledWith('/loans');
      });
    });

    it('debe iniciar sesión correctamente y redirigir a /admin para administrador', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: {
          token: 'admin-token',
          isAdmin: true,
        },
      });

      render(<LoginWithProviders />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      
      fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
          email: 'admin@test.com',
          password: '123',
        });
      });

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('admin-token');
        expect(mockNavigate).toHaveBeenCalledWith('/admin');
      });
    });
  });

  describe('Manejo de errores', () => {
    it('debe mostrar mensaje de error cuando las credenciales son incorrectas', async () => {
      mockedApi.post.mockRejectedValueOnce({
        response: {
          data: {
            message: 'Credenciales inválidas',
          },
        },
      });

      render(<LoginWithProviders />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      
      fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
      });

      // No debe haber navegado
      expect(mockNavigate).not.toHaveBeenCalled();
      // No debe haber guardado token
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('debe mostrar mensaje de error genérico cuando falla la petición', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Network error'));

      render(<LoginWithProviders />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      
      fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Error al iniciar sesión. Verifica tus credenciales./i)).toBeInTheDocument();
      });
    });

    it('debe limpiar el error cuando se vuelve a enviar el formulario', async () => {
      // Primera llamada falla
      mockedApi.post.mockRejectedValueOnce({
        response: {
          data: {
            message: 'Error inicial',
          },
        },
      });

      render(<LoginWithProviders />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      
      // Primer intento (falla)
      fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error inicial')).toBeInTheDocument();
      });

      // Segunda llamada exitosa
      mockedApi.post.mockResolvedValueOnce({
        data: {
          token: 'valid-token',
          isAdmin: false,
        },
      });

      // Segundo intento (exitoso)
      fireEvent.change(passwordInput, { target: { value: 'correct' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Error inicial')).not.toBeInTheDocument();
      });
    });
  });

  describe('Estados de carga', () => {
    it('debe mostrar "Cargando..." mientras procesa el login', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockedApi.post.mockReturnValueOnce(promise as any);

      render(<LoginWithProviders />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      
      fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      // Verificar que muestra "Cargando..."
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cargando.../i })).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      // Resolver la promesa
      resolvePromise!({
        data: {
          token: 'fake-token',
          isAdmin: false,
        },
      });

      // Verificar que vuelve al texto normal
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
      });
    });

    it('debe deshabilitar el botón durante la carga', async () => {
      mockedApi.post.mockImplementationOnce(() => 
        new Promise((resolve) => setTimeout(() => resolve({
          data: { token: 'test', isAdmin: false }
        }), 100)) as any
      );

      render(<LoginWithProviders />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      
      fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Validación del formulario', () => {
    it('campos email y password deben ser requeridos', () => {
      render(<LoginWithProviders />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      
      expect(emailInput).toBeRequired();
      expect(passwordInput).toBeRequired();
    });
  });
});
