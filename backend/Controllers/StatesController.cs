using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.Models;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatesController : ControllerBase
{
    private readonly ErpDbContext _db;
    public StatesController(ErpDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<State>>> GetAll([FromQuery] string? countryCode = null)
    {
        if (!string.IsNullOrWhiteSpace(countryCode))
        {
            return await _db.States.Where(s => s.CountryCode.ToLower() == countryCode.ToLower()).ToListAsync();
        }
        return await _db.States.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<State>> Get(int id)
    {
        var state = await _db.States.FindAsync(id);
        if (state == null) return NotFound();
        return state;
    }

    [HttpPost]
    public async Task<ActionResult<State>> Create([FromBody] State state)
    {
        if (string.IsNullOrWhiteSpace(state.StateId))
        {
            var count = await _db.States.CountAsync() + 1;
            state.StateId = $"ST{count:D4}";
        }

        _db.States.Add(state);
        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "State",
            Action = "CREATE",
            RecordId = state.StateId,
            Details = $"Created state '{state.Name}' ({state.Code}), GST Code: {state.GstStateCode}",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = state.Id }, state);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] State updated)
    {
        var existing = await _db.States.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = updated.Name;
        existing.Code = updated.Code;
        existing.CountryCode = updated.CountryCode;
        existing.GstStateCode = updated.GstStateCode;
        existing.Status = updated.Status;

        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "State",
            Action = "UPDATE",
            RecordId = existing.StateId,
            Details = $"Updated state '{existing.Name}'",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        State? state = null;
        if (int.TryParse(id, out var intId))
        {
            state = await _db.States.FindAsync(intId);
        }
        if (state == null)
        {
            state = await _db.States.FirstOrDefaultAsync(s => s.StateId == id || s.Code.ToLower() == id.ToLower() || s.Name.ToLower() == id.ToLower());
        }
        if (state == null) return NotFound(new { message = $"State '{id}' not found." });

        _db.AuditLogs.Add(new SystemAuditLog
        {
            Entity = "State",
            Action = "DELETE",
            RecordId = state.StateId,
            Details = $"Deleted state '{state.Name}'",
            UserId = "System User",
            Timestamp = DateTime.UtcNow
        });

        _db.States.Remove(state);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
