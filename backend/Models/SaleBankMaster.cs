using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ErpBackend.Models;

[Table("sale_bankmst")]
public class SaleBankMaster
{
    [Column("compcode")]
    [MaxLength(10)]
    public string CompCode { get; set; } = "01";

    [Column("bankcode")]
    [MaxLength(10)]
    public string BankCode { get; set; } = string.Empty;

    [Column("bankname")]
    [MaxLength(100)]
    public string BankName { get; set; } = string.Empty;

    [Column("branch")]
    [MaxLength(100)]
    public string Branch { get; set; } = string.Empty;

    [Column("accountno")]
    [MaxLength(50)]
    public string AccountNo { get; set; } = string.Empty;

    [Column("ifsccode")]
    [MaxLength(20)]
    public string IfscCode { get; set; } = string.Empty;

    [Column("swiftcode")]
    [MaxLength(20)]
    public string? SwiftCode { get; set; }

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
