namespace ErpBackend.Models;

public class Country
{
    public int Id { get; set; }
    public string CountryId { get; set; } = string.Empty; // e.g., CTRY0001
    public string Code { get; set; } = string.Empty;      // e.g., IND, USA, ARE
    public string Name { get; set; } = string.Empty;      // e.g., India
    public string CurrencyCode { get; set; } = "INR";     // e.g., INR, USD, AED
    public string PhoneCode { get; set; } = "+91";        // e.g., +91, +1, +971
    public string Status { get; set; } = "Active";
}
