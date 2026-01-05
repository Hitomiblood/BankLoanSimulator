using BankLoanSimulator.Domain.Enums;

namespace BankLoanSimulator.Domain.Entitys
{
    public class Loan
    {
        public Guid Id { get; set; }
        public decimal Amount { get; set; }
        public decimal InterestRate { get; set; }
        public int TermInMonths { get; set; }
        public decimal MonthlyPayment { get; set; }
        public LoanStatusEnum Status { get; set; } = LoanStatusEnum.Pending;
        public DateTime RequestDate { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewDate { get; set; }
        public string? AdminComments { get; set; }
        public Guid UserId { get; set; }
        public virtual User User { get; set; } = null!;
    }
}
