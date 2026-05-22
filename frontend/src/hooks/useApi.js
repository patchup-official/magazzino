// useApi.js — hook per chiamate API autenticate
// AGGIUNGI in: frontend/src/hooks/useApi.js
//
// Nelle pagine esistenti che ricevono { api, authFetch }
// puoi continuare ad usare fetch() normale sostituendo:
//
//   fetch(`${api}/devices`)
// con:
//   authFetch('/devices')
//
// authFetch aggiunge automaticamente il token JWT
// ed è già disponibile come prop in tutte le pagine (passato da App.jsx)

import { useAuth } from '../context/AuthContext'

export function useApi() {
  const { authFetch, user } = useAuth()
  return { authFetch, user }
}

// ── GUIDA RAPIDA alla migrazione ─────────────────────────────────────────
//
// PRIMA (nelle tue pagine):
//   const res = await fetch(`${api}/repairs`)
//   const res = await fetch(`${api}/repairs`, { method: 'POST', body: ... })
//
// DOPO (nelle tue pagine):
//   const res = await authFetch('/repairs')
//   const res = await authFetch('/repairs', { method: 'POST', body: ... })
//
// authFetch:
//   - aggiunge Header Authorization: Bearer <token>
//   - aggiunge Header Content-Type: application/json  
//   - usa automaticamente VITE_API_URL come base
//   - funziona identicamente a fetch() per il resto
//
// Le pagine ricevono già authFetch come prop da App.jsx:
//   export default function Riparazioni({ api, authFetch, showToast, ... })
//   { ... }
//
// Se preferisci non modificare le firme, usa il hook:
//   import { useApi } from '../hooks/useApi'
//   const { authFetch } = useApi()
