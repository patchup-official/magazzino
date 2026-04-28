import { useState } from 'react'
const navPrincipale=[{id:'dashboard',icon:'\u2b21',label:'Dashboard'},{id:'clienti',icon:'\ud83d\udc65',label:'Clienti'},{id:'riparazioni',icon:'\ud83d\udd27',label:'Riparazioni'},{id:'servizi',icon:'\u2699\ufe0f',label:'Servizi'},{id:'importexport',icon:'\ud83d\udce4',label:'Import/Export'}]
const navMagazzino=[{id:'magazzino',icon:'\ud83d\udce6',label:'Magazzino'},{id:'cassa',icon:'\ud83d\udcb0',label:'Cassa'},{id:'acquisto',icon:'\u25c8',label:'Acquisto dispositivo'},{id:'storico-dispositivi',icon:'\ud83d\udcf1',label:'Storico Acquisti'},{id:'protezione',icon:'\ud83d\udee1\ufe0f',label:'Protezione'},{id:'valutazione',icon:'\ud83d\udcca',label:'Valutazione Display'},{id:'noleggio',icon:'\ud83d\udd04',label:'Noleggio'}]
export default function Sidebar({currentPage,onNavigate}){
  const [collapsed,setCollapsed]=useState(false)
  const Item=({id,icon,label})=>{const active=currentPage===id;return(<button onClick={()=>onNavigate(id)} style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:collapsed?'10px 0':'9px 14px',justifyContent:collapsed?'center':'flex-start',background:active?'rgba(59,130,246,0.15)':'transparent',border:'none',borderLeft:active?'3px solid #3b82f6':'3px solid transparent',borderRadius:0,cursor:'pointer',color:active?'#60a5fa':'#94a3b8',fontSize:13,fontWeight:active?600:400,fontFamily:'Inter,sans-serif',transition:'all .15s'}} title={collapsed?label:undefined}><span style={{fontSize:16,minWidth:20,textAlign:'center'}}>{icon}</span>{!collapsed&&<span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{label}</span>}</button>)}
  const Divider=({label})=>!collapsed?(<div style={{padding:'12px 14px 4px',fontSize:10,color:'#475569',textTransform:'uppercase',letterSpacing:'.08em',fontWeight:600}}>{label}</div>):<div style={{margin:'8px 0',borderTop:'1px solid rgba(255,255,255,0.06)'}}/>
  return(<div style={{width:collapsed?52:210,minHeight:'100vh',flexShrink:0,background:'#080f1d',borderRight:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',transition:'width .2s'}}>
    <div style={{padding:collapsed?'16px 0':'16px 14px',display:'flex',alignItems:'center',justifyContent:collapsed?'center':'space-between',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
      {!collapsed&&<span style={{fontSize:15,fontWeight:700,color:'#f1f5f9',fontFamily:'Inter,sans-serif',letterSpacing:'-.02em'}}>Magazzino</span>}
      <button onClick={()=>setCollapsed(c=>!c)} style={{background:'none',border:'none',cursor:'pointer',color:'#475569',fontSize:16,padding:4,lineHeight:1}}>{collapsed?'\u25b6':'\u25c0'}</button>
    </div>
    <div style={{flex:1,overflowY:'auto',paddingTop:8}}>
      <Divider label="Principale"/>
      {navPrincipale.map(n=><Item key={n.id} {...n}/>)}
      <Divider label="Plug Magazzino"/>
      {navMagazzino.map(n=><Item key={n.id} {...n}/>)}
      <div style={{marginTop:'auto',paddingTop:16}}>
        <div style={{height:'1px',background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)',marginBottom:12}}/>
        <button onClick={()=>onNavigate('impostazioni')}
          style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,border:'none',cursor:'pointer',background:currentPage==='impostazioni'?'rgba(255,255,255,0.08)':'transparent',transition:'background .15s',fontFamily:'Inter,sans-serif'}}>
          <div style={{width:28,height:28,borderRadius:7,background:'rgba(100,116,139,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>\u2699\uFE0F</div>
          <span style={{fontSize:13,fontWeight:600,color:currentPage==='impostazioni'?'#f1f5f9':'#64748b'}}>Impostazioni</span>
        </button>
      </div>
    </div>
  </div>)
}
