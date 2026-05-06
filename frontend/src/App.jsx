undefined// App.jsx

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
      

      case 'movimento': setCurrentPage('magazzino'); setCreaNuovoAction(null); break
      case 'servizio': setCurrentPage('servizi'); setCreaNuovoAction('nuovo_servizio'); break
      case 'da_privato': setCurrentPage('acquisto'); setCreaNuovoAction(null); break
      default: showToast('Funzione in sviluppo ÃÂ°ÃÂÃÂÃÂ§'); break
    }
  }

  const titles = {
    dashboard: 'Homepage', magazzino: 'Magazzino', servizi: 'Servizi',
    acquisto: 'Acquisto dispositivo', riparazioni: 'Riparazioni',
    'storico-dispositivi': 'Storico Dispositivi',
    calendario: 'Calendario',
    storico: 'Storico acquisti', clienti: 'Clienti',
    importexport: 'Import / Export', protezione: 'Protezione Dispositivo',
    impostazioni: 'Impostazioni',
    valutazione: 'Valutazione Display',
    noleggio: 'Noleggio Subbyx',
    cassa: 'Chiusura Cassa',
  }

  const pages = {
    dashboard: Dashboard, magazzino: Magazzino, servizi: Servizi,
    acquisto: AcquistoPlugin, riparazioni: Riparazioni,
    'storico-dispositivi': StoricoDispositivi,
    calendario: Calendario,
    storico: Storico, clienti: Clienti,
    importexport: ImportExport, protezione: Protezione, impostazioni: Impostazioni,
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
            <button onClick={()=>setShowCN(true)} style={{display:'flex',alignItems:'center',gap:7,background:'linear-gradient(135deg,#f97316,#ea580c)',border:'none',borderRadius:10,padding:'7px 16px',cursor:'pointer',fontFamily:'Inter,sans-serif',fontWeight:700,fontSize:13,color:'#fff',boxShadow:'0 2px 12px rgba(249,115,22,0.3)',letterSpacing:'.01em'}}>
              <span style={{fontSize:18,lineHeight:1,marginTop:-1}}>+</span> Crea nuovo
            </button>
            <Clock />
            <div style={{
              display:'flex', alignItems:'center', gap:8,
              background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:8, padding:'5px 12px', cursor:'pointer',
            }}>
              <span style={{ fontSize:12 }}>ÃÂ¢ÃÂÃÂ£</span>
              <span style={{ fontSize:12.5, color:'#94a3b8' }}>Negozio principale</span>
              <span style={{ fontSize:10, color:'#475569' }}>ÃÂ¢ÃÂÃÂ¾</span>
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
      {showCN&&<CNModal onClose={()=>setShowCN(false)} onSelect={handleCreaNuovo}/>}
      <div style={{ position:'fixed', bottom:20, right:20, display:'flex', flexDirection:'column', gap:8, zIndex:50 }}>
        {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} />)}
      </div>
    </div>
  )
}

