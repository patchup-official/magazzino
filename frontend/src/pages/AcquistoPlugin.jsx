// AcquistoPlugin.jsx - Design Figma (gradiente viola come Frame 5/6)

import { useState } from 'react'
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

export default function AcquistoPlugin({ api, showToast }) {
  const [s, setS] = useState(INIT)
  const [form, setForm] = useState({ nome:'', tel:'', storage:'128GB', colore:'', imei:'', tipo:'cash', note:'' })

  const upd = c => setS(p => ({...p,...c}))

  const steps = ['Dispositivo','Condizioni','Prezzo','Cliente','Fatto']

  const goStep = async (n) => {
    if (n===2) {
      if (!s.brand||!s.model) { showToast('Seleziona brand e modello','error'); return }
    }
    if (n===3) {
      const a = s.ans
      if (a.q1===null||a.q2===null||a.q3===null) { showToast('Rispondi a tutte le domande','error'); return }
      let p=300
      if (!a.q1) p-=100; if (a.q2) p-=50; if (!a.q3) p-=30
      upd({ cash:Math.max(p,0), vouch:Math.round(Math.max(p,0)*1.2), step:3 })
      return
    }
    upd({ step: n })
  }

  const confirm = async () => {
    if (!form.nome||!form.tel) { showToast('Nome e telefono obbligatori','error'); return }
    const prezzo = form.tipo==='voucher' ? s.vouch : s.cash
    const a = s.ans
    const cond = (!a.q1||a.q2) ? 'C' : !a.q3 ? 'B' : 'A'
    try {
      await axios.post(`${api}/devices/create-from-evaluation`, {
        brand:s.brand, modello:s.model, storage:form.storage, colore:form.colore, imei:form.imei,
        si_accende:a.q1, schermo_rotto:a.q2, batteria_ok:a.q3,
        tipo_pagamento:form.tipo, cliente_nome:form.nome, cliente_tel:form.tel
      })
    } catch { /* demo fallback */ }
    upd({ step:5 })
    showToast('✓ Dispositivo aggiunto al magazzino!')
  }

  const sa = (q,v) => upd({ ans:{...s.ans,[q]:v} })

  // Wrapper con gradiente viola come nel Figma Frame 5/6
  const cardStyle = {
    background: 'linear-gradient(135deg, #3b0764 0%, #5b21b6 40%, #4c1d95 100%)',
    border: '1px solid rgba(167,139,250,0.2)',
    borderRadius: 16,
    padding: 28,
    maxWidth: 540,
    margin: '0 auto',
    position: 'relative',
    overflow: 'hidden',
  }

  // Icona decorativa in background (come nel Figma)
  const deco = (
    <div style={{ position:'absolute', right:-30, top:-20, opacity:0.12, fontSize:120, userSelect:'none', color:'white' }}>✂</div>
  )

  const Q = ({ label, desc, qk }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
      <div>
        <div style={{ fontSize:14, fontWeight:500 }}>{label}</div>
        {desc && <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{desc}</div>}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        {[['Sì',true],['No',false]].map(([l,v]) => {
          const sel = s.ans[qk]===v
          const isYes = l==='Sì'
          return <button key={l} onClick={()=>sa(qk,v)} style={{
            padding:'6px 16px', borderRadius:8, fontSize:12.5, fontWeight:500, cursor:'pointer', border:'none', fontFamily:'Inter,sans-serif',
            background: sel ? (isYes?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)') : 'rgba(255,255,255,0.1)',
            color: sel ? (isYes?'#4ade80':'#f87171') : 'rgba(255,255,255,0.6)',
            border: sel ? `1px solid ${isYes?'rgba(34,197,94,0.5)':'rgba(239,68,68,0.5)'}` : '1px solid rgba(255,255,255,0.1)',
          }}>{l}</button>
        })}
      </div>
    </div>
  )

  const Btn = ({onClick,children,secondary}) => (
    <button onClick={onClick} style={{
      padding:'10px 22px', borderRadius:10, fontSize:13.5, fontWeight:600, cursor:'pointer', border:'none', fontFamily:'Inter,sans-serif',
      background: secondary ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
      color: 'white',
      transition:'all 0.15s',
    }}
      onMouseEnter={e=>e.currentTarget.style.background=secondary?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.3)'}
      onMouseLeave={e=>e.currentTarget.style.background=secondary?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.2)'}
    >{children}</button>
  )

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:20, fontWeight:700, marginBottom:3 }}>Acquisto dispositivo</div>
        <div style={{ fontSize:13, color:'#64748b' }}>Valuta e acquista da privati — flusso guidato</div>
      </div>

      {/* Step indicator */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0, marginBottom:28, maxWidth:540, margin:'0 auto 28px' }}>
        {steps.map((label,i) => {
          const n=i+1, done=n<s.step, active=n===s.step
          return (
            <div key={n} style={{ display:'flex', alignItems:'center', gap:0, flex: i<4?1:undefined }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:700, flexShrink:0,
                  background: done?'#22c55e':active?'#7c3aed':'rgba(255,255,255,0.08)',
                  color: (done||active)?'white':'#475569',
                  border: active?'2px solid #a855f7':'2px solid transparent',
                  transition:'all 0.2s',
                }}>{done?'✓':n}</div>
                <span style={{ fontSize:9, color: active?'#c084fc':'#475569', whiteSpace:'nowrap' }}>{label}</span>
              </div>
              {i<4 && <div style={{ flex:1, height:2, background:done?'#22c55e':'rgba(255,255,255,0.08)', margin:'0 4px', marginBottom:18 }} />}
            </div>
          )
        })}
      </div>

      {/* STEP 1 */}
      {s.step===1 && (
        <div style={cardStyle}>
          {deco}
          <div style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>Nuovo acquisto</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)', marginBottom:24 }}>Seleziona il dispositivo da valutare</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontSize:11.5, color:'rgba(255,255,255,0.6)', fontWeight:500 }}>Brand</label>
              <select value={s.brand} onChange={e=>upd({brand:e.target.value,model:''})}
                style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:9, padding:'10px 12px', color:'white', fontSize:13 }}>
                <option value="">Seleziona...</option>
                {Object.keys(BRANDS).map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontSize:11.5, color:'rgba(255,255,255,0.6)', fontWeight:500 }}>Modello</label>
              <select value={s.model} onChange={e=>upd({model:e.target.value})}
                style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:9, padding:'10px 12px', color:'white', fontSize:13 }}>
                <option value="">Seleziona...</option>
                {(BRANDS[s.brand]||[]).map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <Btn onClick={()=>goStep(2)}>Continua →</Btn>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {s.step===2 && (
        <div style={cardStyle}>
          {deco}
          <div style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>Condizioni</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)', marginBottom:20 }}>{s.brand} {s.model}</div>
          <Q label="Il dispositivo si accende?" desc="Verifica che superi la schermata di avvio" qk="q1" />
          <Q label="Lo schermo è rotto?" desc="Crepe, pixel morti, touch difettoso" qk="q2" />
          <Q label="La batteria è OK?" desc="Mantiene la carica regolarmente?" qk="q3" />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:20 }}>
            <Btn onClick={()=>upd({step:1})} secondary>← Indietro</Btn>
            <Btn onClick={()=>goStep(3)}>Calcola →</Btn>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {s.step===3 && (
        <div style={cardStyle}>
          {deco}
          <div style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>Valutazione</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)', marginBottom:20 }}>{s.brand} {s.model}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
            <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:20, textAlign:'center' }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.5)', marginBottom:8 }}>💵 Cash</div>
              <div style={{ fontSize:32, fontWeight:800, fontFamily:'monospace' }}>€{s.cash}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:4 }}>Pagamento immediato</div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:12, padding:20, textAlign:'center' }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.7)', marginBottom:8 }}>🎁 Buono</div>
              <div style={{ fontSize:32, fontWeight:800, fontFamily:'monospace' }}>€{s.vouch}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:4 }}>+20% in buono</div>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <Btn onClick={()=>upd({step:2})} secondary>← Indietro</Btn>
            <Btn onClick={()=>upd({step:4})}>Cliente accetta →</Btn>
          </div>
        </div>
      )}

      {/* STEP 4 */}
      {s.step===4 && (
        <div style={cardStyle}>
          {deco}
          <div style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>Dati cliente</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)', marginBottom:20 }}>DATI PRINCIPALI</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13, marginBottom:20 }}>
            {[['Nome e cognome','nome','Mario Rossi'],['Telefono','tel','+39 333...']].map(([l,k,ph])=>(
              <div key={k} style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontSize:11.5, color:'rgba(255,255,255,0.6)' }}>{l}</label>
                <input placeholder={ph} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}
                  style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'white' }} />
              </div>
            ))}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontSize:11.5, color:'rgba(255,255,255,0.6)' }}>Storage</label>
              <select value={form.storage} onChange={e=>setForm({...form,storage:e.target.value})}
                style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'9px 12px', color:'white', fontSize:13 }}>
                {['64GB','128GB','256GB','512GB','1TB'].map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontSize:11.5, color:'rgba(255,255,255,0.6)' }}>Colore</label>
              <input placeholder="Nero" value={form.colore} onChange={e=>setForm({...form,colore:e.target.value})}
                style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'white' }} />
            </div>
            <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontSize:11.5, color:'rgba(255,255,255,0.6)' }}>IMEI (opzionale)</label>
              <input placeholder="356xxxxxxxxxxxxxx" value={form.imei} onChange={e=>setForm({...form,imei:e.target.value})}
                style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'white', fontFamily:'monospace', fontSize:12 }} />
            </div>
            <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontSize:11.5, color:'rgba(255,255,255,0.6)' }}>Tipo pagamento</label>
              <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}
                style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'9px 12px', color:'white', fontSize:13 }}>
                <option value="cash">Cash (€{s.cash})</option>
                <option value="voucher">Buono acquisto (€{s.vouch})</option>
              </select>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <Btn onClick={()=>upd({step:3})} secondary>← Indietro</Btn>
            <Btn onClick={confirm}>✓ Conferma acquisto</Btn>
          </div>
        </div>
      )}

      {/* STEP 5 */}
      {s.step===5 && (
        <div style={{ ...cardStyle, textAlign:'center' }}>
          <div style={{ fontSize:52, marginBottom:16 }}>✅</div>
          <div style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>È quasi tutto pronto!</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)', marginBottom:20 }}>
            {s.brand} {s.model} aggiunto al magazzino come "da testare"
          </div>
          <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:16, marginBottom:24, textAlign:'left', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, fontSize:13 }}>
            <div><span style={{ color:'rgba(255,255,255,0.5)' }}>Cliente: </span><strong>{form.nome}</strong></div>
            <div><span style={{ color:'rgba(255,255,255,0.5)' }}>Tel: </span>{form.tel}</div>
            <div><span style={{ color:'rgba(255,255,255,0.5)' }}>Dispositivo: </span>{s.brand} {s.model}</div>
            <div><span style={{ color:'rgba(255,255,255,0.5)' }}>Pagato: </span><strong>€{form.tipo==='voucher'?s.vouch:s.cash} ({form.tipo})</strong></div>
          </div>
          <Btn onClick={()=>{ setS(INIT); setForm({nome:'',tel:'',storage:'128GB',colore:'',imei:'',tipo:'cash',note:''}) }}>+ Nuovo acquisto</Btn>
        </div>
      )}
    </div>
  )
}
