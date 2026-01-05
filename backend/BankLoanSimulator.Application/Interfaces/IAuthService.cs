using BankLoanSimulator.Application.DTOs;

namespace BankLoanSimulator.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
        Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
        Task<Guid?> ValidateTokenAsync(string token);
    }
}
