import { useState, useEffect } from 'react'
function load(k,d){try{const s=localStorage.getItem(k);return s?JSON.parse(s):d;}catch{return d;}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
const DEF_TIPI=[{id:'sblocco',icon:'🔓',nome:'Sblocco dispositivo',desc:'Sblocco operatore, codici unlock',prezzo_base:25},{id:'diagnostica',icon:'🔍',nome:'Diagnostica',desc:'Test funzionalita, valutazione problemi',prezzo_base:15},{id:'aggiornamento',icon:'⬆️',nome:'Aggiornamento SW',desc:'iOS, Android, firmware update',prezzo_base:20},{id:'backup',icon:'💾',nome:'Backup/Ripristino',desc:'Salvataggio e recupero dati',prezzo_base:30},{id:'pellicola',icon:'🛡️',nome:'Applicazione pellicola',desc:'Installazione vetri temperati',prezzo_base:10},{id:'pulizia',icon:'🯽',nome:'Pulizia/Manutenzione',desc:'Pulizia interna/esterna',prezzo_base:15},{id:'configurazione',icon:'⚙️',nome:'Configurazione',desc:'Setup iniziale, trasferimento dati',prezzo_base:25},{id:'altro',icon:'🔧',nome:'Altro servizio',desc:'Servizio personalizzato',prezzo_base:20}]
const DEF_COP=['Garanzia estesa','Danni accidentali','Rottura schermo','Sostituzione pezzi','Furto / Smarrimento','Assistenza prioritaria']
const EMOJIS=['🔧','🔓','🔍','💾','🛡️','🯽','⚙️','⬆️','📱','🔋','💡','🖥️','⌨️','📷','🎮','🎧','📡','🔌','💳','⚡️']

// === STILI GLOBALI ===
const F='Inter,sans-serif'
const INP={background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:10,padding:'10px 14px',color:'#f1f5f9',fontSize:14,width:'100%',boxSizing:'border-box',outline:'none',fontFamily:F,transition:'border-color .2s'}
const BBLU={padding:'9px 20px',borderRadius:10,background:'#3b82f6',border:'none',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:F,transition:'opacity .15s'}
const BGRY={padding:'9px 16px',borderRadius:10,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',fontSize:13,cursor:'pointer',fontFamily:F}
const LBL={fontSize:11,color:'rgba(255,255,255,0.35)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',display:'block',marginBottom:6}

// === COMPONENTI UI ===
function IconBox({emoji,bg,size=44}){
  return(<div style={{width:size,height:size,borderRadius:size*0.23,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.48,flexShrink:0,boxShadow:'0 2px 8px rgba(0,0,0,0.3)'}}>
    {emoji}
  </div>)
}

function SettRow({icon,iconBg,label,sub,value,badge,onPress,last,disabled}){
  const [hover,setHover]=useState(false)
  return(<div
    onClick={disabled?null:onPress}
    onMouseEnter={()=>!disabled&&setHover(true)}
    onMouseLeave={()=>setHover(false)}
    style={{display:'flex',alignItems:'center',gap:14,padding:'11px 16px',
      background:hover&&!disabled?'rgba(255,255,255,0.05)':'transparent',
      borderBottom:last?'none':'1px solid rgba(255,255,255,0.05)',
      cursor:disabled?'default':'pointer',transition:'background .15s',
      fontFamily:F}}>
    {icon&&<IconBox emoji={icon} bg={iconBg||'#334155'} size={36}/>}
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:14,color:disabled?'#475569':'#f1f5f9',fontWeight:500,lineHeight:1.3}}>{label}</div>
      {sub&&<div style={{fontSize:12,color:'#64748b',marginTop:2,lineHeight:1.3}}>{sub}</div>}
    </div>
    <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
      {badge&&<span style={{padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:700,background:'rgba(59,130,246,0.2)',color:'#60a5fa'}}>{badge}</span>}
      {value&&<span style={{fontSize:13,color:'#64748b'}}>{value}</span>}
      {!disabled&&<span style={{color:'#334155',fontSize:20,fontWeight:300,lineHeight:1,transform:hover?'translateX(2px)':'none',transition:'transform .15s'}}>{'›'}</span>}
    </div>
  </div>)
}

