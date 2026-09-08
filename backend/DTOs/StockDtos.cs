namespace ErpBackend.DTOs;

public class StockResponseDto
{
    public string CompCode { get; set; } = "01";
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string? ItemType { get; set; }
    public string? Category { get; set; }
    public string StoreLoc { get; set; } = "MAIN";
    public decimal StockQty { get; set; }
    public string Uom { get; set; } = "NOS";
    public decimal AvgCost { get; set; }
    public decimal TotalValue => StockQty * AvgCost;
    public DateTime LastUpdated { get; set; }
}

public class LedgerResponseDto
{
    public long LedgerId { get; set; }
    public string CompCode { get; set; } = "01";
    public string DocId { get; set; } = string.Empty; // INV, GRN, ADJ
    public string DocSr { get; set; } = string.Empty;
    public long DocNo { get; set; }
    public string FormattedDocNo => $"{DocId}:{DocSr}-{DocNo}";
    public DateTime DocDt { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string StoreLoc { get; set; } = "MAIN";
    public decimal InQty { get; set; }
    public decimal OutQty { get; set; }
    public decimal BalanceQty { get; set; }
    public decimal Rate { get; set; }
    public string? Remarks { get; set; }
    public DateTime EntdDt { get; set; }
}

public class StockAdjustmentDto
{
    public string? CompCode { get; set; } = "01";
    public string ItemCode { get; set; } = string.Empty;
    public string? StoreLoc { get; set; } = "MAIN";
    public decimal AdjustedQty { get; set; }
    public string Reason { get; set; } = string.Empty;
}
