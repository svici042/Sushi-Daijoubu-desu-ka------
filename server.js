const express = require('express');
const path = require('node:path');

const app = express();
const port = process.env.PORT || 3000;

// Render pages with EJS and serve styles and other public assets directly.
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index', { title: 'Hjem', currentPage: '/' });
});

// Temporary examples for the menu page, separate from any future database.
const menuSections = [
  {
    name: 'Maki',
    dishes: [
      { name: 'Maki (eksempel)', description: 'Eksempel på en makirull.', price: 89 }
    ]
  },
  {
    name: 'Nigiri',
    dishes: [
      { name: 'Nigiri (eksempel)', description: 'Eksempel på en nigiribit.', price: 49 }
    ]
  },
  {
    name: 'Sashimi',
    dishes: [
      { name: 'Sashimi (eksempel)', description: 'Eksempel på en sashimiporsjon.', price: 99 }
    ]
  }
];

app.get('/meny', (req, res) => {
  res.render('menu', {
    title: 'Meny',
    currentPage: '/meny',
    menuSections
  });
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
