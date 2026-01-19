import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import UserLoans from '../../pages/UserLoans';
import api from '../../api/axios';
import type { Loan } from '../../types/Loan';
import { LoanStatus } from '../../types/Loan';

// Mock dependencies
jest.mock('../../api/axios');
jest.mock('../../components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});
jest.mock('../../components/LoanCard', () => {
  return function MockLoanCard({ loan }: { loan: Loan }) {
    return <div data-testid={`loan-card-${loan.id}`}>{loan.amount}</div>;
  };
});

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...(jest.requireActual('react-router-dom') as any),
  useNavigate: () => mockNavigate,
}));

describe('UserLoans', () => {
  const mockLoans: Loan[] = [
    {
      id: '1',
      userId: '1',
      amount: 10000,
      interestRate: 5.5,
      termInMonths: 12,
      monthlyPayment: 858.33,
      status: LoanStatus.Pending,
      requestDate: '2024-01-15',
      reviewDate: undefined,
      adminComments: undefined,
      user: {
        fullName: 'Juan Pérez',
        email: 'juan.perez@example.com',
      },
    },
    {
      id: '2',
      userId: '1',
      amount: 20000,
      interestRate: 4.5,
      termInMonths: 24,
      monthlyPayment: 875.42,
      status: LoanStatus.Approved,
      requestDate: '2024-01-10',
      reviewDate: '2024-01-12',
      adminComments: 'Aprobado sin problemas',
      user: {
        fullName: 'Juan Pérez',
        email: 'juan.perez@example.com',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado y carga inicial', () => {
    it('debe mostrar el indicador de carga inicialmente', () => {
      (api.get as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('debe renderizar el navbar', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
      });
    });

    it('debe mostrar el título "Mis Préstamos"', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Mis Préstamos')).toBeInTheDocument();
      });
    });

    it('debe mostrar el botón "Solicitar Préstamo" en el header', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /solicitar préstamo/i });
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Carga de préstamos exitosa', () => {
    it('debe llamar a la API para obtener los préstamos del usuario', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/loans/my-loans');
      });
    });

    it('debe mostrar la lista de préstamos cuando hay datos', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('loan-card-2')).toBeInTheDocument();
      });
    });

    it('debe renderizar un LoanCard por cada préstamo', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        const loanCards = screen.getAllByTestId(/^loan-card-/);
        expect(loanCards).toHaveLength(mockLoans.length);
      });
    });
  });

  describe('Estado vacío (sin préstamos)', () => {
    it('debe mostrar mensaje cuando no hay préstamos', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No tienes préstamos solicitados')).toBeInTheDocument();
      });
    });

    it('debe mostrar texto informativo para solicitar el primer préstamo', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByText('Solicita tu primer préstamo para comenzar')
        ).toBeInTheDocument();
      });
    });

    it('debe mostrar botón "Solicitar Préstamo" en el estado vacío', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /solicitar préstamo/i });
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Manejo de errores', () => {
    it('debe mostrar mensaje de error cuando falla la API', async () => {
      const errorMessage = 'Error de conexión';
      (api.get as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('debe mostrar mensaje de error genérico cuando no hay mensaje específico', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Error al cargar los préstamos')).toBeInTheDocument();
      });
    });

    it('debe limpiar el mensaje de error después de una carga exitosa', async () => {
      // Primero falla
      (api.get as jest.Mock).mockRejectedValueOnce({
        response: { data: { message: 'Error temporal' } },
      });

      const { unmount } = render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Error temporal')).toBeInTheDocument();
      });

      // Luego tiene éxito
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      // Desmontar completamente el componente
      unmount();

      // Volver a montar (esto ejecuta useEffect otra vez)
      render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText('Error temporal')).not.toBeInTheDocument();
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
      });
    });
  });

  describe('Navegación', () => {
    it('debe navegar a /request al hacer clic en "Solicitar Préstamo" del header', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Mis Préstamos')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button', { name: /solicitar préstamo/i });
      fireEvent.click(buttons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/request');
    });

    it('debe navegar a /request al hacer clic en el botón del estado vacío', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No tienes préstamos solicitados')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button', { name: /solicitar préstamo/i });
      fireEvent.click(buttons[buttons.length - 1]); // Último botón (del estado vacío)

      expect(mockNavigate).toHaveBeenCalledWith('/request');
    });
  });

  describe('Estados de UI', () => {
    it('debe ocultar el loading después de cargar los datos', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('debe ocultar el loading incluso cuando hay error', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Error'));

      render(
        <BrowserRouter>
          <UserLoans />
        </BrowserRouter>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });
});
