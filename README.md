# Compito E-Commerce

Piattaforma e-commerce completa con backend API su Render, frontend statico su GitHub Pages e database relazionale su Supabase.

## Link live

- Backend: https://e-commerce-v2-k1bl.onrender.com
- Health API: https://e-commerce-v2-k1bl.onrender.com/api/health
- Frontend (GitHub Pages): https://alefederico113-collab.github.io/e-commerce-v2/

## Funzionalita principali

- UI completamente ridisegnata e responsive
- Autenticazione sicura con signup/login/signout
- Password cifrate con bcrypt + sessione JWT
- Ricerca prodotti e pagine dettaglio prodotto
- Recensioni con rating (1-5)
- Carrello lato frontend e checkout reale lato backend
- Storico ordini utente con stato ordine
- Dashboard admin protetta (solo ruolo admin)
- Gestione admin di:
  - prodotti
  - stock
  - sconti
  - stato ordini
  - crediti utenti
  - import catalogo tech da endpoint dedicato

## Demo credentials

Credenziali seed incluse nello schema DB:

- Admin
  - email: `admin@ecommerce.local`
  - password: `Admin123!`
- Customer
  - email: `user@ecommerce.local`
  - password: `User12345!`

Puoi usare queste credenziali per testare dashboard admin e flusso acquisto.

## Struttura repository

```text
backend/
  database/schema.sql
  .env.example
  package.json
  server.js
frontend/
  index.html
  search.html
  product.html
  cart.html
  orders.html
  login.html
  signup.html
  admin.html
  common.js
  app.js
  search.js
  product.js
  cart.js
  orders.js
  login.js
  signup.js
  admin.js
  config.js
  style.css
render.yaml
.gitignore
README.md
```

## Setup database (Supabase)

1. Crea un progetto Supabase.
2. Apri SQL Editor.
3. Esegui `backend/database/schema.sql`.
4. Salva:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Avvio locale

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm start
```

Configura `.env` con valori reali Supabase e JWT.

### Frontend

Aggiorna `frontend/config.js` con API locale:

```js
window.APP_CONFIG = {
  API_URL: 'http://localhost:3000/api'
};
```

Poi apri `frontend/index.html` tramite browser o Live Server.

## Variabili ambiente backend

- `PORT`
- `FRONTEND_ORIGIN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

## Deploy backend su Render

1. Collega repository a Render.
2. Root directory: `backend` (oppure usa `render.yaml`).
3. Build command: `npm install`
4. Start command: `npm start`
5. Imposta env vars (incluse JWT).
6. Verifica:
   - `/`
   - `/health`
   - `/api/health`

## Deploy frontend su GitHub Pages

1. Settings -> Pages.
2. Source: Deploy from a branch.
3. Branch: `main`, folder: `/frontend`.
4. In `frontend/config.js` imposta URL Render:
   - `https://e-commerce-v2-k1bl.onrender.com/api`

## API principali

- `GET /api/health`
- `GET /api/tech-products`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/products?search=...`
- `GET /api/products/:id`
- `POST /api/products/:id/reviews`
- `POST /api/cart/checkout`
- `GET /api/orders`
- `GET /api/admin/dashboard`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`
- `POST /api/admin/import-tech-products`
- `POST /api/admin/users/:id/credits`

## Sicurezza

- Nessun secret nel repository.
- `.env` ignorato da git.
- Password hashate con bcrypt.
- Rotazione consigliata per chiavi Supabase e JWT in produzione.
