using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ErpBackend.Models;

[Table("sale_invdtl")]
public class SaleInvoiceDetail
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

    [Column("invslno")]
    public int InvSlNo { get; set; }

    [Column("itemcode")]
    [MaxLength(20)]
    public string ItemCode { get; set; } = string.Empty;

    [Column("itemdesc")]
    [MaxLength(250)]
    public string? ItemDesc { get; set; }

    [Column("hsncode")]
    [MaxLength(20)]
    public string HsnCode { get; set; } = string.Empty;

    [Column("uom")]
    [MaxLength(10)]
    public string Uom { get; set; } = "NOS";

    [Column("invqty", TypeName = "decimal(14,3)")]
    public decimal InvQty { get; set; }

    [Column("invrate", TypeName = "decimal(14,4)")]
    public decimal InvRate { get; set; }

    [Column("taxableamt", TypeName = "decimal(18,2)")]
    public decimal TaxableAmt { get; set; }

    [Column("cgstper", TypeName = "decimal(5,2)")]
    public decimal CgstPer { get; set; } = 0;

    [Column("sgstper", TypeName = "decimal(5,2)")]
    public decimal SgstPer { get; set; } = 0;

    [Column("igstper", TypeName = "decimal(5,2)")]
    public decimal IgstPer { get; set; } = 0;

    [Column("cgstval", TypeName = "decimal(18,2)")]
    public decimal CgstVal { get; set; } = 0;

    [Column("sgstval", TypeName = "decimal(18,2)")]
    public decimal SgstVal { get; set; } = 0;

    [Column("igstval", TypeName = "decimal(18,2)")]
    public decimal IgstVal { get; set; } = 0;

    [Column("totval", TypeName = "decimal(18,2)")]
    public decimal TotVal { get; set; }

    [ForeignKey("CompCode,InvYr,InvSr,InvNo")]
    public virtual SaleInvoiceHeader? Header { get; set; }
}
