const page = document.querySelector('.order-page');
const form = document.querySelector('#order-form');
const message = document.querySelector('#order-message');
const items = document.querySelector('#order-items');
const total = document.querySelector('#order-total');
const money = new Intl.NumberFormat(page.dataset.language === 'en' ? 'en-NO' : 'nb-NO', {
  style: 'currency', currency: 'NOK'
});
let submitting = false;
let submitted = false;

async function reviewOrder() {
  const cart = Cart.read();
  const ids = Object.keys(cart);
  if (ids.length === 0) {
    message.textContent = page.dataset.empty;
    return;
  }
  try {
    const response = await fetch(`/api/cart-dishes?ids=${ids.join(',')}`);
    if (!response.ok) throw new Error('Could not load dishes');
    const dishes = await response.json();
    const current = new Map(dishes.map(dish => [String(dish.Id), dish]));
    if (ids.some(id => !current.get(id)?.IsAvailable)) {
      message.textContent = page.dataset.unavailable;
      return;
    }
    let totalOre = 0;
    for (const id of ids) {
      const dish = current.get(id);
      const name = page.dataset.language === 'en' ? dish.NameEn : dish.NameNo;
      const lineOre = dish.PriceOre * cart[id];
      totalOre += lineOre;
      const row = document.createElement('p');
      row.textContent = `${name} × ${cart[id]} — ${money.format(lineOre / 100)}`;
      items.append(row);
    }
    total.textContent = money.format(totalOre / 100);
    form.hidden = false;
  } catch {
    message.textContent = page.dataset.error;
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting || submitted) return;
  submitting = true;
  const button = form.querySelector('button');
  button.disabled = true;
  message.textContent = '';
  try {
    const response = await fetch('/api/orders' + location.search, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.elements.name.value, cart: Cart.read() })
    });
    const result = await response.json();
    if (!response.ok) {
      message.textContent = result.error || page.dataset.error;
      return;
    }
    // Clear storage only after SQL Server confirms the transaction committed.
    for (const id of Object.keys(Cart.read())) Cart.set(id, 0);
    message.textContent = `${page.dataset.success} ${result.orderId}`;
    submitted = true;
    form.hidden = true;
  } catch {
    message.textContent = page.dataset.error;
  } finally {
    submitting = false;
    button.disabled = false;
  }
});

reviewOrder();
