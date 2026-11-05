// Create a category beside the dish selector without submitting the unsaved dish.
const quickCategory = document.querySelector('[data-quick-category]');

if (quickCategory) {
  const button = quickCategory.querySelector('[data-create-category]');
  const nameNo = quickCategory.querySelector('#quick-name-no');
  const nameEn = quickCategory.querySelector('#quick-name-en');
  const message = quickCategory.querySelector('[data-category-message]');
  const dishForm = quickCategory.closest('form');
  const selector = dishForm.querySelector('#category-id');

  button.addEventListener('click', async () => {
    // Disable repeat clicks while the request is pending.
    if (button.disabled) return;
    button.disabled = true;
    message.textContent = '';

    try {
      const response = await fetch(quickCategory.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _csrf: dishForm.querySelector('[name="_csrf"]').value,
          NameNo: nameNo.value,
          NameEn: nameEn.value
        })
      });
      const result = await response.json();
      if (!response.ok) {
        message.textContent = result.error;
        return;
      }

      // Add only the returned category, leaving every unsaved dish field as entered.
      const category = result.category;
      const option = document.createElement('option');
      option.value = category.Id;
      option.textContent = document.documentElement.lang === 'en'
        ? category.NameEn : category.NameNo;
      selector.add(option);
      selector.value = String(category.Id);
      nameNo.value = '';
      nameEn.value = '';
      message.textContent = result.message;
    } catch {
      message.textContent = quickCategory.dataset.error;
    } finally {
      button.disabled = false;
    }
  });
}
