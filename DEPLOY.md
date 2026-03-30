# 🚀 Guida Deploy: GitHub + Render

## Struttura repository

```
magazzino/                  ← root del repository
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── db/schema.sql
│   └── routes/
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── render.yaml
├── .gitignore
└── README.md
```

---

## FASE 1 — Crea il repository su GitHub

1. Vai su https://github.com/new
2. Nome repository: `magazzino`
3. Visibilità: **Public** (necessario per Render gratuito)
4. NON spuntare "Add README" (lo carichiamo noi)
5. Clicca **Create repository**

---

## FASE 2 — Carica i file su GitHub

Apri il terminale nella cartella del progetto:

```bash
cd magazzino

# Inizializza git
git init
git add .
git commit -m "feat: Magazzino v2.0 - sistema completo"

# Collega al repository GitHub (sostituisci TUO_USERNAME)
git remote add origin https://github.com/TUO_USERNAME/magazzino.git
git branch -M main
git push -u origin main
```

Verifica su GitHub che tutti i file siano presenti.

---

## FASE 3 — Deploy Backend su Render

1. Vai su https://render.com e accedi (o registrati gratis)
2. Clicca **New → Web Service**
3. Clicca **Connect a repository** → seleziona `magazzino`
4. Configura così:

| Campo | Valore |
|-------|--------|
| **Name** | `magazzino-backend` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | Free |

5. Scorri fino a **Environment Variables** e aggiungi:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | (lo aggiungi dopo, per ora lascia vuoto) |

6. Clicca **Create Web Service**
7. Attendi ~3 minuti il deploy
8. **Copia l'URL** del backend (es. `https://magazzino-backend.onrender.com`)
9. Verifica aprendo: `https://magazzino-backend.onrender.com/health`

---

## FASE 4 — Deploy Frontend su Render

1. Clicca **New → Static Site**
2. Seleziona lo stesso repository `magazzino`
3. Configura così:

| Campo | Valore |
|-------|--------|
| **Name** | `magazzino-frontend` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

4. Scorri fino a **Environment Variables** e aggiungi:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://magazzino-backend.onrender.com` |

5. Aggiungi la **Rewrite Rule** (per React Router):
   - Source: `/*`
   - Destination: `/index.html`

6. Clicca **Create Static Site**
7. Attendi ~2 minuti il build
8. **Copia l'URL** del frontend (es. `https://magazzino-frontend.onrender.com`)

---

## FASE 5 — Collega Frontend ↔ Backend

1. Torna al servizio **magazzino-backend** su Render
2. Vai su **Environment → Edit**
3. Imposta `FRONTEND_URL` = `https://magazzino-frontend.onrender.com`
4. Clicca **Save Changes** → il backend si riavvia automaticamente

---

## FASE 6 — Verifica finale

Apri il frontend: `https://magazzino-frontend.onrender.com`

Testa che tutto funzioni:
- ✅ Dashboard si carica
- ✅ Aggiungi un prodotto in Magazzino
- ✅ Usa il Plugin Acquisto
- ✅ Controlla che il dispositivo appaia in Magazzino

---

## ⚠️ Note importanti piano gratuito Render

**SQLite su Render Free:**
Il piano gratuito NON supporta Persistent Disk. Questo significa che il database SQLite si **resetta ad ogni deploy**. Per la demo va benissimo.

Per dati persistenti in produzione hai due opzioni:

### Opzione A — Upgrade a Render Starter ($7/mese)
Abilita il Persistent Disk montato su `/data`:
```yaml
disk:
  name: magazzino-db
  mountPath: /data
  sizeGB: 1
```
Imposta la variabile `DB_DIR=/data` nel backend.

### Opzione B — Database esterno gratuito (Railway / Supabase)
Migra da SQLite a PostgreSQL (richiede modifica del codice).

---

## 🔄 Aggiornamenti futuri

Ogni volta che modifichi il codice:

```bash
git add .
git commit -m "fix: descrizione modifica"
git push
```

Render fa il redeploy automaticamente in ~2 minuti. ✅
