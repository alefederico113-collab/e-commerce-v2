# Compito E-Commerce

Repository unica per progetto e-commerce con:
- Backend Node.js + Express deployabile su Render
- Frontend statico deployabile su GitHub Pages
- Database su Supabase con persistenza reale

## Link live

- Backend health: https://e-commerce-v2-k1bl.onrender.com/api/health
- Frontend (GitHub Pages): https://alefederico113-collab.github.io/e-commerce-v2/

## Struttura repository

```text
backend/
  database/schema.sql
  .env.example
  package.json
  server.js
frontend/
  index.html
  admin.html
  app.js
  admin.js
  config.js
  style.css
render.yaml
.gitignore
README.md
```

## Funzionalita

- Vista store con prodotti caricati da API
- Acquisto reale (`/api/buy`) con controllo crediti e stock
- Pannello admin per:
  - aggiungere prodotti
  - aggiornare stock
  - assegnare crediti utenti
- Endpoint salute backend: `/api/health`

## 1) Setup database (Supabase)

1. Crea un progetto Supabase.
2. Apri SQL Editor e incolla il contenuto di `backend/database/schema.sql`.
3. Salva i valori:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (segreta)

## 2) Avvio locale

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm start
```

Compila `.env` con i valori reali di Supabase.

### Frontend

Apri `frontend/index.html` in browser o con Live Server.

Prima modifica `frontend/config.js` e imposta:
- `API_URL` su `http://localhost:3000/api` per locale
- `DEFAULT_USER_ID` (es. `1`)

## 3) Deploy backend su Render

1. Pusha repository su GitHub.
2. Su Render crea servizio Web da repository.
3. Root directory: `backend` (oppure usa `render.yaml`).
4. Build command: `npm install`
5. Start command: `npm start`
6. Aggiungi env variables in Render:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FRONTEND_ORIGIN=https://TUO-USERNAME.github.io`
7. Deploy e verifica `https://...onrender.com/api/health`

## 4) Deploy frontend su GitHub Pages

1. In GitHub vai su Settings -> Pages.
2. Source: Deploy from a branch.
3. Branch: `main`, folder: `/frontend`.
4. In `frontend/config.js` imposta `API_URL` con URL Render:
   - `https://NOME-SERVIZIO.onrender.com/api`
5. Apri URL Pages e testa store/admin.

## Sicurezza

- `.env` e file sensibili non vanno nel repository grazie a `.gitignore`.
- Non pubblicare mai `SUPABASE_SERVICE_ROLE_KEY`.
- Nel tuo progetto la chiave Supabase era hardcoded in passato: ruotala da dashboard Supabase prima del deploy definitivo.

## API principali

- `GET /api/health`
- `GET /api/products`
- `GET /api/users/:id`
- `POST /api/buy` body: `{ "userId": 1, "productId": 2 }`
- `POST /api/admin/products` body: `{ "name": "Prodotto", "price": 20, "stock": 3 }`
- `PUT /api/admin/products/:id` body: `{ "stock": 10 }`
- `POST /api/admin/users/:id/credits` body: `{ "amount": 50 }`

## Stato progetto

- Struttura repository pronta per consegna GitHub.
- Backend e frontend allineati alla stessa API.
- Configurazione deploy Render + GitHub Pages documentata.
