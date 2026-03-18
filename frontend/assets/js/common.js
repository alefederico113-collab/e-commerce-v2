const API_URL = window.APP_CONFIG?.API_URL || 'http://localhost:3000/api';
const TOKEN_KEY = 'ecom_token';
const USER_KEY = 'ecom_user';
const CART_KEY = 'ecom_cart';

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
}

function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

function getCart() {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderHeader();
}

function animateCartAdd(sourceEl = null) {
    const cartLink = document.querySelector('.main-nav a[href="cart.html"]');
    const cartPill = cartLink?.querySelector('.pill');
    const targetEl = cartPill || cartLink;

    if (!targetEl) {
        return;
    }

    targetEl.classList.remove('cart-pill-bump');
    void targetEl.offsetWidth;
    targetEl.classList.add('cart-pill-bump');

    if (!sourceEl || !sourceEl.getBoundingClientRect) {
        return;
    }

    const from = sourceEl.getBoundingClientRect();
    const to = targetEl.getBoundingClientRect();

    const dot = document.createElement('span');
    dot.className = 'cart-fly-dot';
    dot.style.left = `${from.left + from.width / 2}px`;
    dot.style.top = `${from.top + from.height / 2}px`;
    document.body.appendChild(dot);

    const deltaX = (to.left + to.width / 2) - (from.left + from.width / 2);
    const deltaY = (to.top + to.height / 2) - (from.top + from.height / 2);

    requestAnimationFrame(() => {
        dot.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.55)`;
        dot.style.opacity = '0.18';
    });

    setTimeout(() => {
        dot.remove();
    }, 650);
}

function addToCart(product, quantity = 1, sourceEl = null) {
    const cart = getCart();
    const existing = cart.find((item) => item.product_id === product.id);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({
            product_id: product.id,
            name: product.name,
            image_url: product.image_url,
            final_price: product.final_price,
            quantity
        });
    }
    saveCart(cart);
    animateCartAdd(sourceEl);
}

function cartCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function formatPrice(value) {
    return `${Number(value).toLocaleString('it-IT')} crediti`;
}

async function apiFetch(path, options = {}, auth = false) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (auth) {
        const token = getToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.error || 'Errore API.');
        error.status = response.status;
        throw error;
    }

    return data;
}

function renderHeader(activePage = '') {
    const mount = document.getElementById('site-header');
    if (!mount) {
        return;
    }

    const user = getCurrentUser();
    const isAdmin = user?.role === 'admin';

    mount.innerHTML = `
        <header class="top-nav">
            <a class="brand" href="index.html">
                <span class="brand-badge">NEON</span>
                <div>
                    <strong>TechVerse Market</strong>
                    <small>E-commerce Hub</small>
                </div>
            </a>
            <nav class="main-nav">
                <a class="${activePage === 'home' ? 'active' : ''}" href="index.html">Home</a>
                <a class="${activePage === 'search' ? 'active' : ''}" href="search.html">Ricerca</a>
                <a class="${activePage === 'orders' ? 'active' : ''}" href="orders.html">I miei ordini</a>
                <a class="${activePage === 'cart' ? 'active' : ''}" href="cart.html">Carrello <span class="pill">${cartCount()}</span></a>
                ${isAdmin ? `<a class="${activePage === 'admin' ? 'active' : ''}" href="admin.html">Dashboard Admin</a>` : ''}
            </nav>
            <div class="auth-zone">
                     ${user
                          ? `<div class="user-chip">${user.name} <span>${user.role}</span></div>
                              <button id="signout-btn" class="btn ghost">Sign out</button>`
                          : `<a class="btn ghost" href="login.html">Log in</a>
                              <a class="btn" href="signup.html">Sign up</a>`}
            </div>
        </header>
    `;

    const signoutBtn = document.getElementById('signout-btn');
    if (signoutBtn) {
        signoutBtn.addEventListener('click', () => {
            clearSession();
            window.location.href = 'index.html';
        });
    }
}

function showStatus(message, type = 'info') {
    const box = document.getElementById('status-box');
    if (!box) {
        return;
    }
    box.textContent = message;
    box.className = `status ${type}`;
}

async function refreshCurrentUser() {
    const token = getToken();
    if (!token) {
        return null;
    }

    try {
        const user = await apiFetch('/auth/me', {}, true);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
    } catch (error) {
        clearSession();
        return null;
    }
}

function ensureLoggedIn() {
    if (!getToken()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function ensureAdmin() {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}
