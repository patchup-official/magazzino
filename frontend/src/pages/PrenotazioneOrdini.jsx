import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const STATI = [
  { key: 'da_ordinare', label: 'Da ordinare', bg: '#1a1060', text: '#a78bfa' },
  { key: 'ordinato',    label: 'Ordinato',    bg: '#3b1a06', text: '#fb923c' },
  { key: 'arrivato',   label: 'Arrivato',    bg: '#0f3320', text: '#4ade80' },
];
const METODI = ['Contanti', 'Bonifico'];
const BRANDS = ['Apple','Samsung','Xiaomi','Huawei','OnePlus','Google','Motorola','Nokia','Sony','Altro'];
const empty = { cliente_id:'', cliente_nome:'', cliente_telefono:'', cliente_email:'', brand:'', modello:'', colore_variante:'', tipo_riparazione:'', ricambio:'', in_store:true, note_dispositivo:'', fornitore_nome:'', stato:'da_ordinare', data_inserimento:new Date().toISOString().split('T')[0], data_ordine:'', data_arrivo:'', caparra_attiva:false, caparra_importo:'', caparra_totale:'', caparra_metodo:'Contanti', caparra_note:'', note_generali:'' };

const inp = { width:'100%', fontSize:13, padding:'7px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.05)', color:'#e2e8f0', fontFamily:'inherit', boxSizing:'border-box' };
const card = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'1rem', marginBottom:'1rem' };
const lbl = { fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:5 };

function Tog({ v, onChange }) {
  return <div onClick={()=>onChange(!v)} style={{ width:36,height:20,borderRadius:20,cursor:'pointer',background:v?'#22c55e':'rgba(255,255,255,0.12)',position:'relative',transition:'background .2s',flexShrink:0 }}><div style={{ position:'absolute',width:14,height:14,borderRadius:'50%',background:'white',top:3,left:v?19:3,transition:'left .2s' }}/></div>;
}
function Chip({ label, active, onClick }) {
  return <button onClick={onClick} style={{ fontSize:12,padding:'4px 14px',borderRadius:20,cursor:'pointer',fontFamily:'inherit',border:'1px solid',background:active?'#1e3a5f':'transparent',borderColor:active?'#3b82f6':'rgba(255,255,255,0.15)',color:active?'#60a5fa':'rgba(255,255,255,0.5)' }}>{label}</button>;
}

