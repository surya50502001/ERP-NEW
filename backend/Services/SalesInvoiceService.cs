using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.DTOs;
using ErpBackend.Models;

namespace ErpBackend.Services;

public interface ISalesInvoiceService
{
    Task<List<InvoiceResponseDto>> GetAllInvoicesAsync(string compCode = "01");
    Task<InvoiceResponseDto?> GetInvoiceByKeyAsync(string compCode, int invYr, string invSr, long invNo);
    Task<InvoiceResponseDto> CreateInvoiceAsync(CreateInvoiceDto dto, string user = "SYSTEM");
    Task<InvoiceResponseDto> ApproveInvoiceAsync(string compCode, int invYr, string invSr, long invNo, string user = "SYSTEM");
    Task<InvoiceResponseDto> CancelInvoiceAsync(string compCode, int invYr, string invSr, long invNo, string reason, string user = "SYSTEM");
}

public class SalesInvoiceService : ISalesInvoiceService
{
    private readonly ErpDbContext _db;
    private readonly IDocumentSeriesService _seriesService;

    public SalesInvoiceService(ErpDbContext db, IDocumentSeriesService seriesService)
    {
        _db = db;
        _seriesService = seriesService;
    }

    public async Task<List<InvoiceResponseDto>> GetAllInvoicesAsync(string compCode = "01")
    {
        var headers = await _db.InvoiceHeaders
            .Where(h => h.CompCode == compCode)
            .OrderByDescending(h => h.InvDt)
            .ThenByDescending(h => h.InvNo)
            .ToListAsync();

        var parties = await _db.PartyMasters
            .Where(p => p.CompCode == compCode)
            .ToDictionaryAsync(p => p.SlCode, p => p);

        var result = new List<InvoiceResponseDto>();
        foreach (var h in headers)
        {
            parties.TryGetValue(h.SlCode, out var party);
            result.Add(MapToResponseDto(h, party, null));
        }

        return result;
    }

    public async Task<InvoiceResponseDto?> GetInvoiceByKeyAsync(string compCode, int invYr, string invSr, long invNo)
    {
        var header = await _db.InvoiceHeaders
            .Include(h => h.Details)
            .FirstOrDefaultAsync(h => h.CompCode == compCode && h.InvYr == invYr && h.InvSr == invSr && h.InvNo == invNo);

        if (header == null) return null;

        var party = await _db.PartyMasters
            .FirstOrDefaultAsync(p => p.CompCode == compCode && p.SlCode == header.SlCode);

        var itemCodes = header.Details.Select(d => d.ItemCode).ToList();
        var items = await _db.ItemMasters
            .Where(i => i.CompCode == compCode && itemCodes.Contains(i.ItemCode))
            .ToDictionaryAsync(i => i.ItemCode, i => i);

        return MapToResponseDto(header, party, items);
    }

