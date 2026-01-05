using BankLoanSimulator.Domain.Entitys;
using Microsoft.EntityFrameworkCore;

namespace BankLoanSimulator.Infrastructure.DbContext
{

    public class ApplicationDbContext : Microsoft.EntityFrameworkCore.DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) 
            : base(options)
        {
        }
        public DbSet<User> Users { get; set; }
        public DbSet<Loan> Loans { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                entity.HasKey(u => u.Id);
                entity.HasIndex(u => u.Email)
                    .IsUnique();
                entity.Property(u => u.FullName)
                    .IsRequired()
                    .HasMaxLength(200);
                entity.Property(u => u.Email)
                    .IsRequired()
                    .HasMaxLength(100);
                entity.Property(u => u.PasswordHash)
                    .IsRequired()
                    .HasMaxLength(500);
                entity.HasMany(u => u.Loans)
                    .WithOne(l => l.User)
                    .HasForeignKey(l => l.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Loan>(entity =>
            {
                entity.ToTable("Loans");
                entity.HasKey(l => l.Id);
                entity.Property(l => l.Amount)
                    .HasPrecision(18, 2)
                    .IsRequired();
                entity.Property(l => l.InterestRate)
                    .HasPrecision(5, 2)
                    .IsRequired();
                entity.Property(l => l.MonthlyPayment)
                    .HasPrecision(18, 2)
                    .IsRequired();
                entity.Property(l => l.TermInMonths)
                    .IsRequired();
                entity.Property(l => l.Status)
                    .IsRequired();
                entity.Property(l => l.AdminComments)
                    .HasMaxLength(500);

            });
            SeedData(modelBuilder);
        }
        private void SeedData(ModelBuilder modelBuilder)
        {
            var adminId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = adminId,
                FullName = "Administrador del Sistema",
                Email = "admin@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123"), 
                IsAdmin = true,
                CreatedAt = new DateTime(2026, 1, 5)
            });

            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = userId,
                FullName = "Usuario Estándar",
                Email = "usuario@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123"), 
                IsAdmin = false,
                CreatedAt = new DateTime(2026, 1, 5)
            });
        }
    }
}
