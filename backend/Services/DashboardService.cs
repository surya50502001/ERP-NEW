using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.DTOs;

namespace ErpBackend.Services;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(string compCode = "01");
}

public class DashboardService : IDashboardService
{
    private readonly ErpDbContext _db;

    public DashboardService(ErpDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(string compCode = "01")
    {
        var totalSales = await _db.InvoiceHeaders
            .Where(i => i.CompCode == compCode && i.Status != "C")
            .SumAsync(i => (decimal?)i.InvVal) ?? 0;

        var totalInvoicesCount = await _db.InvoiceHeaders
            .Where(i => i.CompCode == compCode)
            .CountAsync();

        var pendingInvoicesCount = await _db.InvoiceHeaders
            .Where(i => i.CompCode == compCode && i.Status == "P")
            .CountAsync();

        var stocks = await _db.Stocks
            .Where(s => s.CompCode == compCode)
            .ToListAsync();

        var totalStockValue = stocks.Sum(s => s.StockQty * s.AvgCost);
        var lowStockCount = stocks.Count(s => s.StockQty <= 10);

        var totalProductsCount = await _db.ItemMasters
            .Where(i => i.CompCode == compCode && i.Status == "A")
            .CountAsync();

        var totalGrnCount = await _db.ReceiptHeaders
            .Where(r => r.CompCode == compCode)
            .CountAsync();

        var totalPartiesCount = await _db.PartyMasters
            .Where(p => p.CompCode == compCode && p.Status == "A")
            .CountAsync();

        var auditLogs = await _db.AuditLogs
            .OrderByDescending(a => a.Timestamp)
            .Take(10)
            .ToListAsync();

        var activities = auditLogs.Select(a => new RecentActivityDto
        {
            ActivityType = a.Entity,
            Title = $"{a.Action} on {a.Entity}",
            Description = a.Details ?? a.RecordId,
            Timestamp = a.Timestamp,
            Status = "success"
        }).ToList();

        return new DashboardStatsDto
        {
            TotalSalesValue = totalSales,
            TotalInvoicesCount = totalInvoicesCount,
            PendingInvoicesCount = pendingInvoicesCount,
            TotalStockValue = totalStockValue,
            TotalProductsCount = totalProductsCount,
            LowStockItemsCount = lowStockCount,
            TotalGrnCount = totalGrnCount,
            TotalPartiesCount = totalPartiesCount,
            RecentActivities = activities
        };
    }
}
