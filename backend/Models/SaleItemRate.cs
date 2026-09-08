using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ErpBackend.Models;

[Table("sale_itemrate")]
public class SaleItemRate
{
    [Column("compcode")]
    [MaxLength(10)]
    public string CompCode { get; set; } = "01";

    [Column("ratesr")]
    [MaxLength(10)]
    public string RateSr { get; set; } = "IR";

    [Column("rateno")]
    public long RateNo { get; set; }

    [Column("itemcode")]
    [MaxLength(20)]
    public string ItemCode { get; set; } = string.Empty;

    [Column("ratedt")]
    public DateTime RateDt { get; set; } = DateTime.UtcNow;

    [Column("rate", TypeName = "decimal(14,4)")]
    public decimal Rate { get; set; }

    [Column("effectivedt")]
    public DateTime EffectiveDt { get; set; } = DateTime.UtcNow;

    [Column("expirydate")]
    public DateTime? ExpiryDate { get; set; }

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
