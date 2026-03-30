// App.jsx - Magazzino SaaS Frontend v2
// VITE_API_URL viene impostato su Render come variabile d'ambiente

import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Magazzino from './pages/Magazzino'
import AcquistoPlugin from './pages/AcquistoPlugin'
import Riparazioni from './pages/Riparazioni'
import Storico from './pages/Storico'
import Toast from './components/Toast'

// In locale usa localhost:3001, su Render usa VITE_API_URL
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [toasts, setToasts] = useState([])

  const showToast = (msg, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  const pages = {
    dashboard:   Dashboard,
    magazzino:   Magazzino,
    acquisto:    AcquistoPlugin,
    riparazioni: Riparazioni,
    storico:     Storico,
  }
  const PageComponent = pages[currentPage] || Dashboard

  const titles = {
    dashboard: 'Dashboard', magazzino: 'Magazzino',
    acquisto: 'Acquisto dispositivo', riparazioni: 'Riparazioni', storico: 'Storico acquisti'
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div style={{height:'50px'}} className="border-b border-white/5 bg-gray-900 flex items-center px-6 justify-between flex-shrink-0">
          <span className="text-sm font-medium">{titles[currentPage]}</span>
          <div className="flex items-center gap-3">
            <Clock />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-xs font-bold">MA</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <PageComponent api={API} showToast={showToast} />
        </div>
      </main>
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50">
        {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} />)}
      </div>
    </div>
  )
}

function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }))
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i)
  }, [])
  return <span className="text-xs text-gray-500 font-mono">{time}</span>
}
