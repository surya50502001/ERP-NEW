using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.Models;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UomsController : ControllerBase
{
    private readonly ErpDbContext _db;
    public UomsController(ErpDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Uom>>> GetAll() => await _db.Uoms.ToListAsync();

    [HttpPost]
    public async Task<ActionResult<Uom>> Create([FromBody] Uom uom)
    {
        if (string.IsNullOrWhiteSpace(uom.UomId))
        {
            var count = await _db.Uoms.CountAsync() + 1;
            uom.UomId = $"UOM{count:D4}";
        }
        _db.Uoms.Add(uom);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = uom.Id }, uom);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] Uom updated)
    {
        Uom? uom = null;
        if (int.TryParse(id, out var intId))
        {
            uom = await _db.Uoms.FindAsync(intId);
        }
        if (uom == null)
        {
            uom = await _db.Uoms.FirstOrDefaultAsync(u => u.UomId == id || u.Code.ToLower() == id.ToLower() || u.Name.ToLower() == id.ToLower());
        }
        if (uom == null) return NotFound(new { message = $"UOM '{id}' not found." });

        uom.Name = updated.Name;
        uom.Code = updated.Code;
        uom.DecimalPlaces = updated.DecimalPlaces;

        await _db.SaveChangesAsync();
        return Ok(uom);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        Uom? uom = null;
        if (int.TryParse(id, out var intId))
        {
            uom = await _db.Uoms.FindAsync(intId);
        }
        if (uom == null)
        {
            uom = await _db.Uoms.FirstOrDefaultAsync(u => u.UomId == id || u.Code.ToLower() == id.ToLower() || u.Name.ToLower() == id.ToLower());
        }
        if (uom == null) return NotFound();

        _db.Uoms.Remove(uom);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
