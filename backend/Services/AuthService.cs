using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.DTOs;
using ErpBackend.Models;

namespace ErpBackend.Services;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<UserProfileDto?> GetProfileAsync(string email);
    Task<List<UserProfileDto>> GetAllUsersAsync();
    Task<bool> DeleteUserAsync(string userId);
    Task<bool> UpdateUserRoleAsync(string userId, string role);
}

public class AuthService : IAuthService
{
    private readonly ErpDbContext _db;

    public AuthService(ErpDbContext db)
    {
        _db = db;
    }

    private async Task EnsureDefaultUsersExistAsync()
    {
        try
        {
            if (!await _db.Users.AnyAsync())
            {
                var defaults = new List<SystemUser>
                {
                    new SystemUser
                    {
                        UserId = "USR-ADMIN-01",
                        FullName = "System Administrator",
                        Email = "admin@primeerp.com",
                        PasswordHash = HashPassword("admin123"),
                        CompanyName = "Prime ERP Enterprise",
                        Role = "Admin",
                        Status = "A",
                        CreatedDt = DateTime.UtcNow
                    },
                    new SystemUser
                    {
                        UserId = "USR-MGR-02",
                        FullName = "Inventory Store Manager",
                        Email = "manager@primeerp.com",
                        PasswordHash = HashPassword("manager123"),
                        CompanyName = "Prime ERP Enterprise",
                        Role = "Store Manager",
                        Status = "A",
                        CreatedDt = DateTime.UtcNow
                    },
                    new SystemUser
                    {
                        UserId = "USR-ACC-03",
                        FullName = "Senior Accountant",
                        Email = "billing@primeerp.com",
                        PasswordHash = HashPassword("billing123"),
                        CompanyName = "Prime ERP Enterprise",
                        Role = "Accountant / Billing",
                        Status = "A",
                        CreatedDt = DateTime.UtcNow
                    }
                };
                _db.Users.AddRange(defaults);
                await _db.SaveChangesAsync();
            }
        }
        catch
        {
            // Ignore if concurrency or schema transient
        }
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        await EnsureDefaultUsersExistAsync();

        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email && u.Status == "A");

        if (user == null)
            throw new UnauthorizedAccessException("Invalid email or password.");

        var hash = HashPassword(request.Password);
        if (user.PasswordHash != hash)
            throw new UnauthorizedAccessException("Invalid email or password.");

        var token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{user.UserId}:{user.Email}:{DateTime.UtcNow.Ticks}"));

        return new AuthResponseDto
        {
            UserId = user.UserId,
            FullName = user.FullName,
            Email = user.Email,
            CompanyName = user.CompanyName,
            Role = user.Role,
            Token = token
        };
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var existing = await _db.Users.AnyAsync(u => u.Email.ToLower() == email);

        if (existing)
            throw new InvalidOperationException("An account with this email address already exists.");

        var userId = $"USR{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
        var user = new SystemUser
        {
            UserId = userId,
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = HashPassword(request.Password),
            CompanyName = string.IsNullOrWhiteSpace(request.CompanyName) ? "Prime ERP Enterprise" : request.CompanyName.Trim(),
            Role = string.IsNullOrWhiteSpace(request.Role) ? "Admin" : request.Role,
            Status = "A",
            CreatedDt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{user.UserId}:{user.Email}:{DateTime.UtcNow.Ticks}"));

        return new AuthResponseDto
        {
            UserId = user.UserId,
            FullName = user.FullName,
            Email = user.Email,
            CompanyName = user.CompanyName,
            Role = user.Role,
            Token = token
        };
    }

    public async Task<UserProfileDto?> GetProfileAsync(string email)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.Trim().ToLowerInvariant());
        if (user == null) return null;

        return new UserProfileDto
        {
            UserId = user.UserId,
            FullName = user.FullName,
            Email = user.Email,
            CompanyName = user.CompanyName,
            Role = user.Role
        };
    }

    public async Task<List<UserProfileDto>> GetAllUsersAsync()
    {
        await EnsureDefaultUsersExistAsync();
        return await _db.Users
            .Where(u => u.Status == "A")
            .OrderBy(u => u.FullName)
            .Select(u => new UserProfileDto
            {
                UserId = u.UserId,
                FullName = u.FullName,
                Email = u.Email,
                CompanyName = u.CompanyName,
                Role = u.Role
            })
            .ToListAsync();
    }

    public async Task<bool> DeleteUserAsync(string userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null) return false;

        user.Status = "D"; // Soft-delete
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateUserRoleAsync(string userId, string role)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null) return false;

        user.Role = role;
        await _db.SaveChangesAsync();
        return true;
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var salted = $"PRIME_ERP_SALT_2026_{password}";
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(salted));
        return Convert.ToHexString(bytes);
    }
}
