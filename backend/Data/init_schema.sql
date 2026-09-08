IF DB_ID('ERP') IS NULL
BEGIN
    CREATE DATABASE ERP;
END
GO

USE ERP;
GO

-- 1. Document Series Master (Document Numbering)
IF OBJECT_ID('sale_series', 'U') IS NULL
BEGIN
    CREATE TABLE sale_series (
        compcode VARCHAR(10) NOT NULL,
        acyr INT NOT NULL,
        docid VARCHAR(10) NOT NULL,
        docsr VARCHAR(10) NOT NULL,
        srdesc VARCHAR(100) NOT NULL,
        ldocno BIGINT NOT NULL DEFAULT 0,
        inv_prefix VARCHAR(10) NULL,
        inv_sufix VARCHAR(10) NULL,
        status CHAR(1) NOT NULL DEFAULT 'A',
        entdby VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
        entddt DATETIME NOT NULL DEFAULT GETDATE(),
        lmodby VARCHAR(50) NULL,
        lmoddt DATETIME NULL,
        CONSTRAINT PK_sale_series PRIMARY KEY (compcode, acyr, docid, docsr)
    );
END
GO

-- Seed initial series if empty
IF NOT EXISTS (SELECT 1 FROM sale_series WHERE docid = 'INV')
BEGIN
    INSERT INTO sale_series (compcode, acyr, docid, docsr, srdesc, ldocno, inv_prefix, inv_sufix, status, entdby, entddt)
    VALUES ('01', YEAR(GETDATE()), 'INV', 'SI', 'Sales Invoice Series', 0, 'INV-', '', 'A', 'SYSTEM', GETDATE());
END
GO

IF NOT EXISTS (SELECT 1 FROM sale_series WHERE docid = 'GRN')
BEGIN
    INSERT INTO sale_series (compcode, acyr, docid, docsr, srdesc, ldocno, inv_prefix, inv_sufix, status, entdby, entddt)
    VALUES ('01', YEAR(GETDATE()), 'GRN', 'GR', 'Goods Receipt Note Series', 0, 'GRN-', '', 'A', 'SYSTEM', GETDATE());
END
GO

-- 2. Bank Master
IF OBJECT_ID('sale_bankmst', 'U') IS NULL
BEGIN
    CREATE TABLE sale_bankmst (
        compcode VARCHAR(10) NOT NULL DEFAULT '01',
        bankcode VARCHAR(10) NOT NULL,
        bankname VARCHAR(100) NOT NULL,
        branch VARCHAR(100) NOT NULL,
        accountno VARCHAR(50) NOT NULL,
        ifsccode VARCHAR(20) NOT NULL,
        swiftcode VARCHAR(20) NULL,
        status CHAR(1) NOT NULL DEFAULT 'A',
        entdby VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
        entddt DATETIME NOT NULL DEFAULT GETDATE(),
        lmodby VARCHAR(50) NULL,
        lmoddt DATETIME NULL,
        CONSTRAINT PK_sale_bankmst PRIMARY KEY (compcode, bankcode)
    );
END
GO

-- 3. Delivery Location Master
IF OBJECT_ID('sy_delyloc', 'U') IS NULL
BEGIN
    CREATE TABLE sy_delyloc (
        compcode VARCHAR(10) NOT NULL DEFAULT '01',
        delycd VARCHAR(10) NOT NULL,
        delyname VARCHAR(100) NOT NULL,
        address1 VARCHAR(200) NOT NULL,
        address2 VARCHAR(200) NULL,
        city VARCHAR(50) NOT NULL,
        state VARCHAR(50) NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        gstin VARCHAR(20) NULL,
        status CHAR(1) NOT NULL DEFAULT 'A',
        entdby VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
        entddt DATETIME NOT NULL DEFAULT GETDATE(),
        lmodby VARCHAR(50) NULL,
        lmoddt DATETIME NULL,
        CONSTRAINT PK_sy_delyloc PRIMARY KEY (compcode, delycd)
    );
END
GO

