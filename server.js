const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { getPool } = require('./db');

const app = express();
const port = process.env.PORT || 3000;

// Render pages with EJS and serve styles and other public assets directly.
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// The language stays in links, so it follows the visitor between pages.
const labels = {
  no: {
    home: 'Hjem',
    menu: 'Meny',
    cart: 'Handlekurv',
    order: 'Bestilling',
    admin: 'Admin',
    explore: 'Utforsk restauranten',
    administration: 'Administrasjon',
    welcome: 'Velkommen til vår sushirestaurant!',
    comingSoon: 'Denne siden kommer senere.',
    backHome: 'Tilbake til forsiden',
    all: 'Alle',
    filterCategories: 'Filtrer kategorier',
    search: 'Søk etter retter',
    searchHint: 'Søk på navn eller ingredienser',
    clearSearch: 'Tøm søk',
    noResults: 'Ingen retter passer til søket ditt.',
    noDishes: 'Ingen retter tilgjengelig akkurat nå.',
    allergens: 'Allergener',
    allergenWarning: 'Allergeninformasjonen er foreløpig og ikke kontrollert mot leverandørenes etiketter.',
    piece: 'bit',
    pieces: 'biter',
    imageAlt: 'Bilde av',
    unavailable: 'Menyen er midlertidig utilgjengelig. Prøv igjen senere.',
    customerNavigation: 'Kundenavigasjon',
    adminNavigation: 'Adminnavigasjon'
  },
  en: {
    home: 'Home',
    menu: 'Menu',
    cart: 'Cart',
    order: 'Order',
    admin: 'Admin',
    explore: 'Explore the restaurant',
    administration: 'Administration',
    welcome: 'Welcome to our sushi restaurant!',
    comingSoon: 'This page is coming later.',
    backHome: 'Back to the home page',
    all: 'All',
    filterCategories: 'Filter categories',
    search: 'Search dishes',
    searchHint: 'Search names or ingredients',
    clearSearch: 'Clear search',
    noResults: 'No dishes match your search.',
    noDishes: 'No dishes available right now.',
    allergens: 'Allergens',
    allergenWarning: 'Allergen information is preliminary and has not been checked against supplier labels.',
    piece: 'piece',
    pieces: 'pieces',
    imageAlt: 'Image of',
    unavailable: 'The menu is temporarily unavailable. Please try again later.',
    customerNavigation: 'Customer navigation',
    adminNavigation: 'Admin navigation'
  }
};

app.use((req, res, next) => {
  const language = req.query.lang === 'en' ? 'en' : 'no';
  res.locals.language = language;
  res.locals.languageQuery = language === 'en' ? '?lang=en' : '';
  res.locals.text = labels[language];
  next();
});

app.get('/', (req, res) => {
  res.render('index', {
    title: res.locals.text.home,
    currentPage: '/'
  });
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

    // Group dishes in database order and choose the visible language.
    const english = res.locals.language === 'en';
    const menuSections = categories.recordset.map(category => ({
      id: category.Id,
      name: english ? category.NameEn : category.NameNo,
      dishes: []
    }));
    const sectionsById = new Map(
      categories.recordset.map((category, index) => [category.Id, menuSections[index]])
    );
    const dishesById = new Map();

    for (const dish of dishes.recordset) {
      const menuDish = {
        name: english ? dish.NameEn : dish.NameNo,
        description: english ? dish.DescriptionEn : dish.DescriptionNo,
        // Search always includes both languages, whatever is shown on screen.
        searchText: [
          dish.NameNo,
          dish.NameEn,
          dish.DescriptionNo,
          dish.DescriptionEn
        ].filter(Boolean).join(' '),
        price: priceFormatter.format(dish.PriceOre / 100),
        pieces: dish.Pieces,
        image: localImage(dish.ImagePath),
        allergens: []
      };
      sectionsById.get(dish.CategoryId).dishes.push(menuDish);
      dishesById.set(dish.Id, menuDish);
    }

    for (const allergen of allergens.recordset) {
      dishesById.get(allergen.DishId).allergens.push(
        english ? allergen.NameEn : allergen.NameNo
      );
    }

    res.render('menu', {
      title: res.locals.text.menu,
      currentPage: '/meny',
      menuSections,
      menuError: null
    });
  } catch (error) {
    // Visitors get a friendly message; technical details stay in the server log.
    console.error('Could not load menu:', error.code || error.name);
    res.status(503).render('menu', {
      title: res.locals.text.menu,
      currentPage: '/meny',
      menuSections: [],
      menuError: res.locals.text.unavailable
    });
  }
});

const placeholderPages = {
  '/handlekurv': 'cart',
  '/bestilling': 'order',
  '/admin': 'admin'
};

// These routes keep unfinished navigation links working until their pages are built.
for (const [route, label] of Object.entries(placeholderPages)) {
  app.get(route, (req, res) => {
    res.render('placeholder', {
      title: res.locals.text[label],
      currentPage: route
    });
  });
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
