// ValutazioneDisplay.jsx — Listino display usati rigenerabili

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const inp = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: 13,
  width: '100%', boxSizing: 'border-box', fontFamily: 'Inter,sans-serif', outline: 'none'
}

// ── Tab: Ricerca ──────────────────────────────────────────────────────────────
function TabRicerca({ api }) {
  const [q, setQ] = useState('')
  const [brand, setBrand] = useState('all')
  const [brands, setBrands] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [stats, setStats] = useState(null)
  const debounce = useRef(null)

  useEffect(() => {
    axios.get(`${api}/valutazione-display/brands`).then(r => setBrands(r.data.data || [])).catch(() => {})
    axios.get(`${api}/valutazione-display/stats`).then(r => setStats(r.data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    clearTimeout(debounce.current)
    if (!q && brand === 'all') { setResults([]); setSearched(false); return }
    debounce.current = setTimeout(() => cerca(), 350)
  }, [q, brand])

  const cerca = async () => {
    setLoading(true)
    setSearched(true)
    try {
      const params = {}
      if (q) params.q = q
      if (brand !== 'all') params.brand = brand
      const { data } = await axios.get(`${api}/valutazione-display/search`, { params })
      setResults(data.data || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const margine = results[0]?.margine_applicato

  return (
    <div>
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Display in listino', val: stats.totale, emoji: '📱', color: 'rgba(59,130,246,0.12)' },
            { label: 'Brand disponibili',  val: stats.brands, emoji: '🏷️', color: 'rgba(168,85,247,0.12)' },
            { label: 'Margine applicato',  val: margine != null ? `${margine}%` : (stats.totale > 0 ? '...' : '—'), emoji: '💰', color: 'rgba(34,197,94,0.12)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{s.emoji}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: '#475569' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="🔍 Cerca modello display... (es. iPhone 14, Samsung S23)"
          style={{ flex: 1, minWidth: 240, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#e2e8f0', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none' }}
        />
        <select value={brand} onChange={e => setBrand(e.target.value)} style={{ ...inp, width: 'auto', minWidth: 160 }}>
          <option value="all">Tutti i brand</option>
          {brands.map(b => <option key={b.brand} value={b.brand}>{b.brand} ({b.count})</option>)}
        </select>
      </div>

      {!searched && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>🔍</div>
          <div style={{ fontSize: 14, color: '#64748b' }}>Cerca un modello per visualizzare i prezzi</div>
          <div style={{ fontSize: 12, color: '#334155', marginTop: 6 }}>es. "iPhone 14", "Samsung S23 Ultra", "Redmi Note 12"</div>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569', fontSize: 13 }}>Ricerca in corso...</div>}

      {searched && !loading && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>📭</div>
          <div style={{ fontSize: 14, color: '#64748b' }}>Nessun display trovato</div>
          <div style={{ fontSize: 12, color: '#334155', marginTop: 6 }}>Prova con un termine diverso o carica un listino dalla tab Gestione</div>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
            {results.length} risultati{margine != null ? ` · Margine: ${margine}%` : ''}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, padding: '6px 14px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            <div>Modello</div>
            <div style={{ textAlign: 'right' }}>Prezzo acquisto</div>
            <div style={{ textAlign: 'right' }}>Prezzo vendita</div>
            <div style={{ textAlign: 'right' }}>Margine (€)</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.map(r => (
              <div key={r.id}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px', transition: 'border-color 0.15s', cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500, flexShrink: 0 }}>{r.brand}</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{r.modello}</span>
                  </div>
                  {r.codice && <div style={{ fontSize: 11, color: '#334155', fontFamily: 'monospace', marginTop: 3 }}>{r.codice}</div>}
                  {r.note && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{r.note}</div>}
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, color: '#94a3b8' }}>€{r.prezzo_acquisto.toFixed(2)}</div>
                <div style={{ textAlign: 'right', fontSize: 15, fontWeight: 700, color: '#60a5fa' }}>€{r.prezzo_vendita.toFixed(2)}</div>
                <div style={{ textAlign: 'right', fontSize: 13, color: '#4ade80' }}>+€{(r.prezzo_vendita - r.prezzo_acquisto).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Admin ────────────────────────────────────────────────────────────────
function TabAdmin({ api, showToast }) {
  const [margine, setMargine] = useState('30')
  const [uploads, setUploads] = useState([])
  const [uploading, setUploading] = useState(false)
  const [anteprima, setAnteprima] = useState(null)
  const [pendingUploadId, setPendingUploadId] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => { fetchSettings(); fetchUploads() }, [])

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get(`${api}/valutazione-display/settings`)
      setMargine(data.data?.margine_percentuale || '30')
    } catch {}
  }

  const fetchUploads = async () => {
    try {
      const { data } = await axios.get(`${api}/valutazione-display/uploads`)
      setUploads(data.data || [])
    } catch {}
  }

  const saveMargine = async () => {
    try {
      await axios.put(`${api}/valutazione-display/settings`, { margine_percentuale: parseFloat(margine) })
      showToast('✓ Margine aggiornato')
    } catch { showToast('Errore salvataggio', 'error') }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setAnteprima(null); setPendingUploadId(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await axios.post(`${api}/valutazione-display/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setAnteprima(data.data)
      setPendingUploadId(data.data.upload_id)
      showToast(`✓ ${data.data.righe} righe importate — attiva il listino`)
      fetchUploads()
    } catch (e) {
      showToast(e.response?.data?.error || 'Errore upload', 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const activateUpload = async (id) => {
    try {
      const { data } = await axios.patch(`${api}/valutazione-display/uploads/${id}/activate`)
      showToast(`✓ Listino attivato — ${data.righe_attive} display disponibili`)
      fetchUploads(); setPendingUploadId(null); setAnteprima(null)
    } catch { showToast('Errore attivazione', 'error') }
  }

  const deleteUpload = async (id) => {
    if (!confirm('Eliminare questo listino?')) return
    try {
      await axios.delete(`${api}/valutazione-display/uploads/${id}`)
      showToast('Listino eliminato'); fetchUploads()
    } catch { showToast('Errore eliminazione', 'error') }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Margine */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>💰 Margine di vendita</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Percentuale applicata al prezzo di acquisto per calcolare il prezzo di vendita.</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Margine (%)</label>
              <input type="number" value={margine} onChange={e => setMargine(e.target.value)} min="0" max="200" style={inp} />
            </div>
            <button onClick={saveMargine} style={{ background: '#3b82f6', border: 'none', color: '#fff', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Salva</button>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#475569' }}>
            Esempio: acquisto <strong style={{ color: '#e2e8f0' }}>€50</strong> → vendita <strong style={{ color: '#60a5fa' }}>€{(50 * (1 + parseFloat(margine || 0) / 100)).toFixed(2)}</strong>
          </div>
        </div>

        {/* Upload */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>📂 Carica listino</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Formati: <strong style={{ color: '#94a3b8' }}>.xlsx .xls .csv</strong></div>
          <div style={{ fontSize: 11, color: '#334155', marginBottom: 16, lineHeight: 1.7 }}>
            Colonne richieste: <span style={{ color: '#60a5fa' }}>Marca · Modello · Prezzo Acquisto</span><br />
            Opzionali: Codice · Note<br />
            Riconosce automaticamente il formato fornitore (IVA inclusa, header riga 4)
          </div>
          <label style={{ display: 'block', border: '2px dashed rgba(59,130,246,0.3)', borderRadius: 12, padding: '24px', textAlign: 'center', cursor: 'pointer', background: 'rgba(59,130,246,0.04)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.6)'; e.currentTarget.style.background = 'rgba(59,130,246,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; e.currentTarget.style.background = 'rgba(59,130,246,0.04)' }}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} style={{ display: 'none' }} />
            {uploading ? (
              <div style={{ color: '#60a5fa', fontSize: 13 }}>⏳ Elaborazione in corso...</div>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📤</div>
                <div style={{ fontSize: 13, color: '#60a5fa', fontWeight: 500 }}>Clicca per selezionare il file</div>
                <div style={{ fontSize: 11, color: '#334155', marginTop: 4 }}>xlsx · xls · csv — max 10MB</div>
              </>
            )}
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Anteprima */}
        {anteprima && (
          <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#4ade80' }}>✓ Upload completato</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>{anteprima.righe} righe importate — attiva per renderle disponibili</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Anteprima</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
              {anteprima.anteprima.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 11, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '6px 10px' }}>
                  <span style={{ color: '#60a5fa', fontWeight: 500, minWidth: 60 }}>{r.brand}</span>
                  <span style={{ color: '#e2e8f0', flex: 1 }}>{r.modello}</span>
                  <span style={{ color: '#4ade80', fontWeight: 600 }}>€{Number(r.prezzo_acquisto).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <button onClick={() => activateUpload(pendingUploadId)} style={{ width: '100%', background: '#22c55e', border: 'none', color: '#fff', borderRadius: 10, padding: '11px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
              ⚡ Attiva questo listino
            </button>
          </div>
        )}

        {/* Storico */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📋 Storico listini</div>
          {uploads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#334155', fontSize: 13 }}>Nessun listino caricato</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {uploads.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: u.attivo ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)', border: u.attivo ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.filename}</div>
                    <div style={{ fontSize: 10, color: '#334155', marginTop: 2 }}>{u.righe} righe · {new Date(u.created_at).toLocaleDateString('it-IT')}</div>
                  </div>
                  {u.attivo
                    ? <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '3px 9px', borderRadius: 20, flexShrink: 0 }}>Attivo</span>
                    : <button onClick={() => activateUpload(u.id)} style={{ fontSize: 11, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', flexShrink: 0 }}>Attiva</button>
                  }
                  <button onClick={() => deleteUpload(u.id)} style={{ fontSize: 11, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', flexShrink: 0 }}>🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Pagina principale ─────────────────────────────────────────────────────────
export default function ValutazioneDisplay({ api, showToast }) {
  const [tab, setTab] = useState('ricerca')
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 3 }}>🔍 Valutazione Display</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Listino prezzi display usati rigenerabili</div>
        </div>
        <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3 }}>
          {[['ricerca', '🔍 Ricerca'], ['admin', '⚙️ Gestione']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{
              padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              border: 'none', fontFamily: 'Inter,sans-serif',
              background: tab === v ? '#1e3a6e' : 'transparent',
              color: tab === v ? '#60a5fa' : '#64748b',
            }}>{l}</button>
          ))}
        </div>
      </div>
      {tab === 'ricerca' && <TabRicerca api={api} />}
      {tab === 'admin' && <TabAdmin api={api} showToast={showToast} />}
    </div>
  )
}