function FormPren({ form, set, clienti, onSave, onCancel, saving }) {
  const si = STATI.findIndex(s=>s.key===form.stato);
  const saldo = form.caparra_attiva&&form.caparra_totale&&form.caparra_importo?(parseFloat(form.caparra_totale)-parseFloat(form.caparra_importo)).toFixed(2):null;
  const f = (k,v) => set(p=>({...p,[k]:v}));
  return (
    <div style={{ padding:'1.25rem', maxHeight:'78vh', overflowY:'auto' }}>
      <div style={card}>
        <span style={lbl}>Stato ordine</span>
        <div style={{ display:'flex',borderRadius:6,overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)' }}>
          {STATI.map((s,i)=><button key={s.key} onClick={()=>f('stato',s.key)} style={{ flex:1,padding:'7px',border:'none',borderRight:i<2?'1px solid rgba(255,255,255,0.08)':'none',cursor:'pointer',fontSize:12,fontWeight:500,fontFamily:'inherit',background:form.stato===s.key?s.bg:'transparent',color:form.stato===s.key?s.text:'rgba(255,255,255,0.4)' }}>{s.label}</button>)}
        </div>
      </div>
      <div style={card}>
        <span style={lbl}>Cliente</span>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10 }}>
          <div><label style={lbl}>Cerca esistente</label>
            <select value={form.cliente_id} onChange={e=>{const c=clienti.find(x=>x.id===e.target.value);if(c)set(p=>({...p,cliente_id:c.id,cliente_nome:[c.nome,c.cognome].filter(Boolean).join(' '),cliente_telefono:c.telefono||'',cliente_email:c.email||''}));else f('cliente_id','');}} style={inp}>
              <option value="">-- Seleziona --</option>{clienti.map(c=><option key={c.id} value={c.id}>{[c.nome,c.cognome].filter(Boolean).join(' ')}</option>)}
            </select></div>
          <div><label style={lbl}>Nome *</label><input value={form.cliente_nome} onChange={e=>set(p=>({...p,cliente_nome:e.target.value,cliente_id:''}))} placeholder="Nome cognome" style={inp}/></div>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
          <div><label style={lbl}>Telefono</label><input value={form.cliente_telefono} onChange={e=>f('cliente_telefono',e.target.value)} placeholder="+39..." style={inp}/></div>
          <div><label style={lbl}>Email</label><input value={form.cliente_email} onChange={e=>f('cliente_email',e.target.value)} placeholder="email@..." style={inp}/></div>
        </div>
      </div>
      <div style={card}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
          <span style={lbl}>Dispositivo</span>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}><span style={{ fontSize:12,color:'rgba(255,255,255,0.4)' }}>In store</span><Tog v={form.in_store} onChange={v=>f('in_store',v)}/>{form.in_store&&<span style={{ fontSize:11,padding:'2px 8px',borderRadius:20,background:'#163e20',color:'#4ade80' }}>In negozio</span>}</div>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10 }}>
          <div><label style={lbl}>Marca *</label><select value={form.brand} onChange={e=>f('brand',e.target.value)} style={inp}><option value="">--</option>{BRANDS.map(b=><option key={b}>{b}</option>)}</select></div>
          <div><label style={lbl}>Modello *</label><input value={form.modello} onChange={e=>f('modello',e.target.value)} placeholder="es. iPhone 15" style={inp}/></div>
          <div><label style={lbl}>Colore/Variante</label><input value={form.colore_variante} onChange={e=>f('colore_variante',e.target.value)} placeholder="es. Nero 128GB" style={inp}/></div>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10 }}>
          <div><label style={lbl}>Tipo riparazione</label><input value={form.tipo_riparazione} onChange={e=>f('tipo_riparazione',e.target.value)} placeholder="es. Display" style={inp}/></div>
          <div><label style={lbl}>Ricambio specifico</label><input value={form.ricambio} onChange={e=>f('ricambio',e.target.value)} placeholder="es. Display OLED" style={inp}/></div>
        </div>
        <label style={lbl}>Note dispositivo</label>
        <textarea value={form.note_dispositivo} onChange={e=>f('note_dispositivo',e.target.value)} style={{ ...inp,resize:'vertical',minHeight:55 }}/>
      </div>
      <div style={card}><span style={lbl}>Fornitore</span><input value={form.fornitore_nome} onChange={e=>f('fornitore_nome',e.target.value)} placeholder="Nome fornitore..." style={inp}/></div>
      <div style={card}>
        <span style={lbl}>Date</span>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
          <div><label style={lbl}>Inserimento</label><input type="date" value={form.data_inserimento} onChange={e=>f('data_inserimento',e.target.value)} style={inp}/></div>
          <div><label style={lbl}>Ordine</label><input type="date" value={form.data_ordine} disabled={si<1} onChange={e=>f('data_ordine',e.target.value)} style={{ ...inp,opacity:si<1?.4:1 }}/></div>
          <div><label style={lbl}>Arrivo</label><input type="date" value={form.data_arrivo} disabled={si<2} onChange={e=>f('data_arrivo',e.target.value)} style={{ ...inp,opacity:si<2?.4:1 }}/></div>
        </div>
        <p style={{ fontSize:11,color:'rgba(255,255,255,0.25)',marginTop:6 }}>Data ordine/arrivo si sbloccano al cambio stato</p>
      </div>
      <div style={card}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:form.caparra_attiva?12:0 }}>
          <span style={lbl}>Caparra</span><Tog v={form.caparra_attiva} onChange={v=>f('caparra_attiva',v)}/>
        </div>
        {form.caparra_attiva&&<div style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,padding:12 }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10 }}>
            <div><label style={lbl}>Importo (€)</label><input type="number" value={form.caparra_importo} min={0} step={0.01} onChange={e=>f('caparra_importo',e.target.value)} placeholder="0.00" style={inp}/></div>
            <div><label style={lbl}>Totale preventivo (€)</label><input type="number" value={form.caparra_totale} min={0} step={0.01} onChange={e=>f('caparra_totale',e.target.value)} placeholder="0.00" style={inp}/></div>
          </div>
          <label style={lbl}>Metodo</label>
          <div style={{ display:'flex',gap:8,marginBottom:10,marginTop:5 }}>{METODI.map(m=><Chip key={m} label={m} active={form.caparra_metodo===m} onClick={()=>f('caparra_metodo',m)}/>)}</div>
          <label style={lbl}>Note caparra</label>
          <input value={form.caparra_note} onChange={e=>f('caparra_note',e.target.value)} placeholder="es. Ricevuta n..." style={{ ...inp,marginBottom:saldo?10:0 }}/>
          {saldo&&<div style={{ display:'flex',justifyContent:'space-between',paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.06)' }}><span style={{ fontSize:12,color:'rgba(255,255,255,0.4)' }}>Saldo residuo</span><span style={{ fontSize:14,fontWeight:600,color:'#60a5fa' }}>euro {saldo}</span></div>}
        </div>}
      </div>
      <div style={card}><span style={lbl}>Note generali</span><textarea value={form.note_generali} onChange={e=>f('note_generali',e.target.value)} placeholder="Annotazioni..." style={{ ...inp,resize:'vertical',minHeight:60 }}/></div>
      <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
        <button onClick={onCancel} style={{ fontSize:13,padding:'8px 16px',borderRadius:8,border:'1px solid rgba(255,255,255,0.12)',background:'transparent',color:'#94a3b8',cursor:'pointer',fontFamily:'inherit' }}>Annulla</button>
        <button onClick={onSave} disabled={saving} style={{ fontSize:13,fontWeight:600,padding:'8px 20px',borderRadius:8,border:'none',background:'#22c55e',color:'white',cursor:'pointer',fontFamily:'inherit',opacity:saving?.7:1 }}>{saving?'Salvataggio...':'Salva prenotazione'}</button>
      </div>
    </div>
  );
}

