// pages/Magazzino.jsx

import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Magazzino({ api, showToast }) {
  const [activeTab, setActiveTab] = useState('prodotti')
  const [products, setProducts] = useState([])
  const [devices, setDevices] = useState([])
  const [filters, setFilters] = useState({ brand: '', stato: '' })
  const [modals, setModals] = useState({ product: false, device: false })

  const [newProduct, setNewProduct] = useState({ nome:'', categoria:'Cover', qty:0, prezzo_acq:0, prezzo_vend:0 })
  const [newDevice, setNewDevice] = useState({ brand:'Apple', modello:'', storage:'128GB', colore:'', imei:'', condizione:'B', stato:'in_stock', provenienza:'fornitore', prezzo_acq:0, prezzo_vend:0 })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [p, d] = await Promise.all([axios.get(`${api}/products`), axios.get(`${api}/devices`)])
      setProducts(p.data.data)
      setDevices(d.data.data)
    } catch { /* api not available, use empty */ }
  }

  const addProduct = async () => {
    if (!newProduct.nome) { showToast('Inserisci il nome', 'error'); return }
    try {
      const { data } = await axios.post(`${api}/products`, newProduct)
      setProducts(prev => [data, ...prev])
    } catch { setProducts(prev => [{...newProduct, id: Date.now().toString()}, ...prev]) }
    setModals({ ...modals, product: false })
    setNewProduct({ nome:'', categoria:'Cover', qty:0, prezzo_acq:0, prezzo_vend:0 })
    showToast('✓ Prodotto aggiunto')
  }

  const deleteProduct = async (id) => {
    try { await axios.delete(`${api}/products/${id}`) } catch {}
    setProducts(prev => prev.filter(p => p.id !== id))
    showToast('Prodotto eliminato')
  }

  const addDevice = async () => {
    if (!newDevice.modello) { showToast('Inserisci il modello', 'error'); return }
    try {
      const { data } = await axios.post(`${api}/devices`, newDevice)
      setDevices(prev => [data, ...prev])
    } catch { setDevices(prev => [{...newDevice, id: Date.now().toString()}, ...prev]) }
    setModals({ ...modals, device: false })
    setNewDevice({ brand:'Apple', modello:'', storage:'128GB', colore:'', imei:'', condizione:'B', stato:'in_stock', provenienza:'fornitore', prezzo_acq:0, prezzo_vend:0 })
    showToast('✓ Dispositivo aggiunto')
  }

  const deleteDevice = async (id) => {
    try { await axios.delete(`${api}/devices/${id}`) } catch {}
    setDevices(prev => prev.filter(d => d.id !== id))
    showToast('Dispositivo eliminato')
  }

  const filteredDevices = devices.filter(d => {
    if (filters.brand && d.brand !== filters.brand) return false
    if (filters.stato && d.stato !== filters.stato) return false
    return true
  })

  const statoBadge = {
    in_stock: 'bg-emerald-500/15 text-emerald-400',
    venduto: 'bg-gray-500/15 text-gray-400',
    in_riparazione: 'bg-amber-500/15 text-amber-400',
    da_testare: 'bg-violet-500/15 text-violet-400'
  }
  const statoLabel = { in_stock:'In stock', venduto:'Venduto', in_riparazione:'In riparazione', da_testare:'Da testare' }
  const condBadge = { A:'bg-emerald-500/15 text-emerald-400', B:'bg-amber-500/15 text-amber-400', C:'bg-red-500/15 text-red-400' }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Magazzino</h1>
        <p className="text-gray-400 text-sm mt-1">Gestisci prodotti e dispositivi</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-gray-800/60 rounded-xl p-1 mb-5 w-fit">
        {['prodotti','dispositivi'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-1.5 rounded-lg text-sm font-medium capitalize transition-all
              ${activeTab === tab ? 'bg-gray-700 text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* PRODOTTI */}
      {activeTab === 'prodotti' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-400">{products.length} prodotti</span>
            <button onClick={() => setModals({...modals, product:true})} className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-3.5 py-1.5 rounded-lg transition-colors">
              + Aggiungi prodotto
            </button>
          </div>
          <div className="bg-gray-900 border border-white/5 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/5">
                  {['Nome','Categoria','Acquisto','Vendita','Quantità','Margine',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-12 text-gray-500 text-sm">📦 Nessun prodotto ancora</td></tr>
                  ) : products.map(p => {
                    const m = p.prezzo_vend && p.prezzo_acq ? Math.round(((p.prezzo_vend-p.prezzo_acq)/p.prezzo_acq)*100) : null
                    return <tr key={p.id} className="border-b border-white/5 last:border-none hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium">{p.nome}</td>
                      <td className="px-4 py-3"><span className="bg-blue-500/15 text-blue-400 text-xs px-2 py-0.5 rounded-full">{p.categoria}</span></td>
                      <td className="px-4 py-3 text-gray-400">€{p.prezzo_acq}</td>
                      <td className="px-4 py-3 text-gray-400">€{p.prezzo_vend}</td>
                      <td className="px-4 py-3 text-gray-400">{p.qty}</td>
                      <td className="px-4 py-3">{m !== null ? <span className={`text-xs px-2 py-0.5 rounded-full ${m>0?'bg-emerald-500/15 text-emerald-400':'bg-red-500/15 text-red-400'}`}>{m}%</span> : '-'}</td>
                      <td className="px-4 py-3"><button onClick={()=>deleteProduct(p.id)} className="text-red-400/60 hover:text-red-400 text-xs transition-colors">Elimina</button></td>
                    </tr>
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DISPOSITIVI */}
      {activeTab === 'dispositivi' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <select value={filters.brand} onChange={e=>setFilters({...filters,brand:e.target.value})} className="bg-gray-800 border border-white/5 rounded-lg px-3 py-1.5 text-sm text-gray-300">
                <option value="">Tutti i brand</option>
                {['Apple','Samsung','Google','Xiaomi','OnePlus','Huawei'].map(b=><option key={b}>{b}</option>)}
              </select>
              <select value={filters.stato} onChange={e=>setFilters({...filters,stato:e.target.value})} className="bg-gray-800 border border-white/5 rounded-lg px-3 py-1.5 text-sm text-gray-300">
                <option value="">Tutti gli stati</option>
                <option value="in_stock">In stock</option>
                <option value="da_testare">Da testare</option>
                <option value="in_riparazione">In riparazione</option>
                <option value="venduto">Venduto</option>
              </select>
            </div>
            <button onClick={() => setModals({...modals, device:true})} className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-3.5 py-1.5 rounded-lg transition-colors">
              + Aggiungi dispositivo
            </button>
          </div>
          <div className="bg-gray-900 border border-white/5 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/5">
                  {['Dispositivo','Storage','Colore','IMEI','Cond.','Stato','Prov.','Acq.','Vend.',''].map(h=>(
                    <th key={h} className="px-3 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filteredDevices.length === 0 ? (
                    <tr><td colSpan="10" className="text-center py-12 text-gray-500 text-sm">📱 Nessun dispositivo trovato</td></tr>
                  ) : filteredDevices.map(d => (
                    <tr key={d.id} className="border-b border-white/5 last:border-none hover:bg-white/[0.02]">
                      <td className="px-3 py-3"><span className="text-gray-500 text-[10px] block">{d.brand}</span>{d.modello}</td>
                      <td className="px-3 py-3 font-mono text-xs text-gray-400">{d.storage||'-'}</td>
                      <td className="px-3 py-3 text-gray-400">{d.colore||'-'}</td>
                      <td className="px-3 py-3 font-mono text-[10px] text-gray-500">{d.imei ? d.imei.substring(0,8)+'...' : '-'}</td>
                      <td className="px-3 py-3"><span className={`text-xs px-1.5 py-0.5 rounded-full ${condBadge[d.condizione]||'bg-gray-500/15 text-gray-400'}`}>{d.condizione}</span></td>
                      <td className="px-3 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statoBadge[d.stato]||'bg-gray-500/15 text-gray-400'}`}>{statoLabel[d.stato]||d.stato}</span></td>
                      <td className="px-3 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${d.provenienza==='privato'?'bg-teal-500/15 text-teal-400':'bg-blue-500/15 text-blue-400'}`}>{d.provenienza}</span></td>
                      <td className="px-3 py-3 text-gray-400">€{d.prezzo_acq}</td>
                      <td className="px-3 py-3 text-gray-400">{d.prezzo_vend ? `€${d.prezzo_vend}` : '-'}</td>
                      <td className="px-3 py-3"><button onClick={()=>deleteDevice(d.id)} className="text-red-400/60 hover:text-red-400 text-xs transition-colors">Elimina</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRODOTTO */}
      {modals.product && (
        <Modal title="Aggiungi prodotto" onClose={()=>setModals({...modals,product:false})}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1"><label className="text-xs text-gray-400">Nome</label><input placeholder="Cover iPhone 15" value={newProduct.nome} onChange={e=>setNewProduct({...newProduct,nome:e.target.value})} /></div>
            <div className="flex flex-col gap-1"><label className="text-xs text-gray-400">Categoria</label>
              <select value={newProduct.categoria} onChange={e=>setNewProduct({...newProduct,categoria:e.target.value})}>
                {['Cover','Caricabatterie','Cavo','Auricolari','Vetro temperato','Accessori','Ricambi'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1"><label className="text-xs text-gray-400">Quantità</label><input type="number" value={newProduct.qty} onChange={e=>setNewProduct({...newProduct,qty:+e.target.value})} /></div>
            <div className="flex flex-col gap-1"><label className="text-xs text-gray-400">Prezzo acquisto (€)</label><input type="number" step="0.01" value={newProduct.prezzo_acq} onChange={e=>setNewProduct({...newProduct,prezzo_acq:+e.target.value})} /></div>
            <div className="flex flex-col gap-1"><label className="text-xs text-gray-400">Prezzo vendita (€)</label><input type="number" step="0.01" value={newProduct.prezzo_vend} onChange={e=>setNewProduct({...newProduct,prezzo_vend:+e.target.value})} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-white/5">
            <button onClick={()=>setModals({...modals,product:false})} className="bg-white/5 text-gray-300 text-sm px-4 py-2 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">Annulla</button>
            <button onClick={addProduct} className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">Salva</button>
          </div>
        </Modal>
      )}

      {/* MODAL DISPOSITIVO */}
      {modals.device && (
        <Modal title="Aggiungi dispositivo" onClose={()=>setModals({...modals,device:false})}>
          <div className="grid grid-cols-2 gap-3">
            {[
              {label:'Brand', type:'select', key:'brand', opts:['Apple','Samsung','Google','Xiaomi','OnePlus','Huawei']},
              {label:'Modello', type:'text', key:'modello', placeholder:'iPhone 15 Pro'},
              {label:'Storage', type:'select', key:'storage', opts:['64GB','128GB','256GB','512GB','1TB']},
              {label:'Colore', type:'text', key:'colore', placeholder:'Nero'},
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">{f.label}</label>
                {f.type === 'select'
                  ? <select value={newDevice[f.key]} onChange={e=>setNewDevice({...newDevice,[f.key]:e.target.value})}>{f.opts.map(o=><option key={o}>{o}</option>)}</select>
                  : <input placeholder={f.placeholder} value={newDevice[f.key]} onChange={e=>setNewDevice({...newDevice,[f.key]:e.target.value})} />
                }
              </div>
            ))}
            <div className="col-span-2 flex flex-col gap-1"><label className="text-xs text-gray-400">IMEI</label><input className="font-mono text-xs" placeholder="356xxxxxxxxxxxxxx" value={newDevice.imei} onChange={e=>setNewDevice({...newDevice,imei:e.target.value})} /></div>
            {[
              {label:'Condizione', key:'condizione', opts:[['A','A - Ottima'],['B','B - Buona'],['C','C - Discreta']]},
              {label:'Stato', key:'stato', opts:[['in_stock','In stock'],['da_testare','Da testare'],['in_riparazione','In riparazione'],['venduto','Venduto']]},
              {label:'Provenienza', key:'provenienza', opts:[['fornitore','Fornitore'],['privato','Privato']]},
            ].map(f=>(
              <div key={f.key} className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">{f.label}</label>
                <select value={newDevice[f.key]} onChange={e=>setNewDevice({...newDevice,[f.key]:e.target.value})}>
                  {f.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
            <div className="flex flex-col gap-1"><label className="text-xs text-gray-400">Prezzo acquisto</label><input type="number" value={newDevice.prezzo_acq} onChange={e=>setNewDevice({...newDevice,prezzo_acq:+e.target.value})} /></div>
            <div className="flex flex-col gap-1"><label className="text-xs text-gray-400">Prezzo vendita</label><input type="number" value={newDevice.prezzo_vend} onChange={e=>setNewDevice({...newDevice,prezzo_vend:+e.target.value})} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-white/5">
            <button onClick={()=>setModals({...modals,device:false})} className="bg-white/5 text-gray-300 text-sm px-4 py-2 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">Annulla</button>
            <button onClick={addDevice} className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">Salva</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <span className="text-base font-semibold">{title}</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 text-lg transition-colors">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