-- 4. Party Master (Customers / Suppliers)
IF OBJECT_ID('sale_partymst', 'U') IS NULL
BEGIN
    CREATE TABLE sale_partymst (
        compcode VARCHAR(10) NOT NULL DEFAULT '01',
        slcode VARCHAR(10) NOT NULL,
        slname VARCHAR(150) NOT NULL,
        partytype VARCHAR(20) NOT NULL, -- Customer, Supplier, Both
        address1 VARCHAR(200) NOT NULL,
        city VARCHAR(50) NOT NULL,
        state VARCHAR(50) NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        gstin VARCHAR(20) NULL,
        panno VARCHAR(20) NULL,
        email VARCHAR(100) NULL,
        phone VARCHAR(30) NULL,
        creditlimit DECIMAL(18,2) NOT NULL DEFAULT 0,
        status CHAR(1) NOT NULL DEFAULT 'A',
        entdby VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
        entddt DATETIME NOT NULL DEFAULT GETDATE(),
        lmodby VARCHAR(50) NULL,
        lmoddt DATETIME NULL,
        CONSTRAINT PK_sale_partymst PRIMARY KEY (compcode, slcode)
    );
END
GO

-- 5. Product Master
IF OBJECT_ID('sale_itemmst', 'U') IS NULL
BEGIN
    CREATE TABLE sale_itemmst (
        compcode VARCHAR(10) NOT NULL DEFAULT '01',
        itemcode VARCHAR(20) NOT NULL,
        itemname VARCHAR(150) NOT NULL,
        itemdesc VARCHAR(250) NULL,
        uom VARCHAR(10) NOT NULL,
        hsncode VARCHAR(20) NOT NULL,
        itemtype VARCHAR(50) NOT NULL DEFAULT 'Finished Goods',
        brand VARCHAR(50) NULL,
        category VARCHAR(50) NULL,
        cgstper DECIMAL(5,2) NOT NULL DEFAULT 0,
        sgstper DECIMAL(5,2) NOT NULL DEFAULT 0,
        igstper DECIMAL(5,2) NOT NULL DEFAULT 0,
        status CHAR(1) NOT NULL DEFAULT 'A',
        entdby VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
        entddt DATETIME NOT NULL DEFAULT GETDATE(),
        lmodby VARCHAR(50) NULL,
        lmoddt DATETIME NULL,
        CONSTRAINT PK_sale_itemmst PRIMARY KEY (compcode, itemcode)
    );
END
GO

-- 6. Product Rate Configuration
IF OBJECT_ID('sale_itemrate', 'U') IS NULL
BEGIN
    CREATE TABLE sale_itemrate (
        compcode VARCHAR(10) NOT NULL DEFAULT '01',
        ratesr VARCHAR(10) NOT NULL DEFAULT 'IR',
        rateno BIGINT NOT NULL,
        itemcode VARCHAR(20) NOT NULL,
        ratedt DATETIME NOT NULL DEFAULT GETDATE(),
        rate DECIMAL(14,4) NOT NULL,
        effectivedt DATETIME NOT NULL DEFAULT GETDATE(),
        expirydate DATETIME NULL,
        status CHAR(1) NOT NULL DEFAULT 'A',
        entdby VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
        entddt DATETIME NOT NULL DEFAULT GETDATE(),
        lmodby VARCHAR(50) NULL,
        lmoddt DATETIME NULL,
        CONSTRAINT PK_sale_itemrate PRIMARY KEY (compcode, ratesr, rateno)
    );
END
GO

-- 7. Current Item-Wise Stock
IF OBJECT_ID('sales_stock', 'U') IS NULL
BEGIN
    CREATE TABLE sales_stock (
        compcode VARCHAR(10) NOT NULL DEFAULT '01',
        itemcode VARCHAR(20) NOT NULL,
        storeloc VARCHAR(20) NOT NULL DEFAULT 'MAIN',
        stockqty DECIMAL(14,3) NOT NULL DEFAULT 0,
        uom VARCHAR(10) NOT NULL DEFAULT 'NOS',
        avgcost DECIMAL(14,4) NOT NULL DEFAULT 0,
        lastupdated DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_sales_stock PRIMARY KEY (compcode, itemcode, storeloc)
    );
END
GO

