using BankLoanSimulator.Application.DTOs;
using BankLoanSimulator.Application.Interfaces;
using BankLoanSimulator.Domain.Entitys;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BankLoanSimulator.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly string _jwtSecret;
        private readonly string _jwtIssuer;
        private readonly int _jwtExpirationDays;

        public AuthService(
            IUserRepository userRepository,
            string jwtSecret,
            string jwtIssuer = "BankLoanSimulator",
            int jwtExpirationDays = 30)
        {
            _userRepository = userRepository;
            _jwtSecret = jwtSecret;
            _jwtIssuer = jwtIssuer;
            _jwtExpirationDays = jwtExpirationDays;
        }
        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
        {
            if (await _userRepository.EmailExistsAsync(request.Email))
            {
                throw new InvalidOperationException("El email ya está registrado");
            }

            if (string.IsNullOrWhiteSpace(request.FullName))
                throw new ArgumentException("El nombre completo es requerido");

            if (string.IsNullOrWhiteSpace(request.Email))
                throw new ArgumentException("El email es requerido");

            if (request.Password.Length < 6)
                throw new ArgumentException("La contraseña debe tener al menos 6 caracteres");

            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = request.FullName,
                Email = request.Email.ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password), 
                IsAdmin = false, 
                CreatedAt = DateTime.UtcNow
            };

            await _userRepository.CreateAsync(user);
            var token = GenerateJwtToken(user);

            return new AuthResponseDto
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                IsAdmin = user.IsAdmin,
                Token = token
            };
        }
        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
        {
            var user = await _userRepository.GetByEmailAsync(request.Email.ToLower());
            
            if (user == null)
                throw new UnauthorizedAccessException("Email o contraseña incorrectos");

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Email o contraseña incorrectos");

            var token = GenerateJwtToken(user);

            return new AuthResponseDto
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                IsAdmin = user.IsAdmin,
                Token = token
            };
        }
        public Task<Guid?> ValidateTokenAsync(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_jwtSecret);

                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _jwtIssuer,
                    ValidateAudience = false,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                var jwtToken = (JwtSecurityToken)validatedToken;
                var userIdClaim = jwtToken.Claims.First(x => x.Type == ClaimTypes.NameIdentifier).Value;

                return Task.FromResult<Guid?>(Guid.Parse(userIdClaim));
            }
            catch
            {
                return Task.FromResult<Guid?>(null);
            }
        }

        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtSecret);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.IsAdmin ? "Admin" : "User")
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(_jwtExpirationDays),
                Issuer = _jwtIssuer,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
