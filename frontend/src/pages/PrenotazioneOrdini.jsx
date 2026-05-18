import { useState, useEffect, useCallback } from 'react';
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const ASSISTENZE=[
{cat:'Display e vetro',items:[{label:'Sostituzione Vetro e Display',orig:false,fonedayQ:'display'},{label:'Sostituzione Vetro e Display ORIGINALE',orig:true,fonedayQ:'display'},{label:'Riparazione Vetrino Fotocamera posteriore',orig:false,fonedayQ:'camera lens glass'}]},
{cat:'Batteria',items:[{label:'Sostituzione Batteria',orig:false,fonedayQ:'battery'},{label:'Sostituzione Batteria ORIGINALE',orig:true,fonedayQ:'battery'}]},
{cat:'Fotocamera',items:[{label:'Riparazione Fotocamera Anteriore',orig:false,fonedayQ:'front camera'},{label:'Riparazione Fotocamera Posteriore',orig:false,fonedayQ:'rear camera'}]},
{cat:'Audio',items:[{label:'Riparazione Altoparlante',orig:false,fonedayQ:'speaker'},{label:'Riparazione Suoneria',orig:false,fonedayQ:'speaker buzzer'},{label:'Riparazione Microfono',orig:false,fonedayQ:'microphone'}]},
{cat:'Tasti e connettori',items:[{label:'Riparazione connettore di ricarica',orig:false,fonedayQ:'charging connector port'},{label:'Riparazione tasti volume',orig:false,fonedayQ:'volume button flex'},{label:'Riparazione tasto accensione',orig:false,fonedayQ:'power button flex'},{label:'Riparazione Vibrazione',orig:false,fonedayQ:'vibrator motor'}]},
{cat:'Scocca e pulizia',items:[{label:'Sostituzione Scocca',orig:false,fonedayQ:'back cover housing'},{label:'Pulizia',orig:false,fonedayQ:null},{label:'Pulizia Ossidazione',orig:false,fonedayQ:null}]},
];
const QC={'Service Pack':{bg:'#1e3a5f',text:'#60a5fa'},'Pulled':{bg:'#1a1060',text:'#a78bfa'},'Refurbished':{bg:'#3b1a06',text:'#fb923c'},'OEM-Equivalent':{bg:'#0f3320',text:'#4ade80'},'FDX':{bg:'#1e1060',text:'#818cf8'}};
function qColor(q){for(const[k,v]of Object.entries(QC))if(q&&q.includes(k))return v;return{bg:'rgba(255,255,255,0.06)',text:'#94a3b8'};}
const S={
card:{background:'#0d1526',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14},
inp:{width:'100%',fontSize:13,padding:'7px 10px',borderRadius:7,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.05)',color:'#e2e8f0',fontFamily:'inherit',boxSizing:'border-box'},
lbl:{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.38)',textTransform:'uppercase',letterSpacing:'.07em',display:'block',marginBottom:5},
btnP:{fontSize:13,fontWeight:600,padding:'9px 22px',borderRadius:8,border:'none',background:'#22c55e',color:'white',cursor:'pointer',fontFamily:'inherit'},
btnS:{fontSize:13,padding:'9px 16px',borderRadius:8,border:'1px solid rgba(255,255,255,0.12)',background:'transparent',color:'#94a3b8',cursor:'pointer',fontFamily:'inherit'},
btnG:{fontSize:12,padding:'6px 12px',borderRadius:7,border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:'#94a3b8',cursor:'pointer',fontFamily:'inherit'},
};
const SL=['Cliente','Dispositivo','Assistenza','Ricambio','Caparra','Riepilogo'];
function StepBar({current}){return(<div style={{marginBottom:24}}><div style={{display:'flex',alignItems:'center'}}>{SL.map((l,i)=>(<div key={i} style={{display:'flex',alignItems:'center',flex:i<SL.length-1?1:'none'}}><div style={{width:28,height:28,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:500,zIndex:1,background:i<=current?'#22c55e':'rgba(255,255,255,0.04)',border:i<=current?'2px solid #22c55e':'1px solid rgba(255,255,255,0.12)',color:i<=current?'white':'rgba(255,255,255,0.3)'}}>{i<current?'v':i+1}</div>{i<SL.length-1&&<div style={{flex:1,height:1.5,background:i<current?'#22c55e':'rgba(255,255,255,0.08)'}}/>}</div>))}</div><div style={{display:'flex',marginTop:6}}>{SL.map((l,i)=><div key={i} style={{flex:i<SL.length-1?1:'none',fontSize:10,color:i===current?'#e2e8f0':i<current?'#22c55e':'rgba(255,255,255,0.25)',fontWeight:i===current?600:400}}>{l}</div>)}</div></div>);}
function Card({icon,title,subtitle,children,footer}){return(<div style={S.card}><div style={{padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',gap:10}}><div style={{width:32,height:32,borderRadius:8,background:'rgba(34,197,94,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'#22c55e',flexShrink:0}}>{icon}</div><div><div style={{fontSize:14,fontWeight:600,color:'#e2e8f0'}}>{title}</div>{subtitle&&<div style={{fontSize:12,color:'#475569',marginTop:1}}>{subtitle}</div>}</div></div><div style={{padding:'16px 18px'}}>{children}</div>{footer&&<div style={{padding:'13px 18px',borderTop:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>{footer}</div>}</div>);}
function Step1({onNext,BASE}){
const[q,setQ]=useState('');const[list,setList]=useState([]);const[load,setLoad]=useState(false);const[sel,setSel]=useState(null);const[showNew,setShowNew]=useState(false);const[nC,setNC]=useState({nome:'',cognome:'',telefono:'',email:''});
const search=async v=>{if(!v||v.length<2){setList([]);return;}setLoad(true);try{const r=await fetch(BASE+'/clienti?search='+encodeURIComponent(v));const d=await r.json();setList(Array.isArray(d)?d:(d?.data||[]));}catch(e){}setLoad(false);};
const saveNew=async()=>{if(!nC.nome)return;try{const r=await fetch(BASE+'/clienti',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(nC)});const d=await r.json();setSel(d?.data||d);setShowNew(false);}catch(e){}};
const ini=c=>[c.nome,c.cognome].filter(Boolean).map(s=>s[0]).join('').toUpperCase().slice(0,2);
const fn=c=>[c.nome,c.cognome].filter(Boolean).join(' ');
return(<Card icon="👤" title="Seleziona cliente" subtitle="Cerca nel registro o aggiungi nuovo"
footer={<><span style={{fontSize:12,color:'#475569'}}>{sel?fn(sel):'Nessuno selezionato'}</span><button style={{...S.btnP,opacity:sel?1:.35}} disabled={!sel} onClick={()=>onNext(sel)}>Avanti</button></>}>
{!showNew?(<><div style={{display:'flex',gap:8,marginBottom:12}}>
<input value={q} onChange={e=>{setQ(e.target.value);search(e.target.value);}} placeholder="Cerca per nome, telefono..." style={S.inp}/>
<button onClick={()=>setShowNew(true)} style={{...S.btnG,background:'rgba(34,197,94,0.1)',borderColor:'rgba(34,197,94,0.3)',color:'#22c55e',whiteSpace:'nowrap'}}>+ Nuovo</button>
</div>
{(list.length>0||load)&&(<div style={{border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,overflow:'hidden',maxHeight:240,overflowY:'auto'}}>
{load&&<div style={{padding:'12px 16px',fontSize:13,color:'#475569'}}>Ricerca...</div>}
{list.map(c=>(<div key={c.id} onClick={()=>setSel(c)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,0.05)',cursor:'pointer',background:sel?.id===c.id?'rgba(34,197,94,0.1)':'transparent'}}>
<div style={{width:34,height:34,borderRadius:'50%',background:'rgba(59,130,246,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,color:'#60a5fa',flexShrink:0}}>{ini(c)}</div>
<div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:500,color:'#e2e8f0'}}>{fn(c)}</div><div style={{fontSize:11,color:'#475569'}}>{[c.telefono,c.email].filter(Boolean).join(' - ')}</div></div>
{sel?.id===c.id&&<span style={{color:'#22c55e'}}>✓</span>}
</div>))}
{!load&&list.length===0&&q.length>=2&&<div style={{padding:'12px 16px',fontSize:13,color:'#475569'}}>Nessun cliente - <button onClick={()=>setShowNew(true)} style={{background:'none',border:'none',color:'#22c55e',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>aggiungi nuovo</button></div>}
</div>)}</>):(<div style={{border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'14px 16px'}}>
<div style={{fontSize:13,fontWeight:600,color:'#e2e8f0',marginBottom:12}}>Nuovo cliente</div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
<div><label style={S.lbl}>Nome *</label><input value={nC.nome} onChange={e=>setNC(p=>({...p,nome:e.target.value}))} style={S.inp}/></div>
<div><label style={S.lbl}>Cognome</label><input value={nC.cognome} onChange={e=>setNC(p=>({...p,cognome:e.target.value}))} style={S.inp}/></div>
<div><label style={S.lbl}>Telefono</label><input value={nC.telefono} onChange={e=>setNC(p=>({...p,telefono:e.target.value}))} placeholder="+39..." style={S.inp}/></div>
<div><label style={S.lbl}>Email</label><input value={nC.email} onChange={e=>setNC(p=>({...p,email:e.target.value}))} style={S.inp}/></div>
</div>
<div style={{display:'flex',gap:8}}><button onClick={()=>setShowNew(false)} style={S.btnS}>Annulla</button><button onClick={saveNew} style={{...S.btnP,opacity:nC.nome?1:.4}} disabled={!nC.nome}>Salva cliente</button></div>
</div>)}
</Card>);}
function Step2({cliente,onNext,onBack,BASE}){
const[q,setQ]=useState('');const[devs,setDevs]=useState([]);const[load,setLoad]=useState(false);const[sel,setSel]=useState(null);const[showNew,setShowNew]=useState(false);const[nD,setND]=useState({brand:'',modello:'',colore:'',imei:''});
const BRANDS=['Apple','Samsung','Xiaomi','Huawei','OnePlus','Google','Oppo','Motorola','Nokia','Sony','Altro'];
useEffect(()=>{if(cliente?.id)loadDev();},[cliente]);
const loadDev=async()=>{setLoad(true);try{const r=await fetch(BASE+'/devices?cliente_id='+cliente.id);const d=await r.json();setDevs(Array.isArray(d)?d:Array.isArray(d?.data)?d.data:[]);}catch(e){setDevs([]);}setLoad(false);};
const saveNew=async()=>{if(!nD.brand||!nD.modello)return;try{const body={brand:nD.brand,modello:nD.modello,colore:nD.colore,imei:nD.imei||null,cliente_id:cliente?.id};const r=await fetch(BASE+'/devices',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();const dev=d?.data||d;dev.colore_storage=dev.colore||nD.colore;setSel(dev);setShowNew(false);loadDev();}catch(e){}};
const filt=devs.filter(d=>!q||[d.brand,d.modello,d.imei,d.colore,d.colore_storage].join(' ').toLowerCase().includes(q.toLowerCase()));
const fn=c=>[c.nome,c.cognome].filter(Boolean).join(' ');
const dL=d=>d.brand+' '+d.modello+(d.colore_storage||d.colore?' - '+(d.colore_storage||d.colore):'');
return(<Card icon="📱" title="Dispositivo del cliente" subtitle={'Cliente: '+fn(cliente)}
footer={<><button onClick={onBack} style={S.btnS}>Indietro</button><button style={{...S.btnP,opacity:sel?1:.35}} disabled={!sel} onClick={()=>onNext(sel)}>Avanti</button></>}>
{!showNew?(<><div style={{display:'flex',gap:8,marginBottom:12}}>
<input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filtra per modello..." style={S.inp}/>
<button onClick={()=>setShowNew(true)} style={{...S.btnG,background:'rgba(34,197,94,0.1)',borderColor:'rgba(34,197,94,0.3)',color:'#22c55e',whiteSpace:'nowrap'}}>+ Nuovo</button>
</div>
<div style={{border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,overflow:'hidden',maxHeight:240,overflowY:'auto'}}>
{load&&<div style={{padding:'12px 16px',fontSize:13,color:'#475569'}}>Caricamento...</div>}
{filt.map(d=>(<div key={d.id} onClick={()=>setSel(d)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,0.05)',cursor:'pointer',background:sel?.id===d.id?'rgba(34,197,94,0.1)':'transparent'}}>
<div style={{width:34,height:34,borderRadius:8,background:'rgba(139,92,246,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>📱</div>
<div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:500,color:'#e2e8f0'}}>{dL(d)}</div><div style={{fontSize:11,color:'#475569'}}>{d.imei?'IMEI: '+d.imei:'—'}</div></div>
{sel?.id===d.id&&<span style={{color:'#22c55e'}}>✓</span>}
</div>))}
{!load&&filt.length===0&&<div style={{padding:'16px',textAlign:'center',fontSize:13,color:'#475569'}}>Nessun dispositivo - <button onClick={()=>setShowNew(true)} style={{background:'none',border:'none',color:'#22c55e',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>registra nuovo</button></div>}
</div></>):(<div style={{border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'14px 16px'}}>
<div style={{fontSize:13,fontWeight:600,color:'#e2e8f0',marginBottom:12}}>Nuovo dispositivo</div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
<div><label style={S.lbl}>Marca *</label><select value={nD.brand} onChange={e=>setND(p=>({...p,brand:e.target.value}))} style={S.inp}><option value="">--</option>{BRANDS.map(b=><option key={b}>{b}</option>)}</select></div>
<div><label style={S.lbl}>Modello *</label><input value={nD.modello} onChange={e=>setND(p=>({...p,modello:e.target.value}))} placeholder="es. Reno 13f 5g" style={S.inp}/></div>
<div><label style={S.lbl}>Colore / Storage</label><input value={nD.colore} onChange={e=>setND(p=>({...p,colore:e.target.value}))} placeholder="es. Nero 128GB" style={S.inp}/></div>
<div><label style={S.lbl}>IMEI</label><input value={nD.imei} onChange={e=>setND(p=>({...p,imei:e.target.value}))} placeholder="15 cifre" style={S.inp}/></div>
</div>
<div style={{display:'flex',gap:8}}><button onClick={()=>setShowNew(false)} style={S.btnS}>Annulla</button><button onClick={saveNew} style={{...S.btnP,opacity:nD.brand&&nD.modello?1:.4}} disabled={!nD.brand||!nD.modello}>Salva</button></div>
</div>)}
</Card>);}
function Step3({dispositivo,onNext,onBack}){
const[sel,setSel]=useState(null);
const CB={'Display e vetro':'#0d1e35','Batteria':'#0a1f15','Fotocamera':'#110d35','Audio':'#1f150a','Tasti e connettori':'#1f0d0d','Scocca e pulizia':'#151515'};
return(<Card icon="🔧" title="Tipo di assistenza" subtitle={dispositivo.brand+' '+dispositivo.modello}
footer={<><button onClick={onBack} style={S.btnS}>Indietro</button><button style={{...S.btnP,opacity:sel?1:.35}} disabled={!sel} onClick={()=>onNext(sel)}>{sel?.fonedayQ?'Cerca su Foneday →':'Avanti →'}</button></>}>
{ASSISTENZE.map(cat=>(<div key={cat.cat} style={{marginBottom:14}}>
<div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{cat.cat}</div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
{cat.items.map(item=>{const iS=sel?.label===item.label;return(<button key={item.label} onClick={()=>setSel(item)} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 11px',borderRadius:8,border:'1px solid '+(iS?'#22c55e':'rgba(255,255,255,0.08)'),background:iS?'rgba(34,197,94,0.12)':CB[cat.cat]||'rgba(255,255,255,0.02)',cursor:'pointer',fontFamily:'inherit',fontSize:12.5,color:iS?'#4ade80':'#e2e8f0',textAlign:'left',width:'100%',fontWeight:iS?600:400}}>
<span style={{flex:1}}>{item.label.replace(' ORIGINALE','')}</span>
{item.orig&&<span style={{fontSize:9,fontWeight:600,padding:'1px 5px',borderRadius:20,background:'#FAEEDA',color:'#633806',whiteSpace:'nowrap'}}>ORIG.</span>}
{iS&&<span style={{color:'#22c55e',flexShrink:0}}>✓</span>}
</button>);})}
</div></div>))}
</Card>);}
function Step4({dispositivo,assistenza,onNext,onBack,BASE}){
const autoQ=assistenza.fonedayQ?dispositivo.brand+' '+dispositivo.modello+' '+assistenza.fonedayQ:'';
const[q,setQ]=useState(autoQ);const[res,setRes]=useState([]);const[load,setLoad]=useState(false);const[instock,setInstock]=useState(true);
const[sel,setSel]=useState(null);const[qty,setQty]=useState(1);const[sent,setSent]=useState(false);const[sending,setSending]=useState(false);
const[err,setErr]=useState('');const[manuale,setManuale]=useState('');const[showM,setShowM]=useState(false);
const search=useCallback(async v=>{if(!v||v.trim().length<2)return;setLoad(true);setErr('');try{const r=await fetch(BASE+'/foneday/search?q='+encodeURIComponent(v)+'&instock='+instock);const d=await r.json();if(!r.ok)throw new Error(d.error);setRes(d.products||[]);if(!(d.products?.length))setShowM(true);}catch(e){setErr(e.message);setShowM(true);}setLoad(false);},[instock,BASE]);
useEffect(()=>{if(autoQ)search(autoQ);},[]);
const addCart=async()=>{if(!sel)return;setSending(true);try{const r=await fetch(BASE+'/foneday/cart/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({articles:[{sku:sel.sku,quantity:qty,note:null}]})});if(!r.ok)throw new Error((await r.json()).error);setSent(true);}catch(e){setErr(e.message);}setSending(false);};
const canP=sel||(showM&&manuale.trim().length>0);
const nextV=sel?{...sel,qty,cartSent:sent}:showM&&manuale?{title:manuale,sku:null,price:null,qty:1,cartSent:false,manuale:true}:null;
if(!assistenza.fonedayQ)return(<Card icon="📦" title="Ricambio" subtitle="Intervento senza ricambi dal catalogo" footer={<><button onClick={onBack} style={S.btnS}>Indietro</button><button style={S.btnP} onClick={()=>onNext(null)}>Avanti</button></>}><p style={{fontSize:13,color:'#475569',textAlign:'center',padding:'20px 0'}}>Servizio senza ricambio fisico.</p></Card>);
return(<Card icon="🔍" title="Ricambio da Foneday" subtitle={assistenza.label+' - '+dispositivo.brand+' '+dispositivo.modello}
footer={<><button onClick={onBack} style={S.btnS}>Indietro</button><div style={{display:'flex',gap:8}}><button onClick={()=>{setShowM(true);setSel(null);}} style={{...S.btnG,borderColor:'rgba(251,191,36,0.3)',color:'#fbbf24'}}>✏️ Manuale</button><button style={{...S.btnP,opacity:canP?1:.35}} disabled={!canP} onClick={()=>onNext(nextV)}>Avanti →</button></div></>}>
{err&&<div style={{marginBottom:10,padding:'8px 12px',background:'rgba(248,113,113,0.1)',borderRadius:7,fontSize:12,color:'#f87171'}}>{err}</div>}
<div style={{display:'flex',gap:8,marginBottom:10}}><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search(q)} style={S.inp} placeholder="Cerca nel catalogo Foneday..."/><button onClick={()=>search(q)} disabled={load} style={{...S.btnG,whiteSpace:'nowrap',background:'rgba(99,102,241,0.15)',borderColor:'rgba(99,102,241,0.4)',color:'#818cf8'}}>{load?'...':'Cerca'}</button></div>
<label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#475569',cursor:'pointer',marginBottom:10}}><input type="checkbox" checked={instock} onChange={e=>{setInstock(e.target.checked);search(q);}}/> Solo disponibili</label>
{showM&&(<div style={{marginBottom:10,padding:'12px 14px',background:'rgba(251,191,36,0.06)',border:'1px solid rgba(251,191,36,0.2)',borderRadius:8}}><label style={{...S.lbl,color:'#fbbf24'}}>Ricambio manuale</label><input value={manuale} onChange={e=>{setManuale(e.target.value);setSel(null);}} placeholder="es. Display LCD Oppo Reno 13f Nero Originale" style={{...S.inp,borderColor:'rgba(251,191,36,0.3)'}}/><div style={{fontSize:11,color:'#92400e',marginTop:5}}>Inserisci il ricambio manualmente e premi Avanti.</div></div>)}
<div style={{border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,overflow:'hidden',maxHeight:220,overflowY:'auto'}}>
{load&&<div style={{padding:'16px',textAlign:'center',color:'#475569',fontSize:13}}>Ricerca...</div>}
{res.map(p=>{const qc=qColor(p.quality);const iS=sel?.sku===p.sku;return(<div key={p.sku} onClick={()=>{setSel(p);setSent(false);setManuale('');}} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,0.05)',cursor:'pointer',background:iS?'rgba(34,197,94,0.08)':'transparent',opacity:p.instock==='N'?.5:1}}>
<div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:500,color:'#e2e8f0',marginBottom:3,lineHeight:1.3}}>{p.title}</div><div style={{display:'flex',gap:5}}><span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:p.instock==='Y'?'#0f3320':'#3b0f0f',color:p.instock==='Y'?'#4ade80':'#f87171'}}>{p.instock==='Y'?'Disp.':'No'}</span><span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:qc.bg,color:qc.text}}>{p.quality}</span></div></div>
<div style={{textAlign:'right',flexShrink:0}}><div style={{fontSize:13,fontWeight:600,color:'#e2e8f0'}}>€{p.price?.toFixed(2)}</div>{iS&&<span style={{fontSize:11,color:'#22c55e'}}>✓</span>}</div>
</div>);})}
</div>
{sel&&(<div style={{marginTop:12,padding:'12px 14px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8}}><div style={{fontSize:12,fontWeight:500,color:'#e2e8f0',marginBottom:8}}>{sel.title}</div><div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}><label style={{fontSize:12,color:'#475569'}}>Qty</label><input type="number" value={qty} min={1} onChange={e=>setQty(Number(e.target.value))} style={{...S.inp,width:64}}/><span style={{fontSize:13,fontWeight:600,color:'#22c55e'}}>€{(sel.price*qty).toFixed(2)}</span>{sent?<span style={{fontSize:12,color:'#22c55e',marginLeft:'auto'}}>✓ Carrello Foneday</span>:<button onClick={addCart} disabled={sending} style={{...S.btnP,marginLeft:'auto',fontSize:12,padding:'6px 14px',opacity:sending?.6:1}}>{sending?'...':'Aggiungi al carrello Foneday'}</button>}</div>{sent&&<a href="https://foneday.shop/it/cart" target="_blank" rel="noreferrer" style={{display:'block',marginTop:6,fontSize:11,color:'#6366f1'}}>Apri carrello →</a>}</div>)}
</Card>);}
function Step5({onNext,onBack}){
const[hasCap,setHasCap]=useState(false);const[imp,setImp]=useState('');const[tot,setTot]=useState('');const[met,setMet]=useState('Contanti');const[note,setNote]=useState('');
const saldo=hasCap&&imp&&tot?(parseFloat(tot)-parseFloat(imp)).toFixed(2):null;
return(<Card icon="💵" title="Caparra" subtitle="Importo anticipato dal cliente (opzionale)" footer={<><button onClick={onBack} style={S.btnS}>Indietro</button><button style={S.btnP} onClick={()=>onNext({attiva:hasCap,importo:imp,totale:tot,metodo:met,note})}>Avanti</button></>}>
<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}><span style={{fontSize:13,color:'#e2e8f0'}}>Il cliente ha lasciato una caparra?</span><div style={{display:'flex',gap:6}}>{['Si','No'].map(v=><button key={v} onClick={()=>setHasCap(v==='Si')} style={{fontSize:12,padding:'5px 16px',borderRadius:20,border:'1px solid',cursor:'pointer',fontFamily:'inherit',background:(v==='Si'&&hasCap)||(v==='No'&&!hasCap)?'rgba(34,197,94,0.15)':'transparent',borderColor:(v==='Si'&&hasCap)||(v==='No'&&!hasCap)?'#22c55e':'rgba(255,255,255,0.12)',color:(v==='Si'&&hasCap)||(v==='No'&&!hasCap)?'#4ade80':'#94a3b8'}}>{v}</button>)}</div></div>
{hasCap&&(<><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}><div><label style={S.lbl}>Importo caparra (€)</label><input type="number" value={imp} min={0} step={0.01} onChange={e=>setImp(e.target.value)} placeholder="0.00" style={S.inp}/></div><div><label style={S.lbl}>Totale preventivo (€)</label><input type="number" value={tot} min={0} step={0.01} onChange={e=>setTot(e.target.value)} placeholder="0.00" style={S.inp}/></div></div>
<div style={{display:'flex',gap:8,marginBottom:12}}>{['Contanti','Bonifico'].map(m=><button key={m} onClick={()=>setMet(m)} style={{fontSize:12,padding:'5px 16px',borderRadius:20,border:'1px solid',cursor:'pointer',fontFamily:'inherit',background:met===m?'rgba(34,197,94,0.15)':'transparent',borderColor:met===m?'#22c55e':'rgba(255,255,255,0.12)',color:met===m?'#4ade80':'#94a3b8'}}>{m}</button>)}</div>
<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note caparra..." style={{...S.inp,marginBottom:12}}/>
{saldo!==null&&<div style={{display:'flex',justifyContent:'space-between',padding:'10px 14px',background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:8}}><span style={{fontSize:13,color:'#475569'}}>Saldo residuo</span><span style={{fontSize:14,fontWeight:600,color:'#22c55e'}}>€ {saldo}</span></div>}
</>)}
</Card>);}
function Step6({data,onBack,onSave,saving}){
const{cliente,dispositivo,assistenza,ricambio,caparra}=data;
const fn=c=>[c.nome,c.cognome].filter(Boolean).join(' ');
const dL=d=>d.brand+' '+d.modello+(d.colore_storage||d.colore?' - '+(d.colore_storage||d.colore):'');
const Row=({label,children})=>(<div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}><span style={{fontSize:12,color:'#475569',flexShrink:0,marginRight:16}}>{label}</span><div style={{fontSize:13,fontWeight:500,color:'#e2e8f0',textAlign:'right'}}>{children}</div></div>);
return(<Card icon="✅" title="Riepilogo prenotazione" subtitle="Controlla e conferma" footer={<><button onClick={onBack} style={S.btnS}>Indietro</button><button onClick={onSave} disabled={saving} style={{...S.btnP,opacity:saving?.6:1}}>{saving?'Salvataggio...':'Salva prenotazione'}</button></>}>
<Row label="Cliente">{fn(cliente)}{cliente.telefono?' - '+cliente.telefono:''}</Row>
<Row label="Dispositivo">{dispositivo?dL(dispositivo):'—'}</Row>
<Row label="Assistenza">{assistenza.label}</Row>
{ricambio&&<Row label="Ricambio">{ricambio.manuale&&<span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'rgba(251,191,36,0.15)',color:'#fbbf24',marginRight:6}}>Manuale</span>}{ricambio.title}{ricambio.price&&<span style={{color:'#22c55e',marginLeft:8}}>€{ricambio.price.toFixed(2)} x{ricambio.qty}</span>}</Row>}
{caparra?.attiva&&<Row label="Caparra">€{caparra.importo} {caparra.metodo}{caparra.totale?' - saldo €'+(parseFloat(caparra.totale)-parseFloat(caparra.importo)).toFixed(2):''}</Row>}
<Row label="Stato"><span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'#1a1060',color:'#a78bfa'}}>Da ordinare</span></Row>
</Card>);}
export default function PrenotazioneOrdini({api,showToast}){
const BASE=api||API;
const[step,setStep]=useState(0);
const[data,setData]=useState({cliente:null,dispositivo:null,assistenza:null,ricambio:null,caparra:null});
const[saving,setSaving]=useState(false);
const[lista,setLista]=useState([]);const[loadL,setLoadL]=useState(false);
const[viewMode,setViewMode]=useState('lista');
const[filtro,setFiltro]=useState('');const[sq,setSq]=useState('');
const STATI=[{key:'da_ordinare',label:'Da ordinare',bg:'#1a1060',text:'#a78bfa'},{key:'ordinato',label:'Ordinato',bg:'#3b1a06',text:'#fb923c'},{key:'arrivato',label:'Arrivato',bg:'#0f3320',text:'#4ade80'}];
const loadLista=useCallback(async()=>{setLoadL(true);try{const p=new URLSearchParams();if(filtro)p.set('stato',filtro);if(sq)p.set('search',sq);const r=await fetch(BASE+'/prenotazioni-ordini?'+p);const d=await r.json();setLista(Array.isArray(d)?d:[]);}catch(e){setLista([]);}setLoadL(false);},[filtro,sq,BASE]);
useEffect(()=>{if(viewMode==='lista')loadLista();},[viewMode,loadLista]);
const save=async()=>{setSaving(true);try{
const{cliente,dispositivo,assistenza,ricambio,caparra}=data;
if(!cliente||!dispositivo||!assistenza){showToast&&showToast('Dati mancanti','error');setSaving(false);return;}
const body={cliente_id:cliente.id||null,cliente_nome:[cliente.nome,cliente.cognome].filter(Boolean).join(' '),cliente_telefono:cliente.telefono||null,cliente_email:cliente.email||null,brand:dispositivo.brand,modello:dispositivo.modello,colore_variante:dispositivo.colore_storage||dispositivo.colore||null,tipo_riparazione:assistenza.label,ricambio:ricambio?.title||null,in_store:true,stato:'da_ordinare',data_inserimento:new Date().toISOString().split('T')[0],caparra_attiva:caparra?.attiva||false,caparra_importo:caparra?.importo?parseFloat(caparra.importo):null,caparra_totale:caparra?.totale?parseFloat(caparra.totale):null,caparra_metodo:caparra?.metodo||null,caparra_note:caparra?.note||null};
const r=await fetch(BASE+'/prenotazioni-ordini',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const resp=await r.json();if(!r.ok)throw new Error(resp.error||JSON.stringify(resp));
showToast&&showToast('Prenotazione salvata!');setViewMode('lista');setStep(0);setData({cliente:null,dispositivo:null,assistenza:null,ricambio:null,caparra:null});
}catch(e){showToast?showToast('Errore: '+e.message,'error'):alert('Errore: '+e.message);}setSaving(false);};
const del=async id=>{if(!confirm('Eliminare?'))return;await fetch(BASE+'/prenotazioni-ordini/'+id,{method:'DELETE'});showToast&&showToast('Eliminata');loadLista();};
const updStato=async(id,stato)=>{const ex=stato==='ordinato'?{data_ordine:new Date().toISOString().split('T')[0]}:stato==='arrivato'?{data_arrivo:new Date().toISOString().split('T')[0]}:{};await fetch(BASE+'/prenotazioni-ordini/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({stato,...ex})});loadLista();};

if(viewMode==='wizard')return(<div style={{maxWidth:660,margin:'0 auto'}}>
<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}><h1 style={{fontSize:18,fontWeight:700,color:'#e2e8f0',margin:0}}>Nuova prenotazione</h1><button onClick={()=>setViewMode('lista')} style={{...S.btnS,fontSize:12}}>Annulla</button></div>
<StepBar current={step}/>
{step===0&&<Step1 BASE={BASE} onNext={c=>{setData(p=>({...p,cliente:c}));setStep(1);}}/>}
{step===1&&<Step2 BASE={BASE} cliente={data.cliente} onBack={()=>setStep(0)} onNext={d=>{setData(p=>({...p,dispositivo:d}));setStep(2);}}/>}
{step===2&&<Step3 dispositivo={data.dispositivo} onBack={()=>setStep(1)} onNext={a=>{setData(p=>({...p,assistenza:a}));setStep(3);}}/>}
{step===3&&<Step4 BASE={BASE} dispositivo={data.dispositivo} assistenza={data.assistenza} onBack={()=>setStep(2)} onNext={r=>{setData(p=>({...p,ricambio:r}));setStep(4);}}/>}
{step===4&&<Step5 onBack={()=>setStep(3)} onNext={cap=>{setData(p=>({...p,caparra:cap}));setStep(5);}}/>}
{step===5&&<Step6 data={data} onBack={()=>setStep(4)} onSave={save} saving={saving}/>}
</div>);

const cnt=k=>lista.filter(p=>p.stato===k).length;

// Stili tabella
const th={fontSize:10,fontWeight:600,color:'#475569',textTransform:'uppercase',letterSpacing:'.06em',padding:'8px 12px',borderBottom:'1px solid rgba(255,255,255,0.08)',whiteSpace:'nowrap',background:'rgba(255,255,255,0.02)'};
const td={fontSize:12,color:'#e2e8f0',padding:'10px 12px',borderBottom:'1px solid rgba(255,255,255,0.05)',verticalAlign:'middle'};

return(<div>
<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
<div><h1 style={{fontSize:20,fontWeight:700,color:'#e2e8f0',margin:0}}>Prenotazione Ordini</h1><p style={{fontSize:13,color:'#475569',marginTop:3}}>Gestione ricambi per riparazioni</p></div>
<button onClick={()=>setViewMode('wizard')} style={S.btnP}>+ Nuova prenotazione</button>
</div>

<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:18}}>
{STATI.map(s=>(<div key={s.key} onClick={()=>setFiltro(filtro===s.key?'':s.key)} style={{background:filtro===s.key?s.bg:'rgba(255,255,255,0.03)',border:'1px solid '+(filtro===s.key?s.text:'rgba(255,255,255,0.08)'),borderRadius:10,padding:14,cursor:'pointer',textAlign:'center',transition:'all .15s'}}><div style={{fontSize:22,fontWeight:700,color:filtro===s.key?s.text:'#e2e8f0'}}>{cnt(s.key)}</div><div style={{fontSize:12,color:'#475569',marginTop:3}}>{s.label}</div></div>))}
</div>

<input value={sq} onChange={e=>setSq(e.target.value)} placeholder="Cerca cliente, modello, ricambio..." style={{...S.inp,marginBottom:14}}/>

<div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,overflow:'hidden'}}>
{loadL?<div style={{padding:'2rem',textAlign:'center',color:'#475569'}}>Caricamento...</div>
:lista.length===0?<div style={{padding:'2.5rem',textAlign:'center',color:'rgba(255,255,255,0.25)'}}><div style={{fontSize:28,marginBottom:8}}>Nessuna prenotazione</div><button onClick={()=>setViewMode('wizard')} style={{marginTop:12,...S.btnG,color:'#60a5fa',borderColor:'rgba(96,165,250,0.3)'}}>Crea la prima</button></div>
:(<table style={{width:'100%',borderCollapse:'collapse'}}>
<thead><tr>
<th style={th}>Stato</th>
<th style={th}>Nome</th>
<th style={th}>Contatto</th>
<th style={th}>Modello</th>
<th style={th}>Ricambio</th>
<th style={th}>Preventivo</th>
<th style={th}>Data</th>
<th style={{...th,textAlign:'center'}}>Store</th>
<th style={th}>Fornitore</th>
<th style={th}>Note</th>
<th style={th}></th>
</tr></thead>
<tbody>
{lista.map(p=>{const s=STATI.find(x=>x.key===p.stato)||STATI[0];return(
<tr key={p.id} style={{transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
<td style={{...td,padding:'8px 12px'}}>
<select value={p.stato} onChange={e=>updStato(p.id,e.target.value)} style={{fontSize:10,padding:'2px 7px',borderRadius:20,border:'none',background:s.bg,color:s.text,cursor:'pointer',fontFamily:'inherit',fontWeight:600,whiteSpace:'nowrap'}}>
{STATI.map(x=><option key={x.key} value={x.key}>{x.label}</option>)}
</select>
</td>
<td style={td}><span style={{fontWeight:600,color:'#e2e8f0'}}>{p.cliente_nome}</span></td>
<td style={{...td,color:'#60a5fa'}}>{p.cliente_telefono||<span style={{color:'#334155'}}>—</span>}</td>
<td style={td}><div style={{fontWeight:500}}>{p.brand} {p.modello}</div>{p.colore_variante&&<div style={{fontSize:10,color:'#475569',marginTop:1}}>{p.colore_variante}</div>}</td>
<td style={td}>{p.ricambio?<span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'rgba(99,102,241,0.15)',color:'#818cf8'}}>{p.ricambio}</span>:p.tipo_riparazione?<span style={{fontSize:11,color:'#475569'}}>{p.tipo_riparazione}</span>:<span style={{color:'#334155'}}>—</span>}</td>
<td style={{...td,fontWeight:700,color:'#22c55e'}}>{p.caparra_totale?'€ '+parseFloat(p.caparra_totale).toFixed(2):<span style={{color:'#334155'}}>—</span>}</td>
<td style={{...td,color:'#475569',whiteSpace:'nowrap'}}>{p.data_inserimento||'—'}</td>
<td style={{...td,textAlign:'center'}}>{!!p.in_store&&<span style={{fontSize:10,padding:'1px 7px',borderRadius:20,background:'#0f3320',color:'#4ade80',fontWeight:600}}>SI</span>}</td>
<td style={{...td,color:'#94a3b8'}}>{p.fornitore_nome||<span style={{color:'#334155'}}>—</span>}</td>
<td style={{...td,color:'#475569',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.note_generali||<span style={{color:'#334155'}}>—</span>}</td>
<td style={{...td,padding:'8px 8px'}}>
<button onClick={()=>del(p.id)} style={{background:'none',border:'1px solid rgba(248,113,113,0.2)',borderRadius:6,cursor:'pointer',color:'#f87171',fontSize:11,padding:'2px 8px',fontFamily:'inherit'}}>✕</button>
</td>
</tr>);})}
</tbody>
</table>)}
</div>
</div>);}
