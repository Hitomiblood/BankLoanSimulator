using BankLoanSimulator.Application.DTOs;
using BankLoanSimulator.Application.Interfaces;
using BankLoanSimulator.Domain.Entitys;
using BankLoanSimulator.Domain.Enums;

namespace BankLoanSimulator.Application.Services
{
    public class LoanService : ILoanService
    {
        private readonly ILoanRepository _loanRepository;
        private readonly IUserRepository _userRepository;

        public LoanService(ILoanRepository loanRepository, IUserRepository userRepository)
        {
            _loanRepository = loanRepository;
            _userRepository = userRepository;
        }
        public async Task<LoanResponseDto> CreateLoanAsync(Guid userId, CreateLoanRequestDto request)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("Usuario no encontrado");

            if (request.Amount <= 0)
                throw new ArgumentException("El monto debe ser mayor a 0");

            if (request.Amount > 100000000)
                throw new ArgumentException("El monto máximo es $100,000,000");

            if (request.InterestRate < 0 || request.InterestRate > 50)
                throw new ArgumentException("La tasa de interés debe estar entre 0% y 50%");

            if (request.TermInMonths < 1 || request.TermInMonths > 240)
                throw new ArgumentException("El plazo debe estar entre 1 y 240 meses");

            var monthlyPayment = CalculateMonthlyPayment(
                request.Amount,
                request.InterestRate,
                request.TermInMonths);

            var loan = new Loan
            {
                Id = Guid.NewGuid(),
                Amount = request.Amount,
                InterestRate = request.InterestRate,
                TermInMonths = request.TermInMonths,
                MonthlyPayment = monthlyPayment,
                UserId = userId,
                Status = LoanStatusEnum.Pending,
                RequestDate = DateTime.UtcNow
            };

            var createdLoan = await _loanRepository.CreateAsync(loan);

            return MapToLoanResponseDto(createdLoan);
        }
        public async Task<IEnumerable<LoanResponseDto>> GetUserLoansAsync(Guid userId)
        {
            var loans = await _loanRepository.GetByUserIdAsync(userId);
            return loans.Select(MapToLoanResponseDto);
        }
        public async Task<IEnumerable<LoanResponseDto>> GetAllLoansAsync()
        {
            var loans = await _loanRepository.GetAllAsync();
            return loans.Select(MapToLoanResponseDto);
        }
        public async Task<LoanResponseDto?> GetLoanByIdAsync(Guid loanId)
        {
            var loan = await _loanRepository.GetByIdAsync(loanId);
            return loan != null ? MapToLoanResponseDto(loan) : null;
        }
        public async Task<LoanResponseDto> ReviewLoanAsync(Guid loanId, ReviewLoanRequestDto request)
        {
            var loan = await _loanRepository.GetByIdAsync(loanId);
            
            if (loan == null)
                throw new InvalidOperationException("Préstamo no encontrado");

            if (loan.Status != LoanStatusEnum.Pending)
                throw new InvalidOperationException("El préstamo ya fue revisado anteriormente");

            if (request.Status == LoanStatusEnum.Pending)
                throw new ArgumentException("No puede establecer el estado como Pending");

            loan.Status = request.Status;
            loan.AdminComments = request.AdminComments;
            loan.ReviewDate = DateTime.UtcNow;

            var updatedLoan = await _loanRepository.UpdateAsync(loan);
            return MapToLoanResponseDto(updatedLoan);
        }
        public async Task<bool> DeleteLoanAsync(Guid loanId)
        {
            return await _loanRepository.DeleteAsync(loanId);
        }

        /// <summary>
        /// Calcula la cuota mensual de un préstamo
        /// 
        /// FÓRMULA FINANCIERA:
        /// M = P * [r(1+r)^n] / [(1+r)^n – 1]
        /// 
        /// Donde:
        /// M = Cuota mensual
        /// P = Monto del préstamo (Principal)
        /// r = Tasa de interés mensual (anual / 12 / 100)
        /// n = Número de meses
        /// 
        /// EJEMPLO:
        /// Préstamo: $10,000
        /// Tasa anual: 12%
        /// Plazo: 12 meses
        /// 
        /// r = 12 / 12 / 100 = 0.01 (1% mensual)
        /// M = 10000 * [0.01(1.01)^12] / [(1.01)^12 - 1]
        /// M ≈ $888.49
        /// </summary>
        public decimal CalculateMonthlyPayment(decimal amount, decimal annualInterestRate, int termInMonths)
        {
            if (annualInterestRate == 0)
            {
                return Math.Round(amount / termInMonths, 2);
            }

            double monthlyRate = (double)(annualInterestRate / 12 / 100);
            
            double principal = (double)amount;
            int months = termInMonths;

            double onePlusR = 1 + monthlyRate;
            double power = Math.Pow(onePlusR, months);
            
            double monthlyPayment = principal * (monthlyRate * power) / (power - 1);

            return Math.Round((decimal)monthlyPayment, 2);
        }
        private LoanResponseDto MapToLoanResponseDto(Loan loan)
        {
            return new LoanResponseDto
            {
                Id = loan.Id,
                Amount = loan.Amount,
                InterestRate = loan.InterestRate,
                TermInMonths = loan.TermInMonths,
                MonthlyPayment = loan.MonthlyPayment,
                Status = loan.Status,
                StatusText = loan.Status.ToString(),
                RequestDate = loan.RequestDate,
                ReviewDate = loan.ReviewDate,
                AdminComments = loan.AdminComments,
                UserId = loan.UserId,
                UserFullName = loan.User?.FullName ?? "Usuario Desconocido",
                UserEmail = loan.User?.Email ?? ""
            };
        }
    }
}
