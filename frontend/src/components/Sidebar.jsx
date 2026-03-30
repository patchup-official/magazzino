// components/Sidebar.jsx

export default function Sidebar({ currentPage, onNavigate }) {
  const navMain = [
    { id: 'dashboard',   icon: '▦', label: 'Dashboard' },
    { id: 'magazzino',   icon: '◫', label: 'Magazzino' },
    { id: 'riparazioni', icon: '⚙', label: 'Riparazioni' },
    { id: 'storico',     icon: '↺', label: 'Storico acquisti' },
  ]
  const navPlugin = [
    { id: 'acquisto', icon: '◈', label: 'Acquisto', badge: 'plugin' },
  ]

  const NavItem = ({ item }) => (
    <button
      onClick={() => onNavigate(item.id)}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all mb-0.5 text-left relative
        ${currentPage === item.id
          ? 'bg-violet-500/15 text-violet-300'
          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
        }`}
    >
      {currentPage === item.id && (
        <span className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-500 rounded-r" />
      )}
      <span className="text-base w-4 text-center">{item.icon}</span>
      {item.label}
      {item.badge && (
        <span className="ml-auto bg-violet-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </button>
  )

  return (
    <aside className="w-56 bg-gray-900 border-r border-white/5 flex flex-col py-5 flex-shrink-0">
      <div className="px-5 pb-5 border-b border-white/5 mb-3">
        <div className="text-lg font-semibold tracking-tight text-violet-400">
          Magazzino
        </div>
        <div className="text-[10px] text-gray-500 font-mono mt-0.5">v2.0 · gestione negozio</div>
      </div>

      <nav className="px-3">
        <div className="text-[10px] font-medium text-gray-600 uppercase tracking-widest px-2 py-2">Principale</div>
        {navMain.map(item => <NavItem key={item.id} item={item} />)}

        <div className="text-[10px] font-medium text-gray-600 uppercase tracking-widest px-2 py-2 mt-3">Plugin</div>
        {navPlugin.map(item => <NavItem key={item.id} item={item} />)}
      </nav>

      <div className="mt-auto px-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-2 px-2 text-xs text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          Sistema online
        </div>
      </div>
    </aside>
  )
}
