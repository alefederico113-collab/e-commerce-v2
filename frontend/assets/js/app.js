async function loadHomeProducts() {
    const products = await apiFetch('/products');
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    products.slice(0, 8).forEach((product) => {
        const stockClass = product.stock === 0 ? 'stock-out' : (product.stock < 5 ? 'stock-low' : 'stock-ok');
        const stockText = product.stock === 0 ? 'Esaurito' : `${product.stock} disponibili`;

        const card = document.createElement('article');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image_url || 'https://placehold.co/640x360?text=Tech+Product'}" alt="${product.name}">
            <div class="product-body">
                <div class="product-header">
                    <h4 class="product-title">${product.name}</h4>
                    ${isNewProduct(product) ? '<span class="new-badge">Nuovo</span>' : ''}
                </div>
                <p class="muted">${product.category || 'Tech'}</p>
                <div class="product-meta">
                    <div class="price-stack">
                        ${product.discount_percent > 0 ? `<span class="old-price">${formatPrice(product.price)}</span>` : ''}
                        <span class="new-price">${formatPrice(product.final_price)}</span>
                    </div>
                    ${product.discount_percent > 0 ? `<span class="discount-tag">-${product.discount_percent}%</span>` : ''}
                </div>
                <div class="${stockClass}">${stockText}</div>
                <div class="product-actions">
                    <a class="btn ghost" href="product.html?id=${product.id}">Dettagli</a>
                    <button class="btn" data-id="${product.id}" ${product.stock === 0 ? 'disabled' : ''}>Aggiungi</button>
                </div>
            </div>
        `;

        const addBtn = card.querySelector('button');
        addBtn?.addEventListener('click', () => {
            addToCart(product, 1, addBtn);
            showStatus('Prodotto aggiunto al carrello.', 'success');
        });

        grid.appendChild(card);
    });
}

async function initHome() {
    await refreshCurrentUser();
    renderHeader('home');

    const user = getCurrentUser();
    const quickPanel = document.getElementById('quick-account-panel');
    const quick = document.getElementById('quick-user');

    if (quickPanel) {
        quickPanel.style.display = user ? 'none' : '';
    }

    if (quick && user) {
        quick.textContent = `${user.name} (${user.role}) - crediti: ${user.credits}`;
    }

    try {
        await loadHomeProducts();
        showStatus('Catalogo aggiornato.', 'success');
    } catch (error) {
        showStatus(error.message, 'error');
    }
}

initHome();