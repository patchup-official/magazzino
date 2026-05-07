// pages/Storico.jsx - Storico acquisti da privati

import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Storico({ api }) {
  const [purchases, setPurchases] = useState([])
  const [stats, setStats] = useState({ total: 0, totale_speso: 0, cash_count: 0, voucher_count: 0 })

  useEffect(() => {
    axios.get(`${api}/purchases`).then(({ data }) => {
      setPurchases(data.data)
      setStats(data.stats || {})
    }).catch(() => {
      const local = JSON.parse(localStorage.getItem('mag_hist') || '[]')
      setPurchases(local)
      setStats({
        total: local.length,
        totale_speso: local.reduce((s, p) => s + (p.prezzo || 0), 0),
        cash_count: local.filter(p => p.tipo === 'cash').length,
        voucher_count: local.filter(p => p.tipo === 'voucher').length,
      })
    })
  }, [])

  const exportCSV = () => {
    const rows = [['Data','Brand','Modello','Cliente','Tel','Importo','Tipo Pagamento','Condizione']]
    purchases.forEach(p => rows.push([
      new Date(p.at || p.created_at).toLocaleDateString('it-IT'),
      p.brand, p.modello, p.cliente, p.tel || '',
      p.prezzo, p.tipo || p.tipo_pag, p.condizione || p.cond || ''
    ]))
    const csv = rows.map(r => r.map(x => `"${x}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `magazzino_storico_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Storico acquisti</h1>
          <p className="text-gray-400 text-sm mt-1">Tutti gli acquisti da privati</p>
        </div>
        <button onClick={exportCSV} className="bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium px-3.5 py-2 rounded-lg transition-colors flex items-center gap-2">
          ⬇ Esporta CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        {[
          ['Acquisti totali', stats.total || 0, 'text-gray-100'],
          ['Totale speso', `€${(stats.totale_speso || 0).toLocaleString('it-IT')}`, 'text-teal-400'],
          ['Pagamenti cash', stats.cash_count || 0, 'text-emerald-400'],
          ['Buoni emessi', stats.voucher_count || 0, 'text-violet-400'],
        ].map(([l,v,c]) => (
          <div key={l} className="bg-gray-900 border border-white/5 rounded-xl p-4">
            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">{l}</div>
            <div className={`text-2xl font-semibold font-mono tracking-tight ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Data','Dispositivo','Cliente','Telefono','Importo','Tipo','Condizione'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-14 text-gray-500 text-sm">
                  Nessun acquisto ancora — usa il Plugin acquisto per iniziare
                </td></tr>
              ) : [...purchases].reverse().map((p, i) => {
                const tipo = p.tipo || p.tipo_pag
                const cond = p.condizione || p.cond
                const condBadge = { A:'bg-emerald-500/15 text-emerald-400', B:'bg-amber-500/15 text-amber-400', C:'bg-red-500/15 text-red-400' }
                return (
                  <tr key={p.id || i} className="border-b border-white/5 last:border-none hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                      {new Date(p.at || p.created_at).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-4 py-3 font-medium">{p.brand} {p.modello}</td>
                    <td className="px-4 py-3 text-gray-300">{p.cliente}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.tel || '-'}</td>
                    <td className="px-4 py-3 font-mono font-semibold" style={{ color: tipo === 'voucher' ? 'var(--violet-400, #a78bfa)' : '#22c55e' }}>
                      €{p.prezzo}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tipo === 'voucher' ? 'bg-violet-500/15 text-violet-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                        {tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {cond ? <span className={`text-xs px-2 py-0.5 rounded-full ${condBadge[cond] || 'bg-gray-500/15 text-gray-400'}`}>{cond}</span> : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
