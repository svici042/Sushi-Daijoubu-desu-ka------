const page = document.querySelector('.cart-page');
const items = document.querySelector('#cart-items');
const message = document.querySelector('#cart-message');
const summary = document.querySelector('#cart-summary');
const countLabel = document.querySelector('#cart-item-count');
const totalLabel = document.querySelector('#cart-total');
const money = new Intl.NumberFormat(page.dataset.language === 'en' ? 'en-NO' : 'nb-NO', {
  style: 'currency', currency: 'NOK'
});

function text(tag, content, className) {
  const element = document.createElement(tag);
  element.textContent = content;
  if (className) element.className = className;
  return element;
}

function quantityButton(label, symbol, action, id, disabled = false) {
  const button = text('button', symbol);
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.dataset.action = action;
  button.dataset.id = id;
  button.disabled = disabled;
  return button;
}

async function showCart() {
  const cart = Cart.read();
  const ids = Object.keys(cart);
  items.replaceChildren();
  summary.hidden = true;
  message.textContent = '';
  if (ids.length === 0) {
    message.textContent = page.dataset.empty;
    return;
  }

  try {
    // Prices and availability come from SQL Server on every cart display.
    const response = await fetch(`/api/cart-dishes?ids=${ids.join(',')}`);
    if (!response.ok) throw new Error('Cart request failed');
    const dishes = await response.json();
    const current = new Map(dishes.map(dish => [String(dish.Id), dish]));
    const missing = ids.some(id => !current.get(id)?.IsAvailable);
    const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
    let totalOre = 0;

    for (const id of ids) {
      const dish = current.get(id);
      const quantity = cart[id];
      if (!dish?.IsAvailable) {
        // Keep outdated entries visible so the customer can remove them.
        const row = document.createElement('article');
        row.className = 'cart-item';
        let name = page.dataset.unavailableDish;
        if (dish) {
          name = page.dataset.language === 'en' ? dish.NameEn : dish.NameNo;
        }
        row.append(
          text('h2', name),
          text('p', `${page.dataset.quantity}: ${quantity}`),
          quantityButton(`${page.dataset.remove}: ${name}`, page.dataset.remove, 'remove', id)
        );
        items.append(row);
        continue;
      }
      const lineOre = dish.PriceOre * quantity;
      totalOre += lineOre;

      const row = document.createElement('article');
      row.className = 'cart-item';
      const name = page.dataset.language === 'en' ? dish.NameEn : dish.NameNo;
      row.append(
        text('h2', name),
        text('p', `${page.dataset.unit}: ${money.format(dish.PriceOre / 100)}`),
        text('p', `${page.dataset.line}: ${money.format(lineOre / 100)}`)
      );
      const controls = document.createElement('div');
      controls.className = 'cart-quantity';
      controls.append(
        quantityButton(`${page.dataset.decrease}: ${name}`, '−', 'decrease', id),
        text('span', `${page.dataset.quantity}: ${quantity}`),
        quantityButton(`${page.dataset.increase}: ${name}`, '+', 'increase', id, quantity >= Cart.maxQuantity),
        quantityButton(`${page.dataset.remove}: ${name}`, page.dataset.remove, 'remove', id)
      );
      row.append(controls);
      items.append(row);
    }

    message.textContent = missing ? page.dataset.unavailable : '';
    countLabel.textContent = count;
    totalLabel.textContent = money.format(totalOre / 100);
    summary.hidden = false;
  } catch {
    message.textContent = page.dataset.error;
  }
}

// One listener handles quantity buttons even after the list is redrawn.
items.addEventListener('click', async event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = button.dataset.id;
  const quantity = Cart.read()[id] || 0;
  const next = button.dataset.action === 'remove' ? 0
    : quantity + (button.dataset.action === 'increase' ? 1 : -1);
  Cart.set(id, next);
  await showCart();
  // Redrawing removes the clicked button, so return focus to its replacement.
  const replacement = [...items.querySelectorAll('button[data-action]')]
    .find(control => control.dataset.id === id && control.dataset.action === button.dataset.action);
  (replacement || items.querySelector('button') || page.querySelector('a')).focus();
});

window.addEventListener('storage', showCart);
showCart();
