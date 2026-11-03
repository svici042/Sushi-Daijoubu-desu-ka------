const express = require('express');
const path = require('node:path');

const app = express();
const port = process.env.PORT || 3000;

// Render pages with EJS and serve styles and other public assets directly.
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Render the home page and simple destinations for its navigation links.
app.get('/', (req, res) => {
  res.render('index');
});

const placeholderPages = {
  '/meny': 'Meny',
  '/handlekurv': 'Handlekurv',
  '/bestilling': 'Bestilling',
  '/admin': 'Admin'
};

for (const [route, title] of Object.entries(placeholderPages)) {
  app.get(route, (req, res) => {
    res.render('placeholder', { title });
  });
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
