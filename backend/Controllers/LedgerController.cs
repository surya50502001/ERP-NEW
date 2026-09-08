using Microsoft.AspNetCore.Mvc;
using ErpBackend.Services;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LedgerController : ControllerBase
{
    private readonly IStockService _stockService;

    public LedgerController(IStockService stockService)
    {
        _stockService = stockService;
    }

    [HttpGet]
    public async Task<IActionResult> GetLedger([FromQuery] string? itemCode = null, [FromQuery] string compCode = "01")
    {
        var history = await _stockService.GetLedgerHistoryAsync(itemCode, compCode);
        return Ok(history);
    }
}
