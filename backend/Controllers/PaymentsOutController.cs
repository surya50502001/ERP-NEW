using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.Models;

namespace ErpBackend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PaymentsOutController : ControllerBase
{
    private readonly ErpDbContext _db;
    public PaymentsOutController(ErpDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PaymentOut>>> GetAll()
    {
        return await _db.PaymentsOut
            .OrderByDescending(p => p.Date)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PaymentOut>> Get(int id)
    {
        var payment = await _db.PaymentsOut.FindAsync(id);
        if (payment == null) return NotFound();
        return payment;
    }

    [HttpPost]
    public async Task<ActionResult<PaymentOut>> Create([FromBody] CreatePaymentOutDto dto)
    {
        var count = await _db.PaymentsOut.CountAsync() + 1;
        var paymentId = string.IsNullOrWhiteSpace(dto.PaymentId)
            ? $"PAYO-{1000 + count}"
            : dto.PaymentId;

        var payment = new PaymentOut
        {
            PaymentId = paymentId,
            Date = dto.Date ?? DateTime.UtcNow,
            SupplierId = dto.SupplierId,
            SupplierName = dto.SupplierName ?? string.Empty,
            Amount = dto.Amount,
            PaymentMode = string.IsNullOrWhiteSpace(dto.PaymentMode) ? "Bank Transfer" : dto.PaymentMode,
            ReferenceNo = dto.ReferenceNo,
            BillRef = dto.BillRef,
            Notes = dto.Notes,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Paid" : dto.Status
        };

        _db.PaymentsOut.Add(payment);

        // If BillRef matches an existing PurchaseBill, update its status
        if (!string.IsNullOrWhiteSpace(dto.BillRef))
        {
            var bill = await _db.PurchaseBills.FirstOrDefaultAsync(b => b.BillNo == dto.BillRef);
            if (bill != null)
            {
                bill.Status = "Paid";
            }
        }

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = payment.Id }, payment);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var payment = await _db.PaymentsOut.FindAsync(id);
        if (payment == null) return NotFound();

        _db.PaymentsOut.Remove(payment);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public class CreatePaymentOutDto
{
    public string? PaymentId { get; set; }
    public DateTime? Date { get; set; }
    public string? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMode { get; set; }
    public string? ReferenceNo { get; set; }
    public string? BillRef { get; set; }
    public string? Notes { get; set; }
    public string? Status { get; set; }
}
