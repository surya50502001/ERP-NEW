namespace ErpBackend.Models;

public class PurchaseBill
{
    public int Id { get; set; }
    public string BillNo { get; set; } = string.Empty; // e.g. PB-1001
    public DateTime BillDate { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }
    public string? SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Unpaid";
    public string? Notes { get; set; }
    public List<PurchaseBillItem> Items { get; set; } = new();
}

public class PurchaseBillItem
{
    public int Id { get; set; }
    public int PurchaseBillId { get; set; }
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Qty { get; set; }
    public decimal Rate { get; set; }
    public decimal Amount { get; set; }
}
