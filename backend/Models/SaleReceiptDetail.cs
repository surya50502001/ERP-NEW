using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ErpBackend.Models;

[Table("sale_recdtl")]
public class SaleReceiptDetail
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

    [Column("recslno")]
    public int RecSlNo { get; set; }

    [Column("itemcode")]
    [MaxLength(20)]
    public string ItemCode { get; set; } = string.Empty;

    [Column("uom")]
    [MaxLength(10)]
    public string Uom { get; set; } = "NOS";

    [Column("recqty", TypeName = "decimal(14,3)")]
    public decimal RecQty { get; set; }

    [Column("recrate", TypeName = "decimal(14,4)")]
    public decimal RecRate { get; set; }

    [Column("totamt", TypeName = "decimal(18,2)")]
    public decimal TotAmt { get; set; }

    [Column("batchno")]
    [MaxLength(50)]
    public string? BatchNo { get; set; }

    [ForeignKey("CompCode,RecYr,RecSr,RecNo")]
    public virtual SaleReceiptHeader? Header { get; set; }
}
