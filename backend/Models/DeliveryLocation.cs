using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ErpBackend.Models;

[Table("sy_delyloc")]
public class DeliveryLocation
{
    [Column("compcode")]
    [MaxLength(10)]
    public string CompCode { get; set; } = "01";

    [Column("delycd")]
    [MaxLength(10)]
    public string DelyCd { get; set; } = string.Empty;

    [Column("delyname")]
    [MaxLength(100)]
    public string DelyName { get; set; } = string.Empty;

    [Column("address1")]
    [MaxLength(200)]
    public string Address1 { get; set; } = string.Empty;

    [Column("address2")]
    [MaxLength(200)]
    public string? Address2 { get; set; }

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
