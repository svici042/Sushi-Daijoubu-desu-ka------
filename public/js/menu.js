const categoryButtons = document.querySelectorAll('[data-category-filter]');
const sections = document.querySelectorAll('[data-menu-section]');
const searchInput = document.querySelector('#dish-search');
const clearButton = document.querySelector('#clear-search');
const noResults = document.querySelector('#menu-no-results');
const emptyMenu = document.querySelector('#menu-empty');
const cartFeedback = document.querySelector('#cart-feedback');

let selectedCategory = 'all';

function updateMenu() {
  // Every card already contains names and descriptions in both languages.
  const search = searchInput.value.trim().toLocaleLowerCase();
  let visibleDishes = 0;

  for (const section of sections) {
    let visibleInSection = 0;
    const dishes = section.querySelectorAll('.menu-dish');

    for (const dish of dishes) {
      const inCategory = selectedCategory === 'all'
        || section.dataset.menuSection === selectedCategory;
      const matchesSearch = dish.dataset.search.toLocaleLowerCase().includes(search);
      dish.hidden = !inCategory || !matchesSearch;

      if (!dish.hidden) {
        visibleInSection += 1;
      }
    }

    // Keep a selected empty category visible so its own message can be read.
    const selectedEmptyCategory = search === ''
      && section.dataset.menuSection === selectedCategory
      && dishes.length === 0;
    section.hidden = visibleInSection === 0 && !selectedEmptyCategory;
    visibleDishes += visibleInSection;
  }

  clearButton.hidden = searchInput.value.length === 0;
  // A search has its own no-results message; an entirely empty menu has another.
  noResults.hidden = search === '' || visibleDishes > 0;
  emptyMenu.hidden = search !== '' || selectedCategory !== 'all' || visibleDishes > 0;
}

// Buttons keep their active state visible to sighted and screen-reader users.
for (const button of categoryButtons) {
  button.addEventListener('click', () => {
    selectedCategory = button.dataset.categoryFilter;

    for (const option of categoryButtons) {
      option.setAttribute('aria-pressed', option === button ? 'true' : 'false');
    }

    updateMenu();
  });
}

searchInput.addEventListener('input', updateMenu);
clearButton.addEventListener('click', () => {
  searchInput.value = '';
  updateMenu();
  searchInput.focus();
});

// Apply a search value restored by the browser after returning to this page.
updateMenu();

// Each card owns its selector; adding uses that card's selected quantity.
for (const selector of document.querySelectorAll('.menu-quantity')) {
  selector.addEventListener('click', event => {
    const button = event.target.closest('button[data-step]');
    if (!button) return;
    const output = selector.querySelector('[data-selected-quantity]');
    const quantity = Math.max(1, Math.min(99, Number(output.value) + Number(button.dataset.step)));
    output.value = quantity;
    selector.querySelector('[data-step="-1"]').disabled = quantity === 1;
    selector.querySelector('[data-step="1"]').disabled = quantity === 99;
  });
}

for (const button of document.querySelectorAll('[data-add-dish]')) {
  button.addEventListener('click', () => {
    const id = button.dataset.addDish;
    const quantity = Cart.read()[id] || 0;
    const selected = Number(button.closest('.menu-dish').querySelector('[data-selected-quantity]').value);
    if (quantity + selected > Cart.maxQuantity) {
      cartFeedback.textContent = document.querySelector('.menu-page').dataset.limit;
      return;
    }
    Cart.set(id, quantity + selected);
    cartFeedback.textContent = `${button.closest('.menu-dish').querySelector('h3').textContent}: ${document.querySelector('.menu-page').dataset.added}`;
  });
}
