const express = require('express');
const path = require('node:path');

const app = express();
const port = process.env.PORT || 3000;

// Render pages with EJS and serve styles and other public assets directly.
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// The home page is the only route in this initial setup.
app.get('/', (req, res) => {
  res.render('index');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
