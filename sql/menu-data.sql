USE SushiDaijoubu;
GO

SET XACT_ABORT ON;

-- This menu comes from the approved recipe list. Allergens are not supplier-verified.
DECLARE @Categories TABLE (NameNo NVARCHAR(100), NameEn NVARCHAR(100));
INSERT INTO @Categories (NameNo, NameEn)
VALUES
    (N'Supper', N'Soups'),
    (N'Sashimi', N'Sashimi'),
    (N'Nigiri', N'Nigiri'),
    (N'Gunkan', N'Gunkan'),
    (N'Hosomaki', N'Hosomaki'),
    (N'Uramaki', N'Uramaki'),
    (N'Furai Maki', N'Furai Maki'),
    (N'Futomaki', N'Futomaki');

-- Keep the approved recipes in this temporary list while the script runs.
DECLARE @Menu TABLE (
    CategoryNameEn NVARCHAR(100),
    NameNo NVARCHAR(100),
    NameEn NVARCHAR(100),
    DescriptionNo NVARCHAR(500),
    DescriptionEn NVARCHAR(500),
    PriceOre INT,
    Pieces INT,
    AllergenIds NVARCHAR(50),
    AllergenNotes NVARCHAR(1000),
    AdditiveNotes NVARCHAR(1000)
);

