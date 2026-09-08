using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.DTOs;
using ErpBackend.Models;

namespace ErpBackend.Services;

public interface IGrnService
{
    Task<List<GrnResponseDto>> GetAllGrnsAsync(string compCode = "01");
    Task<GrnResponseDto?> GetGrnByKeyAsync(string compCode, int recYr, string recSr, long recNo);
    Task<GrnResponseDto> CreateGrnAsync(CreateGrnDto dto, string user = "SYSTEM");
}

public class GrnService : IGrnService
{
    private readonly ErpDbContext _db;
    private readonly IDocumentSeriesService _seriesService;

    public GrnService(ErpDbContext db, IDocumentSeriesService seriesService)
    {
        _db = db;
        _seriesService = seriesService;
    }

    public async Task<List<GrnResponseDto>> GetAllGrnsAsync(string compCode = "01")
    {
        var headers = await _db.ReceiptHeaders
            .Where(h => h.CompCode == compCode)
            .OrderByDescending(h => h.RecDt)
            .ThenByDescending(h => h.RecNo)
            .ToListAsync();

        var suppliers = await _db.PartyMasters
            .Where(p => p.CompCode == compCode)
            .ToDictionaryAsync(p => p.SlCode, p => p.SlName);

        return headers.Select(h => new GrnResponseDto
        {
            CompCode = h.CompCode,
            RecYr = h.RecYr,
            RecSr = h.RecSr,
            RecNo = h.RecNo,
            RecDt = h.RecDt,
            SlCode = h.SlCode,
            SupplierName = suppliers.TryGetValue(h.SlCode, out var name) ? name : h.SlCode,
            SuppInvNo = h.SuppInvNo,
            SuppInvDt = h.SuppInvDt,
            StoreLoc = h.StoreLoc,
            TotQty = h.TotQty,
            TotVal = h.TotVal,
            Remarks = h.Remarks,
            Status = h.Status,
            EntdBy = h.EntdBy,
            EntdDt = h.EntdDt
        }).ToList();
    }

    public async Task<GrnResponseDto?> GetGrnByKeyAsync(string compCode, int recYr, string recSr, long recNo)
    {
        var header = await _db.ReceiptHeaders
            .Include(h => h.Details)
            .FirstOrDefaultAsync(h => h.CompCode == compCode && h.RecYr == recYr && h.RecSr == recSr && h.RecNo == recNo);

        if (header == null) return null;

        var supplier = await _db.PartyMasters
            .FirstOrDefaultAsync(p => p.CompCode == compCode && p.SlCode == header.SlCode);

        var itemCodes = header.Details.Select(d => d.ItemCode).ToList();
        var items = await _db.ItemMasters
            .Where(i => i.CompCode == compCode && itemCodes.Contains(i.ItemCode))
            .ToDictionaryAsync(i => i.ItemCode, i => i.ItemName);

        return new GrnResponseDto
        {
            CompCode = header.CompCode,
            RecYr = header.RecYr,
            RecSr = header.RecSr,
            RecNo = header.RecNo,
            RecDt = header.RecDt,
            SlCode = header.SlCode,
            SupplierName = supplier?.SlName ?? header.SlCode,
            SuppInvNo = header.SuppInvNo,
            SuppInvDt = header.SuppInvDt,
            StoreLoc = header.StoreLoc,
            TotQty = header.TotQty,
            TotVal = header.TotVal,
            Remarks = header.Remarks,
            Status = header.Status,
            EntdBy = header.EntdBy,
            EntdDt = header.EntdDt,
            Details = header.Details.Select(d => new GrnDetailDto
            {
                CompCode = d.CompCode,
                RecYr = d.RecYr,
                RecSr = d.RecSr,
                RecNo = d.RecNo,
                RecSlNo = d.RecSlNo,
                ItemCode = d.ItemCode,
                ItemName = items.TryGetValue(d.ItemCode, out var iName) ? iName : d.ItemCode,
                Uom = d.Uom,
                RecQty = d.RecQty,
                RecRate = d.RecRate,
                TotAmt = d.TotAmt,
                BatchNo = d.BatchNo
            }).ToList()
        };
    }

