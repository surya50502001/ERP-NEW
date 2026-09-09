using Microsoft.EntityFrameworkCore;
using ErpBackend.Models;

namespace ErpBackend.Data;

public class ErpDbContext : DbContext
{
    public ErpDbContext(DbContextOptions<ErpDbContext> options) : base(options) { }

    // Enterprise ERP Models
    public DbSet<SaleItemMaster> ItemMasters => Set<SaleItemMaster>();
    public DbSet<SaleItemRate> ItemRates => Set<SaleItemRate>();
    public DbSet<SaleSeries> Series => Set<SaleSeries>();
    public DbSet<SaleBankMaster> BankMasters => Set<SaleBankMaster>();
    public DbSet<DeliveryLocation> DeliveryLocations => Set<DeliveryLocation>();
    public DbSet<SalePartyMaster> PartyMasters => Set<SalePartyMaster>();
    public DbSet<SaleInvoiceHeader> InvoiceHeaders => Set<SaleInvoiceHeader>();
    public DbSet<SaleInvoiceDetail> InvoiceDetails => Set<SaleInvoiceDetail>();
    public DbSet<SaleReceiptHeader> ReceiptHeaders => Set<SaleReceiptHeader>();
    public DbSet<SaleReceiptDetail> ReceiptDetails => Set<SaleReceiptDetail>();
    public DbSet<SalesStock> Stocks => Set<SalesStock>();
    public DbSet<SalesLedger> Ledgers => Set<SalesLedger>();
    public DbSet<SystemUser> Users => Set<SystemUser>();
    public DbSet<SystemAuditLog> AuditLogs => Set<SystemAuditLog>();

    // Standard Client-Facing DbSets
    public DbSet<Party> Parties => Set<Party>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ItemType> ItemTypes => Set<ItemType>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<MajorCategory> MajorCategories => Set<MajorCategory>();
    public DbSet<SubCategory> SubCategories => Set<SubCategory>();
    public DbSet<SubSubCategory> SubSubCategories => Set<SubSubCategory>();
    public DbSet<Uom> Uoms => Set<Uom>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<SalesInvoice> SalesInvoices => Set<SalesInvoice>();
    public DbSet<Batch> Batches => Set<Batch>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<RecentActivity> RecentActivities => Set<RecentActivity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. SaleItemMaster Composite Key
        modelBuilder.Entity<SaleItemMaster>()
            .HasKey(x => new { x.CompCode, x.ItemCode });

        // 2. SaleItemRate Composite Key
        modelBuilder.Entity<SaleItemRate>()
            .HasKey(x => new { x.CompCode, x.RateSr, x.RateNo });

        // 3. SaleSeries Composite Key
        modelBuilder.Entity<SaleSeries>()
            .HasKey(x => new { x.CompCode, x.AcYr, x.DocId, x.DocSr });

        // 4. SaleBankMaster Composite Key
        modelBuilder.Entity<SaleBankMaster>()
            .HasKey(x => new { x.CompCode, x.BankCode });

        // 5. DeliveryLocation Composite Key
        modelBuilder.Entity<DeliveryLocation>()
            .HasKey(x => new { x.CompCode, x.DelyCd });

        // 6. SalePartyMaster Composite Key
        modelBuilder.Entity<SalePartyMaster>()
            .HasKey(x => new { x.CompCode, x.SlCode });

        // 7. SalesStock Composite Key
        modelBuilder.Entity<SalesStock>()
            .HasKey(x => new { x.CompCode, x.ItemCode, x.StoreLoc });

        // 8. SaleInvoiceHeader Composite Key
        modelBuilder.Entity<SaleInvoiceHeader>()
            .HasKey(x => new { x.CompCode, x.InvYr, x.InvSr, x.InvNo });

        // 9. SaleInvoiceDetail Composite Key & Relationship
        modelBuilder.Entity<SaleInvoiceDetail>()
            .HasKey(x => new { x.CompCode, x.InvYr, x.InvSr, x.InvNo, x.InvSlNo });

        modelBuilder.Entity<SaleInvoiceDetail>()
            .HasOne(d => d.Header)
            .WithMany(h => h.Details)
            .HasForeignKey(d => new { d.CompCode, d.InvYr, d.InvSr, d.InvNo })
            .OnDelete(DeleteBehavior.Cascade);

        // 10. SaleReceiptHeader Composite Key
        modelBuilder.Entity<SaleReceiptHeader>()
            .HasKey(x => new { x.CompCode, x.RecYr, x.RecSr, x.RecNo });

        // 11. SaleReceiptDetail Composite Key & Relationship
        modelBuilder.Entity<SaleReceiptDetail>()
            .HasKey(x => new { x.CompCode, x.RecYr, x.RecSr, x.RecNo, x.RecSlNo });

        modelBuilder.Entity<SaleReceiptDetail>()
            .HasOne(d => d.Header)
            .WithMany(h => h.Details)
            .HasForeignKey(d => new { d.CompCode, d.RecYr, d.RecSr, d.RecNo })
            .OnDelete(DeleteBehavior.Cascade);

        // Decimal precision mappings
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(decimal) || property.ClrType == typeof(decimal?))
                {
                    if (string.IsNullOrEmpty(property.GetColumnType()))
                    {
                        property.SetColumnType("decimal(18, 2)");
                    }
                }
            }
        }
    }
}
