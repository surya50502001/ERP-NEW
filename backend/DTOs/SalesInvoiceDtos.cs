namespace ErpBackend.DTOs;

public class CreateInvoiceItemDto
{
    public string ItemCode { get; set; } = string.Empty;
    public decimal InvQty { get; set; }
    public decimal? OverrideRate { get; set; }
}

public class CreateInvoiceDto
{
    public string? CompCode { get; set; } = "01";
    public string SlCode { get; set; } = string.Empty;
    public string? DespatchTo { get; set; }
    public string? StoreLoc { get; set; } = "MAIN";
    public string? VehicleNo { get; set; }
    public string? DespMode { get; set; }
    public string? BuyerPoNo { get; set; }
    public DateTime? BuyerPoDt { get; set; }
    public decimal FreightVal { get; set; } = 0;
    public decimal OthVal { get; set; } = 0;
    public string? DelyCd { get; set; }
    public string? Remarks { get; set; }
    public string? BankCode { get; set; }
    public List<CreateInvoiceItemDto> Items { get; set; } = new();
}

public class InvoiceDetailDto
{
    public string CompCode { get; set; } = "01";
    public int InvYr { get; set; }
    public string InvSr { get; set; } = "SI";
    public long InvNo { get; set; }
    public int InvSlNo { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string? ItemDesc { get; set; }
    public string HsnCode { get; set; } = string.Empty;
    public string Uom { get; set; } = "NOS";
    public decimal InvQty { get; set; }
    public decimal InvRate { get; set; }
    public decimal TaxableAmt { get; set; }
    public decimal CgstPer { get; set; }
    public decimal SgstPer { get; set; }
    public decimal IgstPer { get; set; }
    public decimal CgstVal { get; set; }
    public decimal SgstVal { get; set; }
    public decimal IgstVal { get; set; }
    public decimal TotVal { get; set; }
}

public class InvoiceResponseDto
{
    public string CompCode { get; set; } = "01";
    public int InvYr { get; set; }
    public string InvSr { get; set; } = "SI";
    public long InvNo { get; set; }
    public string FormattedInvoiceNo => $"{InvSr}-{InvYr}-{InvNo:D6}";
    public DateTime InvDt { get; set; }
    public string InvType { get; set; } = "TAX INVOICE";
    public string SlCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerGstin { get; set; }
    public string? DespatchTo { get; set; }
    public string StoreLoc { get; set; } = "MAIN";
    public decimal ProdVal { get; set; }
    public decimal CgstVal { get; set; }
    public decimal SgstVal { get; set; }
    public decimal IgstVal { get; set; }
    public decimal OthVal { get; set; }
    public decimal RoffVal { get; set; }
    public decimal InvVal { get; set; }
    public string? VehicleNo { get; set; }
    public string? DespMode { get; set; }
    public string? BuyerPoNo { get; set; }
    public DateTime? BuyerPoDt { get; set; }
    public decimal FreightVal { get; set; }
    public string? DelyCd { get; set; }
    public string? Remarks { get; set; }
    public string? BankCode { get; set; }
    public string Status { get; set; } = "P"; // P=Pending, A=Approved, C=Cancelled
    public string StatusText => Status switch
    {
        "P" => "Pending",
        "A" => "Approved",
        "C" => "Cancelled",
        _ => "Draft"
    };
    public string EntdBy { get; set; } = "SYSTEM";
    public DateTime EntdDt { get; set; }
    public string? AuthBy { get; set; }
    public DateTime? AuthDt { get; set; }
    public string? CanBy { get; set; }
    public DateTime? CanDt { get; set; }
    public string? CanReason { get; set; }
    public List<InvoiceDetailDto> Details { get; set; } = new();
}

public class CancelInvoiceDto
{
    public string Reason { get; set; } = string.Empty;
}
