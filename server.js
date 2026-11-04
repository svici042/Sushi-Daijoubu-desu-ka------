const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { getPool } = require('./db');

const app = express();
const port = process.env.PORT || 3000;

// Render pages with EJS and serve styles and other public assets directly.
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index', { title: 'Hjem', currentPage: '/' });
});

const priceFormatter = new Intl.NumberFormat('nb-NO', {
  style: 'currency',
  currency: 'NOK',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function localImage(imagePath) {
  // Show only images that exist in the public images folder.
  if (!imagePath || !imagePath.startsWith('/images/')) {
    return null;
  }

  const filename = path.basename(imagePath);
  const file = path.join(__dirname, 'public', 'images', filename);
  return imagePath === `/images/${filename}` && fs.existsSync(file)
    ? imagePath
    : null;
}

app.get('/meny', async (req, res) => {
  try {
    const pool = await getPool();

    // Read categories and only the dishes currently available to customers.
    const categories = await pool.request().query(`
      SELECT Id, NameNo, NameEn
      FROM dbo.Categories
      ORDER BY Id
    `);
    const dishes = await pool.request().query(`
      SELECT Id, CategoryId, NameNo, NameEn, DescriptionNo, DescriptionEn,
             PriceOre, Pieces, ImagePath, IsAvailable
      FROM dbo.Dishes
      WHERE IsAvailable = 1
      ORDER BY CategoryId, Id
    `);
    const allergens = await pool.request().query(`
      SELECT da.DishId, a.NameNo, a.NameEn
      FROM dbo.DishAllergens AS da
      JOIN dbo.Allergens AS a ON a.Id = da.AllergenId
      JOIN dbo.Dishes AS d ON d.Id = da.DishId
      WHERE d.IsAvailable = 1
      ORDER BY da.DishId, a.Id
    `);

    // Group dishes and their allergen names for the EJS page.
    const menuSections = categories.recordset.map(category => ({
      name: category.NameNo,
      dishes: []
    }));
    const sectionsById = new Map(
      categories.recordset.map((category, index) => [category.Id, menuSections[index]])
    );
    const dishesById = new Map();

    for (const dish of dishes.recordset) {
      const menuDish = {
        name: dish.NameNo,
        description: dish.DescriptionNo,
        price: priceFormatter.format(dish.PriceOre / 100),
        pieces: dish.Pieces,
        image: localImage(dish.ImagePath),
        allergens: []
      };
      sectionsById.get(dish.CategoryId).dishes.push(menuDish);
      dishesById.set(dish.Id, menuDish);
    }

    for (const allergen of allergens.recordset) {
      dishesById.get(allergen.DishId).allergens.push(allergen.NameNo);
    }

    res.render('menu', {
      title: 'Meny',
      currentPage: '/meny',
      menuSections,
      menuError: null
    });
  } catch (error) {
    // Visitors get a friendly message; technical details stay in the server log.
    console.error('Could not load menu:', error.code || error.name);
    res.status(503).render('menu', {
      title: 'Meny',
      currentPage: '/meny',
      menuSections: [],
      menuError: 'Menyen er midlertidig utilgjengelig. Prøv igjen senere.'
    });
  }
});

const placeholderPages = {
  '/handlekurv': 'Handlekurv',
  '/bestilling': 'Bestilling',
  '/admin': 'Admin'
};

// These routes keep unfinished navigation links working until their pages are built.
for (const [route, title] of Object.entries(placeholderPages)) {
  app.get(route, (req, res) => {
    res.render('placeholder', { title, currentPage: route });
  });
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
