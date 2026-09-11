using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.Models;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PurchaseOrdersController : ControllerBase
{
    private readonly ErpDbContext _db;
    public PurchaseOrdersController(ErpDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PurchaseOrder>>> GetAll()
    {
        return await _db.PurchaseOrders.Include(p => p.Items).Include(p => p.Activity).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PurchaseOrder>> Get(int id)
    {
        var po = await _db.PurchaseOrders.Include(p => p.Items).Include(p => p.Activity).FirstOrDefaultAsync(p => p.Id == id);
        if (po == null) return NotFound();
        return po;
    }

    [HttpPost]
    public async Task<ActionResult<PurchaseOrder>> Create([FromBody] PurchaseOrder po)
    {
        if (string.IsNullOrWhiteSpace(po.PoId) || po.PoId.StartsWith("PO-TEMP"))
        {
            var count = await _db.PurchaseOrders.CountAsync() + 1;
            po.PoId = $"PO-{DateTime.UtcNow.Year}-{count:D5}";
        }

        _db.PurchaseOrders.Add(po);
        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "PurchaseOrder",
            Action = "CREATE",
            RecordId = po.PoId,
            Details = $"Purchase Order created for supplier {po.SupplierName}.",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = po.Id }, po);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] PurchaseOrder updated)
    {
        PurchaseOrder? existing = null;
        if (int.TryParse(id, out int numId))
        {
            existing = await _db.PurchaseOrders.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == numId);
        }
        if (existing == null)
        {
            existing = await _db.PurchaseOrders.Include(p => p.Items).FirstOrDefaultAsync(p => p.PoId == id);
        }
        if (existing == null) return NotFound();

        existing.Status = updated.Status ?? existing.Status;
        existing.GrnId = updated.GrnId ?? existing.GrnId;

        if (updated.Items != null && updated.Items.Count > 0)
        {
            foreach (var updItem in updated.Items)
            {
                var existItem = existing.Items.FirstOrDefault(i => i.ProductId == updItem.ProductId || (updItem.Id > 0 && i.Id == updItem.Id));
                if (existItem != null)
                {
                    existItem.ReceivedQty = updItem.ReceivedQty;
                }
            }
        }

        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "PurchaseOrder",
            Action = "UPDATE",
            RecordId = existing.PoId ?? existing.Id.ToString(),
            Details = $"Status updated to {existing.Status}, GRN: {existing.GrnId}",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var po = await _db.PurchaseOrders.FindAsync(id);
        if (po == null) return NotFound();

        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "PurchaseOrder",
            Action = "DELETE",
            RecordId = po.PoId ?? po.Id.ToString(),
            Details = $"Deleted PO {po.PoId} for {po.SupplierName}",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        _db.PurchaseOrders.Remove(po);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
