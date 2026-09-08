namespace ErpBackend.DTOs;

// Item Master DTOs
public class ItemMasterDto
{
    public string CompCode { get; set; } = "01";
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string? ItemDesc { get; set; }
    public string Uom { get; set; } = "NOS";
    public string HsnCode { get; set; } = string.Empty;
    public string ItemType { get; set; } = "Finished Goods";
    public string? Brand { get; set; }
    public string? Category { get; set; }
    public decimal CgstPer { get; set; }
    public decimal SgstPer { get; set; }
    public decimal IgstPer { get; set; }
    public string Status { get; set; } = "A";
    public decimal CurrentRate { get; set; }
    public decimal CurrentStock { get; set; }
}

public class CreateItemMasterDto
{
    public string? CompCode { get; set; } = "01";
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string? ItemDesc { get; set; }
    public string Uom { get; set; } = "NOS";
    public string HsnCode { get; set; } = string.Empty;
    public string ItemType { get; set; } = "Finished Goods";
    public string? Brand { get; set; }
    public string? Category { get; set; }
    public decimal CgstPer { get; set; }
    public decimal SgstPer { get; set; }
    public decimal IgstPer { get; set; }
    public decimal InitialRate { get; set; }
}

public class UpdateItemMasterDto
{
    public string ItemName { get; set; } = string.Empty;
    public string? ItemDesc { get; set; }
    public string Uom { get; set; } = "NOS";
    public string HsnCode { get; set; } = string.Empty;
    public string ItemType { get; set; } = "Finished Goods";
    public string? Brand { get; set; }
    public string? Category { get; set; }
    public decimal CgstPer { get; set; }
    public decimal SgstPer { get; set; }
    public decimal IgstPer { get; set; }
    public string Status { get; set; } = "A";
}

// Item Rate DTOs
public class ItemRateDto
{
    public string CompCode { get; set; } = "01";
    public string RateSr { get; set; } = "IR";
    public long RateNo { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public DateTime RateDt { get; set; }
    public decimal Rate { get; set; }
    public DateTime EffectiveDt { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string Status { get; set; } = "A";
}

public class CreateItemRateDto
{
    public string? CompCode { get; set; } = "01";
    public string? RateSr { get; set; } = "IR";
    public string ItemCode { get; set; } = string.Empty;
    public decimal Rate { get; set; }
    public DateTime? EffectiveDt { get; set; }
    public DateTime? ExpiryDate { get; set; }
}

// Party Master DTOs
public class PartyMasterDto
{
    public string CompCode { get; set; } = "01";
    public string SlCode { get; set; } = string.Empty;
    public string SlName { get; set; } = string.Empty;
    public string PartyType { get; set; } = "Customer"; // Customer, Supplier, Both
    public string Address1 { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
    public string? Gstin { get; set; }
    public string? PanNo { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public decimal CreditLimit { get; set; }
    public string Status { get; set; } = "A";
}

public class CreatePartyMasterDto
{
    public string? CompCode { get; set; } = "01";
    public string? SlCode { get; set; }
    public string SlName { get; set; } = string.Empty;
    public string PartyType { get; set; } = "Customer";
    public string Address1 { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
    public string? Gstin { get; set; }
    public string? PanNo { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public decimal CreditLimit { get; set; } = 0;
}

// Bank Master DTOs
public class BankMasterDto
{
    public string CompCode { get; set; } = "01";
    public string BankCode { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string AccountNo { get; set; } = string.Empty;
    public string IfscCode { get; set; } = string.Empty;
    public string? SwiftCode { get; set; }
    public string Status { get; set; } = "A";
}

public class CreateBankMasterDto
{
    public string? CompCode { get; set; } = "01";
    public string BankCode { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string AccountNo { get; set; } = string.Empty;
    public string IfscCode { get; set; } = string.Empty;
    public string? SwiftCode { get; set; }
}

// Delivery Location DTOs
public class DeliveryLocationDto
{
    public string CompCode { get; set; } = "01";
    public string DelyCd { get; set; } = string.Empty;
    public string DelyName { get; set; } = string.Empty;
    public string Address1 { get; set; } = string.Empty;
    public string? Address2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
    public string? Gstin { get; set; }
    public string Status { get; set; } = "A";
}

public class CreateDeliveryLocationDto
{
    public string? CompCode { get; set; } = "01";
    public string DelyCd { get; set; } = string.Empty;
    public string DelyName { get; set; } = string.Empty;
    public string Address1 { get; set; } = string.Empty;
    public string? Address2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
    public string? Gstin { get; set; }
}
