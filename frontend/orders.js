function renderOrders(orders) {
  const mount = document.getElementById('orders-list');
  if (orders.length === 0) {
    mount.innerHTML = '<p class="muted">Non hai ancora ordini.</p>';
    return;
  }

  mount.innerHTML = orders.map((order) => `
    <article class="order-item">
      <div style="display:flex;justify-content:space-between;gap:.8rem;flex-wrap:wrap;">
        <strong>Ordine #${order.id}</strong>
        <span class="pill">${order.status}</span>
      </div>
      <p class="muted">${new Date(order.created_at).toLocaleString('it-IT')} · Totale: ${formatPrice(order.total)}</p>
      <ul>
        ${order.items.map((item) => `<li>${item.product_name} x ${item.quantity} (${formatPrice(item.unit_price)})</li>`).join('')}
      </ul>
    </article>
  `).join('');
}

async function initOrders() {
  await refreshCurrentUser();
  renderHeader('orders');

  if (!ensureLoggedIn()) {
    return;
  }

  try {
    const orders = await apiFetch('/orders', {}, true);
    renderOrders(orders);
    showStatus('Ordini caricati.', 'success');
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

initOrders();
