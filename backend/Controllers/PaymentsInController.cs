using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.Models;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsInController : ControllerBase
{
    private readonly ErpDbContext _db;
    public PaymentsInController(ErpDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PaymentIn>>> GetAll()
    {
        return await _db.PaymentsIn
            .OrderByDescending(p => p.Date)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PaymentIn>> Get(int id)
    {
        var payment = await _db.PaymentsIn.FindAsync(id);
        if (payment == null) return NotFound();
        return payment;
    }

    [HttpPost]
    public async Task<ActionResult<PaymentIn>> Create([FromBody] CreatePaymentInDto dto)
    {
        var count = await _db.PaymentsIn.CountAsync() + 1;
        var paymentId = string.IsNullOrWhiteSpace(dto.PaymentId)
            ? $"PAYI-{4000 + count}"
            : dto.PaymentId;

        var payment = new PaymentIn
        {
            PaymentId = paymentId,
            Date = dto.Date ?? DateTime.UtcNow,
            CustomerId = dto.CustomerId,
            CustomerName = dto.CustomerName ?? string.Empty,
            Amount = dto.Amount,
            PaymentMode = string.IsNullOrWhiteSpace(dto.PaymentMode) ? "Bank Transfer" : dto.PaymentMode,
            ReferenceNo = dto.ReferenceNo,
            InvoiceRef = dto.InvoiceRef,
            Notes = dto.Notes,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Received" : dto.Status
        };

        _db.PaymentsIn.Add(payment);

        // If InvoiceRef matches an existing SalesInvoice, update its status to Paid
        if (!string.IsNullOrWhiteSpace(dto.InvoiceRef))
        {
            var inv = await _db.SalesInvoices.FirstOrDefaultAsync(i => i.InvoiceId == dto.InvoiceRef);
            if (inv != null)
            {
                inv.Status = "Paid";
            }
        }

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = payment.Id }, payment);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var payment = await _db.PaymentsIn.FindAsync(id);
        if (payment == null) return NotFound();

        _db.PaymentsIn.Remove(payment);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public class CreatePaymentInDto
{
    public string? PaymentId { get; set; }
    public DateTime? Date { get; set; }
    public string? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMode { get; set; }
    public string? ReferenceNo { get; set; }
    public string? InvoiceRef { get; set; }
    public string? Notes { get; set; }
    public string? Status { get; set; }
}
