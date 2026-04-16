// Sidebar.jsx

import CreaNuovo from './CreaNuovo'

export default function Sidebar({ currentPage, onNavigate, onCreaNuovo }) {
  const navMain = [
    { id:'dashboard',   icon:'⌂',  label:'Homepage' },
    { id:'magazzino',   icon:'▣',  label:'Magazzino' },
    { id:'riparazioni', icon:'✂',  label:'Riparazioni' },
    { id:'servizi',     icon:'🛠', label:'Servizi' },
    { id:'clienti',     icon:'👥', label:'Clienti' },
    { id:'storico',     icon:'☰',  label:'Storico acquisti' },
  ]
  const navPlugin = [
    { id:'acquisto',   icon:'◈',  label:'Acquisto dispositivo' },
    { id:'protezione', icon:'🛡️', label:'Protezione' },
    { id:'valutazione', icon:'🔍', label:'Valutazione Display' },
    { id:'noleggio', icon:'📦', label:'Noleggio', badge:'Subbyx' },
  ]
  const navAdmin = [
    { id:'cassa', icon:'💰', label:'Chiusura Cassa' },
  ]
  const navSystem = [
    { id:'importexport',  icon:'⇅', label:'Import / Export' },
    { id:'impostazioni',  icon:'⚙', label:'Impostazioni', disabled:true },
  ]

  const NavItem = ({ item }) => {
    const isActive = currentPage === item.id
    return (
      <button
        onClick={() => !item.disabled && onNavigate(item.id)}
        disabled={item.disabled}
        style={{
          width:'100%', display:'flex', alignItems:'center', gap:9,
          padding:'7.5px 10px', borderRadius: isActive ? 0 : 9,
          border:'none', cursor: item.disabled ? 'not-allowed' : 'pointer',
          fontFamily:'Inter,sans-serif', textAlign:'left',
          fontSize:13, fontWeight: isActive ? 500 : 400,
          transition:'all 0.15s', marginBottom:1,
          opacity: item.disabled ? 0.35 : 1,
          background: isActive ? 'rgba(37,99,235,0.12)' : 'transparent',
          color: isActive ? '#60a5fa' : 'rgba(255,255,255,0.55)',
          borderLeft: isActive ? '2px solid #2563eb' : '2px solid transparent',
        }}
        onMouseEnter={e => { if (!isActive && !item.disabled) { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='rgba(255,255,255,0.85)' }}}
        onMouseLeave={e => { if (!isActive && !item.disabled) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.55)' }}}
      >
        <span style={{ fontSize:14, width:16, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
        {item.label}
      </button>
    )
  }

  const SectionLabel = ({ children }) => (
    <div style={{ padding:'14px 10px 5px', fontSize:9.5, fontWeight:700, color:'rgba(255,255,255,0.2)', letterSpacing:'0.1em', textTransform:'uppercase' }}>
      {children}
    </div>
  )

  return (
    <aside style={{ width:210, background:'#090e1e', borderRight:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', flexShrink:0, paddingTop:18 }}>
      <div style={{ padding:'0 18px 18px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.4px', color:'white' }}>
          è<span style={{ color:'#38bdf8' }}>nown</span>
        </div>
        <div style={{ display:'flex', gap:5, marginTop:5 }}>
          {['#3b82f6','#22c55e','#a855f7'].map(c => (
            <span key={c} style={{ width:7, height:7, borderRadius:'50%', background:c, display:'inline-block' }}/>
          ))}
        </div>
      </div>
      <div style={{ paddingTop:12 }}><CreaNuovo onSelect={onCreaNuovo} /></div>
      <nav style={{ padding:'0 8px', flex:1, overflowY:'auto' }}>
        <SectionLabel>Principale</SectionLabel>
        {navMain.map(item => <NavItem key={item.id} item={item} />)}
        <SectionLabel>Plugin attivi</SectionLabel>
        {navPlugin.map(item => <NavItem key={item.id} item={item} />)}
        <SectionLabel>Amministrazione</SectionLabel>
        {navAdmin.map(item => <NavItem key={item.id} item={item} />)}
        <SectionLabel>Sistema</SectionLabel>
        {navSystem.map(item => <NavItem key={item.id} item={item} />)}
      </nav>
      <div style={{ padding:'12px 14px 16px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'white', flexShrink:0 }}>A</div>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:'#e2e8f0' }}>Admin</div>
            <div style={{ fontSize:10, color:'#334155' }}>admin@negozio.it</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:10 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', display:'inline-block' }}/>
          <span style={{ fontSize:11, color:'#334155' }}>Negozio principale</span>
        </div>
      </div>
    </aside>
  )
}
