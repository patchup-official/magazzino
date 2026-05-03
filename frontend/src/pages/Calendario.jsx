import { useState, useEffect, useCallback } from 'react'
const API_BASE=import.meta.env.VITE_API_URL||'https://magazzino-backend-f7vr.onrender.com'
const TIPI={riparazione:{label:'Riparazione',color:'#ef4444',bg:'rgba(239,68,68,0.15)',icon:'🔧'},servizio:{label:'Servizio',color:'#f97316',bg:'rgba(249,115,22,0.15)',icon:'⚙️'},vendita:{label:'Vendita',color:'#10b981',bg:'rgba(16,185,129,0.15)',icon:'💰'},acquisto:{label:'Acquisto',color:'#8b5cf6',bg:'rgba(139,92,246,0.15)',icon:'🤝'},scadenza:{label:'Scadenza',color:'#3b82f6',bg:'rgba(59,130,246,0.15)',icon:'🛡️'},promemoria:{label:'Promemoria',color:'#f59e0b',bg:'rgba(245,158,11,0.15)',icon:'📌'}}
const GIORNI=['Dom','Lun','Mar','Mer','Gio','Ven','Sab']
const MESI=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const F='Inter,sans-serif'

function fmtData(d){return d.getDate()+' '+MESI[d.getMonth()]+' '+d.getFullYear()}
function fmtDataShort(d){return GIORNI[d.getDay()]+' '+d.getDate()+' '+MESI[d.getMonth()].slice(0,3)}

