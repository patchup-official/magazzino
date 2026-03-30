// pages/Riparazioni.jsx

import { useState, useEffect } from 'react'
import axios from 'axios'

const PRIOR_BADGE = {
  normale: 'bg-gray-500/15 text-gray-400',
  alta:    'bg-amber-500/15 text-amber-400',
  urgente: 'bg-red-500/15 text-red-400'
}

export default function Riparazioni({ api, showToast }) {
  const [repairs, setRepairs] = useState([])
  const [filter, setFilter] = useState('aperta')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({
    cliente:'', tel:'', brand:'Apple', modello:'',
    problema:'', priorita:'normale', costo:0, data_stimata:'', note:''
  })

  useEffect(() => { fetchRepairs() }, [])

  const fetchRepairs = async () => {
    try {
      const { data } = await axios.get(`${api}/repairs`)
      setRepairs(data.data)
    } catch {
      setRepairs(JSON.parse(localStorage.getItem('ew_rep') || '[]'))
    }
  }

  const addRepair = async () => {
    if (!form.cliente || !form.modello) { showToast('Cliente e modello obbligatori', 'error'); return }
    const newR = { ...form, id: Date.now().toString(), stato: 'aperta', progress: 0, at: new Date().toISOString() }
    try {
      const { data } = await axios.post(`${api}/repairs`, form)
      setRepairs(prev => [data, ...prev])
    } catch {
      const saved = JSON.parse(localStorage.getItem('ew_rep') || '[]')
      saved.push(newR)
      localStorage.setItem('ew_rep', JSON.stringify(saved))
      setRepairs(prev => [newR, ...prev])
    }
    setModal(false)
    setForm({ cliente:'', tel:'', brand:'Apple', modello:'', problema:'', priorita:'normale', costo:0, data_stimata:'', note:'' })
    showToast('✓ Riparazione creata')
  }

  const updateProgress = (id, val) => {
    setRepairs(prev => prev.map(r => r.id === id ? { ...r, progress: val } : r))
    try { axios.put(`${api}/repairs/${id}/progress`, { progress: val }) } catch {}
  }

  const complete = async (id) => {
    setRepairs(prev => prev.map(r => r.id === id ? { ...r, stato: 'completata', progress: 100 } : r))
    try { await axios.put(`${api}/repairs/${id}/complete`) } catch {}
    showToast('✓ Riparazione completata')
  }

  const remove = async (id) => {
    setRepairs(prev => prev.filter(r => r.id !== id))
    try { await axios.delete(`${api}/repairs/${id}`) } catch {}
    showToast('Riparazione eliminata')
  }

  const filtered = repairs.filter(r =>
    filter === 'all' ? true : r.stato === filter
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Riparazioni</h1>
          <p className="text-gray-400 text-sm mt-1">Gestisci i lavori in corso</p>
        </div>
        <button onClick={() => setModal(true)} className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors">
          + Nuova riparazione
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0.5 bg-gray-800/60 rounded-xl p-1 mb-5 w-fit">
        {[['aperta','In corso'],['completata','Completate'],['all','Tutte']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
              ${filter === v ? 'bg-gray-700 text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-gray-500">
            <div className="text-3xl mb-3 opacity-40">⚙</div>
            <div className="text-sm font-medium text-gray-400 mb-1">
              {filter === 'aperta' ? 'Nessuna riparazione aperta' : 'Nessuna riparazione trovata'}
            </div>
            <div className="text-xs">Crea una nuova riparazione per iniziare</div>
          </div>
        ) : filtered.map(r => (
          <div key={r.id} className="bg-gray-900 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-medium text-sm">{r.cliente}</div>
                <div className="text-xs text-gray-500 mt-0.5">{r.brand} {r.modello}</div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full ${PRIOR_BADGE[r.priorita]||'bg-gray-500/15 text-gray-400'}`}>
                  {r.priorita}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.stato==='aperta' ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                  {r.stato}
                </span>
              </div>
            </div>

            {r.problema && (
              <div className="text-xs text-gray-400 border-l-2 border-gray-700 pl-2.5 mb-3 leading-relaxed">
                {r.problema}
              </div>
            )}

            {r.stato === 'aperta' && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Progresso</span><span>{r.progress || 0}%</span>
                </div>
                <input type="range" min="0" max="100" value={r.progress || 0}
                  onChange={e => updateProgress(r.id, +e.target.value)}
                  className="w-full h-1 accent-violet-500" />
                <div className="h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-violet-600 rounded-full transition-all" style={{ width: `${r.progress || 0}%` }} />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span>{r.data_stimata ? `Consegna: ${r.data_stimata}` : r.tel || ''}</span>
              <span className="font-mono">€{r.costo}</span>
            </div>

            <div className="flex gap-2">
              {r.stato === 'aperta' && (
                <button onClick={() => complete(r.id)} className="flex-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs font-medium py-1.5 rounded-lg hover:bg-emerald-500/25 transition-colors">
                  ✓ Completata
                </button>
              )}
              <button onClick={() => remove(r.id)} className="bg-red-500/10 text-red-400 border border-red-500/15 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors">
                Elimina
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <span className="text-base font-semibold">Nuova riparazione</span>
              <button onClick={() => setModal(false)} className="text-gray-500 hover:text-gray-200 text-lg">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {label:'Cliente',key:'cliente',placeholder:'Mario Rossi',full:false},
                {label:'Telefono',key:'tel',placeholder:'+39 333...',full:false},
              ].map(f => (
                <div key={f.key} className={`flex flex-col gap-1 ${f.full?'col-span-2':''}`}>
                  <label className="text-xs text-gray-400">{f.label}</label>
                  <input placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm({...form,[f.key]:e.target.value})} />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Brand</label>
                <select value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})}>
                  {['Apple','Samsung','Google','Xiaomi','OnePlus','Huawei'].map(b=><option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Modello</label>
                <input placeholder="iPhone 14" value={form.modello} onChange={e=>setForm({...form,modello:e.target.value})} />
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-xs text-gray-400">Problema</label>
                <textarea placeholder="Schermo rotto, non si accende..." value={form.problema} onChange={e=>setForm({...form,problema:e.target.value})} className="min-h-[70px]" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Priorità</label>
                <select value={form.priorita} onChange={e=>setForm({...form,priorita:e.target.value})}>
                  <option value="normale">Normale</option><option value="alta">Alta</option><option value="urgente">Urgente</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Costo preventivato €</label>
                <input type="number" value={form.costo} onChange={e=>setForm({...form,costo:+e.target.value})} />
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-xs text-gray-400">Data consegna stimata</label>
                <input type="date" value={form.data_stimata} onChange={e=>setForm({...form,data_stimata:e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-white/5">
              <button onClick={() => setModal(false)} className="bg-white/5 text-gray-300 text-sm px-4 py-2 rounded-lg border border-white/5">Annulla</button>
              <button onClick={addRepair} className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4 py-2 rounded-lg">Crea riparazione</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
