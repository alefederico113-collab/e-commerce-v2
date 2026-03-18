function renderCart() {
  const mount = document.getElementById('cart-items');
  const cart = getCart();

  if (cart.length === 0) {
    mount.innerHTML = '<p class="muted">Il carrello e vuoto.</p>';
    document.getElementById('cart-total').textContent = 'Totale: 0 crediti';
    return;
  }

  let total = 0;
  mount.innerHTML = cart.map((item) => {
    total += item.final_price * item.quantity;
    return `
      <article class="order-item" data-id="${item.product_id}">
        <div style="display:flex;gap:.7rem;align-items:center;">
          <img src="${item.image_url || 'https://placehold.co/120x80?text=Product'}" alt="${item.name}" style="width:90px;height:66px;object-fit:cover;border-radius:10px;">
          <div style="flex:1;">
            <strong>${item.name}</strong>
            <div class="muted">${formatPrice(item.final_price)} x ${item.quantity}</div>
          </div>
          <button class="btn ghost remove-btn">Rimuovi</button>
        </div>
      </article>
    `;
  }).join('');

  document.getElementById('cart-total').textContent = `Totale: ${formatPrice(total)}`;

  mount.querySelectorAll('.remove-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const card = event.target.closest('[data-id]');
      const id = Number(card.dataset.id);
      const next = getCart().filter((item) => item.product_id !== id);
      saveCart(next);
      renderCart();
    });
  });
}

async function checkout() {
  if (!ensureLoggedIn()) {
    return;
  }

  const cart = getCart();
  if (cart.length === 0) {
    showStatus('Il carrello e vuoto.', 'error');
    return;
  }

  try {
    const items = cart.map((item) => ({
      productId: item.product_id,
      quantity: item.quantity
    }));

    await apiFetch('/cart/checkout', {
      method: 'POST',
      body: JSON.stringify({ items })
    }, true);

    saveCart([]);
    renderCart();
    showStatus('Ordine completato con successo.', 'success');
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

async function initCart() {
  await refreshCurrentUser();
  renderHeader('cart');
  renderCart();

  document.getElementById('checkout-btn').addEventListener('click', checkout);
  document.getElementById('clear-cart-btn').addEventListener('click', () => {
    saveCart([]);
    renderCart();
  });
}

initCart();
