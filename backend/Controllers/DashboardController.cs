using Microsoft.AspNetCore.Mvc;
using ErpBackend.Services;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] string compCode = "01")
    {
        var stats = await _dashboardService.GetStatsAsync(compCode);
        return Ok(stats);
    }
}
