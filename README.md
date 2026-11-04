# SUSHI Daijoubu desu ka? (大丈夫ですか？)

Sushi restaurant website.

Node.js / Express project

## About

A sushi restaurant website with a menu, ordering system and admin pages.

I worked at Gan Bei City (not promotion) as a sushi master and sous-chef. The menu will be partly inspired by my experience there.

The website will have a Japanese anime style with some meme humor.

## Features

- Home page with restaurant information
- Sushi menu with pictures, ingredients and prices
- Shopping cart and table ordering
- Order management
- Admin pages for editing dishes, prices and pictures
- Editable home page content
- Norwegian and English languages

Norwegian Bokmål will be the default language.

## Technologies

- Node.js
- Express
- HTML, CSS, JavaScript
- EJS
- SQL Server and the `mssql` / `msnodesqlv8` packages

## Installation

Install Node.js 22 or newer, SQL Server, and the ODBC Driver for SQL Server. Then run this in the project folder:

```sh
npm ci
```

Copy `.env.example` to `.env` and fill in the SQL Server settings. I use `DB_AUTH=sql` with my SQL login. For a local named instance, `DB_SERVER=.\SQLEXPRESS` can be used without setting a port.

Start the site with:

```sh
npm run dev
```

Open http://localhost:3000/ in your browser.

## Documentation

- [Project Specification](PROJECT_SPECIFICATION.md)
- [Design Guidelines](DESIGN_GUIDELINES.md)

## Status

Express and EJS are set up. The home page works, and the menu page reads available dishes and allergens from SQL Server. I can filter categories, search dishes and switch between Norwegian and English. The cart saves dish IDs and quantities in the browser and gets current prices from SQL Server. Ordering and admin pages are still placeholders.
