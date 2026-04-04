// ClienteSelector.jsx — Selettore cliente riutilizzabile nei wizard

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const inp = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: 13,
  width: '100%', boxSizing: 'border-box', fontFamily: 'Inter,sans-serif'
}

export default function ClienteSelector({ api, value, onChange, onTelChange }) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState('search') // 'search' | 'new'
  const [newCliente, setNewCliente] = useState({ nome: '', cognome: '', telefono: '' })
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  // Chiudi dropdown cliccando fuori
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = async (q) => {
    setQuery(q)
    onChange(q)
    if (!q.trim()) { setResults([]); setOpen(false); return }
    try {
      const { data } = await axios.get(`${api}/clienti?q=${encodeURIComponent(q)}`)
      setResults(data.data || [])
      setOpen(true)
    } catch {
      setResults([])
    }
  }

  const selectCliente = (c) => {
    const nome = c.ragione_soc || `${c.nome || ''} ${c.cognome || ''}`.trim()
    setQuery(nome)
    setSelected(c)
    setOpen(false)
    onChange(nome)
    onTelChange?.(c.telefono || '')
  }

  const createNew = async () => {
    if (!newCliente.nome.trim()) return
    setLoading(true)
    try {
      const { data } = await axios.post(`${api}/clienti`, {
        tipo: 'persona_fisica',
        nome: newCliente.nome,
        cognome: newCliente.cognome,
        telefono: newCliente.telefono,
      })
      selectCliente(data.data)
      setMode('search')
      setNewCliente({ nome: '', cognome: '', telefono: '' })
    } catch {
      // fallback: usa i dati inseriti senza salvare
      const nome = `${newCliente.nome} ${newCliente.cognome}`.trim()
      onChange(nome)
      onTelChange?.(newCliente.telefono)
      setQuery(nome)
      setMode('search')
    } finally {
      setLoading(false)
    }
  }

  const nomeCompleto = (c) => c.ragione_soc || `${c.nome || ''} ${c.cognome || ''}`.trim()

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {mode === 'search' ? (
        <>
          {/* Campo ricerca */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.4 }}>🔍</span>
            <input
              value={query}
              onChange={e => search(e.target.value)}
              onFocus={() => query && results.length && setOpen(true)}
              placeholder="Cerca cliente per nome o telefono..."
              style={{ ...inp, paddingLeft: 34 }}
            />
            {selected && (
              <button onClick={() => { setQuery(''); setSelected(null); onChange(''); onTelChange?.(''); setResults([]) }}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}>✕</button>
            )}
          </div>

          {/* Cliente selezionato */}
          {selected && (
            <div style={{ marginTop: 8, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{selected.tipo === 'partita_iva' ? '🏢' : '🙋'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#60a5fa' }}>{nomeCompleto(selected)}</div>
                {selected.telefono && <div style={{ fontSize: 11, color: '#64748b' }}>📞 {selected.telefono}</div>}
              </div>
              <span style={{ fontSize: 11, color: '#2563eb', background: 'rgba(37,99,235,0.15)', padding: '2px 8px', borderRadius: 20 }}>archivio</span>
            </div>
          )}

          {/* Dropdown risultati */}
          {open && results.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, background: '#0d1529', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              {results.map(c => (
                <button key={c.id} onClick={() => selectCliente(c)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)', fontFamily: 'Inter,sans-serif' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize: 16 }}>{c.tipo === 'partita_iva' ? '🏢' : '🙋'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{nomeCompleto(c)}</div>
                    {c.telefono && <div style={{ fontSize: 11, color: '#64748b' }}>{c.telefono}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Nessun risultato — bottone crea nuovo */}
          {open && query.length > 1 && results.length === 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, background: '#0d1529', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              <button onClick={() => { setMode('new'); setNewCliente({ nome: query, cognome: '', telefono: '' }); setOpen(false) }}
                style={{ width: '100%', padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter,sans-serif', color: '#60a5fa', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>➕</span>
                <span>Crea nuovo cliente "<strong>{query}</strong>"</span>
              </button>
            </div>
          )}

          {/* Link crea nuovo sempre visibile */}
          {!selected && (
            <button onClick={() => { setMode('new'); setOpen(false) }}
              style={{ marginTop: 6, background: 'none', border: 'none', color: '#475569', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter,sans-serif', padding: 0 }}>
              + Crea nuovo cliente
            </button>
          )}
        </>
      ) : (
        /* Modalità creazione rapida */
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa', marginBottom: 12 }}>➕ Nuovo cliente rapido</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input value={newCliente.nome} onChange={e => setNewCliente(p => ({ ...p, nome: e.target.value }))}
              placeholder="Nome *" style={inp} />
            <input value={newCliente.cognome} onChange={e => setNewCliente(p => ({ ...p, cognome: e.target.value }))}
              placeholder="Cognome" style={inp} />
          </div>
          <input value={newCliente.telefono} onChange={e => setNewCliente(p => ({ ...p, telefono: e.target.value }))}
            placeholder="Telefono" style={{ ...inp, marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setMode('search')}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 8, padding: '8px 0', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
              Annulla
            </button>
            <button onClick={createNew} disabled={loading || !newCliente.nome.trim()}
              style={{ flex: 2, background: loading || !newCliente.nome.trim() ? 'rgba(255,255,255,0.05)' : '#1e3a6e', border: '1px solid rgba(37,99,235,0.4)', color: loading || !newCliente.nome.trim() ? '#475569' : '#60a5fa', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
              {loading ? '...' : '✓ Salva e seleziona'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
