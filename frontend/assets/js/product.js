let currentProductId = null;

function renderReviews(reviews) {
  const mount = document.getElementById('reviews');
  if (reviews.length === 0) {
    mount.innerHTML = '<p class="muted">Nessuna recensione disponibile.</p>';
    return;
  }

  mount.innerHTML = reviews.map((review) => `
    <article class="review-item">
      <strong>${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</strong>
      <p>${review.comment || 'Nessun commento'}</p>
      <small class="muted">${review.user_name} · ${new Date(review.created_at).toLocaleString('it-IT')}</small>
    </article>
  `).join('');
}

function renderProduct(product) {
  const mount = document.getElementById('product-container');
  mount.innerHTML = `
    <div class="product-detail">
      <img src="${product.image_url || 'https://placehold.co/900x600?text=Product'}" alt="${product.name}">
      <div>
        <div class="product-header">
          <h2 style="margin-top:0;font-family:Syne,sans-serif;">${product.name}</h2>
          ${isNewProduct(product) ? '<span class="new-badge">Nuovo</span>' : ''}
        </div>
        <p class="muted">${product.category || 'Tech'}</p>
        <p>${product.description || 'Nessuna descrizione disponibile.'}</p>
        <div class="product-meta">
          <div class="price-stack">
            ${product.discount_percent > 0 ? `<span class="old-price">${formatPrice(product.price)}</span>` : ''}
            <span class="new-price">${formatPrice(product.final_price)}</span>
          </div>
          ${product.discount_percent > 0 ? `<span class="discount-tag">-${product.discount_percent}%</span>` : ''}
        </div>
        <p class="${product.stock === 0 ? 'stock-out' : 'stock-ok'}">Stock: ${product.stock}</p>
        <div style="display:flex;gap:.6rem;">
          <button id="add-cart-btn" class="btn" ${product.stock === 0 ? 'disabled' : ''}>Aggiungi al carrello</button>
          <a class="btn ghost" href="search.html">Torna alla ricerca</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('add-cart-btn')?.addEventListener('click', (event) => {
    addToCart(product, 1, event.currentTarget);
    showStatus('Prodotto aggiunto al carrello.', 'success');
  });
}

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  currentProductId = Number(params.get('id'));

  if (!Number.isInteger(currentProductId) || currentProductId <= 0) {
    showStatus('ID prodotto non valido.', 'error');
    return;
  }

  try {
    const data = await apiFetch(`/products/${currentProductId}`);
    renderProduct(data.product);
    renderReviews(data.reviews);
    showStatus('Dettagli prodotto caricati.', 'success');
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

async function submitReview(event) {
  event.preventDefault();
  if (!ensureLoggedIn()) {
    return;
  }

  try {
    const rating = Number(document.getElementById('review-rating').value);
    const comment = document.getElementById('review-comment').value.trim();
    await apiFetch(`/products/${currentProductId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment })
    }, true);
    showStatus('Recensione pubblicata.', 'success');
    event.target.reset();
    await loadProduct();
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

async function initProductPage() {
  await refreshCurrentUser();
  renderHeader();
  await loadProduct();
  document.getElementById('review-form').addEventListener('submit', submitReview);
}

initProductPage();
