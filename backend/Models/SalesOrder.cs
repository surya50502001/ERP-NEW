namespace ErpBackend.Models;

public class SalesOrder
{
    public int Id { get; set; }
    public string OrderId { get; set; } = string.Empty; // e.g. SO-6001
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public DateTime? DeliveryDate { get; set; }
    public string? CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Confirmed";
    public string? Notes { get; set; }
    public List<SalesOrderItem> Items { get; set; } = new();
}

public class SalesOrderItem
{
    public int Id { get; set; }
    public int SalesOrderId { get; set; }
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Qty { get; set; }
    public decimal Rate { get; set; }
    public decimal Amount { get; set; }
}
