using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.DTOs;
using ErpBackend.Models;

namespace ErpBackend.Services;

public interface IStockService
{
    Task<List<StockResponseDto>> GetCurrentStockAsync(string compCode = "01");
    Task<StockResponseDto?> GetItemStockAsync(string itemCode, string compCode = "01", string storeLoc = "MAIN");
    Task<List<LedgerResponseDto>> GetLedgerHistoryAsync(string? itemCode = null, string compCode = "01");
}

public class StockService : IStockService
{
    private readonly ErpDbContext _db;

    public StockService(ErpDbContext db)
    {
        _db = db;
    }

    public async Task<List<StockResponseDto>> GetCurrentStockAsync(string compCode = "01")
    {
        var stocks = await _db.Stocks
            .Where(s => s.CompCode == compCode)
            .ToListAsync();

        var itemCodes = stocks.Select(s => s.ItemCode).ToList();
        var items = await _db.ItemMasters
            .Where(i => i.CompCode == compCode && itemCodes.Contains(i.ItemCode))
            .ToDictionaryAsync(i => i.ItemCode, i => i);

        return stocks.Select(s =>
        {
            items.TryGetValue(s.ItemCode, out var item);
            return new StockResponseDto
            {
                CompCode = s.CompCode,
                ItemCode = s.ItemCode,
                ItemName = item?.ItemName ?? s.ItemCode,
                ItemType = item?.ItemType,
                Category = item?.Category,
                StoreLoc = s.StoreLoc,
                StockQty = s.StockQty,
                Uom = s.Uom,
                AvgCost = s.AvgCost,
                LastUpdated = s.LastUpdated
            };
        }).OrderBy(s => s.ItemName).ToList();
    }

    public async Task<StockResponseDto?> GetItemStockAsync(string itemCode, string compCode = "01", string storeLoc = "MAIN")
    {
        var stock = await _db.Stocks
            .FirstOrDefaultAsync(s => s.CompCode == compCode && s.ItemCode == itemCode && s.StoreLoc == storeLoc);

        if (stock == null) return null;

        var item = await _db.ItemMasters
            .FirstOrDefaultAsync(i => i.CompCode == compCode && i.ItemCode == itemCode);

        return new StockResponseDto
        {
            CompCode = stock.CompCode,
            ItemCode = stock.ItemCode,
            ItemName = item?.ItemName ?? stock.ItemCode,
            ItemType = item?.ItemType,
            Category = item?.Category,
            StoreLoc = stock.StoreLoc,
            StockQty = stock.StockQty,
            Uom = stock.Uom,
            AvgCost = stock.AvgCost,
            LastUpdated = stock.LastUpdated
        };
    }

    public async Task<List<LedgerResponseDto>> GetLedgerHistoryAsync(string? itemCode = null, string compCode = "01")
    {
        var query = _db.Ledgers.Where(l => l.CompCode == compCode);

        if (!string.IsNullOrWhiteSpace(itemCode))
        {
            query = query.Where(l => l.ItemCode == itemCode);
        }

        var ledgers = await query
            .OrderByDescending(l => l.DocDt)
            .ThenByDescending(l => l.LedgerId)
            .Take(200)
            .ToListAsync();

        var itemCodes = ledgers.Select(l => l.ItemCode).Distinct().ToList();
        var items = await _db.ItemMasters
            .Where(i => i.CompCode == compCode && itemCodes.Contains(i.ItemCode))
            .ToDictionaryAsync(i => i.ItemCode, i => i.ItemName);

        return ledgers.Select(l => new LedgerResponseDto
        {
            LedgerId = l.LedgerId,
            CompCode = l.CompCode,
            DocId = l.DocId,
            DocSr = l.DocSr,
            DocNo = l.DocNo,
            DocDt = l.DocDt,
            ItemCode = l.ItemCode,
            ItemName = items.TryGetValue(l.ItemCode, out var name) ? name : l.ItemCode,
            StoreLoc = l.StoreLoc,
            InQty = l.InQty,
            OutQty = l.OutQty,
            BalanceQty = l.BalanceQty,
            Rate = l.Rate,
            Remarks = l.Remarks,
            EntdDt = l.EntdDt
        }).ToList();
    }
}
