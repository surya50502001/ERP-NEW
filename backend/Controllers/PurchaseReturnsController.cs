using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.Models;

namespace ErpBackend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PurchaseReturnsController : ControllerBase
{
    private readonly ErpDbContext _db;
    public PurchaseReturnsController(ErpDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PurchaseReturn>>> GetAll()
    {
        return await _db.PurchaseReturns
            .Include(r => r.Items)
            .OrderByDescending(r => r.Date)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PurchaseReturn>> Get(int id)
    {
        var ret = await _db.PurchaseReturns
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (ret == null) return NotFound();
        return ret;
    }

    [HttpPost]
    public async Task<ActionResult<PurchaseReturn>> Create([FromBody] CreatePurchaseReturnDto dto)
    {
        var count = await _db.PurchaseReturns.CountAsync() + 1;
        var returnId = string.IsNullOrWhiteSpace(dto.ReturnId)
            ? $"DN-{3000 + count}"
            : dto.ReturnId;

        var ret = new PurchaseReturn
        {
            ReturnId = returnId,
            Date = dto.Date ?? DateTime.UtcNow,
            SupplierId = dto.SupplierId,
            SupplierName = dto.SupplierName ?? string.Empty,
            ReturnAmount = dto.ReturnAmount,
            Reason = string.IsNullOrWhiteSpace(dto.Reason) ? "Defective / Quality Return" : dto.Reason,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Adjusted" : dto.Status
        };

        if (dto.Items != null && dto.Items.Count > 0)
        {
            foreach (var it in dto.Items)
            {
                ret.Items.Add(new PurchaseReturnItem
                {
                    ProductId = it.ProductId ?? string.Empty,
                    ProductName = it.ProductName ?? string.Empty,
                    Qty = it.Qty,
                    Rate = it.Rate,
                    Amount = it.Amount > 0 ? it.Amount : (it.Qty * it.Rate)
                });

                // Deduct from Product available stock
                var prod = await _db.Products.FirstOrDefaultAsync(p => p.ProductId == it.ProductId || p.Name == it.ProductName);
                if (prod != null)
                {
                    prod.AvailableStock = Math.Max(0, prod.AvailableStock - it.Qty);
                }
            }

            if (ret.ReturnAmount == 0)
            {
                ret.ReturnAmount = ret.Items.Sum(i => i.Amount);
            }
        }

        _db.PurchaseReturns.Add(ret);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = ret.Id }, ret);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ret = await _db.PurchaseReturns.FindAsync(id);
        if (ret == null) return NotFound();

        _db.PurchaseReturns.Remove(ret);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public class CreatePurchaseReturnDto
{
    public string? ReturnId { get; set; }
    public DateTime? Date { get; set; }
    public string? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public decimal ReturnAmount { get; set; }
    public string? Reason { get; set; }
    public string? Status { get; set; }
    public List<CreatePurchaseReturnItemDto>? Items { get; set; }
}

public class CreatePurchaseReturnItemDto
{
    public string? ProductId { get; set; }
    public string? ProductName { get; set; }
    public decimal Qty { get; set; }
    public decimal Rate { get; set; }
    public decimal Amount { get; set; }
}
