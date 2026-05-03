// Riparazioni.jsx - Design Figma

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ClienteSelector from '../components/ClienteSelector'

const PRIOR = { normale:'rgba(100,116,139,0.15)|#94a3b8', alta:'rgba(234,179,8,0.15)|#facc15', urgente:'rgba(239,68,68,0.15)|#f87171' }

export default function Riparazioni({ api, showToast, autoAction, onAutoActionDone }) {
  const [repairs, setRepairs] = useState([])
  const [filter, setFilter] = useState('aperta')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ cliente:'', tel:'', brand:'Apple', modello:'', problema:'', priorita:'normale', costo:0, data_stimata:'', note:'', ora_inizio:'', durata_minuti:60 })

  const autoActionHandled = useRef(false)
  useEffect(() => {
    if (autoAction === 'nuova_riparazione' && !autoActionHandled.current) {
      autoActionHandled.current = true
      setModal(true)
      onAutoActionDone?.()
    }
  }, [autoAction])

  useEffect(() => { fetchRepairs() }, [])

  const fetchRepairs = async () => {
    try { const { data } = await axios.get(`${api}/repairs`); setRepairs(data.data||[]) }
    catch { setRepairs(JSON.parse(localStorage.getItem('mag_rep')||'[]')) }
  }

  const add = async () => {
    if (!form.cliente||!form.modello) { showToast('Cliente e modello obbligatori','error'); return }
    const nr = {...form, id:Date.now().toString(), stato:'aperta', progress:0, at:new Date().toISOString()}
    try { const {data} = await axios.post(`${api}/repairs`, form); setRepairs(p=>[data,...p]) }
    catch { setRepairs(p=>[nr,...p]) }
    setModal(false)
    setForm({ cliente:'', tel:'', brand:'Apple', modello:'', problema:'', priorita:'normale', costo:0, data_stimata:'', note:'' })
    showToast('â Riparazione creata')
  }

  const upd = (id, v) => {
    setRepairs(p => p.map(r => r.id===id ? {...r, progress:v} : r))
    try { axios.put(`${api}/repairs/${id}/progress`, {progress:v}) } catch {}
  }

  const complete = async (id) => {
    setRepairs(p => p.map(r => r.id===id ? {...r, stato:'completata', progress:100} : r))
    try { await axios.put(`${api}/repairs/${id}/complete`) } catch {}
    showToast('â Completata')
  }

  const del = async (id) => {
    setRepairs(p => p.filter(r => r.id!==id))
    try { await axios.delete(`${api}/repairs/${id}`) } catch {}
    showToast('Eliminata')
  }

  const filtered = repairs.filter(r => filter==='all' ? true : r.stato===filter)

  const priorStyle = (p) => {
    const [bg,color] = (PRIOR[p]||PRIOR.normale).split('|')
    return { background:bg, color }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, marginBottom:3 }}>Riparazioni</div>
          <div style={{ fontSize:13, color:'#64748b' }}>Gestisci i lavori in corso</div>
        </div>
        <button onClick={()=>setModal(true)} className="btn-blue">+ Nuova riparazione</button>
      </div>

      <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:3, width:'fit-content', marginBottom:20 }}>
        {[['aperta','In corso'],['completata','Completate'],['all','Tutte']].map(([v,l]) => (
          <button key={v} onClick={()=>setFilter(v)} style={{
            padding:'7px 18px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', border:'none', fontFamily:'Inter,sans-serif',
            background: filter===v ? '#1e3a6e' : 'transparent',
            color: filter===v ? '#60a5fa' : '#64748b',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:14 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px 0', color:'#475569' }}>
            <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>â</div>
            <div style={{ fontSize:14, color:'#64748b' }}>Nessuna riparazione {filter==='aperta'?'aperta':'trovata'}</div>
          </div>
        ) : filtered.map(r => (
          <div key={r.id} style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:14, marginBottom:3 }}>{r.cliente}</div>
                <div style={{ fontSize:12, color:'#64748b' }}>{r.brand} {r.modello}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5, alignItems:'flex-end' }}>
                <span style={{ ...priorStyle(r.priorita), padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:500 }}>{r.priorita}</span>
                <span style={{ background: r.stato==='aperta'?'rgba(37,99,235,0.15)':'rgba(22,163,74,0.15)', color: r.stato==='aperta'?'#60a5fa':'#4ade80', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:500 }}>{r.stato}</span>
              </div>
            </div>
            {r.problema && (
              <div style={{ fontSize:12, color:'#64748b', borderLeft:'2px solid rgba(255,255,255,0.1)', paddingLeft:10, marginBottom:12, lineHeight:1.5 }}>{r.problema}</div>
            )}
            {r.stato==='aperta' && (
              <div style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#475569', marginBottom:6 }}>
                  <span>Progresso</span><span>{r.progress||0}%</span>
                </div>
                <input type="range" min="0" max="100" value={r.progress||0}
                  onChange={e=>upd(r.id,+e.target.value)}
                  style={{ width:'100%', accentColor:'#2563eb' }} />
                <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden', marginTop:4 }}>
                  <div style={{ width:`${r.progress||0}%`, height:'100%', background:'#2563eb', borderRadius:4 }} />
                </div>
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#475569', marginBottom:12 }}>
              <span>{r.data_stimata||r.tel||''}</span>
              <span style={{ fontFamily:'monospace', fontWeight:600 }}>â¬{r.costo}</span>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {r.stato==='aperta' && (
                <button onClick={()=>complete(r.id)} style={{ flex:1, background:'rgba(22,163,74,0.15)', border:'1px solid rgba(22,163,74,0.25)', color:'#4ade80', borderRadius:8, padding:'7px 0', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>â Completata</button>
              )}
              <button onClick={()=>del(r.id)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#f87171', borderRadius:8, padding:'7px 12px', fontSize:12, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Elimina</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#0d1529', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:24, width:'100%', maxWidth:500, maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <span style={{ fontSize:16, fontWeight:700 }}>Nuova riparazione</span>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'none', color:'#475569', fontSize:18, cursor:'pointer' }}>â</button>
            </div>

            {/* Cliente con selettore archivio */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11.5, color:'#64748b', display:'block', marginBottom:6 }}>Cliente</label>
              <ClienteSelector
                api={api}
                value={form.cliente}
                onChange={val => setForm(p => ({ ...p, cliente: val }))}
                onTelChange={tel => setForm(p => ({ ...p, tel }))}
              />
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11.5, color:'#64748b', display:'block', marginBottom:6 }}>Telefono</label>
              <input placeholder="+39 333..." value={form.tel} onChange={e=>setForm({...form,tel:e.target.value})}
                style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#e2e8f0', width:'100%', boxSizing:'border-box', fontFamily:'Inter,sans-serif', fontSize:13 }} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11.5, color:'#64748b' }}>Brand</label>
                <select value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#e2e8f0', fontFamily:'Inter,sans-serif' }}>
                  {['Apple','Samsung','Google','Xiaomi','OnePlus','Huawei'].map(b=><option key={b}>{b}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11.5, color:'#64748b' }}>Modello</label>
                <input placeholder="iPhone 14" value={form.modello} onChange={e=>setForm({...form,modello:e.target.value})}
                  style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#e2e8f0', fontFamily:'Inter,sans-serif', fontSize:13 }} />
              </div>
              <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11.5, color:'#64748b' }}>Problema</label>
                <textarea placeholder="Schermo rotto, non si accende..." value={form.problema} onChange={e=>setForm({...form,problema:e.target.value})}
                  style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#e2e8f0', minHeight:70, resize:'vertical', fontFamily:'Inter,sans-serif', fontSize:13 }} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11.5, color:'#64748b' }}>PrioritÃ </label>
                <select value={form.priorita} onChange={e=>setForm({...form,priorita:e.target.value})} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#e2e8f0', fontFamily:'Inter,sans-serif' }}>
                  <option value="normale">Normale</option><option value="alta">Alta</option><option value="urgente">Urgente</option>
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11.5, color:'#64748b' }}>Costo â¬</label>
                <input type="number" value={form.costo} onChange={e=>setForm({...form,costo:+e.target.value})}
                  style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#e2e8f0', fontFamily:'Inter,sans-serif', fontSize:13 }} />
              </div>
              <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11.5, color:'#64748b' }}>Data consegna stimata</label>
                <input type="date" value={form.data_stimata} onChange={e=>setForm({...form,data_stimata:e.target.value})}
                  style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#e2e8f0', fontFamily:'Inter,sans-serif', fontSize:13, width:'100%' }} />
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={()=>setModal(false)} className="btn-outline">Annulla</button>
              <button onClick={add} className="btn-blue">Crea riparazione</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// Riparazioni.jsx - Design Figma

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ClienteSelector from '../components/ClienteSelector'

