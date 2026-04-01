// AcquistoPlugin.jsx - Con motore valutazione reale basato su prezzi di mercato

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const INIT = {
  step: 1,
  brand: '', model: '', storage: '',
  condizioni: {},
  cash: 0, voucher: 0,
  prezzoMercato: 0,
  breakdown: [],
  condizione: 'B',
}

const cardStyle = {
  background: 'linear-gradient(135deg,#3b0764 0%,#5b21b6 40%,#4c1d95 100%)',
  border: '1px solid rgba(167,139,250,0.2)',
  borderRadius: 16, padding: 28,
  maxWidth: 600, margin: '0 auto',
  position: 'relative', overflow: 'hidden',
}

const InpStyle = {
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  color: 'white', borderRadius: 9,
  padding: '9px 12px',
  fontFamily: 'Inter,sans-serif', width: '100%', fontSize: 13,
}

const Btn = ({ onClick, children, secondary, disabled, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: '10px 22px', borderRadius: 10, fontSize: 13.5, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', border: 'none',
    fontFamily: 'Inter,sans-serif',
    background: disabled ? 'rgba(255,255,255,0.08)' : secondary ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
    color: disabled ? 'rgba(255,255,255,0.3)' : 'white',
    transition: 'all 0.15s', ...style,
  }}>{children}</button>
)

// Firma digitale
function SignaturePad({ onSave, onClear }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const lastPos = useRef(null)
  const [vuota, setVuota] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    canvas.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio)
  }, [])

  const getPos = (e, c) => {
    const r = c.getBoundingClientRect()
    const t = e.touches ? e.touches[0] : e
    return { x: t.clientX - r.left, y: t.clientY - r.top }
  }
  const start = (e) => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current) }
  const draw = (e) => {
    e.preventDefault()
    if (!drawing.current) return
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e, canvasRef.current)
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y); ctx.strokeStyle = '#1e3a8a'
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke()
    lastPos.current = pos; setVuota(false)
  }
  const stop = (e) => { e.preventDefault(); drawing.current = false }
  const clear = () => {
    const c = canvasRef.current
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
    setVuota(true); if (onClear) onClear()
  }

  return (
    <div>
      <div style={{ background: 'white', borderRadius: 10, padding: 4, border: '2px solid rgba(255,255,255,0.3)', marginBottom: 8, cursor: 'crosshair' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 140, touchAction: 'none' }}
          onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={stop} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={clear} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Cancella</button>
        <button onClick={() => !vuota && onSave(canvasRef.current.toDataURL('image/png'))} style={{ background: vuota ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.25)', border: 'none', color: vuota ? 'rgba(255,255,255,0.3)' : 'white', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: vuota ? 'default' : 'pointer', fontFamily: 'Inter,sans-serif' }}>✓ Salva firma</button>
      </div>
    </div>
  )
}

