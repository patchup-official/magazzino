// CreaNuovo.jsx — Pannello modale "Crea nuovo"

import { useState, useEffect, useRef } from 'react'

/* ─── Dati delle voci ─── */
const SEZIONI = [
  {
    id: 'servizi',
    label: 'Servizi',
    color: '#3b82f6',
    items: [
      { id:'riparazione', icon:'🔧', label:'Nuova riparazione',   desc:'Apri un lavoro di riparazione su un dispositivo' },
      { id:'servizio',    icon:'⚡', label:'Nuovo servizio',       desc:'Sblocco, diagnostica, aggiornamento...' },
    ]
  },
  {
    id: 'clienti',
    label: 'Clienti',
    color: '#10b981',
    items: [
      { id:'cliente', icon:'👤', label:'Nuovo cliente', desc:'Registra anagrafica cliente nel sistema' },
    ]
  },
  {
    id: 'magazzino',
    label: 'Magazzino',
    color: '#f59e0b',
    items: [
      { id:'prodotto', icon:'📦', label:'Nuovo prodotto', desc:'Accessorio, cover, cavo, adattatore...' },
      { id:'ricambio', icon:'🔩', label:'Nuovo ricambio', desc:'Componente per riparazioni interne' },
    ]
  },
  {
    id: 'dispositivi',
    label: 'Dispositivi',
    color: '#8b5cf6',
    special: true, // ha il sottoflow
    items: [
      { id:'da_privato',   icon:'👤', label:'Acquisto da privato',   desc:'Compra con valutazione e contratto' },
      { id:'da_fornitore', icon:'🏭', label:'Acquisto da fornitore', desc:'Da grossista, ricondizionatore...' },
    ]
  },
]

/* ─── Componente ─── */
export default function CreaNuovo({ onSelect }) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(null)
  const ref = useRef(null)

  // Esc per chiudere
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const select = (id) => { setOpen(false); onSelect(id) }

  return (
    <>
      {/* ─── Bottone nella sidebar ─── */}
      <div ref={ref} style={{ padding:'0 10px 10px' }}>
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 12px', borderRadius: 9,
            border: open ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.1)',
            background: open ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
            color: open ? '#c4b5fd' : '#94a3b8',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'Inter,sans-serif', transition: 'all 0.15s',
          }}
        >
          <span style={{
            fontSize: 18, lineHeight: 1, fontWeight: 300,
            display: 'inline-block', transition: 'transform 0.2s',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          }}>+</span>
          Crea nuovo
        </button>
      </div>

      {/* ─── Overlay + Pannello ─── */}
      {open && (
        <>
          {/* Sfondo scuro */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 900,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(3px)',
            }}
          />

          {/* Pannello */}
          <div style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            zIndex: 901,
            width: 560, maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
            background: '#0d1529',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
            padding: '28px 28px 24px',
            animation: 'cnSlideIn 0.18s cubic-bezier(.22,.68,0,1.2)',
          }}>
            <style>{`
              @keyframes cnSlideIn {
                from { opacity:0; transform:translate(-50%,-47%) scale(0.97) }
                to   { opacity:1; transform:translate(-50%,-50%) scale(1) }
              }
            `}</style>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 3 }}>
                  Cosa vuoi creare?
                </div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.35)' }}>
                  Seleziona una delle opzioni qui sotto
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: 'rgba(255,255,255,0.4)',
                  fontSize: 16, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            </div>

            {/* Sezioni */}
            {SEZIONI.map(sez => (
              <div key={sez.id} style={{ marginBottom: 22 }}>
                {/* Label sezione */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: sez.color, flexShrink: 0 }}/>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
                    textTransform: 'uppercase', letterSpacing: '0.1em'
                  }}>{sez.label}</span>
                  <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.05)' }}/>
                </div>

                {/* Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: sez.items.length === 1 ? '1fr' : '1fr 1fr',
                  gap: 10,
                }}>
                  {sez.items.map(item => {
                    const isHov = hovered === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => select(item.id)}
                        onMouseEnter={() => setHovered(item.id)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '13px 14px', borderRadius: 12, textAlign: 'left',
                          border: isHov
                            ? `1px solid ${sez.color}55`
                            : '1px solid rgba(255,255,255,0.07)',
                          background: isHov
                            ? `${sez.color}14`
                            : 'rgba(255,255,255,0.03)',
                          cursor: 'pointer', transition: 'all 0.13s',
                          fontFamily: 'Inter,sans-serif',
                        }}
                      >
                        {/* Icona */}
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                          background: isHov ? `${sez.color}22` : 'rgba(255,255,255,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, transition: 'background 0.13s',
                        }}>
                          {item.icon}
                        </div>

                        {/* Testo */}
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: 13.5, fontWeight: 600,
                            color: isHov ? 'white' : 'rgba(255,255,255,0.8)',
                            marginBottom: 3, transition: 'color 0.13s',
                          }}>{item.label}</div>
                          <div style={{
                            fontSize: 11.5, color: 'rgba(255,255,255,0.35)',
                            lineHeight: 1.4,
                          }}>{item.desc}</div>
                        </div>

                        {/* Arrow */}
                        <div style={{
                          marginLeft: 'auto', flexShrink: 0,
                          color: isHov ? sez.color : 'rgba(255,255,255,0.15)',
                          fontSize: 16, transition: 'all 0.13s',
                          transform: isHov ? 'translateX(2px)' : 'none',
                        }}>›</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Footer */}
            <div style={{
              marginTop: 8, paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              fontSize: 11, color: 'rgba(255,255,255,0.2)',
              textAlign: 'center',
            }}>
              Premi <kbd style={{
                background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:4, padding:'1px 6px', fontSize:10, fontFamily:'monospace'
              }}>Esc</kbd> per chiudere
            </div>
          </div>
        </>
      )}
    </>
  )
}
