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
}

public class AuthService : IAuthService
{
    private readonly ErpDbContext _db;

    public AuthService(ErpDbContext db)
    {
        _db = db;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);

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

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var salted = $"PRIME_ERP_SALT_2026_{password}";
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(salted));
        return Convert.ToHexString(bytes);
    }
}
