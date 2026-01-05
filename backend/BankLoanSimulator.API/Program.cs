using BankLoanSimulator.Application.Interfaces;
using BankLoanSimulator.Application.Services;
using BankLoanSimulator.Infrastructure.DbContext;
using BankLoanSimulator.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    // Opción 1: Base de datos en memoria
    options.UseInMemoryDatabase("BankLoanSimulatorDb");

    // Opción 2: SQL Server real
    // var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    // options.UseSqlServer(connectionString);
});

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ILoanRepository, LoanRepository>();
builder.Services.AddScoped<ILoanService, LoanService>();

builder.Services.AddScoped<IAuthService>(provider =>
{
    var userRepo = provider.GetRequiredService<IUserRepository>();
    var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "mi-super-secreto-temporal-cambiar-en-produccion-12345678";
    var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "BankLoanSimulator";
    var jwtExpirationDays = int.Parse(builder.Configuration["Jwt:ExpirationDays"] ?? "30");
    
    return new AuthService(userRepo, jwtSecret, jwtIssuer, jwtExpirationDays);
});

var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "mi-super-secreto-temporal-cambiar-en-produccion-12345678";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "BankLoanSimulator";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true, 
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true, 
        ValidIssuer = jwtIssuer,
        ValidateAudience = false, 
        ValidateLifetime = true, 
        ClockSkew = TimeSpan.Zero 
    };
});


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173"
        )
        .AllowAnyHeader()      
        .AllowAnyMethod()      
        .AllowCredentials(); 
    });
});

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Bank Loan Simulator API",
        Version = "v1",
        Description = "API para simulador de préstamos bancarios",
        Contact = new OpenApiContact
        {
            Name = "Miguel Santiago Gómez",
            Email = "miguelsantiago1999@hotmail.com"
        }
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Ejemplo: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();


using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.EnsureCreated();
}


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Bank Loan Simulator API v1");
        c.RoutePrefix = string.Empty;
    });
}


app.UseHttpsRedirection();


app.UseCors("AllowFrontend");

app.UseAuthentication();


app.UseAuthorization();


app.MapControllers();

var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("=================================================");
logger.LogInformation("Bank Loan Simulator API Iniciada");
logger.LogInformation("Swagger UI: https://localhost:{Port}/", 
    builder.Configuration["Urls"] ?? "5001");
logger.LogInformation("=================================================");
logger.LogInformation("");
logger.LogInformation("📧 Usuarios de prueba:");
logger.LogInformation("  Admin: admin@test.com / 123");
logger.LogInformation("  Usuario: usuario@example.com / User123!");
logger.LogInformation("");
logger.LogInformation("=================================================");

app.Run();