INSERT INTO @Menu
VALUES
    (N'Soups', N'Misosuppe med nameko-sopp og tofu', N'Miso soup with Nameko mushrooms and tofu',
     N'Nameko-sopp, tofu, misosuppe.', N'Nameko mushrooms, tofu, miso soup.',
     9900, NULL, N'4,6',
     N'Kontroller miso og suppebase mot leverandøretikett.', NULL),
    (N'Soups', N'Misosuppe med laks og udon', N'Miso soup with salmon and udon',
     N'Laks, udonnudler, misosuppe.', N'Salmon, udon noodles, miso soup.',
     13900, NULL, N'1,4,6',
     N'Kontroller udon, miso og suppebase mot leverandøretikett.', NULL),
    (N'Soups', N'Japansk ramensuppe', N'Japanese Ramen soup',
     N'Eggnudler, stekte svinekjøttbiter, nori, marinerte egg, sesamfrø, ramensuppe.', N'Egg noodles, roasted pork pieces, nori, marinated eggs, sesame seeds, ramen soup.',
     18900, NULL, N'1,3,4,6,11',
     N'Kontroller nudler, marinerte egg og ramenbuljong mot leverandøretikett.', NULL),
    (N'Sashimi', N'Sake Sashimi', N'Sake Sashimi',
     N'Laks. 40 g.', N'Salmon. 40 g.',
     7900, NULL, N'4',
     NULL, NULL),
    (N'Sashimi', N'Maguro Sashimi', N'Maguro Sashimi',
     N'Tunfisk. 40 g.', N'Tuna. 40 g.',
     8900, NULL, N'4',
     NULL, NULL),
    (N'Sashimi', N'Unagi Sashimi', N'Unagi Sashimi',
     N'Ål. 40 g.', N'Eel. 40 g.',
     9900, NULL, N'4,11',
     N'Kontroller eventuell unagimarinade mot leverandøretikett.', NULL),
    (N'Nigiri', N'Sake Nigiri', N'Sake Nigiri',
     N'Laks, Miso Karashi-saus.', N'Salmon, Miso Karashi sauce.',
     3500, 1, N'4,6,10',
     N'Kontroller Miso Karashi-saus mot leverandøretikett.', NULL),
    (N'Nigiri', N'Unagi Nigiri', N'Unagi Nigiri',
     N'Ål, unagisaus.', N'Eel, Unagi sauce.',
     4500, 1, N'1,4,6,11',
     N'Kontroller unagisaus og marinade mot leverandøretikett.', NULL),
    (N'Nigiri', N'Maguro Nigiri', N'Maguro Nigiri',
     N'Tunfisk, løksalsa, vårløk.', N'Tuna, onion salsa, spring onions.',
     3900, 1, N'1,4,6',
     N'Kontroller løksalsa mot leverandøretikett; allergener må gjennomgås.', NULL),
    (N'Nigiri', N'Tamago Nigiri', N'Tamago Nigiri',
     N'Tamago-omelett, unagisaus.', N'Tamago omelette, Unagi sauce.',
     2900, 1, N'1,3,4,6',
     N'Kontroller tamago og unagisaus mot leverandøretikett.', NULL),
    (N'Nigiri', N'Hotategai Nigiri', N'Hotategai Nigiri',
     N'Kamskjell, koriander, Sriracha-saus.', N'Scallops, coriander, Sriracha sauce.',
     4900, 1, N'14',
     N'Kontroller Sriracha-saus mot leverandøretikett.', NULL),
    (N'Gunkan', N'Ikura Gunkan', N'Ikura Gunkan',
     N'Lakserogn.', N'Salmon roe.',
     5500, 1, N'4',
     N'Kontroller lakserogn mot leverandøretikett.', NULL),
    (N'Gunkan', N'Sake Gunkan', N'Sake Gunkan',
     N'Laksetartar.', N'Salmon tartare.',
     4500, 1, N'1,4,6,11',
     N'Kontroller tartarblandingen mot leverandøretikett.', NULL),
    (N'Gunkan', N'Tekka Gunkan', N'Tekka Gunkan',
     N'Tunfisktartar.', N'Tuna tartare.',
     4900, 1, N'1,4,6,11',
     N'Kontroller tartarblandingen mot leverandøretikett.', NULL),
    (N'Gunkan', N'Hotategai Gunkan', N'Hotategai Gunkan',
     N'Kamskjell.', N'Scallops.',
     5500, 1, N'1,3,4,6,10,14',
     N'Kontroller allergenlisten; oppgitte ingredienser forklarer ikke alle allergenene.', NULL),
    (N'Gunkan', N'Shima Gunkan', N'Shima Gunkan',
     N'Tigerreker, flyvefiskrogn, avokado.', N'Tiger prawns, flying fish roe, avocado.',
     5500, 1, N'2,3,4,10',
     N'Kontroller rogn og allergenlisten mot leverandøretikett.', N'Originaloppskriften nevner mulig E102/E129; kontroller leverandøretikett.'),
    (N'Hosomaki', N'Kappa Hosomaki', N'Kappa Hosomaki',
     N'Agurk, sesamfrø.', N'Cucumber, sesame seeds.',
     7900, 6, N'11',
     NULL, NULL),
    (N'Hosomaki', N'Avocado Hosomaki', N'Avocado Hosomaki',
     N'Avokado, trøffelsaus.', N'Avocado, truffle sauce.',
     8900, 6, N'3,10',
     N'Kontroller trøffelsaus mot leverandøretikett.', NULL),
    (N'Hosomaki', N'Sake Hosomaki', N'Sake Hosomaki',
     N'Laks.', N'Salmon.',
     9900, 6, N'4',
     NULL, NULL),
    (N'Hosomaki', N'Sakecheese Hosomaki', N'Sakecheese Hosomaki',
     N'Laks, kremost.', N'Salmon, cream cheese.',
     10900, 6, N'4,7',
     NULL, NULL),
    (N'Hosomaki', N'Tekka Hosomaki', N'Tekka Hosomaki',
     N'Tunfisk.', N'Tuna.',
     10900, 6, N'4',
     NULL, NULL),
    (N'Hosomaki', N'Unagi Hosomaki', N'Unagi Hosomaki',
     N'Ål, unagisaus, sesamfrø.', N'Eel, Unagi sauce, sesame seeds.',
     11900, 6, N'1,4,6,11',
     N'Kontroller unagisaus og marinade mot leverandøretikett.', NULL),
    (N'Hosomaki', N'Ebi Tempura Hosomaki', N'Ebi Tempura Hosomaki',
     N'Tigerreker i tempura, sterk saus.', N'Tiger prawns in tempura, spicy sauce.',
     11900, 6, N'1,2,3,10',
     N'Kontroller tempurarøre og sterk saus mot leverandøretikett.', NULL),
    (N'Uramaki', N'Sake Avocado', N'Sake Avocado',
     N'Laks, avokado, kremost, sesamfrø.', N'Salmon, avocado, cream cheese, sesame seeds.',
     13900, 8, N'4,7,11',
     NULL, NULL),
    (N'Uramaki', N'Philadelphia Sesame', N'Philadelphia Sesame',
     N'Laks, kremost, avokado, agurk, sesamfrø.', N'Salmon, cream cheese, avocado, cucumber, sesame seeds.',
     14900, 8, N'4,7,11',
     NULL, NULL),
    (N'Uramaki', N'Spicy Tuna', N'Spicy Tuna',
     N'Tunfisk, vårløk, sterk saus, sesamfrø.', N'Tuna, spring onions, spicy sauce, sesame seeds.',
     15900, 8, N'3,4,10,11',
     N'Kontroller sterk saus mot leverandøretikett.', NULL),
    (N'Uramaki', N'Jambo', N'Jambo',
     N'Tigerreker, laks, agurk, avokado, kremost.', N'Tiger prawns, salmon, cucumber, avocado, cream cheese.',
     16900, 8, N'2,4,7',
     NULL, NULL),
    (N'Uramaki', N'Philadelphia Mango', N'Philadelphia Mango',
     N'Laks, agurk, kremost, mangosaus, panko, vårløk, sesamfrø.', N'Salmon, cucumber, cream cheese, mango sauce, Panko, spring onions, sesame seeds.',
     15900, 8, N'1,4,7,11',
     N'Kontroller mangosaus og panko mot leverandøretikett.', NULL),
    (N'Uramaki', N'Philadelphia Gold', N'Philadelphia Gold',
     N'Laks, masagorogn, kremost, avokado, agurk.', N'Salmon, Masago roe, cream cheese, avocado, cucumber.',
     15900, 8, N'4,7',
     N'Kontroller masagorogn mot leverandøretikett.', N'Originaloppskriften nevner mulig E102/E129; kontroller leverandøretikett.'),
    (N'Uramaki', N'Red Dragon', N'Red Dragon',
     N'Laks, tigerreker i panko, agurk, takuan, unagisaus, sterk saus, sesamfrø.', N'Salmon, tiger prawns in Panko, cucumber, Takuan, Unagi sauce, spicy sauce, sesame seeds.',
     18900, 8, N'1,2,3,4,6,10,11',
     N'Kontroller panko, takuan og sausene mot leverandøretikett.', NULL),
    (N'Uramaki', N'Flaming Dragon', N'Flaming Dragon',
     N'Ål, tigerreker i panko, kanpyo-gresskar, agurk, kremost, unagisaus, sesamfrø.', N'Eel, tiger prawns in Panko, Kanpyo gourd, cucumber, cream cheese, Unagi sauce, sesame seeds.',
     18700, 8, N'1,2,4,6,7,11',
     N'Kontroller panko, kanpyo og unagisaus mot leverandøretikett.', NULL),
    (N'Uramaki', N'Green Dragon', N'Green Dragon',
     N'Ål, shiitakesopp, agurk, avokado, kataifi-deig, kremost, trøffelsaus, sesamfrø.', N'Eel, shiitake mushrooms, cucumber, avocado, Kataifi pastry, cream cheese, truffle sauce, sesame seeds.',
     19900, 8, N'1,3,4,7,10,11',
     N'Kontroller kataifi-deig og trøffelsaus mot leverandøretikett.', NULL),
    (N'Furai Maki', N'Sake Coconut Furai', N'Sake Coconut Furai',
     N'Laks, agurk, kanpyo-gresskar, avokado, salat, kremost, kokosflak.', N'Salmon, cucumber, Kanpyo gourd, avocado, lettuce, cream cheese, coconut flakes.',
     16900, 6, N'1,4,7',
     N'Kontroller kanpyo og tilberedning; gluten er oppgitt i originalen.', NULL),
    (N'Furai Maki', N'Sake Sesame Furai', N'Sake Sesame Furai',
     N'Laks, agurk, kanpyo-gresskar, avokado, salat, kremost, sesamfrø.', N'Salmon, cucumber, Kanpyo gourd, avocado, lettuce, cream cheese, sesame seeds.',
     16900, 6, N'1,4,7,11',
     N'Kontroller kanpyo og tilberedning; gluten er oppgitt i originalen.', NULL),
    (N'Furai Maki', N'Sake Panko Furai', N'Sake Panko Furai',
     N'Laks, agurk, kanpyo-gresskar, avokado, salat, kremost.', N'Salmon, cucumber, Kanpyo gourd, avocado, lettuce, cream cheese.',
     17900, 6, N'1,4,7',
     N'Kontroller kanpyo og panering; panko står i navnet, men ikke i ingredienslisten.', NULL),
    (N'Furai Maki', N'Sake Almond Furai', N'Sake Almond Furai',
     N'Laks, agurk, kanpyo-gresskar, avokado, salat, kremost, mandelflak.', N'Salmon, cucumber, Kanpyo gourd, avocado, lettuce, cream cheese, almond flakes.',
     17900, 6, N'1,4,7,8',
     N'Kontroller kanpyo og tilberedning; gluten er oppgitt i originalen.', NULL),
    (N'Futomaki', N'Salmon Grill Futomaki', N'Salmon Grill Futomaki',
     N'Grillet laks, agurk, avokado, kanpyo-gresskar, salat, unagisaus, sesamfrø.', N'Grilled salmon, cucumber, avocado, Kanpyo gourd, lettuce, Unagi sauce, sesame seeds.',
     14900, 6, N'1,4,6,11',
     N'Kontroller kanpyo og unagisaus mot leverandøretikett.', NULL),
    (N'Futomaki', N'Salmon Tempura Futomaki', N'Salmon Tempura Futomaki',
     N'Laks i tempura, agurk, avokado, kanpyo-gresskar, salat, vårløk, sterk saus, sesamfrø.', N'Salmon in tempura, cucumber, avocado, Kanpyo gourd, lettuce, spring onions, spicy sauce, sesame seeds.',
     15900, 6, N'1,3,4,10,11',
     N'Kontroller tempurarøre, kanpyo og sterk saus mot leverandøretikett.', NULL),
    (N'Futomaki', N'Prawn Panko Futomaki', N'Prawn Panko Futomaki',
     N'Tigerreker i panko, agurk, takuan, kanpyo-gresskar, salat.', N'Tiger prawns in Panko, cucumber, Takuan, Kanpyo gourd, lettuce.',
     14900, 6, N'1,2',
     N'Kontroller panko, takuan og kanpyo mot leverandøretikett.', NULL),
    (N'Futomaki', N'Kimchi Tempura Futomaki', N'Kimchi Tempura Futomaki',
     N'Kimchi i tempura.', N'Kimchi in tempura.',
     13900, 6, N'1,4,6,14',
     N'Kontroller kimchi og tempurarøre; oppgitte allergener må gjennomgås.', NULL),
    (N'Futomaki', N'Daijoubu Futomaki', N'Daijoubu Futomaki',
     N'Laks, tunfisk, kamskjell, tigerreker, tamago-omelett, asparges, masagorogn, lakserogn, vårløk, yakiniku-saus.', N'Salmon, tuna, scallops, tiger prawns, Tamago omelette, asparagus, Masago roe, salmon roe, spring onions, Yakiniku sauce.',
     28900, 12, N'1,2,3,4,6,10,11,14',
     N'Kontroller tamago, rogn og yakiniku-saus mot leverandøretikett.', N'Originaloppskriften nevner mulig E102/E129; kontroller leverandøretikett.');

