using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ErpBackend.Models;

[Table("sale_invhdr")]
public class SaleInvoiceHeader
{
    [Column("compcode")]
    [MaxLength(10)]
    public string CompCode { get; set; } = "01";

    [Column("invyr")]
    public int InvYr { get; set; }

    [Column("invsr")]
    [MaxLength(10)]
    public string InvSr { get; set; } = "SI";

    [Column("invno")]
    public long InvNo { get; set; }

    [Column("invdt")]
    public DateTime InvDt { get; set; } = DateTime.UtcNow;

    [Column("invtype")]
    [MaxLength(20)]
    public string InvType { get; set; } = "TAX INVOICE";

    [Column("slcode")]
    [MaxLength(10)]
    public string SlCode { get; set; } = string.Empty;

    [Column("despatchto")]
    [MaxLength(150)]
    public string? DespatchTo { get; set; }

    [Column("storeloc")]
    [MaxLength(20)]
    public string StoreLoc { get; set; } = "MAIN";

    [Column("prodval", TypeName = "decimal(18,2)")]
    public decimal ProdVal { get; set; } = 0;

    [Column("cgstval", TypeName = "decimal(18,2)")]
    public decimal CgstVal { get; set; } = 0;

    [Column("sgstval", TypeName = "decimal(18,2)")]
    public decimal SgstVal { get; set; } = 0;

    [Column("igstval", TypeName = "decimal(18,2)")]
    public decimal IgstVal { get; set; } = 0;

    [Column("othval", TypeName = "decimal(18,2)")]
    public decimal OthVal { get; set; } = 0;

    [Column("roffval", TypeName = "decimal(18,2)")]
    public decimal RoffVal { get; set; } = 0;

    [Column("invval", TypeName = "decimal(18,2)")]
    public decimal InvVal { get; set; } = 0;

    [Column("vehicleno")]
    [MaxLength(30)]
    public string? VehicleNo { get; set; }

    [Column("despmode")]
    [MaxLength(30)]
    public string? DespMode { get; set; }

    [Column("buyerpono")]
    [MaxLength(50)]
    public string? BuyerPoNo { get; set; }

    [Column("buyerpodt")]
    public DateTime? BuyerPoDt { get; set; }

    [Column("freightval", TypeName = "decimal(18,2)")]
    public decimal FreightVal { get; set; } = 0;

    [Column("delycd")]
    [MaxLength(10)]
    public string? DelyCd { get; set; }

    [Column("remarks")]
    [MaxLength(250)]
    public string? Remarks { get; set; }

    [Column("bankcode")]
    [MaxLength(10)]
    public string? BankCode { get; set; }

    [Column("status")]
    [MaxLength(1)]
    public string Status { get; set; } = "P"; // P=Pending, A=Approved, C=Cancelled

    [Column("entdby")]
    [MaxLength(50)]
    public string EntdBy { get; set; } = "SYSTEM";

    [Column("entddt")]
    public DateTime EntdDt { get; set; } = DateTime.UtcNow;

    [Column("authby")]
    [MaxLength(50)]
    public string? AuthBy { get; set; }

    [Column("authdt")]
    public DateTime? AuthDt { get; set; }

    [Column("canby")]
    [MaxLength(50)]
    public string? CanBy { get; set; }

    [Column("candt")]
    public DateTime? CanDt { get; set; }

    [Column("canreason")]
    [MaxLength(250)]
    public string? CanReason { get; set; }

    public virtual ICollection<SaleInvoiceDetail> Details { get; set; } = new List<SaleInvoiceDetail>();
}
