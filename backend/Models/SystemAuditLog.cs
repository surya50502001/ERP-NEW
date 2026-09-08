using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ErpBackend.Models;

[Table("sy_auditlog")]
public class SystemAuditLog
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("auditid")]
    public long AuditId { get; set; }

    [Column("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [Column("userid")]
    [MaxLength(50)]
    public string UserId { get; set; } = string.Empty;

    [Column("action")]
    [MaxLength(50)]
    public string Action { get; set; } = string.Empty;

    [Column("entity")]
    [MaxLength(50)]
    public string Entity { get; set; } = string.Empty;

    [Column("recordid")]
    [MaxLength(100)]
    public string RecordId { get; set; } = string.Empty;

    [Column("details")]
    public string? Details { get; set; }
}
