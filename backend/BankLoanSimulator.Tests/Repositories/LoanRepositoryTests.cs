using BankLoanSimulator.Domain.Entitys;
using BankLoanSimulator.Domain.Enums;
using BankLoanSimulator.Infrastructure.DbContext;
using BankLoanSimulator.Infrastructure.Repositories;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace BankLoanSimulator.Tests.Repositories
{
    public class LoanRepositoryTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly LoanRepository _repository;
        private readonly Guid _testUserId;

        public LoanRepositoryTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _repository = new LoanRepository(_context);


            _testUserId = Guid.NewGuid();
            var testUser = new User
            {
                Id = _testUserId,
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hash"
            };
            _context.Users.Add(testUser);
            _context.SaveChanges();
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        #region CreateAsync Tests

        [Fact]
        public async Task CreateAsync_CreatesLoanSuccessfully()
        {
            
            var loan = new Loan
            {
                Id = Guid.NewGuid(),
                Amount = 10000m,
                InterestRate = 12m,
                TermInMonths = 24,
                MonthlyPayment = 471.78m,
                UserId = _testUserId,
                Status = LoanStatusEnum.Pending,
                RequestDate = DateTime.UtcNow
            };

            
            var result = await _repository.CreateAsync(loan);

            
            result.Should().NotBeNull();
            result.Id.Should().Be(loan.Id);
            result.Amount.Should().Be(10000m);
            result.User.Should().NotBeNull();
            result.User.FullName.Should().Be("Test User");
        }

        #endregion

        #region GetByIdAsync Tests

        [Fact]
        public async Task GetByIdAsync_ReturnsLoan_WhenExists()
        {
            
            var loan = new Loan
            {
                Id = Guid.NewGuid(),
                Amount = 15000m,
                InterestRate = 10m,
                TermInMonths = 36,
                MonthlyPayment = 484.01m,
                UserId = _testUserId,
                Status = LoanStatusEnum.Pending
            };
            await _context.Loans.AddAsync(loan);
            await _context.SaveChangesAsync();

            
            var result = await _repository.GetByIdAsync(loan.Id);

            
            result.Should().NotBeNull();
            result!.Id.Should().Be(loan.Id);
            result.Amount.Should().Be(15000m);
            result.User.Should().NotBeNull();
        }

        [Fact]
        public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
        {
            
            var nonExistentId = Guid.NewGuid();

            
            var result = await _repository.GetByIdAsync(nonExistentId);

            
            result.Should().BeNull();
        }

        #endregion

        #region GetAllAsync Tests

        [Fact]
        public async Task GetAllAsync_ReturnsAllLoans_OrderedByDateDescending()
        {
            
            var loans = new List<Loan>
            {
                new Loan
                {
                    Id = Guid.NewGuid(),
                    Amount = 10000m,
                    InterestRate = 12m,
                    TermInMonths = 24,
                    MonthlyPayment = 471.78m,
                    UserId = _testUserId,
                    Status = LoanStatusEnum.Pending,
                    RequestDate = DateTime.UtcNow.AddDays(-2) 
                },
                new Loan
                {
                    Id = Guid.NewGuid(),
                    Amount = 20000m,
                    InterestRate = 10m,
                    TermInMonths = 36,
                    MonthlyPayment = 645.34m,
                    UserId = _testUserId,
                    Status = LoanStatusEnum.Approved,
                    RequestDate = DateTime.UtcNow 
                }
            };

            await _context.Loans.AddRangeAsync(loans);
            await _context.SaveChangesAsync();

            
            var result = (await _repository.GetAllAsync()).ToList();

            
            result.Should().HaveCount(2);
            result[0].Amount.Should().Be(20000m); 
            result[1].Amount.Should().Be(10000m);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsEmptyList_WhenNoLoans()
        {
            
            var result = await _repository.GetAllAsync();

            
            result.Should().BeEmpty();
        }

        #endregion

        #region GetByUserIdAsync Tests

        [Fact]
        public async Task GetByUserIdAsync_ReturnsOnlyUserLoans()
        {
            
            var otherUserId = Guid.NewGuid();
            var otherUser = new User
            {
                Id = otherUserId,
                FullName = "Other User",
                Email = "other@example.com",
                PasswordHash = "hash"
            };
            await _context.Users.AddAsync(otherUser);

            var testUserLoans = new List<Loan>
            {
                new Loan
                {
                    Id = Guid.NewGuid(),
                    Amount = 10000m,
                    InterestRate = 12m,
                    TermInMonths = 24,
                    MonthlyPayment = 471.78m,
                    UserId = _testUserId,
                    Status = LoanStatusEnum.Pending
                },
                new Loan
                {
                    Id = Guid.NewGuid(),
                    Amount = 15000m,
                    InterestRate = 10m,
                    TermInMonths = 36,
                    MonthlyPayment = 484.01m,
                    UserId = _testUserId,
                    Status = LoanStatusEnum.Approved
                }
            };

            var otherUserLoan = new Loan
            {
                Id = Guid.NewGuid(),
                Amount = 20000m,
                InterestRate = 15m,
                TermInMonths = 48,
                MonthlyPayment = 556.20m,
                UserId = otherUserId,
                Status = LoanStatusEnum.Pending
            };

            await _context.Loans.AddRangeAsync(testUserLoans);
            await _context.Loans.AddAsync(otherUserLoan);
            await _context.SaveChangesAsync();

            
            var result = await _repository.GetByUserIdAsync(_testUserId);

            
            result.Should().HaveCount(2);
            result.Should().OnlyContain(l => l.UserId == _testUserId);
        }

        [Fact]
        public async Task GetByUserIdAsync_ReturnsEmptyList_WhenUserHasNoLoans()
        {
            
            var userWithNoLoans = Guid.NewGuid();

            
            var result = await _repository.GetByUserIdAsync(userWithNoLoans);

            
            result.Should().BeEmpty();
        }

        #endregion

        #region GetByStatusAsync Tests

        [Fact]
        public async Task GetByStatusAsync_ReturnsOnlyLoansWithSpecifiedStatus()
        {
            
            var loans = new List<Loan>
            {
                new Loan
                {
                    Id = Guid.NewGuid(),
                    Amount = 10000m,
                    InterestRate = 12m,
                    TermInMonths = 24,
                    MonthlyPayment = 471.78m,
                    UserId = _testUserId,
                    Status = LoanStatusEnum.Pending
                },
                new Loan
                {
                    Id = Guid.NewGuid(),
                    Amount = 15000m,
                    InterestRate = 10m,
                    TermInMonths = 36,
                    MonthlyPayment = 484.01m,
                    UserId = _testUserId,
                    Status = LoanStatusEnum.Approved
                },
                new Loan
                {
                    Id = Guid.NewGuid(),
                    Amount = 20000m,
                    InterestRate = 15m,
                    TermInMonths = 48,
                    MonthlyPayment = 556.20m,
                    UserId = _testUserId,
                    Status = LoanStatusEnum.Pending
                },
                new Loan
                {
                    Id = Guid.NewGuid(),
                    Amount = 5000m,
                    InterestRate = 8m,
                    TermInMonths = 12,
                    MonthlyPayment = 434.94m,
                    UserId = _testUserId,
                    Status = LoanStatusEnum.Rejected
                }
            };

            await _context.Loans.AddRangeAsync(loans);
            await _context.SaveChangesAsync();

            
            var pendingLoans = await _repository.GetByStatusAsync(LoanStatusEnum.Pending);
            var approvedLoans = await _repository.GetByStatusAsync(LoanStatusEnum.Approved);
            var rejectedLoans = await _repository.GetByStatusAsync(LoanStatusEnum.Rejected);

            
            pendingLoans.Should().HaveCount(2);
            pendingLoans.Should().OnlyContain(l => l.Status == LoanStatusEnum.Pending);

            approvedLoans.Should().HaveCount(1);
            approvedLoans.Should().OnlyContain(l => l.Status == LoanStatusEnum.Approved);

            rejectedLoans.Should().HaveCount(1);
            rejectedLoans.Should().OnlyContain(l => l.Status == LoanStatusEnum.Rejected);
        }

        #endregion

        #region GetPendingCountAsync Tests

        [Fact]
        public async Task GetPendingCountAsync_ReturnsCorrectCount()
        {
            
            var loans = new List<Loan>
            {
                new Loan
                {
                    Id = Guid.NewGuid(),
                    Amount = 10000m,
                    InterestRate = 12m,
                    TermInMonths = 24,
                    MonthlyPayment = 471.78m,
                    UserId = _testUserId,
                    Status = LoanStatusEnum.Pending
                },
                new Loan
                {
                    Id = Guid.NewGuid(),
                    Amount = 15000m,
                    InterestRate = 10m,
                    TermInMonths = 36,
                    MonthlyPayment = 484.01m,
                    UserId = _testUserId,
                    Status = LoanStatusEnum.Pending
                },
                new Loan
                {
                    Id = Guid.NewGuid(),
                    Amount = 20000m,
                    InterestRate = 15m,
                    TermInMonths = 48,
                    MonthlyPayment = 556.20m,
                    UserId = _testUserId,
                    Status = LoanStatusEnum.Approved
                }
            };

            await _context.Loans.AddRangeAsync(loans);
            await _context.SaveChangesAsync();

            
            var count = await _repository.GetPendingCountAsync();

            
            count.Should().Be(2);
        }

        [Fact]
        public async Task GetPendingCountAsync_ReturnsZero_WhenNoPendingLoans()
        {
            
            var loan = new Loan
            {
                Id = Guid.NewGuid(),
                Amount = 10000m,
                InterestRate = 12m,
                TermInMonths = 24,
                MonthlyPayment = 471.78m,
                UserId = _testUserId,
                Status = LoanStatusEnum.Approved
            };
            await _context.Loans.AddAsync(loan);
            await _context.SaveChangesAsync();

            
            var count = await _repository.GetPendingCountAsync();

            
            count.Should().Be(0);
        }

        #endregion

        #region UpdateAsync Tests

        [Fact]
        public async Task UpdateAsync_UpdatesLoanSuccessfully()
        {
            
            var loan = new Loan
            {
                Id = Guid.NewGuid(),
                Amount = 10000m,
                InterestRate = 12m,
                TermInMonths = 24,
                MonthlyPayment = 471.78m,
                UserId = _testUserId,
                Status = LoanStatusEnum.Pending
            };
            await _context.Loans.AddAsync(loan);
            await _context.SaveChangesAsync();

            loan.Status = LoanStatusEnum.Approved;
            loan.AdminComments = "Aprobado";
            loan.ReviewDate = DateTime.UtcNow;

            
            var result = await _repository.UpdateAsync(loan);

            
            result.Status.Should().Be(LoanStatusEnum.Approved);
            result.AdminComments.Should().Be("Aprobado");
            result.ReviewDate.Should().NotBeNull();


            var updatedLoan = await _context.Loans.FindAsync(loan.Id);
            updatedLoan!.Status.Should().Be(LoanStatusEnum.Approved);
        }

        #endregion

        #region DeleteAsync Tests

        [Fact]
        public async Task DeleteAsync_DeletesLoan_WhenExists()
        {
            
            var loan = new Loan
            {
                Id = Guid.NewGuid(),
                Amount = 10000m,
                InterestRate = 12m,
                TermInMonths = 24,
                MonthlyPayment = 471.78m,
                UserId = _testUserId,
                Status = LoanStatusEnum.Pending
            };
            await _context.Loans.AddAsync(loan);
            await _context.SaveChangesAsync();

            
            var result = await _repository.DeleteAsync(loan.Id);

            
            result.Should().BeTrue();


            var deletedLoan = await _context.Loans.FindAsync(loan.Id);
            deletedLoan.Should().BeNull();
        }

        [Fact]
        public async Task DeleteAsync_ReturnsFalse_WhenLoanDoesNotExist()
        {
            
            var nonExistentId = Guid.NewGuid();

            
            var result = await _repository.DeleteAsync(nonExistentId);

            
            result.Should().BeFalse();
        }

        #endregion
    }
}
