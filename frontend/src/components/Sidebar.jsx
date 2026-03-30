// Sidebar.jsx - Fedele al design Figma Enown

export default function Sidebar({ currentPage, onNavigate }) {
  const navMain = [
    { id: 'dashboard',   icon: '⌂', label: 'Homepage' },
    { id: 'magazzino',   icon: '▣', label: 'Magazzino' },
    { id: 'riparazioni', icon: '✂', label: 'Riparazioni' },
    { id: 'storico',     icon: '☰', label: 'Storico acquisti' },
  ]
  const navPlugin = [
    { id: 'acquisto', icon: '◈', label: 'Acquisto dispositivo' },
  ]
  const navSystem = [
    { id: 'impostazioni', icon: '⚙', label: 'Impostazioni', disabled: true },
  ]

  const NavItem = ({ item }) => {
    const isActive = currentPage === item.id
    return (
      <button
        onClick={() => !item.disabled && onNavigate(item.id)}
        disabled={item.disabled}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all text-left
          ${isActive
            ? 'nav-active rounded-none'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg'
          }
          ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
        style={isActive ? { borderLeft: '2px solid #2563eb', background: 'rgba(37,99,235,0.12)', color: '#60a5fa' } : {}}
      >
        <span style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
        {item.label}
      </button>
    )
  }

  return (
    <aside style={{
      width: 200,
      background: '#090e1e',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      padding: '20px 0',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: 'white' }}>
          ènow<span style={{ color: '#38bdf8' }}>n</span>
        </div>
        <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7', display: 'inline-block' }} />
        </div>
      </div>

      {/* Crea nuovo btn */}
      <div style={{ padding: '0 12px 16px' }}>
        <button
          onClick={() => onNavigate('acquisto')}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '8px 12px', color: '#94a3b8', fontSize: 12.5, fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'Inter, sans-serif',
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: 14 }}>+</span> Crea nuovo
        </button>
      </div>

      {/* Nav principale */}
      <nav style={{ padding: '0 8px', flex: 1 }}>
        {navMain.map(item => <NavItem key={item.id} item={item} />)}

        <div style={{ padding: '16px 12px 6px', fontSize: 10, fontWeight: 600, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Plugin attivi
        </div>
        {navPlugin.map(item => <NavItem key={item.id} item={item} />)}

        <div style={{ padding: '16px 12px 6px', fontSize: 10, fontWeight: 600, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Sistema
        </div>
        {navSystem.map(item => <NavItem key={item.id} item={item} />)}
      </nav>

      {/* Footer utente */}
      <div style={{
        padding: '16px 16px 0',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        marginTop: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0
          }}>A</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>Admin</div>
            <div style={{ fontSize: 10, color: '#475569' }}>admin@negozio.it</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: '#475569' }}>Negozio principale</span>
        </div>
      </div>
    </aside>
  )
}
