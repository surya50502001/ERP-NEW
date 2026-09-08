using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ErpBackend.Models;

[Table("sales_stock")]
public class SalesStock
{
    [Column("compcode")]
    [MaxLength(10)]
    public string CompCode { get; set; } = "01";

    [Column("itemcode")]
    [MaxLength(20)]
    public string ItemCode { get; set; } = string.Empty;

    [Column("storeloc")]
    [MaxLength(20)]
    public string StoreLoc { get; set; } = "MAIN";

    [Column("stockqty", TypeName = "decimal(14,3)")]
    public decimal StockQty { get; set; } = 0;

    [Column("uom")]
    [MaxLength(10)]
    public string Uom { get; set; } = "NOS";

    [Column("avgcost", TypeName = "decimal(14,4)")]
    public decimal AvgCost { get; set; } = 0;

    [Column("lastupdated")]
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}
