using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.Models;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ErpDbContext _db;
    public ProductsController(ErpDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Product>>> GetAll()
    {
        return await _db.Products.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Product>> Get(int id)
    {
        var prod = await _db.Products.FindAsync(id);
        if (prod == null) return NotFound();
        return prod;
    }

    [HttpPost]
    public async Task<ActionResult<Product>> Create([FromBody] Product product)
    {
        if (string.IsNullOrWhiteSpace(product.ProductId) || product.ProductId.StartsWith("ITM-TEMP"))
        {
            var count = await _db.Products.CountAsync() + 1;
            product.ProductId = $"ITM{count:D6}";
        }

        _db.Products.Add(product);
        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "Product",
            Action = "CREATE",
            RecordId = product.ProductId,
            Details = $"Created item master '{product.Name}' ({product.ProductId})",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = product.Id }, product);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Product updated)
    {
        var existing = await _db.Products.FindAsync(id);
        if (existing == null) return NotFound();

        existing.ProductId = updated.ProductId;
        existing.Name = updated.Name;
        existing.ItemType = updated.ItemType;
        existing.Brand = updated.Brand;
        existing.Uom = updated.Uom;
        existing.MajorGroup = updated.MajorGroup;
        existing.SubGroup = updated.SubGroup;
        existing.SubSubGroup = updated.SubSubGroup;
        existing.AvailableStock = updated.AvailableStock;
        existing.MinReorderLevel = updated.MinReorderLevel;
        existing.AvgRate = updated.AvgRate;
        existing.PurchaseRate = updated.PurchaseRate;
        existing.SellingPrice = updated.SellingPrice;
        existing.StockValue = updated.StockValue;
        existing.HsnCode = updated.HsnCode;
        existing.GstRate = updated.GstRate;
        existing.Status = updated.Status;
        existing.Description = updated.Description;

        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "Product",
            Action = "UPDATE",
            RecordId = existing.ProductId ?? id.ToString(),
            Details = $"Updated item master details for '{existing.Name}'",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var prod = await _db.Products.FindAsync(id);
        if (prod == null) return NotFound();

        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "Product",
            Action = "DELETE",
            RecordId = prod.ProductId ?? id.ToString(),
            Details = $"Deleted item master '{prod.Name}'",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        _db.Products.Remove(prod);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
