using Microsoft.EntityFrameworkCore;
using ErpBackend.Data;
using ErpBackend.Models;

namespace ErpBackend.Services;

public interface IDocumentSeriesService
{
    Task<long> GetNextDocNoAsync(string compCode, string docId, string docSr, int acYr, string user = "SYSTEM");
}

public class DocumentSeriesService : IDocumentSeriesService
{
    private readonly ErpDbContext _db;
    private static readonly SemaphoreSlim _lock = new(1, 1);

    public DocumentSeriesService(ErpDbContext db)
    {
        _db = db;
    }

    public async Task<long> GetNextDocNoAsync(string compCode, string docId, string docSr, int acYr, string user = "SYSTEM")
    {
        await _lock.WaitAsync();
        try
        {
            var series = await _db.Series
                .FirstOrDefaultAsync(s => s.CompCode == compCode && s.DocId == docId && s.DocSr == docSr && s.AcYr == acYr);

            if (series == null)
            {
                series = new SaleSeries
                {
                    CompCode = compCode,
                    AcYr = acYr,
                    DocId = docId,
                    DocSr = docSr,
                    SrDesc = $"{docId} Series {docSr}",
                    LDocNo = 1,
                    InvPrefix = $"{docId}-",
                    Status = "A",
                    EntdBy = user,
                    EntdDt = DateTime.UtcNow
                };
                _db.Series.Add(series);
                await _db.SaveChangesAsync();
                return 1;
            }

            series.LDocNo += 1;
            series.LmodBy = user;
            series.LmodDt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return series.LDocNo;
        }
        finally
        {
            _lock.Release();
        }
    }
}
