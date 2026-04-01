// Magazzino.jsx v2 — Prodotti | Dispositivi | Ricambi

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

// ── Stili base ────────────────────────────────
const S = {
  card: { background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden' },
  inp:  { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, padding:'9px 12px', color:'white', fontFamily:'Inter,sans-serif', fontSize:13.5, width:'100%' },
  sel:  { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, padding:'9px 12px', color:'white', fontFamily:'Inter,sans-serif', fontSize:13.5, width:'100%' },
  th:   { padding:'9px 14px', textAlign:'left', fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  td:   { padding:'11px 14px', fontSize:13, color:'rgba(255,255,255,0.7)', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  lbl:  { fontSize:10.5, fontWeight:600, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:5 },
}

const Badge = ({ label, color='gray' }) => {
  const colors = {
    green:  { bg:'rgba(34,197,94,0.12)',   color:'#4ade80' },
    red:    { bg:'rgba(239,68,68,0.12)',    color:'#f87171' },
    blue:   { bg:'rgba(59,130,246,0.12)',   color:'#60a5fa' },
    amber:  { bg:'rgba(245,158,11,0.12)',   color:'#fbbf24' },
    violet: { bg:'rgba(124,58,237,0.15)',   color:'#c4b5fd' },
    teal:   { bg:'rgba(20,184,166,0.12)',   color:'#2dd4bf' },
    gray:   { bg:'rgba(255,255,255,0.07)',  color:'rgba(255,255,255,0.5)' },
  }
  const c = colors[color]||colors.gray
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:500, background:c.bg, color:c.color }}>{label}</span>
}

const PrimaryBtn = ({onClick,children,small}) => (
  <button onClick={onClick} style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', borderRadius:9, padding:small?'6px 14px':'9px 18px', fontSize:small?12:13.5, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 3px 10px rgba(109,40,217,0.3)' }}>{children}</button>
)

const GhostBtn = ({onClick,children,small,danger}) => (
  <button onClick={onClick} style={{ background:danger?'rgba(239,68,68,0.1)':'rgba(255,255,255,0.05)', color:danger?'#f87171':'rgba(255,255,255,0.5)', border:danger?'1px solid rgba(239,68,68,0.2)':'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:small?'5px 11px':'8px 16px', fontSize:small?11.5:13, fontWeight:500, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>{children}</button>
)

// Modal generico
const Modal = ({title, onClose, children, wide}) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
    <div style={{ background:'#0d1529', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'24px 28px', width:'100%', maxWidth:wide?680:520, maxHeight:'88vh', overflowY:'auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
        <span style={{ fontSize:16, fontWeight:700 }}>{title}</span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:20, cursor:'pointer' }}>✕</button>
      </div>
      {children}
    </div>
  </div>
)

const ModalFooter = ({onCancel, onConfirm, label}) => (
  <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
    <GhostBtn onClick={onCancel}>Annulla</GhostBtn>
    <PrimaryBtn onClick={onConfirm}>{label}</PrimaryBtn>
  </div>
)

const Grid = ({cols=2, children, gap=13}) => (
  <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap, marginBottom:16 }}>{children}</div>
)

const Field = ({label, full, children}) => (
  <div style={{ gridColumn:full?'1/-1':undefined, display:'flex', flexDirection:'column', gap:5 }}>
    <label style={S.lbl}>{label}</label>
    {children}
  </div>
)

// ── Tipi intervento ───────────────────────────
const TIPI_INTERVENTO = [
  { val:'sostituzione_batteria', label:'🔋 Sostituzione batteria' },
  { val:'sostituzione_schermo',  label:'📱 Sostituzione schermo' },
  { val:'sostituzione_scocca',   label:'🔧 Sostituzione scocca' },
  { val:'pulizia',               label:'🧹 Pulizia e sanificazione' },
  { val:'aggiornamento_sw',      label:'💻 Aggiornamento software' },
  { val:'rigenerazione',         label:'♻️ Rigenerazione completa' },
  { val:'altro',                 label:'📝 Altro' },
]

const STATO_DEVICE = { in_stock:'In stock', venduto:'Venduto', in_riparazione:'In riparazione', da_testare:'Da testare' }
const COND_COLOR   = { A:'green', B:'amber', C:'red' }
const STATO_COLOR  = { in_stock:'green', venduto:'gray', in_riparazione:'blue', da_testare:'violet' }

