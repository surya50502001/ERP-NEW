using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ErpBackend.Models;

[Table("sale_series")]
public class SaleSeries
{
    [Column("compcode")]
    [MaxLength(10)]
    public string CompCode { get; set; } = "01";

    [Column("acyr")]
    public int AcYr { get; set; }

    [Column("docid")]
    [MaxLength(10)]
    public string DocId { get; set; } = string.Empty; // INV, GRN, etc.

    [Column("docsr")]
    [MaxLength(10)]
    public string DocSr { get; set; } = string.Empty; // SI, GR, etc.

    [Column("srdesc")]
    [MaxLength(100)]
    public string SrDesc { get; set; } = string.Empty;

    [Column("ldocno")]
    public long LDocNo { get; set; }

    [Column("inv_prefix")]
    [MaxLength(10)]
    public string? InvPrefix { get; set; }

    [Column("inv_sufix")]
    [MaxLength(10)]
    public string? InvSufix { get; set; }

    [Column("status")]
    [MaxLength(1)]
    public string Status { get; set; } = "A";

    [Column("entdby")]
    [MaxLength(50)]
    public string EntdBy { get; set; } = "SYSTEM";

    [Column("entddt")]
    public DateTime EntdDt { get; set; } = DateTime.UtcNow;

    [Column("lmodby")]
    [MaxLength(50)]
    public string? LmodBy { get; set; }

    [Column("lmoddt")]
    public DateTime? LmodDt { get; set; }
}
