import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { AuthProvider } from '../../auth/AuthContext';

// Mock de react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...(jest.requireActual('react-router-dom') as Record<string, unknown>),
  useNavigate: () => mockNavigate,
}));

// Componente wrapper para tests con providers necesarios
const NavbarWithProviders = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar isAdmin={isAdmin} />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    mockNavigate.mockClear();
    localStorage.clear();
  });

  describe('Renderizado básico', () => {
    it('debe renderizar el título de la aplicación', () => {
      render(<NavbarWithProviders />);
      expect(screen.getByText('Bank Loan Simulator')).toBeInTheDocument();
    });

    it('debe renderizar el botón de Salir', () => {
      render(<NavbarWithProviders />);
      expect(screen.getByText('Salir')).toBeInTheDocument();
    });

    it('debe mostrar el icono de logout en el botón Salir', () => {
      const { container } = render(<NavbarWithProviders />);
      // Material-UI usa data-testid para iconos
      const logoutIcon = container.querySelector('[data-testid="LogoutIcon"]');
      expect(logoutIcon).toBeInTheDocument();
    });
  });

  describe('Vista de Usuario (isAdmin=false)', () => {
    it('debe mostrar el botón "Mis Préstamos"', () => {
      render(<NavbarWithProviders isAdmin={false} />);
      expect(screen.getByText('Mis Préstamos')).toBeInTheDocument();
    });

    it('debe mostrar el botón "Solicitar Préstamo"', () => {
      render(<NavbarWithProviders isAdmin={false} />);
      expect(screen.getByText('Solicitar Préstamo')).toBeInTheDocument();
    });

    it('no debe mostrar el botón "Gestionar Préstamos"', () => {
      render(<NavbarWithProviders isAdmin={false} />);
      expect(screen.queryByText('Gestionar Préstamos')).not.toBeInTheDocument();
    });

    it('debe navegar a /loans al hacer clic en "Mis Préstamos"', () => {
      render(<NavbarWithProviders isAdmin={false} />);
      const button = screen.getByText('Mis Préstamos');
      fireEvent.click(button);
      expect(mockNavigate).toHaveBeenCalledWith('/loans');
    });

    it('debe navegar a /request al hacer clic en "Solicitar Préstamo"', () => {
      render(<NavbarWithProviders isAdmin={false} />);
      const button = screen.getByText('Solicitar Préstamo');
      fireEvent.click(button);
      expect(mockNavigate).toHaveBeenCalledWith('/request');
    });
  });

  describe('Vista de Admin (isAdmin=true)', () => {
    it('debe mostrar el botón "Gestionar Préstamos"', () => {
      render(<NavbarWithProviders isAdmin={true} />);
      expect(screen.getByText('Gestionar Préstamos')).toBeInTheDocument();
    });

    it('no debe mostrar el botón "Mis Préstamos"', () => {
      render(<NavbarWithProviders isAdmin={true} />);
      expect(screen.queryByText('Mis Préstamos')).not.toBeInTheDocument();
    });

    it('no debe mostrar el botón "Solicitar Préstamo"', () => {
      render(<NavbarWithProviders isAdmin={true} />);
      expect(screen.queryByText('Solicitar Préstamo')).not.toBeInTheDocument();
    });

    it('debe navegar a /admin al hacer clic en "Gestionar Préstamos"', () => {
      render(<NavbarWithProviders isAdmin={true} />);
      const button = screen.getByText('Gestionar Préstamos');
      fireEvent.click(button);
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  describe('Funcionalidad de Logout', () => {
    it('debe llamar a logout y navegar a /login al hacer clic en Salir', () => {
      // Establecer un token para simular usuario logueado
      localStorage.setItem('token', 'fake-token');
      
      render(<NavbarWithProviders />);
      const logoutButton = screen.getByText('Salir');
      fireEvent.click(logoutButton);

      // Verificar que el token fue removido
      expect(localStorage.getItem('token')).toBeNull();
      
      // Verificar que navegó a /login
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('debe limpiar el localStorage al hacer logout', () => {
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('user', 'fake-user');
      
      render(<NavbarWithProviders />);
      const logoutButton = screen.getByText('Salir');
      fireEvent.click(logoutButton);

      // Verificar que el token fue removido
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('Prop isAdmin por defecto', () => {
    it('debe mostrar vista de usuario si no se pasa la prop isAdmin', () => {
      render(<NavbarWithProviders />);
      expect(screen.getByText('Mis Préstamos')).toBeInTheDocument();
      expect(screen.getByText('Solicitar Préstamo')).toBeInTheDocument();
    });
  });
});
