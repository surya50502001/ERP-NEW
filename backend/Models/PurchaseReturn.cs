namespace ErpBackend.Models;

public class PurchaseReturn
{
    public int Id { get; set; }
    public string ReturnId { get; set; } = string.Empty; // e.g. DN-3001
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string? SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public decimal ReturnAmount { get; set; }
    public string Reason { get; set; } = "Defective / Quality Return";
    public string Status { get; set; } = "Adjusted";
    public List<PurchaseReturnItem> Items { get; set; } = new();
}

public class PurchaseReturnItem
{
    public int Id { get; set; }
    public int PurchaseReturnId { get; set; }
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Qty { get; set; }
    public decimal Rate { get; set; }
    public decimal Amount { get; set; }
}