    public async Task<GrnResponseDto> CreateGrnAsync(CreateGrnDto dto, string user = "SYSTEM")
    {
        var compCode = string.IsNullOrWhiteSpace(dto.CompCode) ? "01" : dto.CompCode;
        var storeLoc = string.IsNullOrWhiteSpace(dto.StoreLoc) ? "MAIN" : dto.StoreLoc;

        if (dto.Items == null || dto.Items.Count == 0)
        {
            throw new InvalidOperationException("At least one line item is required to receive goods.");
        }

        // Validate Supplier
        var supplier = await _db.PartyMasters
            .FirstOrDefaultAsync(p => p.CompCode == compCode && p.SlCode == dto.SlCode);
        if (supplier == null)
        {
            throw new InvalidOperationException($"Supplier with code '{dto.SlCode}' does not exist in master records.");
        }

        // Validate Items
        var itemCodes = dto.Items.Select(i => i.ItemCode).Distinct().ToList();
        var items = await _db.ItemMasters
            .Where(i => i.CompCode == compCode && itemCodes.Contains(i.ItemCode))
            .ToDictionaryAsync(i => i.ItemCode, i => i);

        foreach (var code in itemCodes)
        {
            if (!items.ContainsKey(code))
            {
                throw new InvalidOperationException($"Item '{code}' not found in Product Master.");
            }
        }

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var recYr = DateTime.UtcNow.Year;
            var recSr = "GR";
            var nextRecNo = await _seriesService.GetNextDocNoAsync(compCode, "GRN", recSr, recYr, user);

            decimal totalQty = 0;
            decimal totalVal = 0;
            var details = new List<SaleReceiptDetail>();
            int slNo = 1;

            foreach (var itemInput in dto.Items)
            {
                if (itemInput.RecQty <= 0)
                {
                    throw new InvalidOperationException($"Received quantity for '{itemInput.ItemCode}' must be greater than zero.");
                }

                var item = items[itemInput.ItemCode];
                var lineTot = Math.Round(itemInput.RecQty * itemInput.RecRate, 2);

                totalQty += itemInput.RecQty;
                totalVal += lineTot;

                details.Add(new SaleReceiptDetail
                {
                    CompCode = compCode,
                    RecYr = recYr,
                    RecSr = recSr,
                    RecNo = nextRecNo,
                    RecSlNo = slNo++,
                    ItemCode = item.ItemCode,
                    Uom = item.Uom,
                    RecQty = itemInput.RecQty,
                    RecRate = itemInput.RecRate,
                    TotAmt = lineTot,
                    BatchNo = itemInput.BatchNo ?? $"BATCH-{DateTime.UtcNow:yyMMdd}-{slNo}"
                });

                // Stock Update (Increment)
                var stock = await _db.Stocks
                    .FirstOrDefaultAsync(s => s.CompCode == compCode && s.ItemCode == item.ItemCode && s.StoreLoc == storeLoc);

                if (stock == null)
                {
                    stock = new SalesStock
                    {
                        CompCode = compCode,
                        ItemCode = item.ItemCode,
                        StoreLoc = storeLoc,
                        StockQty = itemInput.RecQty,
                        Uom = item.Uom,
                        AvgCost = itemInput.RecRate,
                        LastUpdated = DateTime.UtcNow
                    };
                    _db.Stocks.Add(stock);
                }
                else
                {
                    var previousTotalVal = stock.StockQty * stock.AvgCost;
                    var newTotalVal = previousTotalVal + lineTot;
                    var newTotalQty = stock.StockQty + itemInput.RecQty;

                    stock.StockQty = newTotalQty;
                    stock.AvgCost = newTotalQty > 0 ? Math.Round(newTotalVal / newTotalQty, 4) : itemInput.RecRate;
                    stock.LastUpdated = DateTime.UtcNow;
                }

                // Write to Sales Ledger
                _db.Ledgers.Add(new SalesLedger
                {
                    CompCode = compCode,
                    DocId = "GRN",
                    DocSr = recSr,
                    DocNo = nextRecNo,
                    DocDt = DateTime.UtcNow,
                    ItemCode = item.ItemCode,
                    StoreLoc = storeLoc,
                    InQty = itemInput.RecQty,
                    OutQty = 0,
                    BalanceQty = stock.StockQty,
                    Rate = itemInput.RecRate,
                    Remarks = $"GRN Receipt {recSr}-{recYr}-{nextRecNo:D6} from {supplier.SlName}",
                    EntdDt = DateTime.UtcNow
                });
            }

            var header = new SaleReceiptHeader
            {
                CompCode = compCode,
                RecYr = recYr,
                RecSr = recSr,
                RecNo = nextRecNo,
                RecDt = DateTime.UtcNow,
                SlCode = supplier.SlCode,
                SuppInvNo = dto.SuppInvNo,
                SuppInvDt = dto.SuppInvDt,
                StoreLoc = storeLoc,
                TotQty = totalQty,
                TotVal = totalVal,
                Remarks = dto.Remarks,
                Status = "A",
                EntdBy = user,
                EntdDt = DateTime.UtcNow,
                Details = details
            };

            _db.ReceiptHeaders.Add(header);

            _db.AuditLogs.Add(new SystemAuditLog
            {
                Timestamp = DateTime.UtcNow,
                UserId = user,
                Action = "CREATE",
                Entity = "sale_rechdr",
                RecordId = $"{compCode}-{recYr}-{recSr}-{nextRecNo}",
                Details = $"Received {totalQty} items (₹{totalVal:N2}) from {supplier.SlName}"
            });

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return (await GetGrnByKeyAsync(compCode, recYr, recSr, nextRecNo))!;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
