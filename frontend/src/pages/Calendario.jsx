import { useState, useEffect, useCallback } from 'react'
const API_BASE=import.meta.env.VITE_API_URL||'https://magazzino-backend-f7vr.onrender.com'
const TIPI={riparazione:{label:'Riparazione',color:'#ef4444',bg:'rgba(239,68,68,0.15)',icon:'ð§'},servizio:{label:'Servizio',color:'#f97316',bg:'rgba(249,115,22,0.15)',icon:'âï¸'},vendita:{label:'Vendita',color:'#10b981',bg:'rgba(16,185,129,0.15)',icon:'ð°'},acquisto:{label:'Acquisto',color:'#8b5cf6',bg:'rgba(139,92,246,0.15)',icon:'ð¤'},scadenza:{label:'Scadenza',color:'#3b82f6',bg:'rgba(59,130,246,0.15)',icon:'ð¡ï¸'},promemoria:{label:'Promemoria',color:'#f59e0b',bg:'rgba(245,158,11,0.15)',icon:'ð'}}
const GIORNI=['Dom','Lun','Mar','Mer','Gio','Ven','Sab']
const MESI=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const DURATE=[{v:30,l:'30 min'},{v:60,l:'1 ora'},{v:90,l:'1h 30min'},{v:120,l:'2 ore'},{v:180,l:'3 ore'},{v:240,l:'4 ore'}]
const F='Inter,sans-serif'
const ORE_INIZIO=8
const ORE_FINE=20
const PX_ORA=80

function fmtData(d){return d.getDate()+' '+MESI[d.getMonth()]+' '+d.getFullYear()}
function fmtDataShort(d){return GIORNI[d.getDay()]+' '+d.getDate()+' '+MESI[d.getMonth()].slice(0,3)}
function toMin(ora){if(!ora)return null;const[h,m]=ora.split(':').map(Number);return h*60+m}
function fromMin(m){return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}