function Riga({ p, onEdit, onDelete }) {
  const s = STATI.find(x=>x.key===p.stato)||STATI[0];
  return (
    <div style={{ display:'flex',alignItems:'center',gap:12,padding:'11px 16px',borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize:11,padding:'3px 9px',borderRadius:20,background:s.bg,color:s.text,fontWeight:500,flexShrink:0 }}>{s.label}</span>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontWeight:500,fontSize:14,color:'#e2e8f0',marginBottom:2 }}>{p.brand} {p.modello}{p.colore_variante?' · '+p.colore_variante:''}</div>
        <div style={{ fontSize:12,color:'#475569' }}>{p.cliente_nome}{p.cliente_telefono?' · '+p.cliente_telefono:''}{p.ricambio?' · '+p.ricambio:''}</div>
      </div>
      <div style={{ fontSize:11,color:'#334155',textAlign:'right',flexShrink:0 }}>
        {p.data_inserimento&&<div>{p.data_inserimento}</div>}
        {p.fornitore_nome&&<div>{p.fornitore_nome}</div>}
        {!!p.in_store&&<span style={{ fontSize:10,padding:'1px 6px',borderRadius:12,background:'#163e20',color:'#4ade80' }}>store</span>}
      </div>
      {!!p.caparra_attiva&&<div style={{ fontSize:12,color:'#60a5fa',background:'#1e3a5f',borderRadius:6,padding:'3px 8px',flexShrink:0 }}>euro{p.caparra_importo}</div>}
      <div style={{ display:'flex',gap:4,flexShrink:0 }}>
        <button onClick={()=>onEdit(p)} style={{ background:'none',border:'none',cursor:'pointer',color:'#60a5fa',fontSize:14,padding:'3px 6px' }}>Modifica</button>
        <button onClick={()=>onDelete(p.id)} style={{ background:'none',border:'none',cursor:'pointer',color:'#f87171',fontSize:14,padding:'3px 6px' }}>Elimina</button>
      </div>
    </div>
  );
}

