using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.DTOs;
using ErpBackend.Models;

namespace ErpBackend.Services;

public interface IMasterDataService
{
    // Items
    Task<List<ItemMasterDto>> GetItemsAsync(string compCode = "01");
    Task<ItemMasterDto?> GetItemByCodeAsync(string itemCode, string compCode = "01");
    Task<ItemMasterDto> CreateItemAsync(CreateItemMasterDto dto, string user = "SYSTEM");
    Task<ItemMasterDto> UpdateItemAsync(string itemCode, UpdateItemMasterDto dto, string compCode = "01", string user = "SYSTEM");
    Task<bool> DeleteItemAsync(string itemCode, string compCode = "01", string user = "SYSTEM");

    // Rates
    Task<List<ItemRateDto>> GetRatesByItemAsync(string itemCode, string compCode = "01");
    Task<ItemRateDto> CreateRateAsync(CreateItemRateDto dto, string user = "SYSTEM");

    // Parties
    Task<List<PartyMasterDto>> GetPartiesAsync(string? type = null, string compCode = "01");
    Task<PartyMasterDto> CreatePartyAsync(CreatePartyMasterDto dto, string user = "SYSTEM");
    Task<PartyMasterDto> UpdatePartyAsync(string slCode, CreatePartyMasterDto dto, string compCode = "01", string user = "SYSTEM");
    Task<bool> DeletePartyAsync(string slCode, string compCode = "01", string user = "SYSTEM");

    // Banks
    Task<List<BankMasterDto>> GetBanksAsync(string compCode = "01");
    Task<BankMasterDto> CreateBankAsync(CreateBankMasterDto dto, string user = "SYSTEM");

    // Delivery Locations
    Task<List<DeliveryLocationDto>> GetDeliveryLocationsAsync(string compCode = "01");
    Task<DeliveryLocationDto> CreateDeliveryLocationAsync(CreateDeliveryLocationDto dto, string user = "SYSTEM");
}

public class MasterDataService : IMasterDataService
{
    private readonly ErpDbContext _db;

    public MasterDataService(ErpDbContext db)
    {
        _db = db;
    }

    #region Items
    public async Task<List<ItemMasterDto>> GetItemsAsync(string compCode = "01")
    {
        var items = await _db.ItemMasters
            .Where(i => i.CompCode == compCode)
            .OrderBy(i => i.ItemName)
            .ToListAsync();

        var rates = await _db.ItemRates
            .Where(r => r.CompCode == compCode && r.Status == "A")
            .GroupBy(r => r.ItemCode)
            .Select(g => g.OrderByDescending(r => r.EffectiveDt).First())
            .ToDictionaryAsync(r => r.ItemCode, r => r.Rate);

        var stocks = await _db.Stocks
            .Where(s => s.CompCode == compCode)
            .GroupBy(s => s.ItemCode)
            .Select(g => new { ItemCode = g.Key, TotalStock = g.Sum(s => s.StockQty) })
            .ToDictionaryAsync(s => s.ItemCode, s => s.TotalStock);

        return items.Select(i => new ItemMasterDto
        {
            CompCode = i.CompCode,
            ItemCode = i.ItemCode,
            ItemName = i.ItemName,
            ItemDesc = i.ItemDesc,
            Uom = i.Uom,
            HsnCode = i.HsnCode,
            ItemType = i.ItemType,
            Brand = i.Brand,
            Category = i.Category,
            CgstPer = i.CgstPer,
            SgstPer = i.SgstPer,
            IgstPer = i.IgstPer,
            Status = i.Status,
            CurrentRate = rates.TryGetValue(i.ItemCode, out var rate) ? rate : 0,
            CurrentStock = stocks.TryGetValue(i.ItemCode, out var stock) ? stock : 0
        }).ToList();
    }

