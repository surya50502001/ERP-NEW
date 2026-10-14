using Microsoft.AspNetCore.Mvc;
using ErpBackend.DTOs;
using ErpBackend.Services;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        try
        {
            var result = await _authService.LoginAsync(request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        try
        {
            var result = await _authService.RegisterAsync(request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile([FromQuery] string email)
    {
        var profile = await _authService.GetProfileAsync(email);
        if (profile == null) return NotFound(new { message = "User not found." });
        return Ok(profile);
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        try
        {
            var users = await _authService.GetAllUsersAsync();
            return Ok(users);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("users/{userId}")]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        var success = await _authService.DeleteUserAsync(userId);
        if (!success) return NotFound(new { message = "User not found." });
        return Ok(new { message = "User deleted successfully." });
    }

    [HttpPut("users/{userId}/role")]
    public async Task<IActionResult> UpdateUserRole(string userId, [FromBody] UpdateRoleRequest request)
    {
        var success = await _authService.UpdateUserRoleAsync(userId, request.Role);
        if (!success) return NotFound(new { message = "User not found." });
        return Ok(new { message = "Role updated successfully." });
    }
}

public class UpdateRoleRequest
{
    public string Role { get; set; } = string.Empty;
}

