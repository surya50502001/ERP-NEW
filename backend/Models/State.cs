namespace ErpBackend.Models;

public class State
{
    public int Id { get; set; }
    public string StateId { get; set; } = string.Empty;   // e.g., ST0001
    public string Code { get; set; } = string.Empty;      // e.g., TN, KA, MH, DL
    public string Name { get; set; } = string.Empty;      // e.g., Tamil Nadu
    public string CountryCode { get; set; } = "IND";      // FK reference to Country
    public string GstStateCode { get; set; } = string.Empty; // e.g., 33, 29, 27, 07
    public string Status { get; set; } = "Active";
}
