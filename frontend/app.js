const API_URL = window.APP_CONFIG?.API_URL || 'http://localhost:3000/api';
const DEFAULT_USER_ID = window.APP_CONFIG?.DEFAULT_USER_ID || 1;

let currentUser = null;

function showMessage(message, type = 'success') {
    const box = document.getElementById('status-message');
    if (!box) {
        return;
    }

    box.textContent = message;
    box.className = `status-message ${type}`;
}

function setLoading(button, isLoading) {
    if (!button) {
        return;
    }
    button.disabled = isLoading;
    button.dataset.originalText = button.dataset.originalText || button.textContent;
    button.textContent = isLoading ? 'Attendere...' : button.dataset.originalText;
}

async function loadUser() {
    const response = await fetch(`${API_URL}/users/${DEFAULT_USER_ID}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Errore caricamento utente.');
    }

    currentUser = data;
    const creditsElement = document.getElementById('user-credits');
    const userNameElement = document.getElementById('user-name');

    if (creditsElement) {
        creditsElement.textContent = currentUser.credits;
    }

    if (userNameElement) {
        userNameElement.textContent = currentUser.name;
    }
}

async function loadProducts() {
    const response = await fetch(`${API_URL}/products`);
    const products = await response.json();

    if (!response.ok) {
        throw new Error(products.error || 'Errore caricamento prodotti.');
    }

    const grid = document.getElementById('product-grid');
    if (!grid) {
        return;
    }

    grid.innerHTML = '';

    products.forEach((product) => {
        const card = document.createElement('article');
        card.className = 'product-card';

        const stockStatus = product.stock > 0 ? `${product.stock} disponibili` : 'Esaurito';

        card.innerHTML = `
            <h3>${product.name}</h3>
            <p class="price">${product.price} crediti</p>
            <p class="stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">${stockStatus}</p>
            <button class="buy-btn" data-product-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>Compra ora</button>
        `;

        const button = card.querySelector('.buy-btn');
        button?.addEventListener('click', () => handleBuy(product.id, button));

        grid.appendChild(card);
    });
}

async function handleBuy(productId, button) {
    try {
        setLoading(button, true);

        const response = await fetch(`${API_URL}/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: DEFAULT_USER_ID, productId })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Acquisto fallito.');
        }

        showMessage(data.message, 'success');
        await loadUser();
        await loadProducts();
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        setLoading(button, false);
    }
}

async function initStore() {
    try {
        await loadUser();
        await loadProducts();
        showMessage('Store caricato con successo.', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

initStore();