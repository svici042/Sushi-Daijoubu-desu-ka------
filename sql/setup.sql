-- Create the project database only when it is missing.
IF DB_ID(N'SushiDaijoubu') IS NULL
    CREATE DATABASE SushiDaijoubu;
GO

USE SushiDaijoubu;
GO

-- Create the basic menu tables without replacing existing data.
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
        Pieces INT NULL CHECK (Pieces > 0),
        ImagePath NVARCHAR(255) NULL,
        IsAvailable BIT NOT NULL DEFAULT (1),
        CONSTRAINT FK_Dishes_Categories FOREIGN KEY (CategoryId)
            REFERENCES dbo.Categories(Id)
    );
END;
GO

-- Allow portions measured by weight while keeping the positive-piece check.
IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Dishes')
        AND name = N'Pieces'
        AND is_nullable = 0
)
    ALTER TABLE dbo.Dishes ALTER COLUMN Pieces INT NULL;
GO

-- Link dishes to the fixed allergen list through a junction table.
IF OBJECT_ID(N'dbo.Allergens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Allergens (
        Id INT PRIMARY KEY,
        NameNo NVARCHAR(100) NOT NULL,
        NameEn NVARCHAR(100) NOT NULL
    );
END;
GO

IF OBJECT_ID(N'dbo.DishAllergens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DishAllergens (
        DishId INT NOT NULL,
        AllergenId INT NOT NULL,
        CONSTRAINT PK_DishAllergens PRIMARY KEY (DishId, AllergenId),
        CONSTRAINT FK_DishAllergens_Dishes FOREIGN KEY (DishId)
            REFERENCES dbo.Dishes(Id),
        CONSTRAINT FK_DishAllergens_Allergens FOREIGN KEY (AllergenId)
            REFERENCES dbo.Allergens(Id)
    );
END;
GO

-- Add only missing allergen groups, keeping their fixed IDs.
INSERT INTO dbo.Allergens (Id, NameNo, NameEn)
SELECT seed.Id, seed.NameNo, seed.NameEn
FROM (VALUES
    (1, N'Kornslag som inneholder gluten', N'Gluten-containing cereals'),
    (2, N'Skalldyr', N'Crustaceans'),
    (3, N'Egg', N'Eggs'),
    (4, N'Fisk', N'Fish'),
    (5, N'Peanøtter', N'Peanuts'),
    (6, N'Soyabønner', N'Soybeans'),
    (7, N'Melk', N'Milk'),
    (8, N'Nøtter', N'Tree nuts'),
    (9, N'Selleri', N'Celery'),
    (10, N'Sennep', N'Mustard'),
    (11, N'Sesamfrø', N'Sesame'),
    (12, N'Svoveldioksid og sulfitter', N'Sulphur dioxide and sulphites'),
    (13, N'Lupin', N'Lupin'),
    (14, N'Bløtdyr', N'Molluscs')
) AS seed (Id, NameNo, NameEn)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.Allergens AS existing WHERE existing.Id = seed.Id
);
GO

-- New dishes start unverified until their ingredients are checked.
IF COL_LENGTH(N'dbo.Dishes', N'AllergensVerified') IS NULL
    ALTER TABLE dbo.Dishes ADD AllergensVerified BIT NOT NULL
        CONSTRAINT DF_Dishes_AllergensVerified DEFAULT (0);
GO

IF COL_LENGTH(N'dbo.Dishes', N'AllergenNotes') IS NULL
    ALTER TABLE dbo.Dishes ADD AllergenNotes NVARCHAR(1000) NULL;
GO

IF COL_LENGTH(N'dbo.Dishes', N'AdditiveNotes') IS NULL
    ALTER TABLE dbo.Dishes ADD AdditiveNotes NVARCHAR(1000) NULL;
GO
