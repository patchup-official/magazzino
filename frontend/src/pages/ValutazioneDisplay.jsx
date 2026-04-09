// ValutazioneDisplay.jsx — Buyback Display con procedura guidata completa

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const BRAND_LOGOS = {
  'Apple':    { emoji: '🍎', color: '#6b7280' },
  'Samsung':  { emoji: '🔷', color: '#1428a0' },
  'Xiaomi':   { emoji: '🟠', color: '#ff6900' },
  'Huawei':   { emoji: '📡', color: '#cf0a2c' },
  'OnePlus':  { emoji: '🔴', color: '#eb0028' },
  'Google':   { emoji: '🌈', color: '#4285f4' },
  'Motorola': { emoji: '〽️', color: '#e1140a' },
  'Sony':     { emoji: '⬛', color: '#003087' },
  'Nokia':    { emoji: '📱', color: '#124191' },
  'OPPO':     { emoji: '🟢', color: '#1d8348' },
  'Vivo':     { emoji: '🔵', color: '#415fff' },
  'LG':       { emoji: '🔲', color: '#a50034' },
}

const STATI = {
  aperto:               { label: 'Aperto',             color: '#60a5fa', bg: 'rgba(59,130,246,0.15)',  emoji: '📋' },
  pdf_generato:         { label: 'PDF Generato',        color: '#a78bfa', bg: 'rgba(139,92,246,0.15)', emoji: '📄' },
  in_attesa_pagamento:  { label: 'In attesa pagamento', color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', emoji: '⏳' },
  pagato:               { label: 'Pagato',              color: '#4ade80', bg: 'rgba(34,197,94,0.15)',  emoji: '✅' },
}

const inp = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: 13,
  width: '100%', boxSizing: 'border-box', fontFamily: 'Inter,sans-serif', outline: 'none'
}

// ── PDF ───────────────────────────────────────────────────────────────────────
async function generaPDF(ordine) {
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      s.onload = resolve; s.onerror = reject
      document.head.appendChild(s)
    })
  }
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 20, pageW = 210, contentW = pageW - margin * 2

  // Header scuro
  doc.setFillColor(17, 24, 39)
  doc.rect(0, 0, pageW, 45, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22); doc.setFont('helvetica', 'bold')
  doc.text('DOCUMENTO DI CONSEGNA', margin, 18)
  doc.setFontSize(11); doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text(`N° ${ordine.numero}`, margin, 27)
  doc.text(`Data: ${new Date().toLocaleDateString('it-IT')}`, margin, 34)

  // Mittente / Destinatario
  let y = 58
  doc.setTextColor(100, 116, 139); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
  doc.text('MITTENTE', margin, y)
  doc.text('DESTINATARIO', pageW / 2 + 5, y)
  y += 6
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59)
  doc.text('Azienda', margin, y)
  doc.text(ordine.fornitore_nome || '—', pageW / 2 + 5, y)
  y += 5
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105)
  if (ordine.fornitore_email) { doc.text(ordine.fornitore_email, pageW / 2 + 5, y); y += 4 }
  if (ordine.fornitore_tel) doc.text(ordine.fornitore_tel, pageW / 2 + 5, y)

  // Linea
  y += 12
  doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y); y += 8

  // Header tabella
  const cols = { brand: 28, modello: 72, qty: 18, prezzo: 30, tot: 30 }
  const cx = [margin, margin + cols.brand, margin + cols.brand + cols.modello, margin + cols.brand + cols.modello + cols.qty, margin + cols.brand + cols.modello + cols.qty + cols.prezzo]
  doc.setFillColor(241, 245, 249)
  doc.rect(margin, y - 4, contentW, 10, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 116, 139)
  doc.text('MARCA', cx[0] + 2, y + 2)
  doc.text('MODELLO', cx[1] + 2, y + 2)
  doc.text('QTÀ', cx[2] + 2, y + 2)
  doc.text('PREZZO UNIT.', cx[3] + 2, y + 2)
  doc.text('TOTALE', cx[4] + 2, y + 2)
  y += 10

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  const items = ordine.items || []
  items.forEach((item, idx) => {
    if (idx % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(margin, y - 4, contentW, 8, 'F') }
    doc.setTextColor(30, 41, 59)
    doc.text(item.brand, cx[0] + 2, y)
    const mod = item.modello.length > 38 ? item.modello.substring(0, 35) + '...' : item.modello
    doc.text(mod, cx[1] + 2, y)
    doc.text(String(item.quantita), cx[2] + 2, y)
    doc.text(`€ ${Number(item.prezzo_offerta).toFixed(2)}`, cx[3] + 2, y)
    doc.text(`€ ${(item.quantita * item.prezzo_offerta).toFixed(2)}`, cx[4] + 2, y)
    y += 8
    if (y > 260) { doc.addPage(); y = 20 }
  })

  // Totale
  y += 4
  doc.setDrawColor(226, 232, 240); doc.line(margin, y, pageW - margin, y); y += 8
  doc.setFillColor(17, 24, 39); doc.rect(pageW - margin - 70, y - 5, 70, 12, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 255, 255)
  doc.text('TOTALE ORDINE', pageW - margin - 68, y + 3)
  doc.setTextColor(96, 165, 250)
  doc.text(`€ ${Number(ordine.totale).toFixed(2)}`, pageW - margin - 5, y + 3, { align: 'right' })

  // Footer
  y += 25
  doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  doc.text(`Documento generato il ${new Date().toLocaleDateString('it-IT')}`, margin, y)
  y += 8
  doc.setTextColor(30, 41, 59); doc.setFontSize(9)
  doc.text('Da: Carlo De Santis', margin, y)
  doc.text('Firma e timbro destinatario', pageW - margin - 60, y)
  doc.setDrawColor(203, 213, 225)
  doc.line(pageW - margin - 60, y + 12, pageW - margin, y + 12)

  doc.save(`Ordine_${ordine.numero}.pdf`)
}

