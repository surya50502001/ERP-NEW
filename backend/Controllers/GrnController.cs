using Microsoft.AspNetCore.Mvc;
using ErpBackend.DTOs;
using ErpBackend.Services;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GrnController : ControllerBase
{
    private readonly IGrnService _grnService;

    public GrnController(IGrnService grnService)
    {
        _grnService = grnService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string compCode = "01")
    {
        var list = await _grnService.GetAllGrnsAsync(compCode);
        return Ok(list);
    }

    [HttpGet("{compCode}/{recYr:int}/{recSr}/{recNo:long}")]
    public async Task<IActionResult> GetByKey(string compCode, int recYr, string recSr, long recNo)
    {
        var grn = await _grnService.GetGrnByKeyAsync(compCode, recYr, recSr, recNo);
        if (grn == null) return NotFound(new { message = $"GRN '{recSr}-{recYr}-{recNo}' not found." });
        return Ok(grn);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGrnDto dto)
    {
        try
        {
            var user = User.Identity?.Name ?? "SYSTEM";
            var result = await _grnService.CreateGrnAsync(dto, user);
            return CreatedAtAction(nameof(GetByKey), new
            {
                compCode = result.CompCode,
                recYr = result.RecYr,
                recSr = result.RecSr,
                recNo = result.RecNo
            }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
