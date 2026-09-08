using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ErpBackend.Models;

[Table("sale_rechdr")]
public class SaleReceiptHeader
{
    [Column("compcode")]
    [MaxLength(10)]
    public string CompCode { get; set; } = "01";

    [Column("recyr")]
    public int RecYr { get; set; }

    [Column("recsr")]
    [MaxLength(10)]
    public string RecSr { get; set; } = "GR";

    [Column("recno")]
    public long RecNo { get; set; }

    [Column("recdt")]
    public DateTime RecDt { get; set; } = DateTime.UtcNow;

    [Column("slcode")]
    [MaxLength(10)]
    public string SlCode { get; set; } = string.Empty;

    [Column("suppinvno")]
    [MaxLength(50)]
    public string? SuppInvNo { get; set; }

    [Column("suppinvdt")]
    public DateTime? SuppInvDt { get; set; }

    [Column("storeloc")]
    [MaxLength(20)]
    public string StoreLoc { get; set; } = "MAIN";

    [Column("totqty", TypeName = "decimal(14,3)")]
    public decimal TotQty { get; set; } = 0;

    [Column("totval", TypeName = "decimal(18,2)")]
    public decimal TotVal { get; set; } = 0;

    [Column("remarks")]
    [MaxLength(250)]
    public string? Remarks { get; set; }

    [Column("status")]
    [MaxLength(1)]
    public string Status { get; set; } = "A"; // A=Approved, C=Cancelled

    [Column("entdby")]
    [MaxLength(50)]
    public string EntdBy { get; set; } = "SYSTEM";

    [Column("entddt")]
    public DateTime EntdDt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<SaleReceiptDetail> Details { get; set; } = new List<SaleReceiptDetail>();
}
