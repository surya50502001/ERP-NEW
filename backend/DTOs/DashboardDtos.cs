namespace ErpBackend.DTOs;

public class DashboardStatsDto
{
    public decimal TotalSalesValue { get; set; }
    public int TotalInvoicesCount { get; set; }
    public int PendingInvoicesCount { get; set; }
    public decimal TotalStockValue { get; set; }
    public int TotalProductsCount { get; set; }
    public int LowStockItemsCount { get; set; }
    public int TotalGrnCount { get; set; }
    public int TotalPartiesCount { get; set; }
    public List<RecentActivityDto> RecentActivities { get; set; } = new();
}

public class RecentActivityDto
{
    public string ActivityType { get; set; } = string.Empty; // Invoice, GRN, Rate, Master
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Status { get; set; } = "success";
}
