using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ErpBackend.Models;

[Table("sy_users")]
public class SystemUser
{
    [Key]
    [Column("userid")]
    [MaxLength(50)]
    public string UserId { get; set; } = string.Empty;

    [Column("fullname")]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Column("email")]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Column("passwordhash")]
    [MaxLength(250)]
    public string PasswordHash { get; set; } = string.Empty;

    [Column("companyname")]
    [MaxLength(150)]
    public string CompanyName { get; set; } = "Prime ERP Enterprise";

    [Column("role")]
    [MaxLength(50)]
    public string Role { get; set; } = "Admin";

    [Column("status")]
    [MaxLength(1)]
    public string Status { get; set; } = "A";

    [Column("createddt")]
    public DateTime CreatedDt { get; set; } = DateTime.UtcNow;
}
