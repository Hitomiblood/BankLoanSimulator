using BankLoanSimulator.Application.DTOs;

namespace BankLoanSimulator.Application.Interfaces
{
    public interface ILoanService
    {
        Task<LoanResponseDto> CreateLoanAsync(Guid userId, CreateLoanRequestDto request);
        Task<IEnumerable<LoanResponseDto>> GetUserLoansAsync(Guid userId);
        Task<IEnumerable<LoanResponseDto>> GetAllLoansAsync();
        Task<LoanResponseDto?> GetLoanByIdAsync(Guid loanId);
        Task<LoanResponseDto> ReviewLoanAsync(Guid loanId, ReviewLoanRequestDto request);
        Task<bool> DeleteLoanAsync(Guid loanId);
        decimal CalculateMonthlyPayment(decimal amount, decimal annualInterestRate, int termInMonths);
    }
}
