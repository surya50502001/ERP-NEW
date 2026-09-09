using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.Models;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CountriesController : ControllerBase
{
    private readonly ErpDbContext _db;
    public CountriesController(ErpDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Country>>> GetAll()
    {
        return await _db.Countries.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Country>> Get(int id)
    {
        var country = await _db.Countries.FindAsync(id);
        if (country == null) return NotFound();
        return country;
    }

    [HttpPost]
    public async Task<ActionResult<Country>> Create([FromBody] Country country)
    {
        if (string.IsNullOrWhiteSpace(country.CountryId))
        {
            var count = await _db.Countries.CountAsync() + 1;
            country.CountryId = $"CTRY{count:D4}";
        }

        _db.Countries.Add(country);
        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "Country",
            Action = "CREATE",
            RecordId = country.CountryId,
            Details = $"Created country '{country.Name}' ({country.Code})",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = country.Id }, country);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Country updated)
    {
        var existing = await _db.Countries.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = updated.Name;
        existing.Code = updated.Code;
        existing.CurrencyCode = updated.CurrencyCode;
        existing.PhoneCode = updated.PhoneCode;
        existing.Status = updated.Status;

        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "Country",
            Action = "UPDATE",
            RecordId = existing.CountryId,
            Details = $"Updated country '{existing.Name}'",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var country = await _db.Countries.FindAsync(id);
        if (country == null) return NotFound();

        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "Country",
            Action = "DELETE",
            RecordId = country.CountryId,
            Details = $"Deleted country '{country.Name}'",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        _db.Countries.Remove(country);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
