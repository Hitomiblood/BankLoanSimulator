using BankLoanSimulator.Application.DTOs;
using BankLoanSimulator.Application.Interfaces;
using BankLoanSimulator.Application.Services;
using BankLoanSimulator.Domain.Entitys;
using BankLoanSimulator.Domain.Enums;
using FluentAssertions;
using Moq;

namespace BankLoanSimulator.Tests.Services
{
    public class LoanServiceTests
    {
        private readonly Mock<ILoanRepository> _loanRepositoryMock;
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly LoanService _loanService;

        public LoanServiceTests()
        {
            _loanRepositoryMock = new Mock<ILoanRepository>();
            _userRepositoryMock = new Mock<IUserRepository>();
            _loanService = new LoanService(_loanRepositoryMock.Object, _userRepositoryMock.Object);
        }

        #region CalculateMonthlyPayment Tests

        [Fact]
        public void CalculateMonthlyPayment_WithInterest_ReturnsCorrectAmount()
        {
            decimal amount = 10000m;
            decimal interestRate = 12m;
            int termInMonths = 24;

            var result = _loanService.CalculateMonthlyPayment(amount, interestRate, termInMonths);

            result.Should().BeApproximately(471.78m, 0.01m);
        }

        [Fact]
        public void CalculateMonthlyPayment_WithZeroInterest_ReturnsDividedAmount()
        {
            decimal amount = 12000m;
            decimal interestRate = 0m;
            int termInMonths = 12;

            var result = _loanService.CalculateMonthlyPayment(amount, interestRate, termInMonths);

            result.Should().Be(1000m);
        }

        [Theory]
        [InlineData(5000, 8.0, 12, 434.94)]
        [InlineData(25000, 15.0, 60, 593.51)]
        [InlineData(100000, 10.0, 120, 1321.51)]
        public void CalculateMonthlyPayment_DifferentScenarios_ReturnsCorrectAmount(
            decimal amount, decimal rate, int months, decimal expectedPayment)
        {
            var result = _loanService.CalculateMonthlyPayment(amount, rate, months);

            result.Should().BeApproximately(expectedPayment, 0.02m);
        }

        #endregion

        #region CreateLoanAsync Tests

        [Fact]
        public async Task CreateLoanAsync_WithValidData_CreatesLoanSuccessfully()
        {
            var userId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "test@example.com",
                IsAdmin = false
            };

            var request = new CreateLoanRequestDto
            {
                Amount = 10000m,
                InterestRate = 12m,
                TermInMonths = 24
            };

            _userRepositoryMock
                .Setup(x => x.GetByIdAsync(userId))
                .ReturnsAsync(user);

            _loanRepositoryMock
                .Setup(x => x.CreateAsync(It.IsAny<Loan>()))
                .ReturnsAsync((Loan loan) =>
                {
                    loan.User = user;
                    return loan;
                });

            var result = await _loanService.CreateLoanAsync(userId, request);

            result.Should().NotBeNull();
            result.Amount.Should().Be(10000m);
            result.InterestRate.Should().Be(12m);
            result.TermInMonths.Should().Be(24);
            result.MonthlyPayment.Should().BeApproximately(471.78m, 0.01m);
            result.Status.Should().Be(LoanStatusEnum.Pending);
            result.UserFullName.Should().Be("Test User");

            _userRepositoryMock.Verify(x => x.GetByIdAsync(userId), Times.Once);
            _loanRepositoryMock.Verify(x => x.CreateAsync(It.IsAny<Loan>()), Times.Once);
        }

        [Fact]
        public async Task CreateLoanAsync_WithNonExistentUser_ThrowsException()
        {
            var userId = Guid.NewGuid();
            var request = new CreateLoanRequestDto
            {
                Amount = 10000m,
                InterestRate = 12m,
                TermInMonths = 24
            };

            _userRepositoryMock
                .Setup(x => x.GetByIdAsync(userId))
                .ReturnsAsync((User?)null);

            await _loanService
                .Invoking(s => s.CreateLoanAsync(userId, request))
                .Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("Usuario no encontrado");
        }

