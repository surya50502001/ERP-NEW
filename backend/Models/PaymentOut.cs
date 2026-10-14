namespace ErpBackend.Models;

public class PaymentOut
{
    public int Id { get; set; }
    public string PaymentId { get; set; } = string.Empty; // e.g. PAYO-1001
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string? SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = "Bank Transfer";
    public string? ReferenceNo { get; set; }
    public string? BillRef { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = "Paid";
}
