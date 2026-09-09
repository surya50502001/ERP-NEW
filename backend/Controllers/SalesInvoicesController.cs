using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.Models;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalesInvoicesController : ControllerBase
{
    private readonly ErpDbContext _db;
    public SalesInvoicesController(ErpDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SalesInvoice>>> GetAll()
    {
        return await _db.SalesInvoices
            .Include(s => s.Items)
            .Include(s => s.Activity)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SalesInvoice>> Get(int id)
    {
        var inv = await _db.SalesInvoices
            .Include(s => s.Items)
            .Include(s => s.Activity)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (inv == null) return NotFound();
        return inv;
    }

    [HttpPost]
    public async Task<ActionResult<SalesInvoice>> Create([FromBody] SalesInvoice inv)
    {
        if (string.IsNullOrWhiteSpace(inv.InvoiceId) || inv.InvoiceId.StartsWith("INV-TEMP"))
        {
            var count = await _db.SalesInvoices.CountAsync() + 1;
            inv.InvoiceId = $"INV-{DateTime.UtcNow.Year}-{count:D5}";
        }
        inv.Status = "Pending Approval";

        inv.Activity.Add(new SalesInvoiceActivity
        {
            Date = DateTime.UtcNow,
            User = "System User",
            Title = "Submitted for Approval",
            Detail = $"Invoice {inv.InvoiceId} submitted for review."
        });

        _db.SalesInvoices.Add(inv);
        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "SalesInvoice",
            Action = "CREATE",
            RecordId = inv.InvoiceId,
            Details = $"Sales Invoice created for customer {inv.CustomerName} with total ₹{inv.TotalAmount:F2}.",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = inv.Id }, inv);
    }

    [HttpPut("{id}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        var inv = await _db.SalesInvoices
            .Include(s => s.Activity)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (inv == null) return NotFound();

        inv.Status = "Approved";
        inv.Activity.Add(new SalesInvoiceActivity
        {
            Date = DateTime.UtcNow,
            User = "Store Manager",
            Title = "Invoice Approved",
            Detail = $"Invoice {inv.InvoiceId} has been approved."
        });

        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "SalesInvoice",
            Action = "APPROVE",
            RecordId = inv.InvoiceId ?? inv.Id.ToString(),
            Details = $"Approved invoice for customer {inv.CustomerName}",
            UserId = "Store Manager",
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return Ok(inv);
    }

    [HttpPut("{id}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] string reason)
    {
        var inv = await _db.SalesInvoices
            .Include(s => s.Activity)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (inv == null) return NotFound();

        inv.Status = "Rejected";
        inv.Activity.Add(new SalesInvoiceActivity
        {
            Date = DateTime.UtcNow,
            User = "Store Manager",
            Title = "Invoice Rejected",
            Detail = $"Invoice {inv.InvoiceId} rejected: {reason}"
        });

        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "SalesInvoice",
            Action = "REJECT",
            RecordId = inv.InvoiceId ?? inv.Id.ToString(),
            Details = $"Rejected invoice: {reason}",
            UserId = "Store Manager",
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return Ok(inv);
    }
}
