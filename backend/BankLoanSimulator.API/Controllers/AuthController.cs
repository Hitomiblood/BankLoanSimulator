using BankLoanSimulator.Application.DTOs;
using BankLoanSimulator.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BankLoanSimulator.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;
        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("register")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterRequestDto request)
        {
            try
            {
                _logger.LogInformation("Intento de registro para email: {Email}", request.Email);
                var result = await _authService.RegisterAsync(request);
                _logger.LogInformation("Usuario registrado exitosamente: {UserId}", result.UserId);
                return CreatedAtAction(nameof(Register), new { id = result.UserId }, result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("Error en registro: {Message}", ex.Message);
                return BadRequest(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("Validación fallida en registro: {Message}", ex.Message);
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado en registro");
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }

        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto request)
        {
            try
            {
                _logger.LogInformation("Intento de login para email: {Email}", request.Email);
                var result = await _authService.LoginAsync(request);
                _logger.LogInformation("Login exitoso para usuario: {UserId}", result.UserId);
                
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning("Login fallido para email: {Email}", request.Email);
                return Unauthorized(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado en login");
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }

        [HttpGet("me")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public ActionResult GetCurrentUser()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var name = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            return Ok(new
            {
                userId,
                email,
                name,
                role,
                isAuthenticated = true
            });
        }
    }
}