    public async Task<InvoiceResponseDto> CreateInvoiceAsync(CreateInvoiceDto dto, string user = "SYSTEM")
    {
        var compCode = string.IsNullOrWhiteSpace(dto.CompCode) ? "01" : dto.CompCode;
        var storeLoc = string.IsNullOrWhiteSpace(dto.StoreLoc) ? "MAIN" : dto.StoreLoc;

        if (dto.Items == null || dto.Items.Count == 0)
        {
            throw new InvalidOperationException("At least one line item is required to create a sales invoice.");
        }

        // 1. Validate Party
        var party = await _db.PartyMasters
            .FirstOrDefaultAsync(p => p.CompCode == compCode && p.SlCode == dto.SlCode);
        if (party == null)
        {
            throw new InvalidOperationException($"Customer with code '{dto.SlCode}' does not exist in master records.");
        }

        // 2. Fetch and Validate Items & Active Rates
        var requestedItemCodes = dto.Items.Select(i => i.ItemCode).Distinct().ToList();
        var items = await _db.ItemMasters
            .Where(i => i.CompCode == compCode && requestedItemCodes.Contains(i.ItemCode))
            .ToDictionaryAsync(i => i.ItemCode, i => i);

        foreach (var reqCode in requestedItemCodes)
        {
            if (!items.ContainsKey(reqCode))
            {
                throw new InvalidOperationException($"Item '{reqCode}' does not exist in Product Master.");
            }
        }

        var latestRates = await _db.ItemRates
            .Where(r => r.CompCode == compCode && requestedItemCodes.Contains(r.ItemCode) && r.Status == "A")
            .GroupBy(r => r.ItemCode)
            .Select(g => g.OrderByDescending(r => r.EffectiveDt).First())
            .ToDictionaryAsync(r => r.ItemCode, r => r.Rate);

        // 3. Begin Atomic Transaction
        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var invYr = DateTime.UtcNow.Year;
            var invSr = "SI";
            var nextInvNo = await _seriesService.GetNextDocNoAsync(compCode, "INV", invSr, invYr, user);

            decimal totalProdVal = 0;
            decimal totalCgstVal = 0;
            decimal totalSgstVal = 0;
            decimal totalIgstVal = 0;

            var details = new List<SaleInvoiceDetail>();
            int slNo = 1;

            foreach (var itemInput in dto.Items)
            {
                if (itemInput.InvQty <= 0)
                {
                    throw new InvalidOperationException($"Quantity for item '{itemInput.ItemCode}' must be greater than zero.");
                }

                var itemMaster = items[itemInput.ItemCode];

                // Determine authoritative rate
                decimal rate = 0;
                if (itemInput.OverrideRate.HasValue && itemInput.OverrideRate.Value > 0)
                {
                    rate = itemInput.OverrideRate.Value;
                }
                else if (latestRates.TryGetValue(itemInput.ItemCode, out var dbRate) && dbRate > 0)
                {
                    rate = dbRate;
                }
                else
                {
                    throw new InvalidOperationException($"No active rate found in Rate Master for item '{itemMaster.ItemName}' ({itemMaster.ItemCode}).");
                }

                // Check Stock Availability
                var stock = await _db.Stocks
                    .FirstOrDefaultAsync(s => s.CompCode == compCode && s.ItemCode == itemInput.ItemCode && s.StoreLoc == storeLoc);

                var availableQty = stock?.StockQty ?? 0;
                if (availableQty < itemInput.InvQty)
                {
                    throw new InvalidOperationException($"Insufficient stock for '{itemMaster.ItemName}'. Available: {availableQty} {itemMaster.Uom}, Requested: {itemInput.InvQty} {itemMaster.Uom}.");
                }

                // Calculations
                var taxableAmt = Math.Round(itemInput.InvQty * rate, 2);
                var cgstVal = Math.Round(taxableAmt * (itemMaster.CgstPer / 100m), 2);
                var sgstVal = Math.Round(taxableAmt * (itemMaster.SgstPer / 100m), 2);
                var igstVal = Math.Round(taxableAmt * (itemMaster.IgstPer / 100m), 2);
                var lineTotVal = taxableAmt + cgstVal + sgstVal + igstVal;

                totalProdVal += taxableAmt;
                totalCgstVal += cgstVal;
                totalSgstVal += sgstVal;
                totalIgstVal += igstVal;

                var detail = new SaleInvoiceDetail
                {
                    CompCode = compCode,
                    InvYr = invYr,
                    InvSr = invSr,
                    InvNo = nextInvNo,
                    InvSlNo = slNo++,
                    ItemCode = itemMaster.ItemCode,
                    ItemDesc = itemMaster.ItemName,
                    HsnCode = itemMaster.HsnCode,
                    Uom = itemMaster.Uom,
                    InvQty = itemInput.InvQty,
                    InvRate = rate,
                    TaxableAmt = taxableAmt,
                    CgstPer = itemMaster.CgstPer,
                    SgstPer = itemMaster.SgstPer,
                    IgstPer = itemMaster.IgstPer,
                    CgstVal = cgstVal,
                    SgstVal = sgstVal,
                    IgstVal = igstVal,
                    TotVal = lineTotVal
                };
                details.Add(detail);

                // Update Stock (Decrement)
                stock!.StockQty -= itemInput.InvQty;
                stock.LastUpdated = DateTime.UtcNow;

                // Write to Sales Ledger
                var ledgerEntry = new SalesLedger
                {
                    CompCode = compCode,
                    DocId = "INV",
                    DocSr = invSr,
                    DocNo = nextInvNo,
                    DocDt = DateTime.UtcNow,
                    ItemCode = itemMaster.ItemCode,
                    StoreLoc = storeLoc,
                    InQty = 0,
                    OutQty = itemInput.InvQty,
                    BalanceQty = stock.StockQty,
                    Rate = rate,
                    Remarks = $"Sales Invoice {invSr}-{invYr}-{nextInvNo:D6} to {party.SlName}",
                    EntdDt = DateTime.UtcNow
                };
                _db.Ledgers.Add(ledgerEntry);
            }

            var subTotal = totalProdVal + totalCgstVal + totalSgstVal + totalIgstVal + dto.FreightVal + dto.OthVal;
            var roundedTotal = Math.Round(subTotal, 0, MidpointRounding.AwayFromZero);
            var roffVal = roundedTotal - subTotal;

            var header = new SaleInvoiceHeader
            {
                CompCode = compCode,
                InvYr = invYr,
                InvSr = invSr,
                InvNo = nextInvNo,
                InvDt = DateTime.UtcNow,
                InvType = "TAX INVOICE",
                SlCode = party.SlCode,
                DespatchTo = dto.DespatchTo ?? party.Address1,
                StoreLoc = storeLoc,
                ProdVal = totalProdVal,
                CgstVal = totalCgstVal,
                SgstVal = totalSgstVal,
                IgstVal = totalIgstVal,
                FreightVal = dto.FreightVal,
                OthVal = dto.OthVal,
                RoffVal = roffVal,
                InvVal = roundedTotal,
                VehicleNo = dto.VehicleNo,
                DespMode = dto.DespMode ?? "Road",
                BuyerPoNo = dto.BuyerPoNo,
                BuyerPoDt = dto.BuyerPoDt,
                DelyCd = dto.DelyCd,
                Remarks = dto.Remarks,
                BankCode = dto.BankCode,
                Status = "P", // Pending approval
                EntdBy = user,
                EntdDt = DateTime.UtcNow,
                Details = details
            };

            _db.InvoiceHeaders.Add(header);

            // Audit log
            _db.AuditLogs.Add(new SystemAuditLog
            {
                Timestamp = DateTime.UtcNow,
                UserId = user,
                Action = "CREATE",
                Entity = "sale_invhdr",
                RecordId = $"{compCode}-{invYr}-{invSr}-{nextInvNo}",
                Details = $"Created Invoice for {party.SlName} with Total: ₹{roundedTotal:N2}"
            });

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return MapToResponseDto(header, party, items);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<InvoiceResponseDto> ApproveInvoiceAsync(string compCode, int invYr, string invSr, long invNo, string user = "SYSTEM")
    {
        var invoice = await _db.InvoiceHeaders
            .Include(h => h.Details)
            .FirstOrDefaultAsync(h => h.CompCode == compCode && h.InvYr == invYr && h.InvSr == invSr && h.InvNo == invNo);

        if (invoice == null)
            throw new KeyNotFoundException($"Invoice '{invSr}-{invYr}-{invNo}' not found.");

        if (invoice.Status != "P")
            throw new InvalidOperationException($"Cannot approve invoice in '{invoice.Status}' state.");

        invoice.Status = "A";
        invoice.AuthBy = user;
        invoice.AuthDt = DateTime.UtcNow;

        _db.AuditLogs.Add(new SystemAuditLog
        {
            Timestamp = DateTime.UtcNow,
            UserId = user,
            Action = "APPROVE",
            Entity = "sale_invhdr",
            RecordId = $"{compCode}-{invYr}-{invSr}-{invNo}",
            Details = $"Approved Invoice {invSr}-{invYr}-{invNo:D6}"
        });

        await _db.SaveChangesAsync();

        var party = await _db.PartyMasters.FirstOrDefaultAsync(p => p.CompCode == compCode && p.SlCode == invoice.SlCode);
        return MapToResponseDto(invoice, party, null);
    }

    public async Task<InvoiceResponseDto> CancelInvoiceAsync(string compCode, int invYr, string invSr, long invNo, string reason, string user = "SYSTEM")
    {
        var invoice = await _db.InvoiceHeaders
            .Include(h => h.Details)
            .FirstOrDefaultAsync(h => h.CompCode == compCode && h.InvYr == invYr && h.InvSr == invSr && h.InvNo == invNo);

        if (invoice == null)
            throw new KeyNotFoundException($"Invoice '{invSr}-{invYr}-{invNo}' not found.");

        if (invoice.Status == "C")
            throw new InvalidOperationException("Invoice is already cancelled.");

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            // Revert stock for each line item
            foreach (var detail in invoice.Details)
            {
                var stock = await _db.Stocks
                    .FirstOrDefaultAsync(s => s.CompCode == compCode && s.ItemCode == detail.ItemCode && s.StoreLoc == invoice.StoreLoc);

                if (stock != null)
                {
                    stock.StockQty += detail.InvQty;
                    stock.LastUpdated = DateTime.UtcNow;

                    _db.Ledgers.Add(new SalesLedger
                    {
                        CompCode = compCode,
                        DocId = "ADJ",
                        DocSr = "REV",
                        DocNo = invNo,
                        DocDt = DateTime.UtcNow,
                        ItemCode = detail.ItemCode,
                        StoreLoc = invoice.StoreLoc,
                        InQty = detail.InvQty,
                        OutQty = 0,
                        BalanceQty = stock.StockQty,
                        Rate = detail.InvRate,
                        Remarks = $"Stock Reversal due to Invoice Cancellation ({reason})",
                        EntdDt = DateTime.UtcNow
                    });
                }
            }

            invoice.Status = "C";
            invoice.CanBy = user;
            invoice.CanDt = DateTime.UtcNow;
            invoice.CanReason = reason;

            _db.AuditLogs.Add(new SystemAuditLog
            {
                Timestamp = DateTime.UtcNow,
                UserId = user,
                Action = "CANCEL",
                Entity = "sale_invhdr",
                RecordId = $"{compCode}-{invYr}-{invSr}-{invNo}",
                Details = $"Cancelled Invoice {invSr}-{invYr}-{invNo:D6}. Reason: {reason}"
            });

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            var party = await _db.PartyMasters.FirstOrDefaultAsync(p => p.CompCode == compCode && p.SlCode == invoice.SlCode);
            return MapToResponseDto(invoice, party, null);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private static InvoiceResponseDto MapToResponseDto(SaleInvoiceHeader h, SalePartyMaster? party, Dictionary<string, SaleItemMaster>? items)
    {
        return new InvoiceResponseDto
        {
            CompCode = h.CompCode,
            InvYr = h.InvYr,
            InvSr = h.InvSr,
            InvNo = h.InvNo,
            InvDt = h.InvDt,
            InvType = h.InvType,
            SlCode = h.SlCode,
            CustomerName = party?.SlName ?? h.SlCode,
            CustomerGstin = party?.Gstin,
            DespatchTo = h.DespatchTo,
            StoreLoc = h.StoreLoc,
            ProdVal = h.ProdVal,
            CgstVal = h.CgstVal,
            SgstVal = h.SgstVal,
            IgstVal = h.IgstVal,
            FreightVal = h.FreightVal,
            OthVal = h.OthVal,
            RoffVal = h.RoffVal,
            InvVal = h.InvVal,
            VehicleNo = h.VehicleNo,
            DespMode = h.DespMode,
            BuyerPoNo = h.BuyerPoNo,
            BuyerPoDt = h.BuyerPoDt,
            DelyCd = h.DelyCd,
            Remarks = h.Remarks,
            BankCode = h.BankCode,
            Status = h.Status,
            EntdBy = h.EntdBy,
            EntdDt = h.EntdDt,
            AuthBy = h.AuthBy,
            AuthDt = h.AuthDt,
            CanBy = h.CanBy,
            CanDt = h.CanDt,
            CanReason = h.CanReason,
            Details = h.Details?.Select(d => new InvoiceDetailDto
            {
                CompCode = d.CompCode,
                InvYr = d.InvYr,
                InvSr = d.InvSr,
                InvNo = d.InvNo,
                InvSlNo = d.InvSlNo,
                ItemCode = d.ItemCode,
                ItemName = items != null && items.TryGetValue(d.ItemCode, out var m) ? m.ItemName : (d.ItemDesc ?? d.ItemCode),
                ItemDesc = d.ItemDesc,
                HsnCode = d.HsnCode,
                Uom = d.Uom,
                InvQty = d.InvQty,
                InvRate = d.InvRate,
                TaxableAmt = d.TaxableAmt,
                CgstPer = d.CgstPer,
                SgstPer = d.SgstPer,
                IgstPer = d.IgstPer,
                CgstVal = d.CgstVal,
                SgstVal = d.SgstVal,
                IgstVal = d.IgstVal,
                TotVal = d.TotVal
            }).ToList() ?? new List<InvoiceDetailDto>()
        };
    }
}
