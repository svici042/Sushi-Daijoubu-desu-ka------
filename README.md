# SUSHI Daijoubu desu ka? (å¤§ä¸ˆå¤«ã§ã™ã‹ï¼Ÿ)

Sushi restaurant website.

Node.js / Express project

## About

A sushi restaurant website with a menu and a simple ordering flow.

I worked at Gan Bei City (not promotion) as a sushi master and sous-chef. The menu will be partly inspired by my experience there.

The website will have a Japanese anime style with some meme humor.

## Features

- Home page with restaurant information
- Sushi menu with pictures, ingredients and prices
- Shopping cart and table ordering
- Order management
- Admin pages for adding and editing dishes, prices and availability
- Editable home page content
- Norwegian and English languages

Norwegian BokmÃ¥l will be the default language.

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

Copy `.env.example` to `.env` and fill in the SQL Server and admin settings. Follow the commands in `.env.example` to generate your own bcrypt password hash and random session secret. I use `DB_AUTH=sql` with my SQL login. For a local named instance, `DB_SERVER=.\SQLEXPRESS` can be used without setting a port. Run `sql/setup.sql`, then `sql/orders.sql` in SQL Server Management Studio using an account that can create tables. The application login needs SELECT on Categories, Dishes, Allergens, DishAllergens, Orders and OrderItems; UPDATE on Orders and Dishes; and INSERT on Orders, OrderItems and Dishes. Grant the new Dishes permissions manually if needed.

Admin sessions use Express's memory store for local development. Before production, use a persistent session store and HTTPS; production cookies are marked Secure.

Start the site with:

```sh
npm run dev
```

Open http://localhost:3000/ in your browser.

## Documentation

- [Project Specification](PROJECT_SPECIFICATION.md)
- [Design Guidelines](DESIGN_GUIDELINES.md)

## Status

The menu reads available dishes and allergens from SQL Server. I can filter and search dishes, switch between Norwegian and English, and choose quantities. The cart saves dish IDs and quantities in the browser. Orders ask for a name and save current prices and items in SQL Server. The protected admin pages list orders, advance their status, and manage dishes and availability.
