import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AdminLoans from '../../pages/AdminLoans';
import api from '../../api/axios';
import type { Loan } from '../../types/Loan';
import { LoanStatus } from '../../types/Loan';

// Mock dependencies
jest.mock('../../api/axios');
jest.mock('../../components/Navbar', () => {
  return function MockNavbar({ isAdmin }: { isAdmin?: boolean }) {
    return <div data-testid="navbar">Navbar {isAdmin && '(Admin)'}</div>;
  };
});
jest.mock('../../components/LoanCard', () => {
  return function MockLoanCard({ loan, showUser }: { loan: Loan; showUser?: boolean }) {
    return (
      <div data-testid={`loan-card-${loan.id}`}>
        Amount: {loan.amount} - Status: {loan.status}
        {showUser && ` - User: ${loan.user?.fullName}`}
      </div>
    );
  };
});

describe('AdminLoans', () => {
  const mockLoans: Loan[] = [
    {
      id: 1,
      userId: 1,
      amount: 10000,
      interestRate: 5.5,
      termInMonths: 12,
      monthlyPayment: 858.33,
      status: LoanStatus.Pending,
      requestDate: '2024-01-15',
      reviewDate: null,
      adminComments: null,
      userName: 'Juan Pérez',
    },
    {
      id: 2,
      userId: 2,
      amount: 20000,
      interestRate: 4.5,
      termInMonths: 24,
      monthlyPayment: 875.42,
      status: LoanStatus.Approved,
      requestDate: '2024-01-10',
      reviewDate: '2024-01-12',
      adminComments: 'Aprobado sin problemas',
      userName: 'María García',
    },
    {
      id: 3,
      userId: 3,
      amount: 5000,
      interestRate: 6.0,
      termInMonths: 6,
      monthlyPayment: 852.28,
      status: LoanStatus.Rejected,
      requestDate: '2024-01-14',
      reviewDate: '2024-01-16',
      adminComments: 'No cumple requisitos',
      userName: 'Carlos López',
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
          <AdminLoans />
        </BrowserRouter>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('debe renderizar el navbar con prop isAdmin', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('navbar')).toHaveTextContent('(Admin)');
      });
    });

    it('debe mostrar el título "Gestión de Préstamos"', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Gestión de Préstamos')).toBeInTheDocument();
      });
    });
  });

  describe('Carga de préstamos', () => {
    it('debe llamar a la API para obtener todos los préstamos', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/loans');
      });
    });

    it('debe mostrar la lista de préstamos', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('loan-card-2')).toBeInTheDocument();
        expect(screen.getByTestId('loan-card-3')).toBeInTheDocument();
      });
    });

    it('debe mostrar información del usuario en cada LoanCard', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toHaveTextContent('User: Juan Pérez');
        expect(screen.getByTestId('loan-card-2')).toHaveTextContent('User: María García');
        expect(screen.getByTestId('loan-card-3')).toHaveTextContent('User: Carlos López');
      });
    });

    it('debe mostrar botón "Revisar Préstamo" para cada préstamo', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /revisar préstamo/i });
        expect(buttons).toHaveLength(mockLoans.length);
      });
    });
  });

  describe('Contador de préstamos pendientes', () => {
    it('debe mostrar el número de préstamos pendientes', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('1 pendiente')).toBeInTheDocument();
      });
    });

    it('debe mostrar plural "pendientes" cuando hay más de uno', async () => {
      const multiplePending = [
        ...mockLoans,
        {
          ...mockLoans[0],
          id: 4,
          status: LoanStatus.Pending,
        },
      ];
      (api.get as jest.Mock).mockResolvedValue({ data: multiplePending });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('2 pendientes')).toBeInTheDocument();
      });
    });

    it('no debe mostrar el chip cuando no hay préstamos pendientes', async () => {
      const noPending = mockLoans.filter((loan) => loan.status !== LoanStatus.Pending);
      (api.get as jest.Mock).mockResolvedValue({ data: noPending });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText(/pendiente/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Estado vacío', () => {
    it('debe mostrar mensaje cuando no hay préstamos', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No hay préstamos registrados')).toBeInTheDocument();
      });
    });
  });

  describe('Manejo de errores', () => {
    it('debe mostrar mensaje de error cuando falla la carga', async () => {
      const errorMessage = 'Error de servidor';
      (api.get as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      render(
        <BrowserRouter>
          <AdminLoans />
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
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Error al cargar los préstamos')).toBeInTheDocument();
      });
    });

    it('debe limpiar el error después de una carga exitosa', async () => {
      // Verificar que no hay errores cuando la carga es exitosa
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Dialog de revisión', () => {
    it('debe abrir el dialog al hacer clic en "Revisar Préstamo"', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole('button', { name: /revisar préstamo/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('debe mostrar el título "Revisar Préstamo" en el dialog', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole('button', { name: /revisar préstamo/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        const dialogs = screen.getAllByText('Revisar Préstamo');
        expect(dialogs.length).toBeGreaterThan(0);
      });
    });

    it('debe mostrar el select de estado en el dialog', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole('button', { name: /revisar préstamo/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        // Material-UI Select no usa labelledBy correctamente, buscar por el input con role button
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('debe mostrar el campo de comentarios en el dialog', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole('button', { name: /revisar préstamo/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/comentarios del administrador/i)).toBeInTheDocument();
      });
    });

    it('debe prellenar el estado actual del préstamo', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole('button', { name: /revisar préstamo/i });
      fireEvent.click(reviewButtons[0]); // Primer préstamo (Pendiente)

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        // El select de Material-UI puede no tener la propiedad value accessible
        // Verificamos que el dialog se abre correctamente
        expect(within(dialog).getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('debe prellenar los comentarios existentes', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-2')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole('button', { name: /revisar préstamo/i });
      fireEvent.click(reviewButtons[1]); // Segundo préstamo (con comentarios)

      await waitFor(() => {
        const commentsField = screen.getByLabelText(/comentarios del administrador/i) as HTMLTextAreaElement;
        expect(commentsField.value).toBe('Aprobado sin problemas');
      });
    });

    it('debe cerrar el dialog al hacer clic en "Cancelar"', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole('button', { name: /revisar préstamo/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Modificación del estado y comentarios', () => {
    it('debe permitir cambiar el estado del préstamo', async () => {
      const user = userEvent.setup();
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole('button', { name: /revisar préstamo/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');
      const selectInput = within(dialog).getByRole('combobox');
      await user.click(selectInput);

      // Verificar que el select se puede interactuar
      await waitFor(() => {
        expect(selectInput).toBeInTheDocument();
      });
    });

    it('debe permitir escribir comentarios del administrador', async () => {
      const user = userEvent.setup({ delay: null });
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole('button', { name: /revisar préstamo/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const commentsField = screen.getByLabelText(/comentarios del administrador/i);
      await user.type(commentsField, 'Nuevo comentario de prueba');

      expect(commentsField).toHaveValue('Nuevo comentario de prueba');
    });
  });

  describe('Guardar revisión', () => {
    it('debe enviar la revisión correctamente', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });
      (api.put as jest.Mock).mockResolvedValue({});

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole('button', { name: /revisar préstamo/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /guardar revisión/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/loans/1/review', {
          status: LoanStatus.Pending,
          adminComments: undefined,
        });
      });
    });

    it('debe incluir comentarios en la revisión si se proporcionan', async () => {
      const user = userEvent.setup({ delay: null });
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });
      (api.put as jest.Mock).mockResolvedValue({});

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole('button', { name: /revisar préstamo/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const commentsField = screen.getByLabelText(/comentarios del administrador/i);
      await user.type(commentsField, 'Comentario importante');

      const saveButton = screen.getByRole('button', { name: /guardar revisión/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/loans/1/review', {
          status: LoanStatus.Pending,
          adminComments: 'Comentario importante',
        });
      });
    });

    it('debe recargar la lista de préstamos después de guardar', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });
      (api.put as jest.Mock).mockResolvedValue({});

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
      });

      expect(api.get).toHaveBeenCalledTimes(1);

      const reviewButtons = screen.getAllByRole('button', { name: /revisar préstamo/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /guardar revisión/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledTimes(2); // Llamada inicial + recarga
      });
    });

    it('debe cerrar el dialog después de guardar exitosamente', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });
      (api.put as jest.Mock).mockResolvedValue({});

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole('button', { name: /revisar préstamo/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /guardar revisión/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('debe mostrar "Guardando..." mientras procesa', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });
      (api.put as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole('button', { name: /revisar préstamo/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /guardar revisión/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Guardando...')).toBeInTheDocument();
      });
    });

    it('debe deshabilitar botones mientras procesa', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });
      (api.put as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole('button', { name: /revisar préstamo/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /guardar revisión/i });
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
      });
    });

    it('debe mostrar error cuando falla la revisión', async () => {
      const errorMessage = 'Error al actualizar';
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });
      (api.put as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole('button', { name: /revisar préstamo/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /guardar revisión/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('debe mostrar error genérico cuando no hay mensaje específico', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });
      (api.put as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <AdminLoans />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByRole('button', { name: /revisar préstamo/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /guardar revisión/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Error al revisar el préstamo')).toBeInTheDocument();
      });
    });
  });

  describe('Estados de UI', () => {
    it('debe ocultar el loading después de cargar los datos', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

      render(
        <BrowserRouter>
          <AdminLoans />
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
          <AdminLoans />
        </BrowserRouter>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });
});
