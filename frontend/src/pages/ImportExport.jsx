// ImportExport.jsx - Importa ed esporta dati in CSV

import { useState, useRef } from 'react'
import axios from 'axios'

const SEZIONI = [
  {
    id: 'products',
    label: 'Prodotti',
    icon: '📦',
    campi: 'nome, categoria, qty, prezzo_acq, prezzo_vend, barcode, note',
    duplicati: 'Salta se nome + barcode già esistenti'
  },
  {
    id: 'devices',
    label: 'Dispositivi',
    icon: '📱',
    campi: 'brand, modello, storage, colore, imei, condizione, stato, provenienza, prezzo_acq, prezzo_vend, cliente_nome, cliente_tel, note',
    duplicati: 'Salta se IMEI già esistente'
  },
  {
    id: 'clienti',
    label: 'Clienti',
    icon: '👥',
    campi: 'tipo, nome, cognome, ragione_soc, codice_fisc, piva, telefono, email, indirizzo, cap, citta, note',
    duplicati: 'Salta se nome + telefono già esistenti'
  },
  {
    id: 'ricambi',
    label: 'Ricambi',
    icon: '🔩',
    campi: 'nome, categoria, compatibile, qty, qty_minima, prezzo_acq, barcode, note',
    duplicati: 'Salta se nome + barcode già esistenti'
  }
]

const NOMI_FILE = {
  products: 'prodotti',
  devices: 'dispositivi',
  clienti: 'clienti',
  ricambi: 'ricambi'
}

export default function ImportExport({ api, showToast }) {
  const [selected, setSelected] = useState('products')
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef(null)

  const sezione = SEZIONI.find(s => s.id === selected)

  const handleExport = async () => {
    setExporting(true)
    setResult(null)
    try {
      const response = await axios.get(`${api}/importexport/export/${selected}`, {
        responseType: 'blob'
      })
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${NOMI_FILE[selected]}_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      showToast(`✓ ${sezione.label} esportati`)
    } catch {
      showToast('Errore durante l\'export', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      showToast('Carica un file .csv', 'error')
      return
    }

    setImporting(true)
    setResult(null)

    try {
      const text = await file.text()
      const { data } = await axios.post(
        `${api}/importexport/import/${selected}`,
        text,
        { headers: { 'Content-Type': 'text/csv' } }
      )
      setResult(data)
      showToast(`✓ Importati ${data.inserted} record`)
    } catch {
      showToast('Errore durante l\'import', 'error')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 3 }}>Import / Export</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>Importa o esporta dati in formato CSV</div>
      </div>

      {/* Selezione sezione */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {SEZIONI.map(s => (
          <button key={s.id} onClick={() => { setSelected(s.id); setResult(null) }} style={{
            background: selected === s.id ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.03)',
            border: selected === s.id ? '1px solid rgba(37,99,235,0.4)' : '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '14px 10px', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
            textAlign: 'center', transition: 'all 0.15s'
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: selected === s.id ? '#60a5fa' : '#e2e8f0' }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Card principale */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 28 }}>{sezione.icon}</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{sezione.label}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{sezione.duplicati}</div>
          </div>
        </div>

        {/* Info campi CSV */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Colonne CSV</div>
          <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', lineHeight: 1.8 }}>{sezione.campi}</div>
        </div>

        {/* Azioni */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Export */}
          <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#60a5fa', marginBottom: 6 }}>📤 Esporta</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
              Scarica tutti i {sezione.label.toLowerCase()} in un file CSV
            </div>
            <button onClick={handleExport} disabled={exporting} style={{
              width: '100%', background: exporting ? 'rgba(255,255,255,0.05)' : '#1e3a6e',
              border: '1px solid rgba(37,99,235,0.4)', color: exporting ? '#475569' : '#60a5fa',
              borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 600,
              cursor: exporting ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif'
            }}>
              {exporting ? '⏳ Export...' : '⬇ Scarica CSV'}
            </button>
          </div>

          {/* Import */}
          <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#a78bfa', marginBottom: 6 }}>📥 Importa</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
              Carica un CSV con i {sezione.label.toLowerCase()} da aggiungere
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={importing} style={{
              width: '100%', background: importing ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.2)',
              border: '1px solid rgba(124,58,237,0.4)', color: importing ? '#475569' : '#a78bfa',
              borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 600,
              cursor: importing ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif'
            }}>
              {importing ? '⏳ Import...' : '⬆ Carica CSV'}
            </button>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
          </div>
        </div>

        {/* Risultato import */}
        {result && (
          <div style={{ marginTop: 16, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#4ade80', marginBottom: 8 }}>✓ Import completato</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { label: 'Totali nel file', val: result.total, color: '#94a3b8' },
                { label: 'Importati', val: result.inserted, color: '#4ade80' },
                { label: 'Saltati (duplicati)', val: result.skipped, color: '#f59e0b' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'monospace' }}>{val}</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Istruzioni */}
      <div style={{ marginTop: 20, maxWidth: 640 }}>
        <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.8 }}>
          💡 <strong style={{ color: '#475569' }}>Come usare l'import:</strong> Esporta prima i dati esistenti per ottenere un CSV con le colonne corrette, 
          poi modifica o aggiungi righe e reimporta. I duplicati vengono saltati automaticamente.
        </div>
      </div>
    </div>
  )
}
