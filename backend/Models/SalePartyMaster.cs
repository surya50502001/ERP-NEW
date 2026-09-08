using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ErpBackend.Models;

[Table("sale_partymst")]
public class SalePartyMaster
{
    [Column("compcode")]
    [MaxLength(10)]
    public string CompCode { get; set; } = "01";

    [Column("slcode")]
    [MaxLength(10)]
    public string SlCode { get; set; } = string.Empty;

    [Column("slname")]
    [MaxLength(150)]
    public string SlName { get; set; } = string.Empty;

    [Column("partytype")]
    [MaxLength(20)]
    public string PartyType { get; set; } = "Customer"; // Customer, Supplier, Both

    [Column("address1")]
    [MaxLength(200)]
    public string Address1 { get; set; } = string.Empty;

    [Column("city")]
    [MaxLength(50)]
    public string City { get; set; } = string.Empty;

    [Column("state")]
    [MaxLength(50)]
    public string State { get; set; } = string.Empty;

    [Column("pincode")]
    [MaxLength(10)]
    public string Pincode { get; set; } = string.Empty;

    [Column("gstin")]
    [MaxLength(20)]
    public string? Gstin { get; set; }

    [Column("panno")]
    [MaxLength(20)]
    public string? PanNo { get; set; }

    [Column("email")]
    [MaxLength(100)]
    public string? Email { get; set; }

    [Column("phone")]
    [MaxLength(30)]
    public string? Phone { get; set; }

    [Column("creditlimit", TypeName = "decimal(18,2)")]
    public decimal CreditLimit { get; set; } = 0;

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
