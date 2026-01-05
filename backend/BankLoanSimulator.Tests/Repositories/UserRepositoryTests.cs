using BankLoanSimulator.Domain.Entitys;
using BankLoanSimulator.Domain.Enums;
using BankLoanSimulator.Infrastructure.DbContext;
using BankLoanSimulator.Infrastructure.Repositories;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace BankLoanSimulator.Tests.Repositories
{
    public class UserRepositoryTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly UserRepository _repository;

        public UserRepositoryTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _repository = new UserRepository(_context);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        #region CreateAsync Tests

        [Fact]
        public async Task CreateAsync_CreatesUserSuccessfully()
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                IsAdmin = false,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _repository.CreateAsync(user);

            result.Should().NotBeNull();
            result.Id.Should().Be(user.Id);
            result.Email.Should().Be("test@example.com");

            var savedUser = await _context.Users.FindAsync(user.Id);
            savedUser.Should().NotBeNull();
            savedUser!.FullName.Should().Be("Test User");
        }

        #endregion

        #region GetByIdAsync Tests

        [Fact]
        public async Task GetByIdAsync_ReturnsUser_WhenExists()
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hash"
            };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var result = await _repository.GetByIdAsync(user.Id);

            result.Should().NotBeNull();
            result!.Id.Should().Be(user.Id);
            result.FullName.Should().Be("Test User");
        }

        [Fact]
        public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
        {
            var nonExistentId = Guid.NewGuid();

            var result = await _repository.GetByIdAsync(nonExistentId);

            result.Should().BeNull();
        }

        [Fact]
        public async Task GetByIdAsync_IncludesLoans()
        {
            var userId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hash"
            };

            var loan = new Loan
            {
                Id = Guid.NewGuid(),
                Amount = 10000m,
                InterestRate = 12m,
                TermInMonths = 24,
                MonthlyPayment = 471.78m,
                UserId = userId,
                Status = LoanStatusEnum.Pending
            };

            await _context.Users.AddAsync(user);
            await _context.Loans.AddAsync(loan);
            await _context.SaveChangesAsync();

            var result = await _repository.GetByIdAsync(userId);

            result.Should().NotBeNull();
            result!.Loans.Should().HaveCount(1);
            result.Loans.First().Amount.Should().Be(10000m);
        }

        #endregion

        #region GetByEmailAsync Tests

        [Fact]
        public async Task GetByEmailAsync_ReturnsUser_WhenExists()
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hash"
            };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var result = await _repository.GetByEmailAsync("test@example.com");

            result.Should().NotBeNull();
            result!.Email.Should().Be("test@example.com");
        }

        [Fact]
        public async Task GetByEmailAsync_ReturnsNull_WhenNotExists()
        {
            var result = await _repository.GetByEmailAsync("nonexistent@example.com");

            result.Should().BeNull();
        }

        #endregion

        #region EmailExistsAsync Tests

        [Fact]
        public async Task EmailExistsAsync_ReturnsTrue_WhenEmailExists()
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "existing@example.com",
                FullName = "Test",
                PasswordHash = "hash"
            };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var result = await _repository.EmailExistsAsync("existing@example.com");

            result.Should().BeTrue();
        }

        [Fact]
        public async Task EmailExistsAsync_ReturnsFalse_WhenEmailDoesNotExist()
        {
            var result = await _repository.EmailExistsAsync("nonexistent@example.com");

            result.Should().BeFalse();
        }

        #endregion

        #region GetAllAsync Tests

        [Fact]
        public async Task GetAllAsync_ReturnsAllUsers()
        {
            var users = new List<User>
            {
                new User { Id = Guid.NewGuid(), Email = "user1@test.com", FullName = "User 1", PasswordHash = "hash" },
                new User { Id = Guid.NewGuid(), Email = "user2@test.com", FullName = "User 2", PasswordHash = "hash" },
                new User { Id = Guid.NewGuid(), Email = "user3@test.com", FullName = "User 3", PasswordHash = "hash" }
            };

            await _context.Users.AddRangeAsync(users);
            await _context.SaveChangesAsync();

            var result = await _repository.GetAllAsync();

            result.Should().HaveCount(3);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsEmptyList_WhenNoUsers()
        {
            var result = await _repository.GetAllAsync();

            result.Should().BeEmpty();
        }

        #endregion

        #region UpdateAsync Tests

        [Fact]
        public async Task UpdateAsync_UpdatesUserSuccessfully()
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Original Name",
                Email = "test@example.com",
                PasswordHash = "hash"
            };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            user.FullName = "Updated Name";

            var result = await _repository.UpdateAsync(user);

            result.FullName.Should().Be("Updated Name");

            var updatedUser = await _context.Users.FindAsync(user.Id);
            updatedUser!.FullName.Should().Be("Updated Name");
        }

        #endregion

        #region DeleteAsync Tests

        [Fact]
        public async Task DeleteAsync_DeletesUser_WhenExists()
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hash"
            };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var result = await _repository.DeleteAsync(user.Id);

            result.Should().BeTrue();

            var deletedUser = await _context.Users.FindAsync(user.Id);
            deletedUser.Should().BeNull();
        }

        [Fact]
        public async Task DeleteAsync_ReturnsFalse_WhenUserDoesNotExist()
        {
            var nonExistentId = Guid.NewGuid();

            var result = await _repository.DeleteAsync(nonExistentId);

            result.Should().BeFalse();
        }

        [Fact]
        public async Task DeleteAsync_CascadeDeletesLoans()
        {
            var userId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hash"
            };

            var loan = new Loan
            {
                Id = Guid.NewGuid(),
                Amount = 10000m,
                InterestRate = 12m,
                TermInMonths = 24,
                MonthlyPayment = 471.78m,
                UserId = userId,
                Status = LoanStatusEnum.Pending
            };

            await _context.Users.AddAsync(user);
            await _context.Loans.AddAsync(loan);
            await _context.SaveChangesAsync();

            var result = await _repository.DeleteAsync(userId);

            result.Should().BeTrue();

            var deletedLoan = await _context.Loans.FindAsync(loan.Id);
            deletedLoan.Should().BeNull();
        }

        #endregion
    }
}
