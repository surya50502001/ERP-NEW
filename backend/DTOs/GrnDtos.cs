namespace ErpBackend.DTOs;

public class CreateGrnItemDto
{
    public string ItemCode { get; set; } = string.Empty;
    public decimal RecQty { get; set; }
    public decimal RecRate { get; set; }
    public string? BatchNo { get; set; }
}

public class CreateGrnDto
{
    public string? CompCode { get; set; } = "01";
    public string SlCode { get; set; } = string.Empty;
    public string? SuppInvNo { get; set; }
    public DateTime? SuppInvDt { get; set; }
    public string? StoreLoc { get; set; } = "MAIN";
    public string? Remarks { get; set; }
    public List<CreateGrnItemDto> Items { get; set; } = new();
}

public class GrnDetailDto
{
    public string CompCode { get; set; } = "01";
    public int RecYr { get; set; }
    public string RecSr { get; set; } = "GR";
    public long RecNo { get; set; }
    public int RecSlNo { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Uom { get; set; } = "NOS";
    public decimal RecQty { get; set; }
    public decimal RecRate { get; set; }
    public decimal TotAmt { get; set; }
    public string? BatchNo { get; set; }
}

public class GrnResponseDto
{
    public string CompCode { get; set; } = "01";
    public int RecYr { get; set; }
    public string RecSr { get; set; } = "GR";
    public long RecNo { get; set; }
    public string FormattedGrnNo => $"{RecSr}-{RecYr}-{RecNo:D6}";
    public DateTime RecDt { get; set; }
    public string SlCode { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string? SuppInvNo { get; set; }
    public DateTime? SuppInvDt { get; set; }
    public string StoreLoc { get; set; } = "MAIN";
    public decimal TotQty { get; set; }
    public decimal TotVal { get; set; }
    public string? Remarks { get; set; }
    public string Status { get; set; } = "A";
    public string StatusText => Status == "A" ? "Received" : "Cancelled";
    public string EntdBy { get; set; } = "SYSTEM";
    public DateTime EntdDt { get; set; }
    public List<GrnDetailDto> Details { get; set; } = new();
}