export default function PrenotazioneOrdini({ api, showToast }) {
  const BASE = api||API;
  const [list,setList] = useState([]);
  const [clienti,setClienti] = useState([]);
  const [loading,setLoading] = useState(false);
  const [modal,setModal] = useState(false);
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState(empty);
  const [filtro,setFiltro] = useState('');
  const [search,setSearch] = useState('');
  const [saving,setSaving] = useState(false);

  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if(filtro) p.set('stato',filtro);
      if(search) p.set('search',search);
      const [pr,cl] = await Promise.all([
        fetch(BASE+'/prenotazioni-ordini?'+p).then(r=>r.json()),
        fetch(BASE+'/clienti').then(r=>r.json()),
      ]);
      setList(Array.isArray(pr)?pr:[]);
      setClienti(Array.isArray(cl)?cl:[]);
    } catch(e){ console.error(e); }
    setLoading(false);
  },[filtro,search,BASE]);

  useEffect(()=>{load();},[load]);

  const openNew = ()=>{setEditing(null);setForm({...empty,data_inserimento:new Date().toISOString().split('T')[0]});setModal(true);};
  const openEdit = p=>{
    setEditing(p);
    setForm({cliente_id:p.cliente_id||'',cliente_nome:p.cliente_nome||'',cliente_telefono:p.cliente_telefono||'',cliente_email:p.cliente_email||'',brand:p.brand||'',modello:p.modello||'',colore_variante:p.colore_variante||'',tipo_riparazione:p.tipo_riparazione||'',ricambio:p.ricambio||'',in_store:!!p.in_store,note_dispositivo:p.note_dispositivo||'',fornitore_nome:p.fornitore_nome||'',stato:p.stato||'da_ordinare',data_inserimento:p.data_inserimento||'',data_ordine:p.data_ordine||'',data_arrivo:p.data_arrivo||'',caparra_attiva:!!p.caparra_attiva,caparra_importo:p.caparra_importo||'',caparra_totale:p.caparra_totale||'',caparra_metodo:p.caparra_metodo||'Contanti',caparra_note:p.caparra_note||'',note_generali:p.note_generali||''});
    setModal(true);
  };
  const save = async()=>{
    if(!form.cliente_nome||!form.brand||!form.modello){showToast?showToast('Cliente, marca e modello obbligatori','error'):alert('Campi obbligatori');return;}
    setSaving(true);
    try{
      const url = editing?BASE+'/prenotazioni-ordini/'+editing.id:BASE+'/prenotazioni-ordini';
      const res = await fetch(url,{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      if(!res.ok) throw new Error(await res.text());
      showToast&&showToast(editing?'Aggiornata':'Creata');
      setModal(false);load();
    }catch(e){showToast?showToast('Errore: '+e.message,'error'):alert(e.message);}
    setSaving(false);
  };
  const del = async id=>{
    if(!confirm('Eliminare?')) return;
    await fetch(BASE+'/prenotazioni-ordini/'+id,{method:'DELETE'});
    showToast&&showToast('Eliminata');load();
  };
  const count = k=>list.filter(p=>p.stato===k).length;

  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20,fontWeight:700,color:'#e2e8f0',margin:0 }}>Prenotazione Ordini</h1>
          <p style={{ fontSize:13,color:'#475569',marginTop:3 }}>Gestione ricambi per riparazioni</p>
        </div>
        <button onClick={openNew} style={{ fontSize:13,fontWeight:600,padding:'8px 18px',borderRadius:8,border:'none',background:'#22c55e',color:'white',cursor:'pointer',fontFamily:'inherit' }}>+ Nuova prenotazione</button>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:18 }}>
        {STATI.map(s=>(
          <div key={s.key} onClick={()=>setFiltro(filtro===s.key?'':s.key)} style={{ background:filtro===s.key?s.bg:'rgba(255,255,255,0.03)',border:'1px solid '+(filtro===s.key?s.text:'rgba(255,255,255,0.08)'),borderRadius:10,padding:14,cursor:'pointer',textAlign:'center',transition:'all .15s' }}>
            <div style={{ fontSize:22,fontWeight:700,color:filtro===s.key?s.text:'#e2e8f0' }}>{count(s.key)}</div>
            <div style={{ fontSize:12,color:'#475569',marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca cliente, brand, modello, ricambio..." style={{ width:'100%',marginBottom:14,fontSize:13,padding:'9px 12px',borderRadius:8,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.04)',color:'#e2e8f0',fontFamily:'inherit',boxSizing:'border-box' }}/>
      <div style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12 }}>
        {loading?<div style={{ padding:'2.5rem',textAlign:'center',color:'#475569' }}>Caricamento...</div>:
        list.length===0?<div style={{ padding:'2.5rem',textAlign:'center',color:'rgba(255,255,255,0.25)' }}><div style={{ fontSize:30,marginBottom:8 }}>📦</div><div>Nessuna prenotazione trovata</div><button onClick={openNew} style={{ marginTop:12,fontSize:13,padding:'7px 16px',borderRadius:8,border:'1px solid rgba(255,255,255,0.12)',background:'transparent',color:'#60a5fa',cursor:'pointer',fontFamily:'inherit' }}>Crea la prima</button></div>:
        list.map(p=><Riga key={p.id} p={p} onEdit={openEdit} onDelete={del}/>)}
      </div>
      {modal&&(
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'center',overflowY:'auto',padding:'2rem 1rem' }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:'#090e1e',borderRadius:14,width:'100%',maxWidth:680,border:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ padding:'1.25rem 1.5rem .5rem',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <h2 style={{ fontSize:17,fontWeight:600,color:'#e2e8f0',margin:0 }}>{editing?'Modifica prenotazione':'Nuova prenotazione'}</h2>
              <button onClick={()=>setModal(false)} style={{ fontSize:18,background:'none',border:'none',cursor:'pointer',color:'#475569' }}>x</button>
            </div>
            <FormPren form={form} set={setForm} clienti={clienti} onSave={save} onCancel={()=>setModal(false)} saving={saving}/>
          </div>
        </div>
      )}
    </div>
  );
              }
