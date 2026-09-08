using Microsoft.AspNetCore.Mvc;
using ErpBackend.Services;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StockController : ControllerBase
{
    private readonly IStockService _stockService;

    public StockController(IStockService stockService)
    {
        _stockService = stockService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string compCode = "01")
    {
        var stocks = await _stockService.GetCurrentStockAsync(compCode);
        return Ok(stocks);
    }

    [HttpGet("{itemCode}")]
    public async Task<IActionResult> GetByItem(string itemCode, [FromQuery] string compCode = "01", [FromQuery] string storeLoc = "MAIN")
    {
        var stock = await _stockService.GetItemStockAsync(itemCode, compCode, storeLoc);
        if (stock == null) return NotFound(new { message = $"Stock for item '{itemCode}' not found." });
        return Ok(stock);
    }
}