// ══════════════════════════════════════════════
// TAB PRODOTTI
// ══════════════════════════════════════════════
function TabProdotti({ api, showToast }) {
  const [products, setProducts] = useState([])
  const [fornitori, setFornitori] = useState([])
  const [modal, setModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ nome:'', categoria:'Cover', qty:0, prezzo_acq:0, prezzo_vend:0, barcode:'', fornitore_id:'', note:'' })
  const [search, setSearch] = useState('')
  const [showFornitori, setShowFornitori] = useState(false)
  const [fForm, setFForm] = useState({ nome:'', contatto:'', email:'', telefono:'', piva:'', indirizzo:'', note:'' })
  const [editingF, setEditingF] = useState(null)
  const barcodeRef = useRef(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [p, f] = await Promise.all([axios.get(`${api}/products`), axios.get(`${api}/fornitori`)])
      setProducts(p.data.data||[])
      setFornitori(f.data.data||[])
    } catch {}
  }

  const openAdd = () => { setEditing(null); setForm({ nome:'', categoria:'Cover', qty:0, prezzo_acq:0, prezzo_vend:0, barcode:'', fornitore_id:'', note:'' }); setModal('product') }
  const openEdit = (p) => { setEditing(p.id); setForm({ nome:p.nome, categoria:p.categoria, qty:p.qty, prezzo_acq:p.prezzo_acq||p.prezzo_acq, prezzo_vend:p.prezzo_vend||p.prezzo_vend, barcode:p.barcode||'', fornitore_id:p.fornitore_id||'', note:p.note||'' }); setModal('product') }

  const save = async () => {
    if (!form.nome) { showToast('Nome obbligatorio','error'); return }
    try {
      if (editing) {
        const {data} = await axios.put(`${api}/products/${editing}`, form)
        setProducts(prev => prev.map(p => p.id===editing?data:p))
        showToast('✓ Prodotto aggiornato')
      } else {
        const {data} = await axios.post(`${api}/products`, form)
        setProducts(prev => [data,...prev])
        showToast('✓ Prodotto aggiunto')
      }
    } catch {
      const mock = {...form, id:Date.now().toString()}
      setProducts(prev => editing ? prev.map(p=>p.id===editing?{...p,...form}:p) : [mock,...prev])
      showToast(editing?'✓ Aggiornato':'✓ Aggiunto')
    }
    setModal(null)
  }

  const del = async (id) => {
    setProducts(prev => prev.filter(p => p.id!==id))
    try { await axios.delete(`${api}/products/${id}`) } catch {}
    showToast('Eliminato')
  }

  const saveFornitore = async () => {
    if (!fForm.nome) { showToast('Nome fornitore obbligatorio','error'); return }
    try {
      if (editingF) {
        const {data} = await axios.put(`${api}/fornitori/${editingF}`, fForm)
        setFornitori(prev => prev.map(f => f.id===editingF?data:f))
      } else {
        const {data} = await axios.post(`${api}/fornitori`, fForm)
        setFornitori(prev => [...prev,data])
      }
    } catch {
      setFornitori(prev => editingF?prev.map(f=>f.id===editingF?{...f,...fForm}:f):[...prev,{...fForm,id:Date.now().toString()}])
    }
    setEditingF(null); setFForm({nome:'',contatto:'',email:'',telefono:'',piva:'',indirizzo:'',note:''}); setModal(null)
    showToast('✓ Fornitore salvato')
  }

  const delFornitore = async (id) => {
    setFornitori(prev => prev.filter(f => f.id!==id))
    try { await axios.delete(`${api}/fornitori/${id}`) } catch {}
    showToast('Fornitore eliminato')
  }

  // Barcode scanner — input nascosto che riceve lo scan
  const handleBarcodeInput = (e) => {
    const val = e.target.value
    if (val.length > 4) {
      const found = products.find(p => p.barcode === val)
      if (found) showToast(`📦 ${found.nome} · €${found.prezzo_vend}`)
      else showToast(`Barcode ${val} non trovato in magazzino`,'error')
      e.target.value = ''
    }
  }

  const filtered = products.filter(p =>
    !search || p.nome?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search) || p.categoria?.toLowerCase().includes(search.toLowerCase())
  )

  const nomeFornitore = (id) => fornitori.find(f=>f.id===id)?.nome || '—'

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ display:'flex', gap:10, alignItems:'center', flex:1 }}>
          {/* Ricerca / barcode */}
          <div style={{ position:'relative', flex:1, maxWidth:320 }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, opacity:0.4 }}>🔍</span>
            <input
              placeholder="Cerca o scansiona barcode..."
              value={search}
              onChange={e=>setSearch(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'&&e.target.value.length>4){ handleBarcodeInput({target:e.target}); setSearch('') }}}
              style={{...S.inp, paddingLeft:36}}
            />
          </div>
          <GhostBtn small onClick={()=>{ setShowFornitori(!showFornitori) }}>🏭 Fornitori ({fornitori.length})</GhostBtn>
        </div>
        <PrimaryBtn onClick={openAdd}>+ Aggiungi prodotto</PrimaryBtn>
      </div>

      {/* Sezione fornitori (collassabile) */}
      {showFornitori && (
        <div style={{ ...S.card, marginBottom:20, padding:'16px 18px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:600 }}>🏭 Fornitori</div>
            <PrimaryBtn small onClick={()=>{ setEditingF(null); setFForm({nome:'',contatto:'',email:'',telefono:'',piva:'',indirizzo:'',note:''}); setModal('fornitore') }}>+ Aggiungi</PrimaryBtn>
          </div>
          {fornitori.length===0
            ? <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', textAlign:'center', padding:'12px 0' }}>Nessun fornitore ancora</div>
            : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
                {fornitori.map(f=>(
                  <div key={f.id} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ fontWeight:600, fontSize:13.5, marginBottom:3 }}>{f.nome}</div>
                    {f.piva&&<div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:2 }}>P.IVA: {f.piva}</div>}
                    {f.telefono&&<div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>📞 {f.telefono}</div>}
                    <div style={{ display:'flex', gap:6, marginTop:10 }}>
                      <GhostBtn small onClick={()=>{ setEditingF(f.id); setFForm({nome:f.nome,contatto:f.contatto||'',email:f.email||'',telefono:f.telefono||'',piva:f.piva||'',indirizzo:f.indirizzo||'',note:f.note||''}); setModal('fornitore') }}>Modifica</GhostBtn>
                      <GhostBtn small danger onClick={()=>delFornitore(f.id)}>✕</GhostBtn>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* Tabella prodotti */}
      <div style={S.card}>
        <div style={{ padding:'12px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>{filtered.length} prodotti</span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr>
              {['Nome','Categoria','Barcode','Fornitore','Acquisto','Vendita','Qtà','Margine',''].map(h=>(
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan="9" style={{ textAlign:'center', padding:'40px 0', color:'rgba(255,255,255,0.2)' }}>📦 Nessun prodotto</td></tr>
                : filtered.map(p=>{
                    const m = p.prezzo_vend&&p.prezzo_acq ? Math.round(((p.prezzo_vend-p.prezzo_acq)/p.prezzo_acq)*100) : null
                    return (
                      <tr key={p.id} style={{ cursor:'pointer' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <td style={{...S.td,color:'white',fontWeight:500}}>{p.nome}</td>
                        <td style={S.td}><Badge label={p.categoria} color="blue"/></td>
                        <td style={{...S.td,fontFamily:'monospace',fontSize:11,color:'rgba(255,255,255,0.4)'}}>{p.barcode||'—'}</td>
                        <td style={S.td}>{nomeFornitore(p.fornitore_id)}</td>
                        <td style={S.td}>€{(p.prezzo_acq||0).toFixed(2)}</td>
                        <td style={S.td}>€{(p.prezzo_vend||0).toFixed(2)}</td>
                        <td style={S.td}>{p.qty}</td>
                        <td style={S.td}>{m!==null?<Badge label={`${m}%`} color={m>0?'green':'red'}/>:'—'}</td>
                        <td style={{...S.td,whiteSpace:'nowrap'}}>
                          <div style={{ display:'flex', gap:6 }}>
                            <GhostBtn small onClick={()=>openEdit(p)}>✏️</GhostBtn>
                            <GhostBtn small danger onClick={()=>del(p.id)}>✕</GhostBtn>
                          </div>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal prodotto */}
      {modal==='product'&&(
        <Modal title={editing?'Modifica prodotto':'Aggiungi prodotto'} onClose={()=>setModal(null)}>
          <Grid cols={2}>
            <Field label="Nome" full><input placeholder="Cover iPhone 15 Pro" value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} style={S.inp}/></Field>
            <Field label="Categoria">
              <select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})} style={S.sel}>
                {['Cover','Caricabatterie','Cavo','Auricolari','Vetro temperato','Accessori','Prodotto proprio'].map(c=><option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Fornitore">
              <select value={form.fornitore_id} onChange={e=>setForm({...form,fornitore_id:e.target.value})} style={S.sel}>
                <option value="">— Nessun fornitore —</option>
                {fornitori.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </Field>
            <Field label="Quantità"><input type="number" value={form.qty} onChange={e=>setForm({...form,qty:+e.target.value})} style={S.inp}/></Field>
            <Field label="Prezzo acquisto €"><input type="number" step="0.01" value={form.prezzo_acq} onChange={e=>setForm({...form,prezzo_acq:+e.target.value})} style={S.inp}/></Field>
            <Field label="Prezzo vendita €"><input type="number" step="0.01" value={form.prezzo_vend} onChange={e=>setForm({...form,prezzo_vend:+e.target.value})} style={S.inp}/></Field>
            <Field label="Barcode / EAN" full>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:14, opacity:0.4 }}>|||</span>
                <input placeholder="Scansiona o digita EAN..." value={form.barcode} onChange={e=>setForm({...form,barcode:e.target.value})} style={{...S.inp,paddingLeft:32,fontFamily:'monospace'}}/>
              </div>
            </Field>
            <Field label="Note" full><input placeholder="Note interne..." value={form.note} onChange={e=>setForm({...form,note:e.target.value})} style={S.inp}/></Field>
          </Grid>
          <ModalFooter onCancel={()=>setModal(null)} onConfirm={save} label={editing?'Salva modifiche':'Aggiungi prodotto'}/>
        </Modal>
      )}

      {/* Modal fornitore */}
      {modal==='fornitore'&&(
        <Modal title={editingF?'Modifica fornitore':'Nuovo fornitore'} onClose={()=>setModal(null)}>
          <Grid cols={2}>
            <Field label="Nome azienda" full><input placeholder="Tech Supplies S.r.l." value={fForm.nome} onChange={e=>setFForm({...fForm,nome:e.target.value})} style={S.inp}/></Field>
            <Field label="Referente"><input placeholder="Mario Rossi" value={fForm.contatto} onChange={e=>setFForm({...fForm,contatto:e.target.value})} style={S.inp}/></Field>
            <Field label="P.IVA"><input placeholder="IT00000000000" value={fForm.piva} onChange={e=>setFForm({...fForm,piva:e.target.value})} style={S.inp}/></Field>
            <Field label="Telefono"><input placeholder="+39 333..." value={fForm.telefono} onChange={e=>setFForm({...fForm,telefono:e.target.value})} style={S.inp}/></Field>
            <Field label="Email" full><input placeholder="info@fornitore.it" value={fForm.email} onChange={e=>setFForm({...fForm,email:e.target.value})} style={S.inp}/></Field>
            <Field label="Indirizzo" full><input placeholder="Via Roma 1, Milano" value={fForm.indirizzo} onChange={e=>setFForm({...fForm,indirizzo:e.target.value})} style={S.inp}/></Field>
            <Field label="Note" full><input placeholder="Note..." value={fForm.note} onChange={e=>setFForm({...fForm,note:e.target.value})} style={S.inp}/></Field>
          </Grid>
          <ModalFooter onCancel={()=>setModal(null)} onConfirm={saveFornitore} label="Salva fornitore"/>
        </Modal>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════
// TAB DISPOSITIVI
// ══════════════════════════════════════════════
function TabDispositivi({ api, showToast }) {
  const [devices, setDevices] = useState([])
  const [fornitori, setFornitori] = useState([])
  const [filters, setFilters] = useState({ brand:'', stato:'', cond:'' })
  const [modal, setModal] = useState(null)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [interventi, setInterventi] = useState([])
  const [intForm, setIntForm] = useState({ tipo:'sostituzione_batteria', descrizione:'', costo:0, fornitore_id:'', eseguito_da:'interno', data:'', note:'' })
  const [editingInt, setEditingInt] = useState(null)
  const [nd, setNd] = useState({ brand:'Apple', modello:'', storage:'128GB', colore:'', imei:'', condizione:'B', stato:'in_stock', provenienza:'fornitore', prezzo_acq:0, prezzo_vend:0 })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [d,f] = await Promise.all([axios.get(`${api}/devices`), axios.get(`${api}/fornitori`)])
      setDevices(d.data.data||[])
      setFornitori(f.data.data||[])
    } catch {}
  }

  const fetchInterventi = async (deviceId) => {
    try {
      const {data} = await axios.get(`${api}/interventi?device_id=${deviceId}`)
      setInterventi(data.data||[])
    } catch { setInterventi([]) }
  }

  const openDevice = (d) => {
    setSelectedDevice(d)
    fetchInterventi(d.id)
    setModal('device_detail')
  }

  const updStato = async (id, stato) => {
    setDevices(prev => prev.map(d => d.id===id?{...d,stato}:d))
    try { await axios.put(`${api}/devices/${id}`, {...devices.find(d=>d.id===id), stato}) } catch {}
    showToast('Stato aggiornato')
  }

  const addDevice = async () => {
    if (!nd.modello) { showToast('Inserisci il modello','error'); return }
    try {
      const {data} = await axios.post(`${api}/devices`, nd)
      setDevices(prev => [data,...prev])
    } catch { setDevices(prev => [{...nd,id:Date.now().toString()},...prev]) }
    setModal(null)
    setNd({brand:'Apple',modello:'',storage:'128GB',colore:'',imei:'',condizione:'B',stato:'in_stock',provenienza:'fornitore',prezzo_acq:0,prezzo_vend:0})
    showToast('✓ Dispositivo aggiunto')
  }

  const delDevice = async (id) => {
    setDevices(prev => prev.filter(d => d.id!==id))
    try { await axios.delete(`${api}/devices/${id}`) } catch {}
    showToast('Eliminato')
  }

  const saveIntervento = async () => {
    if (!intForm.tipo) { showToast('Tipo intervento obbligatorio','error'); return }
    const payload = { ...intForm, device_id: selectedDevice.id }
    try {
      if (editingInt) {
        const {data} = await axios.put(`${api}/interventi/${editingInt}`, payload)
        setInterventi(prev => prev.map(i => i.id===editingInt?data:i))
        showToast('✓ Intervento aggiornato')
      } else {
        const {data} = await axios.post(`${api}/interventi`, payload)
        setInterventi(prev => [data,...prev])
        showToast('✓ Intervento aggiunto')
      }
    } catch {
      const mock = {...payload, id:Date.now().toString()}
      setInterventi(prev => editingInt?prev.map(i=>i.id===editingInt?{...i,...intForm}:i):[mock,...prev])
      showToast('✓ Salvato')
    }
    setEditingInt(null)
    setIntForm({tipo:'sostituzione_batteria',descrizione:'',costo:0,fornitore_id:'',eseguito_da:'interno',data:'',note:''})
    setModal('device_detail')
  }

  const delIntervento = async (id) => {
    setInterventi(prev => prev.filter(i => i.id!==id))
    try { await axios.delete(`${api}/interventi/${id}`) } catch {}
    showToast('Intervento eliminato')
  }

  const costoTotaleInterventi = (devId) => interventi.filter(i=>i.device_id===devId).reduce((s,i)=>s+(i.costo||0),0)

  const filtered = devices.filter(d => {
    if (filters.brand && d.brand!==filters.brand) return false
    if (filters.stato && d.stato!==filters.stato) return false
    if (filters.cond  && d.condizione!==filters.cond) return false
    return true
  })

  const tipoLabel = (val) => TIPI_INTERVENTO.find(t=>t.val===val)?.label || val

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div style={{ display:'flex', gap:8 }}>
          {[
            {id:'brand', opts:['','Apple','Samsung','Google','Xiaomi','OnePlus','Huawei'], labels:['Tutti i brand','Apple','Samsung','Google','Xiaomi','OnePlus','Huawei']},
            {id:'stato', opts:['','in_stock','da_testare','in_riparazione','venduto'], labels:['Tutti gli stati','In stock','Da testare','In riparazione','Venduto']},
            {id:'cond',  opts:['','A','B','C'], labels:['Tutte le condizioni','A — Ottima','B — Buona','C — Discreta']},
          ].map(f=>(
            <select key={f.id} value={filters[f.id]} onChange={e=>setFilters({...filters,[f.id]:e.target.value})} style={{...S.sel,width:'auto',minWidth:140}}>
              {f.opts.map((o,i)=><option key={o} value={o}>{f.labels[i]}</option>)}
            </select>
          ))}
        </div>
        <PrimaryBtn onClick={()=>setModal('add_device')}>+ Aggiungi dispositivo</PrimaryBtn>
      </div>

      <div style={S.card}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr>
              {['Dispositivo','Storage','IMEI','Cond.','Stato','Prov.','Acq.','Vend.','Interventi',''].map(h=><th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan="10" style={{textAlign:'center',padding:'40px 0',color:'rgba(255,255,255,0.2)'}}>📱 Nessun dispositivo</td></tr>
                : filtered.map(d=>(
                    <tr key={d.id} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td style={{...S.td,color:'white',fontWeight:500}}>
                        <button onClick={()=>openDevice(d)} style={{background:'none',border:'none',color:'white',fontWeight:500,fontSize:13,cursor:'pointer',textAlign:'left',fontFamily:'Inter,sans-serif'}}>
                          <span style={{display:'block',fontSize:10,color:'rgba(255,255,255,0.3)'}}>{d.brand}</span>{d.modello}
                        </button>
                      </td>
                      <td style={{...S.td,fontFamily:'monospace',fontSize:11}}>{d.storage||'—'}</td>
                      <td style={{...S.td,fontFamily:'monospace',fontSize:10,color:'rgba(255,255,255,0.3)'}}>{d.imei?d.imei.slice(0,8)+'…':'—'}</td>
                      <td style={S.td}><Badge label={d.condizione||'—'} color={COND_COLOR[d.condizione]||'gray'}/></td>
                      <td style={S.td}>
                        <select onChange={e=>updStato(d.id,e.target.value)} value={d.stato}
                          style={{...S.sel,padding:'4px 8px',fontSize:11,width:'auto',minWidth:110}}>
                          {Object.entries(STATO_DEVICE).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                        </select>
                      </td>
                      <td style={S.td}><Badge label={d.provenienza} color={d.provenienza==='privato'?'teal':'blue'}/></td>
                      <td style={S.td}>€{d.prezzo_acq||0}</td>
                      <td style={S.td}>{d.prezzo_vend?`€${d.prezzo_vend}`:'—'}</td>
                      <td style={S.td}>
                        <button onClick={()=>openDevice(d)} style={{background:'rgba(124,58,237,0.12)',border:'1px solid rgba(124,58,237,0.2)',color:'#c4b5fd',borderRadius:7,padding:'4px 10px',fontSize:11,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                          🔧 Vedi
                        </button>
                      </td>
                      <td style={S.td}>
                        <GhostBtn small danger onClick={()=>delDevice(d.id)}>✕</GhostBtn>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal aggiunta dispositivo */}
      {modal==='add_device'&&(
        <Modal title="Aggiungi dispositivo" onClose={()=>setModal(null)}>
          <Grid cols={2}>
            <Field label="Brand">
              <select value={nd.brand} onChange={e=>setNd({...nd,brand:e.target.value})} style={S.sel}>
                {['Apple','Samsung','Google','Xiaomi','OnePlus','Huawei'].map(b=><option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Modello"><input placeholder="iPhone 15 Pro" value={nd.modello} onChange={e=>setNd({...nd,modello:e.target.value})} style={S.inp}/></Field>
            <Field label="Storage">
              <select value={nd.storage} onChange={e=>setNd({...nd,storage:e.target.value})} style={S.sel}>
                {['64GB','128GB','256GB','512GB','1TB'].map(v=><option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Colore"><input placeholder="Nero" value={nd.colore} onChange={e=>setNd({...nd,colore:e.target.value})} style={S.inp}/></Field>
            <Field label="IMEI" full><input placeholder="356xxxxxxxxxxxxxx" value={nd.imei} onChange={e=>setNd({...nd,imei:e.target.value})} style={{...S.inp,fontFamily:'monospace',fontSize:12.5}}/></Field>
            <Field label="Condizione">
              <select value={nd.condizione} onChange={e=>setNd({...nd,condizione:e.target.value})} style={S.sel}>
                <option value="A">A — Ottima</option><option value="B">B — Buona</option><option value="C">C — Discreta</option>
              </select>
            </Field>
            <Field label="Stato">
              <select value={nd.stato} onChange={e=>setNd({...nd,stato:e.target.value})} style={S.sel}>
                {Object.entries(STATO_DEVICE).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="Provenienza">
              <select value={nd.provenienza} onChange={e=>setNd({...nd,provenienza:e.target.value})} style={S.sel}>
                <option value="fornitore">Fornitore</option><option value="privato">Privato</option>
              </select>
            </Field>
            <Field label="Prezzo acquisto €"><input type="number" value={nd.prezzo_acq} onChange={e=>setNd({...nd,prezzo_acq:+e.target.value})} style={S.inp}/></Field>
            <Field label="Prezzo vendita €"><input type="number" value={nd.prezzo_vend} onChange={e=>setNd({...nd,prezzo_vend:+e.target.value})} style={S.inp}/></Field>
          </Grid>
          <ModalFooter onCancel={()=>setModal(null)} onConfirm={addDevice} label="Aggiungi dispositivo"/>
        </Modal>
      )}

      {/* Modal dettaglio dispositivo + interventi */}
      {modal==='device_detail'&&selectedDevice&&(
        <Modal title={`${selectedDevice.brand} ${selectedDevice.modello} · ${selectedDevice.storage||''}`} onClose={()=>setModal(null)} wide>
          {/* Info dispositivo */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:22 }}>
            {[
              ['Condizione', <Badge label={selectedDevice.condizione} color={COND_COLOR[selectedDevice.condizione]}/>],
              ['Stato', <Badge label={STATO_DEVICE[selectedDevice.stato]} color={STATO_COLOR[selectedDevice.stato]}/>],
              ['Acquisto', `€${selectedDevice.prezzo_acq||0}`],
              ['Vendita', selectedDevice.prezzo_vend?`€${selectedDevice.prezzo_vend}`:'—'],
              ['Provenienza', <Badge label={selectedDevice.provenienza} color={selectedDevice.provenienza==='privato'?'teal':'blue'}/>],
              ['IMEI', <span style={{fontFamily:'monospace',fontSize:11}}>{selectedDevice.imei||'—'}</span>],
              ['Colore', selectedDevice.colore||'—'],
              ['Costo interventi', <span style={{color:'#f87171'}}>€{costoTotaleInterventi(selectedDevice.id).toFixed(2)}</span>],
            ].map(([l,v])=>(
              <div key={l} style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'10px 12px' }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{l}</div>
                <div style={{ fontSize:13, fontWeight:500 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Lista interventi */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:600 }}>🔧 Storico interventi</div>
              <PrimaryBtn small onClick={()=>{ setEditingInt(null); setIntForm({tipo:'sostituzione_batteria',descrizione:'',costo:0,fornitore_id:'',eseguito_da:'interno',data:new Date().toISOString().slice(0,10),note:''}); setModal('add_intervento') }}>
                + Aggiungi intervento
              </PrimaryBtn>
            </div>

            {interventi.length===0
              ? <div style={{ textAlign:'center', padding:'20px 0', color:'rgba(255,255,255,0.2)', fontSize:13 }}>Nessun intervento registrato</div>
              : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {interventi.map(i=>(
                    <div key={i.id} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'12px 15px', display:'flex', alignItems:'flex-start', gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:13.5, fontWeight:600 }}>{tipoLabel(i.tipo)}</span>
                          <Badge label={i.eseguito_da==='interno'?'Interno':'Fornitore esterno'} color={i.eseguito_da==='interno'?'blue':'amber'}/>
                          {i.costo>0&&<Badge label={`€${i.costo}`} color="red"/>}
                        </div>
                        {i.descrizione&&<div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:3 }}>{i.descrizione}</div>}
                        {i.note&&<div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', borderLeft:'2px solid rgba(255,255,255,0.1)', paddingLeft:8 }}>{i.note}</div>}
                        <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.25)', marginTop:5 }}>
                          {i.data?new Date(i.data).toLocaleDateString('it-IT'):''} {i.fornitore_nome?`· ${i.fornitore_nome}`:''}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <GhostBtn small onClick={()=>{ setEditingInt(i.id); setIntForm({tipo:i.tipo,descrizione:i.descrizione||'',costo:i.costo||0,fornitore_id:i.fornitore_id||'',eseguito_da:i.eseguito_da||'interno',data:i.data?i.data.slice(0,10):'',note:i.note||''}); setModal('add_intervento') }}>✏️</GhostBtn>
                        <GhostBtn small danger onClick={()=>delIntervento(i.id)}>✕</GhostBtn>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </Modal>
      )}

      {/* Modal aggiungi intervento */}
      {modal==='add_intervento'&&(
        <Modal title={editingInt?'Modifica intervento':'Nuovo intervento'} onClose={()=>setModal('device_detail')}>
          <Grid cols={2}>
            <Field label="Tipo intervento" full>
              <select value={intForm.tipo} onChange={e=>setIntForm({...intForm,tipo:e.target.value})} style={S.sel}>
                {TIPI_INTERVENTO.map(t=><option key={t.val} value={t.val}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Descrizione" full><input placeholder="Dettagli intervento..." value={intForm.descrizione} onChange={e=>setIntForm({...intForm,descrizione:e.target.value})} style={S.inp}/></Field>
            <Field label="Costo €"><input type="number" step="0.01" value={intForm.costo} onChange={e=>setIntForm({...intForm,costo:+e.target.value})} style={S.inp}/></Field>
            <Field label="Data"><input type="date" value={intForm.data} onChange={e=>setIntForm({...intForm,data:e.target.value})} style={S.inp}/></Field>
            <Field label="Eseguito da">
              <select value={intForm.eseguito_da} onChange={e=>setIntForm({...intForm,eseguito_da:e.target.value})} style={S.sel}>
                <option value="interno">Interno (nostro tecnico)</option>
                <option value="fornitore">Fornitore esterno</option>
              </select>
            </Field>
            <Field label="Fornitore (opz.)">
              <select value={intForm.fornitore_id} onChange={e=>setIntForm({...intForm,fornitore_id:e.target.value})} style={S.sel}>
                <option value="">— Nessuno —</option>
                {fornitori.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </Field>
            <Field label="Note" full><input placeholder="Note aggiuntive..." value={intForm.note} onChange={e=>setIntForm({...intForm,note:e.target.value})} style={S.inp}/></Field>
          </Grid>
          <ModalFooter onCancel={()=>setModal('device_detail')} onConfirm={saveIntervento} label={editingInt?'Salva modifiche':'Aggiungi intervento'}/>
        </Modal>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════
// TAB RICAMBI
// ══════════════════════════════════════════════
function TabRicambi({ api, showToast }) {
  const [ricambi, setRicambi] = useState([])
  const [fornitori, setFornitori] = useState([])
  const [alerts, setAlerts] = useState([])
  const [modal, setModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ nome:'', categoria:'batteria', compatibile:'', fornitore_id:'', qty:0, qty_minima:2, prezzo_acq:0, barcode:'', note:'' })
  const [barcodeSearch, setBarcodeSearch] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [r,f] = await Promise.all([axios.get(`${api}/ricambi`), axios.get(`${api}/fornitori`)])
      setRicambi(r.data.data||[])
      setAlerts(r.data.alerts||[])
      setFornitori(f.data.data||[])
    } catch {}
  }

  const openAdd = () => { setEditing(null); setForm({nome:'',categoria:'batteria',compatibile:'',fornitore_id:'',qty:0,qty_minima:2,prezzo_acq:0,barcode:'',note:''}); setModal('ricambio') }
  const openEdit = (r) => { setEditing(r.id); setForm({nome:r.nome,categoria:r.categoria,compatibile:r.compatibile||'',fornitore_id:r.fornitore_id||'',qty:r.qty,qty_minima:r.qty_minima,prezzo_acq:r.prezzo_acq,barcode:r.barcode||'',note:r.note||''}); setModal('ricambio') }

  const save = async () => {
    if (!form.nome) { showToast('Nome obbligatorio','error'); return }
    try {
      if (editing) {
        const {data} = await axios.put(`${api}/ricambi/${editing}`, form)
        setRicambi(prev => prev.map(r => r.id===editing?data:r))
      } else {
        const {data} = await axios.post(`${api}/ricambi`, form)
        setRicambi(prev => [data,...prev])
      }
    } catch(e) {
      if (e.response?.status===409) { showToast('Barcode già esistente','error'); return }
      setRicambi(prev => editing?prev.map(r=>r.id===editing?{...r,...form}:r):[{...form,id:Date.now().toString()},...prev])
    }
    setModal(null); showToast(editing?'✓ Ricambio aggiornato':'✓ Ricambio aggiunto')
  }

  const del = async (id) => {
    setRicambi(prev => prev.filter(r => r.id!==id))
    try { await axios.delete(`${api}/ricambi/${id}`) } catch {}
    showToast('Eliminato')
  }

  const adjQty = async (id, delta) => {
    setRicambi(prev => prev.map(r => r.id===id?{...r,qty:Math.max(0,r.qty+delta)}:r))
    try { await axios.patch(`${api}/ricambi/${id}/qty`, {delta}) } catch {}
  }

  const nomeFornitore = (id) => fornitori.find(f=>f.id===id)?.nome||'—'

  const filteredR = barcodeSearch
    ? ricambi.filter(r => r.barcode===barcodeSearch||r.nome.toLowerCase().includes(barcodeSearch.toLowerCase()))
    : ricambi

  const CAT_ICON = { batteria:'🔋', schermo:'📱', scocca:'🔧', altoparlante:'🔊', fotocamera:'📷', connettore:'🔌', altro:'📦' }

  return (
    <div>
      {/* Alert scorte basse */}
      {alerts.length>0&&(
        <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>⚠️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#fbbf24', marginBottom:2 }}>Scorte basse</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>
              {alerts.map(a=>`${a.nome} (${a.qty}/${a.qty_minima})`).join(' · ')}
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div style={{ position:'relative', maxWidth:280 }}>
          <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', opacity:0.4 }}>🔍</span>
          <input
            placeholder="Cerca o scansiona barcode..."
            value={barcodeSearch}
            onChange={e=>setBarcodeSearch(e.target.value)}
            style={{...S.inp,paddingLeft:34}}
          />
        </div>
        <PrimaryBtn onClick={openAdd}>+ Aggiungi ricambio</PrimaryBtn>
      </div>

      <div style={S.card}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr>
              {['Ricambio','Categoria','Compatibile con','Fornitore','Acquisto','Qtà','Barcode',''].map(h=><th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filteredR.length===0
                ? <tr><td colSpan="8" style={{textAlign:'center',padding:'40px 0',color:'rgba(255,255,255,0.2)'}}>🔧 Nessun ricambio</td></tr>
                : filteredR.map(r=>{
                    const low = r.qty<=r.qty_minima
                    return (
                      <tr key={r.id} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <td style={{...S.td,color:'white',fontWeight:500}}>{CAT_ICON[r.categoria]||'📦'} {r.nome}</td>
                        <td style={S.td}><Badge label={r.categoria} color="blue"/></td>
                        <td style={{...S.td,fontSize:11,color:'rgba(255,255,255,0.4)',maxWidth:150}}>{r.compatibile||'—'}</td>
                        <td style={S.td}>{nomeFornitore(r.fornitore_id)}</td>
                        <td style={S.td}>€{r.prezzo_acq||0}</td>
                        <td style={S.td}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <button onClick={()=>adjQty(r.id,-1)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'white', width:24, height:24, borderRadius:6, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                            <span style={{ fontFamily:'monospace', fontWeight:700, color:low?'#f87171':'#4ade80', minWidth:28, textAlign:'center' }}>{r.qty}</span>
                            <button onClick={()=>adjQty(r.id,+1)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'white', width:24, height:24, borderRadius:6, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                            {low&&<Badge label="Basso" color="amber"/>}
                          </div>
                        </td>
                        <td style={{...S.td,fontFamily:'monospace',fontSize:11,color:'rgba(255,255,255,0.35)'}}>{r.barcode||'—'}</td>
                        <td style={S.td}>
                          <div style={{ display:'flex', gap:6 }}>
                            <GhostBtn small onClick={()=>openEdit(r)}>✏️</GhostBtn>
                            <GhostBtn small danger onClick={()=>del(r.id)}>✕</GhostBtn>
                          </div>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {modal==='ricambio'&&(
        <Modal title={editing?'Modifica ricambio':'Aggiungi ricambio'} onClose={()=>setModal(null)}>
          <Grid cols={2}>
            <Field label="Nome ricambio" full><input placeholder="Batteria iPhone 14" value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} style={S.inp}/></Field>
            <Field label="Categoria">
              <select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})} style={S.sel}>
                {['batteria','schermo','scocca','altoparlante','fotocamera','connettore','altro'].map(c=><option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Fornitore">
              <select value={form.fornitore_id} onChange={e=>setForm({...form,fornitore_id:e.target.value})} style={S.sel}>
                <option value="">— Nessuno —</option>
                {fornitori.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </Field>
            <Field label="Compatibile con" full><input placeholder="iPhone 13, iPhone 14" value={form.compatibile} onChange={e=>setForm({...form,compatibile:e.target.value})} style={S.inp}/></Field>
            <Field label="Quantità"><input type="number" value={form.qty} onChange={e=>setForm({...form,qty:+e.target.value})} style={S.inp}/></Field>
            <Field label="Qtà minima (alert)"><input type="number" value={form.qty_minima} onChange={e=>setForm({...form,qty_minima:+e.target.value})} style={S.inp}/></Field>
            <Field label="Prezzo acquisto €"><input type="number" step="0.01" value={form.prezzo_acq} onChange={e=>setForm({...form,prezzo_acq:+e.target.value})} style={S.inp}/></Field>
            <Field label="Barcode / EAN">
              <input placeholder="Scansiona o digita..." value={form.barcode} onChange={e=>setForm({...form,barcode:e.target.value})} style={{...S.inp,fontFamily:'monospace'}}/>
            </Field>
            <Field label="Note" full><input placeholder="Note..." value={form.note} onChange={e=>setForm({...form,note:e.target.value})} style={S.inp}/></Field>
          </Grid>
          <ModalFooter onCancel={()=>setModal(null)} onConfirm={save} label={editing?'Salva modifiche':'Aggiungi ricambio'}/>
        </Modal>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ══════════════════════════════════════════════
export default function Magazzino({ api, showToast }) {
  const [tab, setTab] = useState('prodotti')

  const tabs = [
    { id:'prodotti',    label:'📦 Prodotti' },
    { id:'dispositivi', label:'📱 Dispositivi' },
    { id:'ricambi',     label:'🔧 Ricambi' },
  ]

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Magazzino</div>
        <div style={{ fontSize:13, color:'#64748b' }}>Gestisci prodotti, dispositivi e ricambi</div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,0.04)', borderRadius:11, padding:3, width:'fit-content', marginBottom:22 }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'8px 22px', borderRadius:9, fontSize:13.5, fontWeight:500,
            cursor:'pointer', border:'none', fontFamily:'Inter,sans-serif', transition:'all 0.15s',
            background:tab===t.id?'rgba(124,58,237,0.25)':'transparent',
            color:tab===t.id?'#c4b5fd':'rgba(255,255,255,0.4)',
            boxShadow:tab===t.id?'0 2px 8px rgba(124,58,237,0.2)':'none',
          }}>{t.label}</button>
        ))}
      </div>

      {tab==='prodotti'    && <TabProdotti    api={api} showToast={showToast}/>}
      {tab==='dispositivi' && <TabDispositivi api={api} showToast={showToast}/>}
      {tab==='ricambi'     && <TabRicambi     api={api} showToast={showToast}/>}
    </div>
  )
}
