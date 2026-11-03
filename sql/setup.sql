IF DB_ID(N'SushiDaijoubu') IS NULL
    CREATE DATABASE SushiDaijoubu;
GO

USE SushiDaijoubu;
GO

IF OBJECT_ID(N'dbo.Categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Categories (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        NameNo NVARCHAR(100) NOT NULL,
        NameEn NVARCHAR(100) NOT NULL
    );
END;
GO

IF OBJECT_ID(N'dbo.Dishes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Dishes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CategoryId INT NOT NULL,
        NameNo NVARCHAR(100) NOT NULL,
        NameEn NVARCHAR(100) NOT NULL,
        DescriptionNo NVARCHAR(500) NULL,
        DescriptionEn NVARCHAR(500) NULL,
        PriceOre INT NOT NULL CHECK (PriceOre >= 0),
        Pieces INT NOT NULL CHECK (Pieces > 0),
        ImagePath NVARCHAR(255) NULL,
        IsAvailable BIT NOT NULL DEFAULT (1),
        CONSTRAINT FK_Dishes_Categories FOREIGN KEY (CategoryId)
            REFERENCES dbo.Categories(Id)
    );
END;
GO