export default function Calendario({api,showToast,onNavigate}){
  const apiUrl=api||API_BASE
  const [anno,setAnno]=useState(new Date().getFullYear())
  const [mese,setMese]=useState(new Date().getMonth())
  const [eventi,setEventi]=useState([])
  const [loading,setLoading]=useState(false)
  const [selected,setSelected]=useState(null)
  const [vista,setVista]=useState('giorno')
  const [filtri,setFiltri]=useState(Object.keys(TIPI).reduce((a,k)=>({...a,[k]:true}),{}))
  const [giornoSel,setGiornoSel]=useState(new Date())
  const oggi=new Date()

  const carica=useCallback(async()=>{
    setLoading(true);const ev=[]
    try{
      const r1=await fetch(apiUrl+'/riparazioni').then(r=>r.ok?r.json():[]).catch(()=>[])
      ;(Array.isArray(r1)?r1:[]).forEach(r=>{
        if(r.data_consegna_prevista) ev.push({id:'rip-'+r.id,tipo:'riparazione',data:r.data_consegna_prevista,titolo:r.dispositivo||'Riparazione',sub:r.cliente,ref:'riparazioni'})
      })
      const r2=await fetch(apiUrl+'/servizi').then(r=>r.ok?r.json():[]).catch(()=>[])
      ;(Array.isArray(r2)?r2:[]).forEach(s=>{
        if(s.data_consegna_prevista) ev.push({id:'srv-'+s.id,tipo:'servizio',data:s.data_consegna_prevista,titolo:s.tipo_servizio||'Servizio',sub:s.cliente,ref:'servizi'})
      })
      const r3=await fetch(apiUrl+'/storico-dispositivi').then(r=>r.ok?r.json():[]).catch(()=>[])
      ;(Array.isArray(r3)?r3:[]).forEach(d=>{
        if(d.data_acquisto) ev.push({id:'acq-'+d.id,tipo:'acquisto',data:d.data_acquisto,titolo:(d.dispositivo_marca||'')+' '+(d.dispositivo_modello||''),sub:'Da: '+(d.venditore_nome||''),ref:'storico-dispositivi'})
        if(d.data_vendita&&d.stato==='venduto') ev.push({id:'vnd-'+d.id,tipo:'vendita',data:d.data_vendita,titolo:(d.dispositivo_marca||'')+' '+(d.dispositivo_modello||''),sub:'A: '+(d.acquirente_nome||d.acquirente_ragione_sociale||''),ref:'storico-dispositivi'})
      })
      const r4=await fetch(apiUrl+'/protezioni').then(r=>r.ok?r.json():[]).catch(()=>[])
      ;(Array.isArray(r4)?r4:[]).forEach(p=>{
        if(p.data_scadenza) ev.push({id:'prot-'+p.id,tipo:'scadenza',data:p.data_scadenza,titolo:'Scadenza protezione',sub:p.cliente_nome||'',ref:'protezione'})
      })
    }catch(e){}
    setEventi(ev);setLoading(false)
  },[apiUrl])
  useEffect(()=>{carica()},[carica])

  const primoGiorno=new Date(anno,mese,1).getDay()
  const giorniMese=new Date(anno,mese+1,0).getDate()
  const celle=[]
  for(let i=0;i<primoGiorno;i++) celle.push(null)
  for(let d=1;d<=giorniMese;d++) celle.push(d)

  const evF=eventi.filter(e=>filtri[e.tipo])
  const evG=(g)=>{const ds=anno+'-'+String(mese+1).padStart(2,'0')+'-'+String(g).padStart(2,'0');return evF.filter(e=>e.data&&e.data.slice(0,10)===ds)}
  const isOggi=(g)=>g===oggi.getDate()&&mese===oggi.getMonth()&&anno===oggi.getFullYear()
  const evMeseLista=evF.filter(e=>{const d=new Date(e.data);return d.getFullYear()===anno&&d.getMonth()===mese}).sort((a,b)=>a.data.localeCompare(b.data))

  const dsGiorno=giornoSel.getFullYear()+'-'+String(giornoSel.getMonth()+1).padStart(2,'0')+'-'+String(giornoSel.getDate()).padStart(2,'0')
  const evGiorno=evF.filter(e=>e.data&&e.data.slice(0,10)===dsGiorno)
  const isOggiGiorno=dsGiorno===oggi.getFullYear()+'-'+String(oggi.getMonth()+1).padStart(2,'0')+'-'+String(oggi.getDate()).padStart(2,'0')
  const navGiorno=(dir)=>{const d=new Date(giornoSel);d.setDate(d.getDate()+dir);setGiornoSel(d)}
  const navMese=(dir)=>{if(dir<0){if(mese===0){setMese(11);setAnno(a=>a-1)}else setMese(m=>m-1)}else{if(mese===11){setMese(0);setAnno(a=>a+1)}else setMese(m=>m+1)}}

  const BtnNav=({children,onClick,style})=>(<button onClick={onClick} style={{...{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:9,padding:'7px 14px',color:'#94a3b8',cursor:'pointer',fontSize:13,fontFamily:F},...style}}>{children}</button>)

  return(<div style={{maxWidth:1060,margin:'0 auto',fontFamily:F}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
      <div><h2 style={{fontSize:20,fontWeight:800,color:'#f1f5f9',margin:0}}>Calendario</h2><p style={{color:'#64748b',fontSize:13,margin:'4px 0 0'}}>Riparazioni, vendite e scadenze sincronizzate</p></div>
      <BtnNav onClick={carica}>{loading?'↻ Caricamento...':'↻ Aggiorna'}</BtnNav>
    </div>

    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
      {Object.entries(TIPI).map(([k,v])=>(<button key={k} onClick={()=>setFiltri(f=>({...f,[k]:!f[k]}))} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:F,background:filtri[k]?v.bg:'rgba(255,255,255,0.03)',border:'1px solid '+(filtri[k]?v.color+'50':'rgba(255,255,255,0.08)'),color:filtri[k]?v.color:'#475569'}}>{v.icon} {v.label}</button>))}
    </div>

    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
      {vista!=='giorno'&&(<div style={{display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>navMese(-1)} style={{width:34,height:34,borderRadius:9,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>{'<'}</button>
        <div style={{fontSize:17,fontWeight:700,color:'#f1f5f9',minWidth:170,textAlign:'center'}}>{MESI[mese]} {anno}</div>
        <button onClick={()=>navMese(1)} style={{width:34,height:34,borderRadius:9,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>{'>'}</button>
        <button onClick={()=>{setAnno(oggi.getFullYear());setMese(oggi.getMonth())}} style={{padding:'5px 12px',borderRadius:8,background:'rgba(249,115,22,0.15)',border:'1px solid rgba(249,115,22,0.3)',color:'#f97316',fontSize:12,cursor:'pointer',fontFamily:F,fontWeight:600}}>Oggi</button>
      </div>)}
      {vista==='giorno'&&(<div style={{display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>navGiorno(-1)} style={{width:34,height:34,borderRadius:9,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>{'<'}</button>
        <div style={{fontSize:17,fontWeight:700,color:isOggiGiorno?'#f97316':'#f1f5f9',minWidth:220,textAlign:'center'}}>
          {fmtDataShort(giornoSel)}{isOggiGiorno&&<span style={{marginLeft:8,fontSize:11,background:'rgba(249,115,22,0.2)',color:'#f97316',padding:'2px 8px',borderRadius:10,fontWeight:700}}>OGGI</span>}
        </div>
        <button onClick={()=>navGiorno(1)} style={{width:34,height:34,borderRadius:9,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>{'>'}</button>
        <button onClick={()=>setGiornoSel(new Date())} style={{padding:'5px 12px',borderRadius:8,background:'rgba(249,115,22,0.15)',border:'1px solid rgba(249,115,22,0.3)',color:'#f97316',fontSize:12,cursor:'pointer',fontFamily:F,fontWeight:600}}>Oggi</button>
      </div>)}
      <div style={{display:'flex',gap:4,background:'rgba(255,255,255,0.04)',borderRadius:10,padding:4,border:'1px solid rgba(255,255,255,0.07)'}}>
        {[{k:'giorno',l:'📅 Giorno'},{k:'mese',l:'◦ Mese'},{k:'lista',l:'☰ Lista'}].map(({k,l})=>(<button key={k} onClick={()=>setVista(k)} style={{padding:'6px 14px',borderRadius:7,border:'none',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:F,background:vista===k?'rgba(255,255,255,0.1)':'transparent',color:vista===k?'#f1f5f9':'#64748b'}}>{l}</button>))}
      </div>
    </div>

    {vista==='giorno'&&(<div>
      <div style={{background:isOggiGiorno?'rgba(249,115,22,0.08)':'rgba(255,255,255,0.03)',border:'1px solid '+(isOggiGiorno?'rgba(249,115,22,0.25)':'rgba(255,255,255,0.07)'),borderRadius:14,padding:'20px 24px',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{fontSize:28,fontWeight:800,color:isOggiGiorno?'#f97316':'#f1f5f9',lineHeight:1}}>{GIORNI[giornoSel.getDay()]}</div>
            <div style={{fontSize:15,color:'#64748b',marginTop:4}}>{fmtData(giornoSel)}</div>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {Object.entries(TIPI).map(([k,v])=>{
              const n=evGiorno.filter(e=>e.tipo===k).length
              if(!n) return null
              return(<div key={k} style={{textAlign:'center',padding:'8px 16px',borderRadius:10,background:v.bg,border:'1px solid '+v.color+'30'}}>
                <div style={{fontSize:22,fontWeight:800,color:v.color,fontFamily:'monospace'}}>{n}</div>
                <div style={{fontSize:10,color:v.color,fontWeight:700,textTransform:'uppercase'}}>{v.label}</div>
              </div>)
            })}
            {evGiorno.length===0&&<div style={{color:'#475569',fontSize:13,display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:20}}>✓</span> Nessun impegno per oggi
            </div>}
          </div>
        </div>
      </div>

      {evGiorno.length>0&&(<div style={{display:'flex',flexDirection:'column',gap:8}}>
        {evGiorno.map(e=>{const t=TIPI[e.tipo];return(
          <div key={e.id} onClick={()=>onNavigate&&onNavigate(e.ref)}
            style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',borderRadius:12,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer'}}
            onMouseEnter={ev=>ev.currentTarget.style.background='rgba(255,255,255,0.08)'}
            onMouseLeave={ev=>ev.currentTarget.style.background='rgba(255,255,255,0.04)'}>
            <div style={{width:46,height:46,borderRadius:12,background:t.bg,border:'1px solid '+t.color+'40',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{t.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,fontWeight:700,color:'#f1f5f9',marginBottom:3}}>{e.titolo}</div>
              <div style={{fontSize:12,color:'#64748b'}}>{e.sub}</div>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:t.color,background:t.bg,padding:'4px 10px',borderRadius:12,border:'1px solid '+t.color+'40',flexShrink:0}}>{t.label}</span>
          </div>
        )})}
      </div>)}

      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6,marginTop:16}}>
        {Array.from({length:7},(_,i)=>{
          const base=new Date(giornoSel)
          const dow=base.getDay()
          base.setDate(base.getDate()-dow+i)
          const ds2=base.getFullYear()+'-'+String(base.getMonth()+1).padStart(2,'0')+'-'+String(base.getDate()).padStart(2,'0')
          const nEv=evF.filter(e=>e.data&&e.data.slice(0,10)===ds2).length
          const isSel=ds2===dsGiorno
          const isT=ds2===(oggi.getFullYear()+'-'+String(oggi.getMonth()+1).padStart(2,'0')+'-'+String(oggi.getDate()).padStart(2,'0'))
          return(<button key={i} onClick={()=>setGiornoSel(new Date(base))} style={{padding:'8px 4px',borderRadius:10,border:'1px solid '+(isSel?'rgba(249,115,22,0.5)':isT?'rgba(249,115,22,0.2)':'rgba(255,255,255,0.07)'),background:isSel?'rgba(249,115,22,0.15)':isT?'rgba(249,115,22,0.06)':'rgba(255,255,255,0.03)',cursor:'pointer',textAlign:'center',fontFamily:F}}>
            <div style={{fontSize:10,color:'#475569',fontWeight:700,textTransform:'uppercase'}}>{GIORNI[base.getDay()]}</div>
            <div style={{fontSize:16,fontWeight:isSel||isT?800:400,color:isSel?'#f97316':isT?'#f97316':'#94a3b8',margin:'3px 0'}}>{base.getDate()}</div>
            {nEv>0&&<div style={{width:6,height:6,borderRadius:3,background:'#f97316',margin:'0 auto'}}/>}
          </button>)
        })}
      </div>
    </div>)}

    {vista==='mese'&&(<div style={{background:'rgba(255,255,255,0.03)',borderRadius:14,border:'1px solid rgba(255,255,255,0.07)',overflow:'hidden'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        {GIORNI.map(g=>(<div key={g} style={{padding:'9px 0',textAlign:'center',fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.08em'}}>{g}</div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
        {celle.map((g,i)=>{
          const eG=g?evG(g):[];const ogg=g&&isOggi(g)
          return(<div key={i} style={{minHeight:88,padding:'6px 7px',borderRight:(i+1)%7===0?'none':'1px solid rgba(255,255,255,0.05)',borderBottom:'1px solid rgba(255,255,255,0.05)',background:ogg?'rgba(249,115,22,0.06)':'transparent',cursor:g?'pointer':'default'}} onClick={()=>{if(g){const d=new Date(anno,mese,g);setGiornoSel(d);setVista('giorno')}}}>
            {g&&<div style={{fontSize:12,fontWeight:ogg?700:400,color:ogg?'#f97316':'#94a3b8',marginBottom:3,width:22,height:22,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',background:ogg?'rgba(249,115,22,0.2)':'transparent'}}>{g}</div>}
            {eG.slice(0,3).map(e=>{const t=TIPI[e.tipo];return(<div key={e.id} style={{fontSize:9,fontWeight:600,color:t.color,background:t.bg,borderRadius:3,padding:'1px 4px',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',border:'1px solid '+t.color+'30'}}>{t.icon} {e.titolo}</div>)})}
            {eG.length>3&&<div style={{fontSize:9,color:'#475569'}}>+{eG.length-3} altri</div>}
          </div>)
        })}
      </div>
    </div>)}

    {vista==='lista'&&(<div style={{display:'flex',flexDirection:'column',gap:6}}>
      {evMeseLista.length===0&&<div style={{padding:'40px',textAlign:'center',color:'#475569',fontSize:14,borderRadius:14,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)'}}>Nessun evento in {MESI[mese]}</div>}
      {evMeseLista.map(e=>{const t=TIPI[e.tipo];const d=new Date(e.data);return(<div key={e.id} onClick={()=>onNavigate&&onNavigate(e.ref)} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',borderRadius:11,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',cursor:'pointer'}} onMouseEnter={ev=>ev.currentTarget.style.background='rgba(255,255,255,0.07)'} onMouseLeave={ev=>ev.currentTarget.style.background='rgba(255,255,255,0.04)'}><div style={{width:42,height:42,borderRadius:10,background:t.bg,border:'1px solid '+t.color+'40',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{t.icon}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:600,color:'#f1f5f9',marginBottom:2}}>{e.titolo}</div><div style={{fontSize:12,color:'#64748b'}}>{e.sub}</div></div><div style={{textAlign:'right',flexShrink:0}}><div style={{fontSize:13,fontWeight:700,color:'#f1f5f9'}}>{d.getDate()} {MESI[d.getMonth()]}</div><span style={{fontSize:10,fontWeight:600,color:t.color,background:t.bg,padding:'2px 7px',borderRadius:12,border:'1px solid '+t.color+'40'}}>{t.label}</span></div></div>)})}
    </div>)}

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8,marginTop:16}}>
      {Object.entries(TIPI).map(([k,v])=>{const n=evF.filter(e=>e.tipo===k&&new Date(e.data).getFullYear()===anno&&new Date(e.data).getMonth()===mese).length;return(<div key={k} style={{padding:'10px 14px',borderRadius:10,background:v.bg,border:'1px solid '+v.color+'30'}}><div style={{fontSize:10,color:v.color,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3}}>{v.label}</div><div style={{fontFamily:'monospace',fontSize:20,fontWeight:800,color:v.color}}>{n}</div></div>)})}
    </div>
  </div>)
}