const PRIOR = { normale:'rgba(100,116,139,0.15)|#94a3b8', alta:'rgba(234,179,8,0.15)|#facc15', urgente:'rgba(239,68,68,0.15)|#f87171' }

export default function Riparazioni({ api, showToast, autoAction, onAutoActionDone }) {
  const [repairs, setRepairs] = useState([])
  const [filter, setFilter] = useState('aperta')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ cliente:'', tel:'', brand:'Apple', modello:'', problema:'', priorita:'normale', costo:0, data_stimata:'', note:'' })

  const autoActionHandled = useRef(false)
  useEffect(() => {
    if (autoAction === 'nuova_riparazione' && !autoActionHandled.current) {
      autoActionHandled.current = true
      setModal(true)
      onAutoActionDone?.()
    }
  }, [autoAction])

  useEffect(() => { fetchRepairs() }, [])

  const fetchRepairs = async () => {
    try { const { data } = await axios.get(`${api}/repairs`); setRepairs(data.data||[]) }
    catch { setRepairs(JSON.parse(localStorage.getItem('mag_rep')||'[]')) }
  }

  const add = async () => {
    if (!form.cliente||!form.modello) { showToast('Cliente e modello obbligatori','error'); return }
    const nr = {...form, id:Date.now().toString(), stato:'aperta', progress:0, at:new Date().toISOString()}
    try { const {data} = await axios.post(`${api}/repairs`, form); setRepairs(p=>[data,...p]) }
    catch { setRepairs(p=>[nr,...p]) }
    setModal(false)
    setForm({ cliente:'', tel:'', brand:'Apple', modello:'', problema:'', priorita:'normale', costo:0, data_stimata:'', note:'' })
    showToast('✓ Riparazione creata')
  }

  const upd = (id, v) => {
    setRepairs(p => p.map(r => r.id===id ? {...r, progress:v} : r))
    try { axios.put(`${api}/repairs/${id}/progress`, {progress:v}) } catch {}
  }

  const complete = async (id) => {
    setRepairs(p => p.map(r => r.id===id ? {...r, stato:'completata', progress:100} : r))
    try { await axios.put(`${api}/repairs/${id}/complete`) } catch {}
    showToast('✓ Completata')
  }

  const del = async (id) => {
    setRepairs(p => p.filter(r => r.id!==id))
    try { await axios.delete(`${api}/repairs/${id}`) } catch {}
    showToast('Eliminata')
  }

  const filtered = repairs.filter(r => filter==='all' ? true : r.stato===filter)

  const priorStyle = (p) => {
    const [bg,color] = (PRIOR[p]||PRIOR.normale).split('|')
    return { background:bg, color }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, marginBottom:3 }}>Riparazioni</div>
          <div style={{ fontSize:13, color:'#64748b' }}>Gestisci i lavori in corso</div>
        </div>
        <button onClick={()=>setModal(true)} className="btn-blue">+ Nuova riparazione</button>
      </div>

      <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:3, width:'fit-content', marginBottom:20 }}>
        {[['aperta','In corso'],['completata','Completate'],['all','Tutte']].map(([v,l]) => (
          <button key={v} onClick={()=>setFilter(v)} style={{
            padding:'7px 18px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', border:'none', fontFamily:'Inter,sans-serif',
            background: filter===v ? '#1e3a6e' : 'transparent',
            color: filter===v ? '#60a5fa' : '#64748b',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:14 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px 0', color:'#475569' }}>
            <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>⚙</div>
            <div style={{ fontSize:14, color:'#64748b' }}>Nessuna riparazione {filter==='aperta'?'aperta':'trovata'}</div>
          </div>
        ) : filtered.map(r => (
          <div key={r.id} style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:14, marginBottom:3 }}>{r.cliente}</div>
                <div style={{ fontSize:12, color:'#64748b' }}>{r.brand} {r.modello}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5, alignItems:'flex-end' }}>
                <span style={{ ...priorStyle(r.priorita), padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:500 }}>{r.priorita}</span>
                <span style={{ background: r.stato==='aperta'?'rgba(37,99,235,0.15)':'rgba(22,163,74,0.15)', color: r.stato==='aperta'?'#60a5fa':'#4ade80', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:500 }}>{r.stato}</span>
              </div>
            </div>
            {r.problema && (
              <div style={{ fontSize:12, color:'#64748b', borderLeft:'2px solid rgba(255,255,255,0.1)', paddingLeft:10, marginBottom:12, lineHeight:1.5 }}>{r.problema}</div>
            )}
            {r.stato==='aperta' && (
              <div style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#475569', marginBottom:6 }}>
                  <span>Progresso</span><span>{r.progress||0}%</span>
                </div>
                <input type="range" min="0" max="100" value={r.progress||0}
                  onChange={e=>upd(r.id,+e.target.value)}
                  style={{ width:'100%', accentColor:'#2563eb' }} />
                <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden', marginTop:4 }}>
                  <div style={{ width:`${r.progress||0}%`, height:'100%', background:'#2563eb', borderRadius:4 }} />
                </div>
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#475569', marginBottom:12 }}>
              <span>{r.data_stimata||r.tel||''}</span>
              <span style={{ fontFamily:'monospace', fontWeight:600 }}>€{r.costo}</span>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {r.stato==='aperta' && (
                <button onClick={()=>complete(r.id)} style={{ flex:1, background:'rgba(22,163,74,0.15)', border:'1px solid rgba(22,163,74,0.25)', color:'#4ade80', borderRadius:8, padding:'7px 0', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>✓ Completata</button>
              )}
              <button onClick={()=>del(r.id)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#f87171', borderRadius:8, padding:'7px 12px', fontSize:12, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Elimina</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#0d1529', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:24, width:'100%', maxWidth:500, maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <span style={{ fontSize:16, fontWeight:700 }}>Nuova riparazione</span>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'none', color:'#475569', fontSize:18, cursor:'pointer' }}>✕</button>
            </div>

            {/* Cliente con selettore archivio */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11.5, color:'#64748b', display:'block', marginBottom:6 }}>Cliente</label>
              <ClienteSelector
                api={api}
                value={form.cliente}
                onChange={val => setForm(p => ({ ...p, cliente: val }))}
                onTelChange={tel => setForm(p => ({ ...p, tel }))}
              />
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11.5, color:'#64748b', display:'block', marginBottom:6 }}>Telefono</label>
              <input placeholder="+39 333..." value={form.tel} onChange={e=>setForm({...form,tel:e.target.value})}
                style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#e2e8f0', width:'100%', boxSizing:'border-box', fontFamily:'Inter,sans-serif', fontSize:13 }} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11.5, color:'#64748b' }}>Brand</label>
                <select value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#e2e8f0', fontFamily:'Inter,sans-serif' }}>
                  {['Apple','Samsung','Google','Xiaomi','OnePlus','Huawei'].map(b=><option key={b}>{b}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11.5, color:'#64748b' }}>Modello</label>
                <input placeholder="iPhone 14" value={form.modello} onChange={e=>setForm({...form,modello:e.target.value})}
                  style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#e2e8f0', fontFamily:'Inter,sans-serif', fontSize:13 }} />
              </div>
              <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11.5, color:'#64748b' }}>Problema</label>
                <textarea placeholder="Schermo rotto, non si accende..." value={form.problema} onChange={e=>setForm({...form,problema:e.target.value})}
                  style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#e2e8f0', minHeight:70, resize:'vertical', fontFamily:'Inter,sans-serif', fontSize:13 }} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11.5, color:'#64748b' }}>Priorità</label>
                <select value={form.priorita} onChange={e=>setForm({...form,priorita:e.target.value})} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#e2e8f0', fontFamily:'Inter,sans-serif' }}>
                  <option value="normale">Normale</option><option value="alta">Alta</option><option value="urgente">Urgente</option>
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11.5, color:'#64748b' }}>Costo €</label>
                <input type="number" value={form.costo} onChange={e=>setForm({...form,costo:+e.target.value})}
                  style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#e2e8f0', fontFamily:'Inter,sans-serif', fontSize:13 }} />
              </div>
              <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11.5, color:'#64748b' }}>Data consegna stimata</label>
                <input type="date" value={form.data_stimata} onChange={e=>setForm({...form,data_stimata:e.target.value})}
                  style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#e2e8f0', fontFamily:'Inter,sans-serif', fontSize:13, width:'100%' }} />
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={()=>setModal(false)} className="btn-outline">Annulla</button>
              <button onClick={add} className="btn-blue">Crea riparazione</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
