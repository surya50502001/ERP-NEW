using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.Models;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PartiesController : ControllerBase
{
    private readonly ErpDbContext _db;
    public PartiesController(ErpDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Party>>> GetAll()
    {
        return await _db.Parties.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Party>> Get(int id)
    {
        var party = await _db.Parties.FindAsync(id);
        if (party == null) return NotFound();
        return party;
    }

    [HttpPost]
    public async Task<ActionResult<Party>> Create([FromBody] Party party)
    {
        if (string.IsNullOrWhiteSpace(party.PartyId) || party.PartyId.StartsWith("PTY-TEMP"))
        {
            var count = await _db.Parties.CountAsync() + 1;
            party.PartyId = $"PTY{count:D6}";
        }

        _db.Parties.Add(party);
        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "Party",
            Action = "CREATE",
            RecordId = party.PartyId,
            Details = $"Created party '{party.Name}'",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = party.Id }, party);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Party updated)
    {
        var existing = await _db.Parties.FindAsync(id);
        if (existing == null) return NotFound();

        existing.PartyId = updated.PartyId;
        existing.Name = updated.Name;
        existing.PartyType = updated.PartyType;
        existing.Status = updated.Status;
        existing.ContactNumber = updated.ContactNumber;
        existing.Email = updated.Email;
        existing.Addr1 = updated.Addr1;
        existing.Addr2 = updated.Addr2;
        existing.Addr3 = updated.Addr3;
        existing.Addr4 = updated.Addr4;
        existing.City = updated.City;
        existing.State = updated.State;
        existing.Country = updated.Country;
        existing.Pincode = updated.Pincode;
        existing.Gstin = updated.Gstin;
        existing.Pan = updated.Pan;

        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "Party",
            Action = "UPDATE",
            RecordId = existing.PartyId ?? id.ToString(),
            Details = $"Updated party master '{existing.Name}'",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var party = await _db.Parties.FindAsync(id);
        if (party == null) return NotFound();

        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "Party",
            Action = "DELETE",
            RecordId = party.PartyId ?? id.ToString(),
            Details = $"Deleted party master '{party.Name}'",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        _db.Parties.Remove(party);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