// ── BrandBadge ────────────────────────────────────────────────────────────────
function BrandBadge({ brand, size = 'sm' }) {
  const info = BRAND_LOGOS[brand] || { emoji: '📱', color: '#475569' }
  const s = size === 'lg' ? 44 : 30
  return (
    <div style={{
      width: s, height: s, borderRadius: size === 'lg' ? 12 : 8, flexShrink: 0,
      background: `${info.color}22`, border: `1px solid ${info.color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size === 'lg' ? 20 : 14,
    }}>{info.emoji}</div>
  )
}

// ── TabRicerca ────────────────────────────────────────────────────────────────
function TabRicerca({ api, showToast, ordineAperto, setOrdineAperto, goOrdine }) {
  const [q, setQ] = useState('')
  const [brand, setBrand] = useState('all')
  const [brands, setBrands] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [stats, setStats] = useState(null)
  const [aggiungendo, setAggiungendo] = useState({})
  const [qtaMap, setQtaMap] = useState({})
  const debounce = useRef(null)

  useEffect(() => {
    axios.get(`${api}/valutazione-display/brands`).then(r => setBrands(r.data.data || [])).catch(() => {})
    axios.get(`${api}/valutazione-display/stats`).then(r => setStats(r.data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    clearTimeout(debounce.current)
    if (!q && brand === 'all') { setResults([]); setSearched(false); return }
    debounce.current = setTimeout(cerca, 350)
  }, [q, brand])

  const cerca = async () => {
    setLoading(true); setSearched(true)
    try {
      const params = {}
      if (q) params.q = q
      if (brand !== 'all') params.brand = brand
      const { data } = await axios.get(`${api}/valutazione-display/search`, { params })
      setResults(data.data || [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }

  const aggiungi = async (r) => {
    const qta = qtaMap[r.id] || 1
    setAggiungendo(prev => ({ ...prev, [r.id]: true }))
    try {
      let ordine = ordineAperto
      if (!ordine) {
        const { data } = await axios.post(`${api}/display-ordini`, {})
        ordine = data.data
      }
      const { data } = await axios.post(`${api}/display-ordini/${ordine.id}/items`, {
        brand: r.brand, modello: r.modello, quantita: qta,
        prezzo_unitario: r.prezzo_acquisto, prezzo_offerta: r.prezzo_offerta,
      })
      setOrdineAperto(data.data)
      showToast(`✓ ${r.brand} ${r.modello} aggiunto`)
    } catch (e) {
      showToast(e.response?.data?.error || 'Errore', 'error')
    } finally { setAggiungendo(prev => ({ ...prev, [r.id]: false })) }
  }

  const margine = results[0]?.margine_applicato
  const nItems = ordineAperto?.items?.length || 0

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Display in listino', val: stats.totale, emoji: '📱', color: 'rgba(59,130,246,0.12)' },
            { label: 'Brand', val: stats.brands, emoji: '🏷️', color: 'rgba(168,85,247,0.12)' },
            { label: 'Tuo margine', val: margine != null ? `${margine}%` : '—', emoji: '💰', color: 'rgba(34,197,94,0.12)' },
            { label: 'Ordine aperto', val: nItems > 0 ? `${nItems} display` : 'Nessuno', emoji: '🛒', color: 'rgba(245,158,11,0.12)', onClick: nItems > 0 ? goOrdine : null },
          ].map(s => (
            <div key={s.label} onClick={s.onClick} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: s.onClick ? 'pointer' : 'default' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{s.emoji}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: '#475569' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Banner ordine */}
      {nItems > 0 && (
        <div onClick={goOrdine} style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <span style={{ fontSize: 18 }}>🛒</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24' }}>{ordineAperto.numero}</span>
            <span style={{ fontSize: 11, color: '#92400e', marginLeft: 10 }}>{nItems} display · €{Number(ordineAperto.totale).toFixed(2)}</span>
          </div>
          <span style={{ fontSize: 11, color: '#60a5fa' }}>Vai all'ordine →</span>
        </div>
      )}

      {/* Barra ricerca */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="🔍 Cerca display... (es. iPhone 14, Samsung S23 Ultra)"
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#e2e8f0', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none' }}
        />
        <select value={brand} onChange={e => setBrand(e.target.value)} style={{ ...inp, width: 'auto', minWidth: 160 }}>
          <option value="all">Tutti i brand</option>
          {brands.map(b => <option key={b.brand} value={b.brand}>{b.brand} ({b.count})</option>)}
        </select>
      </div>

      {/* Stato vuoto */}
      {!searched && !loading && (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.25 }}>📱</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Cerca un display per iniziare</div>
          <div style={{ fontSize: 12, color: '#334155', marginBottom: 20 }}>I prezzi vengono calcolati automaticamente in base al tuo margine</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {Object.entries(BRAND_LOGOS).slice(0, 7).map(([b, info]) => (
              <button key={b} onClick={() => setBrand(b)} style={{ background: `${info.color}18`, border: `1px solid ${info.color}33`, borderRadius: 20, padding: '6px 14px', fontSize: 12, color: '#94a3b8', cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>{info.emoji}</span>{b}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569', fontSize: 13 }}>Ricerca in corso...</div>}

      {searched && !loading && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.3 }}>📭</div>
          <div style={{ fontSize: 14, color: '#64748b' }}>Nessun display trovato</div>
        </div>
      )}

      {/* Risultati */}
      {results.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>{results.length} risultati · Margine {margine}%</div>

          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr 100px 95px 80px 120px', gap: 10, padding: '5px 12px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
            <div /><div>Modello</div>
            <div style={{ textAlign: 'right' }}>Forn. paga</div>
            <div style={{ textAlign: 'right' }}>Tu offri</div>
            <div style={{ textAlign: 'right' }}>Guadagni</div>
            <div style={{ textAlign: 'center' }}>Aggiungi</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {results.map(r => {
              const inOrdine = ordineAperto?.items?.find(i => i.brand === r.brand && i.modello === r.modello)
              return (
                <div key={r.id} style={{
                  display: 'grid', gridTemplateColumns: '34px 1fr 100px 95px 80px 120px', gap: 10,
                  alignItems: 'center',
                  background: inOrdine ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)',
                  border: inOrdine ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: '9px 12px', transition: 'all 0.12s'
                }}>
                  <BrandBadge brand={r.brand} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', padding: '1px 7px', borderRadius: 20, fontWeight: 500 }}>{r.brand}</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{r.modello}</span>
                      {inOrdine && <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '1px 7px', borderRadius: 20 }}>✓ ×{inOrdine.quantita}</span>}
                    </div>
                    {r.note && <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{r.note}</div>}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#64748b' }}>€{r.prezzo_acquisto.toFixed(2)}</div>
                  <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#60a5fa' }}>€{r.prezzo_offerta.toFixed(2)}</div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#4ade80', fontWeight: 600 }}>+€{r.guadagno.toFixed(2)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                    <input type="number" min="1" max="99"
                      value={qtaMap[r.id] || 1}
                      onChange={e => setQtaMap(p => ({ ...p, [r.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                      style={{ width: 40, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 4px', color: '#e2e8f0', fontSize: 12, textAlign: 'center', fontFamily: 'Inter,sans-serif', outline: 'none' }}
                    />
                    <button onClick={() => aggiungi(r)} disabled={aggiungendo[r.id]}
                      style={{ background: aggiungendo[r.id] ? '#1e3a6e' : '#3b82f6', border: 'none', color: '#fff', borderRadius: 7, padding: '6px 9px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', whiteSpace: 'nowrap' }}>
                      {aggiungendo[r.id] ? '...' : '+ Ordine'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── TabOrdine ─────────────────────────────────────────────────────────────────
function TabOrdine({ api, showToast, ordine, setOrdine }) {
  const [fornitori, setFornitori] = useState([])
  const [creando, setCreando] = useState(false)

  useEffect(() => {
    axios.get(`${api}/fornitori`).then(r => setFornitori(r.data || [])).catch(() => {})
  }, [])

  const creaOrdine = async () => {
    setCreando(true)
    try {
      const { data } = await axios.post(`${api}/display-ordini`, {})
      setOrdine(data.data)
      showToast(`✓ Ordine ${data.data.numero} creato`)
    } catch (e) { showToast(e.response?.data?.error || 'Errore', 'error') }
    finally { setCreando(false) }
  }

  const aggiornaFornitore = async (id) => {
    const f = fornitori.find(x => String(x.id) === String(id))
    if (!f || !ordine) return
    try {
      const { data } = await axios.put(`${api}/display-ordini/${ordine.id}`, {
        fornitore_id: f.id,
        fornitore_nome: f.nome || f.ragione_sociale || f.name || '',
        fornitore_email: f.email || '',
        fornitore_tel: f.telefono || f.tel || '',
      })
      setOrdine({ ...data.data, items: ordine.items })
      showToast('✓ Fornitore impostato')
    } catch {}
  }

  const rimuoviItem = async (itemId) => {
    try {
      const { data } = await axios.delete(`${api}/display-ordini/${ordine.id}/items/${itemId}`)
      setOrdine(data.data)
    } catch { showToast('Errore', 'error') }
  }

  const aggiornaQta = async (itemId, qta) => {
    if (qta < 1) return
    try {
      const { data } = await axios.put(`${api}/display-ordini/${ordine.id}/items/${itemId}`, { quantita: qta })
      setOrdine(data.data)
    } catch {}
  }

  const generaPDFeAggiorna = async () => {
    if (!ordine?.items?.length) { showToast('Aggiungi almeno un display', 'error'); return }
    try {
      await generaPDF(ordine)
      const { data } = await axios.patch(`${api}/display-ordini/${ordine.id}/stato`, { stato: 'pdf_generato' })
      setOrdine({ ...data.data, items: ordine.items })
      showToast('✓ PDF scaricato')
    } catch { showToast('Errore PDF', 'error') }
  }

  const cambiStato = async (stato) => {
    try {
      const { data } = await axios.patch(`${api}/display-ordini/${ordine.id}/stato`, { stato })
      setOrdine({ ...data.data, items: ordine.items })
      showToast('✓ Stato aggiornato')
    } catch {}
  }

  const eliminaOrdine = async () => {
    if (!confirm('Eliminare questo ordine?')) return
    try {
      await axios.delete(`${api}/display-ordini/${ordine.id}`)
      setOrdine(null); showToast('Ordine eliminato')
    } catch {}
  }

  if (!ordine) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.25 }}>🛒</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Nessun ordine aperto</div>
      <div style={{ fontSize: 12, color: '#334155', marginBottom: 24 }}>Cerca un display e aggiungilo, oppure crea un ordine vuoto</div>
      <button onClick={creaOrdine} disabled={creando} style={{ background: '#3b82f6', border: 'none', color: '#fff', borderRadius: 10, padding: '11px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
        {creando ? '...' : '+ Crea nuovo ordine'}
      </button>
    </div>
  )

  const items = ordine.items || []
  const stato = STATI[ordine.stato] || STATI.aperto

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 20 }}>
      {/* Sinistra — lista display */}
      <div>
        {/* Header ordine */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{ordine.numero}</div>
              <div style={{ fontSize: 11, color: '#475569' }}>{new Date(ordine.created_at).toLocaleDateString('it-IT')}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: stato.bg, color: stato.color }}>
              {stato.emoji} {stato.label}
            </span>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 5 }}>📦 Fornitore destinatario</label>
            <select onChange={e => aggiornaFornitore(e.target.value)} defaultValue="" style={{ ...inp, fontSize: 12 }}>
              <option value="">{ordine.fornitore_nome ? `✓ ${ordine.fornitore_nome}` : '— Seleziona fornitore —'}</option>
              {fornitori.map(f => <option key={f.id} value={f.id}>{f.nome || f.ragione_sociale || f.name}</option>)}
            </select>
          </div>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.07)', borderRadius: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>📦</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Nessun display aggiunto</div>
            <div style={{ fontSize: 11, color: '#334155', marginTop: 4 }}>Vai alla tab 🔍 Ricerca per aggiungere display all'ordine</div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr 90px 85px 85px 44px', gap: 8, padding: '5px 10px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
              <div /><div>Modello</div><div style={{ textAlign: 'center' }}>Quantità</div><div style={{ textAlign: 'right' }}>Tu offri</div><div style={{ textAlign: 'right' }}>Subtotale</div><div />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '34px 1fr 90px 85px 85px 44px', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 10px' }}>
                  <BrandBadge brand={item.brand} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{item.modello}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>{item.brand}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
                    <button onClick={() => aggiornaQta(item.id, item.quantita - 1)} style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: '#94a3b8', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{item.quantita}</span>
                    <button onClick={() => aggiornaQta(item.id, item.quantita + 1)} style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: '#94a3b8', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>+</button>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13, color: '#60a5fa', fontWeight: 600 }}>€{Number(item.prezzo_offerta).toFixed(2)}</div>
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700 }}>€{(item.quantita * item.prezzo_offerta).toFixed(2)}</div>
                  <button onClick={() => rimuoviItem(item.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', borderRadius: 7, padding: '4px 6px', fontSize: 13, cursor: 'pointer' }}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Destra — riepilogo + azioni */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Riepilogo</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
            <span style={{ color: '#64748b' }}>Pezzi totali</span>
            <span>{items.reduce((s, i) => s + i.quantita, 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 12 }}>
            <span style={{ color: '#64748b' }}>Modelli</span>
            <span>{items.length}</span>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 12 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Totale</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#60a5fa' }}>€{Number(ordine.totale).toFixed(2)}</span>
          </div>
          {ordine.fornitore_nome && (
            <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, fontSize: 11, color: '#93c5fd' }}>
              📦 {ordine.fornitore_nome}
            </div>
          )}
        </div>

        {/* Azioni */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={generaPDFeAggiorna} disabled={!items.length} style={{
            background: items.length ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'rgba(255,255,255,0.05)',
            border: 'none', color: items.length ? '#fff' : '#475569', borderRadius: 10,
            padding: '13px', fontSize: 14, fontWeight: 700, cursor: items.length ? 'pointer' : 'not-allowed',
            fontFamily: 'Inter,sans-serif', boxShadow: items.length ? '0 4px 16px rgba(37,99,235,0.35)' : 'none'
          }}>📄 Genera PDF & Scarica</button>

          {ordine.stato === 'pdf_generato' && (
            <button onClick={() => cambiStato('in_attesa_pagamento')} style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
              ✉️ Segna come inviato
            </button>
          )}

          {ordine.stato === 'in_attesa_pagamento' && (
            <button onClick={() => cambiStato('pagato')} style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
              ✅ Segna come pagato
            </button>
          )}

          <button onClick={eliminaOrdine} style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', borderRadius: 10, padding: '9px', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            🗑️ Elimina ordine
          </button>
        </div>
      </div>
    </div>
  )
}

// ── TabStorico ────────────────────────────────────────────────────────────────
function TabStorico({ api, showToast }) {
  const [ordini, setOrdini] = useState([])
  const [loading, setLoading] = useState(true)
  const [espanso, setEspanso] = useState(null)
  const [dettagli, setDettagli] = useState({})

  useEffect(() => {
    setLoading(true)
    axios.get(`${api}/display-ordini`).then(r => setOrdini(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const toggleEspanso = async (id) => {
    if (espanso === id) { setEspanso(null); return }
    setEspanso(id)
    if (!dettagli[id]) {
      try {
        const { data } = await axios.get(`${api}/display-ordini/${id}`)
        setDettagli(p => ({ ...p, [id]: data.data }))
      } catch {}
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>Caricamento...</div>
  if (ordini.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📋</div>
      <div style={{ fontSize: 14, color: '#64748b' }}>Nessun ordine ancora</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {ordini.map(o => {
        const stato = STATI[o.stato] || STATI.aperto
        const isEsp = espanso === o.id
        const det = dettagli[o.id]
        return (
          <div key={o.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            <div onClick={() => toggleEspanso(o.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{o.numero}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: stato.bg, color: stato.color }}>{stato.emoji} {stato.label}</span>
                </div>
                <div style={{ fontSize: 11, color: '#475569' }}>
                  {o.fornitore_nome || 'Nessun fornitore'} · {o.n_items} display · {new Date(o.created_at).toLocaleDateString('it-IT')}
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#60a5fa' }}>€{Number(o.totale).toFixed(2)}</div>
              <div style={{ fontSize: 11, color: '#475569' }}>{isEsp ? '▲' : '▼'}</div>
            </div>

            {isEsp && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px' }}>
                {!det ? <div style={{ fontSize: 12, color: '#475569' }}>Caricamento...</div> : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                      {(det.items || []).map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                          <BrandBadge brand={item.brand} />
                          <span style={{ flex: 1 }}>{item.brand} {item.modello}</span>
                          <span style={{ color: '#64748b' }}>×{item.quantita}</span>
                          <span style={{ color: '#60a5fa', fontWeight: 600 }}>€{(item.quantita * item.prezzo_offerta).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={async () => { try { await generaPDF(det); showToast('✓ PDF rigenerato') } catch { showToast('Errore PDF', 'error') } }}
                      style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                      📄 Rigenera PDF
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── TabGestione ───────────────────────────────────────────────────────────────
function TabGestione({ api, showToast }) {
  const [margine, setMargine] = useState('30')
  const [uploads, setUploads] = useState([])
  const [uploading, setUploading] = useState(false)
  const [anteprima, setAnteprima] = useState(null)
  const [pendingId, setPendingId] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    axios.get(`${api}/valutazione-display/settings`).then(r => setMargine(r.data.data?.margine_percentuale || '30')).catch(() => {})
    axios.get(`${api}/valutazione-display/uploads`).then(r => setUploads(r.data.data || [])).catch(() => {})
  }, [])

  const fetchUploads = () => axios.get(`${api}/valutazione-display/uploads`).then(r => setUploads(r.data.data || [])).catch(() => {})

  const saveMargine = async () => {
    try { await axios.put(`${api}/valutazione-display/settings`, { margine_percentuale: parseFloat(margine) }); showToast('✓ Margine aggiornato') }
    catch { showToast('Errore', 'error') }
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true); setAnteprima(null); setPendingId(null)
    try {
      const fd = new FormData(); fd.append('file', file)
      const { data } = await axios.post(`${api}/valutazione-display/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setAnteprima(data.data); setPendingId(data.data.upload_id)
      showToast(`✓ ${data.data.righe} display importati`); fetchUploads()
    } catch (e) { showToast(e.response?.data?.error || 'Errore upload', 'error') }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const activate = async (id) => {
    try { const { data } = await axios.patch(`${api}/valutazione-display/uploads/${id}/activate`); showToast(`✓ ${data.righe_attive} display attivi`); fetchUploads(); setAnteprima(null); setPendingId(null) }
    catch { showToast('Errore attivazione', 'error') }
  }

  const del = async (id) => {
    if (!confirm('Eliminare?')) return
    try { await axios.delete(`${api}/valutazione-display/uploads/${id}`); showToast('Eliminato'); fetchUploads() }
    catch { showToast('Errore', 'error') }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Margine */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>💰 Margine (tuo guadagno)</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>Sottratto dal valore fornitore — la differenza è il tuo guadagno.</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 5 }}>Margine (%)</label>
              <input type="number" value={margine} onChange={e => setMargine(e.target.value)} min="0" max="200" style={inp} />
            </div>
            <button onClick={saveMargine} style={{ background: '#3b82f6', border: 'none', color: '#fff', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Salva</button>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#475569' }}>
            Forn. paga <strong style={{ color: '#e2e8f0' }}>€50</strong> → tu offri <strong style={{ color: '#60a5fa' }}>€{(50*(1-parseFloat(margine||0)/100)).toFixed(2)}</strong> · guadagni <strong style={{ color: '#4ade80' }}>€{(50*parseFloat(margine||0)/100).toFixed(2)}</strong>
          </div>
        </div>

        {/* Upload */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>📂 Carica listino</div>
          <div style={{ fontSize: 11, color: '#334155', marginBottom: 14, lineHeight: 1.7 }}>
            Colonne: <span style={{ color: '#60a5fa' }}>Marca · Modello · Prezzo Acquisto</span><br />
            Supporta il formato buyback fornitore (prezzi IVA inclusa)
          </div>
          <label style={{ display: 'block', border: '2px dashed rgba(59,130,246,0.3)', borderRadius: 12, padding: '22px', textAlign: 'center', cursor: 'pointer', background: 'rgba(59,130,246,0.04)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(59,130,246,0.6)'; e.currentTarget.style.background='rgba(59,130,246,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(59,130,246,0.3)'; e.currentTarget.style.background='rgba(59,130,246,0.04)' }}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: 'none' }} />
            {uploading ? <div style={{ color: '#60a5fa', fontSize: 13 }}>⏳ Elaborazione...</div> : (
              <><div style={{ fontSize: 30, marginBottom: 7 }}>📤</div>
              <div style={{ fontSize: 13, color: '#60a5fa', fontWeight: 500 }}>Clicca per selezionare</div>
              <div style={{ fontSize: 10, color: '#334155', marginTop: 3 }}>xlsx · xls · csv — max 10MB</div></>
            )}
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {anteprima && (
          <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#4ade80' }}>✓ {anteprima.righe} display importati</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
              {anteprima.anteprima.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 11, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '5px 9px' }}>
                  <span style={{ color: '#60a5fa', minWidth: 55 }}>{r.brand}</span>
                  <span style={{ flex: 1 }}>{r.modello}</span>
                  <span style={{ color: '#4ade80', fontWeight: 600 }}>€{Number(r.prezzo_acquisto).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <button onClick={() => activate(pendingId)} style={{ width: '100%', background: '#22c55e', border: 'none', color: '#fff', borderRadius: 10, padding: '11px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>⚡ Attiva listino</button>
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📋 Storico listini</div>
          {uploads.length === 0 ? <div style={{ textAlign: 'center', padding: '20px 0', color: '#334155', fontSize: 13 }}>Nessun listino</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {uploads.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: u.attivo ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)', border: u.attivo ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '9px 12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.filename}</div>
                    <div style={{ fontSize: 10, color: '#334155' }}>{u.righe} righe · {new Date(u.created_at).toLocaleDateString('it-IT')}</div>
                  </div>
                  {u.attivo ? <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>Attivo</span>
                    : <button onClick={() => activate(u.id)} style={{ fontSize: 11, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', borderRadius: 7, padding: '4px 9px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', flexShrink: 0 }}>Attiva</button>}
                  <button onClick={() => del(u.id)} style={{ fontSize: 11, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', borderRadius: 7, padding: '4px 9px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', flexShrink: 0 }}>🗑️</button>
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
  const [ordineAperto, setOrdineAperto] = useState(null)

  // Carica ordine aperto all'avvio
  useEffect(() => {
    axios.get(`${api}/display-ordini/aperto`).then(r => setOrdineAperto(r.data.data)).catch(() => {})
  }, [])

  const nItems = ordineAperto?.items?.length || 0

  const TABS = [
    { id: 'ricerca',  label: '🔍 Ricerca' },
    { id: 'ordine',   label: nItems > 0 ? `🛒 Ordine (${nItems})` : '🛒 Ordine' },
    { id: 'storico',  label: '📋 Storico' },
    { id: 'gestione', label: '⚙️ Gestione' },
  ]

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 3 }}>📱 Buyback Display</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Acquisto display usati rigenerabili — procedura guidata</div>
        </div>
        <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '7px 15px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              border: 'none', fontFamily: 'Inter,sans-serif',
              background: tab === t.id ? '#1e3a6e' : 'transparent',
              color: tab === t.id ? '#60a5fa' : '#64748b',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {tab === 'ricerca'  && <TabRicerca  api={api} showToast={showToast} ordineAperto={ordineAperto} setOrdineAperto={setOrdineAperto} goOrdine={() => setTab('ordine')} />}
      {tab === 'ordine'   && <TabOrdine   api={api} showToast={showToast} ordine={ordineAperto} setOrdine={setOrdineAperto} />}
      {tab === 'storico'  && <TabStorico  api={api} showToast={showToast} />}
      {tab === 'gestione' && <TabGestione api={api} showToast={showToast} />}
    </div>
  )
}
