using BankLoanSimulator.Application.DTOs;
using BankLoanSimulator.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BankLoanSimulator.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] 
    public class LoansController : ControllerBase
    {
        private readonly ILoanService _loanService;
        private readonly ILogger<LoansController> _logger;

        public LoansController(ILoanService loanService, ILogger<LoansController> logger)
        {
            _loanService = loanService;
            _logger = logger;
        }

        [HttpPost]
        [ProducesResponseType(typeof(LoanResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<LoanResponseDto>> CreateLoan([FromBody] CreateLoanRequestDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { error = "Token inválido" });

                var userId = Guid.Parse(userIdClaim);
                _logger.LogInformation("Usuario {UserId} solicita préstamo de {Amount}", userId, request.Amount);
                var result = await _loanService.CreateLoanAsync(userId, request);
                _logger.LogInformation("Préstamo {LoanId} creado exitosamente", result.Id);

                return CreatedAtAction(nameof(GetLoanById), new { id = result.Id }, result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("Validación fallida: {Message}", ex.Message);
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear préstamo");
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }

        [HttpGet("my-loans")]
        [ProducesResponseType(typeof(IEnumerable<LoanResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<LoanResponseDto>>> GetMyLoans()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized();

                var userId = Guid.Parse(userIdClaim);
                
                var loans = await _loanService.GetUserLoansAsync(userId);
                
                return Ok(loans);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener préstamos del usuario");
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }

        [HttpGet]
        [Authorize(Roles = "Admin")] 
        [ProducesResponseType(typeof(IEnumerable<LoanResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IEnumerable<LoanResponseDto>>> GetAllLoans()
        {
            try
            {
                _logger.LogInformation("Admin solicitando todos los préstamos");
                var loans = await _loanService.GetAllLoansAsync();
                return Ok(loans);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener todos los préstamos");
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(LoanResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<LoanResponseDto>> GetLoanById(Guid id)
        {
            try
            {
                var loan = await _loanService.GetLoanByIdAsync(id);
                
                if (loan == null)
                    return NotFound(new { error = "Préstamo no encontrado" });

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var isAdmin = User.IsInRole("Admin");

                if (!isAdmin && loan.UserId.ToString() != userIdClaim)
                {
                    _logger.LogWarning("Usuario {UserId} intentó acceder a préstamo ajeno {LoanId}", 
                        userIdClaim, id);
                    return Forbid();
                }

                return Ok(loan);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener préstamo {LoanId}", id);
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }

        [HttpPut("{id}/review")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(LoanResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<LoanResponseDto>> ReviewLoan(Guid id, [FromBody] ReviewLoanRequestDto request)
        {
            try
            {
                _logger.LogInformation("Admin revisando préstamo {LoanId} con estado {Status}", 
                    id, request.Status);

                var result = await _loanService.ReviewLoanAsync(id, request);

                _logger.LogInformation("Préstamo {LoanId} actualizado a estado {Status}", 
                    id, result.Status);

                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("Error en revisión de préstamo: {Message}", ex.Message);
                return BadRequest(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("Validación fallida: {Message}", ex.Message);
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al revisar préstamo {LoanId}", id);
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }

        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult> DeleteLoan(Guid id)
        {
            try
            {
                var loan = await _loanService.GetLoanByIdAsync(id);
                
                if (loan == null)
                    return NotFound(new { error = "Préstamo no encontrado" });

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var isAdmin = User.IsInRole("Admin");

                if (!isAdmin && loan.UserId.ToString() != userIdClaim)
                {
                    return Forbid();
                }

                var deleted = await _loanService.DeleteLoanAsync(id);
                
                if (!deleted)
                    return NotFound(new { error = "Préstamo no encontrado" });

                _logger.LogInformation("Préstamo {LoanId} eliminado", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar préstamo {LoanId}", id);
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }
        
        [HttpPost("calculate")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public ActionResult<object> CalculatePayment([FromBody] CreateLoanRequestDto request)
        {
            try
            {
                var monthlyPayment = _loanService.CalculateMonthlyPayment(
                    request.Amount,
                    request.InterestRate,
                    request.TermInMonths);

                var totalPayment = monthlyPayment * request.TermInMonths;
                var totalInterest = totalPayment - request.Amount;

                return Ok(new
                {
                    amount = request.Amount,
                    interestRate = request.InterestRate,
                    termInMonths = request.TermInMonths,
                    monthlyPayment,
                    totalPayment,
                    totalInterest
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al calcular pago");
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