        [Fact]
        public async Task CreateLoanAsync_WithNegativeAmount_ThrowsException()
        {
            var userId = Guid.NewGuid();
            var user = new User { Id = userId };
            var request = new CreateLoanRequestDto
            {
                Amount = -1000m,
                InterestRate = 12m,
                TermInMonths = 24
            };

            _userRepositoryMock.Setup(x => x.GetByIdAsync(userId)).ReturnsAsync(user);

            await _loanService
                .Invoking(s => s.CreateLoanAsync(userId, request))
                .Should().ThrowAsync<ArgumentException>()
                .WithMessage("El monto debe ser mayor a 0");
        }

        [Fact]
        public async Task CreateLoanAsync_WithExcessiveAmount_ThrowsException()
        {
            var userId = Guid.NewGuid();
            var user = new User { Id = userId };
            var request = new CreateLoanRequestDto
            {
                Amount = 2000000m,
                InterestRate = 12m,
                TermInMonths = 24
            };

            _userRepositoryMock.Setup(x => x.GetByIdAsync(userId)).ReturnsAsync(user);

            await _loanService
                .Invoking(s => s.CreateLoanAsync(userId, request))
                .Should().ThrowAsync<ArgumentException>()
                .WithMessage("El monto máximo es $1,000,000");
        }

        [Theory]
        [InlineData(-5)]
        [InlineData(60)]
        public async Task CreateLoanAsync_WithInvalidInterestRate_ThrowsException(decimal rate)
        {
            var userId = Guid.NewGuid();
            var user = new User { Id = userId };
            var request = new CreateLoanRequestDto
            {
                Amount = 10000m,
                InterestRate = rate,
                TermInMonths = 24
            };

            _userRepositoryMock.Setup(x => x.GetByIdAsync(userId)).ReturnsAsync(user);

            await _loanService
                .Invoking(s => s.CreateLoanAsync(userId, request))
                .Should().ThrowAsync<ArgumentException>()
                .WithMessage("La tasa de interés debe estar entre 0% y 50%");
        }

        [Theory]
        [InlineData(0)]
        [InlineData(400)]
        public async Task CreateLoanAsync_WithInvalidTerm_ThrowsException(int months)
        {
            var userId = Guid.NewGuid();
            var user = new User { Id = userId };
            var request = new CreateLoanRequestDto
            {
                Amount = 10000m,
                InterestRate = 12m,
                TermInMonths = months
            };

            _userRepositoryMock.Setup(x => x.GetByIdAsync(userId)).ReturnsAsync(user);

            await _loanService
                .Invoking(s => s.CreateLoanAsync(userId, request))
                .Should().ThrowAsync<ArgumentException>()
                .WithMessage("El plazo debe estar entre 1 y 360 meses");
        }

        #endregion

        #region ReviewLoanAsync Tests