-- 8. Stock / Inventory Movement Ledger
IF OBJECT_ID('sales_ledger', 'U') IS NULL
BEGIN
    CREATE TABLE sales_ledger (
        ledgerid BIGINT IDENTITY(1,1) NOT NULL,
        compcode VARCHAR(10) NOT NULL DEFAULT '01',
        docid VARCHAR(10) NOT NULL, -- INV, GRN, ADJ
        docsr VARCHAR(10) NOT NULL,
        docno BIGINT NOT NULL,
        docdt DATETIME NOT NULL,
        itemcode VARCHAR(20) NOT NULL,
        storeloc VARCHAR(20) NOT NULL DEFAULT 'MAIN',
        inqty DECIMAL(14,3) NOT NULL DEFAULT 0,
        outqty DECIMAL(14,3) NOT NULL DEFAULT 0,
        balanceqty DECIMAL(14,3) NOT NULL DEFAULT 0,
        rate DECIMAL(14,4) NOT NULL DEFAULT 0,
        remarks VARCHAR(250) NULL,
        entddt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_sales_ledger PRIMARY KEY (ledgerid)
    );
END
GO

-- 9. Sales Invoice Header
IF OBJECT_ID('sale_invhdr', 'U') IS NULL
BEGIN
    CREATE TABLE sale_invhdr (
        compcode VARCHAR(10) NOT NULL DEFAULT '01',
        invyr INT NOT NULL,
        invsr VARCHAR(10) NOT NULL,
        invno BIGINT NOT NULL,
        invdt DATETIME NOT NULL,
        invtype VARCHAR(20) NOT NULL DEFAULT 'TAX INVOICE',
        slcode VARCHAR(10) NOT NULL,
        despatchto VARCHAR(150) NULL,
        storeloc VARCHAR(20) NOT NULL DEFAULT 'MAIN',
        prodval DECIMAL(18,2) NOT NULL DEFAULT 0,
        cgstval DECIMAL(18,2) NOT NULL DEFAULT 0,
        sgstval DECIMAL(18,2) NOT NULL DEFAULT 0,
        igstval DECIMAL(18,2) NOT NULL DEFAULT 0,
        othval DECIMAL(18,2) NOT NULL DEFAULT 0,
        roffval DECIMAL(18,2) NOT NULL DEFAULT 0,
        invval DECIMAL(18,2) NOT NULL DEFAULT 0,
        vehicleno VARCHAR(30) NULL,
        despmode VARCHAR(30) NULL,
        buyerpono VARCHAR(50) NULL,
        buyerpodt DATETIME NULL,
        freightval DECIMAL(18,2) NOT NULL DEFAULT 0,
        delycd VARCHAR(10) NULL,
        remarks VARCHAR(250) NULL,
        bankcode VARCHAR(10) NULL,
        status CHAR(1) NOT NULL DEFAULT 'P', -- P=Pending, A=Approved, C=Cancelled
        entdby VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
        entddt DATETIME NOT NULL DEFAULT GETDATE(),
        authby VARCHAR(50) NULL,
        authdt DATETIME NULL,
        canby VARCHAR(50) NULL,
        candt DATETIME NULL,
        canreason VARCHAR(250) NULL,
        CONSTRAINT PK_sale_invhdr PRIMARY KEY (compcode, invyr, invsr, invno)
    );
END
GO

-- 10. Sales Invoice Details
IF OBJECT_ID('sale_invdtl', 'U') IS NULL
BEGIN
    CREATE TABLE sale_invdtl (
        compcode VARCHAR(10) NOT NULL DEFAULT '01',
        invyr INT NOT NULL,
        invsr VARCHAR(10) NOT NULL,
        invno BIGINT NOT NULL,
        invslno INT NOT NULL,
        itemcode VARCHAR(20) NOT NULL,
        itemdesc VARCHAR(250) NULL,
        hsncode VARCHAR(20) NOT NULL,
        uom VARCHAR(10) NOT NULL,
        invqty DECIMAL(14,3) NOT NULL,
        invrate DECIMAL(14,4) NOT NULL,
        taxableamt DECIMAL(18,2) NOT NULL,
        cgstper DECIMAL(5,2) NOT NULL DEFAULT 0,
        sgstper DECIMAL(5,2) NOT NULL DEFAULT 0,
        igstper DECIMAL(5,2) NOT NULL DEFAULT 0,
        cgstval DECIMAL(18,2) NOT NULL DEFAULT 0,
        sgstval DECIMAL(18,2) NOT NULL DEFAULT 0,
        igstval DECIMAL(18,2) NOT NULL DEFAULT 0,
        totval DECIMAL(18,2) NOT NULL,
        CONSTRAINT PK_sale_invdtl PRIMARY KEY (compcode, invyr, invsr, invno, invslno),
        CONSTRAINT FK_sale_invdtl_sale_invhdr FOREIGN KEY (compcode, invyr, invsr, invno) 
            REFERENCES sale_invhdr(compcode, invyr, invsr, invno) ON DELETE CASCADE
    );
