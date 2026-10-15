using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.Models;

namespace ErpBackend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SalesOrdersController : ControllerBase
{
    private readonly ErpDbContext _db;
    public SalesOrdersController(ErpDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SalesOrder>>> GetAll()
    {
        return await _db.SalesOrders
            .Include(o => o.Items)
            .OrderByDescending(o => o.Date)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SalesOrder>> Get(int id)
    {
        var order = await _db.SalesOrders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null) return NotFound();
        return order;
    }

    [HttpPost]
    public async Task<ActionResult<SalesOrder>> Create([FromBody] CreateSalesOrderDto dto)
    {
        var count = await _db.SalesOrders.CountAsync() + 1;
        var orderId = string.IsNullOrWhiteSpace(dto.OrderId)
            ? $"SO-{6000 + count}"
            : dto.OrderId;

        var order = new SalesOrder
        {
            OrderId = orderId,
            Date = dto.Date ?? DateTime.UtcNow,
            DeliveryDate = dto.DeliveryDate,
            CustomerId = dto.CustomerId,
            CustomerName = dto.CustomerName ?? string.Empty,
            TotalAmount = dto.TotalAmount,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Confirmed" : dto.Status,
            Notes = dto.Notes
        };

        if (dto.Items != null && dto.Items.Count > 0)
        {
            foreach (var it in dto.Items)
            {
                order.Items.Add(new SalesOrderItem
                {
                    ProductId = it.ProductId ?? string.Empty,
                    ProductName = it.ProductName ?? string.Empty,
                    Qty = it.Qty,
                    Rate = it.Rate,
                    Amount = it.Amount > 0 ? it.Amount : (it.Qty * it.Rate)
                });
            }

            if (order.TotalAmount == 0)
            {
                order.TotalAmount = order.Items.Sum(i => i.Amount);
            }
        }

        _db.SalesOrders.Add(order);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = order.Id }, order);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var order = await _db.SalesOrders.FindAsync(id);
        if (order == null) return NotFound();

        _db.SalesOrders.Remove(order);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public class CreateSalesOrderDto
{
    public string? OrderId { get; set; }
    public DateTime? Date { get; set; }
    public DateTime? DeliveryDate { get; set; }
    public string? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
    public List<CreateSalesOrderItemDto>? Items { get; set; }
}

public class CreateSalesOrderItemDto
{
    public string? ProductId { get; set; }
    public string? ProductName { get; set; }
    public decimal Qty { get; set; }
    public decimal Rate { get; set; }
    public decimal Amount { get; set; }
}