function CNModal({onClose,onSelect}){
  const A=[
    {id:'dispositivo',icon:'📱',label:'Nuovo dispositivo',desc:'Aggiungi al magazzino',c:'#3b82f6'},
    {id:'acquisto_privato',icon:'🤝',label:'Acquisto da privato',desc:'Registra Art.36',c:'#8b5cf6'},
    {id:'vendita',icon:'💰',label:'Nuova vendita',desc:'Vendi un dispositivo',c:'#10b981'},
    {id:'riparazione',icon:'🔧',label:'Nuova riparazione',desc:'Apri scheda riparazione',c:'#f97316'},
    {id:'cliente',icon:'👤',label:'Nuovo cliente',desc:'Aggiungi al database',c:'#06b6d4'},
    {id:'fornitore',icon:'🏭',label:'Nuovo fornitore',desc:'Registra fornitore',c:'#84cc16'},
    {id:'ricambi',icon:'📦',label:'Ordine ricambi',desc:'Crea ordine ricambi',c:'#f59e0b'},
    {id:'valutazione',icon:'📊',label:'Valutazione dispositivo',desc:'Avvia valutazione',c:'#6366f1'},
    {id:'movimento',icon:'🔄',label:'Movimento magazzino',desc:'Entrata o uscita',c:'#64748b'},
    {id:'promemoria',icon:'📌',label:'Attivita / promemoria',desc:'Crea promemoria',c:'#f59e0b'}
  ]
  return(<div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(6px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:'#0d1526',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,width:'100%',maxWidth:560,maxHeight:'88vh',overflowY:'auto',fontFamily:'Inter,sans-serif',boxShadow:'0 32px 80px rgba(0,0,0,0.7)'}}>
      <div style={{padding:'22px 24px 14px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <div style={{fontSize:4,color:'#f97316',fontWeight:700,letterSpacing:'.1em',marginBottom:6,textTransform:'uppercase'}}>ENOWN</div>
          <div style={{fontSize:19,fontWeight:800,color:'#f1f5f9',letterSpacing:'-.02em'}}>Cosa vuoi creare?</div>
          <div style={{fontSize:12,color:'#64748b',marginTop:3}}>Scegli un azione per iniziare</div>
        </div>
        <button onClick={onClose} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,width:32,height:32,cursor:'pointer',color:'#64748b',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>x</button>
      </div>
      <div style={{padding:'16px 20px 20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {A.map(a=>(<button key={a.id} onClick={()=>onSelect(a.id)}
          style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',borderRadius:12,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',cursor:'pointer',textAlign:'left',fontFamily:'Inter,sans-serif',width:'100%'}}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(249,115,22,0.1)';e.currentTarget.style.borderColor='rgba(249,115,22,0.35)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}}>
          <div style={{width:40,height:40,borderRadius:10,background:a.c+'20',border:'1px solid '+a.c+'40',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{a.icon}</div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:'#f1f5f9',marginBottom:2,lineHeight:1.3}}>{a.label}</div>
            <div style={{fontSize:11,color:'#64748b',lineHeight:1.3}}>{a.desc}</div>
          </div>
        </button>))}
      </div>
      <div style={{padding:'10px 20px 16px',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',gap:6,alignItems:'center'}}>
        <span style={{fontSize:11,color:'#475569'}}>Premi</span>
        <span style={{padding:'2px 7px',borderRadius:5,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',fontSize:11,color:'#94a3b8',fontFamily:'monospace'}}>Esc</span>
        <span style={{fontSize:11,color:'#475569'}}>per chiudere</span>
      </div>
    </div>
  </div>)
}

function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' }))
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i)
  }, [])
  return <span style={{ fontSize:12, color:'#475569', fontFamily:'monospace' }}>{time}</span>
}
undefined// App.jsx

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
      

      case 'movimento': setCurrentPage('magazzino'); setCreaNuovoAction(null); break
      case 'servizio': setCurrentPage('servizi'); setCreaNuovoAction('nuovo_servizio'); break
      case 'da_privato': setCurrentPage('acquisto'); setCreaNuovoAction(null); break
      default: showToast('Funzione in sviluppo Ã°ÂÂÂ§'); break
    }
  }

  const titles = {
    dashboard: 'Homepage', magazzino: 'Magazzino', servizi: 'Servizi',
    acquisto: 'Acquisto dispositivo', riparazioni: 'Riparazioni',
    'storico-dispositivi': 'Storico Dispositivi',
    calendario: 'Calendario',
    storico: 'Storico acquisti', clienti: 'Clienti',
    importexport: 'Import / Export', protezione: 'Protezione Dispositivo',
    impostazioni: 'Impostazioni',
    valutazione: 'Valutazione Display',
    noleggio: 'Noleggio Subbyx',
    cassa: 'Chiusura Cassa',
  }

  const pages = {
    dashboard: Dashboard, magazzino: Magazzino, servizi: Servizi,
    acquisto: AcquistoPlugin, riparazioni: Riparazioni,
    'storico-dispositivi': StoricoDispositivi,
    calendario: Calendario,
    storico: Storico, clienti: Clienti,
    importexport: ImportExport, protezione: Protezione, impostazioni: Impostazioni,
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
            <button onClick={()=>setShowCN(true)} style={{display:'flex',alignItems:'center',gap:7,background:'linear-gradient(135deg,#f97316,#ea580c)',border:'none',borderRadius:10,padding:'7px 16px',cursor:'pointer',fontFamily:'Inter,sans-serif',fontWeight:700,fontSize:13,color:'#fff',boxShadow:'0 2px 12px rgba(249,115,22,0.3)',letterSpacing:'.01em'}}>
              <span style={{fontSize:18,lineHeight:1,marginTop:-1}}>+</span> Crea nuovo
            </button>
            <Clock />
            <div style={{
              display:'flex', alignItems:'center', gap:8,
              background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:8, padding:'5px 12px', cursor:'pointer',
            }}>
              <span style={{ fontSize:12 }}>Ã¢ÂÂ£</span>
              <span style={{ fontSize:12.5, color:'#94a3b8' }}>Negozio principale</span>
              <span style={{ fontSize:10, color:'#475569' }}>Ã¢ÂÂ¾</span>
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
      {showCN&&<CNModal onClose={()=>setShowCN(false)} onSelect={handleCreaNuovo}/>}
      <div style={{ position:'fixed', bottom:20, right:20, display:'flex', flexDirection:'column', gap:8, zIndex:50 }}>
        {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} />)}
      </div>
    </div>
  )
}