END
GO

-- 11. GRN / Goods Receipt Header
IF OBJECT_ID('sale_rechdr', 'U') IS NULL
BEGIN
    CREATE TABLE sale_rechdr (
        compcode VARCHAR(10) NOT NULL DEFAULT '01',
        recyr INT NOT NULL,
        recsr VARCHAR(10) NOT NULL,
        recno BIGINT NOT NULL,
        recdt DATETIME NOT NULL,
        slcode VARCHAR(10) NOT NULL,
        suppinvno VARCHAR(50) NULL,
        suppinvdt DATETIME NULL,
        storeloc VARCHAR(20) NOT NULL DEFAULT 'MAIN',
        totqty DECIMAL(14,3) NOT NULL DEFAULT 0,
        totval DECIMAL(18,2) NOT NULL DEFAULT 0,
        remarks VARCHAR(250) NULL,
        status CHAR(1) NOT NULL DEFAULT 'A', -- A=Approved, C=Cancelled
        entdby VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
        entddt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_sale_rechdr PRIMARY KEY (compcode, recyr, recsr, recno)
    );
END
GO

-- 12. GRN / Goods Receipt Details
IF OBJECT_ID('sale_recdtl', 'U') IS NULL
BEGIN
    CREATE TABLE sale_recdtl (
        compcode VARCHAR(10) NOT NULL DEFAULT '01',
        recyr INT NOT NULL,
        recsr VARCHAR(10) NOT NULL,
        recno BIGINT NOT NULL,
        recslno INT NOT NULL,
        itemcode VARCHAR(20) NOT NULL,
        uom VARCHAR(10) NOT NULL,
        recqty DECIMAL(14,3) NOT NULL,
        recrate DECIMAL(14,4) NOT NULL,
        totamt DECIMAL(18,2) NOT NULL,
        batchno VARCHAR(50) NULL,
        CONSTRAINT PK_sale_recdtl PRIMARY KEY (compcode, recyr, recsr, recno, recslno),
        CONSTRAINT FK_sale_recdtl_sale_rechdr FOREIGN KEY (compcode, recyr, recsr, recno) 
            REFERENCES sale_rechdr(compcode, recyr, recsr, recno) ON DELETE CASCADE
    );
END
GO

-- 13. Users & Auth Master
IF OBJECT_ID('sy_users', 'U') IS NULL
BEGIN
    CREATE TABLE sy_users (
        userid VARCHAR(50) NOT NULL,
        fullname VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        passwordhash VARCHAR(250) NOT NULL,
        companyname VARCHAR(150) NOT NULL DEFAULT 'Prime ERP Enterprise',
        role VARCHAR(50) NOT NULL DEFAULT 'Admin',
        status CHAR(1) NOT NULL DEFAULT 'A',
        createddt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_sy_users PRIMARY KEY (userid)
    );
END
GO

-- 14. Audit Log
IF OBJECT_ID('sy_auditlog', 'U') IS NULL
BEGIN
    CREATE TABLE sy_auditlog (
        auditid BIGINT IDENTITY(1,1) NOT NULL,
        timestamp DATETIME NOT NULL DEFAULT GETDATE(),
        userid VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        entity VARCHAR(50) NOT NULL,
        recordid VARCHAR(100) NOT NULL,
        details VARCHAR(MAX) NULL,
        CONSTRAINT PK_sy_auditlog PRIMARY KEY (auditid)
    );
END
GO
