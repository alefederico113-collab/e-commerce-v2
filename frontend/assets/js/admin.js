function asInt(value) {
    const n = Number(value);
    return Number.isInteger(n) ? n : null;
}

function renderMetrics(metrics) {
    document.getElementById('metric-users').textContent = metrics.users;
    document.getElementById('metric-products').textContent = metrics.products;
    document.getElementById('metric-orders').textContent = metrics.orders;
    document.getElementById('metric-pending').textContent = metrics.pending_orders;
}

function orderStatusOptions(selected) {
    const values = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    return values.map((value) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${value}</option>`).join('');
}

async function loadAdminOrders() {
    const orders = await apiFetch('/admin/orders', {}, true);
    const list = document.getElementById('admin-orders-list');

    if (orders.length === 0) {
        list.innerHTML = '<p class="muted">Nessun ordine disponibile.</p>';
        return;
    }

    list.innerHTML = orders.map((order) => `
        <article class="order-item" data-id="${order.id}">
            <div style="display:flex;justify-content:space-between;gap:.8rem;flex-wrap:wrap;">
                <strong>Ordine #${order.id}</strong>
                <span class="pill">${order.status}</span>
            </div>
            <p class="muted">${new Date(order.created_at).toLocaleString('it-IT')} · ${order.user?.name || 'Utente'} (${order.user?.email || 'n/a'})</p>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
                <select class="input status-select">${orderStatusOptions(order.status)}</select>
                <button class="btn ghost update-order-btn">Aggiorna stato</button>
            </div>
        </article>
    `).join('');

    list.querySelectorAll('.update-order-btn').forEach((btn) => {
        btn.addEventListener('click', async (event) => {
            const card = event.target.closest('[data-id]');
            const orderId = Number(card.dataset.id);
            const status = card.querySelector('.status-select').value;

            try {
                await apiFetch(`/admin/orders/${orderId}/status`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status })
                }, true);
                showStatus('Stato ordine aggiornato.', 'success');
                await loadAdminOrders();
            } catch (error) {
                showStatus(error.message, 'error');
            }
        });
    });
}

async function loadAdminProducts() {
    const products = await apiFetch('/products');
    const list = document.getElementById('products-admin-list');

    if (products.length === 0) {
        list.innerHTML = '<p class="muted">Nessun prodotto presente.</p>';
        return;
    }

    list.innerHTML = products.map((product) => `
        <article class="order-item" data-id="${product.id}">
            <div style="display:flex;justify-content:space-between;gap:.8rem;flex-wrap:wrap;">
                <strong>${product.name}</strong>
                <span class="pill">${formatPrice(product.final_price)}</span>
            </div>
            <p class="muted">Categoria: ${product.category || 'Tech'} · Stock: ${product.stock} · Sconto: ${product.discount_percent}%</p>
            <div style="display:grid;grid-template-columns:repeat(2,minmax(120px,1fr));gap:.5rem;">
                <input class="input stock-input" type="number" min="0" step="1" value="${product.stock}">
                <input class="input discount-input" type="number" min="0" max="90" step="1" value="${product.discount_percent}">
            </div>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.5rem;">
                <button class="btn ghost update-stock-btn">Aggiorna stock</button>
                <button class="btn ghost update-discount-btn">Aggiorna sconto</button>
                <button class="btn ghost edit-product-btn">Modifica prodotto</button>
                <button class="btn danger delete-product-btn">Rimuovi prodotto</button>
            </div>
        </article>
    `).join('');

    list.querySelectorAll('.update-stock-btn').forEach((btn) => {
        btn.addEventListener('click', async (event) => {
            const card = event.target.closest('[data-id]');
            const productId = Number(card.dataset.id);
            const stock = asInt(card.querySelector('.stock-input').value);

            if (stock === null || stock < 0) {
                showStatus('Stock non valido.', 'error');
                return;
            }

            try {
                await apiFetch(`/admin/products/${productId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ stock })
                }, true);
                showStatus('Stock aggiornato.', 'success');
                await loadAdminProducts();
            } catch (error) {
                showStatus(error.message, 'error');
            }
        });
    });

    list.querySelectorAll('.update-discount-btn').forEach((btn) => {
        btn.addEventListener('click', async (event) => {
            const card = event.target.closest('[data-id]');
            const productId = Number(card.dataset.id);
            const discount = asInt(card.querySelector('.discount-input').value);

            if (discount === null || discount < 0 || discount > 90) {
                showStatus('Sconto non valido (0-90).', 'error');
                return;
            }

            try {
                await apiFetch(`/admin/products/${productId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ discount_percent: discount })
                }, true);
                showStatus('Sconto aggiornato.', 'success');
                await loadAdminProducts();
            } catch (error) {
                showStatus(error.message, 'error');
            }
        });
    });

    list.querySelectorAll('.edit-product-btn').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            const card = event.target.closest('[data-id]');
            const productId = Number(card.dataset.id);
            const product = products.find(p => p.id === productId);
            if (product) {
                populateEditForm(product);
            }
        });
    });

    list.querySelectorAll('.delete-product-btn').forEach((btn) => {
        btn.addEventListener('click', async (event) => {
            const card = event.target.closest('[data-id]');
            const productId = Number(card.dataset.id);
            const productName = card.querySelector('strong').textContent;

            if (confirm(`Sei sicuro di voler rimuovere "${productName}"? Questa azione non può essere annullata.`)) {
                try {
                    await apiFetch(`/admin/products/${productId}`, {
                        method: 'DELETE'
                    }, true);
                    showStatus('Prodotto rimosso.', 'success');
                    await loadAdminProducts();
                    await loadMetrics();
                } catch (error) {
                    showStatus(error.message, 'error');
                }
            }
        });
    });
}

function populateEditForm(product) {
    document.getElementById('p-name').value = product.name;
    document.getElementById('p-description').value = product.description;
    document.getElementById('p-category').value = product.category;
    document.getElementById('p-image').value = product.image_url || '';
    document.getElementById('p-price').value = product.price;
    document.getElementById('p-stock').value = product.stock;
    document.getElementById('p-discount').value = product.discount_percent;

    const form = document.getElementById('add-product-form');
    form.dataset.editId = product.id;
    form.querySelector('button[type="submit"]').textContent = 'Aggiorna prodotto';
    form.insertAdjacentHTML('afterend', '<button id="cancel-edit-btn" class="btn ghost" type="button">Annulla modifica</button>');
    document.getElementById('cancel-edit-btn').addEventListener('click', resetForm);
}

function resetForm() {
    const form = document.getElementById('add-product-form');
    form.reset();
    delete form.dataset.editId;
    form.querySelector('button[type="submit"]').textContent = 'Crea prodotto';
    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) cancelBtn.remove();
}

async function createProduct(event) {
    event.preventDefault();

    const payload = {
        name: document.getElementById('p-name').value.trim(),
        description: document.getElementById('p-description').value.trim(),
        category: document.getElementById('p-category').value.trim(),
        image_url: document.getElementById('p-image').value.trim(),
        price: Number(document.getElementById('p-price').value),
        stock: Number(document.getElementById('p-stock').value),
        discount_percent: Number(document.getElementById('p-discount').value)
    };

    const form = event.target;
    const editId = form.dataset.editId;

    try {
        if (editId) {
            await apiFetch(`/admin/products/${editId}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            }, true);
            showStatus('Prodotto aggiornato.', 'success');
        } else {
            await apiFetch('/admin/products', {
                method: 'POST',
                body: JSON.stringify(payload)
            }, true);
            showStatus('Prodotto creato.', 'success');
        }
        resetForm();
        await loadAdminProducts();
        await loadMetrics();
    } catch (error) {
        showStatus(error.message, 'error');
    }
}

async function addCredits(event) {
    event.preventDefault();
    const userId = asInt(document.getElementById('bonus-user-id').value);
    const amount = asInt(document.getElementById('bonus-amount').value);

    if (!userId || !amount || amount <= 0) {
        showStatus('User ID e crediti devono essere validi.', 'error');
        return;
    }

    try {
        await apiFetch(`/admin/users/${userId}/credits`, {
            method: 'POST',
            body: JSON.stringify({ amount })
        }, true);
        showStatus('Crediti aggiunti con successo.', 'success');
        event.target.reset();
    } catch (error) {
        showStatus(error.message, 'error');
    }
}

async function loadMetrics() {
    const metrics = await apiFetch('/admin/dashboard', {}, true);
    renderMetrics(metrics);
}

async function importTechProducts() {
    try {
        const result = await apiFetch('/admin/import-tech-products', { method: 'POST' }, true);
        showStatus(`${result.message} (${result.imported || 0})`, 'success');
        await loadAdminProducts();
        await loadMetrics();
    } catch (error) {
        showStatus(error.message, 'error');
    }
}

async function initAdmin() {
    await refreshCurrentUser();
    renderHeader('admin');

    if (!ensureLoggedIn()) {
        return;
    }
    if (!ensureAdmin()) {
        return;
    }

    document.getElementById('add-product-form').addEventListener('submit', createProduct);
    document.getElementById('add-credits-form').addEventListener('submit', addCredits);
    document.getElementById('import-tech-btn').addEventListener('click', importTechProducts);
    document.getElementById('refresh-products-btn').addEventListener('click', loadAdminProducts);

    try {
        await Promise.all([loadMetrics(), loadAdminOrders(), loadAdminProducts()]);
        showStatus('Dashboard admin caricata.', 'success');
    } catch (error) {
        showStatus(error.message, 'error');
    }
}

initAdmin();