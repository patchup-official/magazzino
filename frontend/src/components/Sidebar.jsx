import { useState } from 'react'

const navMain = [
  { id:'dashboard',   icon:'⬡',  label:'Dashboard' },
  { id:'magazzino',   icon:'📦', label:'Magazzino' },
  { id:'cassa',       icon:'💰', label:'Cassa' },
  { id:'clienti',     icon:'👥', label:'Clienti' },
  { id:'riparazioni', icon:'🔧', label:'Riparazioni' },
  { id:'importexport',icon:'📤', label:'Import/Export' },
]
const navPlugin = [
  { id:'acquisto',            icon:'◈',  label:'Acquisto dispositivo' },
  { id:'storico-dispositivi', icon:'📱', label:'Storico Acquisti' },
  { id:'protezione',          icon:'🛡️', label:'Protezione' },
  { id:'valutazione',         icon:'📊', label:'Valutazione Display' },
  { id:'servizi',             icon:'⚙️', label:'Servizi' },
  { id:'noleggio',            icon:'🔄', label:'Noleggio' },
]

export default function Sidebar({ currentPage, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false)

  const Item = ({ id, icon, label }) => {
    const active = currentPage === id
    return (
      <button
        onClick={() => onNavigate(id)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: collapsed ? '10px 0' : '9px 14px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
          border: 'none',
          borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
          borderRadius: 0, cursor: 'pointer',
          color: active ? '#60a5fa' : '#94a3b8',
          fontSize: 13, fontWeight: active ? 600 : 400,
          fontFamily: 'Inter, sans-serif',
          transition: 'all .15s',
        }}
        title={collapsed ? label : undefined}
      >
        <span style={{ fontSize: 16, minWidth: 20, textAlign: 'center' }}>{icon}</span>
        {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
      </button>
    )
  }

  const Divider = ({ label }) => !collapsed ? (
    <div style={{ padding: '12px 14px 4px', fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>
      {label}
    </div>
  ) : <div style={{ margin: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }} />

  return (
    <div style={{
      width: collapsed ? 52 : 210, minHeight: '100vh', flexShrink: 0,
      background: '#080f1d',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      transition: 'width .2s',
    }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '16px 0' : '16px 14px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {!collapsed && <span style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', fontFamily: 'Inter,sans-serif', letterSpacing: '-.02em' }}>Magazzino</span>}
        <button onClick={() => setCollapsed(c => !c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 16, padding: 4, lineHeight: 1 }}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Nav principale */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8 }}>
        <Divider label="Principale" />
        {navMain.map(n => <Item key={n.id} {...n} />)}
        <Divider label="Plugin" />
        {navPlugin.map(n => <Item key={n.id} {...n} />)}
      </div>
    </div>
  )
}
