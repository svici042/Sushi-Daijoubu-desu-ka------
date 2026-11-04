-- Run in the existing project database; rerunning does not replace orders.
USE SushiDaijoubu;
GO

IF OBJECT_ID(N'dbo.Orders', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Orders (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Orders_CreatedAt DEFAULT SYSUTCDATETIME(),
        CustomerName NVARCHAR(100) NOT NULL,
        Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Orders_Status DEFAULT N'new',
        TotalOre INT NOT NULL CHECK (TotalOre >= 0)
    );
END;
GO

IF OBJECT_ID(N'dbo.OrderItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderItems (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT NOT NULL REFERENCES dbo.Orders(Id),
        DishId INT NOT NULL REFERENCES dbo.Dishes(Id),
        Quantity INT NOT NULL CHECK (Quantity BETWEEN 1 AND 99),
        UnitPriceOre INT NOT NULL CHECK (UnitPriceOre >= 0)
    );
END;
GO
