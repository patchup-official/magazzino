// AcquistoPlugin.jsx - Con generazione PDF, upload documento, firma digitale

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const BRANDS = {
  Apple:['iPhone 15 Pro Max','iPhone 15 Pro','iPhone 15','iPhone 14 Pro','iPhone 14','iPhone 13','iPhone 12','iPhone SE (3rd)'],
  Samsung:['Galaxy S24 Ultra','Galaxy S24+','Galaxy S24','Galaxy S23 Ultra','Galaxy A54','Galaxy Z Fold5','Galaxy Z Flip5'],
  Google:['Pixel 8 Pro','Pixel 8','Pixel 7a','Pixel 7'],
  Xiaomi:['14 Ultra','14','13T Pro','Redmi Note 13 Pro'],
  OnePlus:['12','11','Nord CE 3'],
  Huawei:['P60 Pro','Mate 60 Pro']
}

const INIT = { step:1, brand:'', model:'', ans:{q1:null,q2:null,q3:null}, cash:0, vouch:0 }

// ── Componenti UI base ─────────────────────────
const cardStyle = {
  background:'linear-gradient(135deg,#3b0764 0%,#5b21b6 40%,#4c1d95 100%)',
  border:'1px solid rgba(167,139,250,0.2)',
  borderRadius:16, padding:28,
  maxWidth:580, margin:'0 auto',
  position:'relative', overflow:'hidden',
}

const Btn = ({onClick,children,secondary,style={}}) => (
  <button onClick={onClick} style={{
    padding:'10px 22px', borderRadius:10, fontSize:13.5, fontWeight:600,
    cursor:'pointer', border:'none', fontFamily:'Inter,sans-serif',
    background:secondary?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.2)',
    color:'white', transition:'all 0.15s', ...style,
  }}
    onMouseEnter={e=>e.currentTarget.style.background=secondary?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.3)'}
    onMouseLeave={e=>e.currentTarget.style.background=secondary?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.2)'}
  >{children}</button>
)

const Q = ({label,desc,qk,ans,sa}) => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
    <div>
      <div style={{fontSize:14,fontWeight:500}}>{label}</div>
      {desc&&<div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:2}}>{desc}</div>}
    </div>
    <div style={{display:'flex',gap:8}}>
      {[['Sì',true],['No',false]].map(([l,v])=>{
        const sel=ans[qk]===v, isYes=l==='Sì'
        return <button key={l} onClick={()=>sa(qk,v)} style={{
          padding:'6px 16px',borderRadius:8,fontSize:12.5,fontWeight:500,cursor:'pointer',
          fontFamily:'Inter,sans-serif',
          background:sel?(isYes?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'):'rgba(255,255,255,0.1)',
          color:sel?(isYes?'#4ade80':'#f87171'):'rgba(255,255,255,0.6)',
          border:sel?`1px solid ${isYes?'rgba(34,197,94,0.5)':'rgba(239,68,68,0.5)'}`:'1px solid rgba(255,255,255,0.1)',
        }}>{l}</button>
      })}
    </div>
  </div>
)

