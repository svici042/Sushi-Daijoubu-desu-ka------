const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { getPool } = require('./db');
const sql = require('mssql/msnodesqlv8');
const crypto = require('node:crypto');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '127.0.0.1';

// Render pages with EJS and serve styles and other public assets directly.
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false }));

// Admin sessions stay server-side; a persistent store is required before production use.
if (!process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) {
  throw new Error('ADMIN_SESSION_SECRET must contain at least 32 characters.');
}
if (process.env.NODE_ENV === 'production') {
  throw new Error('Configure a persistent admin session store before production deployment.');
}
app.use(session({
  name: 'sushi-admin',
  secret: process.env.ADMIN_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000
  }
}));

// The language stays in links, so it follows the visitor between pages.
const labels = {
  no: {
    home: 'Hjem',
    menu: 'Meny',
    cart: 'Handlekurv',
    addToCart: 'Legg i handlekurv',
    addedToCart: 'Lagt i handlekurven',
    cartLimit: 'Maks 99 per rett.',
    cartEmpty: 'Handlekurven er tom.',
    backMenu: 'Se menyen',
    quantity: 'Antall',
    unitPrice: 'Pris per stykk',
    lineTotal: 'Sum',
    cartTotal: 'Totalt',
    itemCount: 'Antall varer',
    remove: 'Fjern',
    increase: 'Øk antall',
    decrease: 'Reduser antall',
    cartUnavailable: 'Noen retter er slettet eller utilgjengelige og er ikke med i summen.',
    unavailableDish: 'Rett som ikke lenger er tilgjengelig',
    cartError: 'Kunne ikke hente handlekurven. Prøv igjen senere.',
    customerName: 'Navn', placeOrder: 'Send bestilling', orderSuccess: 'Bestilling mottatt. Ordrenummer:',
    orderInvalid: 'Ugyldig navn eller handlekurv.', orderUnavailable: 'En rett mangler eller er ikke tilgjengelig.',
    orderError: 'Bestillingen kunne ikke lagres. Prøv igjen.', orderReview: 'Kontroller bestillingen før du sender den.',
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
    adminNavigation: 'Adminnavigasjon',
    adminLogin: 'Admininnlogging', password: 'Passord', login: 'Logg inn', logout: 'Logg ut',
    loginFailed: 'Feil passord.', loginLimited: 'For mange forsøk. Prøv igjen senere.',
    adminSetup: 'Admininnlogging er ikke satt opp.', adminOrders: 'Bestillinger',
    newOrders: 'Nye bestillinger', status: 'Status', orderDate: 'Dato',
    filterStatus: 'Filtrer status', preparing: 'Under tilberedning', ready: 'Klar',
    completed: 'Fullført', newStatus: 'Ny', nextStatus: 'Neste status',
    noOrders: 'Ingen bestillinger funnet.', adminError: 'Kunne ikke hente bestillinger.',
    statusError: 'Kunne ikke oppdatere status.', invalidTransition: 'Ugyldig statusendring.',
    orderNumber: 'Ordre', orderDetails: 'Vis varer',
    adminDishes: 'Retter', addDish: 'Legg til rett', editDish: 'Rediger rett',
    dishNameNo: 'Norsk navn', dishNameEn: 'Engelsk navn',
    descriptionNo: 'Norsk beskrivelse', descriptionEn: 'Engelsk beskrivelse',
    category: 'Kategori', priceNok: 'Pris (kr)', portion: 'Antall biter',
    availability: 'Tilgjengelig', available: 'Tilgjengelig', notAvailable: 'Utilgjengelig',
    findDishes: 'Søk i navn', filterDishes: 'Filtrer', saveDish: 'Lagre rett',
    dishSaved: 'Retten er lagret.', dishCreated: 'Retten er lagt til.',
    noAdminDishes: 'Ingen retter funnet.', dishLoadError: 'Kunne ikke hente retter.',
    dishSaveError: 'Kunne ikke lagre retten.', dishInvalid: 'Kontroller feltene og prøv igjen.',
    dishNotFound: 'Retten finnes ikke.', invalidDishId: 'Ugyldig rett-ID.',
    categoryRequired: 'Velg en kategori.', nameRequired: 'Begge navn må fylles ut (maks 100 tegn).',
    descriptionLength: 'Beskrivelser kan være maks 500 tegn.',
    priceInvalid: 'Skriv en gyldig pris i kroner (maks 21 474 836,47).',
    portionInvalid: 'Antall biter må være et positivt heltall.'
  },
  en: {
    home: 'Home',
    menu: 'Menu',
    cart: 'Cart',
    addToCart: 'Add to cart',
    addedToCart: 'Added to cart',
    cartLimit: 'Maximum 99 per dish.',
    cartEmpty: 'Your cart is empty.',
    backMenu: 'View menu',
    quantity: 'Quantity',
    unitPrice: 'Unit price',
    lineTotal: 'Line total',
    cartTotal: 'Total',
    itemCount: 'Items',
    remove: 'Remove',
    increase: 'Increase quantity',
    decrease: 'Decrease quantity',
    cartUnavailable: 'Some dishes were deleted or are unavailable and are not included in the total.',
    unavailableDish: 'Dish no longer available',
    cartError: 'Could not load the cart. Please try again later.',
    customerName: 'Name', placeOrder: 'Place order', orderSuccess: 'Order received. Order number:',
    orderInvalid: 'Invalid name or cart.', orderUnavailable: 'A dish is missing or unavailable.',
    orderError: 'Could not save the order. Please try again.', orderReview: 'Review your order before placing it.',
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
    adminNavigation: 'Admin navigation',
    adminLogin: 'Admin login', password: 'Password', login: 'Log in', logout: 'Log out',
    loginFailed: 'Incorrect password.', loginLimited: 'Too many attempts. Try again later.',
    adminSetup: 'Admin login is not configured.', adminOrders: 'Orders',
    newOrders: 'New orders', status: 'Status', orderDate: 'Date',
    filterStatus: 'Filter status', preparing: 'Preparing', ready: 'Ready',
    completed: 'Completed', newStatus: 'New', nextStatus: 'Next status',
    noOrders: 'No orders found.', adminError: 'Could not load orders.',
    statusError: 'Could not update status.', invalidTransition: 'Invalid status change.',
    orderNumber: 'Order', orderDetails: 'Show items',
    adminDishes: 'Dishes', addDish: 'Add dish', editDish: 'Edit dish',
    dishNameNo: 'Norwegian name', dishNameEn: 'English name',
    descriptionNo: 'Norwegian description', descriptionEn: 'English description',
    category: 'Category', priceNok: 'Price (NOK)', portion: 'Pieces',
    availability: 'Availability', available: 'Available', notAvailable: 'Unavailable',
    findDishes: 'Search names', filterDishes: 'Filter', saveDish: 'Save dish',
    dishSaved: 'Dish saved.', dishCreated: 'Dish added.',
    noAdminDishes: 'No dishes found.', dishLoadError: 'Could not load dishes.',
    dishSaveError: 'Could not save the dish.', dishInvalid: 'Check the fields and try again.',
    dishNotFound: 'Dish not found.', invalidDishId: 'Invalid dish ID.',
    categoryRequired: 'Choose a category.', nameRequired: 'Both names are required (maximum 100 characters).',
    descriptionLength: 'Descriptions can have up to 500 characters.',
    priceInvalid: 'Enter a valid NOK price (maximum 21,474,836.47).',
    portionInvalid: 'Pieces must be a positive whole number.'
  }
};

