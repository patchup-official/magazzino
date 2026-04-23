// AcquistoPlugin.jsx v3 - Grafica moderna Enown + importo custom + fix scatola

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const INIT = {
  step:1, brand:'', model:'', storage:'',
  condizioni:{}, cash:0, voucher:0,
  prezzoMercato:0, breakdown:[], condizione:'B',
}

// Immagini placeholder dispositivi (in produzione usa immagini reali)
const DEVICE_IMG = {
  Apple: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium?wid=2560&hei=1440&fmt=p-jpg&qlt=80',
  Samsung: 'https://images.samsung.com/is/image/samsung/p6pim/it/2302/gallery/it-galaxy-s23-s911-sm-s911blaceub-thumb-534863401',
  default: null
}

// Domande condizioni - NOTA: con_scatola ha inverti:false e bonus:true
// Per domande NON invertite: Sì=true=applica la condizione (penale o bonus)
// Per domande invertite (si accende, iCloud, fotocamera): Sì=positivo=NON applica penale
const DOMANDE = [
  { chiave:'non_si_accende',  label:'Il dispositivo si accende?',        desc:'Supera la schermata di avvio',               inverti:true,  penale:'-40%', colore:'#ef4444', icona:'⚡' },
  { chiave:'icloud_bloccato', label:'iCloud / account Google è libero?', desc:'Find My iPhone disattivo, nessun blocco',     inverti:true,  penale:'-85%', colore:'#ef4444', icona:'🔒' },
  { chiave:'schermo_rotto',   label:'Lo schermo è rotto?',               desc:'Crepe, pixel morti, touch difettoso',         inverti:false, penale:'-25%', colore:'#f59e0b', icona:'📱' },
  { chiave:'schermo_crepe',   label:'Ci sono crepe minori sul vetro?',   desc:'Piccole crepe non gravi',                    inverti:false, penale:'-15%', colore:'#f59e0b', icona:'🔍' },
  { chiave:'batteria_sotto80',label:'La batteria è sotto l\'80%?',       desc:'Non mantiene la carica normalmente',         inverti:false, penale:'-10%', colore:'#f59e0b', icona:'🔋' },
  { chiave:'scocca_graffi',   label:'Ci sono graffi evidenti?',          desc:'Graffi visibili sul corpo',                  inverti:false, penale:'-8%',  colore:'#94a3b8', icona:'🔧' },
  { chiave:'fotocamera_rotta',label:'La fotocamera funziona?',           desc:'Fotocamera anteriore e posteriore OK',       inverti:true,  penale:'-15%', colore:'#f59e0b', icona:'📷' },
  { chiave:'con_scatola',     label:'Ha la scatola originale?',          desc:'Confezione originale Apple/Samsung inclusa', inverti:false, penale:'+3%',  colore:'#22c55e', icona:'📦', bonus:true },
]

