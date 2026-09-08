using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ErpBackend.Models;

[Table("sale_itemmst")]
public class SaleItemMaster
{
    [Column("compcode")]
    [MaxLength(10)]
    public string CompCode { get; set; } = "01";

    [Key]
    [Column("itemcode")]
    [MaxLength(20)]
    public string ItemCode { get; set; } = string.Empty;

    [Column("itemname")]
    [MaxLength(150)]
    public string ItemName { get; set; } = string.Empty;

    [Column("itemdesc")]
    [MaxLength(250)]
    public string? ItemDesc { get; set; }

    [Column("uom")]
    [MaxLength(10)]
    public string Uom { get; set; } = "NOS";

    [Column("hsncode")]
    [MaxLength(20)]
    public string HsnCode { get; set; } = string.Empty;

    [Column("itemtype")]
    [MaxLength(50)]
    public string ItemType { get; set; } = "Finished Goods";

    [Column("brand")]
    [MaxLength(50)]
    public string? Brand { get; set; }

    [Column("category")]
    [MaxLength(50)]
    public string? Category { get; set; }

    [Column("cgstper", TypeName = "decimal(5,2)")]
    public decimal CgstPer { get; set; } = 0;

    [Column("sgstper", TypeName = "decimal(5,2)")]
    public decimal SgstPer { get; set; } = 0;

    [Column("igstper", TypeName = "decimal(5,2)")]
    public decimal IgstPer { get; set; } = 0;

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
