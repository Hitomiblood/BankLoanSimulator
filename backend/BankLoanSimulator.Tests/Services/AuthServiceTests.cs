using BankLoanSimulator.Application.DTOs;
using BankLoanSimulator.Application.Interfaces;
using BankLoanSimulator.Application.Services;
using BankLoanSimulator.Domain.Entitys;
using FluentAssertions;
using Moq;

namespace BankLoanSimulator.Tests.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly AuthService _authService;
        private const string JwtSecret = "test-secret-key-for-testing-purposes-must-be-at-least-32-characters-long";
        private const string JwtIssuer = "TestIssuer";

        public AuthServiceTests()
        {
            _userRepositoryMock = new Mock<IUserRepository>();
            _authService = new AuthService(_userRepositoryMock.Object, JwtSecret, JwtIssuer, 30);
        }

        #region RegisterAsync Tests

        [Fact]
        public async Task RegisterAsync_WithValidData_CreatesUserSuccessfully()
        {
            var request = new RegisterRequestDto
            {
                FullName = "Usuario Estándar",
                Email = "usuario@example.com",
                Password = "123"
            };

            _userRepositoryMock
                .Setup(x => x.EmailExistsAsync(request.Email))
                .ReturnsAsync(false);

            _userRepositoryMock
                .Setup(x => x.CreateAsync(It.IsAny<User>()))
                .ReturnsAsync((User user) => user);

            var result = await _authService.RegisterAsync(request);

            
            result.Should().NotBeNull();
            result.FullName.Should().Be("Usuario Estándar");
            result.Email.Should().Be("usuario@example.com");
            result.IsAdmin.Should().BeFalse(); 
            result.Token.Should().NotBeNullOrEmpty();
            result.UserId.Should().NotBeEmpty();

            _userRepositoryMock.Verify(x => x.EmailExistsAsync(request.Email), Times.Once);
            _userRepositoryMock.Verify(x => x.CreateAsync(It.Is<User>(u =>
                u.Email == "usuario@example.com" &&
                u.PasswordHash != request.Password && 
                !u.IsAdmin)), Times.Once);
        }

        [Fact]
        public async Task RegisterAsync_WithExistingEmail_ThrowsException()
        {
            var request = new RegisterRequestDto
            {
                FullName = "Usuario Estándar",
                Email = "existing@example.com",
                Password = "123"
            };

            _userRepositoryMock
                .Setup(x => x.EmailExistsAsync(request.Email))
                .ReturnsAsync(true); 

            await _authService
                .Invoking(s => s.RegisterAsync(request))
                .Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("El email ya está registrado");

            _userRepositoryMock.Verify(x => x.CreateAsync(It.IsAny<User>()), Times.Never);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public async Task RegisterAsync_WithEmptyFullName_ThrowsException(string fullName)
        {
            var request = new RegisterRequestDto
            {
                FullName = fullName,
                Email = "test@example.com",
                Password = "123"
            };

            _userRepositoryMock.Setup(x => x.EmailExistsAsync(It.IsAny<string>())).ReturnsAsync(false);

            await _authService
                .Invoking(s => s.RegisterAsync(request))
                .Should().ThrowAsync<ArgumentException>()
                .WithMessage("El nombre completo es requerido");
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public async Task RegisterAsync_WithEmptyEmail_ThrowsException(string email)
        {
            var request = new RegisterRequestDto
            {
                FullName = "Test User",
                Email = email,
                Password = "123"
            };

            _userRepositoryMock.Setup(x => x.EmailExistsAsync(It.IsAny<string>())).ReturnsAsync(false);

            await _authService
                .Invoking(s => s.RegisterAsync(request))
                .Should().ThrowAsync<ArgumentException>()
                .WithMessage("El email es requerido");
        }

        [Theory]
        [InlineData("12345")] 
        [InlineData("Pass")] 
        [InlineData("")] 
        public async Task RegisterAsync_WithShortPassword_ThrowsException(string password)
        {
            var request = new RegisterRequestDto
            {
                FullName = "Test User",
                Email = "test@example.com",
                Password = password
            };

            _userRepositoryMock.Setup(x => x.EmailExistsAsync(It.IsAny<string>())).ReturnsAsync(false);

            await _authService
                .Invoking(s => s.RegisterAsync(request))
                .Should().ThrowAsync<ArgumentException>()
                .WithMessage("La contraseña debe tener al menos 6 caracteres");
        }

        [Fact]
        public async Task RegisterAsync_ConvertsEmailToLowerCase()
        {
            var request = new RegisterRequestDto
            {
                FullName = "Test User",
                Email = "TEST@EXAMPLE.COM",
                Password = "123"
            };

            _userRepositoryMock.Setup(x => x.EmailExistsAsync(It.IsAny<string>())).ReturnsAsync(false);
            _userRepositoryMock.Setup(x => x.CreateAsync(It.IsAny<User>()))
                .ReturnsAsync((User user) => user);

            var result = await _authService.RegisterAsync(request);

            result.Email.Should().Be("test@example.com");
            _userRepositoryMock.Verify(x => x.CreateAsync(It.Is<User>(u =>
                u.Email == "test@example.com")), Times.Once);
        }

        #endregion

        #region LoginAsync Tests

        [Fact]
        public async Task LoginAsync_WithValidCredentials_ReturnsToken()
        {
            var password = "123";
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = passwordHash,
                IsAdmin = false
            };

            var request = new LoginRequestDto
            {
                Email = "test@example.com",
                Password = password
            };

            _userRepositoryMock
                .Setup(x => x.GetByEmailAsync(request.Email))
                .ReturnsAsync(user);

            var result = await _authService.LoginAsync(request);

            result.Should().NotBeNull();
            result.UserId.Should().Be(user.Id);
            result.FullName.Should().Be(user.FullName);
            result.Email.Should().Be(user.Email);
            result.IsAdmin.Should().Be(user.IsAdmin);
            result.Token.Should().NotBeNullOrEmpty();
        }


        [Fact]
        public async Task LoginAsync_WithNonExistentEmail_ThrowsException()
        {

            var request = new LoginRequestDto
            {
                Email = "nonexistent@example.com",
                Password = "123"
            };

            _userRepositoryMock
                .Setup(x => x.GetByEmailAsync(request.Email))
                .ReturnsAsync((User?)null);


            await _authService
                .Invoking(s => s.LoginAsync(request))
                .Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage("Email o contraseña incorrectos");
        }
        [Fact]
        public async Task LoginAsync_WithWrongPassword_ThrowsException()
        {
            var correctPassword = "123";
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(correctPassword);

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                PasswordHash = passwordHash
            };

            var request = new LoginRequestDto
            {
                Email = "test@example.com",
                Password = "WrongPassword!"
            };

            _userRepositoryMock
                .Setup(x => x.GetByEmailAsync(request.Email))
                .ReturnsAsync(user);

            await _authService
                .Invoking(s => s.LoginAsync(request))
                .Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage("Email o contraseña incorrectos");
        }

        [Fact]
        public async Task LoginAsync_EmailIsCaseInsensitive()
        {
            var password = "123";
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                PasswordHash = passwordHash
            };

            var request = new LoginRequestDto
            {
                Email = "TEST@EXAMPLE.COM", 
                Password = password
            };

            _userRepositoryMock
                .Setup(x => x.GetByEmailAsync("test@example.com")) 
                .ReturnsAsync(user);

            var result = await _authService.LoginAsync(request);

            result.Should().NotBeNull();
            _userRepositoryMock.Verify(x => x.GetByEmailAsync("test@example.com"), Times.Once);
        }

        [Fact]
        public async Task LoginAsync_WithAdminUser_ReturnsAdminFlag()
        {
            var password = "Admin123!";
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "admin@example.com",
                PasswordHash = passwordHash,
                IsAdmin = true 
            };

            var request = new LoginRequestDto
            {
                Email = "admin@example.com",
                Password = password
            };

            _userRepositoryMock
                .Setup(x => x.GetByEmailAsync(request.Email))
                .ReturnsAsync(user);

            var result = await _authService.LoginAsync(request);

            result.IsAdmin.Should().BeTrue();
        }

        #endregion

        #region ValidateTokenAsync Tests

        [Fact]
        public async Task ValidateTokenAsync_WithValidToken_ReturnsUserId()
        {
            var userId = Guid.NewGuid();
            var password = "123";
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                PasswordHash = passwordHash,
                FullName = "Test User"
            };

            var loginRequest = new LoginRequestDto
            {
                Email = "test@example.com",
                Password = password
            };

            _userRepositoryMock.Setup(x => x.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);

            var loginResult = await _authService.LoginAsync(loginRequest);
            var token = loginResult.Token;

            var result = await _authService.ValidateTokenAsync(token);

            result.Should().NotBeNull();
            result.Should().Be(userId);
        }

        [Fact]
        public async Task ValidateTokenAsync_WithInvalidToken_ReturnsNull()
        {
            var invalidToken = "invalid.token.here";

            var result = await _authService.ValidateTokenAsync(invalidToken);

            result.Should().BeNull();
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        public async Task ValidateTokenAsync_WithEmptyToken_ReturnsNull(string token)
        {
            var result = await _authService.ValidateTokenAsync(token);

            result.Should().BeNull();
        }

        #endregion

        #region JWT Token Tests

        [Fact]
        public async Task GeneratedToken_ContainsCorrectClaims()
        {

            var password = "123";
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = passwordHash,
                IsAdmin = true
            };

            var request = new LoginRequestDto
            {
                Email = "test@example.com",
                Password = password
            };

            _userRepositoryMock.Setup(x => x.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);


            var result = await _authService.LoginAsync(request);


            result.Token.Should().NotBeNullOrEmpty();
            

            var tokenParts = result.Token.Split('.');
            tokenParts.Should().HaveCount(3);


            var validatedUserId = await _authService.ValidateTokenAsync(result.Token);
            validatedUserId.Should().Be(user.Id);
        }

        #endregion
    }
}
