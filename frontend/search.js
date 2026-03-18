function renderResults(products) {
  const grid = document.getElementById('results-grid');
  grid.innerHTML = '';

  products.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image_url || 'https://placehold.co/640x360?text=Tech+Product'}" alt="${product.name}">
      <div class="product-body">
        <h4 class="product-title">${product.name}</h4>
        <p class="muted">${product.description.slice(0, 95)}...</p>
        <div class="product-meta">
          <span class="new-price">${formatPrice(product.final_price)}</span>
          ${product.discount_percent > 0 ? `<span class="discount-tag">-${product.discount_percent}%</span>` : ''}
        </div>
        <div class="product-actions">
          <a class="btn ghost" href="product.html?id=${product.id}">Apri</a>
          <button class="btn" data-id="${product.id}" ${product.stock === 0 ? 'disabled' : ''}>Carrello</button>
        </div>
      </div>
    `;

    card.querySelector('button')?.addEventListener('click', () => {
      addToCart(product, 1);
      showStatus('Aggiunto al carrello.', 'success');
    });

    grid.appendChild(card);
  });
}

async function doSearch(query) {
  try {
    const products = await apiFetch(`/products?search=${encodeURIComponent(query)}`);
    if (products.length === 0) {
      showStatus('Nessun risultato trovato.', 'info');
    } else {
      showStatus(`Trovati ${products.length} prodotti.`, 'success');
    }
    renderResults(products);
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

async function initSearch() {
  await refreshCurrentUser();
  renderHeader('search');

  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q') || '';
  input.value = initialQuery;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = input.value.trim();
    const url = new URL(window.location.href);
    if (query) {
      url.searchParams.set('q', query);
    } else {
      url.searchParams.delete('q');
    }
    window.history.replaceState({}, '', url);
    doSearch(query);
  });

  if (initialQuery) {
    await doSearch(initialQuery);
  }
}

initSearch();