app.use((req, res, next) => {
  const language = req.query.lang === 'en' ? 'en' : 'no';
  res.locals.language = language;
  res.locals.languageQuery = language === 'en' ? '?lang=en' : '';
  res.locals.text = labels[language];
  res.locals.languageSwitchPath = req.path;
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
        id: dish.Id,
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

// Return current database details for cart IDs; browser storage never supplies prices.
app.get('/api/cart-dishes', async (req, res) => {
  const ids = String(req.query.ids || '').split(',').filter(Boolean).map(Number);
  if (ids.length > 99 || ids.some(id => !Number.isSafeInteger(id) || id < 1)) {
    return res.status(400).json({ error: 'Invalid dish IDs.' });
  }
  if (ids.length === 0) {
    return res.json([]);
  }

  try {
    const pool = await getPool();
    const request = pool.request();
    // Each ID is bound as a SQL parameter before building the IN list.
    const parameters = [...new Set(ids)].map((id, index) => {
      request.input(`id${index}`, id);
      return `@id${index}`;
    });
    const result = await request.query(`
      SELECT Id, NameNo, NameEn, PriceOre, IsAvailable
      FROM dbo.Dishes
      WHERE Id IN (${parameters.join(', ')})
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Could not load cart dishes:', error.code || error.name);
    res.status(503).json({ error: 'Cart dishes unavailable.' });
  }
});

app.get(['/handlekurv', '/kurv'], (req, res) => {
  res.render('cart', {
    title: res.locals.text.cart,
    currentPage: req.path
  });
});

app.get(['/bestilling', '/bestill'], (req, res) => {
  res.render('order', { title: res.locals.text.order, currentPage: req.path });
});

app.post('/api/orders', async (req, res) => {
  const name = req.body?.name;
  const cart = req.body?.cart;
  const entries = cart && typeof cart === 'object' && !Array.isArray(cart)
    ? Object.entries(cart) : [];
  const valid = typeof name === 'string' && name.trim().length > 0
    && name.trim().length <= 100 && entries.length > 0 && entries.length <= 99
    && entries.every(([id, quantity]) => /^[1-9]\d*$/.test(id)
      && Number.isSafeInteger(Number(id)) && Number(id) <= 2147483647
      && Number.isInteger(quantity)
      && quantity >= 1 && quantity <= 99);
  if (!valid) return res.status(400).json({ error: res.locals.text.orderInvalid });

  let transaction;
  try {
    transaction = new sql.Transaction(await getPool());
    await transaction.begin();
    const lines = [];
    let totalOre = 0;
    // Lock the selected rows until commit so availability and prices cannot change mid-order.
    for (const [id, quantity] of entries) {
      const result = await new sql.Request(transaction)
        .input('id', sql.Int, Number(id))
        .query('SELECT Id, PriceOre, IsAvailable FROM dbo.Dishes WITH (UPDLOCK, HOLDLOCK) WHERE Id = @id');
      const dish = result.recordset[0];
      if (!dish || !dish.IsAvailable || !Number.isSafeInteger(dish.PriceOre) || dish.PriceOre < 0) {
        await transaction.rollback();
        return res.status(409).json({ error: res.locals.text.orderUnavailable });
      }
      lines.push({ id: dish.Id, quantity, priceOre: dish.PriceOre });
      totalOre += dish.PriceOre * quantity;
    }
    if (!Number.isSafeInteger(totalOre) || totalOre > 2147483647) {
      await transaction.rollback();
      return res.status(400).json({ error: res.locals.text.orderInvalid });
    }
    const created = await new sql.Request(transaction)
      .input('name', sql.NVarChar(100), name.trim())
      .input('totalOre', sql.Int, totalOre)
      .query(`INSERT INTO dbo.Orders (CustomerName, TotalOre)
              OUTPUT INSERTED.Id VALUES (@name, @totalOre)`);
    const orderId = created.recordset[0].Id;
    for (const line of lines) {
      await new sql.Request(transaction)
        .input('orderId', sql.Int, orderId)
        .input('dishId', sql.Int, line.id)
        .input('quantity', sql.Int, line.quantity)
        .input('priceOre', sql.Int, line.priceOre)
        .query(`INSERT INTO dbo.OrderItems (OrderId, DishId, Quantity, UnitPriceOre)
                VALUES (@orderId, @dishId, @quantity, @priceOre)`);
    }
    await transaction.commit();
    res.status(201).json({ orderId, totalOre });
  } catch (error) {
    if (transaction) {
      try { await transaction.rollback(); } catch { /* The connection may already have rolled back. */ }
    }
    console.error('Could not create order:', error.code || error.name);
    res.status(503).json({ error: res.locals.text.orderError });
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => res.status(429).render('admin-login', {
    title: res.locals.text.adminLogin,
    currentPage: '/admin/login',
    csrfToken: csrfToken(req),
    loginError: res.locals.text.loginLimited
  })
});

function csrfToken(req) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  return req.session.csrfToken;
}

function checkCsrf(req, res, next) {
  const given = req.body?._csrf;
  const expected = req.session.csrfToken;
  if (typeof given !== 'string' || !expected || given.length !== expected.length
    || !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return res.sendStatus(403);
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.session.admin === true) return next();
  if (req.path.startsWith('/api/')) return res.sendStatus(401);
  res.redirect(`/admin/login${res.locals.languageQuery}`);
}

app.get('/admin/login', (req, res) => {
  if (req.session.admin) return res.redirect(`/admin${res.locals.languageQuery}`);
  res.render('admin-login', {
    title: res.locals.text.adminLogin,
    currentPage: '/admin/login',
    csrfToken: csrfToken(req),
    loginError: null
  });
});

app.post('/admin/login', loginLimiter, checkCsrf, async (req, res, next) => {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const password = req.body.password;
  const validHash = typeof hash === 'string' && /^\$2[aby]\$\d\d\$/.test(hash);
  const valid = validHash && typeof password === 'string' && password.length <= 1024
    && await bcrypt.compare(password, hash);
  if (!valid) {
    return res.status(401).render('admin-login', {
      title: res.locals.text.adminLogin,
      currentPage: '/admin/login',
      csrfToken: csrfToken(req),
      loginError: validHash ? res.locals.text.loginFailed : res.locals.text.adminSetup
    });
  }
  req.session.regenerate(error => {
    if (error) return next(error);
    req.session.admin = true;
    csrfToken(req);
    res.redirect(`/admin${res.locals.languageQuery}`);
  });
});

app.post('/admin/logout', requireAdmin, checkCsrf, (req, res, next) => {
  req.session.destroy(error => {
    if (error) return next(error);
    res.clearCookie('sushi-admin');
    res.redirect(`/admin/login${res.locals.languageQuery}`);
  });
});

const statusLabels = { new: 'newStatus', preparing: 'preparing', ready: 'ready', completed: 'completed' };
const nextStatus = { new: 'preparing', preparing: 'ready', ready: 'completed' };

app.get('/admin', requireAdmin, async (req, res) => {
  const filter = typeof req.query.status === 'string'
    && Object.hasOwn(statusLabels, req.query.status)
    ? req.query.status : 'all';
  res.locals.languageSwitchPath = filter === 'all' ? '/admin' : `/admin?status=${filter}`;
  try {
    const pool = await getPool();
    const orders = await pool.request()
      .input('filter', sql.NVarChar(20), filter)
      .query(`SELECT Id, CreatedAt, CustomerName, Status, TotalOre
              FROM dbo.Orders
              WHERE @filter = N'all' OR Status = @filter
              ORDER BY CreatedAt DESC, Id DESC`);
    const count = await pool.request()
      .query("SELECT COUNT(*) AS NewCount FROM dbo.Orders WHERE Status = N'new'");
    const items = await pool.request()
      .input('filter', sql.NVarChar(20), filter)
      .query(`SELECT oi.OrderId, oi.Quantity, oi.UnitPriceOre, d.NameNo, d.NameEn
              FROM dbo.OrderItems AS oi
              JOIN dbo.Orders AS o ON o.Id = oi.OrderId
              LEFT JOIN dbo.Dishes AS d ON d.Id = oi.DishId
              WHERE @filter = N'all' OR o.Status = @filter
              ORDER BY oi.Id`);
    const itemsByOrder = new Map(orders.recordset.map(order => [order.Id, []]));
    for (const item of items.recordset) itemsByOrder.get(item.OrderId).push(item);
    res.render('admin', {
      title: res.locals.text.adminOrders,
      currentPage: '/admin',
      csrfToken: csrfToken(req),
      orders: orders.recordset,
      itemsByOrder,
      newCount: count.recordset[0].NewCount,
      filter,
      statusLabels,
      nextStatus,
      money: priceFormatter,
      adminError: null
    });
  } catch (error) {
    console.error('Could not load admin orders:', error.code || error.name);
    res.status(503).render('admin', {
      title: res.locals.text.adminOrders,
      currentPage: '/admin',
      csrfToken: csrfToken(req),
      orders: [], itemsByOrder: new Map(), newCount: 0, filter,
      statusLabels, nextStatus, money: priceFormatter,
      adminError: res.locals.text.adminError
    });
  }
});

app.post('/admin/orders/:id/status', requireAdmin, checkCsrf, async (req, res) => {
  const id = Number(req.params.id);
  const from = req.body.from;
  const to = req.body.to;
  if (!Number.isInteger(id) || id < 1 || id > 2147483647 || nextStatus[from] !== to) {
    return res.status(400).send(res.locals.text.invalidTransition);
  }
  try {
    // The current status is part of the UPDATE condition, so concurrent changes cannot skip a step.
    const result = await (await getPool()).request()
      .input('id', sql.Int, id)
      .input('from', sql.NVarChar(20), from)
      .input('to', sql.NVarChar(20), to)
      .query('UPDATE dbo.Orders SET Status = @to WHERE Id = @id AND Status = @from');
    if (result.rowsAffected[0] !== 1) return res.status(409).send(res.locals.text.invalidTransition);
    res.redirect(`/admin${res.locals.languageQuery}`);
  } catch (error) {
    console.error('Could not update order status:', error.code || error.name);
    res.status(503).send(res.locals.text.statusError);
  }
});

// Dish forms share one server-side parser. Prices become integer øre from decimal text.
function dishId(value) {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value)
    && Number(value) <= 2147483647 ? Number(value) : null;
}

function parseDish(body, categories, text) {
  const errors = [];
  const nameNo = typeof body.NameNo === 'string' ? body.NameNo.trim() : '';
  const nameEn = typeof body.NameEn === 'string' ? body.NameEn.trim() : '';
  const descriptionNo = typeof body.DescriptionNo === 'string' ? body.DescriptionNo.trim() : '';
  const descriptionEn = typeof body.DescriptionEn === 'string' ? body.DescriptionEn.trim() : '';
  const categoryId = dishId(body.CategoryId);
  const priceText = typeof body.PriceNok === 'string' ? body.PriceNok.trim() : '';
  const priceMatch = /^(\d{1,8})(?:[.,](\d{1,2}))?$/.exec(priceText);
  const priceOre = priceMatch
    ? Number(priceMatch[1]) * 100 + Number((priceMatch[2] || '').padEnd(2, '0')) : null;
  const piecesText = typeof body.Pieces === 'string' ? body.Pieces.trim() : '';
  const pieces = piecesText === '' ? null : dishId(piecesText);
  const available = body.IsAvailable === '1';

  if (!nameNo || !nameEn || nameNo.length > 100 || nameEn.length > 100) errors.push(text.nameRequired);
  if (descriptionNo.length > 500 || descriptionEn.length > 500) errors.push(text.descriptionLength);
  if (!categoryId || !categories.some(category => category.Id === categoryId)) errors.push(text.categoryRequired);
  if (priceOre === null || priceOre < 1 || priceOre > 2147483647) errors.push(text.priceInvalid);
  if (piecesText !== '' && !pieces) errors.push(text.portionInvalid);
  if (!['0', '1'].includes(body.IsAvailable)) errors.push(text.dishInvalid);

  return {
    errors,
    dish: { NameNo: nameNo, NameEn: nameEn, DescriptionNo: descriptionNo,
      DescriptionEn: descriptionEn, CategoryId: categoryId, PriceOre: priceOre,
      PriceNok: priceText, Pieces: pieces, IsAvailable: available }
  };
}

async function dishCategories() {
  return (await (await getPool()).request().query(
    'SELECT Id, NameNo, NameEn FROM dbo.Categories ORDER BY Id'
  )).recordset;
}

function renderDishForm(req, res, { dish, categories, errors = [], status = 200, editing = false }) {
  res.status(status).render('admin-dish-form', {
    title: editing ? res.locals.text.editDish : res.locals.text.addDish,
    currentPage: '/admin/dishes', csrfToken: csrfToken(req),
    dish, categories, errors, editing
  });
}

app.get('/admin/dishes', requireAdmin, async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  const category = dishId(req.query.category);
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (category) query.set('category', category);
  res.locals.languageSwitchPath = `/admin/dishes${query.size ? `?${query}` : ''}`;
  let categories = [];
  let dishes = [];
  let error = null;
  try {
    categories = await dishCategories();
    dishes = (await (await getPool()).request()
      .input('search', sql.NVarChar(202), `%${search.replace(/[\[%_]/g, '[$&]')}%`)
      .input('category', sql.Int, category)
      .query(`SELECT d.Id, d.NameNo, d.NameEn, d.PriceOre, d.Pieces, d.IsAvailable,
                     c.NameNo AS CategoryNo, c.NameEn AS CategoryEn
              FROM dbo.Dishes AS d
              JOIN dbo.Categories AS c ON c.Id = d.CategoryId
              WHERE (@category IS NULL OR d.CategoryId = @category)
                AND (d.NameNo LIKE @search OR d.NameEn LIKE @search)
              ORDER BY d.CategoryId, d.Id`)).recordset;
  } catch (err) {
    console.error('Could not load admin dishes:', err.code || err.name);
    error = res.locals.text.dishLoadError;
  }
  res.status(error ? 503 : 200).render('admin-dishes', {
    title: res.locals.text.adminDishes, currentPage: '/admin/dishes',
    csrfToken: csrfToken(req), categories, dishes, search,
    category, error, money: priceFormatter,
    success: req.query.saved === 'created' ? res.locals.text.dishCreated
      : req.query.saved === 'updated' ? res.locals.text.dishSaved : null
  });
});

app.get('/admin/dishes/new', requireAdmin, async (req, res) => {
  try {
    renderDishForm(req, res, {
      dish: { NameNo: '', NameEn: '', DescriptionNo: '', DescriptionEn: '',
        CategoryId: null, PriceNok: '', Pieces: null, IsAvailable: true },
      categories: await dishCategories()
    });
  } catch (error) {
    console.error('Could not load dish form:', error.code || error.name);
    res.status(503).send(res.locals.text.dishLoadError);
  }
});

app.get('/admin/dishes/:id/edit', requireAdmin, async (req, res) => {
  const id = dishId(req.params.id);
  if (!id) return res.status(400).send(res.locals.text.invalidDishId);
  try {
    const categories = await dishCategories();
    const dish = (await (await getPool()).request().input('id', sql.Int, id)
      .query(`SELECT Id, CategoryId, NameNo, NameEn, DescriptionNo, DescriptionEn,
                     PriceOre, Pieces, IsAvailable FROM dbo.Dishes WHERE Id = @id`)).recordset[0];
    if (!dish) return res.status(404).send(res.locals.text.dishNotFound);
    dish.PriceNok = `${Math.floor(dish.PriceOre / 100)},${String(dish.PriceOre % 100).padStart(2, '0')}`;
    renderDishForm(req, res, { dish, categories, editing: true });
  } catch (error) {
    console.error('Could not load dish:', error.code || error.name);
    res.status(503).send(res.locals.text.dishLoadError);
  }
});

async function saveDish(req, res, editing) {
  const id = editing ? dishId(req.params.id) : null;
  if (editing && !id) return res.status(400).send(res.locals.text.invalidDishId);
  let categories;
  try {
    categories = await dishCategories();
  } catch (error) {
    console.error('Could not load categories:', error.code || error.name);
    return res.status(503).send(res.locals.text.dishSaveError);
  }
  const { dish, errors } = parseDish(req.body, categories, res.locals.text);
  if (errors.length) return renderDishForm(req, res, {
    dish: { ...dish, Id: id }, categories, errors, status: 400, editing
  });
  try {
    const request = (await getPool()).request()
      .input('categoryId', sql.Int, dish.CategoryId)
      .input('nameNo', sql.NVarChar(100), dish.NameNo)
      .input('nameEn', sql.NVarChar(100), dish.NameEn)
      .input('descriptionNo', sql.NVarChar(500), dish.DescriptionNo || null)
      .input('descriptionEn', sql.NVarChar(500), dish.DescriptionEn || null)
      .input('priceOre', sql.Int, dish.PriceOre)
      .input('pieces', sql.Int, dish.Pieces)
      .input('available', sql.Bit, dish.IsAvailable);
    if (editing) {
      const result = await request.input('id', sql.Int, id).query(`
        UPDATE dbo.Dishes SET CategoryId = @categoryId, NameNo = @nameNo,
          NameEn = @nameEn, DescriptionNo = @descriptionNo,
          DescriptionEn = @descriptionEn, PriceOre = @priceOre,
          Pieces = @pieces, IsAvailable = @available
        WHERE Id = @id
      `);
      if (result.rowsAffected[0] !== 1) return res.status(404).send(res.locals.text.dishNotFound);
    } else {
      await request.query(`
        INSERT INTO dbo.Dishes (CategoryId, NameNo, NameEn, DescriptionNo,
          DescriptionEn, PriceOre, Pieces, ImagePath, IsAvailable, AllergensVerified)
        VALUES (@categoryId, @nameNo, @nameEn, @descriptionNo,
          @descriptionEn, @priceOre, @pieces, NULL, @available, 0)
      `);
    }
    res.redirect(`/admin/dishes${res.locals.languageQuery}${res.locals.languageQuery ? '&' : '?'}saved=${editing ? 'updated' : 'created'}`);
  } catch (error) {
    console.error('Could not save dish:', error.code || error.name);
    renderDishForm(req, res, {
      dish: { ...dish, Id: id }, categories, errors: [res.locals.text.dishSaveError],
      status: 503, editing
    });
  }
}

app.post('/admin/dishes', requireAdmin, checkCsrf, (req, res) => saveDish(req, res, false));
app.post('/admin/dishes/:id', requireAdmin, checkCsrf, (req, res) => saveDish(req, res, true));

app.post('/admin/dishes/:id/availability', requireAdmin, checkCsrf, async (req, res) => {
  const id = dishId(req.params.id);
  if (!id || !['0', '1'].includes(req.body.IsAvailable)) {
    return res.status(400).send(res.locals.text.dishInvalid);
  }
  try {
    const result = await (await getPool()).request()
      .input('id', sql.Int, id)
      .input('available', sql.Bit, req.body.IsAvailable === '1')
      .query('UPDATE dbo.Dishes SET IsAvailable = @available WHERE Id = @id');
    if (result.rowsAffected[0] !== 1) return res.status(404).send(res.locals.text.dishNotFound);
    res.redirect(`/admin/dishes${res.locals.languageQuery}`);
  } catch (error) {
    console.error('Could not change dish availability:', error.code || error.name);
    res.status(503).send(res.locals.text.dishSaveError);
  }
});

// Use localhost by default; set HOST=0.0.0.0 in .env for local Wi-Fi testing.
if (require.main === module) {
  app.listen(port, host, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

module.exports = app;
