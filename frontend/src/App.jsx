// App.jsx

import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Magazzino from './pages/Magazzino'
import AcquistoPlugin from './pages/AcquistoPlugin'
import StoricoDispositivi from './pages/StoricoDispositivi'
import Riparazioni from './pages/Riparazioni'
import Servizi from './pages/Servizi'
import Clienti from './pages/Clienti'
import ImportExport from './pages/ImportExport'
import Storico from './pages/Storico'
import ValutazioneDisplay from './pages/ValutazioneDisplay'
import Noleggio from './pages/Noleggio'
import Cassa from './pages/Cassa'
import Protezione from './pages/Protezione'
import Impostazioni from './pages/Impostazioni'
import FirmaRemota from './pages/FirmaRemota'
import Toast from './components/Toast'
import Calendario from './pages/Calendario'

const INIT_PATH = window.__INIT_PATH__ || window.location.pathname
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [toasts, setToasts] = useState([])
  const [creaNuovoAction, setCreaNuovoAction] = useState(null)
  const [showCN, setShowCN] = useState(false)
  useEffect(()=>{const f=(e)=>{if(e.key==='Escape')setShowCN(false)};window.addEventListener('keydown',f);return()=>window.removeEventListener('keydown',f)},[])

  if (INIT_PATH.startsWith('/firma')) return <FirmaRemota />

  const showToast = (msg, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  const handleCreaNuovo = (id) => {
    setShowCN(false)
    switch(id) {
      case 'dispositivo': setCurrentPage('magazzino'); setCreaNuovoAction('nuovo_prodotto'); break
      case 'acquisto_privato': setCurrentPage('storico-dispositivi'); setCreaNuovoAction(null); break
      case 'vendita': setCurrentPage('storico-dispositivi'); setCreaNuovoAction(null); break
      case 'riparazione': setCurrentPage('riparazioni'); setCreaNuovoAction('nuova_riparazione'); break
      case 'cliente': setCurrentPage('clienti'); setCreaNuovoAction('nuovo_cliente'); break
      
