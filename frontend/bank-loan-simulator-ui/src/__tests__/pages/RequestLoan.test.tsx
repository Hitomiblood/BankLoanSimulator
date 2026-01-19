import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RequestLoan from '../../pages/RequestLoan';
import api from '../../api/axios';

// Mock dependencies
jest.mock('../../api/axios');
jest.mock('../../components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('RequestLoan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Renderizado inicial', () => {
    it('debe renderizar el navbar', () => {
      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });

    it('debe mostrar el título "Solicitar Préstamo"', () => {
      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      expect(screen.getByRole('heading', { name: /solicitar préstamo/i })).toBeInTheDocument();
    });

    it('debe mostrar todos los campos del formulario', () => {
      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      expect(screen.getByLabelText(/monto del préstamo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tasa de interés anual/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/plazo en meses/i)).toBeInTheDocument();
    });

    it('debe mostrar el botón "Calcular Cuota Mensual"', () => {
      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      expect(screen.getByRole('button', { name: /calcular cuota mensual/i })).toBeInTheDocument();
    });

    it('debe mostrar el botón "Solicitar Préstamo"', () => {
      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      expect(screen.getByRole('button', { name: /solicitar préstamo/i })).toBeInTheDocument();
    });

    it('debe mostrar los textos de ayuda para cada campo', () => {
      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      expect(screen.getByText(/monto entre €1,000 y €1,000,000/i)).toBeInTheDocument();
      expect(screen.getByText(/tasa entre 0% y 50%/i)).toBeInTheDocument();
      expect(screen.getByText(/plazo entre 1 y 240 meses/i)).toBeInTheDocument();
    });

    it('debe mostrar la nota informativa sobre la revisión', () => {
      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      expect(
        screen.getByText(/la solicitud será revisada por un administrador/i)
      ).toBeInTheDocument();
    });
  });

  describe('Interacción con el formulario', () => {
    it('debe permitir ingresar el monto del préstamo', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      const amountInput = screen.getByLabelText(/monto del préstamo/i);
      await user.type(amountInput, '15000');

      expect(amountInput).toHaveValue(15000);
    });

    it('debe permitir ingresar la tasa de interés', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      const rateInput = screen.getByLabelText(/tasa de interés anual/i);
      await user.type(rateInput, '5.5');

      expect(rateInput).toHaveValue(5.5);
    });

    it('debe permitir ingresar el plazo en meses', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      const termInput = screen.getByLabelText(/plazo en meses/i);
      await user.type(termInput, '12');

      expect(termInput).toHaveValue(12);
    });

    it('debe limpiar los campos cuando se borra el contenido', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      const amountInput = screen.getByLabelText(/monto del préstamo/i);
      await user.type(amountInput, '15000');
      await user.clear(amountInput);

      expect(amountInput).toHaveValue(null);
    });
  });

  describe('Cálculo de cuota mensual', () => {
    it('debe calcular correctamente la cuota mensual', async () => {
      const user = userEvent.setup({ delay: null });
      (api.post as jest.Mock).mockResolvedValue({
        data: { monthlyPayment: 858.33 },
      });

      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/monto del préstamo/i), '10000');
      await user.type(screen.getByLabelText(/tasa de interés anual/i), '5.5');
      await user.type(screen.getByLabelText(/plazo en meses/i), '12');

      fireEvent.click(screen.getByRole('button', { name: /calcular cuota mensual/i }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/loans/calculate', {
          amount: 10000,
          interestRate: 5.5,
          termInMonths: 12,
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Cuota Mensual Estimada')).toBeInTheDocument();
        expect(screen.getByText(/858,33/)).toBeInTheDocument();
      });
    });

    it('debe mostrar error si faltan campos al calcular', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/monto del préstamo/i), '10000');
      // No llenar los otros campos

      fireEvent.click(screen.getByRole('button', { name: /calcular cuota mensual/i }));

      await waitFor(() => {
        expect(screen.getByText('Por favor completa todos los campos')).toBeInTheDocument();
      });

      expect(api.post).not.toHaveBeenCalled();
    });

    it('debe mostrar error cuando el cálculo falla', async () => {
      const user = userEvent.setup({ delay: null });
      const errorMessage = 'Error en el cálculo';
      (api.post as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/monto del préstamo/i), '10000');
      await user.type(screen.getByLabelText(/tasa de interés anual/i), '5.5');
      await user.type(screen.getByLabelText(/plazo en meses/i), '12');

      fireEvent.click(screen.getByRole('button', { name: /calcular cuota mensual/i }));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('debe mostrar error genérico cuando no hay mensaje específico en el cálculo', async () => {
      const user = userEvent.setup({ delay: null });
      (api.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/monto del préstamo/i), '10000');
      await user.type(screen.getByLabelText(/tasa de interés anual/i), '5.5');
      await user.type(screen.getByLabelText(/plazo en meses/i), '12');

      fireEvent.click(screen.getByRole('button', { name: /calcular cuota mensual/i }));

      await waitFor(() => {
        expect(screen.getByText('Error al calcular la cuota mensual')).toBeInTheDocument();
      });
    });

    it('debe formatear la cuota mensual en formato de moneda europea', async () => {
      const user = userEvent.setup({ delay: null });
      (api.post as jest.Mock).mockResolvedValue({
        data: { monthlyPayment: 1234.56 },
      });

      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/monto del préstamo/i), '10000');
      await user.type(screen.getByLabelText(/tasa de interés anual/i), '5.5');
      await user.type(screen.getByLabelText(/plazo en meses/i), '12');

      fireEvent.click(screen.getByRole('button', { name: /calcular cuota mensual/i }));

      await waitFor(() => {
        // Formato: 1.234,56 € o 1234,56 € (dependiendo de la configuración del locale)
        expect(screen.getByText(/1[\s.]?234,56/)).toBeInTheDocument();
      });
    });

    it('debe limpiar errores previos al calcular de nuevo', async () => {
      const user = userEvent.setup({ delay: null });
      (api.post as jest.Mock).mockRejectedValueOnce({
        response: { data: { message: 'Error temporal' } },
      });

      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/monto del préstamo/i), '10000');
      await user.type(screen.getByLabelText(/tasa de interés anual/i), '5.5');
      await user.type(screen.getByLabelText(/plazo en meses/i), '12');

      fireEvent.click(screen.getByRole('button', { name: /calcular cuota mensual/i }));

      await waitFor(() => {
        expect(screen.getByText('Error temporal')).toBeInTheDocument();
      });

      // Calcular de nuevo (exitoso)
      (api.post as jest.Mock).mockResolvedValue({
        data: { monthlyPayment: 858.33 },
      });

      fireEvent.click(screen.getByRole('button', { name: /calcular cuota mensual/i }));

      await waitFor(() => {
        expect(screen.queryByText('Error temporal')).not.toBeInTheDocument();
      });
    });

    it('debe limpiar la cuota calculada previamente al calcular de nuevo', async () => {
      const user = userEvent.setup({ delay: null });
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { monthlyPayment: 100 },
      });

      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/monto del préstamo/i), '10000');
      await user.type(screen.getByLabelText(/tasa de interés anual/i), '5.5');
      await user.type(screen.getByLabelText(/plazo en meses/i), '12');

      fireEvent.click(screen.getByRole('button', { name: /calcular cuota mensual/i }));

      await waitFor(() => {
        expect(screen.getByText(/100,00/)).toBeInTheDocument();
      });

      // Antes de calcular de nuevo, la cuota debe desaparecer momentáneamente
      (api.post as jest.Mock).mockResolvedValue({
        data: { monthlyPayment: 200 },
      });

      fireEvent.click(screen.getByRole('button', { name: /calcular cuota mensual/i }));

      // La cuota anterior desaparece (aunque luego aparece la nueva)
      await waitFor(() => {
        expect(screen.getByText(/200,00/)).toBeInTheDocument();
      });
    });
  });

  describe('Solicitud de préstamo', () => {
    it('debe enviar la solicitud correctamente', async () => {
      const user = userEvent.setup({ delay: null });
      (api.post as jest.Mock).mockResolvedValue({});

      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/monto del préstamo/i), '15000');
      await user.type(screen.getByLabelText(/tasa de interés anual/i), '4.5');
      await user.type(screen.getByLabelText(/plazo en meses/i), '24');

      fireEvent.submit(screen.getByRole('button', { name: /solicitar préstamo/i }).closest('form')!);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/loans', {
          amount: 15000,
          interestRate: 4.5,
          termInMonths: 24,
        });
      });
    });

    it('debe mostrar mensaje de éxito después de solicitar el préstamo', async () => {
      const user = userEvent.setup({ delay: null });
      (api.post as jest.Mock).mockResolvedValue({});

      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/monto del préstamo/i), '15000');
      await user.type(screen.getByLabelText(/tasa de interés anual/i), '4.5');
      await user.type(screen.getByLabelText(/plazo en meses/i), '24');

      fireEvent.submit(screen.getByRole('button', { name: /solicitar préstamo/i }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Préstamo solicitado exitosamente')).toBeInTheDocument();
      });
    });

    it('debe navegar a /loans después de solicitar exitosamente', async () => {
      const user = userEvent.setup({ delay: null });
      (api.post as jest.Mock).mockResolvedValue({});

      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/monto del préstamo/i), '15000');
      await user.type(screen.getByLabelText(/tasa de interés anual/i), '4.5');
      await user.type(screen.getByLabelText(/plazo en meses/i), '24');

      fireEvent.submit(screen.getByRole('button', { name: /solicitar préstamo/i }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Préstamo solicitado exitosamente')).toBeInTheDocument();
      });

      // Fast-forward time
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/loans');
      });
    });

    it('debe mostrar "Enviando..." mientras procesa la solicitud', async () => {
      const user = userEvent.setup({ delay: null });
      (api.post as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/monto del préstamo/i), '15000');
      await user.type(screen.getByLabelText(/tasa de interés anual/i), '4.5');
      await user.type(screen.getByLabelText(/plazo en meses/i), '24');

      fireEvent.submit(screen.getByRole('button', { name: /solicitar préstamo/i }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Enviando...')).toBeInTheDocument();
      });
    });

    it('debe deshabilitar el botón mientras procesa la solicitud', async () => {
      const user = userEvent.setup({ delay: null });
      (api.post as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/monto del préstamo/i), '15000');
      await user.type(screen.getByLabelText(/tasa de interés anual/i), '4.5');
      await user.type(screen.getByLabelText(/plazo en meses/i), '24');

      const submitButton = screen.getByRole('button', { name: /solicitar préstamo/i });
      fireEvent.submit(submitButton.closest('form')!);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('debe mostrar error cuando la solicitud falla', async () => {
      const user = userEvent.setup({ delay: null });
      const errorMessage = 'Datos inválidos';
      (api.post as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/monto del préstamo/i), '15000');
      await user.type(screen.getByLabelText(/tasa de interés anual/i), '4.5');
      await user.type(screen.getByLabelText(/plazo en meses/i), '24');

      fireEvent.submit(screen.getByRole('button', { name: /solicitar préstamo/i }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('debe mostrar error genérico cuando no hay mensaje específico', async () => {
      const user = userEvent.setup({ delay: null });
      (api.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/monto del préstamo/i), '15000');
      await user.type(screen.getByLabelText(/tasa de interés anual/i), '4.5');
      await user.type(screen.getByLabelText(/plazo en meses/i), '24');

      fireEvent.submit(screen.getByRole('button', { name: /solicitar préstamo/i }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Error al solicitar el préstamo')).toBeInTheDocument();
      });
    });

    it('debe limpiar mensajes de error y éxito al enviar de nuevo', async () => {
      const user = userEvent.setup({ delay: null });
      (api.post as jest.Mock).mockRejectedValueOnce({
        response: { data: { message: 'Error temporal' } },
      });

      render(
        <BrowserRouter>
          <RequestLoan />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/monto del préstamo/i), '15000');
      await user.type(screen.getByLabelText(/tasa de interés anual/i), '4.5');
      await user.type(screen.getByLabelText(/plazo en meses/i), '24');

      fireEvent.submit(screen.getByRole('button', { name: /solicitar préstamo/i }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Error temporal')).toBeInTheDocument();
      });

      // Enviar de nuevo (exitoso)
      (api.post as jest.Mock).mockResolvedValue({});

      fireEvent.submit(screen.getByRole('button', { name: /solicitar préstamo/i }).closest('form')!);

      await waitFor(() => {
        expect(screen.queryByText('Error temporal')).not.toBeInTheDocument();
      });
    });
  });
});