    public async Task<ItemMasterDto?> GetItemByCodeAsync(string itemCode, string compCode = "01")
    {
        var item = await _db.ItemMasters
            .FirstOrDefaultAsync(i => i.CompCode == compCode && i.ItemCode == itemCode);

        if (item == null) return null;

        var rate = await _db.ItemRates
            .Where(r => r.CompCode == compCode && r.ItemCode == itemCode && r.Status == "A")
            .OrderByDescending(r => r.EffectiveDt)
            .Select(r => r.Rate)
            .FirstOrDefaultAsync();

        var stock = await _db.Stocks
            .Where(s => s.CompCode == compCode && s.ItemCode == itemCode)
            .SumAsync(s => s.StockQty);

        return new ItemMasterDto
        {
            CompCode = item.CompCode,
            ItemCode = item.ItemCode,
            ItemName = item.ItemName,
            ItemDesc = item.ItemDesc,
            Uom = item.Uom,
            HsnCode = item.HsnCode,
            ItemType = item.ItemType,
            Brand = item.Brand,
            Category = item.Category,
            CgstPer = item.CgstPer,
            SgstPer = item.SgstPer,
            IgstPer = item.IgstPer,
            Status = item.Status,
            CurrentRate = rate,
            CurrentStock = stock
        };
    }

    public async Task<ItemMasterDto> CreateItemAsync(CreateItemMasterDto dto, string user = "SYSTEM")
    {
        var compCode = string.IsNullOrWhiteSpace(dto.CompCode) ? "01" : dto.CompCode;
        var itemCode = dto.ItemCode.Trim().ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(itemCode))
            throw new ArgumentException("Item code is required.");

        if (string.IsNullOrWhiteSpace(dto.ItemName))
            throw new ArgumentException("Item name is required.");

        var existing = await _db.ItemMasters
            .AnyAsync(i => i.CompCode == compCode && i.ItemCode == itemCode);

        if (existing)
            throw new InvalidOperationException($"Item with code '{itemCode}' already exists.");

        var item = new SaleItemMaster
        {
            CompCode = compCode,
            ItemCode = itemCode,
            ItemName = dto.ItemName.Trim(),
            ItemDesc = dto.ItemDesc,
            Uom = string.IsNullOrWhiteSpace(dto.Uom) ? "NOS" : dto.Uom.ToUpperInvariant(),
            HsnCode = dto.HsnCode,
            ItemType = dto.ItemType,
            Brand = dto.Brand,
            Category = dto.Category,
            CgstPer = dto.CgstPer,
            SgstPer = dto.SgstPer,
            IgstPer = dto.IgstPer,
            Status = "A",
            EntdBy = user,
            EntdDt = DateTime.UtcNow
        };

        _db.ItemMasters.Add(item);

        // If initial rate provided, insert rate record
        if (dto.InitialRate > 0)
        {
            var maxRateNo = await _db.ItemRates
                .Where(r => r.CompCode == compCode)
                .Select(r => (long?)r.RateNo)
                .MaxAsync() ?? 0;

            _db.ItemRates.Add(new SaleItemRate
            {
                CompCode = compCode,
                RateSr = "IR",
                RateNo = maxRateNo + 1,
                ItemCode = itemCode,
                RateDt = DateTime.UtcNow,
                Rate = dto.InitialRate,
                EffectiveDt = DateTime.UtcNow,
                Status = "A",
                EntdBy = user,
                EntdDt = DateTime.UtcNow
            });
        }

