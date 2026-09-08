using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
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

// CORS Setup
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod()));

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
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
