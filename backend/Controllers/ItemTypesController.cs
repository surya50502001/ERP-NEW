using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.Models;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ItemTypesController : ControllerBase
{
    private readonly ErpDbContext _db;
    public ItemTypesController(ErpDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ItemType>>> GetAll()
    {
        return await _db.ItemTypes.ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<ItemType>> Create([FromBody] ItemType itemType)
    {
        if (string.IsNullOrWhiteSpace(itemType.ItemTypeId))
        {
            var count = await _db.ItemTypes.CountAsync() + 1;
            itemType.ItemTypeId = $"IT{count:D4}";
        }
        _db.ItemTypes.Add(itemType);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = itemType.Id }, itemType);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] ItemType updated)
    {
        ItemType? itemType = null;
        if (int.TryParse(id, out var intId))
        {
            itemType = await _db.ItemTypes.FindAsync(intId);
        }
        if (itemType == null)
        {
            itemType = await _db.ItemTypes.FirstOrDefaultAsync(it => it.ItemTypeId == id || it.Code.ToLower() == id.ToLower() || it.Name.ToLower() == id.ToLower());
        }
        if (itemType == null) return NotFound(new { message = $"Item type '{id}' not found." });

        itemType.Name = updated.Name;
        if (!string.IsNullOrWhiteSpace(updated.Code)) itemType.Code = updated.Code;

        await _db.SaveChangesAsync();
        return Ok(itemType);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        ItemType? itemType = null;
        if (int.TryParse(id, out var intId))
        {
            itemType = await _db.ItemTypes.FindAsync(intId);
        }
        if (itemType == null)
        {
            itemType = await _db.ItemTypes.FirstOrDefaultAsync(it => it.ItemTypeId == id || it.Code.ToLower() == id.ToLower() || it.Name.ToLower() == id.ToLower());
        }
        if (itemType == null) return NotFound();

        _db.ItemTypes.Remove(itemType);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
