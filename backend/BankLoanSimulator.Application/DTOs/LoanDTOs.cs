using BankLoanSimulator.Domain.Enums;

namespace BankLoanSimulator.Application.DTOs
{
    public class CreateLoanRequestDto
    {
        public decimal Amount { get; set; }
        public decimal InterestRate { get; set; }
        public int TermInMonths { get; set; }
    }

    public class ReviewLoanRequestDto
    {
        public LoanStatusEnum Status { get; set; }
        public string? AdminComments { get; set; }
    }
    public class LoanResponseDto
    {
        public Guid Id { get; set; }
        public decimal Amount { get; set; }
        public decimal InterestRate { get; set; }
        public int TermInMonths { get; set; }
        public decimal MonthlyPayment { get; set; }
        public LoanStatusEnum Status { get; set; }
        public string StatusText { get; set; } = string.Empty;
        public DateTime RequestDate { get; set; }
        public DateTime? ReviewDate { get; set; }
        public string? AdminComments { get; set; }
        public Guid UserId { get; set; }
        public string UserFullName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
    }
    public class LoanListItemDto
    {
        public Guid Id { get; set; }
        public decimal Amount { get; set; }
        public int TermInMonths { get; set; }
        public decimal MonthlyPayment { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime RequestDate { get; set; }
        public string UserFullName { get; set; } = string.Empty;
    }
}
