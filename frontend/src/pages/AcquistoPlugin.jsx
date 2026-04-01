// AcquistoPlugin.jsx - Stile Enown + importo personalizzato

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const INIT = {
  step: 1, brand: '', model: '', storage: '',
  condizioni: {}, cash: 0, voucher: 0,
  prezzoMercato: 0, breakdown: [], condizione: 'B',
}

// ── Stile base Enown ──────────────────────────
const S = {
  page: { background: '#080e1f', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: 'white' },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 28,
    maxWidth: 640, margin: '0 auto',
  },
  cardViolet: {
    background: 'linear-gradient(135deg,#2d0a5e 0%,#4a1d96 50%,#3b0764 100%)',
    border: '1px solid rgba(167,139,250,0.25)',
    borderRadius: 16, padding: 28,
    maxWidth: 640, margin: '0 auto',
    position: 'relative', overflow: 'hidden',
  },
  input: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10, padding: '10px 14px',
    color: 'white', fontFamily: 'Inter,sans-serif',
    fontSize: 13.5, width: '100%',
    transition: 'border-color 0.15s',
  },
  select: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10, padding: '10px 14px',
    color: 'white', fontFamily: 'Inter,sans-serif',
    fontSize: 13.5, width: '100%',
  },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginBottom: 5, display: 'block' },
}

const Btn = ({ onClick, children, variant = 'primary', disabled, style = {} }) => {
  const variants = {
    primary: { background: '#6d28d9', color: 'white', border: 'none' },
    secondary: { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' },
    success: { background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' },
    danger: { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' },
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '11px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif',
      opacity: disabled ? 0.4 : 1, transition: 'all 0.15s',
      ...variants[variant], ...style,
    }}>{children}</button>
  )
}

// Step indicator orizzontale stile Enown
const StepBar = ({ step, steps }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, maxWidth: 640, margin: '0 auto 32px' }}>
    {steps.map((label, i) => {
      const n = i + 1, done = n < step, active = n === step
      return (
        <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : undefined }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
              background: done ? '#22c55e' : active ? '#7c3aed' : 'rgba(255,255,255,0.07)',
              color: done || active ? 'white' : '#475569',
              border: active ? '2px solid #a78bfa' : '2px solid transparent',
              boxShadow: active ? '0 0 12px rgba(124,58,237,0.4)' : 'none',
              transition: 'all 0.2s',
            }}>{done ? '✓' : n}</div>
            <span style={{ fontSize: 9, color: active ? '#c4b5fd' : done ? '#6ee7b7' : '#475569', whiteSpace: 'nowrap', fontWeight: active ? 600 : 400 }}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, margin: '0 6px', marginBottom: 20, background: done ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'rgba(255,255,255,0.07)', borderRadius: 2 }} />
          )}
        </div>
      )
    })}
  </div>
)

// Firma digitale
function SignaturePad({ onSave, onClear }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const lastPos = useRef(null)
  const [vuota, setVuota] = useState(true)

  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    c.width = c.offsetWidth * window.devicePixelRatio
    c.height = c.offsetHeight * window.devicePixelRatio
    c.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio)
  }, [])

  const getPos = (e, c) => {
    const r = c.getBoundingClientRect(), t = e.touches ? e.touches[0] : e
    return { x: t.clientX - r.left, y: t.clientY - r.top }
  }
  const start = e => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current) }
  const draw = e => {
    e.preventDefault(); if (!drawing.current) return
    const ctx = canvasRef.current.getContext('2d'), pos = getPos(e, canvasRef.current)
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y); ctx.strokeStyle = '#1e40af'
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke()
    lastPos.current = pos; setVuota(false)
  }
  const stop = e => { e.preventDefault(); drawing.current = false }
  const clear = () => {
    const c = canvasRef.current
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
    setVuota(true); onClear && onClear()
  }

  return (
    <div>
      <div style={{ background: 'white', borderRadius: 10, border: '2px solid rgba(255,255,255,0.2)', marginBottom: 8, cursor: 'crosshair', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 130, touchAction: 'none' }}
          onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={stop} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={clear} style={{ ...S.input, width: 'auto', padding: '5px 14px', fontSize: 12, cursor: 'pointer' }}>Cancella</button>
        <button onClick={() => !vuota && onSave(canvasRef.current.toDataURL('image/png'))}
          style={{ background: vuota ? 'rgba(255,255,255,0.04)' : '#6d28d9', border: 'none', color: vuota ? '#475569' : 'white', borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: vuota ? 'default' : 'pointer', fontFamily: 'Inter,sans-serif' }}>
          ✓ Salva firma
        </button>
      </div>
    </div>
  )
}

