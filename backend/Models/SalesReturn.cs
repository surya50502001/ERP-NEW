namespace ErpBackend.Models;

public class SalesReturn
{
    public int Id { get; set; }
    public string ReturnId { get; set; } = string.Empty; // e.g. CN-5001
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string? CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public decimal RefundAmount { get; set; }
    public string Reason { get; set; } = "Customer Return";
    public string Status { get; set; } = "Credited";
    public List<SalesReturnItem> Items { get; set; } = new();
}

public class SalesReturnItem
{
    public int Id { get; set; }
    public int SalesReturnId { get; set; }
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Qty { get; set; }
    public decimal Rate { get; set; }
    public decimal Amount { get; set; }
}
