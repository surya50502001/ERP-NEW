using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.Models;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalesReturnsController : ControllerBase
{
    private readonly ErpDbContext _db;
    public SalesReturnsController(ErpDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SalesReturn>>> GetAll()
    {
        return await _db.SalesReturns
            .Include(r => r.Items)
            .OrderByDescending(r => r.Date)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SalesReturn>> Get(int id)
    {
        var ret = await _db.SalesReturns
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (ret == null) return NotFound();
        return ret;
    }

    [HttpPost]
    public async Task<ActionResult<SalesReturn>> Create([FromBody] CreateSalesReturnDto dto)
    {
        var count = await _db.SalesReturns.CountAsync() + 1;
        var returnId = string.IsNullOrWhiteSpace(dto.ReturnId)
            ? $"CN-{5000 + count}"
            : dto.ReturnId;

        var ret = new SalesReturn
        {
            ReturnId = returnId,
            Date = dto.Date ?? DateTime.UtcNow,
            CustomerId = dto.CustomerId,
            CustomerName = dto.CustomerName ?? string.Empty,
            RefundAmount = dto.RefundAmount,
            Reason = string.IsNullOrWhiteSpace(dto.Reason) ? "Customer Return" : dto.Reason,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Credited" : dto.Status
        };

        if (dto.Items != null && dto.Items.Count > 0)
        {
            foreach (var it in dto.Items)
            {
                ret.Items.Add(new SalesReturnItem
                {
                    ProductId = it.ProductId ?? string.Empty,
                    ProductName = it.ProductName ?? string.Empty,
                    Qty = it.Qty,
                    Rate = it.Rate,
                    Amount = it.Amount > 0 ? it.Amount : (it.Qty * it.Rate)
                });

                // Restock returned items back into product inventory
                var prod = await _db.Products.FirstOrDefaultAsync(p => p.ProductId == it.ProductId || p.Name == it.ProductName);
                if (prod != null)
                {
                    prod.AvailableStock += it.Qty;
                }
            }

            if (ret.RefundAmount == 0)
            {
                ret.RefundAmount = ret.Items.Sum(i => i.Amount);
            }
        }

        _db.SalesReturns.Add(ret);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = ret.Id }, ret);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ret = await _db.SalesReturns.FindAsync(id);
        if (ret == null) return NotFound();

        _db.SalesReturns.Remove(ret);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public class CreateSalesReturnDto
{
    public string? ReturnId { get; set; }
    public DateTime? Date { get; set; }
    public string? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public decimal RefundAmount { get; set; }
    public string? Reason { get; set; }
    public string? Status { get; set; }
    public List<CreateSalesReturnItemDto>? Items { get; set; }
}

public class CreateSalesReturnItemDto
{
    public string? ProductId { get; set; }
    public string? ProductName { get; set; }
    public decimal Qty { get; set; }
    public decimal Rate { get; set; }
    public decimal Amount { get; set; }
}
