import { useState } from 'react'
const navPrincipale=[{id:'dashboard',icon:'⬡',label:'Dashboard'},{id:'clienti',icon:'👥',label:'Clienti'},{id:'riparazioni',icon:'🔧',label:'Riparazioni'},{id:'servizi',icon:'⚙️',label:'Servizi'},{id:'importexport',icon:'📤',label:'Import/Export'}]
const navMagazzino=[{id:'magazzino',icon:'📦',label:'Magazzino'},{id:'cassa',icon:'💰',label:'Cassa'},{id:'acquisto',icon:'◈',label:'Acquisto dispositivo'},{id:'storico-dispositivi',icon:'📱',label:'Storico Acquisti'},{id:'protezione',icon:'🛡️',label:'Protezione'},{id:'valutazione',icon:'📊',label:'Valutazione Display'},{id:'noleggio',icon:'🔄',label:'Noleggio'}]
export default function Sidebar({currentPage,onNavigate}){
  const [collapsed,setCollapsed]=useState(false)
  const active=(id)=>currentPage===id
  const Item=({id,icon,label})=>(<button onClick={()=>onNavigate(id)} style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:collapsed?'10px 0':'9px 14px',justifyContent:collapsed?'center':'flex-start',background:active(id)?'rgba(59,130,246,0.15)':'transparent',border:'none',borderLeft:active(id)?'3px solid #3b82f6':'3px solid transparent',borderRadius:0,cursor:'pointer',color:active(id)?'#60a5fa':'#94a3b8',fontSize:13,fontWeight:active(id)?600:400,fontFamily:'Inter,sans-serif',transition:'all .15s'}} title={collapsed?label:undefined}><span style={{fontSize:16,minWidth:20,textAlign:'center'}}>{icon}</span>{!collapsed&&<span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{label}</span>}</button>)
  const Divider=({label})=>!collapsed?(<div style={{padding:'12px 14px 4px',fontSize:10,color:'#475569',textTransform:'uppercase',letterSpacing:'.08em',fontWeight:600}}>{label}</div>):<div style={{margin:'8px 0',borderTop:'1px solid rgba(255,255,255,0.06)'}}/>
  const isImpost=active('impostazioni')
  return(<div style={{width:collapsed?52:210,minHeight:'100vh',flexShrink:0,background:'#080f1d',borderRight:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',transition:'width .2s'}}>
    {/* Header */}
    <div style={{padding:collapsed?'16px 0':'16px 14px',display:'flex',alignItems:'center',justifyContent:collapsed?'center':'space-between',borderBottom:'1px solid rgba(255,255,255,0.06)',flexShrink:0}}>
      {!collapsed&&<span style={{fontSize:15,fontWeight:700,color:'#f1f5f9',fontFamily:'Inter,sans-serif',letterSpacing:'-.02em'}}>Magazzino</span>}
      <button onClick={()=>setCollapsed(c=>!c)} style={{background:'none',border:'none',cursor:'pointer',color:'#475569',fontSize:16,padding:4,lineHeight:1}}>{collapsed?'▶':'◀'}</button>
    </div>
    {/* Nav scrollabile */}
    <div style={{flex:1,overflowY:'auto',paddingTop:8}}>
      <Divider label="Principale"/>
      {navPrincipale.map(n=><Item key={n.id} {...n}/>)}
      <Divider label="Plug Magazzino"/>
      {navMagazzino.map(n=><Item key={n.id} {...n}/>)}
    </div>
    {/* Impostazioni ancorata in fondo, fuori dallo scroll */}
    <div style={{flexShrink:0,borderTop:'1px solid rgba(255,255,255,0.08)',padding:collapsed?'8px 0':'8px'}}>
      <button onClick={()=>onNavigate('impostazioni')}
        style={{display:'flex',alignItems:'center',gap:10,width:'100%',
          padding:collapsed?'10px 0':'10px 12px',
          justifyContent:collapsed?'center':'flex-start',
          background:isImpost?'rgba(255,255,255,0.07)':'transparent',
          border:'none',borderRadius:8,cursor:'pointer',
          fontFamily:'Inter,sans-serif',transition:'background .15s'}}
        title={collapsed?'Impostazioni':undefined}>
        <div style={{width:26,height:26,borderRadius:7,
          background:isImpost?'rgba(59,130,246,0.3)':'rgba(255,255,255,0.07)',
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:14,flexShrink:0,transition:'background .15s'}}>
          ⚙️
        </div>
        {!collapsed&&<span style={{fontSize:13,fontWeight:600,color:isImpost?'#e2e8f0':'#64748b',letterSpacing:'.01em'}}>Impostazioni</span>}
      </button>
    </div>
  </div>)
}
