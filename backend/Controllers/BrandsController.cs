using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.Models;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BrandsController : ControllerBase
{
    private readonly ErpDbContext _db;
    public BrandsController(ErpDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Brand>>> GetAll()
    {
        return await _db.Brands.ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Brand>> Create([FromBody] Brand brand)
    {
        if (string.IsNullOrWhiteSpace(brand.BrandId))
        {
            var count = await _db.Brands.CountAsync() + 1;
            brand.BrandId = $"BR{count:D4}";
        }
        _db.Brands.Add(brand);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = brand.Id }, brand);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] Brand updated)
    {
        Brand? brand = null;
        if (int.TryParse(id, out var intId))
        {
            brand = await _db.Brands.FindAsync(intId);
        }
        if (brand == null)
        {
            brand = await _db.Brands.FirstOrDefaultAsync(b => b.BrandId == id || b.Name.ToLower() == id.ToLower());
        }
        if (brand == null) return NotFound(new { message = $"Brand '{id}' not found." });

        brand.Name = updated.Name;
        await _db.SaveChangesAsync();
        return Ok(brand);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        Brand? brand = null;
        if (int.TryParse(id, out var intId))
        {
            brand = await _db.Brands.FindAsync(intId);
        }
        if (brand == null)
        {
            brand = await _db.Brands.FirstOrDefaultAsync(b => b.BrandId == id || b.Name.ToLower() == id.ToLower());
        }
        if (brand == null) return NotFound();

        _db.Brands.Remove(brand);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
