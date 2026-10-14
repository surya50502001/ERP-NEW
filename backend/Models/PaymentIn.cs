namespace ErpBackend.Models;

public class PaymentIn
{
    public int Id { get; set; }
    public string PaymentId { get; set; } = string.Empty; // e.g. PAYI-4001
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string? CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = "Bank Transfer";
    public string? ReferenceNo { get; set; }
    public string? InvoiceRef { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = "Received";
}