// Componenti UI
const Label = ({children}) => (
  <div style={{fontSize:10.5,fontWeight:600,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>{children}</div>
)

const Field = ({label, children, full}) => (
  <div style={{gridColumn:full?'1/-1':undefined,display:'flex',flexDirection:'column',gap:5}}>
    <Label>{label}</Label>
    {children}
  </div>
)

const inp = {
  background:'rgba(255,255,255,0.06)',
  border:'1px solid rgba(255,255,255,0.1)',
  borderRadius:10,padding:'10px 13px',
  color:'white',fontFamily:'Inter,sans-serif',fontSize:13.5,width:'100%',
}

const sel = {...inp}

const PrimaryBtn = ({onClick,children,disabled,style={}}) => (
  <button onClick={onClick} disabled={disabled} style={{
    background:disabled?'rgba(255,255,255,0.06)':'linear-gradient(135deg,#7c3aed,#6d28d9)',
    color:disabled?'rgba(255,255,255,0.3)':'white',border:'none',
    borderRadius:10,padding:'11px 26px',fontSize:14,fontWeight:600,
    cursor:disabled?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',
    boxShadow:disabled?'none':'0 4px 15px rgba(109,40,217,0.35)',
    transition:'all 0.15s',...style,
  }}>{children}</button>
)

const GhostBtn = ({onClick,children,style={}}) => (
  <button onClick={onClick} style={{
    background:'transparent',color:'rgba(255,255,255,0.5)',
    border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,
    padding:'11px 22px',fontSize:13.5,fontWeight:500,cursor:'pointer',
    fontFamily:'Inter,sans-serif',transition:'all 0.15s',...style,
  }}>{children}</button>
)

// Step bar
const StepBar = ({step,steps}) => (
  <div style={{display:'flex',alignItems:'center',maxWidth:640,margin:'0 auto 30px',padding:'0 4px'}}>
    {steps.map((label,i) => {
      const n=i+1,done=n<step,active=n===step
      return (
        <div key={n} style={{display:'flex',alignItems:'center',flex:i<steps.length-1?1:undefined}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,flexShrink:0}}>
            <div style={{
              width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',
              justifyContent:'center',fontSize:11,fontWeight:700,
              background:done?'#16a34a':active?'#7c3aed':'rgba(255,255,255,0.06)',
              color:done||active?'white':'rgba(255,255,255,0.3)',
              border:active?'2px solid #a78bfa':'2px solid transparent',
              boxShadow:active?'0 0 14px rgba(124,58,237,0.5)':'none',
            }}>{done?'✓':n}</div>
            <span style={{fontSize:9,color:active?'#c4b5fd':done?'#4ade80':'rgba(255,255,255,0.3)',whiteSpace:'nowrap',fontWeight:active||done?600:400}}>{label}</span>
          </div>
          {i<steps.length-1&&<div style={{flex:1,height:2,margin:'0 4px',marginBottom:18,borderRadius:2,background:done?'#16a34a':'rgba(255,255,255,0.07)'}}/>}
        </div>
      )
    })}
  </div>
)

// Firma digitale
function FirmaPad({onSave,onClear}) {
  const ref=useRef(null),drawing=useRef(false),last=useRef(null)
  const [vuota,setVuota]=useState(true)
  useEffect(()=>{const c=ref.current;if(!c)return;c.width=c.offsetWidth*devicePixelRatio;c.height=c.offsetHeight*devicePixelRatio;c.getContext('2d').scale(devicePixelRatio,devicePixelRatio)},[])
  const pos=(e,c)=>{const r=c.getBoundingClientRect(),t=e.touches?e.touches[0]:e;return{x:t.clientX-r.left,y:t.clientY-r.top}}
  const start=e=>{e.preventDefault();drawing.current=true;last.current=pos(e,ref.current)}
  const draw=e=>{e.preventDefault();if(!drawing.current)return;const ctx=ref.current.getContext('2d'),p=pos(e,ref.current);ctx.beginPath();ctx.moveTo(last.current.x,last.current.y);ctx.lineTo(p.x,p.y);ctx.strokeStyle='#1e40af';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.stroke();last.current=p;setVuota(false)}
  const stop=e=>{e.preventDefault();drawing.current=false}
  const clear=()=>{ref.current.getContext('2d').clearRect(0,0,ref.current.width,ref.current.height);setVuota(true);onClear&&onClear()}
  return (
    <div>
      <div style={{background:'white',borderRadius:10,border:'2px solid rgba(255,255,255,0.15)',overflow:'hidden',cursor:'crosshair',marginBottom:8}}>
        <canvas ref={ref} style={{display:'block',width:'100%',height:130,touchAction:'none'}}
          onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={stop}/>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <button onClick={clear} style={{...inp,width:'auto',padding:'5px 14px',fontSize:12,cursor:'pointer',color:'rgba(255,255,255,0.6)'}}>Cancella</button>
        <PrimaryBtn onClick={()=>!vuota&&onSave(ref.current.toDataURL('image/png'))} disabled={vuota} style={{padding:'5px 14px',fontSize:12,boxShadow:'none'}}>✓ Salva firma</PrimaryBtn>
      </div>
    </div>
  )
}

async function makePDF(data) {
  if(!window.jspdf){await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
  const {jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'a4'}),W=210,M=20;let y=20
  doc.setFillColor(30,64,175);doc.rect(0,0,W,18,'F')
  doc.setTextColor(255,255,255);doc.setFontSize(13);doc.setFont(undefined,'bold')
  doc.text('FOGLIO DI ACCETTAZIONE ACQUISTO',M,12)
  doc.setFontSize(9);doc.setFont(undefined,'normal')
  doc.text(`N.${data.num||'___'}  Data:${new Date().toLocaleDateString('it-IT')}`,W-M,12,{align:'right'})
  y=26;doc.setTextColor(100,100,100);doc.setFontSize(8)
  doc.text('PatchUP S.R.L. • Piazza Schiaparelli n.10 • P.IVA 04038180040 • savigliano@patchup.it',M,y)
  y+=8;doc.setFillColor(248,250,252);doc.setDrawColor(200,200,200)
  doc.roundedRect(M,y,W-M*2,34,3,3,'FD')
  doc.setTextColor(0,0,0);doc.setFontSize(11);doc.setFont(undefined,'bold')
  doc.text(`Prezzo: € ${data.prezzo} (${data.tipo==='voucher'?'Buono acquisto':'Contanti'})`,M+4,y+9)
  doc.setFont(undefined,'normal');doc.setFontSize(9)
  doc.text(`Nome: ${data.nome}`,M+4,y+17);doc.text(`Tel: ${data.tel}`,M+4,y+23);doc.text(`C.F.: ${data.cf||'—'}`,M+4,y+29)
  doc.text(`${data.brand} ${data.modello} ${data.storage}`,M+90,y+17);doc.text(`IMEI: ${data.imei||'—'}`,M+90,y+23)
  doc.text(`Prezzo mercato: €${data.mercato}`,M+90,y+29)
  y+=40;doc.setFontSize(10);doc.setFont(undefined,'bold');doc.setTextColor(30,64,175)
  doc.text('Io sottoscritto/a dichiaro',M,y);y+=6
  doc.setFontSize(8.5);doc.setFont(undefined,'normal');doc.setTextColor(50,50,50)
  const t='con la presente e sotto la mia responsabilità: 1. Di aver rimosso tutti i dati personali. 2. Che il dispositivo è di mia piena proprietà, libero da vincoli contrattuali. 3. Che autorizzo PatchUP S.R.L. a trattenere il bene. 4. Che accetto la valutazione sopra citata.'
  const ll=doc.splitTextToSize(t,W-M*2);doc.text(ll,M,y);y+=ll.length*4+10
  doc.line(M,y+14,M+70,y+14);doc.line(W-M-70,y+14,W-M,y+14)
  doc.setFontSize(8);doc.setTextColor(120,120,120);doc.text('Data',M,y+18);doc.text('Firma Cliente',W-M-70,y+18)
  if(data.firma){try{doc.addImage(data.firma,'PNG',W-M-70,y-6,70,18)}catch(e){}}
  y+=26;doc.setFontSize(7.5);doc.setTextColor(100,100,100)
  doc.text(doc.splitTextToSize("Il cliente autorizza il trattamento dei propri dati personali ai fini dell'acquisto.",W-M*2),M,y)
  doc.setFillColor(30,64,175);doc.rect(0,287,W,10,'F')
  doc.setTextColor(255,255,255);doc.setFontSize(7)
  doc.text('PatchUP S.R.L. — Generato automaticamente dal sistema Magazzino',W/2,293,{align:'center'})
  return doc
}

export default function AcquistoPlugin({api,showToast}) {
  const [s,setS]=useState(INIT)
  const [modelli,setModelli]=useState({})
  const [loading,setLoading]=useState(false)
  const [form,setForm]=useState({nome:'',cf:'',tel:'',storage:'128GB',colore:'',imei:'',tipo:'cash',natoA:'',natoIl:'',residente:'',indirizzo:''})
  const [firma,setFirma]=useState(null)
  const [docF,setDocF]=useState(null)
  const [docR,setDocR]=useState(null)
  const [showQR,setShowQR]=useState(false)
  const [docNum,setDocNum]=useState('')
  const [importoC,setImportoC]=useState('')
  const [useCustom,setUseCustom]=useState(false)

  const upd=c=>setS(p=>({...p,...c}))
  const steps=['Dispositivo','Condizioni','Prezzo','Cliente','Firma','Fine']

  useEffect(()=>{
    axios.get(`${api}/valutazione/modelli`).then(({data})=>setModelli(data)).catch(()=>{
      setModelli({
        Apple:{'iPhone SE (3rd)':['64GB','128GB','256GB'],'iPhone 12':['64GB','128GB','256GB'],'iPhone 12 Pro':['128GB','256GB','512GB'],'iPhone 13':['128GB','256GB','512GB'],'iPhone 13 Pro':['128GB','256GB','512GB'],'iPhone 14':['128GB','256GB','512GB'],'iPhone 14 Pro':['128GB','256GB','512GB','1TB'],'iPhone 14 Pro Max':['128GB','256GB','512GB','1TB'],'iPhone 15':['128GB','256GB','512GB'],'iPhone 15 Pro':['128GB','256GB','512GB','1TB'],'iPhone 16':['128GB','256GB','512GB'],'iPhone 16 Pro':['128GB','256GB','512GB','1TB']},
        Samsung:{'Galaxy S23':['128GB','256GB'],'Galaxy S23 Ultra':['256GB','512GB'],'Galaxy S24':['128GB','256GB'],'Galaxy S24 Ultra':['256GB','512GB'],'Galaxy A54':['128GB','256GB'],'Galaxy Z Fold5':['256GB','512GB'],'Galaxy Z Flip5':['256GB','512GB']},
        Google:{'Pixel 7':['128GB','256GB'],'Pixel 7a':['128GB'],'Pixel 8':['128GB','256GB'],'Pixel 8 Pro':['128GB','256GB','512GB']},
        Xiaomi:{'Redmi Note 13 Pro':['128GB','256GB'],'13T Pro':['256GB','512GB'],'14':['256GB','512GB'],'14 Ultra':['256GB','512GB']},
        OnePlus:{'11':['128GB','256GB'],'12':['256GB','512GB'],'Nord CE 3':['128GB','256GB']},
        Huawei:{'P60 Pro':['256GB','512GB'],'Mate 60 Pro':['256GB','512GB']},
      })
    })
  },[])

  // FIX: Gestione corretta dei valori per backend
  // - Domande invertite (si accende, iCloud, fotocamera): Sì=non problematico → backend false
  // - Domande normali (schermo rotto, graffi, ecc.): Sì=problematico → backend true
  // - con_scatola (bonus): Sì=ha la scatola → backend true = applica bonus +3%
  const toggleCond=(chiave,valoreUI)=>{
    const d=DOMANDE.find(x=>x.chiave===chiave)
    const valBE=d?.inverti ? !valoreUI : valoreUI
    upd({condizioni:{...s.condizioni,[chiave]:valBE}})
  }

  // Per visualizzare il bottone selezionato: riconverti il valore backend in UI
  const getValUI=(chiave)=>{
    const d=DOMANDE.find(x=>x.chiave===chiave)
    const valBE=s.condizioni[chiave]
    if(valBE===undefined) return undefined
    return d?.inverti ? !valBE : valBE
  }

  const goStep=async n=>{
    if(n===2&&(!s.brand||!s.model||!s.storage)){showToast('Seleziona brand, modello e storage','error');return}
    if(n===3){
      setLoading(true)
      try{
        const {data}=await axios.post(`${api}/valutazione/calcola`,{brand:s.brand,modello:s.model,storage:s.storage,condizioni:s.condizioni})
        if(data.ok){upd({cash:data.prezzo_cash,voucher:data.prezzo_voucher,prezzoMercato:data.prezzo_mercato,breakdown:data.breakdown,condizione:data.condizione,step:3});setImportoC(data.prezzo_cash.toString())}
        else upd({cash:0,voucher:0,step:3})
      }catch{
        let p=300;if(s.condizioni.non_si_accende)p*=0.6;if(s.condizioni.schermo_rotto)p*=0.75
        p=Math.round(p);upd({cash:p,voucher:Math.round(p*1.2),step:3});setImportoC(p.toString())
      }finally{setLoading(false)}
      return
    }
    upd({step:n})
  }

  const prezzoFinale=()=>{
    if(useCustom&&importoC) return parseInt(importoC)||s.cash
    return form.tipo==='voucher'?s.voucher:s.cash
  }

  const condEffettiva=()=>{
    if(!useCustom) return s.condizione
    const r=(parseInt(importoC)||0)/s.cash
    if(r>=1.1) return 'A'
    if(r>=0.9) return s.condizione
    if(r>=0.7) return 'B'
    return 'C'
  }

  const diffInfo=()=>{
    if(!useCustom||!importoC) return null
    const imp=parseInt(importoC)||0,diff=imp-s.cash
    if(diff===0) return null
    return {diff,sign:diff>0?'+':'',colore:diff>0?'#4ade80':'#f87171',bg:diff>0?'rgba(34,197,94,0.08)':'rgba(239,68,68,0.08)',border:diff>0?'rgba(34,197,94,0.2)':'rgba(239,68,68,0.2)'}
  }

  const confirm=async()=>{
    if(!firma){showToast('La firma è obbligatoria','error');return}
    try{
      await axios.post(`${api}/devices/create-from-evaluation`,{
        brand:s.brand,modello:s.model,storage:form.storage||s.storage,
        colore:form.colore,imei:form.imei,
        si_accende:!s.condizioni.non_si_accende,
        schermo_rotto:!!s.condizioni.schermo_rotto,
        batteria_ok:!s.condizioni.batteria_sotto80,
        tipo_pagamento:form.tipo,cliente_nome:form.nome,cliente_tel:form.tel,
      })
    }catch{}
    try{
      const _A=import.meta.env.VITE_API_URL||'https://magazzino-backend-f7vr.onrender.com'
      await fetch(_A+'/storico-dispositivi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({venditore_nome:form.nome,venditore_cognome:'',venditore_telefono:form.tel||'',venditore_doc_numero:form.cf||'',dispositivo_tipo:'Smartphone',dispositivo_marca:s.brand,dispositivo_modello:s.model,dispositivo_imei:form.imei||'',dispositivo_storage:form.storage||s.storage||'',dispositivo_colore:form.colore||'',dispositivo_condizione:typeof condEffettiva==='function'&&condEffettiva()==='A'?'ottimo':typeof condEffettiva==='function'&&condEffettiva()==='C'?'danneggiato':'buono',prezzo_acquisto:prezzoFinale(),operatore:''})})
    }catch(e){console.warn('SD save:',e.message)}
    upd({step:6});showToast('✓ Acquisto completato!')
  }

  const dlPDF=async()=>{
    const doc=await makePDF({nome:form.nome,tel:form.tel,cf:form.cf,brand:s.brand,modello:s.model,storage:form.storage||s.storage,imei:form.imei,prezzo:prezzoFinale(),mercato:s.prezzoMercato,tipo:form.tipo,firma,num:Date.now().toString().slice(-5)})
    doc.save(`accettazione_${form.nome.replace(' ','_')}_${new Date().toISOString().slice(0,10)}.pdf`)
    showToast('✓ PDF scaricato!')
  }

  const handleDoc=(e,side)=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>side==='F'?setDocF(ev.target.result):setDocR(ev.target.result);r.readAsDataURL(f)}

  const brands=Object.keys(modelli)
  const mods=modelli[s.brand]?Object.keys(modelli[s.brand]):[]
  const storages=modelli[s.brand]?.[s.model]||[]
  const qrUrl=`${window.location.origin}/firma?id=${Date.now()}&nome=${encodeURIComponent(form.nome)}&brand=${encodeURIComponent(s.brand)}&modello=${encodeURIComponent(s.model)}`
  const di=diffInfo()

  // Layout comune delle card
  const cardBase={
    background:'rgba(13,15,35,0.95)',
    border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:18,padding:'28px 32px',
    maxWidth:640,margin:'0 auto',
    boxShadow:'0 20px 60px rgba(0,0,0,0.4)',
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{marginBottom:28,maxWidth:640,margin:'0 auto 28px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#7c3aed,#6d28d9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>◈</div>
          <div>
            <div style={{fontSize:18,fontWeight:700}}>Acquisto dispositivo</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>Valutazione basata sui prezzi di mercato italiani aggiornati</div>
          </div>
        </div>
      </div>

      <StepBar step={s.step} steps={steps}/>

      {/* ── STEP 1: Dispositivo ── */}
      {s.step===1&&(
        <div style={cardBase}>
          <div style={{marginBottom:24}}>
            <div style={{fontSize:17,fontWeight:700,marginBottom:4}}>Seleziona il dispositivo</div>
            <div style={{fontSize:12.5,color:'rgba(255,255,255,0.4)'}}>Scegli brand, modello e capacità di memoria</div>
          </div>

          {/* Brand grid */}
          <div style={{marginBottom:20}}>
            <Label>Brand</Label>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {brands.map(b=>(
                <button key={b} onClick={()=>upd({brand:b,model:'',storage:''})} style={{
                  padding:'10px 12px',borderRadius:10,fontSize:13,fontWeight:500,
                  cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'all 0.15s',
                  background:s.brand===b?'rgba(124,58,237,0.25)':'rgba(255,255,255,0.04)',
                  color:s.brand===b?'#c4b5fd':'rgba(255,255,255,0.6)',
                  border:s.brand===b?'1px solid rgba(124,58,237,0.5)':'1px solid rgba(255,255,255,0.08)',
                  boxShadow:s.brand===b?'0 0 12px rgba(124,58,237,0.2)':'none',
                }}>{b}</button>
              ))}
            </div>
          </div>

          {/* Modello */}
          {s.brand&&(
            <div style={{marginBottom:20}}>
              <Label>Modello</Label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,maxHeight:200,overflowY:'auto',paddingRight:4}}>
                {mods.map(m=>(
                  <button key={m} onClick={()=>upd({model:m,storage:''})} style={{
                    padding:'9px 12px',borderRadius:9,fontSize:12.5,fontWeight:500,
                    cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'all 0.15s',textAlign:'left',
                    background:s.model===m?'rgba(124,58,237,0.2)':'rgba(255,255,255,0.04)',
                    color:s.model===m?'#c4b5fd':'rgba(255,255,255,0.6)',
                    border:s.model===m?'1px solid rgba(124,58,237,0.4)':'1px solid rgba(255,255,255,0.07)',
                  }}>{m}</button>
                ))}
              </div>
            </div>
          )}

          {/* Storage */}
          {s.model&&(
            <div style={{marginBottom:20}}>
              <Label>Capacità di memoria</Label>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {storages.map(st=>(
                  <button key={st} onClick={()=>upd({storage:st})} style={{
                    padding:'9px 18px',borderRadius:9,fontSize:13,fontWeight:600,
                    cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'all 0.15s',
                    background:s.storage===st?'rgba(124,58,237,0.25)':'rgba(255,255,255,0.04)',
                    color:s.storage===st?'#c4b5fd':'rgba(255,255,255,0.5)',
                    border:s.storage===st?'1px solid rgba(124,58,237,0.5)':'1px solid rgba(255,255,255,0.08)',
                  }}>{st}</button>
                ))}
              </div>
            </div>
          )}

          {s.brand&&s.model&&s.storage&&(
            <div style={{background:'rgba(124,58,237,0.1)',border:'1px solid rgba(124,58,237,0.2)',borderRadius:10,padding:'12px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:20}}>📱</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13.5,fontWeight:600}}>{s.brand} {s.model} · {s.storage}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:2}}>Prosegui per le domande sulle condizioni</div>
              </div>
              <span style={{fontSize:18,color:'#c4b5fd'}}>→</span>
            </div>
          )}

          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <PrimaryBtn onClick={()=>goStep(2)} disabled={!s.brand||!s.model||!s.storage}>Continua →</PrimaryBtn>
          </div>
        </div>
      )}

      {/* ── STEP 2: Condizioni ── */}
      {s.step===2&&(
        <div style={cardBase}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22}}>
            <div>
              <div style={{fontSize:17,fontWeight:700,marginBottom:4}}>Condizioni del dispositivo</div>
              <div style={{fontSize:12.5,color:'rgba(255,255,255,0.4)'}}>{s.brand} {s.model} · {s.storage}</div>
            </div>
            <div style={{background:'rgba(124,58,237,0.15)',border:'1px solid rgba(124,58,237,0.25)',borderRadius:8,padding:'4px 10px',fontSize:11,color:'#c4b5fd',fontWeight:500}}>
              {Object.keys(s.condizioni).length} / {DOMANDE.length} risposte
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:2}}>
            {DOMANDE.map(d=>{
              const valUI=getValUI(d.chiave)
              // penaleAttiva = la penale viene applicata
              // Per normali: valUI===true = sì c'è il problema = penale
              // Per invertite: valUI===false = no non funziona = penale
              // Per bonus (con_scatola): valUI===true = ha scatola = bonus
              const penaleAttiva = d.bonus ? (valUI===true) : (d.inverti ? valUI===false : valUI===true)
              return (
                <div key={d.chiave} style={{
                  display:'flex',alignItems:'center',justifyContent:'space-between',
                  padding:'13px 14px',borderRadius:10,marginBottom:2,
                  background:penaleAttiva?(d.bonus?'rgba(34,197,94,0.06)':'rgba(239,68,68,0.04)'):'rgba(255,255,255,0.02)',
                  border:penaleAttiva?(d.bonus?'1px solid rgba(34,197,94,0.15)':'1px solid rgba(239,68,68,0.12)'):'1px solid rgba(255,255,255,0.05)',
                  transition:'all 0.15s',
                }}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                      <span style={{fontSize:15}}>{d.icona}</span>
                      <span style={{fontSize:13.5,fontWeight:500}}>{d.label}</span>
                      <span style={{
                        fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,flexShrink:0,
                        background:d.bonus?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.07)',
                        color:d.bonus?'#4ade80':d.colore,
                      }}>{d.penale}</span>
                    </div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',paddingLeft:22}}>{d.desc}</div>
                  </div>
                  <div style={{display:'flex',gap:6,marginLeft:16,flexShrink:0}}>
                    {[['Sì',true],['No',false]].map(([l,v])=>{
                      const sel2=valUI===v
                      // Colore verde/rosso: Sì è verde se è positivo (si accende, iCloud ok, fotocamera ok, scatola sì)
                      // Sì è rosso se è negativo (schermo rotto, graffi, batteria bassa)
                      const siPositivo = d.inverti || d.bonus  // domande invertite o bonus: Sì=positivo
                      const isGreen = sel2 && ((l==='Sì'&&siPositivo)||(l==='No'&&!siPositivo))
                      const isRed = sel2 && !isGreen
                      return (
                        <button key={l} onClick={()=>toggleCond(d.chiave,v)} style={{
                          padding:'7px 16px',borderRadius:8,fontSize:13,fontWeight:600,
                          cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'all 0.15s',minWidth:52,
                          background:isGreen?'rgba(34,197,94,0.2)':isRed?'rgba(239,68,68,0.18)':'rgba(255,255,255,0.05)',
                          color:isGreen?'#4ade80':isRed?'#f87171':'rgba(255,255,255,0.4)',
                          border:isGreen?'1px solid rgba(34,197,94,0.35)':isRed?'1px solid rgba(239,68,68,0.3)':'1px solid rgba(255,255,255,0.08)',
                        }}>{l}</button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{display:'flex',justifyContent:'space-between',marginTop:22}}>
            <GhostBtn onClick={()=>upd({step:1})}>← Indietro</GhostBtn>
            <PrimaryBtn onClick={()=>goStep(3)} disabled={loading}>{loading?'⏳ Calcolo...':'Calcola prezzo →'}</PrimaryBtn>
          </div>
        </div>
      )}

      {/* ── STEP 3: Prezzo ── */}
      {s.step===3&&(
        <div style={cardBase}>
          <div style={{marginBottom:22}}>
            <div style={{fontSize:17,fontWeight:700,marginBottom:4}}>Valutazione completata</div>
            <div style={{fontSize:12.5,color:'rgba(255,255,255,0.4)'}}>{s.brand} {s.model} · {s.storage} · Condizione {s.condizione}</div>
          </div>

          {/* Prezzi principali */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:22}}>
            <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:14,padding:'18px 20px',textAlign:'center'}}>
              <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',marginBottom:10}}>💵 Cash</div>
              <div style={{fontSize:42,fontWeight:800,fontFamily:'monospace',letterSpacing:-2,lineHeight:1}}>€{s.cash}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:6}}>Pagamento immediato</div>
            </div>
            <div style={{background:'linear-gradient(135deg,rgba(109,40,217,0.2),rgba(91,33,182,0.15))',border:'1px solid rgba(124,58,237,0.3)',borderRadius:14,padding:'18px 20px',textAlign:'center',boxShadow:'0 0 20px rgba(109,40,217,0.1)'}}>
              <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',color:'rgba(196,181,253,0.6)',marginBottom:10}}>🎁 Buono</div>
              <div style={{fontSize:42,fontWeight:800,fontFamily:'monospace',letterSpacing:-2,lineHeight:1,color:'#c4b5fd'}}>€{s.voucher}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:6}}>+20% in buono negozio</div>
            </div>
          </div>

          {/* Breakdown */}
          {s.breakdown.length>0&&(
            <div style={{background:'rgba(0,0,0,0.2)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'12px 14px',marginBottom:20}}>
              <div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>Dettaglio calcolo</div>
              {s.breakdown.map((b,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:12,fontFamily:'monospace',
                  color:b.tipo==='mercato'?'rgba(255,255,255,0.25)':b.tipo==='penale'?'#fca5a5':b.tipo==='bonus'?'#86efac':'rgba(255,255,255,0.7)',
                  borderBottom:i===1?'1px solid rgba(255,255,255,0.07)':'none',paddingBottom:i===1?5:3,marginBottom:i===1?3:0,
                }}>
                  <span>{b.voce}</span>
                  <span style={{fontWeight:700}}>{b.importo>0&&b.tipo!=='mercato'&&b.tipo!=='base'?'+':''}€{b.importo}{b.percentuale?` (${b.percentuale>0?'+':''}${b.percentuale}%)`:''}</span>
                </div>
              ))}
            </div>
          )}

          {/* Importo personalizzato */}
          <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'16px 18px',marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:useCustom?14:0}}>
              <div>
                <div style={{fontSize:13.5,fontWeight:600,marginBottom:2}}>💰 Importo personalizzato</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>Offri un prezzo diverso da quello calcolato</div>
              </div>
              <button onClick={()=>setUseCustom(!useCustom)} style={{
                padding:'6px 16px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',border:'none',
                background:useCustom?'#7c3aed':'rgba(255,255,255,0.08)',
                color:'white',fontFamily:'Inter,sans-serif',transition:'all 0.2s',
              }}>{useCustom?'✓ Attivo':'Attiva'}</button>
            </div>

            {useCustom&&(
              <div>
                <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
                  {[
                    {label:'Cash calc.',val:s.cash},
                    {label:'Buono calc.',val:s.voucher},
                    {label:'-20%',val:Math.round(s.cash*0.8)},
                    {label:'+10%',val:Math.round(s.cash*1.1)},
                  ].map(({label,val})=>(
                    <button key={val} onClick={()=>setImportoC(val.toString())} style={{
                      padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:600,
                      cursor:'pointer',border:'1px solid rgba(255,255,255,0.09)',
                      background:parseInt(importoC)===val?'rgba(124,58,237,0.3)':'rgba(255,255,255,0.04)',
                      color:parseInt(importoC)===val?'#c4b5fd':'rgba(255,255,255,0.5)',
                      fontFamily:'Inter,sans-serif',
                    }}>{label} €{val}</button>
                  ))}
                </div>
                <div style={{position:'relative'}}>
                  <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:20,fontWeight:700,color:'rgba(255,255,255,0.5)',pointerEvents:'none'}}>€</span>
                  <input type="number" min="0" value={importoC} onChange={e=>setImportoC(e.target.value)}
                    style={{...inp,paddingLeft:30,fontSize:22,fontWeight:700,fontFamily:'monospace',textAlign:'left',borderRadius:10}}
                    placeholder="0"/>
                </div>
                {di&&(
                  <div style={{display:'flex',alignItems:'center',gap:10,marginTop:10,background:di.bg,border:`1px solid ${di.border}`,borderRadius:9,padding:'10px 13px'}}>
                    <span style={{fontSize:18}}>{di.diff>0?'⬆️':'⬇️'}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12.5,fontWeight:600,color:di.colore}}>{di.sign}€{Math.abs(di.diff)} rispetto al calcolato</div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:1}}>
                        Condizione registrata: <strong style={{color:di.colore}}>{condEffettiva()}</strong>
                        {di.diff>0?' — ottimo per il cliente':' — margine maggiore per il negozio'}
                      </div>
                    </div>
                    <div style={{fontSize:26,fontWeight:800,fontFamily:'monospace',color:di.colore}}>{parseInt(importoC)||0}€</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {s.prezzoMercato>0&&(
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11.5,color:'rgba(255,255,255,0.3)',marginBottom:18,padding:'8px 12px',background:'rgba(255,255,255,0.02)',borderRadius:8}}>
              <span>📊 Prezzo di mercato attuale</span>
              <span style={{fontWeight:600}}>€{s.prezzoMercato}</span>
            </div>
          )}

          <div style={{display:'flex',justifyContent:'space-between'}}>
            <GhostBtn onClick={()=>upd({step:2})}>← Modifica condizioni</GhostBtn>
            <PrimaryBtn onClick={()=>upd({step:4})}>Il cliente accetta →</PrimaryBtn>
          </div>
        </div>
      )}

      {/* ── STEP 4: Cliente ── */}
      {s.step===4&&(
        <div style={cardBase}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
            <div>
              <div style={{fontSize:17,fontWeight:700,marginBottom:4}}>Dati cliente</div>
              <div style={{fontSize:12.5,color:'rgba(255,255,255,0.4)'}}>Prezzo finale: <strong style={{color:'#c4b5fd',fontSize:15}}>€{prezzoFinale()}</strong>{useCustom?' (personalizzato)':''}</div>
            </div>
          </div>

          <Label>Dati anagrafici</Label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:13,marginBottom:22}}>
            <Field label="Nome e cognome" full><input placeholder="Mario Rossi" value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} style={inp}/></Field>
            <Field label="Codice fiscale" full><input placeholder="RSSMRA80A01L219K" value={form.cf} onChange={e=>setForm({...form,cf:e.target.value})} style={inp}/></Field>
            <Field label="Telefono"><input placeholder="+39 333..." value={form.tel} onChange={e=>setForm({...form,tel:e.target.value})} style={inp}/></Field>
            <Field label="Nato a"><input placeholder="Torino" value={form.natoA} onChange={e=>setForm({...form,natoA:e.target.value})} style={inp}/></Field>
            <Field label="Nato il"><input placeholder="01/01/1980" value={form.natoIl} onChange={e=>setForm({...form,natoIl:e.target.value})} style={inp}/></Field>
            <Field label="Residenza"><input placeholder="Torino (TO)" value={form.residente} onChange={e=>setForm({...form,residente:e.target.value})} style={inp}/></Field>
            <Field label="Indirizzo" full><input placeholder="Via Roma 1" value={form.indirizzo} onChange={e=>setForm({...form,indirizzo:e.target.value})} style={inp}/></Field>
          </div>

          <Label>Dettagli dispositivo</Label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:13,marginBottom:22}}>
            <Field label="Storage">
              <select value={form.storage||s.storage} onChange={e=>setForm({...form,storage:e.target.value})} style={sel}>
                {(storages.length?storages:['64GB','128GB','256GB','512GB','1TB']).map(v=><option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Colore"><input placeholder="Nero" value={form.colore} onChange={e=>setForm({...form,colore:e.target.value})} style={inp}/></Field>
            <Field label="IMEI" full><input placeholder="356xxxxxxxxxxxxxx" value={form.imei} onChange={e=>setForm({...form,imei:e.target.value})} style={{...inp,fontFamily:'monospace',fontSize:12.5}} maxLength={15}/></Field>
            <Field label="Tipo pagamento" full>
              <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} style={sel}>
                <option value="cash">💵 Cash (€{useCustom?(parseInt(importoC)||s.cash):s.cash})</option>
                <option value="voucher">🎁 Buono acquisto (€{useCustom?(parseInt(importoC)||s.voucher):s.voucher})</option>
              </select>
            </Field>
          </div>

          <Label>📄 Documento d'identità</Label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:13,marginBottom:13}}>
            {[['F','Fronte',docF],['R','Retro',docR]].map(([side,label,img])=>(
              <div key={side}>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:5}}>{label}</div>
                <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.03)',border:'2px dashed rgba(255,255,255,0.1)',borderRadius:10,padding:img?0:'14px',cursor:'pointer',overflow:'hidden',minHeight:75,transition:'border-color 0.15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'} onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'}>
                  {img?<img src={img} alt={label} style={{width:'100%',maxHeight:85,objectFit:'cover'}}/>:<><span style={{fontSize:18,opacity:0.35,marginBottom:4}}>📷</span><span style={{fontSize:11,color:'rgba(255,255,255,0.25)',textAlign:'center'}}>Carica {label.toLowerCase()}</span></>}
                  <input type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e=>handleDoc(e,side)}/>
                </label>
              </div>
            ))}
          </div>
          <Field label="Numero documento" full><input placeholder="CA00000AA" value={docNum} onChange={e=>setDocNum(e.target.value)} style={{...inp,marginBottom:22}}/></Field>

          <div style={{display:'flex',justifyContent:'space-between'}}>
            <GhostBtn onClick={()=>upd({step:3})}>← Indietro</GhostBtn>
            <PrimaryBtn onClick={()=>goStep(5)}>Vai alla firma →</PrimaryBtn>
          </div>
        </div>
      )}

      {/* ── STEP 5: Firma ── */}
      {s.step===5&&(
        <div style={cardBase}>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:17,fontWeight:700,marginBottom:4}}>Firma del cliente</div>
            <div style={{fontSize:12.5,color:'rgba(255,255,255,0.4)'}}>Richiesta per completare il contratto di acquisto</div>
          </div>

          <div style={{marginBottom:22}}>
            <Label>✍️ Firma qui (mouse o dito sullo schermo)</Label>
            <FirmaPad onSave={d=>{setFirma(d);showToast('✓ Firma acquisita!')}} onClear={()=>setFirma(null)}/>
            {firma&&(
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8,background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:8,padding:'8px 12px'}}>
                <span style={{color:'#4ade80',fontSize:16}}>✓</span>
                <span style={{fontSize:12.5,color:'#4ade80',fontWeight:500}}>Firma acquisita con successo</span>
              </div>
            )}
          </div>

          <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:18,marginBottom:22}}>
            <Label>📱 In alternativa — QR code firma su telefono</Label>
            <button onClick={()=>setShowQR(!showQR)} style={{...inp,width:'auto',padding:'8px 16px',fontSize:12.5,cursor:'pointer',color:'rgba(255,255,255,0.6)'}}>
              {showQR?'🙈 Nascondi QR':'📲 Mostra QR code per firma mobile'}
            </button>
            {showQR&&(
              <div style={{display:'flex',gap:20,alignItems:'center',background:'white',borderRadius:12,padding:16,width:'fit-content',marginTop:12}}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(qrUrl)}&bgcolor=ffffff&color=1e40af`} alt="QR" style={{borderRadius:8}} width={130} height={130}/>
                <div>
                  <div style={{fontSize:13,color:'#1e3a8a',fontWeight:700,marginBottom:5}}>Scansiona per firmare</div>
                  <div style={{fontSize:11,color:'#475569',maxWidth:170,lineHeight:1.6}}>Il cliente inquadra il QR con la fotocamera e firma digitalmente sul suo telefono</div>
                  <div style={{fontSize:10,color:'#94a3b8',marginTop:8}}>{form.nome||'Cliente'} • {s.brand} {s.model}</div>
                </div>
              </div>
            )}
          </div>

          <div style={{display:'flex',justifyContent:'space-between'}}>
            <GhostBtn onClick={()=>upd({step:4})}>← Indietro</GhostBtn>
            <PrimaryBtn onClick={confirm} disabled={!firma} style={{background:firma?'linear-gradient(135deg,#16a34a,#15803d)':undefined,boxShadow:firma?'0 4px 15px rgba(22,163,74,0.3)':'none'}}>
              {firma?'✓ Conferma acquisto':'Firma obbligatoria'}
            </PrimaryBtn>
          </div>
        </div>
      )}

      {/* ── STEP 6: Fine ── */}
      {s.step===6&&(
        <div style={{...cardBase,textAlign:'center',padding:'40px 32px'}}>
          <div style={{width:72,height:72,borderRadius:'50%',background:'rgba(34,197,94,0.15)',border:'2px solid rgba(34,197,94,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 20px'}}>✅</div>
          <div style={{fontSize:22,fontWeight:800,marginBottom:6}}>Acquisto completato!</div>
          <div style={{fontSize:13.5,color:'rgba(255,255,255,0.45)',marginBottom:24}}>{s.brand} {s.model} aggiunto al magazzino come "da testare"</div>

          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'16px 20px',marginBottom:24,textAlign:'left',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:13}}>
            <div><span style={{color:'rgba(255,255,255,0.35)'}}>Cliente: </span><strong>{form.nome}</strong></div>
            <div><span style={{color:'rgba(255,255,255,0.35)'}}>Tel: </span>{form.tel}</div>
            <div><span style={{color:'rgba(255,255,255,0.35)'}}>Dispositivo: </span>{s.brand} {s.model} {s.storage}</div>
            <div><span style={{color:'rgba(255,255,255,0.35)'}}>Pagato: </span><strong style={{color:'#c4b5fd'}}>€{prezzoFinale()} ({form.tipo})</strong></div>
            {useCustom&&<div style={{gridColumn:'1/-1'}}><span style={{color:'rgba(255,255,255,0.35)'}}>Condizione registrata: </span><strong style={{color:condEffettiva()==='A'?'#4ade80':condEffettiva()==='C'?'#f87171':'#fbbf24'}}>{condEffettiva()}</strong></div>}
            {s.prezzoMercato>0&&<div style={{gridColumn:'1/-1',fontSize:11,color:'rgba(255,255,255,0.25)'}}>Mercato €{s.prezzoMercato} → acquistato al {Math.round(prezzoFinale()/s.prezzoMercato*100)}%</div>}
          </div>

          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={dlPDF} style={{background:'white',color:'#1e3a8a',border:'none',borderRadius:10,padding:'12px 22px',fontSize:13.5,fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:8,boxShadow:'0 4px 14px rgba(0,0,0,0.2)'}}>
              📄 Scarica contratto PDF
            </button>
            <GhostBtn onClick={()=>{setS(INIT);setForm({nome:'',cf:'',tel:'',storage:'128GB',colore:'',imei:'',tipo:'cash',natoA:'',natoIl:'',residente:'',indirizzo:''});setFirma(null);setDocF(null);setDocR(null);setShowQR(false);setImportoC('');setUseCustom(false)}}>
              + Nuovo acquisto
            </GhostBtn>
          </div>
        </div>
      )}
    </div>
  )
}
