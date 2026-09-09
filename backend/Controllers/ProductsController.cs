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
    public async Task<IActionResult> Update(string id, [FromBody] Product updated)
    {
        Product? existing = null;
        if (int.TryParse(id, out int numId))
        {
            existing = await _db.Products.FindAsync(numId);
        }
        if (existing == null)
        {
            existing = await _db.Products.FirstOrDefaultAsync(p => p.ProductId == id || p.Name == id);
        }
        if (existing == null) return NotFound();

        existing.ProductId = updated.ProductId ?? existing.ProductId;
        existing.Name = updated.Name ?? existing.Name;
        existing.ItemType = updated.ItemType ?? existing.ItemType;
        existing.Brand = updated.Brand ?? existing.Brand;
        existing.Uom = updated.Uom ?? existing.Uom;
        existing.MajorGroup = updated.MajorGroup ?? existing.MajorGroup;
        existing.SubGroup = updated.SubGroup ?? existing.SubGroup;
        existing.SubSubGroup = updated.SubSubGroup ?? existing.SubSubGroup;
        existing.AvailableStock = updated.AvailableStock;
        existing.MinReorderLevel = updated.MinReorderLevel;
        existing.AvgRate = updated.AvgRate;
        existing.PurchaseRate = updated.PurchaseRate;
        existing.SellingPrice = updated.SellingPrice;
        existing.StockValue = updated.StockValue;
        existing.HsnCode = updated.HsnCode ?? existing.HsnCode;
        existing.GstRate = updated.GstRate;
        existing.Status = updated.Status ?? existing.Status;
        existing.Description = updated.Description ?? existing.Description;

        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "Product",
            Action = "UPDATE",
            RecordId = existing.ProductId ?? existing.Id.ToString(),
            Details = $"Updated item master details for '{existing.Name}'",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        Product? prod = null;
        if (int.TryParse(id, out int numId))
        {
            prod = await _db.Products.FindAsync(numId);
        }
        if (prod == null)
        {
            prod = await _db.Products.FirstOrDefaultAsync(p => p.ProductId == id || p.Name == id);
        }
        if (prod == null) return NotFound();

        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "Product",
            Action = "DELETE",
            RecordId = prod.ProductId ?? prod.Id.ToString(),
            Details = $"Deleted item master '{prod.Name}'",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        _db.Products.Remove(prod);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
