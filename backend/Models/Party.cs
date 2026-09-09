namespace ErpBackend.Models;

public class Party
{
    public int Id { get; set; }
    public string PartyId { get; set; } = string.Empty; // e.g., PTY-101
    public string Name { get; set; } = string.Empty;
    public string PartyType { get; set; } = "Customer"; // Customer, Supplier, Both
    public string Status { get; set; } = "Active";
    public string? ContactNumber { get; set; }
    public string? Email { get; set; }
    
    // 4-Column Address Structure
    public string Addr1 { get; set; } = string.Empty; // Door No / Building / Floor
    public string Addr2 { get; set; } = string.Empty; // Street / Road / Area
    public string Addr3 { get; set; } = string.Empty; // Landmark / Locality
    public string Addr4 { get; set; } = string.Empty; // Taluk / District / Region
    
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = "Tamil Nadu";
    public string Country { get; set; } = "India";
    public string Pincode { get; set; } = string.Empty;
    
    public string? Gstin { get; set; }
    public string? Pan { get; set; }
}
