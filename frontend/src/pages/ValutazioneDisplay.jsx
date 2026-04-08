// ValutazioneDisplay.jsx — Plugin Valutazione Display (demo)

import { useState } from 'react'
import axios from 'axios'

const BRANDS = ['Apple', 'Samsung', 'Huawei', 'Xiaomi', 'OnePlus', 'Google', 'Sony', 'Nokia', 'Motorola', 'Altro']

const inp = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 13,
  width: '100%', boxSizing: 'border-box', fontFamily: 'Inter,sans-serif', outline: 'none'
}

export default function ValutazioneDisplay({ api, showToast }) {
  const [search, setSearch] = useState({ brand: '', modello: '', qualita: 'A' })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const upd = c => setSearch(p => ({ ...p, ...c }))

  const cerca = async () => {
    if (!search.modello.trim()) { showToast('Inserisci il modello', 'error'); return }
    setLoading(true)
    try {
      const { data } = await axios.get(`${api}/valutazione/display`, {
        params: { brand: search.brand, modello: search.modello, qualita: search.qualita }
      })
      setResults(data)
    } catch {
      // Demo fallback
      const base = Math.floor(Math.random() * 80) + 20
      setResults({
        trovato: true,
        brand: search.brand || 'Generic',
        modello: search.modello,
        qualita: search.qualita,
        prezzo_acquisto: base,
        prezzo_vendita: Math.round(base * 1.35),
        margine: 35,
        note: 'Dato demo — collega il backend per prezzi reali',
        aggiornato_il: new Date().toLocaleDateString('it-IT')
      })
    } finally {
      setLoading(false)
    }
  }

  const qualita = [
    { id: 'A', label: 'Grado A', desc: 'Perfetto, no difetti', color: '#22c55e' },
    { id: 'B', label: 'Grado B', desc: 'Piccoli graffi', color: '#f59e0b' },
    { id: 'C', label: 'Grado C', desc: 'Difetti visibili', color: '#ef4444' },
  ]

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 3 }}>
            <span style={{ marginRight: 8 }}>🔍</span>Valutazione Display
          </div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Consulta il valore di acquisto dei display usati rigenerabili</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80', fontSize: 11, padding: '4px 12px', borderRadius: 20 }}>
            Plugin attivo
          </span>
        </div>
      </div>

      {/* Form ricerca */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 20, maxWidth: 640 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Cerca display</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Marca</label>
            <select value={search.brand} onChange={e => upd({ brand: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
              <option value="">Tutte le marche</option>
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Modello *</label>
            <input
              value={search.modello}
              onChange={e => upd({ modello: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && cerca()}
              placeholder="es. iPhone 14 Pro, Samsung S23..."
              style={inp}
            />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Qualita display</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {qualita.map(q => (
              <button key={q.id} onClick={() => upd({ qualita: q.id })} style={{
                flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                background: search.qualita === q.id ? `rgba(${q.color === '#22c55e' ? '34,197,94' : q.color === '#f59e0b' ? '245,158,11' : '239,68,68'},0.1)` : 'rgba(255,255,255,0.02)',
                border: search.qualita === q.id ? `1.5px solid ${q.color}` : '1.5px solid rgba(255,255,255,0.07)',
                transition: 'all 0.15s', textAlign: 'center'
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: search.qualita === q.id ? q.color : '#e2e8f0', marginBottom: 3 }}>{q.label}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{q.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button onClick={cerca} disabled={loading} style={{
          width: '100%', background: loading ? 'rgba(255,255,255,0.05)' : '#3b82f6',
          border: 'none', color: loading ? '#475569' : '#fff', borderRadius: 10,
          padding: '12px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'Inter,sans-serif', boxShadow: loading ? 'none' : '0 4px 14px rgba(59,130,246,0.35)'
        }}>
          {loading ? '⏳ Ricerca in corso...' : '🔍 Cerca valore'}
        </button>
      </div>

      {/* Risultato */}
      {results && (
        <div style={{ maxWidth: 640 }}>
          {results.trovato ? (
            <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(37,99,235,0.04))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                    {results.brand} {results.modello}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '3px 10px', borderRadius: 20 }}>
                      Grado {results.qualita}
                    </span>
                    <span style={{ fontSize: 11, color: '#475569' }}>Aggiornato: {results.aggiornato_il}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Prezzo acquisto', val: `€${results.prezzo_acquisto}`, color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
                  { label: 'Prezzo vendita', val: `€${results.prezzo_vendita}`, color: '#4ade80', bg: 'rgba(34,197,94,0.1)' },
                  { label: 'Margine', val: `${results.margine}%`, color: '#fbbf24', bg: 'rgba(245,158,11,0.1)' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {results.note && (
                <div style={{ fontSize: 12, color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 14px', borderLeft: '3px solid #3b82f6' }}>
                  {results.note}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>🔍</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>Nessun display trovato per "{search.modello}"</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>Prova con un termine diverso o controlla il listino</div>
            </div>
          )}
        </div>
      )}

      {/* Info plugin */}
      {!results && (
        <div style={{ maxWidth: 640 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Come funziona</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: '📊', title: 'Listino aggiornabile', desc: 'Carica un file Excel o CSV con i prezzi dei display' },
              { icon: '💰', title: 'Margine configurabile', desc: 'Imposta il margine percentuale per calcolare il prezzo di vendita' },
              { icon: '🔍', title: 'Ricerca rapida', desc: 'Cerca per marca e modello in pochi secondi' },
              { icon: '📋', title: 'Storico listini', desc: 'Tieni traccia di tutti i listini caricati nel tempo' },
            ].map(item => (
              <div key={item.title} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#fbbf24' }}>
            ⚠ Versione demo — collega il backend del plugin Valutazione Display per prezzi reali
          </div>
        </div>
      )}
    </div>
  )
}
