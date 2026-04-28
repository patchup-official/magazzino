// Protezione.jsx — Protezione Dispositivo

import { useState, useEffect } from 'react'
import axios from 'axios'
import ClienteSelector from '../components/ClienteSelector'

// ── Costanti ────────────────────────────────────────────────────────────────

const TIPI_DISPOSITIVO = [
  { id: 'smartphone', label: 'Smartphone', emoji: '📱', brands: ['Apple','Samsung','Xiaomi','Huawei','OnePlus','Google','Nokia','Sony','Altro'] },
  { id: 'tablet',     label: 'Tablet',     emoji: '📋', brands: ['Apple','Samsung','Microsoft','Huawei','Xiaomi','Altro'] },
  { id: 'laptop',     label: 'PC / Laptop', emoji: '💻', brands: ['Apple','Microsoft','Dell','HP','Lenovo','Asus','Acer','Altro'] },
  { id: 'console',    label: 'Console',    emoji: '🎮', brands: ['PlayStation','Xbox','Nintendo','Steam Deck','Altro'] },
  { id: 'smartwatch', label: 'Smartwatch', emoji: '⌚', brands: ['Apple','Samsung','Garmin','Fitbit','Altro'] },
  { id: 'altro',      label: 'Altro',      emoji: '📦', brands: ['Altro'] },
]

const DEFAULT_COPERTURE = ['Garanzia estesa','Danni accidentali','Rottura schermo','Sostituzione pezzi','Furto / Smarrimento','Assistenza prioritaria']
function loadCoperture(){ try{ const s=localStorage.getItem('coperture_disponibili'); return s?JSON.parse(s):DEFAULT_COPERTURE; }catch{ return DEFAULT_COPERTURE; } }
function saveCoperture(list){ try{ localStorage.setItem('coperture_disponibili',JSON.stringify(list)); }catch{} }

// ── Componenti UI ────────────────────────────────────────────────────────────

const inp = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: 13,
  width: '100%', boxSizing: 'border-box', fontFamily: 'Inter,sans-serif', outline: 'none'
}

