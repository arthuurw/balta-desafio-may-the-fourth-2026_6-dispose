using Dispose.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dispose.Api.Data;

public class DisposeContext(DbContextOptions<DisposeContext> options) : DbContext(options)
{
    public DbSet<CollectionSchedule> CollectionSchedules => Set<CollectionSchedule>();
    public DbSet<CollectionPoint> CollectionPoints => Set<CollectionPoint>();
    public DbSet<Reminder> Reminders => Set<Reminder>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CollectionSchedule>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Neighborhood).IsRequired().HasMaxLength(100);
            e.Property(x => x.WasteType).IsRequired().HasMaxLength(50);
            e.Property(x => x.TimeSlot).IsRequired().HasMaxLength(50);
            e.HasIndex(x => new { x.Neighborhood, x.WasteType });
        });

        modelBuilder.Entity<CollectionPoint>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(150);
            e.Property(x => x.Address).IsRequired().HasMaxLength(250);
            e.Property(x => x.OpeningHours).IsRequired().HasMaxLength(100);
        });

        modelBuilder.Entity<Reminder>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.SessionId).IsRequired().HasMaxLength(100);
            e.Property(x => x.ItemType).IsRequired().HasMaxLength(50);
            e.Property(x => x.Status).IsRequired().HasMaxLength(20);
            e.HasOne(x => x.Point).WithMany().HasForeignKey(x => x.PointId);
            e.HasIndex(x => x.SessionId);
        });
    }
}