-- Stop if existing records differ from the approved list.
IF EXISTS (
    SELECT 1 FROM dbo.Categories AS c
    JOIN @Categories AS seed
        ON c.NameNo = seed.NameNo OR c.NameEn = seed.NameEn
    WHERE c.NameNo <> seed.NameNo OR c.NameEn <> seed.NameEn
)
    THROW 50001, 'Existing categories conflict with the approved menu.', 1;

IF EXISTS (
    SELECT 1
    FROM dbo.Dishes AS d
    JOIN dbo.Categories AS c ON c.Id = d.CategoryId
    JOIN @Menu AS m ON m.NameNo = d.NameNo OR m.NameEn = d.NameEn
    WHERE EXISTS (
        SELECT c.NameEn, d.NameNo, d.NameEn, d.DescriptionNo, d.DescriptionEn,
               d.PriceOre, d.Pieces, d.AllergenNotes, d.AdditiveNotes
        EXCEPT
        SELECT m.CategoryNameEn, m.NameNo, m.NameEn, m.DescriptionNo,
               m.DescriptionEn, m.PriceOre, m.Pieces,
               m.AllergenNotes, m.AdditiveNotes
    )
)
    THROW 50002, 'Existing dishes conflict with the approved menu.', 1;

-- Check existing allergen links in both directions before inserting anything.
IF EXISTS (
    SELECT 1
    FROM dbo.DishAllergens AS da
    JOIN dbo.Dishes AS d ON d.Id = da.DishId
    JOIN @Menu AS m ON m.NameNo = d.NameNo
    WHERE NOT EXISTS (
        SELECT 1 FROM STRING_SPLIT(m.AllergenIds, ',') AS number
        WHERE CAST(number.value AS INT) = da.AllergenId
    )
)
    THROW 50003, 'Existing dish allergens conflict with the approved menu.', 1;

