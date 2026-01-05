using BankLoanSimulator.Domain.Entitys;
using BankLoanSimulator.Domain.Enums;

namespace BankLoanSimulator.Application.Interfaces
{
    public interface ILoanRepository
    {
        Task<IEnumerable<Loan>> GetAllAsync();
        Task<IEnumerable<Loan>> GetByUserIdAsync(Guid userId);
        Task<Loan?> GetByIdAsync(Guid id);
        Task<IEnumerable<Loan>> GetByStatusAsync(LoanStatusEnum status);
        Task<Loan> CreateAsync(Loan loan);
        Task<Loan> UpdateAsync(Loan loan);
        Task<bool> DeleteAsync(Guid id);
        Task<int> GetPendingCountAsync();
    }
}
