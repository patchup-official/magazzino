// Magazzino.jsx - Design Figma

import { useState, useEffect } from 'react'
import axios from 'axios'

const S = {
  card: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  td: { padding: '11px 14px', fontSize: 13, color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  badge: (color) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, ...color }),
}

const STATO_STYLE = {
  in_stock:       { background: 'rgba(22,163,74,0.15)',  color: '#4ade80' },
  venduto:        { background: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
  in_riparazione: { background: 'rgba(37,99,235,0.15)',  color: '#60a5fa' },
  da_testare:     { background: 'rgba(124,58,237,0.15)', color: '#c084fc' },
}
const STATO_LABEL = { in_stock:'In stock', venduto:'Venduto', in_riparazione:'In riparazione', da_testare:'Da testare' }
const COND_STYLE  = { A: { background:'rgba(22,163,74,0.15)',color:'#4ade80'}, B:{background:'rgba(234,179,8,0.15)',color:'#facc15'}, C:{background:'rgba(239,68,68,0.15)',color:'#f87171'} }

export default function Magazzino({ api, showToast }) {
  const [tab, setTab] = useState('prodotti')
  const [products, setProducts] = useState([])
  const [devices, setDevices] = useState([])
  const [filters, setFilters] = useState({ brand: '', stato: '', cond: '' })
  const [modal, setModal] = useState(null)
  const [np, setNp] = useState({ nome:'', categoria:'Cover', qty:0, prezzo_acq:0, prezzo_vend:0 })
  const [nd, setNd] = useState({ brand:'Apple', modello:'', storage:'128GB', colore:'', imei:'', condizione:'B', stato:'in_stock', provenienza:'fornitore', prezzo_acq:0, prezzo_vend:0 })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [p, d] = await Promise.all([axios.get(`${api}/products`), axios.get(`${api}/devices`)])
      setProducts(p.data.data || [])
      setDevices(d.data.data || [])
    } catch { }
  }

  const addProduct = async () => {
    if (!np.nome) { showToast('Inserisci il nome', 'error'); return }
    try { const { data } = await axios.post(`${api}/products`, np); setProducts(prev => [data, ...prev]) }
    catch { setProducts(prev => [{ ...np, id: Date.now().toString() }, ...prev]) }
    setModal(null); setNp({ nome:'', categoria:'Cover', qty:0, prezzo_acq:0, prezzo_vend:0 })
    showToast('✓ Prodotto aggiunto')
  }

  const addDevice = async () => {
    if (!nd.modello) { showToast('Inserisci il modello', 'error'); return }
    try { const { data } = await axios.post(`${api}/devices`, nd); setDevices(prev => [data, ...prev]) }
    catch { setDevices(prev => [{ ...nd, id: Date.now().toString() }, ...prev]) }
    setModal(null); setNd({ brand:'Apple', modello:'', storage:'128GB', colore:'', imei:'', condizione:'B', stato:'in_stock', provenienza:'fornitore', prezzo_acq:0, prezzo_vend:0 })
    showToast('✓ Dispositivo aggiunto')
  }

  const delProduct = async (id) => {
    setProducts(prev => prev.filter(p => p.id !== id))
    try { await axios.delete(`${api}/products/${id}`) } catch {}
    showToast('Eliminato')
  }

  const delDevice = async (id) => {
    setDevices(prev => prev.filter(d => d.id !== id))
    try { await axios.delete(`${api}/devices/${id}`) } catch {}
    showToast('Eliminato')
  }

  const updStato = async (id, stato) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, stato } : d))
    try { await axios.put(`${api}/devices/${id}`, { ...devices.find(d=>d.id===id), stato }) } catch {}
    showToast('Stato aggiornato')
  }

  const filtered = devices.filter(d => {
    if (filters.brand && d.brand !== filters.brand) return false
    if (filters.stato && d.stato !== filters.stato) return false
    if (filters.cond && d.condizione !== filters.cond) return false
    return true
  })

  const Sel = ({ style, value, onChange, children }) => (
    <select value={value} onChange={onChange} style={{ ...style, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'7px 10px', color:'#e2e8f0', fontSize:13 }}>
      {children}
    </select>
  )

  return (
    <div className="animate-fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, marginBottom:3 }}>Magazzino</div>
          <div style={{ fontSize:13, color:'#64748b' }}>Gestisci prodotti e dispositivi</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:3, width:'fit-content', marginBottom:20 }}>
        {[['prodotti','Prodotti'],['dispositivi','Dispositivi']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)} style={{
            padding:'7px 20px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', border:'none', fontFamily:'Inter,sans-serif',
            background: tab===v ? '#1e3a6e' : 'transparent',
            color: tab===v ? '#60a5fa' : '#64748b',
            transition:'all 0.15s',
          }}>{l}</button>
        ))}
      </div>

      {/* TAB PRODOTTI */}
      {tab === 'prodotti' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span style={{ fontSize:13, color:'#64748b' }}>{products.length} prodotti</span>
            <button onClick={() => setModal('product')} className="btn-blue">+ Aggiungi prodotto</button>
          </div>
          <div style={S.card}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead><tr>{['Nome','Categoria','Acquisto','Vendita','Qtà','Margine',''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {products.length === 0
                  ? <tr><td colSpan="7" style={{ textAlign:'center', padding:'40px 0', color:'#475569' }}>📦 Nessun prodotto</td></tr>
                  : products.map(p => {
                    const m = p.prezzo_vend && p.prezzo_acq ? Math.round(((p.prezzo_vend-p.prezzo_acq)/p.prezzo_acq)*100) : null
                    return <tr key={p.id} style={{ transition:'background 0.1s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td style={{ ...S.td, color:'#e2e8f0', fontWeight:500 }}>{p.nome}</td>
                      <td style={S.td}><span style={S.badge({ background:'rgba(37,99,235,0.15)', color:'#60a5fa' })}>{p.categoria}</span></td>
                      <td style={S.td}>€{p.prezzo_acq}</td>
                      <td style={S.td}>€{p.prezzo_vend}</td>
                      <td style={S.td}>{p.qty}</td>
                      <td style={S.td}>{m!==null ? <span style={S.badge(m>0?{background:'rgba(22,163,74,0.15)',color:'#4ade80'}:{background:'rgba(239,68,68,0.15)',color:'#f87171'})}>{m}%</span> : '-'}</td>
                      <td style={S.td}><button onClick={()=>delProduct(p.id)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#f87171', borderRadius:6, padding:'4px 10px', fontSize:11, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Elimina</button></td>
                    </tr>
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB DISPOSITIVI */}
      {tab === 'dispositivi' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ display:'flex', gap:8 }}>
              <Sel value={filters.brand} onChange={e=>setFilters({...filters,brand:e.target.value})} style={{ width:140 }}>
                <option value="">Tutti i brand</option>
                {['Apple','Samsung','Google','Xiaomi','OnePlus','Huawei'].map(b=><option key={b}>{b}</option>)}
              </Sel>
              <Sel value={filters.stato} onChange={e=>setFilters({...filters,stato:e.target.value})} style={{ width:150 }}>
                <option value="">Tutti gli stati</option>
                {Object.entries(STATO_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </Sel>
              <Sel value={filters.cond} onChange={e=>setFilters({...filters,cond:e.target.value})} style={{ width:130 }}>
                <option value="">Tutte le cond.</option>
                {['A','B','C'].map(c=><option key={c} value={c}>{c}</option>)}
              </Sel>
            </div>
            <button onClick={() => setModal('device')} className="btn-blue">+ Aggiungi dispositivo</button>
          </div>
          <div style={S.card}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead><tr>{['Dispositivo','Storage','Colore','IMEI','Cond.','Stato','Prov.','Acq.','Vend.',''].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan="10" style={{ textAlign:'center', padding:'40px 0', color:'#475569' }}>📱 Nessun dispositivo</td></tr>
                  : filtered.map(d => (
                    <tr key={d.id} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td style={{ ...S.td, color:'#e2e8f0', fontWeight:500 }}><span style={{ fontSize:10, color:'#475569', display:'block' }}>{d.brand}</span>{d.modello}</td>
                      <td style={{ ...S.td, fontFamily:'monospace', fontSize:11 }}>{d.storage||'-'}</td>
                      <td style={S.td}>{d.colore||'-'}</td>
                      <td style={{ ...S.td, fontFamily:'monospace', fontSize:10, color:'#475569' }}>{d.imei?d.imei.slice(0,8)+'…':'-'}</td>
                      <td style={S.td}><span style={S.badge(COND_STYLE[d.condizione]||{})}>{d.condizione}</span></td>
                      <td style={S.td}>
                        <select onChange={e=>updStato(d.id,e.target.value)} value={d.stato}
                          style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'4px 8px', fontSize:11, color:'#e2e8f0', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                          {Object.entries(STATO_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                        </select>
                      </td>
                      <td style={S.td}><span style={S.badge(d.provenienza==='privato'?{background:'rgba(20,184,166,0.15)',color:'#2dd4bf'}:{background:'rgba(37,99,235,0.15)',color:'#60a5fa'})}>{d.provenienza}</span></td>
                      <td style={S.td}>€{d.prezzo_acq}</td>
                      <td style={S.td}>{d.prezzo_vend?`€${d.prezzo_vend}`:'-'}</td>
                      <td style={S.td}><button onClick={()=>delDevice(d.id)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#f87171', borderRadius:6, padding:'4px 8px', fontSize:11, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>✕</button></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PRODOTTO */}
      {modal === 'product' && (
        <Modal title="Aggiungi prodotto" onClose={() => setModal(null)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
            <Field label="Nome" full><input placeholder="Cover iPhone 15" value={np.nome} onChange={e=>setNp({...np,nome:e.target.value})} /></Field>
            <Field label="Categoria"><Sel value={np.categoria} onChange={e=>setNp({...np,categoria:e.target.value})}>{['Cover','Caricabatterie','Cavo','Auricolari','Vetro temperato','Accessori','Ricambi'].map(c=><option key={c}>{c}</option>)}</Sel></Field>
            <Field label="Quantità"><input type="number" value={np.qty} onChange={e=>setNp({...np,qty:+e.target.value})} /></Field>
            <Field label="Prezzo acquisto €"><input type="number" step="0.01" value={np.prezzo_acq} onChange={e=>setNp({...np,prezzo_acq:+e.target.value})} /></Field>
            <Field label="Prezzo vendita €"><input type="number" step="0.01" value={np.prezzo_vend} onChange={e=>setNp({...np,prezzo_vend:+e.target.value})} /></Field>
          </div>
          <ModalFooter onCancel={() => setModal(null)} onConfirm={addProduct} label="Salva prodotto" />
        </Modal>
      )}

      {/* MODAL DISPOSITIVO */}
      {modal === 'device' && (
        <Modal title="Aggiungi dispositivo" onClose={() => setModal(null)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
            <Field label="Brand"><Sel value={nd.brand} onChange={e=>setNd({...nd,brand:e.target.value})}>{['Apple','Samsung','Google','Xiaomi','OnePlus','Huawei'].map(b=><option key={b}>{b}</option>)}</Sel></Field>
            <Field label="Modello"><input placeholder="iPhone 15 Pro" value={nd.modello} onChange={e=>setNd({...nd,modello:e.target.value})} /></Field>
            <Field label="Storage"><Sel value={nd.storage} onChange={e=>setNd({...nd,storage:e.target.value})}>{['64GB','128GB','256GB','512GB','1TB'].map(v=><option key={v}>{v}</option>)}</Sel></Field>
            <Field label="Colore"><input placeholder="Nero" value={nd.colore} onChange={e=>setNd({...nd,colore:e.target.value})} /></Field>
            <Field label="IMEI" full><input placeholder="356xxxxxxxxxxxxxx" value={nd.imei} onChange={e=>setNd({...nd,imei:e.target.value})} style={{ fontFamily:'monospace', fontSize:12 }} /></Field>
            <Field label="Condizione"><Sel value={nd.condizione} onChange={e=>setNd({...nd,condizione:e.target.value})}><option value="A">A - Ottima</option><option value="B">B - Buona</option><option value="C">C - Discreta</option></Sel></Field>
            <Field label="Stato"><Sel value={nd.stato} onChange={e=>setNd({...nd,stato:e.target.value})}>{Object.entries(STATO_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}</Sel></Field>
            <Field label="Provenienza"><Sel value={nd.provenienza} onChange={e=>setNd({...nd,provenienza:e.target.value})}><option value="fornitore">Fornitore</option><option value="privato">Privato</option></Sel></Field>
            <Field label="Prezzo acquisto €"><input type="number" value={nd.prezzo_acq} onChange={e=>setNd({...nd,prezzo_acq:+e.target.value})} /></Field>
            <Field label="Prezzo vendita €"><input type="number" value={nd.prezzo_vend} onChange={e=>setNd({...nd,prezzo_vend:+e.target.value})} /></Field>
          </div>
          <ModalFooter onCancel={() => setModal(null)} onConfirm={addDevice} label="Salva dispositivo" />
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#0d1529', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:24, width:'100%', maxWidth:520, maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <span style={{ fontSize:16, fontWeight:700 }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569', fontSize:18, cursor:'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? '1/-1' : undefined, display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:11.5, fontWeight:500, color:'#64748b' }}>{label}</label>
      {children}
    </div>
  )
}

function ModalFooter({ onCancel, onConfirm, label }) {
  return (
    <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
      <button onClick={onCancel} className="btn-outline">Annulla</button>
      <button onClick={onConfirm} className="btn-blue">{label}</button>
    </div>
  )
}