IF EXISTS (
    SELECT 1
    FROM dbo.Dishes AS d
    JOIN @Menu AS m ON m.NameNo = d.NameNo
    CROSS APPLY STRING_SPLIT(m.AllergenIds, ',') AS number
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.DishAllergens AS da
        WHERE da.DishId = d.Id AND da.AllergenId = CAST(number.value AS INT)
    )
)
    THROW 50003, 'Existing dish allergens conflict with the approved menu.', 1;

-- Insert only missing seed rows; existing application-managed fields stay untouched.
BEGIN TRANSACTION;

INSERT INTO dbo.Categories (NameNo, NameEn)
SELECT seed.NameNo, seed.NameEn
FROM @Categories AS seed
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.Categories AS c WHERE c.NameNo = seed.NameNo
);

INSERT INTO dbo.Dishes (
    CategoryId, NameNo, NameEn, DescriptionNo, DescriptionEn,
    PriceOre, Pieces, ImagePath, IsAvailable, AllergensVerified,
    AllergenNotes, AdditiveNotes
)
SELECT c.Id, m.NameNo, m.NameEn, m.DescriptionNo, m.DescriptionEn,
       m.PriceOre, m.Pieces, NULL, 1, 0, m.AllergenNotes, m.AdditiveNotes
FROM @Menu AS m
JOIN dbo.Categories AS c ON c.NameEn = m.CategoryNameEn
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.Dishes AS d
    WHERE d.NameNo = m.NameNo OR d.NameEn = m.NameEn
);

INSERT INTO dbo.DishAllergens (DishId, AllergenId)
SELECT d.Id, CAST(number.value AS INT)
FROM @Menu AS m
JOIN dbo.Dishes AS d ON d.NameNo = m.NameNo
CROSS APPLY STRING_SPLIT(m.AllergenIds, ',') AS number
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.DishAllergens AS da
    WHERE da.DishId = d.Id AND da.AllergenId = CAST(number.value AS INT)
);

COMMIT TRANSACTION;