        // Initialize zero stock record
        _db.Stocks.Add(new SalesStock
        {
            CompCode = compCode,
            ItemCode = itemCode,
            StoreLoc = "MAIN",
            StockQty = 0,
            Uom = item.Uom,
            AvgCost = dto.InitialRate,
            LastUpdated = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return (await GetItemByCodeAsync(itemCode, compCode))!;
    }

    public async Task<ItemMasterDto> UpdateItemAsync(string itemCode, UpdateItemMasterDto dto, string compCode = "01", string user = "SYSTEM")
    {
        var item = await _db.ItemMasters
            .FirstOrDefaultAsync(i => i.CompCode == compCode && i.ItemCode == itemCode);

        if (item == null)
            throw new KeyNotFoundException($"Item '{itemCode}' not found.");

        item.ItemName = dto.ItemName.Trim();
        item.ItemDesc = dto.ItemDesc;
        item.Uom = dto.Uom.ToUpperInvariant();
        item.HsnCode = dto.HsnCode;
        item.ItemType = dto.ItemType;
        item.Brand = dto.Brand;
        item.Category = dto.Category;
        item.CgstPer = dto.CgstPer;
        item.SgstPer = dto.SgstPer;
        item.IgstPer = dto.IgstPer;
        item.Status = dto.Status;
        item.LmodBy = user;
        item.LmodDt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return (await GetItemByCodeAsync(itemCode, compCode))!;
    }

    public async Task<bool> DeleteItemAsync(string itemCode, string compCode = "01", string user = "SYSTEM")
    {
        var hasTransactions = await _db.InvoiceDetails.AnyAsync(d => d.CompCode == compCode && d.ItemCode == itemCode) ||
                              await _db.ReceiptDetails.AnyAsync(d => d.CompCode == compCode && d.ItemCode == itemCode);

        var item = await _db.ItemMasters
            .FirstOrDefaultAsync(i => i.CompCode == compCode && i.ItemCode == itemCode);

        if (item == null) return false;

        if (hasTransactions)
        {
            // Soft deactivate
            item.Status = "I";
            item.LmodBy = user;
            item.LmodDt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        _db.ItemMasters.Remove(item);
        await _db.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Rates
    public async Task<List<ItemRateDto>> GetRatesByItemAsync(string itemCode, string compCode = "01")
    {
        var rates = await _db.ItemRates
            .Where(r => r.CompCode == compCode && r.ItemCode == itemCode)
            .OrderByDescending(r => r.EffectiveDt)
            .ToListAsync();

        var item = await _db.ItemMasters
            .FirstOrDefaultAsync(i => i.CompCode == compCode && i.ItemCode == itemCode);

        return rates.Select(r => new ItemRateDto
        {
            CompCode = r.CompCode,
            RateSr = r.RateSr,
            RateNo = r.RateNo,
            ItemCode = r.ItemCode,
            ItemName = item?.ItemName ?? r.ItemCode,
            RateDt = r.RateDt,
            Rate = r.Rate,
            EffectiveDt = r.EffectiveDt,
            ExpiryDate = r.ExpiryDate,
            Status = r.Status
        }).ToList();
    }

    public async Task<ItemRateDto> CreateRateAsync(CreateItemRateDto dto, string user = "SYSTEM")
    {
        var compCode = string.IsNullOrWhiteSpace(dto.CompCode) ? "01" : dto.CompCode;
        var rateSr = string.IsNullOrWhiteSpace(dto.RateSr) ? "IR" : dto.RateSr;

        var item = await _db.ItemMasters
            .FirstOrDefaultAsync(i => i.CompCode == compCode && i.ItemCode == dto.ItemCode);

        if (item == null)
            throw new KeyNotFoundException($"Item '{dto.ItemCode}' not found.");

        var maxRateNo = await _db.ItemRates
            .Where(r => r.CompCode == compCode && r.RateSr == rateSr)
            .Select(r => (long?)r.RateNo)
            .MaxAsync() ?? 0;

        var rate = new SaleItemRate
        {
            CompCode = compCode,
            RateSr = rateSr,
            RateNo = maxRateNo + 1,
            ItemCode = dto.ItemCode,
            RateDt = DateTime.UtcNow,
            Rate = dto.Rate,
            EffectiveDt = dto.EffectiveDt ?? DateTime.UtcNow,
            ExpiryDate = dto.ExpiryDate,
            Status = "A",
            EntdBy = user,
            EntdDt = DateTime.UtcNow
        };

        _db.ItemRates.Add(rate);
        await _db.SaveChangesAsync();

        return new ItemRateDto
        {
            CompCode = rate.CompCode,
            RateSr = rate.RateSr,
            RateNo = rate.RateNo,
            ItemCode = rate.ItemCode,
            ItemName = item.ItemName,
            RateDt = rate.RateDt,
            Rate = rate.Rate,
            EffectiveDt = rate.EffectiveDt,
            ExpiryDate = rate.ExpiryDate,
            Status = rate.Status
        };
    }
    #endregion

    #region Parties
    public async Task<List<PartyMasterDto>> GetPartiesAsync(string? type = null, string compCode = "01")
    {
        var query = _db.PartyMasters.Where(p => p.CompCode == compCode);

        if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(p => p.PartyType == type || p.PartyType == "Both");
        }

        var parties = await query.OrderBy(p => p.SlName).ToListAsync();

        return parties.Select(p => new PartyMasterDto
        {
            CompCode = p.CompCode,
            SlCode = p.SlCode,
            SlName = p.SlName,
            PartyType = p.PartyType,
            Address1 = p.Address1,
            City = p.City,
            State = p.State,
            Pincode = p.Pincode,
            Gstin = p.Gstin,
            PanNo = p.PanNo,
            Email = p.Email,
            Phone = p.Phone,
            CreditLimit = p.CreditLimit,
            Status = p.Status
        }).ToList();
    }

    public async Task<PartyMasterDto> CreatePartyAsync(CreatePartyMasterDto dto, string user = "SYSTEM")
    {
        var compCode = string.IsNullOrWhiteSpace(dto.CompCode) ? "01" : dto.CompCode;

        string slCode = dto.SlCode?.Trim().ToUpperInvariant() ?? "";
        if (string.IsNullOrWhiteSpace(slCode))
        {
            var maxSl = await _db.PartyMasters
                .Where(p => p.CompCode == compCode)
                .CountAsync();
            slCode = $"PT{(maxSl + 1):D4}";
        }

        var existing = await _db.PartyMasters.AnyAsync(p => p.CompCode == compCode && p.SlCode == slCode);
        if (existing)
            throw new InvalidOperationException($"Party code '{slCode}' already exists.");

        var party = new SalePartyMaster
        {
            CompCode = compCode,
            SlCode = slCode,
            SlName = dto.SlName.Trim(),
            PartyType = dto.PartyType,
            Address1 = dto.Address1,
            City = dto.City,
            State = dto.State,
            Pincode = dto.Pincode,
            Gstin = dto.Gstin,
            PanNo = dto.PanNo,
            Email = dto.Email,
            Phone = dto.Phone,
            CreditLimit = dto.CreditLimit,
            Status = "A",
            EntdBy = user,
            EntdDt = DateTime.UtcNow
        };

        _db.PartyMasters.Add(party);
        await _db.SaveChangesAsync();

        return new PartyMasterDto
        {
            CompCode = party.CompCode,
            SlCode = party.SlCode,
            SlName = party.SlName,
            PartyType = party.PartyType,
            Address1 = party.Address1,
            City = party.City,
            State = party.State,
            Pincode = party.Pincode,
            Gstin = party.Gstin,
            PanNo = party.PanNo,
            Email = party.Email,
            Phone = party.Phone,
            CreditLimit = party.CreditLimit,
            Status = party.Status
        };
    }

    public async Task<PartyMasterDto> UpdatePartyAsync(string slCode, CreatePartyMasterDto dto, string compCode = "01", string user = "SYSTEM")
    {
        var party = await _db.PartyMasters
            .FirstOrDefaultAsync(p => p.CompCode == compCode && p.SlCode == slCode);

        if (party == null)
            throw new KeyNotFoundException($"Party '{slCode}' not found.");

        party.SlName = dto.SlName.Trim();
        party.PartyType = dto.PartyType;
        party.Address1 = dto.Address1;
        party.City = dto.City;
        party.State = dto.State;
        party.Pincode = dto.Pincode;
        party.Gstin = dto.Gstin;
        party.PanNo = dto.PanNo;
        party.Email = dto.Email;
        party.Phone = dto.Phone;
        party.CreditLimit = dto.CreditLimit;
        party.LmodBy = user;
        party.LmodDt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return new PartyMasterDto
        {
            CompCode = party.CompCode,
            SlCode = party.SlCode,
            SlName = party.SlName,
            PartyType = party.PartyType,
            Address1 = party.Address1,
            City = party.City,
            State = party.State,
            Pincode = party.Pincode,
            Gstin = party.Gstin,
            PanNo = party.PanNo,
            Email = party.Email,
            Phone = party.Phone,
            CreditLimit = party.CreditLimit,
            Status = party.Status
        };
    }

    public async Task<bool> DeletePartyAsync(string slCode, string compCode = "01", string user = "SYSTEM")
    {
        var hasInvoices = await _db.InvoiceHeaders.AnyAsync(i => i.CompCode == compCode && i.SlCode == slCode);
        var hasReceipts = await _db.ReceiptHeaders.AnyAsync(r => r.CompCode == compCode && r.SlCode == slCode);

        var party = await _db.PartyMasters
            .FirstOrDefaultAsync(p => p.CompCode == compCode && p.SlCode == slCode);

        if (party == null) return false;

        if (hasInvoices || hasReceipts)
        {
            party.Status = "I";
            party.LmodBy = user;
            party.LmodDt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        _db.PartyMasters.Remove(party);
        await _db.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Banks
    public async Task<List<BankMasterDto>> GetBanksAsync(string compCode = "01")
    {
        var banks = await _db.BankMasters
            .Where(b => b.CompCode == compCode)
            .OrderBy(b => b.BankName)
            .ToListAsync();

        return banks.Select(b => new BankMasterDto
        {
            CompCode = b.CompCode,
            BankCode = b.BankCode,
            BankName = b.BankName,
            Branch = b.Branch,
            AccountNo = b.AccountNo,
            IfscCode = b.IfscCode,
            SwiftCode = b.SwiftCode,
            Status = b.Status
        }).ToList();
    }

    public async Task<BankMasterDto> CreateBankAsync(CreateBankMasterDto dto, string user = "SYSTEM")
    {
        var compCode = string.IsNullOrWhiteSpace(dto.CompCode) ? "01" : dto.CompCode;
        var bankCode = dto.BankCode.Trim().ToUpperInvariant();

        var bank = new SaleBankMaster
        {
            CompCode = compCode,
            BankCode = bankCode,
            BankName = dto.BankName.Trim(),
            Branch = dto.Branch,
            AccountNo = dto.AccountNo,
            IfscCode = dto.IfscCode,
            SwiftCode = dto.SwiftCode,
            Status = "A",
            EntdBy = user,
            EntdDt = DateTime.UtcNow
        };

        _db.BankMasters.Add(bank);
        await _db.SaveChangesAsync();

        return new BankMasterDto
        {
            CompCode = bank.CompCode,
            BankCode = bank.BankCode,
            BankName = bank.BankName,
            Branch = bank.Branch,
            AccountNo = bank.AccountNo,
            IfscCode = bank.IfscCode,
            SwiftCode = bank.SwiftCode,
            Status = bank.Status
        };
    }
    #endregion

    #region Delivery Locations
    public async Task<List<DeliveryLocationDto>> GetDeliveryLocationsAsync(string compCode = "01")
    {
        var locs = await _db.DeliveryLocations
            .Where(l => l.CompCode == compCode)
            .OrderBy(l => l.DelyName)
            .ToListAsync();

        return locs.Select(l => new DeliveryLocationDto
        {
            CompCode = l.CompCode,
            DelyCd = l.DelyCd,
            DelyName = l.DelyName,
            Address1 = l.Address1,
            Address2 = l.Address2,
            City = l.City,
            State = l.State,
            Pincode = l.Pincode,
            Gstin = l.Gstin,
            Status = l.Status
        }).ToList();
    }

    public async Task<DeliveryLocationDto> CreateDeliveryLocationAsync(CreateDeliveryLocationDto dto, string user = "SYSTEM")
    {
        var compCode = string.IsNullOrWhiteSpace(dto.CompCode) ? "01" : dto.CompCode;
        var delyCd = dto.DelyCd.Trim().ToUpperInvariant();

        var loc = new DeliveryLocation
        {
            CompCode = compCode,
            DelyCd = delyCd,
            DelyName = dto.DelyName.Trim(),
            Address1 = dto.Address1,
            Address2 = dto.Address2,
            City = dto.City,
            State = dto.State,
            Pincode = dto.Pincode,
            Gstin = dto.Gstin,
            Status = "A",
            EntdBy = user,
            EntdDt = DateTime.UtcNow
        };

        _db.DeliveryLocations.Add(loc);
        await _db.SaveChangesAsync();

        return new DeliveryLocationDto
        {
            CompCode = loc.CompCode,
            DelyCd = loc.DelyCd,
            DelyName = loc.DelyName,
            Address1 = loc.Address1,
            Address2 = loc.Address2,
            City = loc.City,
            State = loc.State,
            Pincode = loc.Pincode,
            Gstin = loc.Gstin,
            Status = loc.Status
        };
    }
    #endregion
}