// ── Firma digitale ─────────────────────────────
function SignaturePad({ onSave, onClear }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const lastPos = useRef(null)

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect()
    const t = e.touches ? e.touches[0] : e
    return { x: t.clientX - r.left, y: t.clientY - r.top }
  }

  const start = (e) => {
    e.preventDefault()
    drawing.current = true
    const pos = getPos(e, canvasRef.current)
    lastPos.current = pos
  }

  const draw = (e) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e40af'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  const stop = (e) => {
    e.preventDefault()
    drawing.current = false
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (onClear) onClear()
  }

  const save = () => {
    const canvas = canvasRef.current
    const data = canvas.toDataURL('image/png')
    if (onSave) onSave(data)
  }

  return (
    <div>
      <div style={{background:'white',borderRadius:10,padding:4,border:'2px solid rgba(255,255,255,0.3)',marginBottom:10,cursor:'crosshair'}}>
        <canvas
          ref={canvasRef} width={500} height={160}
          style={{display:'block',width:'100%',touchAction:'none'}}
          onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={stop}
        />
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <button onClick={clear} style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'white',borderRadius:8,padding:'6px 14px',fontSize:12,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Cancella</button>
        <button onClick={save} style={{background:'rgba(255,255,255,0.25)',border:'none',color:'white',borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>✓ Salva firma</button>
      </div>
    </div>
  )
}

// ── QR Code (via API pubblica) ──────────────────
function QRCode({ value, size = 160 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=1e40af`
  return <img src={url} alt="QR Code firma" style={{borderRadius:10,display:'block'}} width={size} height={size} />
}

// ── Generazione PDF (jsPDF via CDN) ────────────
async function generatePDF(data) {
  // Carica jsPDF dinamicamente
  if (!window.jspdf) {
    await new Promise((res, rej) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      s.onload = res; s.onerror = rej
      document.head.appendChild(s)
    })
  }

  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, M = 20
  let y = 20

  // Header
  doc.setFillColor(30, 64, 175)
  doc.rect(0, 0, W, 18, 'F')
  doc.setTextColor(255,255,255)
  doc.setFontSize(14); doc.setFont(undefined,'bold')
  doc.text('FOGLIO DI ACCETTAZIONE ACQUISTO', M, 12)
  doc.setFontSize(9); doc.setFont(undefined,'normal')
  doc.text(`N. ${data.progressivo || '____'}   Data: ${new Date().toLocaleDateString('it-IT')}`, W-M, 12, {align:'right'})

  y = 28
  doc.setTextColor(0,0,0)

  // Dati negozio
  doc.setFontSize(8); doc.setTextColor(100,100,100)
  doc.text('PatchUP S.R.L. • Piazza Schiaparelli n.10 • P.IVA 04038180040 • savigliano@patchup.it • Tel. 3517810135', M, y)
  y += 8

  // Box prezzo e dati dispositivo
  doc.setDrawColor(200,200,200); doc.setFillColor(248,250,252)
  doc.roundedRect(M, y, W-M*2, 28, 3, 3, 'FD')
  doc.setTextColor(0,0,0); doc.setFontSize(11); doc.setFont(undefined,'bold')
  doc.text(`Prezzo: € ${data.prezzo}`, M+4, y+8)
  doc.setFont(undefined,'normal'); doc.setFontSize(9)
  doc.text(`Nome: ${data.nome}`, M+4, y+15)
  doc.text(`Tel: ${data.tel}`, M+4, y+21)
  doc.text(`Marca: ${data.brand}   Modello: ${data.modello}`, M+80, y+15)
  doc.text(`Tipo pagamento: ${data.tipoPagamento === 'voucher' ? 'Buono acquisto' : 'Contanti'}`, M+80, y+21)
  y += 34

  // Testo dichiarazione
  doc.setFontSize(11); doc.setFont(undefined,'bold'); doc.setTextColor(30,64,175)
  doc.text('Io sottoscritto/a dichiaro', M, y)
  y += 6

  doc.setFontSize(8.5); doc.setFont(undefined,'normal'); doc.setTextColor(50,50,50)
  const testo = `con la presente e sotto la mia responsabilità:\n1. Di aver provveduto a rimuovere, dal suddetto apparecchio, tutti i miei dati personali, sensibili e non, che il medesimo vi aveva inserito e/o comunque memorizzato e, di conseguenza, sollevo ed esonero PatchUP S.R.L. nonché ogni successivo utilizzatore del predetto apparecchio telefonico, da ogni e qualsiasi responsabilità in merito alla loro eventuale ed accidentale perdita;\n2. Che il dispositivo, in quanto di mia piena proprietà, non appartiene ad alcun operatore telefonico ed è libero da qualsivoglia vincolo contrattuale di locazione, noleggio, leasing;\n3. Che autorizzo, sin da questo momento, il negozio PatchUP S.R.L. a trattenere il bene, se conforme alla descrizione effettuata, e se valutasse di acquistarlo;\n4. Che accetto, come da richiesta, la valutazione sopra citata che reputo congrua alla condizione del dispositivo.`

  const lines = doc.splitTextToSize(testo, W - M*2)
  doc.text(lines, M, y)
  y += lines.length * 4 + 6

  // IMEI e numero di serie
  doc.setFillColor(248,250,252); doc.setDrawColor(200,200,200)
  doc.roundedRect(M, y, W-M*2, 14, 2, 2, 'FD')
  doc.setFontSize(9); doc.setTextColor(0,0,0)
  doc.text(`Dispositivo: ${data.brand} ${data.modello}`, M+4, y+5)
  doc.text(`N. Serie / IMEI: ${data.imei || '________________________'}`, M+4, y+11)
  y += 20

  // Firma
  doc.setDrawColor(180,180,180)
  doc.line(M, y+15, M+70, y+15)
  doc.line(W-M-70, y+15, W-M, y+15)
  doc.setFontSize(8); doc.setTextColor(120,120,120)
  doc.text('Data', M, y+19)
  doc.text('Firma Cliente', W-M-70, y+19)

  // Se c'è firma digitale, aggiungila
  if (data.firma) {
    try {
      doc.addImage(data.firma, 'PNG', W-M-70, y-8, 70, 20)
    } catch(e) {}
  }

  y += 28

  // Privacy
  doc.setFontSize(7.5); doc.setTextColor(100,100,100)
  const privacy = 'Il cliente mediante la sottoscrizione del presente autorizza il trattamento dei propri dati personali. Il conferimento dei dati personali e sensibili è strettamente necessario ai fini dell\'acquisto. I dati personali non sono soggetti a diffusione tranne per l\'adempimento dei compiti relativi al presente acquisto.'
  const privLines = doc.splitTextToSize(privacy, W - M*2)
  doc.text(privLines, M, y)

  // Footer
  doc.setFillColor(30,64,175)
  doc.rect(0, 287, W, 10, 'F')
  doc.setTextColor(255,255,255); doc.setFontSize(7)
  doc.text('PatchUP S.R.L. — Documento generato automaticamente dal sistema Magazzino', W/2, 293, {align:'center'})

  return doc
}

// ── COMPONENTE PRINCIPALE ───────────────────────
export default function AcquistoPlugin({ api, showToast }) {
  const [s, setS] = useState(INIT)
  const [form, setForm] = useState({
    nome:'', cf:'', tel:'', storage:'128GB', colore:'', imei:'',
    tipo:'cash', note:'', natoA:'', natoIl:'', residente:'', indirizzo:''
  })
  const [firma, setFirma] = useState(null)
  const [docFronte, setDocFronte] = useState(null)
  const [docRetro, setDocRetro] = useState(null)
  const [showQR, setShowQR] = useState(false)
  const [docNum, setDocNum] = useState('')
  const [pdfReady, setPdfReady] = useState(false)

  const upd = c => setS(p => ({...p,...c}))
  const sa = (q,v) => upd({ ans:{...s.ans,[q]:v} })

  const steps = ['Dispositivo','Condizioni','Prezzo','Cliente & Doc','Firma','Completato']

  const goStep = async (n) => {
    if (n===2 && (!s.brand||!s.model)) { showToast('Seleziona brand e modello','error'); return }
    if (n===3) {
      const a=s.ans
      if (a.q1===null||a.q2===null||a.q3===null) { showToast('Rispondi a tutte le domande','error'); return }
      let p=300
      if(!a.q1) p-=100; if(a.q2) p-=50; if(!a.q3) p-=30
      upd({ cash:Math.max(p,0), vouch:Math.round(Math.max(p,0)*1.2), step:3 })
      return
    }
    if (n===5) {
      if (!form.nome||!form.tel) { showToast('Nome e telefono obbligatori','error'); return }
    }
    upd({ step:n })
  }

  const confirm = async () => {
    if (!firma) { showToast('La firma è obbligatoria','error'); return }
    const prezzo = form.tipo==='voucher' ? s.vouch : s.cash
    const a = s.ans
    try {
      await axios.post(`${api}/devices/create-from-evaluation`, {
        brand:s.brand, modello:s.model, storage:form.storage, colore:form.colore, imei:form.imei,
        si_accende:a.q1, schermo_rotto:a.q2, batteria_ok:a.q3,
        tipo_pagamento:form.tipo, cliente_nome:form.nome, cliente_tel:form.tel
      })
    } catch {}
    setPdfReady(true)
    upd({ step:6 })
    showToast('✓ Acquisto completato!')
  }

  const downloadPDF = async () => {
    const prezzo = form.tipo==='voucher' ? s.vouch : s.cash
    const doc = await generatePDF({
      nome:form.nome, tel:form.tel, cf:form.cf,
      brand:s.brand, modello:s.model, imei:form.imei,
      prezzo, tipoPagamento:form.tipo,
      firma, progressivo: Date.now().toString().slice(-5)
    })
    doc.save(`accettazione_${form.nome.replace(' ','_')}_${new Date().toISOString().slice(0,10)}.pdf`)
    showToast('✓ PDF scaricato!')
  }

  const handleDoc = (e, side) => {
    const f = e.target.files[0]
    if (!f) return
    const r = new FileReader()
    r.onload = ev => side==='fronte' ? setDocFronte(ev.target.result) : setDocRetro(ev.target.result)
    r.readAsDataURL(f)
  }

  // URL per firma remota via QR (pagina statica con canvas firma)
  const qrSignUrl = `${window.location.origin}/firma?id=${Date.now()}&nome=${encodeURIComponent(form.nome)}&brand=${encodeURIComponent(s.brand)}&modello=${encodeURIComponent(s.model)}`

  const InpStyle = { background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'white', borderRadius:9, padding:'9px 12px', fontFamily:'Inter,sans-serif', width:'100%', fontSize:13 }

  return (
    <div className="animate-fade-in">
      <div style={{marginBottom:28}}>
        <div style={{fontSize:20,fontWeight:700,marginBottom:3}}>Acquisto dispositivo</div>
        <div style={{fontSize:13,color:'#64748b'}}>Valuta, acquista e genera contratto — flusso guidato</div>
      </div>

      {/* Step indicator */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:0,marginBottom:28,maxWidth:600,margin:'0 auto 28px'}}>
        {steps.map((label,i) => {
          const n=i+1, done=n<s.step, active=n===s.step
          return (
            <div key={n} style={{display:'flex',alignItems:'center',gap:0,flex:i<5?1:undefined}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div style={{
                  width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:10.5,fontWeight:700,flexShrink:0,
                  background:done?'#22c55e':active?'#7c3aed':'rgba(255,255,255,0.08)',
                  color:(done||active)?'white':'#475569',
                  border:active?'2px solid #a855f7':'2px solid transparent',
                }}>{done?'✓':n}</div>
                <span style={{fontSize:8.5,color:active?'#c084fc':'#475569',whiteSpace:'nowrap'}}>{label}</span>
              </div>
              {i<5&&<div style={{flex:1,height:2,background:done?'#22c55e':'rgba(255,255,255,0.08)',margin:'0 3px',marginBottom:18}}/>}
            </div>
          )
        })}
      </div>

      {/* ── STEP 1: Dispositivo ── */}
      {s.step===1&&(
        <div style={cardStyle}>
          <div style={{position:'absolute',right:-30,top:-20,opacity:0.1,fontSize:120,color:'white',userSelect:'none'}}>✂</div>
          <div style={{fontSize:22,fontWeight:800,marginBottom:4}}>Seleziona dispositivo</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.6)',marginBottom:24}}>Scegli brand e modello da valutare</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:24}}>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <label style={{fontSize:11.5,color:'rgba(255,255,255,0.6)',fontWeight:500}}>Brand</label>
              <select value={s.brand} onChange={e=>upd({brand:e.target.value,model:''})} style={InpStyle}>
                <option value="">Seleziona...</option>
                {Object.keys(BRANDS).map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <label style={{fontSize:11.5,color:'rgba(255,255,255,0.6)',fontWeight:500}}>Modello</label>
              <select value={s.model} onChange={e=>upd({model:e.target.value})} style={InpStyle}>
                <option value="">Seleziona...</option>
                {(BRANDS[s.brand]||[]).map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <Btn onClick={()=>goStep(2)}>Continua →</Btn>
          </div>
        </div>
      )}

      {/* ── STEP 2: Condizioni ── */}
      {s.step===2&&(
        <div style={cardStyle}>
          <div style={{position:'absolute',right:-30,top:-20,opacity:0.1,fontSize:120,color:'white',userSelect:'none'}}>✂</div>
          <div style={{fontSize:22,fontWeight:800,marginBottom:4}}>Condizioni</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.6)',marginBottom:20}}>{s.brand} {s.model}</div>
          <Q label="Il dispositivo si accende?" desc="Verifica che superi la schermata di avvio" qk="q1" ans={s.ans} sa={sa}/>
          <Q label="Lo schermo è rotto?" desc="Crepe, pixel morti, touch difettoso" qk="q2" ans={s.ans} sa={sa}/>
          <Q label="La batteria è OK?" desc="Mantiene la carica regolarmente?" qk="q3" ans={s.ans} sa={sa}/>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:20}}>
            <Btn onClick={()=>upd({step:1})} secondary>← Indietro</Btn>
            <Btn onClick={()=>goStep(3)}>Calcola prezzo →</Btn>
          </div>
        </div>
      )}

      {/* ── STEP 3: Prezzo ── */}
      {s.step===3&&(
        <div style={cardStyle}>
          <div style={{fontSize:22,fontWeight:800,marginBottom:4}}>Valutazione</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.6)',marginBottom:20}}>{s.brand} {s.model}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:24}}>
            <div style={{background:'rgba(255,255,255,0.08)',borderRadius:12,padding:20,textAlign:'center'}}>
              <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(255,255,255,0.5)',marginBottom:8}}>💵 Pagamento cash</div>
              <div style={{fontSize:36,fontWeight:800,fontFamily:'monospace'}}>€{s.cash}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:4}}>Pagamento immediato</div>
            </div>
            <div style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:12,padding:20,textAlign:'center'}}>
              <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(255,255,255,0.7)',marginBottom:8}}>🎁 Buono acquisto</div>
              <div style={{fontSize:36,fontWeight:800,fontFamily:'monospace'}}>€{s.vouch}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:4}}>+20% in buono negozio</div>
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <Btn onClick={()=>upd({step:2})} secondary>← Indietro</Btn>
            <Btn onClick={()=>upd({step:4})}>Il cliente accetta →</Btn>
          </div>
        </div>
      )}

      {/* ── STEP 4: Dati cliente + documento ── */}
      {s.step===4&&(
        <div style={cardStyle}>
          <div style={{fontSize:22,fontWeight:800,marginBottom:4}}>Dati cliente</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.6)',marginBottom:20,textTransform:'uppercase',letterSpacing:'0.05em'}}>Dati principali</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:13,marginBottom:20}}>
            {[['Nome e cognome','nome','Mario Rossi','1/-1'],['Codice fiscale','cf','RSSMRA80A01L219K','1/-1'],['Telefono','tel','+39 333...',''],['Nato a','natoA','Torino',''],['Nato il','natoIl','01/01/1980',''],['Residenza','residente','Torino',''],['Indirizzo','indirizzo','Via Roma 1','1/-1']].map(([l,k,ph,gc])=>(
              <div key={k} style={{gridColumn:gc||undefined,display:'flex',flexDirection:'column',gap:6}}>
                <label style={{fontSize:11.5,color:'rgba(255,255,255,0.6)'}}>{l}</label>
                <input placeholder={ph} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} style={InpStyle}/>
              </div>
            ))}
          </div>

          <div style={{borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:16,marginBottom:16}}>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.6)',marginBottom:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Dettagli dispositivo</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:13}}>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <label style={{fontSize:11.5,color:'rgba(255,255,255,0.6)'}}>Storage</label>
                <select value={form.storage} onChange={e=>setForm({...form,storage:e.target.value})} style={InpStyle}>
                  {['64GB','128GB','256GB','512GB','1TB'].map(v=><option key={v}>{v}</option>)}
                </select>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <label style={{fontSize:11.5,color:'rgba(255,255,255,0.6)'}}>Colore</label>
                <input placeholder="Nero" value={form.colore} onChange={e=>setForm({...form,colore:e.target.value})} style={InpStyle}/>
              </div>
              <div style={{gridColumn:'1/-1',display:'flex',flexDirection:'column',gap:6}}>
                <label style={{fontSize:11.5,color:'rgba(255,255,255,0.6)'}}>IMEI</label>
                <input placeholder="356xxxxxxxxxxxxxx" value={form.imei} onChange={e=>setForm({...form,imei:e.target.value})} style={{...InpStyle,fontFamily:'monospace',fontSize:12}}/>
              </div>
              <div style={{gridColumn:'1/-1',display:'flex',flexDirection:'column',gap:6}}>
                <label style={{fontSize:11.5,color:'rgba(255,255,255,0.6)'}}>Tipo pagamento</label>
                <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} style={InpStyle}>
                  <option value="cash">Cash (€{s.cash})</option>
                  <option value="voucher">Buono acquisto (€{s.vouch})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Upload documento */}
          <div style={{borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:16,marginBottom:16}}>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.6)',marginBottom:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>📄 Documento d'identità</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:13,marginBottom:12}}>
              {[['fronte',docFronte,setDocFronte],['retro',docRetro,setDocRetro]].map(([side,img])=>(
                <div key={side}>
                  <label style={{fontSize:11.5,color:'rgba(255,255,255,0.6)',display:'block',marginBottom:6,textTransform:'capitalize'}}>{side}</label>
                  <label style={{
                    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                    background:'rgba(255,255,255,0.06)',border:'2px dashed rgba(255,255,255,0.2)',
                    borderRadius:10,padding:img?0:'20px 10px',cursor:'pointer',overflow:'hidden',
                    minHeight:90,transition:'border-color 0.15s',
                  }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.4)'}
                    onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'}
                  >
                    {img
                      ? <img src={img} alt={side} style={{width:'100%',maxHeight:120,objectFit:'cover'}}/>
                      : <>
                          <span style={{fontSize:24,marginBottom:6,opacity:0.5}}>📷</span>
                          <span style={{fontSize:11,color:'rgba(255,255,255,0.4)',textAlign:'center'}}>Carica {side}<br/>Tocca per scegliere</span>
                        </>
                    }
                    <input type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e=>handleDoc(e,side)}/>
                  </label>
                </div>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <label style={{fontSize:11.5,color:'rgba(255,255,255,0.6)'}}>Numero documento</label>
              <input placeholder="CA00000AA" value={docNum} onChange={e=>setDocNum(e.target.value)} style={InpStyle}/>
            </div>
          </div>

          <div style={{display:'flex',justifyContent:'space-between'}}>
            <Btn onClick={()=>upd({step:3})} secondary>← Indietro</Btn>
            <Btn onClick={()=>goStep(5)}>Vai alla firma →</Btn>
          </div>
        </div>
      )}

      {/* ── STEP 5: Firma digitale ── */}
      {s.step===5&&(
        <div style={cardStyle}>
          <div style={{fontSize:22,fontWeight:800,marginBottom:4}}>Firma del cliente</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.6)',marginBottom:20}}>Il cliente deve firmare il contratto di acquisto</div>

          {/* Opzione 1: Firma diretta */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.7)',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.06em'}}>
              ✍️ Opzione 1 — Firma qui (mouse/touch)
            </div>
            <SignaturePad
              onSave={(data) => { setFirma(data); showToast('✓ Firma acquisita!') }}
              onClear={() => setFirma(null)}
            />
            {firma && (
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8,background:'rgba(34,197,94,0.15)',borderRadius:8,padding:'8px 12px'}}>
                <span style={{color:'#4ade80',fontSize:14}}>✓</span>
                <span style={{fontSize:12,color:'#4ade80'}}>Firma acquisita con successo</span>
              </div>
            )}
          </div>

          {/* Opzione 2: QR code */}
          <div style={{borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:16,marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.7)',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.06em'}}>
              📱 Opzione 2 — QR code (firma su telefono)
            </div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:12}}>
              Il cliente scansiona il QR con il telefono e firma sul suo schermo
            </div>
            <button onClick={()=>setShowQR(!showQR)} style={{
              background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',
              color:'white',borderRadius:9,padding:'9px 18px',fontSize:13,fontWeight:500,
              cursor:'pointer',fontFamily:'Inter,sans-serif',marginBottom: showQR?14:0,
            }}>
              {showQR ? '🙈 Nascondi QR' : '📲 Mostra QR code'}
            </button>
            {showQR&&(
              <div style={{display:'flex',gap:20,alignItems:'center',background:'white',borderRadius:12,padding:16,width:'fit-content'}}>
                <QRCode value={qrSignUrl} size={140}/>
                <div>
                  <div style={{fontSize:13,color:'#1e3a8a',fontWeight:700,marginBottom:6}}>Scansiona per firmare</div>
                  <div style={{fontSize:11,color:'#475569',maxWidth:180,lineHeight:1.6}}>
                    Il cliente punta la fotocamera del telefono sul QR code per aprire la pagina di firma
                  </div>
                  <div style={{fontSize:10,color:'#94a3b8',marginTop:8,wordBreak:'break-all'}}>
                    {form.nome} • {s.brand} {s.model}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{display:'flex',justifyContent:'space-between'}}>
            <Btn onClick={()=>upd({step:4})} secondary>← Indietro</Btn>
            <Btn onClick={confirm} style={{background: firma ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.2)'}}>
              ✓ Conferma acquisto
            </Btn>
          </div>
        </div>
      )}

      {/* ── STEP 6: Completato + PDF ── */}
      {s.step===6&&(
        <div style={{...cardStyle, textAlign:'center'}}>
          <div style={{fontSize:52,marginBottom:16}}>✅</div>
          <div style={{fontSize:24,fontWeight:800,marginBottom:8}}>Acquisto completato!</div>
          <div style={{fontSize:15,color:'rgba(255,255,255,0.7)',marginBottom:24}}>
            {s.brand} {s.model} aggiunto al magazzino come "da testare"
          </div>

          {/* Riepilogo */}
          <div style={{background:'rgba(255,255,255,0.08)',borderRadius:12,padding:16,marginBottom:24,textAlign:'left',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:13}}>
            <div><span style={{color:'rgba(255,255,255,0.5)'}}>Cliente: </span><strong>{form.nome}</strong></div>
            <div><span style={{color:'rgba(255,255,255,0.5)'}}>Tel: </span>{form.tel}</div>
            <div><span style={{color:'rgba(255,255,255,0.5)'}}>Dispositivo: </span>{s.brand} {s.model}</div>
            <div><span style={{color:'rgba(255,255,255,0.5)'}}>Pagato: </span><strong>€{form.tipo==='voucher'?s.vouch:s.cash} ({form.tipo})</strong></div>
            {docFronte&&<div style={{gridColumn:'1/-1'}}><span style={{color:'rgba(255,255,255,0.5)'}}>Documento: </span>✓ Caricato</div>}
            {firma&&<div style={{gridColumn:'1/-1'}}><span style={{color:'rgba(255,255,255,0.5)'}}>Firma: </span>✓ Acquisita</div>}
          </div>

          {/* Pulsanti azione */}
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={downloadPDF} style={{
              background:'rgba(255,255,255,0.9)',color:'#1e3a8a',border:'none',
              borderRadius:10,padding:'12px 24px',fontSize:14,fontWeight:700,
              cursor:'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:8,
            }}>
              📄 Scarica contratto PDF
            </button>
            <Btn onClick={()=>{ setS(INIT); setForm({nome:'',cf:'',tel:'',storage:'128GB',colore:'',imei:'',tipo:'cash',note:'',natoA:'',natoIl:'',residente:'',indirizzo:''}); setFirma(null); setDocFronte(null); setDocRetro(null); setShowQR(false); setPdfReady(false) }}>
              + Nuovo acquisto
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}
