# Sushi Daijoubu desu ka?

Node.js / Express project

## About

A website for a sushi restaurant.

The restaurant name is SUSHI Daijoubu desu ka? 大丈夫ですか？.

## Technologies

- Node.js and Express
- EJS (probably)
- Database (not decided yet)
- Git and GitHub
- Vitest and Supertest if needed

The website have Norwegian and English versions. Norwegian will be the default language.

## Pages

### Home

A home page with a hero image, some information about the restaurant and a few featured dishes.

A way to edit the home page text and images from the admin page.

### Menu

The menu have sushi categories and pictures of the dishes.

Each dish should have a name, ingredients, price. Customers able to choose how many portions they want and add them to the cart.

Dish names and descriptions available in Norwegian and English.

### Cart and ordering

Customers able to:

- See what they added to the cart
- Change quantities
- Remove dishes
- See the total price
- Enter their table number
- Place an order

Each order have its own order number.

I won't add online payments to this project.

### Admin

Admin page where I can:

- Add new dishes
- Edit or delete dishes
- Change prices and descriptions
- Add, replace or remove pictures
- Edit the home page
- View and manage orders

The admin page will require login.

### Orders

The order number, table number, dishes, quantities, prices and total amount.

Also need the order date, time and status.

Order statuses:

- New
- Preparing
- Ready
- Served
- Completed
- Cancelled

## Database

I haven't decided which database to use yet.

Need to store dishes, categories, orders, order items, admin accounts and editable website content.

Also need to keep the original prices in saved orders, even if I change the menu prices later.

Prices will be stored in Norwegian krone and øre.

## Security and testing

I'll need login protection for the admin pages, hashed passwords and validation for forms and uploaded files.

Prices and order totals should be checked on the server.

I'll test the main functions as I build them.

The website should work on both computers and phones.

## Work plan

1. Set up Node.js and Express
2. Create the pages and navigation
3. Add the database and menu
4. Make the cart and ordering system
5. Build the admin pages
6. Finish the design and pictures
7. Test everything and fix problems

## Not decided yet

- SQLite or SQL Server
- EJS or another template engine
- Final menu and categories
- Hosting

I'll focus on getting the main functions working before adding anything extra.
