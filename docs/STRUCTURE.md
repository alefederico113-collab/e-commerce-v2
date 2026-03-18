# Repository Structure

Questo repository usa una struttura monorepo ordinata:

```text
backend/
  database/
    schema.sql
  src/
    server.js
  .env.example
  package.json
  package-lock.json

frontend/
  assets/
    css/
      style.css
    js/
      admin.js
      app.js
      cart.js
      common.js
      config.js
      login.js
      orders.js
      product.js
      search.js
      signup.js
  admin.html
  cart.html
  index.html
  login.html
  orders.html
  product.html
  search.html
  signup.html

/docs
  STRUCTURE.md

render.yaml
README.md
index.html
```

## Convenzioni

- Tutto il codice backend sta in `backend/src`.
- Asset frontend statici sono separati in `frontend/assets/css` e `frontend/assets/js`.
- Le pagine HTML restano nella root `frontend/` per compatibilita con GitHub Pages.
- Configurazione database e provisioning rimangono centralizzati in `backend/database/schema.sql`.
