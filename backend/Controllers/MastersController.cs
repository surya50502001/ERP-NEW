using Microsoft.AspNetCore.Mvc;
using ErpBackend.DTOs;
using ErpBackend.Services;

namespace ErpBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MastersController : ControllerBase
{
    private readonly IMasterDataService _masterService;

    public MastersController(IMasterDataService masterService)
    {
        _masterService = masterService;
    }

    #region Items
    [HttpGet("items")]
    public async Task<IActionResult> GetItems([FromQuery] string compCode = "01")
    {
        var items = await _masterService.GetItemsAsync(compCode);
        return Ok(items);
    }

    [HttpGet("items/{itemCode}")]
    public async Task<IActionResult> GetItem(string itemCode, [FromQuery] string compCode = "01")
    {
        var item = await _masterService.GetItemByCodeAsync(itemCode, compCode);
        if (item == null) return NotFound(new { message = $"Item '{itemCode}' not found." });
        return Ok(item);
    }

    [HttpPost("items")]
    public async Task<IActionResult> CreateItem([FromBody] CreateItemMasterDto dto)
    {
        try
        {
            var user = User.Identity?.Name ?? "SYSTEM";
            var item = await _masterService.CreateItemAsync(dto, user);
            return CreatedAtAction(nameof(GetItem), new { itemCode = item.ItemCode, compCode = item.CompCode }, item);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("items/{itemCode}")]
    public async Task<IActionResult> UpdateItem(string itemCode, [FromBody] UpdateItemMasterDto dto, [FromQuery] string compCode = "01")
    {
        try
        {
            var user = User.Identity?.Name ?? "SYSTEM";
            var item = await _masterService.UpdateItemAsync(itemCode, dto, compCode, user);
            return Ok(item);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = $"Item '{itemCode}' not found." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("items/{itemCode}")]
    public async Task<IActionResult> DeleteItem(string itemCode, [FromQuery] string compCode = "01")
    {
        var user = User.Identity?.Name ?? "SYSTEM";
        var success = await _masterService.DeleteItemAsync(itemCode, compCode, user);
        if (!success) return NotFound(new { message = $"Item '{itemCode}' not found." });
        return NoContent();
    }
    #endregion

    #region Rates
    [HttpGet("items/{itemCode}/rates")]
    public async Task<IActionResult> GetItemRates(string itemCode, [FromQuery] string compCode = "01")
    {
        var rates = await _masterService.GetRatesByItemAsync(itemCode, compCode);
        return Ok(rates);
    }

    [HttpPost("rates")]
    public async Task<IActionResult> CreateRate([FromBody] CreateItemRateDto dto)
    {
        try
        {
            var user = User.Identity?.Name ?? "SYSTEM";
            var rate = await _masterService.CreateRateAsync(dto, user);
            return Ok(rate);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    #endregion

    #region Parties
    [HttpGet("parties")]
    public async Task<IActionResult> GetParties([FromQuery] string? type = null, [FromQuery] string compCode = "01")
    {
        var parties = await _masterService.GetPartiesAsync(type, compCode);
        return Ok(parties);
    }

    [HttpPost("parties")]
    public async Task<IActionResult> CreateParty([FromBody] CreatePartyMasterDto dto)
    {
        try
        {
            var user = User.Identity?.Name ?? "SYSTEM";
            var party = await _masterService.CreatePartyAsync(dto, user);
            return Ok(party);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("parties/{slCode}")]
    public async Task<IActionResult> UpdateParty(string slCode, [FromBody] CreatePartyMasterDto dto, [FromQuery] string compCode = "01")
    {
        try
        {
            var user = User.Identity?.Name ?? "SYSTEM";
            var party = await _masterService.UpdatePartyAsync(slCode, dto, compCode, user);
            return Ok(party);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = $"Party '{slCode}' not found." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("parties/{slCode}")]
    public async Task<IActionResult> DeleteParty(string slCode, [FromQuery] string compCode = "01")
    {
        var user = User.Identity?.Name ?? "SYSTEM";
        var success = await _masterService.DeletePartyAsync(slCode, compCode, user);
        if (!success) return NotFound(new { message = $"Party '{slCode}' not found." });
        return NoContent();
    }
    #endregion

    #region Banks
    [HttpGet("banks")]
    public async Task<IActionResult> GetBanks([FromQuery] string compCode = "01")
    {
        var banks = await _masterService.GetBanksAsync(compCode);
        return Ok(banks);
    }

    [HttpPost("banks")]
    public async Task<IActionResult> CreateBank([FromBody] CreateBankMasterDto dto)
    {
        try
        {
            var user = User.Identity?.Name ?? "SYSTEM";
            var bank = await _masterService.CreateBankAsync(dto, user);
            return Ok(bank);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    #endregion

    #region Delivery Locations
    [HttpGet("delivery-locations")]
    public async Task<IActionResult> GetDeliveryLocations([FromQuery] string compCode = "01")
    {
        var locs = await _masterService.GetDeliveryLocationsAsync(compCode);
        return Ok(locs);
    }

    [HttpPost("delivery-locations")]
    public async Task<IActionResult> CreateDeliveryLocation([FromBody] CreateDeliveryLocationDto dto)
    {
        try
        {
            var user = User.Identity?.Name ?? "SYSTEM";
            var loc = await _masterService.CreateDeliveryLocationAsync(dto, user);
            return Ok(loc);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    #endregion
}
