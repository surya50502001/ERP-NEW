using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ErpBackend.Data;
using ErpBackend.Services;

var builder = WebApplication.CreateBuilder(args);

// Database Connection
var connectionString = builder.Configuration.GetConnectionString("ErpDb") ??
    "Server=(localdb)\\mssqllocaldb;Database=ERP;Trusted_Connection=True;TrustServerCertificate=True;";

builder.Services.AddDbContext<ErpDbContext>(options =>
    options.UseSqlServer(connectionString));

// Dependency Injection - Domain Services
builder.Services.AddScoped<IDocumentSeriesService, DocumentSeriesService>();
builder.Services.AddScoped<ISalesInvoiceService, SalesInvoiceService>();
builder.Services.AddScoped<IGrnService, GrnService>();
builder.Services.AddScoped<IStockService, StockService>();
builder.Services.AddScoped<IMasterDataService, MasterDataService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

// JWT Bearer Authentication
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] ?? "PRIME_ERP_PRODUCTION_JWT_SECRET_KEY_FOR_AUTHENTICATION_2026_ENTERPRISE_SECURE_TOKEN!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "PrimeErpApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "PrimeErpClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Set to true in strict SSL-only production if not behind reverse proxy
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(5)
    };
});

// Role-Based Access Control Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("ManagerOrAdmin", policy => policy.RequireRole("Admin", "Store Manager"));
    options.AddPolicy("AccountantOrAdmin", policy => policy.RequireRole("Admin", "Accountant / Billing"));
});

// CORS Setup
var configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[]
{
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:80",
    "http://localhost",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
};

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(configuredOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    }));

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Prime ERP API",
        Version = "v2.4",
        Description = "Enterprise SaaS ERP API with JWT Bearer Authentication and Multi-Module ERP Capabilities"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Ensure Database & Authentic Schema Exists
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ErpDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        // 1. Ensure master database can connect and create ERP DB if missing
        var masterConnStr = new SqlConnectionStringBuilder(connectionString) { InitialCatalog = "master" }.ConnectionString;
        using (var masterConn = new SqlConnection(masterConnStr))
        {
            await masterConn.OpenAsync();
            using var cmd = masterConn.CreateCommand();
            cmd.CommandText = "IF DB_ID('ERP') IS NULL CREATE DATABASE ERP;";
            await cmd.ExecuteNonQueryAsync();
        }

        // 2. Run init_schema.sql on ERP database
        var schemaPath = Path.Combine(app.Environment.ContentRootPath, "Data", "init_schema.sql");
        if (File.Exists(schemaPath))
        {
            var sqlScript = await File.ReadAllTextAsync(schemaPath);
            var sqlBatches = sqlScript.Split(new[] { "\nGO\r", "\nGO\n", "\r\nGO\r\n", "\nGO", "\r\nGO" }, StringSplitOptions.RemoveEmptyEntries);

            using var erpConn = new SqlConnection(connectionString);
            await erpConn.OpenAsync();

            foreach (var batch in sqlBatches)
            {
                var trimmed = batch.Trim();
                if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith("USE ", StringComparison.OrdinalIgnoreCase))
                    continue;

                try
                {
                    using var batchCmd = erpConn.CreateCommand();
                    batchCmd.CommandText = trimmed;
                    await batchCmd.ExecuteNonQueryAsync();
                }
                catch (Exception ex)
                {
                    logger.LogWarning("Schema batch execution note: {Message}", ex.Message);
                }
            }
        }

        logger.LogInformation("ERP SQL Server database and authentic schema successfully initialized.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to initialize SQL Server database.");
    }
}

app.Run();