        [Fact]
        public async Task ReviewLoanAsync_ApprovePendingLoan_UpdatesSuccessfully()
        {
            var loanId = Guid.NewGuid();
            var loan = new Loan
            {
                Id = loanId,
                Amount = 10000m,
                Status = LoanStatusEnum.Pending,
                UserId = Guid.NewGuid(),
                User = new User { FullName = "Test", Email = "test@test.com" }
            };

            var request = new ReviewLoanRequestDto
            {
                Status = LoanStatusEnum.Approved,
                AdminComments = "Aprobado por buen historial"
            };

            _loanRepositoryMock.Setup(x => x.GetByIdAsync(loanId)).ReturnsAsync(loan);
            _loanRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Loan>()))
                .ReturnsAsync((Loan l) => l);

            var result = await _loanService.ReviewLoanAsync(loanId, request);

            result.Should().NotBeNull();
            result.Status.Should().Be(LoanStatusEnum.Approved);
            result.AdminComments.Should().Be("Aprobado por buen historial");
            
            _loanRepositoryMock.Verify(x => x.UpdateAsync(It.Is<Loan>(l => 
                l.Status == LoanStatusEnum.Approved && 
                l.ReviewDate != null)), Times.Once);
        }

        [Fact]
        public async Task ReviewLoanAsync_RejectPendingLoan_UpdatesSuccessfully()
        {
            var loanId = Guid.NewGuid();
            var loan = new Loan
            {
                Id = loanId,
                Status = LoanStatusEnum.Pending,
                UserId = Guid.NewGuid(),
                User = new User { FullName = "Test", Email = "test@test.com" }
            };

            var request = new ReviewLoanRequestDto
            {
                Status = LoanStatusEnum.Rejected,
                AdminComments = "Ingresos insuficientes"
            };

            _loanRepositoryMock.Setup(x => x.GetByIdAsync(loanId)).ReturnsAsync(loan);
            _loanRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Loan>()))
                .ReturnsAsync((Loan l) => l);

            var result = await _loanService.ReviewLoanAsync(loanId, request);

            result.Status.Should().Be(LoanStatusEnum.Rejected);
            result.AdminComments.Should().Be("Ingresos insuficientes");
        }

        [Fact]
        public async Task ReviewLoanAsync_NonExistentLoan_ThrowsException()
        {
            var loanId = Guid.NewGuid();
            var request = new ReviewLoanRequestDto { Status = LoanStatusEnum.Approved };

            _loanRepositoryMock.Setup(x => x.GetByIdAsync(loanId)).ReturnsAsync((Loan?)null);

            await _loanService
                .Invoking(s => s.ReviewLoanAsync(loanId, request))
                .Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("Préstamo no encontrado");
        }

        [Theory]
        [InlineData(LoanStatusEnum.Approved)]
        [InlineData(LoanStatusEnum.Rejected)]
        public async Task ReviewLoanAsync_AlreadyReviewedLoan_ThrowsException(LoanStatusEnum status)
        {
            var loanId = Guid.NewGuid();
            var loan = new Loan
            {
                Id = loanId,
                Status = status,
                UserId = Guid.NewGuid(),
                User = new User { FullName = "Test", Email = "test@test.com" }
            };

            var request = new ReviewLoanRequestDto { Status = LoanStatusEnum.Approved };

            _loanRepositoryMock.Setup(x => x.GetByIdAsync(loanId)).ReturnsAsync(loan);

            await _loanService
                .Invoking(s => s.ReviewLoanAsync(loanId, request))
                .Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("El préstamo ya fue revisado anteriormente");
        }

        [Fact]
        public async Task ReviewLoanAsync_SetStatusToPending_ThrowsException()
        {
            var loanId = Guid.NewGuid();
            var loan = new Loan
            {
                Id = loanId,
                Status = LoanStatusEnum.Pending,
                UserId = Guid.NewGuid(),
                User = new User { FullName = "Test", Email = "test@test.com" }
            };

            var request = new ReviewLoanRequestDto { Status = LoanStatusEnum.Pending };

            _loanRepositoryMock.Setup(x => x.GetByIdAsync(loanId)).ReturnsAsync(loan);

            await _loanService
                .Invoking(s => s.ReviewLoanAsync(loanId, request))
                .Should().ThrowAsync<ArgumentException>()
                .WithMessage("No puede establecer el estado como Pending");
        }

        #endregion

        #region GetUserLoansAsync Tests

        [Fact]
        public async Task GetUserLoansAsync_ReturnsUserLoans()
        {
            var userId = Guid.NewGuid();
            var loans = new List<Loan>
            {
                new Loan
                {
                    Id = Guid.NewGuid(),
                    Amount = 10000m,
                    UserId = userId,
                    User = new User { Id = userId, FullName = "Test", Email = "test@test.com" }
                },
                new Loan
                {
                    Id = Guid.NewGuid(),
                    Amount = 20000m,
                    UserId = userId,
                    User = new User { Id = userId, FullName = "Test", Email = "test@test.com" }
                }
            };

            _loanRepositoryMock.Setup(x => x.GetByUserIdAsync(userId)).ReturnsAsync(loans);

            var result = await _loanService.GetUserLoansAsync(userId);

            result.Should().HaveCount(2);
            result.Should().OnlyContain(l => l.UserId == userId);
        }

        #endregion
    }
}
