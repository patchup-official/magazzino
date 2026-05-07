// Dashboard.jsx - Fedele al Figma (Frame 4): card grandi con icone e gradienti

import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Dashboard({ api, showToast, onNavigate }) {
  const [stats, setStats] = useState({ devices: [], inStock: 0, daTestare: 0, inRiparazione: 0, valore: 0, products: 0, repairs: [] })

  useEffect(() => {
    Promise.all([
      axios.get(`${api}/products`).catch(() => ({ data: { total: 0 } })),
      axios.get(`${api}/devices`).catch(() => ({ data: { data: [] } })),
      axios.get(`${api}/repairs`).catch(() => ({ data: { data: [] } })),
    ]).then(([prod, dev, rep]) => {
      const devices = dev.data.data || []
      const repairs = rep.data.data || []
      setStats({
        devices: devices.slice(0, 5),
        inStock: devices.filter(d => d.stato === 'in_stock').length,
        daTestare: devices.filter(d => d.stato === 'da_testare').length,
        inRiparazione: devices.filter(d => d.stato === 'in_riparazione').length,
        valore: devices.reduce((s, d) => s + (d.prezzo_acq || 0), 0),
        products: prod.data.total || 0,
        repairs: repairs.filter(r => r.stato === 'aperta').slice(0, 2),
      })
    })
  }, [])

  const bigCards = [
    {
      title: 'Riparazioni',
      count: stats.inRiparazione,
      icon: '✂',
      iconBg: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
      border: 'rgba(37,99,235,0.3)',
      action: 'GESTISCI',
      actionFn: () => onNavigate('riparazioni'),
      secondaryAction: 'Vedi riparazioni',
      bg: 'linear-gradient(145deg, #0f1e40 0%, #0a1530 100%)',
    },
    {
      title: 'Magazzino',
      count: stats.inStock,
      icon: '▣',
      iconBg: 'linear-gradient(135deg, #14532d, #16a34a)',
      border: 'rgba(22,163,74,0.3)',
      action: 'GESTISCI',
      actionFn: () => onNavigate('magazzino'),
      secondaryAction: 'Vedi prodotti',
      bg: 'linear-gradient(145deg, #0a2010 0%, #061408 100%)',
    },
    {
      title: 'Acquisto',
      count: stats.daTestare,
      icon: '◈',
      iconBg: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
      border: 'rgba(124,58,237,0.3)',
      action: 'ACQUISTA',
      actionFn: () => onNavigate('acquisto'),
      secondaryAction: 'Plugin attivo',
      bg: 'linear-gradient(145deg, #1a0a30 0%, #0f0620 100%)',
    },
  ]

  const bottomCards = [
    { title: 'Storico acquisti', icon: '↺', sub: 'Vedi tutti gli acquisti da privati', fn: () => onNavigate('storico') },
    { title: 'Impostazioni', icon: '⚙', sub: 'Configura il sistema', fn: null },
  ]

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>
          Benvenuto! 👋
        </div>
        <div style={{ color: '#64748b', fontSize: 14 }}>
          Gestisci il tuo negozio da qui
        </div>
      </div>

      {/* Big action cards - come nel Figma Frame 4 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
        {bigCards.map((c, i) => (
          <div key={i} style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: 14,
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${c.border}` }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
          >
            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: c.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: 'white',
            }}>{c.icon}</div>

            <div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{c.title}</div>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color: '#60a5fa' }}>{c.count}</div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={c.actionFn} className="btn-blue" style={{ fontSize: 11, padding: '6px 14px', fontWeight: 700, letterSpacing: '0.05em' }}>
                {c.action}
              </button>
              <button className="btn-outline" style={{ fontSize: 11, padding: '6px 12px' }}>
                {c.secondaryAction}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {bottomCards.map((c, i) => (
          <div key={i}
            onClick={c.fn}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: 20,
              display: 'flex', alignItems: 'center', gap: 16,
              cursor: c.fn ? 'pointer' : 'default',
              opacity: c.fn ? 1 : 0.5,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => c.fn && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))'}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>{c.icon}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: '#475569' }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