function QRCode({ value }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=1e40af`
  return <img src={url} alt="QR" style={{ borderRadius: 10, display: 'block' }} width={140} height={140} />
}

async function generatePDF(data) {
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

  doc.setFillColor(30, 64, 175)
  doc.rect(0, 0, W, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13); doc.setFont(undefined, 'bold')
  doc.text('FOGLIO DI ACCETTAZIONE ACQUISTO', M, 12)
  doc.setFontSize(9); doc.setFont(undefined, 'normal')
  doc.text(`N. ${data.progressivo || '____'}   Data: ${new Date().toLocaleDateString('it-IT')}`, W - M, 12, { align: 'right' })

  y = 26
  doc.setTextColor(0, 0, 0); doc.setFontSize(8); doc.setTextColor(100, 100, 100)
  doc.text('PatchUP S.R.L. • Piazza Schiaparelli n.10 • P.IVA 04038180040 • savigliano@patchup.it • Tel. 3517810135', M, y)
  y += 8

  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 200, 200)
  doc.roundedRect(M, y, W - M * 2, 32, 3, 3, 'FD')
  doc.setTextColor(0, 0, 0); doc.setFontSize(11); doc.setFont(undefined, 'bold')
  doc.text(`Prezzo: € ${data.prezzo} (${data.tipoPagamento === 'voucher' ? 'Buono acquisto' : 'Contanti'})`, M + 4, y + 8)
  doc.setFont(undefined, 'normal'); doc.setFontSize(9)
  doc.text(`Nome: ${data.nome}`, M + 4, y + 15)
  doc.text(`Tel: ${data.tel}`, M + 4, y + 21)
  doc.text(`C.F.: ${data.cf || '—'}`, M + 4, y + 27)
  doc.text(`Dispositivo: ${data.brand} ${data.modello} ${data.storage}`, M + 90, y + 15)
  doc.text(`IMEI: ${data.imei || '—'}`, M + 90, y + 21)
  doc.text(`Prezzo mercato: €${data.prezzoMercato}`, M + 90, y + 27)
  y += 38

  doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.setTextColor(30, 64, 175)
  doc.text('Io sottoscritto/a dichiaro', M, y); y += 6

  doc.setFontSize(8.5); doc.setFont(undefined, 'normal'); doc.setTextColor(50, 50, 50)
  const testo = `con la presente e sotto la mia responsabilità: 1. Di aver provveduto a rimuovere, dal suddetto apparecchio, tutti i miei dati personali. 2. Che il dispositivo è di mia piena proprietà e non appartiene ad alcun operatore telefonico ed è libero da vincoli contrattuali. 3. Che autorizzo PatchUP S.R.L. a trattenere il bene. 4. Che accetto la valutazione sopra citata.`
  const lines = doc.splitTextToSize(testo, W - M * 2)
  doc.text(lines, M, y); y += lines.length * 4 + 8

  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 200, 200)
  doc.roundedRect(M, y, W - M * 2, 12, 2, 2, 'FD')
  doc.setFontSize(9); doc.setTextColor(0, 0, 0)
  doc.text(`N. Serie / IMEI: ${data.imei || '________________________'}`, M + 4, y + 8)
  y += 18

  doc.line(M, y + 15, M + 70, y + 15)
  doc.line(W - M - 70, y + 15, W - M, y + 15)
  doc.setFontSize(8); doc.setTextColor(120, 120, 120)
  doc.text('Data', M, y + 19)
  doc.text('Firma Cliente', W - M - 70, y + 19)
  if (data.firma) { try { doc.addImage(data.firma, 'PNG', W - M - 70, y - 8, 70, 20) } catch (e) { } }
  y += 28

  doc.setFontSize(7.5); doc.setTextColor(100, 100, 100)
  const privacy = 'Il cliente autorizza il trattamento dei propri dati personali ai fini dell\'acquisto. I dati non saranno diffusi a terzi.'
  doc.text(doc.splitTextToSize(privacy, W - M * 2), M, y)

  doc.setFillColor(30, 64, 175)
  doc.rect(0, 287, W, 10, 'F')
  doc.setTextColor(255, 255, 255); doc.setFontSize(7)
  doc.text('PatchUP S.R.L. — Documento generato automaticamente dal sistema Magazzino', W / 2, 293, { align: 'center' })

  return doc
}

// DOMANDE per ogni condizione
const DOMANDE_CONDIZIONI = [
  {
    chiave: 'non_si_accende',
    label: 'Il dispositivo si accende?',
    desc: 'Verifica che superi la schermata di avvio',
    inverti: true, // true = "No" attiva la penale
    penale: '-40%',
    colore: '#ef4444',
  },
  {
    chiave: 'icloud_bloccato',
    label: 'iCloud / account Google è libero?',
    desc: 'Nessun account bloccato, Find My iPhone disattivo',
    inverti: true,
    penale: '-85%',
    colore: '#ef4444',
    soloApple: false,
  },
  {
    chiave: 'schermo_rotto',
    label: 'Lo schermo è rotto o non funziona?',
    desc: 'Crepe, pixel morti, touch non risponde',
    inverti: false,
    penale: '-25%',
    colore: '#f59e0b',
  },
  {
    chiave: 'schermo_crepe',
    label: 'Ci sono crepe minori sul vetro?',
    desc: 'Piccole crepe che non compromettono il funzionamento',
    inverti: false,
    penale: '-15%',
    colore: '#f59e0b',
  },
  {
    chiave: 'batteria_sotto80',
    label: 'La batteria è sotto l\'80%?',
    desc: 'Non mantiene la carica normalmente',
    inverti: false,
    penale: '-10%',
    colore: '#f59e0b',
  },
  {
    chiave: 'scocca_graffi',
    label: 'Ci sono graffi evidenti sulla scocca?',
    desc: 'Graffi visibili sul corpo del dispositivo',
    inverti: false,
    penale: '-8%',
    colore: '#6b7280',
  },
  {
    chiave: 'fotocamera_rotta',
    label: 'La fotocamera funziona?',
    desc: 'Fotocamera anteriore e posteriore operative',
    inverti: true,
    penale: '-15%',
    colore: '#f59e0b',
  },
  {
    chiave: 'con_scatola',
    label: 'Ha la scatola originale?',
    desc: 'Scatola Apple/Samsung originale',
    inverti: false,
    bonus: true,
    penale: '+3%',
    colore: '#22c55e',
  },
]

export default function AcquistoPlugin({ api, showToast }) {
  const [s, setS] = useState(INIT)
  const [modelli, setModelli] = useState({})
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: '', cf: '', tel: '', storage: '128GB', colore: '',
    imei: '', tipo: 'cash', natoA: '', natoIl: '', residente: '', indirizzo: ''
  })
  const [firma, setFirma] = useState(null)
  const [docFronte, setDocFronte] = useState(null)
  const [docRetro, setDocRetro] = useState(null)
  const [showQR, setShowQR] = useState(false)
  const [docNum, setDocNum] = useState('')

  const upd = c => setS(p => ({ ...p, ...c }))

  const steps = ['Dispositivo', 'Condizioni', 'Prezzo', 'Cliente', 'Firma', 'Fine']

  // Carica modelli dal backend
  useEffect(() => {
    axios.get(`${api}/valutazione/modelli`)
      .then(({ data }) => setModelli(data))
      .catch(() => {
        // Fallback locale
        setModelli({
          Apple: { 'iPhone 13': ['128GB','256GB'], 'iPhone 14': ['128GB','256GB','512GB'], 'iPhone 14 Pro': ['128GB','256GB','512GB','1TB'], 'iPhone 15': ['128GB','256GB','512GB'], 'iPhone 15 Pro': ['128GB','256GB','512GB','1TB'], 'iPhone 16': ['128GB','256GB','512GB'], 'iPhone 16 Pro': ['128GB','256GB','512GB','1TB'] },
          Samsung: { 'Galaxy S23': ['128GB','256GB'], 'Galaxy S24': ['128GB','256GB'], 'Galaxy S24 Ultra': ['256GB','512GB'] },
          Google: { 'Pixel 8': ['128GB','256GB'], 'Pixel 8 Pro': ['128GB','256GB','512GB'] },
          Xiaomi: { '14': ['256GB','512GB'], '14 Ultra': ['256GB','512GB'] },
        })
      })
  }, [])

  const goStep = async (n) => {
    if (n === 2 && (!s.brand || !s.model || !s.storage)) {
      showToast('Seleziona brand, modello e storage', 'error'); return
    }
    if (n === 3) {
      // Calcola prezzo via backend
      setLoading(true)
      try {
        const { data } = await axios.post(`${api}/valutazione/calcola`, {
          brand: s.brand,
          modello: s.model,
          storage: s.storage,
          condizioni: s.condizioni,
        })
        if (data.ok) {
          upd({
            cash: data.prezzo_cash,
            voucher: data.prezzo_voucher,
            prezzoMercato: data.prezzo_mercato,
            breakdown: data.breakdown,
            condizione: data.condizione,
            step: 3,
          })
        } else {
          showToast('Modello non in listino — inserisci prezzo manualmente', 'error')
          upd({ step: 3, cash: 0, voucher: 0 })
        }
      } catch {
        // Fallback calcolo locale semplificato
        const base = 300
        let prezzo = base
        if (s.condizioni.non_si_accende) prezzo *= 0.60
        if (s.condizioni.schermo_rotto) prezzo *= 0.75
        if (s.condizioni.batteria_sotto80) prezzo *= 0.90
        prezzo = Math.round(prezzo)
        upd({ cash: prezzo, voucher: Math.round(prezzo * 1.2), step: 3 })
      } finally {
        setLoading(false)
      }
      return
    }
    upd({ step: n })
  }

  const toggleCondizione = (chiave, valore) => {
    // Per domande "invertite" (si accende, iCloud libero, fotocamera funziona)
    // Sì=true nel frontend ma la penale è "non_si_accende" nel backend → invertiamo
    const domanda = DOMANDE_CONDIZIONI.find(d => d.chiave === chiave)
    const valoreBackend = domanda?.inverti ? !valore : valore
    upd({ condizioni: { ...s.condizioni, [chiave]: valoreBackend } })
  }

  const confirm = async () => {
    if (!firma) { showToast('La firma è obbligatoria', 'error'); return }
    const prezzo = form.tipo === 'voucher' ? s.voucher : s.cash
    try {
      await axios.post(`${api}/devices/create-from-evaluation`, {
        brand: s.brand, modello: s.model,
        storage: form.storage || s.storage,
        colore: form.colore, imei: form.imei,
        si_accende: !s.condizioni.non_si_accende,
        schermo_rotto: !!s.condizioni.schermo_rotto,
        batteria_ok: !s.condizioni.batteria_sotto80,
        tipo_pagamento: form.tipo,
        cliente_nome: form.nome, cliente_tel: form.tel,
      })
    } catch { }
    upd({ step: 6 })
    showToast('✓ Acquisto completato!')
  }

  const downloadPDF = async () => {
    const prezzo = form.tipo === 'voucher' ? s.voucher : s.cash
    const doc = await generatePDF({
      nome: form.nome, tel: form.tel, cf: form.cf,
      brand: s.brand, modello: s.model,
      storage: form.storage || s.storage,
      imei: form.imei, prezzo,
      prezzoMercato: s.prezzoMercato,
      tipoPagamento: form.tipo,
      firma, progressivo: Date.now().toString().slice(-5),
    })
    doc.save(`accettazione_${form.nome.replace(' ', '_')}_${new Date().toISOString().slice(0, 10)}.pdf`)
    showToast('✓ PDF scaricato!')
  }

  const handleDoc = (e, side) => {
    const f = e.target.files[0]; if (!f) return
    const r = new FileReader()
    r.onload = ev => side === 'fronte' ? setDocFronte(ev.target.result) : setDocRetro(ev.target.result)
    r.readAsDataURL(f)
  }

  const qrUrl = `${window.location.origin}/firma?id=${Date.now()}&nome=${encodeURIComponent(form.nome)}&brand=${encodeURIComponent(s.brand)}&modello=${encodeURIComponent(s.model)}`

  const brandsDisponibili = Object.keys(modelli)
  const modelliPerBrand = modelli[s.brand] ? Object.keys(modelli[s.brand]) : []
  const storagePerModello = (modelli[s.brand] && modelli[s.brand][s.model]) ? modelli[s.brand][s.model] : []

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 3 }}>Acquisto dispositivo</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>
          Valutazione basata sui prezzi di mercato aggiornati • Flusso guidato
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28, maxWidth: 620, margin: '0 auto 28px' }}>
        {steps.map((label, i) => {
          const n = i + 1, done = n < s.step, active = n === s.step
          return (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 0, flex: i < 5 ? 1 : undefined }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 10.5, fontWeight: 700, flexShrink: 0,
                  background: done ? '#22c55e' : active ? '#7c3aed' : 'rgba(255,255,255,0.08)',
                  color: (done || active) ? 'white' : '#475569',
                  border: active ? '2px solid #a855f7' : '2px solid transparent',
                }}>{done ? '✓' : n}</div>
                <span style={{ fontSize: 8.5, color: active ? '#c084fc' : '#475569', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
              {i < 5 && <div style={{ flex: 1, height: 2, background: done ? '#22c55e' : 'rgba(255,255,255,0.08)', margin: '0 3px', marginBottom: 18 }} />}
            </div>
          )
        })}
      </div>

      {/* STEP 1: Dispositivo */}
      {s.step === 1 && (
        <div style={cardStyle}>
          <div style={{ position: 'absolute', right: -30, top: -20, opacity: 0.1, fontSize: 120, color: 'white', userSelect: 'none' }}>📱</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Seleziona dispositivo</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
            I prezzi si basano sul mercato italiano aggiornato
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Brand</label>
              <select value={s.brand} onChange={e => upd({ brand: e.target.value, model: '', storage: '' })} style={InpStyle}>
                <option value="">Seleziona...</option>
                {brandsDisponibili.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Modello</label>
              <select value={s.model} onChange={e => upd({ model: e.target.value, storage: '' })} style={InpStyle} disabled={!s.brand}>
                <option value="">Seleziona...</option>
                {modelliPerBrand.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Storage</label>
              <select value={s.storage} onChange={e => upd({ storage: e.target.value })} style={InpStyle} disabled={!s.model}>
                <option value="">Seleziona...</option>
                {storagePerModello.map(st => <option key={st}>{st}</option>)}
              </select>
            </div>
          </div>

          {/* Anteprima prezzo mercato */}
          {s.brand && s.model && s.storage && (
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>📊</span>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Prezzo mercato stimato</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#4ade80' }}>
                  La valutazione sarà calcolata dopo le domande
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={() => goStep(2)} disabled={!s.brand || !s.model || !s.storage}>
              Continua →
            </Btn>
          </div>
        </div>
      )}

      {/* STEP 2: Condizioni */}
      {s.step === 2 && (
        <div style={cardStyle}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Condizioni del dispositivo</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
            {s.brand} {s.model} {s.storage} — Rispondi con precisione per una valutazione corretta
          </div>

          {DOMANDE_CONDIZIONI.map(d => {
            // val è il valore UI (true=Sì, false=No)
            // valBackend è quello salvato in condizioni (già invertito se necessario)
            const valBackend = s.condizioni[d.chiave]
            // Ricostruiamo il val UI per mostrare i pulsanti correttamente
            const val = d.inverti ? (valBackend === undefined ? undefined : !valBackend) : valBackend
            const penaleAttiva = valBackend === true // penale attiva quando backend dice true
            return (
              <div key={d.chiave} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 500 }}>{d.label}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 20,
                      background: d.bonus ? 'rgba(34,197,94,0.2)' : penaleAttiva ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
                      color: d.bonus ? '#4ade80' : d.colore,
                    }}>{d.penale}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{d.desc}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
                  {[['Sì', true], ['No', false]].map(([l, v]) => {
                    const sel = val === v
                    const isPositivo = d.inverti ? v === true : v === false
                    return (
                      <button key={l} onClick={() => toggleCondizione(d.chiave, v)} style={{
                        padding: '5px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 500,
                        cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                        background: sel ? (isPositivo ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)') : 'rgba(255,255,255,0.08)',
                        color: sel ? (isPositivo ? '#4ade80' : '#f87171') : 'rgba(255,255,255,0.5)',
                        border: sel ? `1px solid ${isPositivo ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}` : '1px solid rgba(255,255,255,0.1)',
                      }}>{l}</button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <Btn onClick={() => upd({ step: 1 })} secondary>← Indietro</Btn>
            <Btn onClick={() => goStep(3)} disabled={loading}>
              {loading ? '⏳ Calcolo...' : 'Calcola prezzo →'}
            </Btn>
          </div>
        </div>
      )}

      {/* STEP 3: Prezzo */}
      {s.step === 3 && (
        <div style={cardStyle}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Valutazione</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
            {s.brand} {s.model} {s.storage}
          </div>

          {/* Breakdown */}
          {s.breakdown.length > 0 && (
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 18, fontSize: 12, fontFamily: 'monospace' }}>
              {s.breakdown.map((b, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '3px 0',
                  color: b.tipo === 'mercato' ? 'rgba(255,255,255,0.5)' : b.tipo === 'penale' ? '#f87171' : b.tipo === 'bonus' || b.tipo === 'permuta' ? '#4ade80' : 'rgba(255,255,255,0.8)',
                  borderBottom: i === 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  paddingBottom: i === 1 ? 6 : 3, marginBottom: i === 1 ? 3 : 0,
                }}>
                  <span>{b.voce}</span>
                  <span style={{ fontWeight: 700 }}>
                    {b.importo > 0 && b.tipo !== 'mercato' && b.tipo !== 'base' ? '+' : ''}
                    €{b.importo}
                    {b.percentuale ? ` (${b.percentuale > 0 ? '+' : ''}${b.percentuale}%)` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Prezzi finali */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>💵 Pagamento cash</div>
              <div style={{ fontSize: 40, fontWeight: 800, fontFamily: 'monospace', letterSpacing: -2 }}>€{s.cash}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Pagamento immediato</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>🎁 Buono acquisto</div>
              <div style={{ fontSize: 40, fontWeight: 800, fontFamily: 'monospace', letterSpacing: -2 }}>€{s.voucher}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>+20% in buono negozio</div>
            </div>
          </div>

          {/* Info mercato */}
          {s.prezzoMercato > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 11.5, color: 'rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'space-between' }}>
              <span>📊 Prezzo mercato attuale</span>
              <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>€{s.prezzoMercato}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Btn onClick={() => upd({ step: 2 })} secondary>← Modifica condizioni</Btn>
            <Btn onClick={() => upd({ step: 4 })}>Il cliente accetta →</Btn>
          </div>
        </div>
      )}

      {/* STEP 4: Dati cliente */}
      {s.step === 4 && (
        <div style={cardStyle}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Dati cliente</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dati principali</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13, marginBottom: 16 }}>
            {[['Nome e cognome', 'nome', 'Mario Rossi', '1/-1'], ['Codice fiscale', 'cf', 'RSSMRA80A01L219K', '1/-1'], ['Telefono', 'tel', '+39 333...', ''], ['Nato a', 'natoA', 'Torino', ''], ['Nato il', 'natoIl', '01/01/1980', ''], ['Residenza', 'residente', 'Torino (TO)', ''], ['Indirizzo', 'indirizzo', 'Via Roma 1', '1/-1']].map(([l, k, ph, gc]) => (
              <div key={k} style={{ gridColumn: gc || undefined, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>{l}</label>
                <input placeholder={ph} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} style={InpStyle} />
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dettagli dispositivo</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>Storage</label>
                <select value={form.storage || s.storage} onChange={e => setForm({ ...form, storage: e.target.value })} style={InpStyle}>
                  {(storagePerModello.length ? storagePerModello : ['64GB', '128GB', '256GB', '512GB', '1TB']).map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>Colore</label>
                <input placeholder="Nero" value={form.colore} onChange={e => setForm({ ...form, colore: e.target.value })} style={InpStyle} />
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>IMEI</label>
                <input placeholder="356xxxxxxxxxxxxxx" value={form.imei} onChange={e => setForm({ ...form, imei: e.target.value })} style={{ ...InpStyle, fontFamily: 'monospace', fontSize: 12 }} maxLength={15} />
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>Tipo pagamento</label>
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={InpStyle}>
                  <option value="cash">💵 Cash (€{s.cash})</option>
                  <option value="voucher">🎁 Buono acquisto (€{s.voucher})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Upload documento */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📄 Documento d'identità</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13, marginBottom: 12 }}>
              {[['fronte', docFronte], ['retro', docRetro]].map(([side, img]) => (
                <div key={side}>
                  <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6, textTransform: 'capitalize' }}>{side}</label>
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 10, padding: img ? 0 : '16px 10px', cursor: 'pointer', overflow: 'hidden', minHeight: 80, }}>
                    {img ? <img src={img} alt={side} style={{ width: '100%', maxHeight: 100, objectFit: 'cover' }} />
                      : <><span style={{ fontSize: 20, marginBottom: 4, opacity: 0.5 }}>📷</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Carica {side}</span></>}
                    <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleDoc(e, side)} />
                  </label>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>Numero documento</label>
              <input placeholder="CA00000AA" value={docNum} onChange={e => setDocNum(e.target.value)} style={InpStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Btn onClick={() => upd({ step: 3 })} secondary>← Indietro</Btn>
            <Btn onClick={() => goStep(5)}>Vai alla firma →</Btn>
          </div>
        </div>
      )}

      {/* STEP 5: Firma */}
      {s.step === 5 && (
        <div style={cardStyle}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Firma del cliente</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>Necessaria per completare il contratto di acquisto</div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>✍️ Firma qui (mouse o dito)</div>
            <SignaturePad onSave={(data) => { setFirma(data); showToast('✓ Firma acquisita!') }} onClear={() => setFirma(null)} />
            {firma && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, background: 'rgba(34,197,94,0.15)', borderRadius: 8, padding: '8px 12px' }}>
                <span style={{ color: '#4ade80', fontSize: 14 }}>✓</span>
                <span style={{ fontSize: 12, color: '#4ade80' }}>Firma acquisita con successo</span>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>📱 QR code (firma su telefono)</div>
            <button onClick={() => setShowQR(!showQR)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 9, padding: '8px 16px', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter,sans-serif', marginBottom: showQR ? 12 : 0 }}>
              {showQR ? '🙈 Nascondi QR' : '📲 Mostra QR code'}
            </button>
            {showQR && (
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', background: 'white', borderRadius: 12, padding: 16, width: 'fit-content' }}>
                <QRCode value={qrUrl} />
                <div>
                  <div style={{ fontSize: 13, color: '#1e3a8a', fontWeight: 700, marginBottom: 6 }}>Scansiona per firmare</div>
                  <div style={{ fontSize: 11, color: '#475569', maxWidth: 180, lineHeight: 1.6 }}>Il cliente punta la fotocamera sul QR per firmare sul telefono</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>{form.nome} • {s.brand} {s.model}</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Btn onClick={() => upd({ step: 4 })} secondary>← Indietro</Btn>
            <Btn onClick={confirm} style={{ background: firma ? 'rgba(34,197,94,0.35)' : undefined }} disabled={!firma}>
              ✓ Conferma acquisto
            </Btn>
          </div>
        </div>
      )}

      {/* STEP 6: Completato */}
      {s.step === 6 && (
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Acquisto completato!</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>
            {s.brand} {s.model} aggiunto al magazzino come "da testare"
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
            <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Cliente: </span><strong>{form.nome}</strong></div>
            <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Tel: </span>{form.tel}</div>
            <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Dispositivo: </span>{s.brand} {s.model} {s.storage}</div>
            <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Pagato: </span><strong style={{ color: '#4ade80' }}>€{form.tipo === 'voucher' ? s.voucher : s.cash} ({form.tipo})</strong></div>
            {s.prezzoMercato > 0 && <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'rgba(255,255,255,0.5)' }}>Prezzo mercato: </span>€{s.prezzoMercato} → acquistato al {Math.round((s.cash / s.prezzoMercato) * 100)}%</div>}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={downloadPDF} style={{ background: 'rgba(255,255,255,0.9)', color: '#1e3a8a', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
              📄 Scarica contratto PDF
            </button>
            <Btn onClick={() => { setS(INIT); setForm({ nome: '', cf: '', tel: '', storage: '128GB', colore: '', imei: '', tipo: 'cash', natoA: '', natoIl: '', residente: '', indirizzo: '' }); setFirma(null); setDocFronte(null); setDocRetro(null); setShowQR(false) }}>
              + Nuovo acquisto
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}
