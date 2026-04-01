// Wizard.jsx — Componente riutilizzabile per inserimento guidato step-by-step

import { useState } from 'react'

const S = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  box: { background:'#0a0f1e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', fontFamily:'Inter,sans-serif', color:'white' },
  header: { padding:'24px 28px 0', borderBottom:'1px solid rgba(255,255,255,0.07)', paddingBottom:20, marginBottom:0 },
  body: { padding:'24px 28px' },
  footer: { padding:'16px 28px 24px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center' },
  inp: { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'12px 14px', color:'white', fontFamily:'Inter,sans-serif', fontSize:14, width:'100%', transition:'border-color 0.15s, box-shadow 0.15s', outline:'none' },
  lbl: { fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:7 },
  hint: { fontSize:12, color:'rgba(255,255,255,0.3)', marginTop:5, lineHeight:1.5 },
  err: { background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#f87171', marginBottom:16, display:'flex', alignItems:'center', gap:8 },
}

const PrimaryBtn = ({onClick,children,disabled}) => (
  <button onClick={onClick} disabled={disabled} style={{
    background:disabled?'rgba(255,255,255,0.07)':'linear-gradient(135deg,#7c3aed,#6d28d9)',
    color:disabled?'rgba(255,255,255,0.3)':'white', border:'none',
    borderRadius:10, padding:'11px 28px', fontSize:14, fontWeight:700,
    cursor:disabled?'not-allowed':'pointer', fontFamily:'Inter,sans-serif',
    boxShadow:disabled?'none':'0 4px 14px rgba(109,40,217,0.35)',
    transition:'all 0.15s', display:'flex', alignItems:'center', gap:8,
  }}>{children}</button>
)

const GhostBtn = ({onClick,children}) => (
  <button onClick={onClick} style={{
    background:'transparent', color:'rgba(255,255,255,0.4)',
    border:'1px solid rgba(255,255,255,0.1)', borderRadius:10,
    padding:'11px 22px', fontSize:13, fontWeight:500,
    cursor:'pointer', fontFamily:'Inter,sans-serif',
  }}>{children}</button>
)

// Opzione selezionabile (griglia di card)
export const OptionCard = ({icon, label, desc, selected, onClick}) => (
  <button onClick={onClick} style={{
    background:selected?'rgba(124,58,237,0.2)':'rgba(255,255,255,0.03)',
    border:selected?'1.5px solid rgba(124,58,237,0.5)':'1px solid rgba(255,255,255,0.08)',
    borderRadius:12, padding:'14px 16px', cursor:'pointer', textAlign:'left',
    fontFamily:'Inter,sans-serif', transition:'all 0.15s', width:'100%',
    boxShadow:selected?'0 0 16px rgba(124,58,237,0.2)':'none',
  }}>
    <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
    <div style={{fontSize:13.5,fontWeight:600,color:selected?'#c4b5fd':'white',marginBottom:2}}>{label}</div>
    {desc&&<div style={{fontSize:11.5,color:'rgba(255,255,255,0.35)',lineHeight:1.5}}>{desc}</div>}
  </button>
)

// Campo input con focus ring viola
export const WizField = ({label, hint, error, children}) => (
  <div style={{marginBottom:18}}>
    {label&&<label style={S.lbl}>{label}</label>}
    {children}
    {hint&&!error&&<div style={S.hint}>💡 {hint}</div>}
    {error&&<div style={{...S.hint,color:'#f87171',marginTop:5}}>⚠️ {error}</div>}
  </div>
)

// Stili input con focus viola
export const wizInp = {
  ...S.inp,
  onFocus: e => { e.target.style.borderColor='rgba(124,58,237,0.6)'; e.target.style.boxShadow='0 0 0 3px rgba(124,58,237,0.12)' },
  onBlur:  e => { e.target.style.borderColor='rgba(255,255,255,0.12)'; e.target.style.boxShadow='none' },
}

export const wizSel = { ...S.inp, cursor:'pointer' }

// Riepilogo finale prima della conferma
export const Summary = ({items}) => (
  <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'14px 18px'}}>
    {items.filter(i=>i.val).map(({label,val},i)=>(
      <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:i<items.filter(x=>x.val).length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
        <span style={{fontSize:12.5,color:'rgba(255,255,255,0.4)'}}>{label}</span>
        <span style={{fontSize:12.5,fontWeight:500,color:'white'}}>{val}</span>
      </div>
    ))}
  </div>
)

// Componente Wizard principale
export default function Wizard({ title, steps, onClose, onComplete }) {
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const current = steps[step]

  const next = async () => {
    setError('')
    if (current.validate) {
      const err = await current.validate()
      if (err) { setError(err); return }
    }
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      onComplete && onComplete()
    }
  }

  const back = () => {
    setError('')
    setStep(Math.max(0, step - 1))
  }

  const isLast = step === steps.length - 1
  const progress = ((step + 1) / steps.length) * 100

  return (
    <div style={S.overlay} onClick={e => e.target===e.currentTarget&&onClose()}>
      <div style={S.box}>
        {/* Header */}
        <div style={S.header}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
            <div>
              <div style={{fontSize:17,fontWeight:700,marginBottom:3}}>{title}</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.35)'}}>
                Passo {step+1} di {steps.length} — {current.title}
              </div>
            </div>
            <button onClick={onClose} style={{background:'rgba(255,255,255,0.07)',border:'none',color:'rgba(255,255,255,0.5)',width:30,height:30,borderRadius:8,cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
          </div>
          {/* Progress bar */}
          <div style={{height:3,background:'rgba(255,255,255,0.08)',borderRadius:4,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${progress}%`,background:'linear-gradient(90deg,#7c3aed,#a78bfa)',borderRadius:4,transition:'width 0.3s ease'}}/>
          </div>
        </div>

        {/* Step dots */}
        <div style={{display:'flex',justifyContent:'center',gap:6,padding:'14px 0 0'}}>
          {steps.map((_,i)=>(
            <div key={i} style={{
              width:i===step?24:8, height:8, borderRadius:4,
              background:i<step?'#22c55e':i===step?'#7c3aed':'rgba(255,255,255,0.12)',
              transition:'all 0.3s',
            }}/>
          ))}
        </div>

        {/* Body */}
        <div style={S.body}>
          {/* Titolo step */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>{current.heading||current.title}</div>
            {current.subtitle&&<div style={{fontSize:13.5,color:'rgba(255,255,255,0.45)',lineHeight:1.6}}>{current.subtitle}</div>}
          </div>

          {/* Errore */}
          {error&&(
            <div style={S.err}>
              <span style={{fontSize:16}}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Contenuto dello step */}
          {current.content}
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <div>
            {step > 0
              ? <GhostBtn onClick={back}>← Indietro</GhostBtn>
              : <GhostBtn onClick={onClose}>Annulla</GhostBtn>
            }
          </div>
          <PrimaryBtn onClick={next}>
            {isLast ? '✓ Conferma' : 'Avanti →'}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  )
}
