import { useState, useEffect } from 'react'
function load(k,d){try{const s=localStorage.getItem(k);return s?JSON.parse(s):d;}catch{return d;}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
const DEF_TIPI=[{id:'sblocco',icon:'🔓',nome:'Sblocco dispositivo',desc:'Sblocco operatore',prezzo_base:25},{id:'diagnostica',icon:'🔍',nome:'Diagnostica',desc:'Test funzionalita',prezzo_base:15},{id:'aggiornamento',icon:'⬆️',nome:'Aggiornamento SW',desc:'iOS/Android update',prezzo_base:20},{id:'backup',icon:'💾',nome:'Backup/Ripristino',desc:'Salvataggio dati',prezzo_base:30},{id:'pellicola',icon:'🛡️',nome:'Applicazione pellicola',desc:'Vetri temperati',prezzo_base:10},{id:'pulizia',icon:'🯽',nome:'Pulizia/Manutenzione',desc:'Pulizia dispositivo',prezzo_base:15},{id:'configurazione',icon:'⚙️',nome:'Configurazione',desc:'Setup iniziale',prezzo_base:25},{id:'altro',icon:'🔧',nome:'Altro servizio',desc:'Servizio personalizzato',prezzo_base:20}]
const DEF_COP=['Garanzia estesa','Danni accidentali','Rottura schermo','Sostituzione pezzi','Furto / Smarrimento','Assistenza prioritaria']
const EMOJIS=['🔧','🔓','🔍','💾','🛡️','🯽','⚙️','⬆️','📱','🔋','💡','🖥️','⌨️','📷','🎮','🎧','📡','🔌','💳','⚡️']
const ROW={display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 18px',background:'rgba(255,255,255,0.04)',cursor:'pointer',fontFamily:'Inter,sans-serif'}
const CARD={borderRadius:12,overflow:'hidden',border:'1px solid rgba(255,255,255,0.07)',marginBottom:8}
const SEC={fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.1em',padding:'20px 18px 8px',fontFamily:'Inter,sans-serif'}
const INP={background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:9,padding:'9px 13px',color:'#f1f5f9',fontSize:13.5,width:'100%',boxSizing:'border-box',outline:'none',fontFamily:'Inter,sans-serif'}
const BBLU={padding:'8px 18px',borderRadius:8,background:'#3b82f6',border:'none',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}
const BGRY={padding:'8px 14px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',fontSize:13,cursor:'pointer',fontFamily:'Inter,sans-serif'}
const LBL={fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.07em',display:'block',marginBottom:5}
function SRow({icon,label,sub,value,onPress,last}){return(<div onClick={onPress} style={{...ROW,borderBottom:last?'none':'1px solid rgba(255,255,255,0.06)'}}><div style={{display:'flex',alignItems:'center',gap:12}}>{icon&&<span style={{fontSize:20,width:28,textAlign:'center'}}>{icon}</span>}<div><div style={{fontSize:14,color:'#f1f5f9',fontWeight:500}}>{label}</div>{sub&&<div style={{fontSize:12,color:'#64748b',marginTop:1}}>{sub}</div>}</div></div><div style={{display:'flex',alignItems:'center',gap:8}}>{value&&<span style={{fontSize:12,color:'#64748b'}}>{value}</span>}<span style={{color:'#475569',fontSize:18}}>{'>'}</span></div></div>)}
function PgH({title,onBack,btn}){return(<div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}><button onClick={onBack} style={{...BGRY,padding:'6px 14px',fontSize:18,lineHeight:1}}>{'<'}</button><h2 style={{fontSize:18,fontWeight:700,color:'#f1f5f9',margin:0,flex:1}}>{title}</h2>{btn}</div>)}
function TipiPage({onBack,showToast}){
  const [tipi,setTipi]=useState(()=>load('tipi_servizio',DEF_TIPI))
  const [showForm,setShowForm]=useState(false)
  const [editItem,setEditItem]=useState(null)
  const [form,setForm]=useState({nome:'',icon:'🔧',desc:'',prezzo_base:'',tab:'emoji'})
  const salva=()=>{
    if(!form.nome.trim())return showToast('Nome obbligatorio','error')
    let nuovi
    if(editItem){nuovi=tipi.map(t=>t.id===editItem.id?{...editItem,...form,prezzo_base:+form.prezzo_base}:t)}
    else{const id=form.nome.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')+'-'+Date.now().toString(36);nuovi=[...tipi,{id,...form,prezzo_base:+form.prezzo_base}]}
    setTipi(nuovi);save('tipi_servizio',nuovi);setShowForm(false);setEditItem(null);setForm({nome:'',icon:'🔧',desc:'',prezzo_base:'',tab:'emoji'})
    showToast(editItem?'Tipo aggiornato':'Tipo aggiunto')
  }
  const elimina=(id)=>{if(!confirm('Eliminare?'))return;const n=tipi.filter(t=>t.id!==id);setTipi(n);save('tipi_servizio',n);showToast('Eliminato')}
  const apri=(tipo)=>{if(tipo){setEditItem(tipo);setForm({nome:tipo.nome,icon:tipo.icon,desc:tipo.desc||'',prezzo_base:String(tipo.prezzo_base),tab:'emoji'})}else{setEditItem(null);setForm({nome:'',icon:'🔧',desc:'',prezzo_base:'',tab:'emoji'})};setShowForm(true)}
  return(<div style={{fontFamily:'Inter,sans-serif'}}>
    <PgH title='Tipi di servizio' onBack={onBack} btn={<button onClick={()=>apri(null)} style={{...BBLU,padding:'7px 14px',fontSize:13}}>+ Nuovo</button>}/>
    {showForm&&(<div style={{padding:'16px 18px',borderRadius:12,background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.25)',marginBottom:16}}>
      <div style={{fontSize:13,fontWeight:700,color:'#60a5fa',marginBottom:14}}>{editItem?'Modifica tipo':'Nuovo tipo'}</div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
        <div style={{width:52,height:52,borderRadius:10,background:'rgba(255,255,255,0.08)',border:'2px solid rgba(59,130,246,0.4)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
          {form.icon&&form.icon.startsWith('data:')?<img src={form.icon} style={{width:'100%',height:'100%',objectFit:'cover'}} alt='i'/>:<span style={{fontSize:26}}>{form.icon||'🔧'}</span>}
        </div>
        <div style={{fontSize:12,color:'#94a3b8'}}>Anteprima</div>
      </div>
      <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.07)',marginBottom:10}}>
        {[{k:'emoji',l:'Emoji'},{k:'upload',l:'Immagine'}].map(({k,l})=>(<button key={k} onClick={()=>setForm(f=>({...f,tab:k}))} style={{padding:'6px 14px',border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:'transparent',borderBottom:(form.tab||'emoji')===k?'2px solid #3b82f6':'2px solid transparent',color:(form.tab||'emoji')===k?'#60a5fa':'#64748b'}}>{l}</button>))}
      </div>
      {(form.tab||'emoji')==='emoji'&&(<div style={{marginBottom:12}}><div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:4}}>{EMOJIS.map(e=>(<button key={e} onClick={()=>setForm(f=>({...f,icon:e}))} style={{width:34,height:34,borderRadius:8,fontSize:17,cursor:'pointer',border:'1px solid '+(form.icon===e?'#3b82f6':'rgba(255,255,255,0.1)'),background:form.icon===e?'rgba(59,130,246,0.4)':'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center'}}>{e}</button>))}<input value={form.icon&&!form.icon.startsWith('data:')?form.icon:''} onChange={e=>setForm(f=>({...f,icon:e.target.value}))} style={{width:38,height:34,borderRadius:8,textAlign:'center',fontSize:17,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.2)',color:'#f1f5f9',outline:'none'}} maxLength={2}/></div><div style={{fontSize:10,color:'#475569'}}>Seleziona o scrivi emoji</div></div>)}
      {(form.tab||'emoji')==='upload'&&(<label style={{display:'block',padding:'16px',borderRadius:10,border:'2px dashed rgba(59,130,246,0.3)',background:'rgba(59,130,246,0.04)',textAlign:'center',cursor:'pointer',marginBottom:12}}><input type='file' accept='image/*' style={{display:'none'}} onChange={e=>{const file=e.target.files[0];if(!file)return;if(file.size>300*1024){alert('Max 300KB');return;}const reader=new FileReader();reader.onload=ev=>setForm(f=>({...f,icon:ev.target.result}));reader.readAsDataURL(file);}}/><div style={{fontSize:13,color:'#60a5fa',fontWeight:600,marginBottom:4}}>Clicca per caricare un immagine</div><div style={{fontSize:11,color:'#475569'}}>PNG, JPG, SVG, WebP - max 300KB</div></label>)}
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12,marginBottom:12}}>
        <div><label style={LBL}>Nome *</label><input style={INP} value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder='Es. Sostituzione schermo'/></div>
        <div><label style={LBL}>Prezzo base (euro)</label><input type='number' style={INP} value={form.prezzo_base} onChange={e=>setForm(f=>({...f,prezzo_base:e.target.value}))} placeholder='0' min='0' step='0.5'/></div>
      </div>
      <div style={{marginBottom:14}}><label style={LBL}>Descrizione breve</label><input style={INP} value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder='Es. Ricambio display originale'/></div>
      <div style={{display:'flex',gap:8}}><button onClick={salva} style={BBLU}>Salva</button><button onClick={()=>setShowForm(false)} style={BGRY}>Annulla</button></div>
    </div>)}
    <div style={CARD}>{tipi.map((tipo,i)=>(<div key={tipo.id} style={{...ROW,cursor:'default',borderBottom:i<tipi.length-1?'1px solid rgba(255,255,255,0.06)':'none'}}><div style={{display:'flex',alignItems:'center',gap:14,flex:1}}><div style={{width:40,height:40,borderRadius:8,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.06)',flexShrink:0}}>{tipo.icon&&tipo.icon.startsWith('data:')?<img src={tipo.icon} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={tipo.nome}/>:<span style={{fontSize:22}}>{tipo.icon}</span>}</div><div><div style={{fontSize:14,fontWeight:600,color:'#f1f5f9'}}>{tipo.nome}</div><div style={{fontSize:12,color:'#64748b',marginTop:1}}>{tipo.desc}</div></div></div><div style={{display:'flex',alignItems:'center',gap:10}}><span style={{fontFamily:'monospace',fontWeight:700,color:'#34d399',fontSize:13}}>euro {tipo.prezzo_base}</span><button onClick={()=>apri(tipo)} style={{...BGRY,padding:'5px 10px',fontSize:12}}>Modifica</button><button onClick={()=>elimina(tipo.id)} style={{padding:'5px 10px',borderRadius:7,background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.2)',color:'#f87171',fontSize:12,cursor:'pointer'}}>Elimina</button></div></div>))}</div>
  </div>)}
function ProtPage({onBack,showToast,api}){
  const [piani,setPiani]=useState([])
  const [cop,setCop]=useState(()=>load('coperture_disponibili',DEF_COP))
  const [showForm,setShowForm]=useState(false)
  const [editItem,setEditItem]=useState(null)
  const [form,setForm]=useState({nome:'',prezzo:'',durata_mesi:'12',coperture:[]})
  const [saving,setSaving]=useState(false)
  const [newCop,setNewCop]=useState('')
  const [sub,setSub]=useState('piani')
  useEffect(()=>{fetch(api+'/piani').then(r=>r.ok?r.json():[]).then(setPiani).catch(()=>{});},[api])
  const salvaP=async()=>{if(!form.nome||!form.prezzo)return showToast('Campi obbligatori','error');setSaving(true);try{const body=JSON.stringify({...form,prezzo:+form.prezzo,durata_mesi:+form.durata_mesi});if(editItem){await fetch(api+'/piani/'+editItem.id,{method:'PUT',headers:{'Content-Type':'application/json'},body})}else{await fetch(api+'/piani',{method:'POST',headers:{'Content-Type':'application/json'},body})};const res=await fetch(api+'/piani').then(r=>r.json());setPiani(res);setShowForm(false);setEditItem(null);setForm({nome:'',prezzo:'',durata_mesi:'12',coperture:[]});showToast(editItem?'Piano aggiornato':'Piano creato')}catch{showToast('Errore','error')}finally{setSaving(false)}}
  const delP=async(id)=>{if(!confirm('Eliminare?'))return;await fetch(api+'/piani/'+id,{method:'DELETE'});setPiani(piani.filter(p=>p.id!==id));showToast('Eliminato')}
  const togC=(c)=>setForm(f=>({...f,coperture:f.coperture.includes(c)?f.coperture.filter(x=>x!==c):[...f.coperture,c]}))
  const addC=()=>{const n=newCop.trim();if(!n)return;if(cop.includes(n))return showToast('Gia presente','error');const nc=[...cop,n];setCop(nc);save('coperture_disponibili',nc);setNewCop('');showToast('Aggiunta')}
  const delC=(c)=>{if(!confirm('Eliminare?'))return;const nc=cop.filter(x=>x!==c);setCop(nc);save('coperture_disponibili',nc)}
  return(<div style={{fontFamily:'Inter,sans-serif'}}>
    <PgH title='Protezione Dispositivo' onBack={onBack}/>
    <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.07)',marginBottom:16}}>{[{k:'piani',l:'Piani'},{k:'coperture',l:'Coperture'}].map(({k,l})=>(<button key={k} onClick={()=>setSub(k)} style={{padding:'8px 18px',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,background:'transparent',borderBottom:sub===k?'2px solid #3b82f6':'2px solid transparent',color:sub===k?'#e2e8f0':'#64748b'}}>{l}</button>))}</div>
    {sub==='piani'&&(<><div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}><button onClick={()=>{setShowForm(true);setEditItem(null);setForm({nome:'',prezzo:'',durata_mesi:'12',coperture:[]})}} style={{...BBLU,padding:'7px 14px'}}>+ Nuovo piano</button></div>
    {showForm&&(<div style={{padding:'16px 18px',borderRadius:12,background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.25)',marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:'#60a5fa',marginBottom:14}}>{editItem?'Modifica':'Nuovo piano'}</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}><div><label style={LBL}>Nome *</label><input style={INP} value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder='Es. Protezione Plus'/></div><div><label style={LBL}>Prezzo euro/anno *</label><input type='number' style={INP} value={form.prezzo} onChange={e=>setForm(f=>({...f,prezzo:e.target.value}))} placeholder='12.90' step='0.01'/></div><div><label style={LBL}>Durata</label><select style={INP} value={form.durata_mesi} onChange={e=>setForm(f=>({...f,durata_mesi:e.target.value}))}>{[6,12,24,36].map(m=><option key={m} value={m}>{m} mesi</option>)}</select></div></div><div style={{marginBottom:14}}><label style={LBL}>Coperture incluse</label><div style={{display:'flex',flexWrap:'wrap',gap:8}}>{cop.map(c=><button key={c} onClick={()=>togC(c)} style={{padding:'5px 12px',borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:600,background:form.coperture.includes(c)?'rgba(59,130,246,0.3)':'rgba(255,255,255,0.06)',border:'1px solid '+(form.coperture.includes(c)?'#3b82f6':'rgba(255,255,255,0.1)'),color:form.coperture.includes(c)?'#93c5fd':'#94a3b8'}}>{form.coperture.includes(c)?'v ':''}{c}</button>)}</div></div><div style={{display:'flex',gap:8}}><button onClick={salvaP} disabled={saving} style={BBLU}>{saving?'Salvataggio...':'Salva'}</button><button onClick={()=>setShowForm(false)} style={BGRY}>Annulla</button></div></div>)}
    <div style={CARD}>{piani.length===0&&<div style={{padding:'30px',textAlign:'center',color:'#475569',fontSize:13}}>Nessun piano configurato</div>}{piani.map((p,i)=>(<div key={p.id} style={{...ROW,cursor:'default',borderBottom:i<piani.length-1?'1px solid rgba(255,255,255,0.06)':'none'}}><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:'#f1f5f9'}}>{p.nome}</div><div style={{fontSize:12,color:'#64748b',marginTop:2}}>euro {Number(p.prezzo||0).toFixed(2)}/anno - {p.durata_mesi||12} mesi</div>{p.coperture?.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:6}}>{p.coperture.map(c=><span key={c} style={{padding:'2px 8px',borderRadius:12,fontSize:10,background:'rgba(59,130,246,0.15)',color:'#93c5fd'}}>{c}</span>)}</div>}</div><div style={{display:'flex',gap:6}}><button onClick={()=>{setEditItem(p);setForm({nome:p.nome,prezzo:String(p.prezzo||''),durata_mesi:String(p.durata_mesi||12),coperture:p.coperture||[]});setShowForm(true)}} style={{...BGRY,padding:'5px 10px',fontSize:12}}>Modifica</button><button onClick={()=>delP(p.id)} style={{padding:'5px 10px',borderRadius:7,background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.2)',color:'#f87171',fontSize:12,cursor:'pointer'}}>Elimina</button></div></div>))}</div></>)}
    {sub==='coperture'&&(<div><div style={{fontSize:13,color:'#64748b',marginBottom:16}}>Coperture selezionabili nei piani di protezione.</div><div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>{cop.map(c=>(<div key={c} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:20,background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.25)'}}><span style={{fontSize:13,color:'#93c5fd'}}>{c}</span><button onClick={()=>delC(c)} style={{background:'none',border:'none',cursor:'pointer',color:'#64748b',fontSize:16,lineHeight:1,padding:'0 2px'}}>x</button></div>))}</div><div style={{display:'flex',gap:8}}><input value={newCop} onChange={e=>setNewCop(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addC()} style={{...INP,flex:1}} placeholder='Es. Allagamento, Batteria...' maxLength={50}/><button onClick={addC} style={{...BBLU,padding:'9px 18px',whiteSpace:'nowrap'}}>+ Aggiungi</button></div><div style={{fontSize:11,color:'#475569',marginTop:8}}>Salvate localmente in questo browser.</div></div>)}
  </div>)}
export default function Impostazioni({api,showToast}){
  const [page,setPage]=useState(null)
  if(page==='tipi-servizio') return <TipiPage onBack={()=>setPage(null)} showToast={showToast}/>
  if(page==='protezione') return <ProtPage onBack={()=>setPage(null)} showToast={showToast} api={api}/>
  const tipiN=load('tipi_servizio',DEF_TIPI).length
  const copN=load('coperture_disponibili',DEF_COP).length
  return(<div style={{maxWidth:640,margin:'0 auto',fontFamily:'Inter,sans-serif'}}>
    <h2 style={{fontSize:22,fontWeight:700,color:'#f1f5f9',margin:'0 0 4px'}}>Impostazioni</h2>
    <p style={{color:'#475569',fontSize:13,margin:'0 0 24px'}}>Configura il comportamento dell app</p>
    <div style={SEC}>Servizi</div>
    <div style={CARD}>
      <SRow icon='🔧' label='Tipi di servizio' sub='Icone, nomi e prezzi preimpostati' value={tipiN+' tipi'} onPress={()=>setPage('tipi-servizio')}/>
      <SRow icon='👷' label='Operatori' sub='Gestisci gli operatori del negozio' value='Presto' last/>
    </div>
    <div style={SEC}>Protezione Dispositivo</div>
    <div style={CARD}>
      <SRow icon='📋' label='Piani di protezione' sub='Crea e modifica i piani disponibili' onPress={()=>setPage('protezione')}/>
      <SRow icon='🛡️' label='Coperture disponibili' sub={copN+' coperture configurate'} onPress={()=>setPage('protezione')} last/>
    </div>
    <div style={SEC}>Negozio</div>
    <div style={CARD}>
      <SRow icon='🏪' label='Informazioni negozio' sub='Nome, indirizzo, dati fiscali' value='Presto' onPress={()=>{}}/>
      <SRow icon='🖨️' label='Stampa e documenti' sub='Template fatture e PDF' value='Presto' onPress={()=>{}} last/>
    </div>
    <div style={SEC}>Account</div>
    <div style={CARD}>
      <SRow icon='👤' label='Profilo' sub='Nome, email, password' value='Presto' onPress={()=>{}}/>
      <SRow icon='🔔' label='Notifiche' sub='Email e avvisi' value='Presto' onPress={()=>{}} last/>
    </div>
    <div style={{marginTop:28,padding:'14px',borderRadius:12,background:'rgba(255,255,255,0.02)',border:'1px dashed rgba(255,255,255,0.08)',color:'#475569',fontSize:13,textAlign:'center'}}>Altre impostazioni in arrivo</div>
  </div>)
}
