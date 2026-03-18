const API_URL = window.APP_CONFIG?.API_URL || 'http://localhost:3000/api';

function showAdminMessage(message, type = 'success') {
    const box = document.getElementById('admin-message');
    if (!box) {
        return;
    }

    box.textContent = message;
    box.className = `status-message ${type}`;
}

function parsePositiveInt(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
        return null;
    }
    return parsed;
}

async function loadInventory() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();

        if (!response.ok) {
            throw new Error(products.error || 'Errore caricamento inventario.');
        }

        const list = document.getElementById('inventory-list');
        if (!list) {
            return;
        }

        list.innerHTML = '';
        products.forEach((product) => {
            const item = document.createElement('li');
            item.className = 'inventory-item';
            item.innerHTML = `
                <div>
                    <strong>${product.name}</strong><br>
                    <span>${product.price} crediti - stock: ${product.stock}</span>
                </div>
                <form class="stock-form" data-product-id="${product.id}">
                    <input type="number" min="0" value="${product.stock}" required>
                    <button type="submit">Aggiorna stock</button>
                </form>
            `;

            const form = item.querySelector('.stock-form');
            form?.addEventListener('submit', async (event) => {
                event.preventDefault();
                const input = form.querySelector('input');
                const stock = parsePositiveInt(input?.value);
                if (stock === null) {
                    showAdminMessage('Stock non valido.', 'error');
                    return;
                }
                await updateStock(product.id, stock);
            });

            list.appendChild(item);
        });
    } catch (error) {
        showAdminMessage(error.message, 'error');
    }
}

async function updateStock(productId, stock) {
    try {
        const response = await fetch(`${API_URL}/admin/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Aggiornamento stock fallito.');
        }

        showAdminMessage('Stock aggiornato con successo.', 'success');
        await loadInventory();
    } catch (error) {
        showAdminMessage(error.message, 'error');
    }
}

async function handleAddProduct(event) {
    event.preventDefault();

    const name = String(document.getElementById('p-name')?.value || '').trim();
    const price = parsePositiveInt(document.getElementById('p-price')?.value);
    const stock = parsePositiveInt(document.getElementById('p-stock')?.value);

    if (!name || price === null || stock === null) {
        showAdminMessage('Compila correttamente tutti i campi prodotto.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, stock })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Creazione prodotto fallita.');
        }

        showAdminMessage('Prodotto creato con successo.', 'success');
        event.target.reset();
        await loadInventory();
    } catch (error) {
        showAdminMessage(error.message, 'error');
    }
}

async function handleAddCredits(event) {
    event.preventDefault();

    const userId = parsePositiveInt(document.getElementById('bonus-user-id')?.value);
    const amount = parsePositiveInt(document.getElementById('bonus-amount')?.value);

    if (userId === null || amount === null || amount <= 0) {
        showAdminMessage('Inserisci user id e crediti validi.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/credits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Assegnazione crediti fallita.');
        }

        showAdminMessage('Crediti assegnati con successo.', 'success');
        event.target.reset();
    } catch (error) {
        showAdminMessage(error.message, 'error');
    }
}

function initAdmin() {
    const addProductForm = document.getElementById('add-product-form');
    const addCreditsForm = document.getElementById('add-credits-form');

    addProductForm?.addEventListener('submit', handleAddProduct);
    addCreditsForm?.addEventListener('submit', handleAddCredits);

    loadInventory();
}

initAdmin();