function Section({title,children}){
  return(<div style={{marginBottom:8}}>
    {title&&<div style={{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.1em',padding:'0 6px 8px',fontFamily:F}}>{title}</div>}
    <div style={{borderRadius:14,overflow:'hidden',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 2px 12px rgba(0,0,0,0.2)'}}>
      {children}
    </div>
  </div>)
}

function PgH({title,sub,onBack,btn}){
  return(<div style={{marginBottom:28}}>
    <button onClick={onBack} style={{...BGRY,padding:'6px 14px',fontSize:13,marginBottom:16,display:'flex',alignItems:'center',gap:6}}>
      {'< '} Impostazioni
    </button>
    <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
      <div>
        <h1 style={{fontSize:26,fontWeight:800,color:'#f1f5f9',margin:0,letterSpacing:'-0.5px'}}>{title}</h1>
        {sub&&<div style={{fontSize:13,color:'#64748b',marginTop:4}}>{sub}</div>}
      </div>
      {btn}
    </div>
  </div>)
}

// === SOTTOPAGINA TIPI SERVIZIO ===
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
  const elimina=(id)=>{if(!confirm('Eliminare questo tipo di servizio?'))return;const n=tipi.filter(t=>t.id!==id);setTipi(n);save('tipi_servizio',n);showToast('Tipo eliminato')}
  const apri=(tipo)=>{if(tipo){setEditItem(tipo);setForm({nome:tipo.nome,icon:tipo.icon,desc:tipo.desc||'',prezzo_base:String(tipo.prezzo_base),tab:'emoji'})}else{setEditItem(null);setForm({nome:'',icon:'🔧',desc:'',prezzo_base:'',tab:'emoji'})};setShowForm(true)}
  return(<div style={{fontFamily:F,maxWidth:640,margin:'0 auto'}}>
    <PgH title='Tipi di servizio' sub={'Definisci i servizi disponibili nel wizard di creazione'} onBack={onBack}
      btn={<button onClick={()=>apri(null)} style={{...BBLU,padding:'8px 16px',fontSize:13}}>+ Nuovo tipo</button>}/>
    {showForm&&(
      <div style={{padding:'20px',borderRadius:16,background:'rgba(59,130,246,0.07)',border:'1px solid rgba(59,130,246,0.2)',marginBottom:20,boxShadow:'0 4px 20px rgba(59,130,246,0.1)'}}>
        <div style={{fontSize:15,fontWeight:700,color:'#93c5fd',marginBottom:18}}>{editItem?'Modifica tipo di servizio':'Nuovo tipo di servizio'}</div>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:18,padding:'14px',background:'rgba(255,255,255,0.04)',borderRadius:12}}>
          <div style={{width:60,height:60,borderRadius:14,background:'rgba(59,130,246,0.2)',border:'2px solid rgba(59,130,246,0.5)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
            {form.icon&&form.icon.startsWith('data:')?<img src={form.icon} style={{width:'100%',height:'100%',objectFit:'cover'}} alt='i'/>:<span style={{fontSize:30}}>{form.icon||'🔧'}</span>}
          </div>
          <div><div style={{fontSize:16,fontWeight:700,color:'#f1f5f9',marginBottom:3}}>{form.nome||'Nome servizio'}</div><div style={{fontSize:13,color:'#64748b'}}>{form.desc||'Descrizione breve...'}</div></div>
        </div>
        <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.07)',marginBottom:14}}>
          {[{k:'emoji',l:'😀 Emoji'},{k:'upload',l:'🖼️ Immagine'}].map(({k,l})=>(<button key={k} onClick={()=>setForm(f=>({...f,tab:k}))} style={{padding:'7px 16px',border:'none',cursor:'pointer',fontSize:12,fontWeight:700,background:'transparent',borderBottom:(form.tab||'emoji')===k?'2px solid #3b82f6':'2px solid transparent',color:(form.tab||'emoji')===k?'#60a5fa':'#64748b',transition:'all .2s'}}>{l}</button>))}
        </div>
        {(form.tab||'emoji')==='emoji'&&(<div style={{marginBottom:16}}><div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:6}}>{EMOJIS.map(e=>(<button key={e} onClick={()=>setForm(f=>({...f,icon:e}))} style={{width:38,height:38,borderRadius:10,fontSize:19,cursor:'pointer',border:'2px solid '+(form.icon===e?'#3b82f6':'transparent'),background:form.icon===e?'rgba(59,130,246,0.3)':'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}>{e}</button>))}<input value={form.icon&&!form.icon.startsWith('data:')?form.icon:''} onChange={e=>setForm(f=>({...f,icon:e.target.value}))} style={{width:38,height:38,borderRadius:10,textAlign:'center',fontSize:19,background:'rgba(255,255,255,0.06)',border:'2px solid rgba(255,255,255,0.15)',color:'#f1f5f9',outline:'none'}} maxLength={2} placeholder={'⚙️'}/></div><div style={{fontSize:11,color:'#475569'}}>Seleziona dalla griglia o scrivi la tua emoji personalizzata</div></div>)}
        {(form.tab||'emoji')==='upload'&&(<label style={{display:'block',padding:'20px',borderRadius:12,border:'2px dashed rgba(59,130,246,0.4)',background:'rgba(59,130,246,0.05)',textAlign:'center',cursor:'pointer',marginBottom:16,transition:'background .2s'}}><input type='file' accept='image/*' style={{display:'none'}} onChange={e=>{const file=e.target.files[0];if(!file)return;if(file.size>300*1024){alert('Immagine troppo grande. Max 300KB.');return;}const reader=new FileReader();reader.onload=ev=>setForm(f=>({...f,icon:ev.target.result}));reader.readAsDataURL(file);}}/><div style={{fontSize:28,marginBottom:8}}>🖼️</div><div style={{fontSize:14,color:'#60a5fa',fontWeight:700,marginBottom:4}}>Clicca per caricare un immagine</div><div style={{fontSize:12,color:'#475569'}}>PNG, JPG, SVG, WebP - max 300KB</div></label>)}
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:14,marginBottom:14}}>
          <div><label style={LBL}>Nome servizio *</label><input style={INP} value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder='Es. Sostituzione schermo'/></div>
          <div><label style={LBL}>Prezzo base (euro)</label><input type='number' style={INP} value={form.prezzo_base} onChange={e=>setForm(f=>({...f,prezzo_base:e.target.value}))} placeholder='0' min='0' step='0.5'/></div>
        </div>
        <div style={{marginBottom:18}}><label style={LBL}>Descrizione breve</label><input style={INP} value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder='Es. Ricambio display originale o compatibile'/></div>
        <div style={{display:'flex',gap:10}}><button onClick={salva} style={BBLU}>Salva tipo</button><button onClick={()=>setShowForm(false)} style={BGRY}>Annulla</button></div>
      </div>
    )}
    <div style={{borderRadius:14,overflow:'hidden',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 2px 12px rgba(0,0,0,0.2)'}}>
      {tipi.map((tipo,i)=>(<div key={tipo.id} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 16px',borderBottom:i<tipi.length-1?'1px solid rgba(255,255,255,0.05)':'none',fontFamily:F}}>
        <div style={{width:44,height:44,borderRadius:11,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(59,130,246,0.15)',flexShrink:0}}>
          {tipo.icon&&tipo.icon.startsWith('data:')?<img src={tipo.icon} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={tipo.nome}/>:<span style={{fontSize:24}}>{tipo.icon}</span>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:600,color:'#f1f5f9'}}>{tipo.nome}</div>
          <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{tipo.desc}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
          <div style={{textAlign:'right'}}><div style={{fontSize:10,color:'#475569',marginBottom:1}}>PREZZO BASE</div><div style={{fontFamily:'monospace',fontWeight:700,color:'#34d399',fontSize:16}}>euro {tipo.prezzo_base}</div></div>
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>apri(tipo)} style={{...BGRY,padding:'6px 12px',fontSize:12}}>Modifica</button>
            <button onClick={()=>elimina(tipo.id)} style={{padding:'6px 10px',borderRadius:9,background:'rgba(248,113,113,0.12)',border:'1px solid rgba(248,113,113,0.25)',color:'#f87171',fontSize:12,cursor:'pointer',fontFamily:F}}>Elimina</button>
          </div>
        </div>
      </div>))}
    </div>
  </div>)}

// === SOTTOPAGINA PROTEZIONE ===
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
  const salvaP=async()=>{if(!form.nome||!form.prezzo)return showToast('Campi obbligatori','error');setSaving(true);try{const body=JSON.stringify({...form,prezzo:+form.prezzo,durata_mesi:+form.durata_mesi});if(editItem){await fetch(api+'/piani/'+editItem.id,{method:'PUT',headers:{'Content-Type':'application/json'},body})}else{await fetch(api+'/piani',{method:'POST',headers:{'Content-Type':'application/json'},body})};const res=await fetch(api+'/piani').then(r=>r.json());setPiani(res);setShowForm(false);setEditItem(null);setForm({nome:'',prezzo:'',durata_mesi:'12',coperture:[]});showToast(editItem?'Piano aggiornato':'Piano creato')}catch{showToast('Errore salvataggio','error')}finally{setSaving(false)}}
  const delP=async(id)=>{if(!confirm('Eliminare questo piano di protezione?'))return;await fetch(api+'/piani/'+id,{method:'DELETE'});setPiani(piani.filter(p=>p.id!==id));showToast('Piano eliminato')}
  const togC=(c)=>setForm(f=>({...f,coperture:f.coperture.includes(c)?f.coperture.filter(x=>x!==c):[...f.coperture,c]}))
  const addC=()=>{const n=newCop.trim();if(!n)return;if(cop.includes(n))return showToast('Copertura gia presente','error');const nc=[...cop,n];setCop(nc);save('coperture_disponibili',nc);setNewCop('');showToast('Copertura aggiunta')}
  const delC=(c)=>{if(!confirm('Eliminare la copertura '+c+'?'))return;const nc=cop.filter(x=>x!==c);setCop(nc);save('coperture_disponibili',nc)}
  return(<div style={{fontFamily:F,maxWidth:640,margin:'0 auto'}}>
    <PgH title='Protezione Dispositivo' sub='Gestisci piani e coperture per i tuoi clienti' onBack={onBack}/>
    <div style={{display:'flex',gap:4,marginBottom:20,background:'rgba(255,255,255,0.04)',borderRadius:12,padding:4,border:'1px solid rgba(255,255,255,0.07)'}}>
      {[{k:'piani',l:'📋 Piani'},{k:'coperture',l:'🛡️ Coperture'}].map(({k,l})=>(
        <button key={k} onClick={()=>setSub(k)} style={{flex:1,padding:'9px',borderRadius:9,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,fontFamily:F,transition:'all .2s',background:sub===k?'rgba(255,255,255,0.1)':'transparent',color:sub===k?'#f1f5f9':'#64748b',boxShadow:sub===k?'0 2px 8px rgba(0,0,0,0.3)':'none'}}>{l}</button>
      ))}
    </div>
    {sub==='piani'&&(<>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
        <button onClick={()=>{setShowForm(true);setEditItem(null);setForm({nome:'',prezzo:'',durata_mesi:'12',coperture:[]})}} style={{...BBLU,padding:'8px 16px'}}>+ Nuovo piano</button>
      </div>
      {showForm&&(<div style={{padding:'20px',borderRadius:16,background:'rgba(59,130,246,0.07)',border:'1px solid rgba(59,130,246,0.2)',marginBottom:20}}>
        <div style={{fontSize:15,fontWeight:700,color:'#93c5fd',marginBottom:18}}>{editItem?'Modifica piano':'Nuovo piano di protezione'}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:14}}>
          <div><label style={LBL}>Nome *</label><input style={INP} value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder='Es. Protezione Plus'/></div>
          <div><label style={LBL}>Prezzo euro/anno *</label><input type='number' style={INP} value={form.prezzo} onChange={e=>setForm(f=>({...f,prezzo:e.target.value}))} placeholder='12.90' step='0.01'/></div>
          <div><label style={LBL}>Durata</label><select style={INP} value={form.durata_mesi} onChange={e=>setForm(f=>({...f,durata_mesi:e.target.value}))}>{[6,12,24,36].map(m=><option key={m} value={m}>{m} mesi</option>)}</select></div>
        </div>
        <div style={{marginBottom:18}}><label style={LBL}>Coperture incluse</label><div style={{display:'flex',flexWrap:'wrap',gap:8}}>{cop.map(c=><button key={c} onClick={()=>togC(c)} style={{padding:'6px 14px',borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:600,background:form.coperture.includes(c)?'rgba(59,130,246,0.25)':'rgba(255,255,255,0.05)',border:'1px solid '+(form.coperture.includes(c)?'#3b82f6':'rgba(255,255,255,0.1)'),color:form.coperture.includes(c)?'#93c5fd':'#64748b',transition:'all .15s',fontFamily:F}}>{form.coperture.includes(c)?'✓ ':''}{c}</button>)}</div></div>
        <div style={{display:'flex',gap:10}}><button onClick={salvaP} disabled={saving} style={BBLU}>{saving?'Salvataggio...':'Salva piano'}</button><button onClick={()=>setShowForm(false)} style={BGRY}>Annulla</button></div>
      </div>)}
      <div style={{borderRadius:14,overflow:'hidden',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
        {piani.length===0&&<div style={{padding:'40px',textAlign:'center',color:'#475569',fontSize:14}}><div style={{fontSize:32,marginBottom:8}}>📋</div>Nessun piano configurato.<br/><span style={{fontSize:12}}>Crea il primo piano per iniziare.</span></div>}
        {piani.map((p,i)=>(<div key={p.id} style={{padding:'14px 16px',borderBottom:i<piani.length-1?'1px solid rgba(255,255,255,0.05)':'none',fontFamily:F}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:p.coperture?.length?8:0}}>
            <div><div style={{fontSize:15,fontWeight:700,color:'#f1f5f9',marginBottom:3}}>{p.nome}</div><div style={{fontSize:12,color:'#64748b'}}>euro {Number(p.prezzo||0).toFixed(2)}/anno &nbsp;·&nbsp; {p.durata_mesi||12} mesi</div></div>
            <div style={{display:'flex',gap:6}}><button onClick={()=>{setEditItem(p);setForm({nome:p.nome,prezzo:String(p.prezzo||''),durata_mesi:String(p.durata_mesi||12),coperture:p.coperture||[]});setShowForm(true)}} style={{...BGRY,padding:'6px 12px',fontSize:12}}>Modifica</button><button onClick={()=>delP(p.id)} style={{padding:'6px 10px',borderRadius:9,background:'rgba(248,113,113,0.12)',border:'1px solid rgba(248,113,113,0.25)',color:'#f87171',fontSize:12,cursor:'pointer',fontFamily:F}}>Elimina</button></div>
          </div>
          {p.coperture?.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:5}}>{p.coperture.map(c=><span key={c} style={{padding:'3px 10px',borderRadius:12,fontSize:11,background:'rgba(59,130,246,0.15)',color:'#93c5fd',fontWeight:500}}>{c}</span>)}</div>}
        </div>))}
      </div>
    </>)}
    {sub==='coperture'&&(<div>
      <div style={{fontSize:13,color:'#64748b',marginBottom:16,lineHeight:1.6}}>Le coperture definite qui saranno selezionabili quando crei o modifichi un piano di protezione.</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:20}}>
        {cop.map(c=>(<div key={c} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 14px',borderRadius:24,background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.25)',fontFamily:F}}>
          <span style={{fontSize:13,color:'#93c5fd',fontWeight:500}}>{c}</span>
          <button onClick={()=>delC(c)} style={{background:'none',border:'none',cursor:'pointer',color:'#475569',fontSize:18,lineHeight:1,padding:'0 2px',display:'flex',alignItems:'center',transition:'color .15s'}} onMouseEnter={e=>e.target.style.color='#f87171'} onMouseLeave={e=>e.target.style.color='#475569'}>x</button>
        </div>))}
        {cop.length===0&&<div style={{color:'#475569',fontSize:13}}>Nessuna copertura. Aggiungine una.</div>}
      </div>
      <div style={{display:'flex',gap:10}}>
        <input value={newCop} onChange={e=>setNewCop(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addC()} style={{...INP,flex:1}} placeholder='Es. Allagamento, Batteria, Ossidazione...' maxLength={50}/>
        <button onClick={addC} style={{...BBLU,padding:'10px 20px',whiteSpace:'nowrap'}}>+ Aggiungi</button>
      </div>
      <div style={{fontSize:11,color:'#475569',marginTop:8}}>Premi Invio o clicca Aggiungi. Dati salvati localmente in questo browser.</div>
    </div>)}
  </div>)}

// === PAGINA PRINCIPALE ===
export default function Impostazioni({api,showToast}){
  const [page,setPage]=useState(null)
  if(page==='tipi-servizio') return <TipiPage onBack={()=>setPage(null)} showToast={showToast}/>
  if(page==='protezione') return <ProtPage onBack={()=>setPage(null)} showToast={showToast} api={api}/>
  const tipiN=load('tipi_servizio',DEF_TIPI).length
  const copN=load('coperture_disponibili',DEF_COP).length
  return(
    <div style={{maxWidth:580,margin:'0 auto',fontFamily:F}}>
      {/* Header */}
      <div style={{marginBottom:32}}>
        <div style={{fontSize:11,fontWeight:700,color:'#3b82f6',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:8}}>ENOWN / MAGAZZINO</div>
        <h1 style={{fontSize:30,fontWeight:800,color:'#f1f5f9',margin:0,letterSpacing:'-0.5px'}}>Impostazioni</h1>
        <p style={{color:'#64748b',fontSize:14,margin:'6px 0 0',lineHeight:1.5}}>Personalizza il comportamento dell app e configura i tuoi servizi</p>
      </div>

      {/* SEZIONE SERVIZI */}
      <div style={{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.1em',padding:'0 4px 10px',fontFamily:F}}>Servizi</div>
      <Section>
        <SettRow icon='🔧' iconBg='linear-gradient(135deg,#2563eb,#1d4ed8)' label='Tipi di servizio' sub='Icone, nomi e prezzi preimpostati per ogni tipo' badge={tipiN+' tipi'} onPress={()=>setPage('tipi-servizio')}/>
        <SettRow icon='👷' iconBg='linear-gradient(135deg,#7c3aed,#6d28d9)' label='Operatori' sub='Gestisci chi effettua le riparazioni' value='Presto' disabled last/>
      </Section>

      {/* SEZIONE PROTEZIONE */}
      <div style={{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.1em',padding:'20px 4px 10px',fontFamily:F}}>Protezione Dispositivo</div>
      <Section>
        <SettRow icon='📋' iconBg='linear-gradient(135deg,#0891b2,#0e7490)' label='Piani di protezione' sub='Crea e modifica i piani offerti ai clienti' onPress={()=>setPage('protezione')}/>
        <SettRow icon='🛡️' iconBg='linear-gradient(135deg,#059669,#047857)' label='Coperture disponibili' sub='Definisci le coperture selezionabili' badge={copN+' attive'} onPress={()=>setPage('protezione')} last/>
      </Section>

      {/* SEZIONE NEGOZIO */}
      <div style={{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.1em',padding:'20px 4px 10px',fontFamily:F}}>Negozio</div>
      <Section>
        <SettRow icon='🏪' iconBg='linear-gradient(135deg,#d97706,#b45309)' label='Informazioni negozio' sub='Nome, indirizzo, partita IVA, logo' value='Presto' disabled/>
        <SettRow icon='🖨️' iconBg='linear-gradient(135deg,#6366f1,#4f46e5)' label='Stampa e documenti' sub='Template per fatture, ricevute e PDF' value='Presto' disabled/>
        <SettRow icon='💰' iconBg='linear-gradient(135deg,#16a34a,#15803d)' label='Metodi di pagamento' sub='Contanti, POS, bonifico, rate' value='Presto' disabled last/>
      </Section>

      {/* SEZIONE ACCOUNT */}
      <div style={{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.1em',padding:'20px 4px 10px',fontFamily:F}}>Account e sicurezza</div>
      <Section>
        <SettRow icon='👤' iconBg='linear-gradient(135deg,#64748b,#475569)' label='Profilo' sub='Nome, email, ruolo' value='Presto' disabled/>
        <SettRow icon='🔔' iconBg='linear-gradient(135deg,#dc2626,#b91c1c)' label='Notifiche' sub='Email, avvisi e promemoria' value='Presto' disabled/>
        <SettRow icon='🔒' iconBg='linear-gradient(135deg,#374151,#1f2937)' label='Sicurezza' sub='Password, autenticazione, sessioni' value='Presto' disabled last/>
      </Section>

      <div style={{marginTop:32,padding:'14px 18px',borderRadius:14,background:'rgba(59,130,246,0.05)',border:'1px solid rgba(59,130,246,0.12)',display:'flex',alignItems:'center',gap:12}}>
        <span style={{fontSize:22}}>'🚀'</span>
        <div><div style={{fontSize:13,fontWeight:600,color:'#93c5fd',marginBottom:2}}>Piu funzioni in arrivo</div><div style={{fontSize:12,color:'#475569'}}>Stiamo lavorando a nuove sezioni: integrazioni, report avanzati e gestione multi-negozio.</div></div>
      </div>
    </div>
  )
}