const StatoBadge = ({ stato }) => {
  const map = {
    attiva:      { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80',  label: 'Attiva' },
    in_scadenza: { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24',  label: 'In scadenza' },
    scaduta:     { bg: 'rgba(239,68,68,0.15)',   color: '#f87171',  label: 'Scaduta' },
  }
  const s = map[stato] || map.attiva
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
      {s.label}
    </span>
  )
}

// ── Wizard ───────────────────────────────────────────────────────────────────

function Wizard({ api, piani, onDone, onClose }) {
  const [step, setStep] = useState(1)
  const TOTAL = 5

  const [f, setF] = useState({
    tipo_dispositivo: 'smartphone',
    brand: 'Apple',
    modello: '',
    colore_storage: '',
    seriale: '',
    imei: '',
    cliente_nome: '',
    cliente_tel: '',
    cliente_email: '',
    cliente_id: null,
    piano_id: piani[1]?.id || '',
    piano_nome: piani[1]?.nome || '',
    durata_mesi: piani[1]?.durata_mesi || 12,
    coperture: piani[1]?.coperture || [],
    prezzo: piani[1]?.prezzo || 12.90,
    note: '',
  })
  const upd = c => setF(p => ({ ...p, ...c }))

  const [loading, setSaving] = useState(false)

  const tipoSel = TIPI_DISPOSITIVO.find(t => t.id === f.tipo_dispositivo)
  const pianoPrev = piani.find(p => p.id === f.piano_id)

  const STEP_LABELS = ['Dispositivo', 'Cliente', 'Dettagli', 'Piano', 'Conferma']

  const validate = () => {
    if (step === 1 && !f.tipo_dispositivo) return 'Seleziona il tipo di dispositivo'
    if (step === 2 && !f.cliente_nome.trim()) return 'Seleziona o inserisci un cliente'
    if (step === 3 && !f.modello.trim()) return 'Inserisci il modello del dispositivo'
    if (step === 4 && !f.piano_id) return 'Seleziona un piano'
    return null
  }

  const next = () => {
    const err = validate()
    if (err) { alert(err); return }
    if (step === TOTAL) { submit(); return }
    setStep(s => s + 1)
  }

  const submit = async () => {
    setSaving(true)
    try {
      const { data } = await axios.post(`${api}/protezioni`, {
        ...f,
        piano_nome: pianoPrev?.nome || f.piano_nome,
      })
      onDone(data.data)
    } catch (e) {
      alert('Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const dataScadenza = () => {
    const d = new Date()
    d.setMonth(d.getMonth() + (f.durata_mesi || 12))
    return d.toLocaleDateString('it-IT')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: '#111520', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>🛡️ Nuova Protezione</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{STEP_LABELS[step - 1]}</div>
        </div>

        {/* Step track */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          {STEP_LABELS.map((label, i) => {
            const n = i + 1
            const done = n < step
            const cur = n === step
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < STEP_LABELS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                    background: done ? '#22c55e' : cur ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                    color: done || cur ? '#fff' : '#475569',
                    border: cur ? '2px solid #3b82f6' : '2px solid transparent',
                    boxShadow: cur ? '0 0 0 3px rgba(59,130,246,0.2)' : 'none'
                  }}>{done ? '✓' : n}</div>
                  <div style={{ fontSize: 9, color: done ? '#22c55e' : cur ? '#60a5fa' : '#475569', whiteSpace: 'nowrap' }}>{label}</div>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div style={{ flex: 1, height: 2, margin: '0 6px', marginBottom: 14, background: done ? '#22c55e' : 'rgba(255,255,255,0.07)', borderRadius: 2 }} />
                )}
              </div>
            )
          })}
        </div>

        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: '#94a3b8', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter,sans-serif' }}>✕ Esci</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', overflow: 'hidden' }}>
        {/* Contenuto */}
        <div style={{ overflowY: 'auto', padding: '2rem 2.5rem' }}>

          {/* STEP 1 — Tipo dispositivo */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Che dispositivo è?</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Scegli la categoria — il sistema adatterà il flusso.</div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
                {TIPI_DISPOSITIVO.map(t => (
                  <button key={t.id} onClick={() => upd({ tipo_dispositivo: t.id, brand: t.brands[0] })} style={{
                    background: f.tipo_dispositivo === t.id ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                    border: f.tipo_dispositivo === t.id ? '2px solid rgba(59,130,246,0.5)' : '2px solid rgba(255,255,255,0.07)',
                    borderRadius: 16, padding: '20px 12px', cursor: 'pointer', textAlign: 'center',
                    fontFamily: 'Inter,sans-serif', transition: 'all 0.15s',
                    boxShadow: f.tipo_dispositivo === t.id ? '0 0 20px rgba(59,130,246,0.15)' : 'none'
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{t.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: f.tipo_dispositivo === t.id ? '#60a5fa' : '#e2e8f0' }}>{t.label}</div>
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Marca</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {tipoSel?.brands.map(b => (
                  <button key={b} onClick={() => upd({ brand: b })} style={{
                    background: f.brand === b ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                    border: f.brand === b ? '1.5px solid rgba(59,130,246,0.4)' : '1.5px solid rgba(255,255,255,0.07)',
                    borderRadius: 10, padding: '8px', cursor: 'pointer', fontSize: 12,
                    color: f.brand === b ? '#60a5fa' : '#94a3b8', fontFamily: 'Inter,sans-serif'
                  }}>{b}</button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — Cliente */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Chi è il cliente?</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Seleziona un cliente dall'archivio o inserisci i dati.</div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Cliente *</label>
                <ClienteSelector
                  api={api}
                  value={f.cliente_nome}
                  onChange={val => upd({ cliente_nome: val })}
                  onTelChange={tel => upd({ cliente_tel: tel })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Telefono</label>
                  <input value={f.cliente_tel} onChange={e => upd({ cliente_tel: e.target.value })} placeholder="+39 333 123456" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Email</label>
                  <input value={f.cliente_email} onChange={e => upd({ cliente_email: e.target.value })} placeholder="mario@email.com" style={inp} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Dettagli dispositivo */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Dettagli del dispositivo</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Inserisci modello e seriale per gestire eventuali sinistri.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Modello *</label>
                  <input value={f.modello} onChange={e => upd({ modello: e.target.value })} placeholder="es. iPhone 14 Pro" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Colore / Capacità</label>
                  <input value={f.colore_storage} onChange={e => upd({ colore_storage: e.target.value })} placeholder="es. 256GB Blu Alpino" style={inp} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>
                  Seriale / IMEI <span style={{ color: '#475569', fontSize: 11 }}>— consigliato</span>
                </label>
                <input value={f.seriale} onChange={e => upd({ seriale: e.target.value })} placeholder="es. 358240051111110" style={inp} />
                {!f.seriale && (
                  <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 5 }}>⚠ Senza seriale i sinistri sono più difficili da verificare</div>
                )}
                {f.seriale && (
                  <div style={{ fontSize: 11, color: '#22c55e', marginTop: 5 }}>✓ Seriale registrato correttamente</div>
                )}
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Note interne</label>
                <input value={f.note} onChange={e => upd({ note: e.target.value })} placeholder="Informazioni aggiuntive..." style={inp} />
              </div>
            </div>
          )}

          {/* STEP 4 — Piano */}
          {step === 4 && (
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Scegli il piano</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Seleziona il piano più adatto al dispositivo e al cliente.</div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
                {piani.map(p => (
                  <button key={p.id} onClick={() => upd({ piano_id: p.id, piano_nome: p.nome, durata_mesi: p.durata_mesi, coperture: p.coperture, prezzo: p.prezzo })} style={{
                    background: f.piano_id === p.id ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
                    border: f.piano_id === p.id ? '2px solid rgba(59,130,246,0.5)' : '2px solid rgba(255,255,255,0.07)',
                    borderRadius: 14, padding: '18px', cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'Inter,sans-serif', position: 'relative', transition: 'all 0.15s'
                  }}>
                    {p.consigliato ? (
                      <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>Consigliato</div>
                    ) : null}
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 3 }}>{p.nome}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#60a5fa', marginBottom: 2 }}>€{p.prezzo.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: '#475569', marginBottom: 12 }}>{p.durata_mesi} mesi</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {p.coperture.map(c => (
                        <div key={c} style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 10 }}>✓</span>{c}
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Personalizza coperture</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {COPERTURE_DISPONIBILI.map(c => {
                  const on = f.coperture.includes(c.label)
                  return (
                    <button key={c.id} onClick={() => {
                      const cov = on ? f.coperture.filter(x => x !== c.label) : [...f.coperture, c.label]
                      upd({ coperture: cov })
                    }} style={{
                      background: on ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)',
                      border: on ? '1.5px solid rgba(34,197,94,0.4)' : '1.5px solid rgba(255,255,255,0.07)',
                      borderRadius: 10, padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                      fontFamily: 'Inter,sans-serif', transition: 'all 0.15s'
                    }}>
                      <span style={{ fontSize: 16 }}>{c.emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, flex: 1, textAlign: 'left', color: on ? '#e2e8f0' : '#94a3b8' }}>{c.label}</span>
                      <div style={{ width: 28, height: 16, borderRadius: 8, background: on ? '#22c55e' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s' }}>
                        <div style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: '#fff', top: 2, left: on ? 14 : 2, transition: 'left 0.2s' }} />
                      </div>
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Prezzo venduto al cliente (€)</label>
                  <input type="number" step="0.01" value={f.prezzo} onChange={e => upd({ prezzo: parseFloat(e.target.value) })} style={inp} />
                </div>
                <button onClick={() => upd({ prezzo: pianoPrev?.prezzo || f.prezzo })} style={{ marginTop: 22, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', borderRadius: 8, padding: '9px 12px', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter,sans-serif' }}>
                  ↙ Prezzo piano
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 — Conferma */}
          {step === 5 && (
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Prezzo e conferma</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Verifica il riepilogo prima di attivare la protezione.</div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 18px', marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Dispositivo</div>
                {[
                  ['Tipo', `${tipoSel?.emoji} ${tipoSel?.label} — ${f.brand}`],
                  ['Modello', `${f.brand} ${f.modello}`],
                  ['Colore/Storage', f.colore_storage || '—'],
                  ['Seriale', f.seriale || '— non inserito'],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12.5 }}>
                    <span style={{ color: '#64748b' }}>{l}</span>
                    <span style={{ fontWeight: 500, fontFamily: l === 'Seriale' ? 'monospace' : 'inherit', fontSize: l === 'Seriale' ? 12 : 12.5 }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 18px', marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Piano & Cliente</div>
                {[
                  ['Cliente', f.cliente_nome],
                  ['Piano', f.piano_nome || pianoPrev?.nome],
                  ['Durata', `${f.durata_mesi} mesi`],
                  ['Scadenza', dataScadenza()],
                  ['Prezzo', `€${Number(f.prezzo).toFixed(2)}`],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12.5 }}>
                    <span style={{ color: '#64748b' }}>{l}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Coperture</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {f.coperture.map(c => (
                      <span key={c} style={{ fontSize: 10, background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)', padding: '3px 8px', borderRadius: 20 }}>{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar suggerimenti */}
        <div style={{ background: '#111520', borderLeft: '1px solid rgba(255,255,255,0.07)', padding: '24px 18px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
            {['', '💡 Tipo dispositivo', '💡 Cliente', '💡 Dati & Seriale', '💡 Piano ottimale', '💡 Verifica finale'][step]}
          </div>
          {getSuggerimenti(step, f).map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.07)`, borderLeft: `3px solid ${s.color || '#3b82f6'}`, borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{s.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{s.title}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer nav */}
      <div style={{ background: '#111520', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: '#475569', marginRight: 'auto' }}>Passaggio {step} di {TOTAL}</span>
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 10, padding: '10px 22px', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>← Indietro</button>
        )}
        <button onClick={next} disabled={loading} style={{
          background: step === TOTAL ? '#22c55e' : '#3b82f6',
          border: 'none', color: '#fff', borderRadius: 10, padding: '11px 28px',
          fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'Inter,sans-serif', boxShadow: `0 4px 14px ${step === TOTAL ? 'rgba(34,197,94,0.35)' : 'rgba(59,130,246,0.35)'}`
        }}>
          {loading ? '...' : step === TOTAL ? '🛡️ Attiva Protezione' : 'Avanti →'}
        </button>
      </div>
    </div>
  )
}

function getSuggerimenti(step, f) {
  const sugs = {
    1: [
      f.tipo_dispositivo === 'smartphone' && { icon: '📱', title: 'Smartphone — il più richiesto', body: "L'85% delle protezioni riguarda smartphone. Registra sempre l'IMEI nel passaggio successivo.", color: '#3b82f6' },
      f.tipo_dispositivo === 'laptop' && { icon: '💻', title: 'Laptop — proponi Elite', body: 'I costi di riparazione laptop sono elevati. Il piano Elite a 24 mesi è la scelta giusta.', color: '#22c55e' },
      f.brand === 'Apple' && { icon: '🍎', title: 'Dispositivo Apple', body: 'I ricambi Apple sono costosi. Premium o Elite sono fortemente consigliati.', color: '#3b82f6' },
      { icon: '💡', title: 'Perché la marca importa', body: 'La marca determina il piano consigliato e le istruzioni per trovare il seriale.', color: '#22c55e' },
    ],
    2: [
      { icon: '💡', title: 'Come presentarla', body: '"Con la protezione, se il dispositivo si rompe nei prossimi mesi è coperto — nessuna sorpresa."', color: '#a855f7' },
      { icon: '📧', title: 'Email del cliente', body: 'Inserisci l\'email per inviare il certificato di protezione al termine.', color: '#3b82f6' },
    ],
    3: [
      !f.seriale && { icon: '⚠️', title: 'Seriale non inserito', body: 'Senza il seriale, gestire un sinistro futuro sarà più complicato. Richiedilo sempre.', color: '#f59e0b' },
      f.seriale && { icon: '✓', title: 'Seriale registrato', body: 'Ottimo! Il seriale velocizzerà la gestione di qualsiasi sinistro futuro.', color: '#22c55e' },
      f.brand === 'Apple' && { icon: '🍎', title: 'IMEI Apple', body: "Trovi il seriale in Impostazioni → Generali → Info oppure sulla confezione originale.", color: '#3b82f6' },
    ],
    4: [
      { icon: '🎯', title: 'Piano consigliato', body: 'Per smartphone il Piano Premium copre i danni più frequenti (schermo + accidentali) al prezzo giusto.', color: '#3b82f6' },
      { icon: '📊', title: 'Coperture più usate', body: "Il 78% dei sinistri riguarda danni accidentali o rottura schermo. Includile sempre.", color: '#a855f7' },
      { icon: '💰', title: 'Margine consigliato', body: `Aggiungere €2-5 al prezzo del piano è normale e copre i costi di gestione.`, color: '#22c55e' },
    ],
    5: [
      { icon: '📜', title: 'Certificato automatico', body: 'Al click su Attiva viene generato il codice ENP univoco. Mostralo al cliente.', color: '#3b82f6' },
      !f.seriale && { icon: '⚠️', title: 'Seriale mancante', body: 'Hai saltato il seriale. Considera di tornare indietro prima di attivare.', color: '#f59e0b' },
      { icon: '✅', title: 'Quasi fatto!', body: 'Verifica tutti i dati e clicca "Attiva Protezione" per generare il certificato.', color: '#22c55e' },
    ],
  }
  return (sugs[step] || []).filter(Boolean)
}

// ── Schermata successo ────────────────────────────────────────────────────────

function SuccessScreen({ protezione, onClose, onNuova }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '3rem', maxWidth: 480 }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>🛡️</div>
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Protezione attivata!</div>
        <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>{protezione.cliente_nome} · {protezione.brand} {protezione.modello}</div>
        <div style={{ fontFamily: 'monospace', fontSize: 18, color: '#60a5fa', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', padding: '12px 28px', borderRadius: 10, marginBottom: 12, display: 'inline-block' }}>
          {protezione.certificato}
        </div>
        <div style={{ fontSize: 12, color: '#475569', marginBottom: 28 }}>
          Certificato generato automaticamente.<br />Scadenza: {new Date(protezione.data_scadenza).toLocaleDateString('it-IT')}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 10, padding: '11px 22px', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>← Lista protezioni</button>
          <button onClick={onNuova} style={{ background: '#3b82f6', border: 'none', color: '#fff', borderRadius: 10, padding: '11px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>+ Nuova protezione</button>
        </div>
      </div>
    </div>
  )
}

// ── Pagina principale ────────────────────────────────────────────────────────

export default function Protezione({ api, showToast }) {
  const [protezioni, setProtezioni] = useState([])
  const [piani, setPiani] = useState([])
  const [stats, setStats] = useState({ attive: 0, in_scadenza: 0, scadute: 0, totali: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [wizard, setWizard] = useState(false)
  const [successo, setSuccesso] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [pr, pl] = await Promise.all([
        axios.get(`${api}/protezioni`),
        axios.get(`${api}/piani`),
      ])
      setProtezioni(pr.data.data || [])
      setStats(pr.data.stats || {})
      setPiani(pl.data.data || [])
    } catch {
      setProtezioni([])
    } finally {
      setLoading(false)
    }
  }

  const handleDone = (p) => {
    setWizard(false)
    setSuccesso(p)
    setProtezioni(prev => [p, ...prev])
    setStats(prev => ({ ...prev, attive: prev.attive + 1, totali: prev.totali + 1 }))
  }

  const deleteProtezione = async (id) => {
    if (!confirm('Eliminare questa protezione?')) return
    setProtezioni(prev => prev.filter(p => p.id !== id))
    try { await axios.delete(`${api}/protezioni/${id}`) } catch {}
    showToast('Protezione eliminata')
  }

  const filtered = protezioni.filter(p => {
    const matchStato = filter === 'all' || p.stato === filter
    const q = search.toLowerCase()
    const matchSearch = !q || [p.cliente_nome, p.brand, p.modello, p.certificato].some(v => v && v.toLowerCase().includes(q))
    return matchStato && matchSearch
  })

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 3 }}>🛡️ Protezione Dispositivo</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Gestione protezioni attive per i tuoi clienti</div>
        </div>
        <button onClick={() => setWizard(true)} style={{ background: '#3b82f6', border: 'none', color: '#fff', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
          + Nuova Protezione
        </button>
      </div>


      
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Attive',      val: stats.attive,      bg: 'rgba(34,197,94,0.12)',  emoji: '⚡' },
          { label: 'In scadenza', val: stats.in_scadenza, bg: 'rgba(245,158,11,0.12)', emoji: '⏰' },
          { label: 'Scadute',     val: stats.scadute,     bg: 'rgba(239,68,68,0.12)',  emoji: '🔔' },
          { label: 'Totali',      val: stats.totali,      bg: 'rgba(59,130,246,0.12)', emoji: '📋' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{s.emoji}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtri */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Cerca cliente, dispositivo, certificato..."
          style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 14px', color: '#e2e8f0', fontSize: 13, fontFamily: 'Inter,sans-serif' }} />
        <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3 }}>
          {[['all','Tutte'],['attiva','Attive'],['in_scadenza','In scadenza'],['scaduta','Scadute']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', fontFamily: 'Inter,sans-serif',
              background: filter === v ? '#1e3a6e' : 'transparent', color: filter === v ? '#60a5fa' : '#64748b'
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>🛡️</div>
          <div style={{ fontSize: 14, color: '#64748b' }}>Nessuna protezione trovata. Creane una!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 16px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <div style={{ width: 36 }} />
            <div style={{ flex: 2 }}>Cliente</div>
            <div style={{ flex: 2 }}>Dispositivo</div>
            <div style={{ flex: 1 }}>Piano</div>
            <div style={{ flex: 1 }}>Scadenza</div>
            <div style={{ flex: 1 }}>Prezzo</div>
            <div style={{ width: 80 }} />
          </div>

          {filtered.map(p => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s'
            }}>
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: '#1e3a6e', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#60a5fa'
              }}>
                {p.cliente_nome.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()}
              </div>

              {/* Cliente */}
              <div style={{ flex: 2, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.cliente_nome}</div>
                <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace', marginTop: 2 }}>{p.certificato}</div>
              </div>

              {/* Dispositivo */}
              <div style={{ flex: 2, minWidth: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', padding: '3px 9px', borderRadius: 20 }}>
                  {TIPI_DISPOSITIVO.find(t => t.id === p.tipo_dispositivo)?.emoji || '📱'} {p.brand} {p.modello}
                </div>
              </div>

              {/* Piano */}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: '#c084fc', padding: '3px 9px', borderRadius: 20 }}>
                  🛡 {p.piano_nome}
                </span>
              </div>

              {/* Scadenza */}
              <div style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>
                {new Date(p.data_scadenza).toLocaleDateString('it-IT')}
                {p.stato === 'in_scadenza' && <div style={{ fontSize: 10, color: '#f59e0b' }}>⚠ Scade presto</div>}
                {p.stato === 'scaduta' && <div style={{ fontSize: 10, color: '#f87171' }}>Scaduta</div>}
              </div>

              {/* Prezzo */}
              <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>€{Number(p.prezzo).toFixed(2)}</div>

              {/* Stato + azioni */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <StatoBadge stato={p.stato} />
                <button onClick={() => deleteProtezione(p.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: 8, padding: '5px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}



      {/* Wizard */}
      {wizard && piani.length > 0 && (
        <Wizard api={api} piani={piani} onDone={handleDone} onClose={() => setWizard(false)} />
      )}

      {/* Successo */}
      {successo && (
        <SuccessScreen
          protezione={successo}
          onClose={() => setSuccesso(null)}
          onNuova={() => { setSuccesso(null); setWizard(true) }}
        />
      )}
    </div>
  )
}
