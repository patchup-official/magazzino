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

const INIT_PATH = window.__INIT_PATH__ || window.location.pathname
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [toasts, setToasts] = useState([])
  const [creaNuovoAction, setCreaNuovoAction] = useState(null)

  if (INIT_PATH.startsWith('/firma')) return <FirmaRemota />

  const showToast = (msg, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  const handleCreaNuovo = (id) => {
    switch(id) {
      case 'riparazione': setCurrentPage('riparazioni'); setCreaNuovoAction('nuova_riparazione'); break
      case 'servizio': setCurrentPage('servizi'); setCreaNuovoAction('nuovo_servizio'); break
      case 'cliente': setCurrentPage('clienti'); setCreaNuovoAction('nuovo_cliente'); break
      case 'prodotto': setCurrentPage('magazzino'); setCreaNuovoAction('nuovo_prodotto'); break
      case 'ricambio': setCurrentPage('magazzino'); setCreaNuovoAction('nuovo_ricambio'); break
      case 'da_privato': setCurrentPage('acquisto'); setCreaNuovoAction(null); break
      case 'da_fornitore': setCurrentPage('magazzino'); setCreaNuovoAction('nuovo_dispositivo'); break
    }
  }

  const titles = {
    dashboard: 'Homepage', magazzino: 'Magazzino', servizi: 'Servizi',
    acquisto: 'Acquisto dispositivo', riparazioni: 'Riparazioni',
    'storico-dispositivi': 'Storico Dispositivi',
    storico: 'Storico acquisti', clienti: 'Clienti',
    importexport: 'Import / Export', protezione: 'Protezione Dispositivo',
    valutazione: 'Valutazione Display',
    noleggio: 'Noleggio Subbyx',
    cassa: 'Chiusura Cassa',
  }

  const pages = {
    dashboard: Dashboard, magazzino: Magazzino, servizi: Servizi,
    acquisto: AcquistoPlugin, riparazioni: Riparazioni,
    'storico-dispositivi': StoricoDispositivi,
    storico: Storico, clienti: Clienti,
    importexport: ImportExport, protezione: Protezione,
    valutazione: ValutazioneDisplay,
    noleggio: Noleggio,
    cassa: Cassa,
  }
  const PageComponent = pages[currentPage] || Dashboard

  return (
    <div style={{ display:'flex', height:'100vh', background:'#080e1f', overflow:'hidden' }}>
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => { setCurrentPage(page); setCreaNuovoAction(null) }}
        onCreaNuovo={handleCreaNuovo}
      />
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{
          height:52, borderBottom:'1px solid rgba(255,255,255,0.05)',
          background:'#090e1e', display:'flex', alignItems:'center',
          justifyContent:'space-between', padding:'0 24px', flexShrink:0,
        }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#e2e8f0' }}>{titles[currentPage]}</div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <Clock />
            <div style={{
              display:'flex', alignItems:'center', gap:8,
              background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:8, padding:'5px 12px', cursor:'pointer',
            }}>
              <span style={{ fontSize:12 }}>▣</span>
              <span style={{ fontSize:12.5, color:'#94a3b8' }}>Negozio principale</span>
              <span style={{ fontSize:10, color:'#475569' }}>▾</span>
            </div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:24 }} className="custom-scroll">
          <PageComponent
            api={API} showToast={showToast}
            onNavigate={(page) => { setCurrentPage(page); setCreaNuovoAction(null) }}
            autoAction={creaNuovoAction}
            onAutoActionDone={() => setCreaNuovoAction(null)}
          />
        </div>
      </main>
      <div style={{ position:'fixed', bottom:20, right:20, display:'flex', flexDirection:'column', gap:8, zIndex:50 }}>
        {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} />)}
      </div>
    </div>
  )
}

function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' }))
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i)
  }, [])
  return <span style={{ fontSize:12, color:'#475569', fontFamily:'monospace' }}>{time}</span>
}
