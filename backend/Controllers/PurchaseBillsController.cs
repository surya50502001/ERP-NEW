using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.Models;

namespace ErpBackend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PurchaseBillsController : ControllerBase
{
    private readonly ErpDbContext _db;
    public PurchaseBillsController(ErpDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PurchaseBill>>> GetAll()
    {
        return await _db.PurchaseBills
            .Include(b => b.Items)
            .OrderByDescending(b => b.BillDate)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PurchaseBill>> Get(int id)
    {
        var bill = await _db.PurchaseBills
            .Include(b => b.Items)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (bill == null) return NotFound();
        return bill;
    }

    [HttpPost]
    public async Task<ActionResult<PurchaseBill>> Create([FromBody] CreatePurchaseBillDto dto)
    {
        var count = await _db.PurchaseBills.CountAsync() + 1;
        var billNo = string.IsNullOrWhiteSpace(dto.BillNo)
            ? $"PB-{1000 + count}"
            : dto.BillNo;

        var bill = new PurchaseBill
        {
            BillNo = billNo,
            BillDate = dto.BillDate ?? DateTime.UtcNow,
            DueDate = dto.DueDate,
            SupplierId = dto.SupplierId,
            SupplierName = dto.SupplierName ?? string.Empty,
            TotalAmount = dto.TotalAmount,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Unpaid" : dto.Status,
            Notes = dto.Notes
        };

        if (dto.Items != null && dto.Items.Count > 0)
        {
            foreach (var it in dto.Items)
            {
                bill.Items.Add(new PurchaseBillItem
                {
                    ProductId = it.ProductId ?? string.Empty,
                    ProductName = it.ProductName ?? string.Empty,
                    Qty = it.Qty,
                    Rate = it.Rate,
                    Amount = it.Amount > 0 ? it.Amount : (it.Qty * it.Rate)
                });
            }
            if (bill.TotalAmount == 0)
            {
                bill.TotalAmount = bill.Items.Sum(i => i.Amount);
            }
        }

        _db.PurchaseBills.Add(bill);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = bill.Id }, bill);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var bill = await _db.PurchaseBills.FindAsync(id);
        if (bill == null) return NotFound();

        _db.PurchaseBills.Remove(bill);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public class CreatePurchaseBillDto
{
    public string? BillNo { get; set; }
    public DateTime? BillDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
    public List<CreatePurchaseBillItemDto>? Items { get; set; }
}

public class CreatePurchaseBillItemDto
{
    public string? ProductId { get; set; }
    public string? ProductName { get; set; }
    public decimal Qty { get; set; }
    public decimal Rate { get; set; }
    public decimal Amount { get; set; }
}
