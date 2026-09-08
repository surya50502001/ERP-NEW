using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ErpBackend.Models;

[Table("sales_ledger")]
public class SalesLedger
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("ledgerid")]
    public long LedgerId { get; set; }

    [Column("compcode")]
    [MaxLength(10)]
    public string CompCode { get; set; } = "01";

    [Column("docid")]
    [MaxLength(10)]
    public string DocId { get; set; } = string.Empty; // INV, GRN, ADJ

    [Column("docsr")]
    [MaxLength(10)]
    public string DocSr { get; set; } = string.Empty;

    [Column("docno")]
    public long DocNo { get; set; }

    [Column("docdt")]
    public DateTime DocDt { get; set; } = DateTime.UtcNow;

    [Column("itemcode")]
    [MaxLength(20)]
    public string ItemCode { get; set; } = string.Empty;

    [Column("storeloc")]
    [MaxLength(20)]
    public string StoreLoc { get; set; } = "MAIN";

    [Column("inqty", TypeName = "decimal(14,3)")]
    public decimal InQty { get; set; } = 0;

    [Column("outqty", TypeName = "decimal(14,3)")]
    public decimal OutQty { get; set; } = 0;

    [Column("balanceqty", TypeName = "decimal(14,3)")]
    public decimal BalanceQty { get; set; } = 0;

    [Column("rate", TypeName = "decimal(14,4)")]
    public decimal Rate { get; set; } = 0;

    [Column("remarks")]
    [MaxLength(250)]
    public string? Remarks { get; set; }

    [Column("entddt")]
    public DateTime EntdDt { get; set; } = DateTime.UtcNow;
}
