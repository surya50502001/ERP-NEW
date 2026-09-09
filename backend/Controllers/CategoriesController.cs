using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.Models;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ErpDbContext _db;
    public CategoriesController(ErpDbContext db) => _db = db;

    #region Major Categories
    [HttpGet("major")]
    public async Task<ActionResult<IEnumerable<MajorCategory>>> GetMajor() => await _db.MajorCategories.ToListAsync();

    [HttpPost("major")]
    public async Task<ActionResult<MajorCategory>> CreateMajor([FromBody] MajorCategory cat)
    {
        if (string.IsNullOrWhiteSpace(cat.MajorId))
        {
            var count = await _db.MajorCategories.CountAsync() + 1;
            cat.MajorId = $"MJ{count:D4}";
        }
        _db.MajorCategories.Add(cat);
        await _db.SaveChangesAsync();
        return Ok(cat);
    }

    [HttpPut("major/{id}")]
    public async Task<IActionResult> UpdateMajor(string id, [FromBody] MajorCategory updated)
    {
        MajorCategory? existing = null;
        if (int.TryParse(id, out var intId))
        {
            existing = await _db.MajorCategories.FindAsync(intId);
        }
        if (existing == null)
        {
            existing = await _db.MajorCategories.FirstOrDefaultAsync(m => m.MajorId == id || m.Code.ToLower() == id.ToLower() || m.Name.ToLower() == id.ToLower());
        }
        if (existing == null) return NotFound(new { message = $"Major category '{id}' not found." });

        existing.Name = updated.Name;
        if (!string.IsNullOrWhiteSpace(updated.Code)) existing.Code = updated.Code;

        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("major/{id}")]
    public async Task<IActionResult> DeleteMajor(string id)
    {
        MajorCategory? item = null;
        if (int.TryParse(id, out var intId))
        {
            item = await _db.MajorCategories.FindAsync(intId);
        }
        if (item == null)
        {
            item = await _db.MajorCategories.FirstOrDefaultAsync(m => m.MajorId == id || m.Code.ToLower() == id.ToLower() || m.Name.ToLower() == id.ToLower());
        }
        if (item == null) return NotFound();

        _db.MajorCategories.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
    #endregion

    #region Sub Categories
    [HttpGet("sub")]
    public async Task<ActionResult<IEnumerable<SubCategory>>> GetSub([FromQuery] string? majorId = null)
    {
        if (!string.IsNullOrWhiteSpace(majorId))
        {
            return await _db.SubCategories.Where(s => s.MajorId == majorId).ToListAsync();
        }
        return await _db.SubCategories.ToListAsync();
    }

    [HttpPost("sub")]
    public async Task<ActionResult<SubCategory>> CreateSub([FromBody] SubCategory cat)
    {
        if (string.IsNullOrWhiteSpace(cat.SubId))
        {
            var count = await _db.SubCategories.CountAsync() + 1;
            cat.SubId = $"SB{count:D4}";
        }
        _db.SubCategories.Add(cat);
        await _db.SaveChangesAsync();
        return Ok(cat);
    }

    [HttpPut("sub/{id}")]
    public async Task<IActionResult> UpdateSub(string id, [FromBody] SubCategory updated)
    {
        SubCategory? existing = null;
        if (int.TryParse(id, out var intId))
        {
            existing = await _db.SubCategories.FindAsync(intId);
        }
        if (existing == null)
        {
            existing = await _db.SubCategories.FirstOrDefaultAsync(s => s.SubId == id || s.Name.ToLower() == id.ToLower());
        }
        if (existing == null) return NotFound(new { message = $"Sub category '{id}' not found." });

        existing.Name = updated.Name;
        if (!string.IsNullOrWhiteSpace(updated.MajorId)) existing.MajorId = updated.MajorId;

        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("sub/{id}")]
    public async Task<IActionResult> DeleteSub(string id)
    {
        SubCategory? item = null;
        if (int.TryParse(id, out var intId))
        {
            item = await _db.SubCategories.FindAsync(intId);
        }
        if (item == null)
        {
            item = await _db.SubCategories.FirstOrDefaultAsync(s => s.SubId == id || s.Name.ToLower() == id.ToLower());
        }
        if (item == null) return NotFound();

        _db.SubCategories.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
    #endregion

    #region Sub-Sub Categories
    [HttpGet("subsub")]
    public async Task<ActionResult<IEnumerable<SubSubCategory>>> GetSubSub([FromQuery] string? subId = null)
    {
        if (!string.IsNullOrWhiteSpace(subId))
        {
            return await _db.SubSubCategories.Where(s => s.SubId == subId).ToListAsync();
        }
        return await _db.SubSubCategories.ToListAsync();
    }

    [HttpPost("subsub")]
    public async Task<ActionResult<SubSubCategory>> CreateSubSub([FromBody] SubSubCategory cat)
    {
        if (string.IsNullOrWhiteSpace(cat.SubSubId))
        {
            var count = await _db.SubSubCategories.CountAsync() + 1;
            cat.SubSubId = $"SSB{count:D4}";
        }
        _db.SubSubCategories.Add(cat);
        await _db.SaveChangesAsync();
        return Ok(cat);
    }

    [HttpPut("subsub/{id}")]
    public async Task<IActionResult> UpdateSubSub(string id, [FromBody] SubSubCategory updated)
    {
        SubSubCategory? existing = null;
        if (int.TryParse(id, out var intId))
        {
            existing = await _db.SubSubCategories.FindAsync(intId);
        }
        if (existing == null)
        {
            existing = await _db.SubSubCategories.FirstOrDefaultAsync(s => s.SubSubId == id || s.Name.ToLower() == id.ToLower());
        }
        if (existing == null) return NotFound(new { message = $"Sub-sub category '{id}' not found." });

        existing.Name = updated.Name;
        if (!string.IsNullOrWhiteSpace(updated.SubId)) existing.SubId = updated.SubId;

        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("subsub/{id}")]
    public async Task<IActionResult> DeleteSubSub(string id)
    {
        SubSubCategory? item = null;
        if (int.TryParse(id, out var intId))
        {
            item = await _db.SubSubCategories.FindAsync(intId);
        }
        if (item == null)
        {
            item = await _db.SubSubCategories.FirstOrDefaultAsync(s => s.SubSubId == id || s.Name.ToLower() == id.ToLower());
        }
        if (item == null) return NotFound();

        _db.SubSubCategories.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
    #endregion
}