export default function Calendario({api,showToast,onNavigate}){
  const apiUrl=api||API_BASE
  const [anno,setAnno]=useState(new Date().getFullYear())
  const [mese,setMese]=useState(new Date().getMonth())
  const [eventi,setEventi]=useState([])
  const [loading,setLoading]=useState(false)
  const [vista,setVista]=useState('giorno')
  const [filtri,setFiltri]=useState(Object.keys(TIPI).reduce((a,k)=>({...a,[k]:true}),{}))
  const [giornoSel,setGiornoSel]=useState(new Date())
  const [editSlot,setEditSlot]=useState(null)
  const [showNewProm,setShowNewProm]=useState(false)
  const [newProm,setNewProm]=useState({titolo:'',nota:'',data:'',ora:'',ricorrenza:''})
  const [savingProm,setSavingProm]=useState(false)
  const [savingSlot,setSavingSlot]=useState(false)
  const oggi=new Date()

  const carica=useCallback(async()=>{
    setLoading(true);const ev=[]
    try{
      const r1=await fetch(apiUrl+'/riparazioni').then(r=>r.ok?r.json():[]).catch(()=>[])
      const lista1=Array.isArray(r1)?r1:(r1?.data||[])
      lista1.forEach(r=>{
        const data=r.data_stimata||r.data_consegna_prevista
        if(data) ev.push({id:'rip-'+r.id,rid:r.id,tipo:'riparazione',data,ora_inizio:r.ora_inizio||null,durata_minuti:r.durata_minuti||60,titolo:(r.brand||'')+(r.brand?' ':'')+r.modello||'Riparazione',sub:r.cliente,ref:'riparazioni',apiPath:'riparazioni'})
      })
      const r2=await fetch(apiUrl+'/servizi').then(r=>r.ok?r.json():[]).catch(()=>[])
      const lista2=Array.isArray(r2)?r2:(r2?.data||[])
      lista2.forEach(s=>{
        if(s.data_consegna_prevista) ev.push({id:'srv-'+s.id,rid:s.id,tipo:'servizio',data:s.data_consegna_prevista,ora_inizio:s.ora_inizio||null,durata_minuti:s.durata_minuti||60,titolo:s.nome_servizio||s.tipo_servizio||'Servizio',sub:s.cliente,ref:'servizi',apiPath:'servizi'})
      })
      const r3=await fetch(apiUrl+'/storico-dispositivi').then(r=>r.ok?r.json():[]).catch(()=>[])
      const lista3=Array.isArray(r3)?r3:(r3?.data||[])
      lista3.forEach(d=>{
        if(d.data_acquisto) ev.push({id:'acq-'+d.id,rid:d.id,tipo:'acquisto',data:d.data_acquisto,ora_inizio:null,durata_minuti:null,titolo:(d.dispositivo_marca||'')+' '+(d.dispositivo_modello||''),sub:'Da: '+(d.venditore_nome||''),ref:'storico-dispositivi',apiPath:null})
        if(d.data_vendita&&d.stato==='venduto') ev.push({id:'vnd-'+d.id,rid:d.id,tipo:'vendita',data:d.data_vendita,ora_inizio:null,durata_minuti:null,titolo:(d.dispositivo_marca||'')+' '+(d.dispositivo_modello||''),sub:'A: '+(d.acquirente_nome||d.acquirente_ragione_sociale||''),ref:'storico-dispositivi',apiPath:null})
      })
      const r4=await fetch(apiUrl+'/protezioni').then(r=>r.ok?r.json():[]).catch(()=>[])
      const lista4=Array.isArray(r4)?r4:(r4?.data||[])
      lista4.forEach(p=>{
        if(p.data_scadenza) ev.push({id:'prot-'+p.id,rid:p.id,tipo:'scadenza',data:p.data_scadenza,ora_inizio:null,durata_minuti:null,titolo:'Scadenza protezione',sub:p.cliente_nome||'',ref:'protezione',apiPath:null})
      })
    const r5=await fetch(apiUrl+'/promemoria').then(r=>r.ok?r.json():{data:[]}).catch(()=>({data:[]}))
      ;(Array.isArray(r5)?r5:(r5?.data||[])).forEach(p=>{
        ev.push({id:'prom-'+p.id,rid:p.id,tipo:'promemoria',data:p.data,ora_inizio:p.ora||null,durata_minuti:60,titolo:p.titolo,sub:p.nota||'',ref:null,apiPath:'promemoria',canDelete:true})
      })
    }catch(e){}
    setEventi(ev);setLoading(false)
  },[apiUrl])
  useEffect(()=>{carica()},[carica])

  const salvaProm=async()=>{
    if(!newProm.titolo||!newProm.data) return
    setSavingProm(true)
    try{
      const res=await fetch(apiUrl+'/promemoria',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newProm)})
      if(res.ok){await carica();setShowNewProm(false);setNewProm({titolo:'',nota:'',data:'',ora:'',ricorrenza:''});showToast&&showToast('Promemoria salvato')}
    }catch(e){}
    setSavingProm(false)
  }
  const deleteProm=async(id)=>{
    try{await fetch(apiUrl+'/promemoria/'+id,{method:'DELETE'});await carica();showToast&&showToast('Eliminato')}catch(e){}
  }
  const salvaSlot=async(ev,oraInizio,durataMin)=>{
    if(!ev.apiPath)return
    setSavingSlot(ev.id)
    try{
      const res=await fetch(apiUrl+'/'+ev.apiPath+'/'+ev.rid+'/slot',{
        method:'PUT',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ora_inizio:oraInizio,durata_minuti:durataMin})
      })
      if(res.ok){
        setEventi(prev=>prev.map(e=>e.id===ev.id?{...e,ora_inizio:oraInizio,durata_minuti:durataMin}:e))
        showToast&&showToast('Slot aggiornato â')
        setEditSlot(null)
      }
    }catch(e){}
    setSavingSlot(false)
  }

  const primoGiorno=new Date(anno,mese,1).getDay()
  const giorniMese=new Date(anno,mese+1,0).getDate()
  const celle=[]
  for(let i=0;i<primoGiorno;i++) celle.push(null)
  for(let d=1;d<=giorniMese;d++) celle.push(d)

  const evF=eventi.filter(e=>filtri[e.tipo])
  const dsGiorno=giornoSel.getFullYear()+'-'+String(giornoSel.getMonth()+1).padStart(2,'0')+'-'+String(giornoSel.getDate()).padStart(2,'0')
  const isOggiGiorno=dsGiorno===oggi.getFullYear()+'-'+String(oggi.getMonth()+1).padStart(2,'0')+'-'+String(oggi.getDate()).padStart(2,'0')
  const evGiorno=evF.filter(e=>e.data&&e.data.slice(0,10)===dsGiorno)
  const evConOra=evGiorno.filter(e=>e.ora_inizio)
  const evSenzaOra=evGiorno.filter(e=>!e.ora_inizio)

  const evG=(g)=>{const ds=anno+'-'+String(mese+1).padStart(2,'0')+'-'+String(g).padStart(2,'0');return evF.filter(e=>e.data&&e.data.slice(0,10)===ds)}
  const isOggi=(g)=>g===oggi.getDate()&&mese===oggi.getMonth()&&anno===oggi.getFullYear()
  const evMeseLista=evF.filter(e=>{const d=new Date(e.data);return d.getFullYear()===anno&&d.getMonth()===mese}).sort((a,b)=>a.data.localeCompare(b.data))

  const navGiorno=(dir)=>{const d=new Date(giornoSel);d.setDate(d.getDate()+dir);setGiornoSel(d)}
  const navMese=(dir)=>{if(dir<0){if(mese===0){setMese(11);setAnno(a=>a-1)}else setMese(m=>m-1)}else{if(mese===11){setMese(0);setAnno(a=>a+1)}else setMese(m=>m+1)}}

  // Ore corrente per indicatore
  const oraNow=new Date()
  const minNow=oraNow.getHours()*60+oraNow.getMinutes()
  const showNow=isOggiGiorno&&minNow>=ORE_INIZIO*60&&minNow<=ORE_FINE*60
  const nowPx=((minNow-ORE_INIZIO*60)/60)*PX_ORA

  return(<div style={{maxWidth:1060,margin:'0 auto',fontFamily:F}}>
    {/* Header */}
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
      <div><h2 style={{fontSize:20,fontWeight:800,color:'#f1f5f9',margin:0}}>Calendario</h2><p style={{color:'#64748b',fontSize:13,margin:'4px 0 0'}}>Riparazioni e servizi con slot orari</p></div>
      <button onClick={carica} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:9,padding:'7px 14px',color:'#94a3b8',cursor:'pointer',fontSize:13,fontFamily:F}}>{loading?'â» Caricamento...':'â» Aggiorna'}</button>
    </div>

    {/* Filtri tipo */}
    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
      {Object.entries(TIPI).map(([k,v])=>(<button key={k} onClick={()=>setFiltri(f=>({...f,[k]:!f[k]}))} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:F,background:filtri[k]?v.bg:'rgba(255,255,255,0.03)',border:'1px solid '+(filtri[k]?v.color+'50':'rgba(255,255,255,0.08)'),color:filtri[k]?v.color:'#475569'}}>{v.icon} {v.label}</button>))}
    </div>

    {/* Navigazione */}
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
      {vista==='giorno'&&(<div style={{display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>navGiorno(-1)} style={{width:34,height:34,borderRadius:9,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>{'<'}</button>
        <div style={{fontSize:17,fontWeight:700,color:isOggiGiorno?'#f97316':'#f1f5f9',minWidth:220,textAlign:'center'}}>
          {fmtDataShort(giornoSel)}{isOggiGiorno&&<span style={{marginLeft:8,fontSize:11,background:'rgba(249,115,22,0.2)',color:'#f97316',padding:'2px 8px',borderRadius:10,fontWeight:700}}>OGGI</span>}
        </div>
        <button onClick={()=>navGiorno(1)} style={{width:34,height:34,borderRadius:9,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>{'>'}</button>
        <button onClick={()=>setGiornoSel(new Date())} style={{padding:'5px 12px',borderRadius:8,background:'rgba(249,115,22,0.15)',border:'1px solid rgba(249,115,22,0.3)',color:'#f97316',fontSize:12,cursor:'pointer',fontFamily:F,fontWeight:600}}>Oggi</button>
      </div>)}
      {vista!=='giorno'&&(<div style={{display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>navMese(-1)} style={{width:34,height:34,borderRadius:9,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>{'<'}</button>
        <div style={{fontSize:17,fontWeight:700,color:'#f1f5f9',minWidth:170,textAlign:'center'}}>{MESI[mese]} {anno}</div>
        <button onClick={()=>navMese(1)} style={{width:34,height:34,borderRadius:9,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>{'>'}</button>
        <button onClick={()=>{setAnno(oggi.getFullYear());setMese(oggi.getMonth())}} style={{padding:'5px 12px',borderRadius:8,background:'rgba(249,115,22,0.15)',border:'1px solid rgba(249,115,22,0.3)',color:'#f97316',fontSize:12,cursor:'pointer',fontFamily:F,fontWeight:600}}>Oggi</button>
      </div>)}
      <div style={{display:'flex',gap:4,background:'rgba(255,255,255,0.04)',borderRadius:10,padding:4,border:'1px solid rgba(255,255,255,0.07)'}}>
        {[{k:'giorno',l:'ð Giorno'},{k:'mese',l:'â¦ Mese'},{k:'lista',l:'â° Lista'}].map(({k,l})=>(<button key={k} onClick={()=>setVista(k)} style={{padding:'6px 14px',borderRadius:7,border:'none',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:F,background:vista===k?'rgba(255,255,255,0.1)':'transparent',color:vista===k?'#f1f5f9':'#64748b'}}>{l}</button>))}
      </div>
    </div>

    {/* ===== VISTA GIORNO ===== */}
    {vista==='giorno'&&(<div>
      {/* Mini nav settimana */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:5,marginBottom:14}}>
        {Array.from({length:7},(_,i)=>{
          const base=new Date(giornoSel);base.setDate(base.getDate()-base.getDay()+i)
          const ds2=base.getFullYear()+'-'+String(base.getMonth()+1).padStart(2,'0')+'-'+String(base.getDate()).padStart(2,'0')
          const nEv=evF.filter(e=>e.data&&e.data.slice(0,10)===ds2).length
          const isSel=ds2===dsGiorno
          const isT=ds2===(oggi.getFullYear()+'-'+String(oggi.getMonth()+1).padStart(2,'0')+'-'+String(oggi.getDate()).padStart(2,'0'))
          return(<button key={i} onClick={()=>setGiornoSel(new Date(base))} style={{padding:'7px 4px',borderRadius:10,border:'1px solid '+(isSel?'rgba(249,115,22,0.5)':isT?'rgba(249,115,22,0.2)':'rgba(255,255,255,0.07)'),background:isSel?'rgba(249,115,22,0.15)':isT?'rgba(249,115,22,0.06)':'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'center',fontFamily:F}}>
            <div style={{fontSize:10,color:'#475569',fontWeight:700,textTransform:'uppercase'}}>{GIORNI[base.getDay()]}</div>
            <div style={{fontSize:15,fontWeight:isSel||isT?800:400,color:isSel?'#f97316':isT?'#f97316':'#94a3b8',margin:'2px 0'}}>{base.getDate()}</div>
            {nEv>0&&<div style={{width:5,height:5,borderRadius:'50%',background:'#f97316',margin:'0 auto'}}/>}
          </button>)
        })}
      </div>

      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:8}}><button onClick={()=>{setNewProm({titolo:'',nota:'',data:dsGiorno,ora:'',ricorrenza:''});setShowNewProm(true)}} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:10,background:'rgba(245,158,11,0.15)',border:'1px solid rgba(245,158,11,0.35)',color:'#f59e0b',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:F}}>+ Promemoria</button></div>
      {/* Eventi senza orario */}
      {evSenzaOra.length>0&&(<div style={{marginBottom:12}}>
        <div style={{fontSize:11,color:'#475569',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Senza orario</div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {evSenzaOra.map(e=>{const t=TIPI[e.tipo];return(
            <div key={e.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',cursor:e.apiPath?'pointer':'default'}}
              onClick={()=>e.apiPath&&setEditSlot({...e,_oraInizio:'09:00',_durata:60})}>
              <div style={{fontSize:20,flexShrink:0}}>{t.icon}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:'#f1f5f9'}}>{e.titolo}</div><div style={{fontSize:11,color:'#64748b'}}>{e.sub}</div></div>
              {e.canDelete&&<button onClick={ev=>{ev.stopPropagation();deleteProm(e.rid)}} style={{fontSize:11,color:'#ef4444',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,padding:'2px 8px',cursor:'pointer',fontFamily:F}}>x</button>}
              {e.apiPath&&!e.canDelete&&<span style={{fontSize:10,color:'#f97316',border:'1px dashed rgba(249,115,22,0.4)',padding:'2px 7px',borderRadius:8,cursor:'pointer'}}>+ Orario</span>}
            </div>
          )})}
        </div>
      </div>)}

      {/* Timeline oraria */}
      <div style={{fontSize:11,color:'#475569',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Timeline</div>
      <div style={{position:'relative',background:'rgba(255,255,255,0.02)',borderRadius:14,border:'1px solid rgba(255,255,255,0.07)',overflow:'hidden'}}>
        {/* Colonna ore */}
        <div style={{display:'flex'}}>
          <div style={{width:52,flexShrink:0}}>
            {Array.from({length:ORE_FINE-ORE_INIZIO+1},(_,i)=>(
              <div key={i} style={{height:PX_ORA,display:'flex',alignItems:'flex-start',justifyContent:'flex-end',paddingRight:8,paddingTop:4}}>
                <span style={{fontSize:10,color:'#334155',fontWeight:600}}>{String(ORE_INIZIO+i).padStart(2,'0')}:00</span>
              </div>
            ))}
          </div>
          {/* Griglia */}
          <div style={{flex:1,position:'relative',borderLeft:'1px solid rgba(255,255,255,0.05)'}}>
            {/* Linee ore */}
            {Array.from({length:ORE_FINE-ORE_INIZIO+1},(_,i)=>(
              <div key={i} style={{position:'absolute',top:i*PX_ORA,left:0,right:0,borderTop:'1px solid rgba(255,255,255,0.05)',height:PX_ORA}}>
                {/* Linea mezza ora */}
                <div style={{position:'absolute',top:PX_ORA/2,left:0,right:0,borderTop:'1px dashed rgba(255,255,255,0.03)'}}/>
              </div>
            ))}
            {/* Indicatore ora corrente */}
            {showNow&&(<div style={{position:'absolute',top:nowPx,left:0,right:0,zIndex:10,display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#f97316',flexShrink:0,marginLeft:-4}}/>
              <div style={{flex:1,height:2,background:'linear-gradient(90deg,#f97316,transparent)'}}/>
            </div>)}
            {/* Slot eventi */}
            {evConOra.map(e=>{
              const t=TIPI[e.tipo]
              const startMin=toMin(e.ora_inizio)
              const dur=e.durata_minuti||60
              const top=((startMin-ORE_INIZIO*60)/60)*PX_ORA
              const height=Math.max((dur/60)*PX_ORA,28)
              const isEdit=editSlot?.id===e.id
              return(<div key={e.id} style={{position:'absolute',top,left:6,right:6,height,borderRadius:10,background:t.bg,border:'1px solid '+t.color+'50',padding:'6px 10px',overflow:'hidden',cursor:'pointer',zIndex:5,boxShadow:'0 2px 8px rgba(0,0,0,0.3)'}}
                onClick={()=>setEditSlot(isEdit?null:{...e,_oraInizio:e.ora_inizio,_durata:e.durata_minuti||60})}>
                <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',gap:5,minWidth:0}}>
                    <span style={{fontSize:12}}>{t.icon}</span>
                    <span style={{fontSize:11,fontWeight:700,color:t.color,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.titolo}</span>
                  </div>
                  <span style={{fontSize:10,color:t.color,flexShrink:0}}>{e.ora_inizio} Â· {dur}min</span>
                </div>
                {height>44&&<div style={{fontSize:10,color:'#94a3b8',marginTop:3}}>{e.sub}</div>}
              </div>)
            })}
            {/* Altezza totale griglia */}
            <div style={{height:(ORE_FINE-ORE_INIZIO+1)*PX_ORA}}/>
          </div>
        </div>
      </div>

      {/* Nessun evento */}
      {evGiorno.length===0&&(<div style={{textAlign:'center',padding:'30px',color:'#475569',fontSize:13,marginTop:8}}>
        â Nessun impegno per questo giorno
      </div>)}
    </div>)}

    {showNewProm&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={e=>{if(e.target===e.currentTarget)setShowNewProm(false)}}><div style={{background:'#1e293b',border:'1px solid rgba(255,255,255,0.12)',borderRadius:16,padding:24,width:340,fontFamily:F}}><div style={{fontSize:15,fontWeight:800,color:'#f1f5f9',marginBottom:16}}>Nuovo Promemoria</div><div style={{marginBottom:12}}><label style={{fontSize:11,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:5}}>Titolo</label><input value={newProm.titolo} onChange={e=>setNewProm(s=>({...s,titolo:e.target.value}))} placeholder='Titolo...' style={{width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:9,padding:'9px 12px',color:'#f1f5f9',fontSize:13,fontFamily:F,boxSizing:'border-box'}}/></div><div style={{marginBottom:12}}><label style={{fontSize:11,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:5}}>Nota</label><textarea value={newProm.nota} onChange={e=>setNewProm(s=>({...s,nota:e.target.value}))} placeholder='Dettagli...' rows={2} style={{width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:9,padding:'9px 12px',color:'#f1f5f9',fontSize:13,fontFamily:F,boxSizing:'border-box',resize:'none'}}/></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}><div><label style={{fontSize:11,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:5}}>Data</label><input type='date' value={newProm.data} onChange={e=>setNewProm(s=>({...s,data:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:9,padding:'8px 10px',color:'#f1f5f9',fontSize:12,fontFamily:F,boxSizing:'border-box'}}/></div><div><label style={{fontSize:11,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:5}}>Ora</label><input type='time' value={newProm.ora} onChange={e=>setNewProm(s=>({...s,ora:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:9,padding:'8px 10px',color:'#f1f5f9',fontSize:12,fontFamily:F,boxSizing:'border-box'}}/></div></div><div style={{marginBottom:18}}><label style={{fontSize:11,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:5}}>Ricorrenza</label><select value={newProm.ricorrenza} onChange={e=>setNewProm(s=>({...s,ricorrenza:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:9,padding:'8px 10px',color:'#f1f5f9',fontSize:13,fontFamily:F}}><option value=''>Nessuna</option><option value='settimanale'>Settimanale</option><option value='mensile'>Mensile</option><option value='annuale'>Annuale</option></select></div><div style={{display:'flex',gap:8}}><button onClick={()=>setShowNewProm(false)} style={{flex:1,padding:'10px',borderRadius:9,border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:'#94a3b8',cursor:'pointer',fontFamily:F,fontSize:13}}>Annulla</button><button onClick={salvaProm} disabled={savingProm||!newProm.titolo||!newProm.data} style={{flex:2,padding:'10px',borderRadius:9,border:'none',background:'#f59e0b',color:'#fff',cursor:'pointer',fontFamily:F,fontSize:13,fontWeight:700}}>{savingProm?'Salvo...':'Salva promemoria'}</button></div></div></div>)}
    {/* Modal modifica slot */}
    {editSlot&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={e=>{if(e.target===e.currentTarget)setEditSlot(null)}}>
      <div style={{background:'#1e293b',border:'1px solid rgba(255,255,255,0.12)',borderRadius:16,padding:24,width:320,fontFamily:F}}>
        <div style={{fontSize:15,fontWeight:800,color:'#f1f5f9',marginBottom:4}}>{TIPI[editSlot.tipo]?.icon} {editSlot.titolo}</div>
        <div style={{fontSize:12,color:'#64748b',marginBottom:20}}>{editSlot.sub}</div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:11,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:6}}>Ora inizio</label>
          <input type="time" value={editSlot._oraInizio||'09:00'}
            onChange={e=>setEditSlot(s=>({...s,_oraInizio:e.target.value}))}
            style={{width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:9,padding:'9px 12px',color:'#f1f5f9',fontSize:15,fontFamily:F,boxSizing:'border-box'}}/>
        </div>
        <div style={{marginBottom:20}}>
          <label style={{fontSize:11,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:6}}>Durata</label>
          <select value={editSlot._durata||60} onChange={e=>setEditSlot(s=>({...s,_durata:+e.target.value}))}
            style={{width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:9,padding:'9px 12px',color:'#f1f5f9',fontSize:14,fontFamily:F}}>
            {DURATE.map(d=><option key={d.v} value={d.v} style={{background:'#1e293b'}}>{d.l}</option>)}
          </select>
        </div>
        {editSlot._oraInizio&&<div style={{fontSize:11,color:'#64748b',marginBottom:16,textAlign:'center'}}>
          {editSlot._oraInizio} â {fromMin(toMin(editSlot._oraInizio)+(editSlot._durata||60))}
        </div>}
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setEditSlot(null)} style={{flex:1,padding:'10px',borderRadius:9,border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:'#94a3b8',cursor:'pointer',fontFamily:F,fontSize:13}}>Annulla</button>
          <button onClick={()=>salvaSlot(editSlot,editSlot._oraInizio,editSlot._durata||60)} disabled={savingSlot===editSlot.id}
            style={{flex:2,padding:'10px',borderRadius:9,border:'none',background:'#f97316',color:'#fff',cursor:'pointer',fontFamily:F,fontSize:13,fontWeight:700}}>
            {savingSlot===editSlot.id?'Salvo...':'â Salva slot'}
          </button>
        </div>
      </div>
    </div>)}

    {/* ===== VISTA MESE ===== */}
    {vista==='mese'&&(<div style={{background:'rgba(255,255,255,0.03)',borderRadius:14,border:'1px solid rgba(255,255,255,0.07)',overflow:'hidden'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        {GIORNI.map(g=>(<div key={g} style={{padding:'9px 0',textAlign:'center',fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.08em'}}>{g}</div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
        {celle.map((g,i)=>{
          const eG=g?evG(g):[];const ogg=g&&isOggi(g)
          return(<div key={i} style={{minHeight:88,padding:'6px 7px',borderRight:(i+1)%7===0?'none':'1px solid rgba(255,255,255,0.05)',borderBottom:'1px solid rgba(255,255,255,0.05)',background:ogg?'rgba(249,115,22,0.06)':'transparent',cursor:g?'pointer':'default'}}
            onClick={()=>{if(g){const d=new Date(anno,mese,g);setGiornoSel(d);setVista('giorno')}}}>
            {g&&<div style={{fontSize:12,fontWeight:ogg?700:400,color:ogg?'#f97316':'#94a3b8',marginBottom:3,width:22,height:22,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',background:ogg?'rgba(249,115,22,0.2)':'transparent'}}>{g}</div>}
            {eG.slice(0,3).map(e=>{const t=TIPI[e.tipo];return(<div key={e.id} style={{fontSize:9,fontWeight:600,color:t.color,background:t.bg,borderRadius:3,padding:'1px 4px',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',border:'1px solid '+t.color+'30'}}>{t.icon} {e.titolo}</div>)})}
            {eG.length>3&&<div style={{fontSize:9,color:'#475569'}}>+{eG.length-3}</div>}
          </div>)
        })}
      </div>
    </div>)}

    {/* ===== VISTA LISTA ===== */}
    {vista==='lista'&&(<div style={{display:'flex',flexDirection:'column',gap:6}}>
      {evMeseLista.length===0&&<div style={{padding:'40px',textAlign:'center',color:'#475569',fontSize:14,borderRadius:14,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)'}}>Nessun evento in {MESI[mese]}</div>}
      {evMeseLista.map(e=>{const t=TIPI[e.tipo];const d=new Date(e.data);return(
        <div key={e.id} onClick={()=>onNavigate&&onNavigate(e.ref)} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',borderRadius:11,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',cursor:'pointer'}}
          onMouseEnter={ev=>ev.currentTarget.style.background='rgba(255,255,255,0.07)'} onMouseLeave={ev=>ev.currentTarget.style.background='rgba(255,255,255,0.04)'}>
          <div style={{width:42,height:42,borderRadius:10,background:t.bg,border:'1px solid '+t.color+'40',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{t.icon}</div>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:600,color:'#f1f5f9',marginBottom:2}}>{e.titolo}</div><div style={{fontSize:12,color:'#64748b'}}>{e.sub}{e.ora_inizio&&' Â· '+e.ora_inizio}</div></div>
          <div style={{textAlign:'right',flexShrink:0}}>
            <div style={{fontSize:13,fontWeight:700,color:'#f1f5f9'}}>{d.getDate()} {MESI[d.getMonth()]}</div>
            <span style={{fontSize:10,fontWeight:600,color:t.color,background:t.bg,padding:'2px 7px',borderRadius:12,border:'1px solid '+t.color+'40'}}>{t.label}</span>
          </div>
        </div>
      )})}
    </div>)}

    {/* Contatori mese */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8,marginTop:16}}>
      {Object.entries(TIPI).map(([k,v])=>{const n=evF.filter(e=>e.tipo===k&&new Date(e.data).getFullYear()===anno&&new Date(e.data).getMonth()===mese).length;return(<div key={k} style={{padding:'10px 14px',borderRadius:10,background:v.bg,border:'1px solid '+v.color+'30'}}><div style={{fontSize:10,color:v.color,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3}}>{v.label}</div><div style={{fontFamily:'monospace',fontSize:20,fontWeight:800,color:v.color}}>{n}</div></div>)})}
    </div>
  </div>)
}
undefined