function QRCode({ value }) {
  return <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=1e40af`} alt="QR" style={{ borderRadius: 10 }} width={140} height={140} />
}

async function generatePDF(data) {
  if (!window.jspdf) {
    await new Promise((res, rej) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      s.onload = res; s.onerror = rej; document.head.appendChild(s)
    })
  }
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, M = 20; let y = 20
  doc.setFillColor(30,64,175); doc.rect(0,0,W,18,'F')
  doc.setTextColor(255,255,255); doc.setFontSize(13); doc.setFont(undefined,'bold')
  doc.text('FOGLIO DI ACCETTAZIONE ACQUISTO', M, 12)
  doc.setFontSize(9); doc.setFont(undefined,'normal')
  doc.text(`N. ${data.progressivo||'____'}   Data: ${new Date().toLocaleDateString('it-IT')}`, W-M, 12, {align:'right'})
  y = 26; doc.setTextColor(0,0,0); doc.setFontSize(8); doc.setTextColor(100,100,100)
  doc.text('PatchUP S.R.L. • Piazza Schiaparelli n.10 • P.IVA 04038180040 • savigliano@patchup.it', M, y)
  y += 8; doc.setFillColor(248,250,252); doc.setDrawColor(200,200,200)
  doc.roundedRect(M,y,W-M*2,34,3,3,'FD')
  doc.setTextColor(0,0,0); doc.setFontSize(11); doc.setFont(undefined,'bold')
  doc.text(`Prezzo: € ${data.prezzo} (${data.tipoPagamento==='voucher'?'Buono acquisto':'Contanti'})`, M+4, y+9)
  doc.setFont(undefined,'normal'); doc.setFontSize(9)
  doc.text(`Nome: ${data.nome}`, M+4, y+17)
  doc.text(`Tel: ${data.tel}`, M+4, y+23)
  doc.text(`C.F.: ${data.cf||'—'}`, M+4, y+29)
  doc.text(`Dispositivo: ${data.brand} ${data.modello} ${data.storage}`, M+90, y+17)
  doc.text(`IMEI: ${data.imei||'—'}`, M+90, y+23)
  doc.text(`Prezzo mercato: €${data.prezzoMercato}`, M+90, y+29)
  y += 40; doc.setFontSize(10); doc.setFont(undefined,'bold'); doc.setTextColor(30,64,175)
  doc.text('Io sottoscritto/a dichiaro', M, y); y += 6
  doc.setFontSize(8.5); doc.setFont(undefined,'normal'); doc.setTextColor(50,50,50)
  const testo = 'con la presente e sotto la mia responsabilità: 1. Di aver provveduto a rimuovere tutti i miei dati personali. 2. Che il dispositivo è di mia piena proprietà e non appartiene ad alcun operatore telefonico ed è libero da vincoli contrattuali. 3. Che autorizzo PatchUP S.R.L. a trattenere il bene. 4. Che accetto la valutazione sopra citata.'
  const lines = doc.splitTextToSize(testo, W-M*2)
  doc.text(lines, M, y); y += lines.length*4+10
  doc.line(M, y+14, M+70, y+14); doc.line(W-M-70, y+14, W-M, y+14)
  doc.setFontSize(8); doc.setTextColor(120,120,120)
  doc.text('Data', M, y+18); doc.text('Firma Cliente', W-M-70, y+18)
  if (data.firma) { try { doc.addImage(data.firma,'PNG',W-M-70,y-6,70,18) } catch(e){} }
  y += 26; doc.setFontSize(7.5); doc.setTextColor(100,100,100)
  doc.text(doc.splitTextToSize('Il cliente autorizza il trattamento dei propri dati personali ai fini dell\'acquisto.', W-M*2), M, y)
  doc.setFillColor(30,64,175); doc.rect(0,287,W,10,'F')
  doc.setTextColor(255,255,255); doc.setFontSize(7)
  doc.text('PatchUP S.R.L. — Documento generato automaticamente dal sistema Magazzino', W/2, 293, {align:'center'})
  return doc
}

const DOMANDE = [
  { chiave:'non_si_accende', label:'Il dispositivo si accende?', desc:'Supera la schermata di avvio', inverti:true, penale:'-40%', colore:'#ef4444' },
  { chiave:'icloud_bloccato', label:'iCloud / account Google è libero?', desc:'Find My iPhone disattivo, nessun blocco', inverti:true, penale:'-85%', colore:'#ef4444' },
  { chiave:'schermo_rotto', label:'Lo schermo è rotto o non funziona?', desc:'Crepe, pixel morti, touch difettoso', inverti:false, penale:'-25%', colore:'#f59e0b' },
  { chiave:'schermo_crepe', label:'Ci sono crepe minori sul vetro?', desc:'Piccole crepe che non compromettono il funzionamento', inverti:false, penale:'-15%', colore:'#f59e0b' },
  { chiave:'batteria_sotto80', label:'La batteria è sotto l\'80%?', desc:'Non mantiene la carica normalmente', inverti:false, penale:'-10%', colore:'#f59e0b' },
  { chiave:'scocca_graffi', label:'Ci sono graffi evidenti sulla scocca?', desc:'Graffi visibili sul corpo del dispositivo', inverti:false, penale:'-8%', colore:'#94a3b8' },
  { chiave:'fotocamera_rotta', label:'La fotocamera funziona?', desc:'Fotocamera anteriore e posteriore operative', inverti:true, penale:'-15%', colore:'#f59e0b' },
  { chiave:'con_scatola', label:'Ha la scatola originale?', desc:'Confezione originale inclusa', inverti:false, bonus:true, penale:'+3%', colore:'#22c55e' },
]

export default function AcquistoPlugin({ api, showToast }) {
  const [s, setS] = useState(INIT)
  const [modelli, setModelli] = useState({})
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ nome:'', cf:'', tel:'', storage:'128GB', colore:'', imei:'', tipo:'cash', natoA:'', natoIl:'', residente:'', indirizzo:'' })
  const [firma, setFirma] = useState(null)
  const [docFronte, setDocFronte] = useState(null)
  const [docRetro, setDocRetro] = useState(null)
  const [showQR, setShowQR] = useState(false)
  const [docNum, setDocNum] = useState('')
  // Importo personalizzato
  const [importoCustom, setImportoCustom] = useState('')
  const [usaImportoCustom, setUsaImportoCustom] = useState(false)

  const upd = c => setS(p => ({...p,...c}))
  const steps = ['Dispositivo','Condizioni','Prezzo','Cliente','Firma','Fine']

  useEffect(() => {
    axios.get(`${api}/valutazione/modelli`).then(({data}) => setModelli(data)).catch(() => {
      setModelli({
        Apple:{'iPhone 12':['64GB','128GB','256GB'],'iPhone 12 Pro':['128GB','256GB','512GB'],'iPhone 13':['128GB','256GB','512GB'],'iPhone 13 Pro':['128GB','256GB','512GB'],'iPhone 14':['128GB','256GB','512GB'],'iPhone 14 Pro':['128GB','256GB','512GB','1TB'],'iPhone 15':['128GB','256GB','512GB'],'iPhone 15 Pro':['128GB','256GB','512GB','1TB'],'iPhone 16':['128GB','256GB','512GB'],'iPhone 16 Pro':['128GB','256GB','512GB','1TB'],'iPhone SE (3rd)':['64GB','128GB','256GB']},
        Samsung:{'Galaxy S23':['128GB','256GB'],'Galaxy S24':['128GB','256GB'],'Galaxy S24 Ultra':['256GB','512GB'],'Galaxy A54':['128GB','256GB'],'Galaxy Z Fold5':['256GB','512GB'],'Galaxy Z Flip5':['256GB','512GB']},
        Google:{'Pixel 8':['128GB','256GB'],'Pixel 8 Pro':['128GB','256GB','512GB'],'Pixel 7a':['128GB']},
        Xiaomi:{'14':['256GB','512GB'],'14 Ultra':['256GB','512GB'],'Redmi Note 13 Pro':['128GB','256GB']},
        OnePlus:{'12':['256GB','512GB'],'11':['128GB','256GB']},
        Huawei:{'P60 Pro':['256GB','512GB'],'Mate 60 Pro':['256GB','512GB']},
      })
    })
  }, [])

  const toggleCondizione = (chiave, valore) => {
    const domanda = DOMANDE.find(d => d.chiave === chiave)
    const valoreBackend = domanda?.inverti ? !valore : valore
    upd({ condizioni: {...s.condizioni, [chiave]: valoreBackend} })
  }

  const goStep = async n => {
    if (n===2 && (!s.brand||!s.model||!s.storage)) { showToast('Seleziona brand, modello e storage','error'); return }
    if (n===3) {
      setLoading(true)
      try {
        const {data} = await axios.post(`${api}/valutazione/calcola`, { brand:s.brand, modello:s.model, storage:s.storage, condizioni:s.condizioni })
        if (data.ok) {
          upd({ cash:data.prezzo_cash, voucher:data.prezzo_voucher, prezzoMercato:data.prezzo_mercato, breakdown:data.breakdown, condizione:data.condizione, step:3 })
          setImportoCustom(data.prezzo_cash.toString())
        } else {
          upd({ cash:0, voucher:0, step:3 })
        }
      } catch {
        let p=300
        if(s.condizioni.non_si_accende) p*=0.6; if(s.condizioni.schermo_rotto) p*=0.75
        p=Math.round(p); upd({ cash:p, voucher:Math.round(p*1.2), step:3 })
        setImportoCustom(p.toString())
      } finally { setLoading(false) }
      return
    }
    upd({ step:n })
  }

  // Calcola condizione in base all'importo personalizzato vs calcolato
  const getCondizioneEffettiva = () => {
    if (!usaImportoCustom) return s.condizione
    const imp = parseInt(importoCustom) || 0
    const ratio = imp / s.cash
    if (ratio >= 1.1) return 'A'    // pagato di più → condizione migliore
    if (ratio >= 0.9) return s.condizione  // vicino al calcolato → stessa condizione
    if (ratio >= 0.7) return 'B'    // pagato meno → condizione peggiore
    return 'C'
  }

  const getPrezzoFinale = () => {
    if (usaImportoCustom && importoCustom) return parseInt(importoCustom) || s.cash
    return form.tipo === 'voucher' ? s.voucher : s.cash
  }

  const getDifferenzaLabel = () => {
    if (!usaImportoCustom || !importoCustom) return null
    const imp = parseInt(importoCustom) || 0
    const diff = imp - s.cash
    if (diff === 0) return null
    return {
      diff, sign: diff > 0 ? '+' : '',
      tipo: diff > 0 ? 'più' : 'meno',
      colore: diff > 0 ? '#4ade80' : '#f87171',
      bg: diff > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
      border: diff > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
      condizioneFinale: getCondizioneEffettiva(),
    }
  }

  const confirm = async () => {
    if (!firma) { showToast('La firma è obbligatoria','error'); return }
    const prezzo = getPrezzoFinale()
    const condFinale = getCondizioneEffettiva()
    try {
      await axios.post(`${api}/devices/create-from-evaluation`, {
        brand:s.brand, modello:s.model, storage:form.storage||s.storage,
        colore:form.colore, imei:form.imei,
        si_accende:!s.condizioni.non_si_accende,
        schermo_rotto:!!s.condizioni.schermo_rotto,
        batteria_ok:!s.condizioni.batteria_sotto80,
        tipo_pagamento:form.tipo, cliente_nome:form.nome, cliente_tel:form.tel,
      })
    } catch {}
    upd({ step:6 })
    showToast('✓ Acquisto completato!')
  }

  const downloadPDF = async () => {
    const doc = await generatePDF({
      nome:form.nome, tel:form.tel, cf:form.cf,
      brand:s.brand, modello:s.model, storage:form.storage||s.storage,
      imei:form.imei, prezzo:getPrezzoFinale(),
      prezzoMercato:s.prezzoMercato, tipoPagamento:form.tipo,
      firma, progressivo:Date.now().toString().slice(-5),
    })
    doc.save(`accettazione_${form.nome.replace(' ','_')}_${new Date().toISOString().slice(0,10)}.pdf`)
    showToast('✓ PDF scaricato!')
  }

  const handleDoc = (e, side) => {
    const f=e.target.files[0]; if(!f) return
    const r=new FileReader(); r.onload=ev=>side==='fronte'?setDocFronte(ev.target.result):setDocRetro(ev.target.result); r.readAsDataURL(f)
  }

  const brandsDisp = Object.keys(modelli)
  const modelliPerBrand = modelli[s.brand] ? Object.keys(modelli[s.brand]) : []
  const storagePerModello = modelli[s.brand]?.[s.model] || []
  const qrUrl = `${window.location.origin}/firma?id=${Date.now()}&nome=${encodeURIComponent(form.nome)}&brand=${encodeURIComponent(s.brand)}&modello=${encodeURIComponent(s.model)}`
  const diffInfo = getDifferenzaLabel()

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{marginBottom:32}}>
        <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Acquisto dispositivo</div>
        <div style={{fontSize:13,color:'#64748b'}}>Valutazione basata sui prezzi di mercato • Flusso guidato</div>
      </div>

      <StepBar step={s.step} steps={steps} />

      {/* ── STEP 1: Dispositivo ── */}
      {s.step===1 && (
        <div style={S.card}>
          <div style={{marginBottom:24}}>
            <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>Seleziona dispositivo</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.45)'}}>I prezzi si basano sul mercato italiano aggiornato</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:24}}>
            {[
              { label:'Brand', val:s.brand, opts:brandsDisp, onChange:v=>upd({brand:v,model:'',storage:''}), placeholder:'Seleziona...' },
              { label:'Modello', val:s.model, opts:modelliPerBrand, onChange:v=>upd({model:v,storage:''}), placeholder:'Prima scegli brand', disabled:!s.brand },
              { label:'Storage', val:s.storage, opts:storagePerModello, onChange:v=>upd({storage:v}), placeholder:'Prima scegli modello', disabled:!s.model },
            ].map(f=>(
              <div key={f.label} style={{display:'flex',flexDirection:'column',gap:6}}>
                <label style={S.label}>{f.label}</label>
                <select value={f.val} onChange={e=>f.onChange(e.target.value)} disabled={f.disabled} style={{...S.select,opacity:f.disabled?0.4:1}}>
                  <option value="">{f.placeholder}</option>
                  {f.opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          {s.brand && s.model && s.storage && (
            <div style={{background:'rgba(109,40,217,0.15)',border:'1px solid rgba(109,40,217,0.3)',borderRadius:10,padding:'12px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:22}}>📱</span>
              <div>
                <div style={{fontSize:13,fontWeight:600,marginBottom:1}}>{s.brand} {s.model} {s.storage}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>Il prezzo verrà calcolato dopo le domande sulle condizioni</div>
              </div>
            </div>
          )}
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <Btn onClick={()=>goStep(2)} disabled={!s.brand||!s.model||!s.storage}>Continua →</Btn>
          </div>
        </div>
      )}

      {/* ── STEP 2: Condizioni ── */}
      {s.step===2 && (
        <div style={S.card}>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>Condizioni del dispositivo</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.45)'}}>{s.brand} {s.model} {s.storage} — Rispondi con precisione</div>
          </div>
          {DOMANDE.map(d => {
            const valBackend = s.condizioni[d.chiave]
            const val = d.inverti ? (valBackend===undefined?undefined:!valBackend) : valBackend
            const penaleAttiva = valBackend===true
            return (
              <div key={d.chiave} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                    <span style={{fontSize:13.5,fontWeight:500}}>{d.label}</span>
                    <span style={{
                      fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,
                      background:d.bonus?'rgba(34,197,94,0.15)':penaleAttiva?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.07)',
                      color:d.bonus?'#4ade80':d.colore,
                    }}>{d.penale}</span>
                  </div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>{d.desc}</div>
                </div>
                <div style={{display:'flex',gap:8,marginLeft:16,flexShrink:0}}>
                  {[['Sì',true],['No',false]].map(([l,v])=>{
                    const sel=val===v
                    const isPositivo = d.inverti ? v===true : v===false
                    return (
                      <button key={l} onClick={()=>toggleCondizione(d.chiave,v)} style={{
                        padding:'6px 18px',borderRadius:8,fontSize:13,fontWeight:500,
                        cursor:'pointer',fontFamily:'Inter,sans-serif',
                        background:sel?(isPositivo?'rgba(34,197,94,0.2)':'rgba(239,68,68,0.2)'):'rgba(255,255,255,0.06)',
                        color:sel?(isPositivo?'#4ade80':'#f87171'):'rgba(255,255,255,0.45)',
                        border:sel?`1px solid ${isPositivo?'rgba(34,197,94,0.4)':'rgba(239,68,68,0.4)'}`:'1px solid rgba(255,255,255,0.1)',
                        transition:'all 0.15s',
                      }}>{l}</button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          <div style={{display:'flex',justifyContent:'space-between',marginTop:20}}>
            <Btn onClick={()=>upd({step:1})} variant="secondary">← Indietro</Btn>
            <Btn onClick={()=>goStep(3)} disabled={loading}>{loading?'⏳ Calcolo...':'Calcola prezzo →'}</Btn>
          </div>
        </div>
      )}

      {/* ── STEP 3: Prezzo + importo custom ── */}
      {s.step===3 && (
        <div style={S.card}>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>Valutazione</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.45)'}}>{s.brand} {s.model} {s.storage}</div>
          </div>

          {/* Breakdown */}
          {s.breakdown.length>0 && (
            <div style={{background:'rgba(0,0,0,0.25)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'12px 15px',marginBottom:18}}>
              {s.breakdown.map((b,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:12,fontFamily:'monospace',
                  color:b.tipo==='mercato'?'rgba(255,255,255,0.3)':b.tipo==='penale'?'#f87171':b.tipo==='bonus'||b.tipo==='permuta'?'#4ade80':'rgba(255,255,255,0.7)',
                  borderBottom:i===1?'1px solid rgba(255,255,255,0.08)':'none',paddingBottom:i===1?6:3,marginBottom:i===1?3:0,
                }}>
                  <span>{b.voce}</span>
                  <span style={{fontWeight:700}}>{b.importo>0&&b.tipo!=='mercato'&&b.tipo!=='base'?'+':''}€{b.importo}{b.percentuale?` (${b.percentuale>0?'+':''}${b.percentuale}%)`:''}</span>
                </div>
              ))}
            </div>
          )}

          {/* Prezzi calcolati */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}}>
            <div style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding:18,textAlign:'center'}}>
              <div style={{fontSize:10,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(255,255,255,0.4)',marginBottom:8}}>💵 Cash calcolato</div>
              <div style={{fontSize:36,fontWeight:800,fontFamily:'monospace',letterSpacing:-1}}>€{s.cash}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:4}}>55% del prezzo mercato</div>
            </div>
            <div style={{background:'rgba(109,40,217,0.15)',border:'1px solid rgba(109,40,217,0.3)',borderRadius:12,padding:18,textAlign:'center'}}>
              <div style={{fontSize:10,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(196,181,253,0.7)',marginBottom:8}}>🎁 Buono calcolato</div>
              <div style={{fontSize:36,fontWeight:800,fontFamily:'monospace',letterSpacing:-1,color:'#c4b5fd'}}>€{s.voucher}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:4}}>+20% in buono negozio</div>
            </div>
          </div>

          {/* Importo personalizzato */}
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding:18,marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div>
                <div style={{fontSize:13.5,fontWeight:600,marginBottom:2}}>💰 Importo personalizzato</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>Sovrascrivi il prezzo calcolato con un importo a tua scelta</div>
              </div>
              <button onClick={()=>setUsaImportoCustom(!usaImportoCustom)} style={{
                padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',border:'none',
                background:usaImportoCustom?'#6d28d9':'rgba(255,255,255,0.1)',
                color:'white',fontFamily:'Inter,sans-serif',transition:'all 0.2s',
              }}>{usaImportoCustom?'✓ Attivo':'Attiva'}</button>
            </div>

            {usaImportoCustom && (
              <div>
                <div style={{display:'flex',gap:10,alignItems:'flex-end',marginBottom:12}}>
                  <div style={{flex:1}}>
                    <label style={S.label}>Importo che vuoi offrire (€)</label>
                    <input
                      type="number" min="0" value={importoCustom}
                      onChange={e=>setImportoCustom(e.target.value)}
                      style={{...S.input,fontSize:20,fontWeight:700,fontFamily:'monospace',textAlign:'center'}}
                      placeholder="0"
                    />
                  </div>
                  <div style={{paddingBottom:2,display:'flex',gap:8}}>
                    {[s.cash, s.voucher, Math.round(s.cash*0.8), Math.round(s.cash*1.1)].map(v=>(
                      <button key={v} onClick={()=>setImportoCustom(v.toString())} style={{
                        padding:'8px 12px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid rgba(255,255,255,0.1)',
                        background:parseInt(importoCustom)===v?'#6d28d9':'rgba(255,255,255,0.06)',
                        color:'white',fontFamily:'Inter,sans-serif',
                      }}>€{v}</button>
                    ))}
                  </div>
                </div>

                {/* Feedback differenza */}
                {diffInfo && (
                  <div style={{background:diffInfo.bg,border:`1px solid ${diffInfo.border}`,borderRadius:10,padding:'12px 15px',display:'flex',alignItems:'center',gap:12}}>
                    <span style={{fontSize:20}}>{diffInfo.diff>0?'⬆️':'⬇️'}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:diffInfo.colore,marginBottom:2}}>
                        Stai offrendo {diffInfo.sign}€{Math.abs(diffInfo.diff)} rispetto al calcolato
                      </div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,0.45)'}}>
                        Il dispositivo verrà registrato con condizione: <strong style={{color:diffInfo.colore}}>{diffInfo.condizioneFinale}</strong>
                        {diffInfo.diff>0?' (migliore del calcolato — ottimo per il cliente!)':' (peggiore del calcolato — margine maggiore per il negozio)'}
                      </div>
                    </div>
                    <div style={{fontSize:24,fontWeight:800,fontFamily:'monospace',color:diffInfo.colore,flexShrink:0}}>€{parseInt(importoCustom)||0}</div>
                  </div>
                )}

                {!diffInfo && importoCustom && parseInt(importoCustom)===s.cash && (
                  <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'10px 14px',fontSize:12,color:'rgba(255,255,255,0.5)',textAlign:'center'}}>
                    Importo uguale al calcolato — condizione: <strong>{s.condizione}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {s.prezzoMercato>0 && (
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'rgba(255,255,255,0.35)',marginBottom:16,padding:'8px 12px',background:'rgba(255,255,255,0.03)',borderRadius:8}}>
              <span>📊 Prezzo mercato attuale</span>
              <span style={{fontWeight:600,color:'rgba(255,255,255,0.6)'}}>€{s.prezzoMercato}</span>
            </div>
          )}

          <div style={{display:'flex',justifyContent:'space-between'}}>
            <Btn onClick={()=>upd({step:2})} variant="secondary">← Modifica condizioni</Btn>
            <Btn onClick={()=>upd({step:4})}>Il cliente accetta →</Btn>
          </div>
        </div>
      )}

      {/* ── STEP 4: Dati cliente ── */}
      {s.step===4 && (
        <div style={S.card}>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>Dati cliente</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.45)'}}>Prezzo finale: <strong style={{color:'#a78bfa',fontSize:16}}>€{getPrezzoFinale()}</strong> {usaImportoCustom?'(personalizzato)':''}</div>
          </div>

          <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12,fontWeight:600}}>Dati anagrafici</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:13,marginBottom:20}}>
            {[['Nome e cognome','nome','Mario Rossi','1/-1'],['Codice fiscale','cf','RSSMRA80A01L219K','1/-1'],['Telefono','tel','+39 333...',''],['Nato a','natoA','Torino',''],['Nato il','natoIl','01/01/1980',''],['Residenza','residente','Torino (TO)',''],['Indirizzo','indirizzo','Via Roma 1','1/-1']].map(([l,k,ph,gc])=>(
              <div key={k} style={{gridColumn:gc||undefined,display:'flex',flexDirection:'column',gap:5}}>
                <label style={S.label}>{l}</label>
                <input placeholder={ph} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} style={S.input}/>
              </div>
            ))}
          </div>

          <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12,fontWeight:600}}>Dettagli dispositivo</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:13,marginBottom:20}}>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              <label style={S.label}>Storage</label>
              <select value={form.storage||s.storage} onChange={e=>setForm({...form,storage:e.target.value})} style={S.select}>
                {(storagePerModello.length?storagePerModello:['64GB','128GB','256GB','512GB','1TB']).map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              <label style={S.label}>Colore</label>
              <input placeholder="Nero" value={form.colore} onChange={e=>setForm({...form,colore:e.target.value})} style={S.input}/>
            </div>
            <div style={{gridColumn:'1/-1',display:'flex',flexDirection:'column',gap:5}}>
              <label style={S.label}>IMEI</label>
              <input placeholder="356xxxxxxxxxxxxxx" value={form.imei} onChange={e=>setForm({...form,imei:e.target.value})} style={{...S.input,fontFamily:'monospace',fontSize:12}} maxLength={15}/>
            </div>
            <div style={{gridColumn:'1/-1',display:'flex',flexDirection:'column',gap:5}}>
              <label style={S.label}>Tipo pagamento</label>
              <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} style={S.select}>
                <option value="cash">💵 Cash (€{usaImportoCustom?(parseInt(importoCustom)||s.cash):s.cash})</option>
                <option value="voucher">🎁 Buono acquisto (€{usaImportoCustom?(parseInt(importoCustom)||s.voucher):s.voucher})</option>
              </select>
            </div>
          </div>

          <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12,fontWeight:600}}>📄 Documento d'identità</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:13,marginBottom:12}}>
            {[['fronte',docFronte],['retro',docRetro]].map(([side,img])=>(
              <div key={side}>
                <label style={{...S.label,textTransform:'capitalize'}}>{side}</label>
                <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.04)',border:'2px dashed rgba(255,255,255,0.12)',borderRadius:10,padding:img?0:'16px',cursor:'pointer',overflow:'hidden',minHeight:80}}>
                  {img?<img src={img} alt={side} style={{width:'100%',maxHeight:90,objectFit:'cover'}}/>
                    :<><span style={{fontSize:20,marginBottom:4,opacity:0.4}}>📷</span><span style={{fontSize:11,color:'rgba(255,255,255,0.3)',textAlign:'center'}}>Carica {side}</span></>}
                  <input type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e=>handleDoc(e,side)}/>
                </label>
              </div>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:20}}>
            <label style={S.label}>Numero documento</label>
            <input placeholder="CA00000AA" value={docNum} onChange={e=>setDocNum(e.target.value)} style={S.input}/>
          </div>

          <div style={{display:'flex',justifyContent:'space-between'}}>
            <Btn onClick={()=>upd({step:3})} variant="secondary">← Indietro</Btn>
            <Btn onClick={()=>goStep(5)}>Vai alla firma →</Btn>
          </div>
        </div>
      )}

      {/* ── STEP 5: Firma ── */}
      {s.step===5 && (
        <div style={S.card}>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>Firma del cliente</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.45)'}}>Necessaria per il contratto di acquisto</div>
          </div>

          <div style={{marginBottom:22}}>
            <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>✍️ Firma qui (mouse o dito)</div>
            <SignaturePad onSave={data=>{setFirma(data);showToast('✓ Firma acquisita!')}} onClear={()=>setFirma(null)}/>
            {firma&&(
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8,background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:8,padding:'8px 12px'}}>
                <span style={{color:'#4ade80'}}>✓</span>
                <span style={{fontSize:12,color:'#4ade80'}}>Firma acquisita con successo</span>
              </div>
            )}
          </div>

          <div style={{borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:18,marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>📱 In alternativa — QR code per firma su telefono</div>
            <button onClick={()=>setShowQR(!showQR)} style={{...S.input,width:'auto',padding:'8px 16px',fontSize:12.5,cursor:'pointer',marginBottom:showQR?12:0}}>
              {showQR?'🙈 Nascondi QR':'📲 Mostra QR code'}
            </button>
            {showQR&&(
              <div style={{display:'flex',gap:20,alignItems:'center',background:'white',borderRadius:12,padding:16,width:'fit-content',marginTop:12}}>
                <QRCode value={qrUrl}/>
                <div>
                  <div style={{fontSize:13,color:'#1e3a8a',fontWeight:700,marginBottom:6}}>Scansiona per firmare</div>
                  <div style={{fontSize:11,color:'#475569',maxWidth:180,lineHeight:1.6}}>Il cliente punta la fotocamera sul QR e firma sul suo telefono</div>
                  <div style={{fontSize:10,color:'#94a3b8',marginTop:8}}>{form.nome||'Cliente'} • {s.brand} {s.model}</div>
                </div>
              </div>
            )}
          </div>

          <div style={{display:'flex',justifyContent:'space-between'}}>
            <Btn onClick={()=>upd({step:4})} variant="secondary">← Indietro</Btn>
            <Btn onClick={confirm} variant={firma?'success':'primary'} disabled={!firma}>
              {firma?'✓ Conferma acquisto':'Firma obbligatoria'}
            </Btn>
          </div>
        </div>
      )}

      {/* ── STEP 6: Fine ── */}
      {s.step===6&&(
        <div style={{...S.card,textAlign:'center'}}>
          <div style={{fontSize:52,marginBottom:16}}>✅</div>
          <div style={{fontSize:22,fontWeight:800,marginBottom:8}}>Acquisto completato!</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.5)',marginBottom:24}}>{s.brand} {s.model} aggiunto al magazzino come "da testare"</div>
          <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:18,marginBottom:24,textAlign:'left',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:13}}>
            <div><span style={{color:'rgba(255,255,255,0.4)'}}>Cliente: </span><strong>{form.nome}</strong></div>
            <div><span style={{color:'rgba(255,255,255,0.4)'}}>Tel: </span>{form.tel}</div>
            <div><span style={{color:'rgba(255,255,255,0.4)'}}>Dispositivo: </span>{s.brand} {s.model} {s.storage}</div>
            <div><span style={{color:'rgba(255,255,255,0.4)'}}>Pagato: </span><strong style={{color:'#a78bfa'}}>€{getPrezzoFinale()} ({form.tipo})</strong></div>
            {usaImportoCustom&&<div style={{gridColumn:'1/-1'}}><span style={{color:'rgba(255,255,255,0.4)'}}>Condizione registrata: </span><strong style={{color:getCondizioneEffettiva()==='A'?'#4ade80':getCondizioneEffettiva()==='C'?'#f87171':'#facc15'}}>{getCondizioneEffettiva()}</strong></div>}
            {s.prezzoMercato>0&&<div style={{gridColumn:'1/-1',fontSize:11,color:'rgba(255,255,255,0.3)'}}>Prezzo mercato €{s.prezzoMercato} → acquistato al {Math.round(getPrezzoFinale()/s.prezzoMercato*100)}%</div>}
          </div>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={downloadPDF} style={{background:'white',color:'#1e3a8a',border:'none',borderRadius:10,padding:'12px 24px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:8}}>
              📄 Scarica contratto PDF
            </button>
            <Btn variant="secondary" onClick={()=>{setS(INIT);setForm({nome:'',cf:'',tel:'',storage:'128GB',colore:'',imei:'',tipo:'cash',natoA:'',natoIl:'',residente:'',indirizzo:''});setFirma(null);setDocFronte(null);setDocRetro(null);setShowQR(false);setImportoCustom('');setUsaImportoCustom(false)}}>
              + Nuovo acquisto
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}
