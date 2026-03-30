// pages/Dashboard.jsx

import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Dashboard({ api }) {
  const [stats, setStats] = useState({ products: 0, devices: [], inStock: 0, daTestare: 0, valore: 0 })

  useEffect(() => {
    Promise.all([
      axios.get(`${api}/products`),
      axios.get(`${api}/devices`)
    ]).then(([prod, dev]) => {
      const devices = dev.data.data
      setStats({
        products: prod.data.total,
        devices: devices.slice(0, 5),
        inStock: devices.filter(d => d.stato === 'in_stock').length,
        daTestare: devices.filter(d => d.stato === 'da_testare').length,
        valore: devices.reduce((s, d) => s + d.prezzo_acq, 0)
      })
    }).catch(() => {})
  }, [])

  const statCards = [
    { label: 'Dispositivi in stock', value: stats.inStock, color: 'text-gray-100' },
    { label: 'Da testare', value: stats.daTestare, color: 'text-amber-400' },
    { label: 'Prodotti a catalogo', value: stats.products, color: 'text-gray-100' },
    { label: 'Valore magazzino', value: `€${stats.valore.toLocaleString('it-IT')}`, color: 'text-teal-400' },
  ]

  const statoBadge = {
    in_stock: 'bg-emerald-500/15 text-emerald-400',
    venduto: 'bg-gray-500/15 text-gray-400',
    in_riparazione: 'bg-amber-500/15 text-amber-400',
    da_testare: 'bg-violet-500/15 text-violet-400'
  }

  const statoLabel = {
    in_stock: 'In stock', venduto: 'Venduto',
    in_riparazione: 'In ripar.', da_testare: 'Da testare'
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Panoramica</h1>
        <p className="text-gray-400 text-sm mt-1">Riepilogo delle attività del negozio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        {statCards.map((s, i) => (
          <div key={i} className="bg-gray-900 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">{s.label}</div>
            <div className={`text-2xl font-semibold font-mono tracking-tight ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recent devices */}
      <div className="bg-gray-900 border border-white/5 rounded-xl">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
          <span className="text-sm font-medium">Ultimi dispositivi</span>
        </div>
        {stats.devices.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">Nessun dispositivo ancora</div>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {stats.devices.map(d => (
                <tr key={d.id} className="border-b border-white/5 last:border-none hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-medium">{d.brand} {d.modello}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statoBadge[d.stato] || 'bg-gray-500/15 text-gray-400'}`}>
                      {statoLabel[d.stato] || d.stato}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">€{d.prezzo_acq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