function CNModal({onClose,onSelect}){
  const A=[
    {id:'dispositivo',icon:'Ã°ÂÂÂ±',label:'Nuovo dispositivo',desc:'Aggiungi al magazzino',c:'#3b82f6'},
    {id:'acquisto_privato',icon:'Ã°ÂÂ¤Â',label:'Acquisto da privato',desc:'Registra Art.36',c:'#8b5cf6'},
    {id:'vendita',icon:'Ã°ÂÂÂ°',label:'Nuova vendita',desc:'Vendi un dispositivo',c:'#10b981'},
    {id:'riparazione',icon:'Ã°ÂÂÂ§',label:'Nuova riparazione',desc:'Apri scheda riparazione',c:'#f97316'},
    {id:'cliente',icon:'Ã°ÂÂÂ¤',label:'Nuovo cliente',desc:'Aggiungi al database',c:'#06b6d4'},
    {id:'fornitore',icon:'Ã°ÂÂÂ­',label:'Nuovo fornitore',desc:'Registra fornitore',c:'#6366f1'},
    {id:'ordine',icon:'Ã°ÂÂÂ¦',label:'Ordine ricambi',desc:'Crea ordine ricambi',c:'#ec4899'},
    {id:'valutazione',icon:'Ã°ÂÂÂ',label:'Valutazione dispositivo',desc:'Avvia valutazione',c:'#f59e0b'},
    {id:'movimento',icon:'Ã°ÂÂÂ',label:'Movimento magazzino',desc:'Entrata o uscita',c:'#84cc16'},
    {id:'promemoria',icon:'Ã°ÂÂÂ',label:'Attivita / promemoria',desc:'Crea promemoria',c:'#94a3b8'},
  ]
  return(<div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(6px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:'#0d1526',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,width:'100%',maxWidth:560,maxHeight:'88vh',overflowY:'auto',fontFamily:'Inter,sans-serif',boxShadow:'0 32px 80px rgba(0,0,0,0.7)'}}>
      <div style={{padding:'22px 24px 14px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <div style={{fontSize:4,color:'#f97316',fontWeight:700,letterSpacing:'.1em',marginBottom:6,textTransform:'uppercase'}}>ENOWN</div>
          <div style={{fontSize:19,fontWeight:800,color:'#f1f5f9',letterSpacing:'-.02em'}}>Cosa vuoi creare?</div>
          <div style={{fontSize:12,color:'#64748b',marginTop:3}}>Scegli un azione per iniziare</div>
        </div>
        <button onClick={onClose} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,width:32,height:32,cursor:'pointer',color:'#64748b',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>x</button>
      </div>
      <div style={{padding:'16px 20px 20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {A.map(a=>(<button key={a.id} onClick={()=>onSelect(a.id)}
          style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',borderRadius:12,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',cursor:'pointer',textAlign:'left',fontFamily:'Inter,sans-serif',width:'100%'}}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(249,115,22,0.1)';e.currentTarget.style.borderColor='rgba(249,115,22,0.35)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}}>
          <div style={{width:40,height:40,borderRadius:10,background:a.c+'20',border:'1px solid '+a.c+'40',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{a.icon}</div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:'#f1f5f9',marginBottom:2,lineHeight:1.3}}>{a.label}</div>
            <div style={{fontSize:11,color:'#64748b',lineHeight:1.3}}>{a.desc}</div>
          </div>
        </button>))}
      </div>
      <div style={{padding:'10px 20px 16px',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',gap:6,alignItems:'center'}}>
        <span style={{fontSize:11,color:'#475569'}}>Premi</span>
        <span style={{padding:'2px 7px',borderRadius:5,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',fontSize:11,color:'#94a3b8',fontFamily:'monospace'}}>Esc</span>
        <span style={{fontSize:11,color:'#475569'}}>per chiudere</span>
      </div>
    </div>
  </div>)
}

function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' }))
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i)
  }, [])
  return <span style={{ fontSize:12, color:'#475569', fontFamily:'monospace' }}>{time}</span>
}
