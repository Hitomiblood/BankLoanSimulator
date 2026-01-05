using BankLoanSimulator.Application.Interfaces;
using BankLoanSimulator.Domain.Entitys;
using BankLoanSimulator.Domain.Enums;
using BankLoanSimulator.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace BankLoanSimulator.Infrastructure.Repositories
{
    public class LoanRepository : ILoanRepository
    {
        private readonly ApplicationDbContext _context;

        public LoanRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<IEnumerable<Loan>> GetAllAsync()
        {
            return await _context.Loans
                .Include(l => l.User)
                .OrderByDescending(l => l.RequestDate)
                .ToListAsync();
        }
        public async Task<IEnumerable<Loan>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Loans
                .Include(l => l.User)
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.RequestDate)
                .ToListAsync();
        }
        public async Task<Loan?> GetByIdAsync(Guid id)
        {
            return await _context.Loans
                .Include(l => l.User)
                .FirstOrDefaultAsync(l => l.Id == id);
        }
        public async Task<IEnumerable<Loan>> GetByStatusAsync(LoanStatusEnum status)
        {
            return await _context.Loans
                .Include(l => l.User)
                .Where(l => l.Status == status)
                .OrderByDescending(l => l.RequestDate)
                .ToListAsync();
        }
        public async Task<Loan> CreateAsync(Loan loan)
        {
            await _context.Loans.AddAsync(loan);
            await _context.SaveChangesAsync();
            return await GetByIdAsync(loan.Id) ?? loan;
        }
        public async Task<Loan> UpdateAsync(Loan loan)
        {
            _context.Loans.Update(loan);
            await _context.SaveChangesAsync();
            return await GetByIdAsync(loan.Id) ?? loan;
        }
        public async Task<bool> DeleteAsync(Guid id)
        {
            var loan = await _context.Loans.FindAsync(id);
            if (loan == null)
                return false;

            _context.Loans.Remove(loan);
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<int> GetPendingCountAsync()
        {
            return await _context.Loans
                .CountAsync(l => l.Status == LoanStatusEnum.Pending);
        }
    }
}
