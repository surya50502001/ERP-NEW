using Microsoft.AspNetCore.Mvc;
using ErpBackend.DTOs;
using ErpBackend.Services;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly ISalesInvoiceService _invoiceService;

    public InvoicesController(ISalesInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string compCode = "01")
    {
        var list = await _invoiceService.GetAllInvoicesAsync(compCode);
        return Ok(list);
    }

    [HttpGet("{compCode}/{invYr:int}/{invSr}/{invNo:long}")]
    public async Task<IActionResult> GetByKey(string compCode, int invYr, string invSr, long invNo)
    {
        var invoice = await _invoiceService.GetInvoiceByKeyAsync(compCode, invYr, invSr, invNo);
        if (invoice == null) return NotFound(new { message = $"Invoice '{invSr}-{invYr}-{invNo}' not found." });
        return Ok(invoice);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceDto dto)
    {
        try
        {
            var user = User.Identity?.Name ?? "SYSTEM";
            var result = await _invoiceService.CreateInvoiceAsync(dto, user);
            return CreatedAtAction(nameof(GetByKey), new
            {
                compCode = result.CompCode,
                invYr = result.InvYr,
                invSr = result.InvSr,
                invNo = result.InvNo
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

    [HttpPost("{compCode}/{invYr:int}/{invSr}/{invNo:long}/approve")]
    public async Task<IActionResult> Approve(string compCode, int invYr, string invSr, long invNo)
    {
        try
        {
            var user = User.Identity?.Name ?? "SYSTEM";
            var result = await _invoiceService.ApproveInvoiceAsync(compCode, invYr, invSr, invNo, user);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{compCode}/{invYr:int}/{invSr}/{invNo:long}/cancel")]
    public async Task<IActionResult> Cancel(string compCode, int invYr, string invSr, long invNo, [FromBody] CancelInvoiceDto dto)
    {
        try
        {
            var user = User.Identity?.Name ?? "SYSTEM";
            var result = await _invoiceService.CancelInvoiceAsync(compCode, invYr, invSr, invNo, dto.Reason, user);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
