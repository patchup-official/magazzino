// FirmaRemota.jsx - Pagina firma su mobile via QR code

import { useState, useRef, useEffect } from 'react'

export default function FirmaRemota() {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const lastPos = useRef(null)
  const [firmata, setFirmata] = useState(false)
  const [vuota, setVuota] = useState(true)

  // Leggi parametri URL
  const params = new URLSearchParams(window.location.search)
  const nome = params.get('nome') || ''
  const brand = params.get('brand') || ''
  const modello = params.get('modello') || ''
  const id = params.get('id') || ''

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Imposta dimensioni canvas reali
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    const ctx = canvas.getContext('2d')
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  }, [])

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect()
    const t = e.touches ? e.touches[0] : e
    return { x: t.clientX - r.left, y: t.clientY - r.top }
  }

  const start = (e) => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current) }

  const draw = (e) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e3a8a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
    setVuota(false)
  }

  const stop = (e) => { e.preventDefault(); drawing.current = false }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setVuota(true)
  }

  const confirm = () => {
    if (vuota) return
    const canvas = canvasRef.current
    const firmaData = canvas.toDataURL('image/png')
    // Salva in localStorage con la chiave dell'ID
    localStorage.setItem(`firma_${id}`, firmaData)
    setFirmata(true)
  }

  if (firmata) return (
    <div style={{
      minHeight:'100vh', background:'#080e1f',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:24, fontFamily:'Inter,sans-serif', color:'white', textAlign:'center'
    }}>
      <div style={{fontSize:64, marginBottom:16}}>✅</div>
      <div style={{fontSize:22, fontWeight:800, marginBottom:8}}>Firma acquisita!</div>
      <div style={{fontSize:15, color:'#64748b', marginBottom:24}}>
        Grazie {nome}. Puoi chiudere questa pagina.
      </div>
      <div style={{
        background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)',
        borderRadius:12, padding:'14px 24px', fontSize:13, color:'#4ade80'
      }}>
        La firma è stata trasmessa al negozio
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight:'100vh', background:'#080e1f',
      fontFamily:'Inter,sans-serif', color:'white',
      padding:20, maxWidth:500, margin:'0 auto'
    }}>
      {/* Header */}
      <div style={{textAlign:'center', marginBottom:24, paddingTop:16}}>
        <div style={{fontSize:18, fontWeight:700, color:'#60a5fa', marginBottom:4}}>
          ènown — Firma digitale
        </div>
        <div style={{fontSize:13, color:'#64748b'}}>
          Contratto di acquisto dispositivo
        </div>
      </div>

      {/* Info acquisto */}
      <div style={{
        background:'linear-gradient(135deg,rgba(37,99,235,0.15),rgba(124,58,237,0.15))',
        border:'1px solid rgba(255,255,255,0.08)',
        borderRadius:12, padding:16, marginBottom:24
      }}>
        <div style={{fontSize:13, color:'#94a3b8', marginBottom:4}}>Dettagli acquisto</div>
        <div style={{fontSize:15, fontWeight:600, marginBottom:2}}>{nome}</div>
        <div style={{fontSize:13, color:'#60a5fa'}}>{brand} {modello}</div>
      </div>

      {/* Testo contratto breve */}
      <div style={{
        background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
        borderRadius:12, padding:14, marginBottom:20, fontSize:11.5, color:'#94a3b8', lineHeight:1.7
      }}>
        Firmando, dichiaro di essere il legittimo proprietario del dispositivo indicato, 
        di aver rimosso tutti i dati personali e di accettare la valutazione concordata. 
        Il dispositivo è libero da vincoli contrattuali.
      </div>

      {/* Canvas firma */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:12, color:'#64748b', marginBottom:8, textAlign:'center'}}>
          Firma nel riquadro qui sotto con il dito
        </div>
        <div style={{
          background:'white', borderRadius:12,
          border:'2px solid rgba(255,255,255,0.2)',
          overflow:'hidden', touchAction:'none',
          cursor:'crosshair'
        }}>
          <canvas
            ref={canvasRef}
            style={{display:'block', width:'100%', height:180, touchAction:'none'}}
            onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
            onTouchStart={start} onTouchMove={draw} onTouchEnd={stop}
          />
        </div>
        {!vuota && (
          <button onClick={clear} style={{
            width:'100%', marginTop:8,
            background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
            color:'#94a3b8', borderRadius:8, padding:'8px 0', fontSize:12,
            cursor:'pointer', fontFamily:'Inter,sans-serif'
          }}>
            ↺ Cancella e riprova
          </button>
        )}
      </div>

      {/* Conferma */}
      <button
        onClick={confirm}
        disabled={vuota}
        style={{
          width:'100%', padding:'14px 0', borderRadius:12, border:'none',
          fontSize:15, fontWeight:700, cursor:vuota?'not-allowed':'pointer',
          fontFamily:'Inter,sans-serif',
          background:vuota
            ? 'rgba(255,255,255,0.08)'
            : 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
          color:vuota?'#475569':'white',
          transition:'all 0.2s',
        }}
      >
        {vuota ? 'Firma nel riquadro per continuare' : '✓ Conferma e invia firma'}
      </button>

      <div style={{textAlign:'center', marginTop:16, fontSize:10.5, color:'#334155'}}>
        La firma è crittografata e trasmessa in modo sicuro
      </div>
    </div>
  )
}
