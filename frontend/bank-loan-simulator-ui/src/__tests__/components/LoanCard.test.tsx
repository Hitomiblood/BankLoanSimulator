import { render, screen } from '@testing-library/react';
import { describe, it } from '@jest/globals';
import '@testing-library/jest-dom';
import LoanCard from '../../components/LoanCard';
import type { Loan } from '../../types/Loan';
import { LoanStatus } from '../../types/Loan';

// Mock de datos de préstamo para testing
const mockLoanPending: Loan = {
  id: '1',
  amount: 10000,
  interestRate: 5.5,
  termInMonths: 24,
  monthlyPayment: 450.50,
  requestDate: '2024-01-15T10:30:00',
  status: LoanStatus.Pending,
  userId: 'user-1',
};

const mockLoanApproved: Loan = {
  id: '2',
  amount: 15000,
  interestRate: 4.8,
  termInMonths: 36,
  monthlyPayment: 450.25,
  requestDate: '2024-01-10T09:00:00',
  reviewDate: '2024-01-12T14:30:00',
  status: LoanStatus.Approved,
  userId: 'user-2',
  adminComments: 'Aprobado por buen historial crediticio',
};

const mockLoanWithUser: Loan = {
  ...mockLoanPending,
  user: {
    fullName: 'Juan Pérez',
    email: 'juan.perez@example.com'
  },
};

describe('LoanCard Component', () => {
  describe('Renderizado básico', () => {
    it('debe renderizar el componente sin errores', () => {
      render(<LoanCard loan={mockLoanPending} />);
      expect(screen.getByText('10.000,00 €')).toBeInTheDocument();
    });

    it('debe mostrar el monto del préstamo formateado correctamente', () => {
      render(<LoanCard loan={mockLoanPending} />);
      expect(screen.getByText('10.000,00 €')).toBeInTheDocument();
    });

    it('debe mostrar la tasa de interés', () => {
      render(<LoanCard loan={mockLoanPending} />);
      expect(screen.getByText(/5.5%/)).toBeInTheDocument();
    });

    it('debe mostrar el plazo en meses', () => {
      render(<LoanCard loan={mockLoanPending} />);
      expect(screen.getByText(/24 meses/)).toBeInTheDocument();
    });

    it('debe mostrar la cuota mensual formateada', () => {
      render(<LoanCard loan={mockLoanPending} />);
      expect(screen.getByText(/450,50 €/)).toBeInTheDocument();
    });

    it('debe mostrar la fecha de solicitud', () => {
      render(<LoanCard loan={mockLoanPending} />);
      expect(screen.getByText(/15 de enero de 2024/)).toBeInTheDocument();
    });
  });

  describe('Estados del préstamo', () => {
    it('debe mostrar chip "Pendiente" con color warning para préstamos pendientes', () => {
      const { container } = render(<LoanCard loan={mockLoanPending} />);
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
      // Verificar que existe un chip con la clase de warning
      const chip = container.querySelector('.MuiChip-colorWarning');
      expect(chip).toBeInTheDocument();
    });

    it('debe mostrar chip "Aprobado" con color success para préstamos aprobados', () => {
      const { container } = render(<LoanCard loan={mockLoanApproved} />);
      expect(screen.getByText('Aprobado')).toBeInTheDocument();
      // Verificar que existe un chip con la clase de success
      const chip = container.querySelector('.MuiChip-colorSuccess');
      expect(chip).toBeInTheDocument();
    });

    it('debe mostrar chip "Rechazado" para préstamos rechazados', () => {
      const rejectedLoan = { ...mockLoanPending, status: LoanStatus.Rejected };
      const { container } = render(<LoanCard loan={rejectedLoan} />);
      expect(screen.getByText('Rechazado')).toBeInTheDocument();
      // Verificar que existe un chip con la clase de error
      const chip = container.querySelector('.MuiChip-colorError');
      expect(chip).toBeInTheDocument();
    });

    it('debe manejar estados desconocidos con label "Desconocido"', () => {
      const unknownLoan = { ...mockLoanPending, status: 999 as LoanStatus };
      render(<LoanCard loan={unknownLoan} />);
      expect(screen.getByText('Desconocido')).toBeInTheDocument();
    });

    it('debe usar color "default" para estados desconocidos', () => {
      const unknownLoan = { ...mockLoanPending, status: 999 as LoanStatus };
      const { container } = render(<LoanCard loan={unknownLoan} />);
      const chip = container.querySelector('.MuiChip-colorDefault');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Información del usuario (showUser prop)', () => {
    it('no debe mostrar información del usuario por defecto', () => {
      render(<LoanCard loan={mockLoanWithUser} />);
      expect(screen.queryByText('Usuario:')).not.toBeInTheDocument();
      expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
    });

    it('debe mostrar información del usuario cuando showUser=true', () => {
      render(<LoanCard loan={mockLoanWithUser} showUser={true} />);
      expect(screen.getByText('Usuario:')).toBeInTheDocument();
      expect(screen.getByText(/Juan Pérez/)).toBeInTheDocument();
      expect(screen.getByText(/juan.perez@example.com/)).toBeInTheDocument();
    });

    it('no debe fallar si showUser=true pero no hay usuario', () => {
      render(<LoanCard loan={mockLoanPending} showUser={true} />);
      expect(screen.queryByText('Usuario:')).not.toBeInTheDocument();
    });
  });

  describe('Información adicional condicional', () => {
    it('debe mostrar fecha de revisión si existe', () => {
      render(<LoanCard loan={mockLoanApproved} />);
      expect(screen.getByText(/Fecha revisión:/)).toBeInTheDocument();
      expect(screen.getByText(/12 de enero de 2024/)).toBeInTheDocument();
    });

    it('no debe mostrar fecha de revisión si no existe', () => {
      render(<LoanCard loan={mockLoanPending} />);
      expect(screen.queryByText(/Fecha revisión:/)).not.toBeInTheDocument();
    });

    it('debe mostrar comentarios del admin si existen', () => {
      render(<LoanCard loan={mockLoanApproved} />);
      expect(screen.getByText(/Comentarios:/)).toBeInTheDocument();
      expect(screen.getByText('Aprobado por buen historial crediticio')).toBeInTheDocument();
    });

    it('no debe mostrar comentarios del admin si no existen', () => {
      render(<LoanCard loan={mockLoanPending} />);
      expect(screen.queryByText(/Comentarios:/)).not.toBeInTheDocument();
    });
  });

  describe('Formateo de datos', () => {
    it('debe formatear correctamente montos grandes', () => {
      const largeLoan = { ...mockLoanPending, amount: 1000000 };
      render(<LoanCard loan={largeLoan} />);
      expect(screen.getByText('1.000.000,00 €')).toBeInTheDocument();
    });

    it('debe formatear correctamente decimales en tasas de interés', () => {
      const decimalRateLoan = { ...mockLoanPending, interestRate: 3.75 };
      render(<LoanCard loan={decimalRateLoan} />);
      expect(screen.getByText(/3.75%/)).toBeInTheDocument();
    });
  });
});
