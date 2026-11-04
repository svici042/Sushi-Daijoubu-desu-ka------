// Keep only valid dish IDs and quantities in browser storage.
const Cart = (() => {
  const key = 'sushi-cart';
  const maxQuantity = 99;

  function read() {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
      const cart = {};
      for (const [id, quantity] of Object.entries(saved)) {
        if (/^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))
          && Number.isInteger(quantity) && quantity > 0 && quantity <= maxQuantity) {
          cart[id] = quantity;
        }
      }
      return cart;
    } catch {
      return {};
    }
  }

  function updateBadge() {
    const count = Object.values(read()).reduce((sum, quantity) => sum + quantity, 0);
    for (const badge of document.querySelectorAll('[data-cart-count]')) {
      badge.textContent = count;
      badge.hidden = count === 0;
    }
  }

  function set(id, quantity) {
    if (!Number.isSafeInteger(Number(id)) || Number(id) < 1) return;
    const cart = read();
    if (quantity > 0) cart[id] = Math.min(maxQuantity, quantity);
    else delete cart[id];
    try {
      localStorage.setItem(key, JSON.stringify(cart));
    } catch {
      return;
    }
    updateBadge();
    window.dispatchEvent(new Event('cart-change'));
  }

  // Storage events keep the badge current across open tabs.
  window.addEventListener('storage', updateBadge);
  updateBadge();
  return { read, set, maxQuantity };
})();
