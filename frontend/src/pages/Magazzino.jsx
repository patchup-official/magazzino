// Magazzino.jsx v3 — con Wizard guidati step-by-step

import { useState, useEffect } from 'react'
import axios from 'axios'
import Wizard, { OptionCard, WizField, wizInp, wizSel, Summary } from '../components/Wizard'

// ââ Stili base ââââââââââââââââââââââââââââââââ
const S = {
  card: { background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden' },
  th:   { padding:'9px 14px', textAlign:'left', fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  td:   { padding:'11px 14px', fontSize:13, color:'rgba(255,255,255,0.7)', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  sel:  { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, padding:'9px 12px', color:'white', fontFamily:'Inter,sans-serif', fontSize:13.5, width:'auto' },
}

const Badge = ({label,color='gray'}) => {
  const C = {green:{bg:'rgba(34,197,94,0.12)',color:'#4ade80'},red:{bg:'rgba(239,68,68,0.12)',color:'#f87171'},blue:{bg:'rgba(59,130,246,0.12)',color:'#60a5fa'},amber:{bg:'rgba(245,158,11,0.12)',color:'#fbbf24'},violet:{bg:'rgba(124,58,237,0.15)',color:'#c4b5fd'},teal:{bg:'rgba(20,184,166,0.12)',color:'#2dd4bf'},gray:{bg:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.5)'}}
  const c=C[color]||C.gray
  return <span style={{display:'inline-flex',alignItems:'center',padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:500,background:c.bg,color:c.color}}>{label}</span>
}

const PBtn = ({onClick,children,small}) => (
  <button onClick={onClick} style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'white',border:'none',borderRadius:9,padding:small?'6px 14px':'9px 18px',fontSize:small?12:13.5,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',boxShadow:'0 3px 10px rgba(109,40,217,0.3)'}}>{children}</button>
)
const GBtn = ({onClick,children,small,danger}) => (
  <button onClick={onClick} style={{background:danger?'rgba(239,68,68,0.1)':'rgba(255,255,255,0.05)',color:danger?'#f87171':'rgba(255,255,255,0.5)',border:danger?'1px solid rgba(239,68,68,0.2)':'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:small?'5px 11px':'8px 16px',fontSize:small?11.5:13,fontWeight:500,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>{children}</button>
)

const STATO_DEVICE = {in_stock:'In stock',venduto:'Venduto',in_riparazione:'In riparazione',da_testare:'Da testare'}
const COND_COLOR   = {A:'green',B:'amber',C:'red'}
const STATO_COLOR  = {in_stock:'green',venduto:'gray',in_riparazione:'blue',da_testare:'violet'}
const TIPI_INT = [
  {val:'sostituzione_batteria',label:'🔋 Sostituzione batteria',desc:'Nuova batteria installata'},
  {val:'sostituzione_schermo', label:'📱 Sostituzione schermo', desc:'Display sostituito'},
  {val:'sostituzione_scocca',  label:'🔧 Sostituzione scocca',  desc:'Scocca/frame rinnovati'},
  {val:'pulizia',              label:'🧹 Pulizia e sanificazione',desc:'Pulizia interna ed esterna'},
  {val:'aggiornamento_sw',     label:'💻 Aggiornamento software',desc:'iOS/Android aggiornato'},
  {val:'rigenerazione',        label:'â»️ Rigenerazione completa',desc:'Ripristino e test completo'},
  {val:'altro',                label:'📝 Altro',                 desc:'Intervento personalizzato'},
]

// ââââââââââââââââââââââââââââââââââââââââââââââ
// WIZARD PRODOTTO
// ââââââââââââââââââââââââââââââââââââââââââââââ
function WizardProdotto({ api, fornitori, onDone, onClose, editing }) {
  const [f, setF] = useState(editing || { nome:'', categoria:'Cover', prezzo_acq:'', prezzo_vend:'', qty:'1', barcode:'', fornitore_id:'', note:'' })
  const upd = c => setF(p => ({...p,...c}))

  const CATS = ['Cover','Caricabatterie','Cavo','Auricolari','Vetro temperato','Accessori','Prodotto proprio']

  const steps = [
    {
      title: 'Nome e categoria',
      heading: '📦 Come si chiama il prodotto?',
      subtitle: 'Inserisci il nome che comparirà in magazzino e scegli la categoria.',
      validate: () => { if(!f.nome.trim()) return 'Il nome del prodotto è obbligatorio'; if(f.nome.trim().length<2) return 'Il nome deve essere di almeno 2 caratteri' },
      content: (
        <div>
          <WizField label="Nome prodotto" hint="Es. Cover iPhone 15 Pro Nera, Cavo USB-C 2m...">
            <input {...wizInp} placeholder="Es. Cover iPhone 15 Pro" value={f.nome} onChange={e=>upd({nome:e.target.value})} autoFocus style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
          </WizField>
          <WizField label="Categoria">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {CATS.map(c=>(
                <OptionCard key={c} label={c} selected={f.categoria===c} onClick={()=>upd({categoria:c})}
                  icon={{'Cover':'🛡️','Caricabatterie':'⚡','Cavo':'ð','Auricolari':'🎧','Vetro temperato':'ð²','Accessori':'ð','Prodotto proprio':'â­'}[c]}
                />
              ))}
            </div>
          </WizField>
        </div>
      )
    },
    {
      title: 'Prezzi e quantità',
      heading: 'ð¶ Quanto costa?',
      subtitle: 'Inserisci il prezzo di acquisto dal fornitore e quello di vendita al cliente.',
      validate: () => {
        if(!f.prezzo_acq || isNaN(+f.prezzo_acq) || +f.prezzo_acq<0) return 'Inserisci un prezzo di acquisto valido'
        if(!f.prezzo_vend || isNaN(+f.prezzo_vend) || +f.prezzo_vend<0) return 'Inserisci un prezzo di vendita valido'
        if(+f.prezzo_vend < +f.prezzo_acq) return '⚠️ Il prezzo di vendita è inferiore al prezzo di acquisto — controlla prima di continuare'
        if(!f.qty || isNaN(+f.qty) || +f.qty<0) return 'Inserisci una quantità valida'
      },
      content: (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <WizField label="Prezzo acquisto (€)" hint="Quanto paghi tu il prodotto">
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.4)',fontSize:16}}>€</span>
                <input {...wizInp} type="number" step="0.01" min="0" placeholder="5.00" value={f.prezzo_acq} onChange={e=>upd({prezzo_acq:e.target.value})} style={{...wizInp,paddingLeft:30,width:'100%',boxSizing:'border-box'}}/>
              </div>
            </WizField>
            <WizField label="Prezzo vendita (€)" hint="Quanto lo vendi al cliente">
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.4)',fontSize:16}}>€</span>
                <input {...wizInp} type="number" step="0.01" min="0" placeholder="12.00" value={f.prezzo_vend} onChange={e=>upd({prezzo_vend:e.target.value})} style={{...wizInp,paddingLeft:30,width:'100%',boxSizing:'border-box'}}/>
              </div>
            </WizField>
          </div>
          {f.prezzo_acq&&f.prezzo_vend&&+f.prezzo_vend>+f.prezzo_acq&&(
            <div style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'#4ade80'}}>
              ✓ Margine: €{(+f.prezzo_vend-+f.prezzo_acq).toFixed(2)} ({Math.round(((+f.prezzo_vend-+f.prezzo_acq)/+f.prezzo_acq)*100)}%)
            </div>
          )}
          <WizField label="Quantità iniziale" hint="Quanti pezzi hai adesso in magazzino">
            <input {...wizInp} type="number" min="0" placeholder="1" value={f.qty} onChange={e=>upd({qty:e.target.value})} style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
          </WizField>
        </div>
      )
    },
    {
      title: 'Barcode e fornitore',
      heading: '📋 Barcode e fornitore',
      subtitle: 'Facoltativo ma utile: aggiungi il codice a barre e il fornitore del prodotto.',
      content: (
        <div>
          <WizField label="Codice a barre / EAN" hint="Scansiona con il lettore o digita manualmente. Lascia vuoto se non ce l'hai.">
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',fontSize:16,opacity:0.4}}>|||</span>
              <input {...wizInp} placeholder="Scansiona o digita EAN..." value={f.barcode} onChange={e=>upd({barcode:e.target.value})} style={{...wizInp,paddingLeft:34,fontFamily:'monospace',width:'100%',boxSizing:'border-box'}}/>
            </div>
          </WizField>
          <WizField label="Fornitore" hint="A chi compri questo prodotto?">
            <select value={f.fornitore_id} onChange={e=>upd({fornitore_id:e.target.value})} style={{...wizSel,width:'100%',boxSizing:'border-box'}}>
              <option value="">— Nessun fornitore selezionato —</option>
              {fornitori.map(fo=><option key={fo.id} value={fo.id}>{fo.nome}</option>)}
            </select>
          </WizField>
          <WizField label="Note interne" hint="Eventuali note visibili solo internamente">
            <input {...wizInp} placeholder="Es. disponibile solo in nero..." value={f.note} onChange={e=>upd({note:e.target.value})} style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
          </WizField>
        </div>
      )
    },
    {
      title: 'Conferma',
      heading: 'â Tutto ok?',
      subtitle: 'Controlla i dati prima di salvare. Puoi sempre modificarli dopo.',
      content: (
        <Summary items={[
          {label:'Nome', val:f.nome},
          {label:'Categoria', val:f.categoria},
          {label:'Prezzo acquisto', val:f.prezzo_acq?`€${f.prezzo_acq}`:''},
          {label:'Prezzo vendita', val:f.prezzo_vend?`€${f.prezzo_vend}`:''},
          {label:'Quantità', val:f.qty},
          {label:'Barcode', val:f.barcode||'Non inserito'},
          {label:'Fornitore', val:fornitori.find(fo=>fo.id===f.fornitore_id)?.nome||'Nessuno'},
          {label:'Note', val:f.note||'—'},
        ]}/>
      )
    }
  ]

  const complete = async () => {
    const payload = { nome:f.nome.trim(), categoria:f.categoria, prezzo_acq:+f.prezzo_acq, prezzo_vend:+f.prezzo_vend, qty:+f.qty, barcode:f.barcode||undefined, fornitore_id:f.fornitore_id||undefined, note:f.note||undefined }
    try {
      if (editing?.id) {
        const {data} = await axios.put(`${api}/products/${editing.id}`, payload)
        onDone(data, 'edit')
      } else {
        const {data} = await axios.post(`${api}/products`, payload)
        onDone(data, 'add')
      }
    } catch { onDone({...payload, id:Date.now().toString()}, editing?.id?'edit':'add') }
    onClose()
  }

  return <Wizard title={editing?.id?'Modifica prodotto':'Aggiungi prodotto'} steps={steps} onClose={onClose} onComplete={complete}/>
}

// ââââââââââââââââââââââââââââââââââââââââââââââ
// WIZARD FORNITORE
// ââââââââââââââââââââââââââââââââââââââââââââââ
function WizardFornitore({ api, onDone, onClose, editing }) {
  const [f, setF] = useState(editing || {nome:'',contatto:'',email:'',telefono:'',piva:'',indirizzo:'',note:''})
  const upd = c => setF(p=>({...p,...c}))

  const steps = [
    {
      title:'Nome azienda',
      heading:'🏭 Come si chiama il fornitore?',
      subtitle:'Inserisci il nome dell\'azienda o del fornitore.',
      validate:()=>{ if(!f.nome.trim()) return 'Il nome del fornitore è obbligatorio' },
      content:(
        <WizField label="Nome azienda / fornitore" hint="Es. TechSupplies S.r.l., Mario Rossi...">
          <input {...wizInp} placeholder="Nome azienda" value={f.nome} onChange={e=>upd({nome:e.target.value})} autoFocus style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
        </WizField>
      )
    },
    {
      title:'Contatti',
      heading:'ð Come lo contatti?',
      subtitle:'Inserisci i dati di contatto. Tutti i campi sono facoltativi.',
      content:(
        <div>
          <WizField label="Referente (persona di contatto)">
            <input {...wizInp} placeholder="Es. Mario Rossi" value={f.contatto} onChange={e=>upd({contatto:e.target.value})} style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
          </WizField>
          <WizField label="Telefono">
            <input {...wizInp} placeholder="+39 333 1234567" value={f.telefono} onChange={e=>upd({telefono:e.target.value})} style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
          </WizField>
          <WizField label="Email">
            <input {...wizInp} type="email" placeholder="info@fornitore.it" value={f.email} onChange={e=>upd({email:e.target.value})} style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
          </WizField>
        </div>
      )
    },
    {
      title:'Dati fiscali',
      heading:'ð Dati fiscali',
      subtitle:'Facoltativi ma utili per la fatturazione.',
      content:(
        <div>
          <WizField label="P.IVA">
            <input {...wizInp} placeholder="IT00000000000" value={f.piva} onChange={e=>upd({piva:e.target.value})} style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
          </WizField>
          <WizField label="Indirizzo">
            <input {...wizInp} placeholder="Via Roma 1, 20100 Milano" value={f.indirizzo} onChange={e=>upd({indirizzo:e.target.value})} style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
          </WizField>
          <WizField label="Note interne">
            <input {...wizInp} placeholder="Note sul fornitore..." value={f.note} onChange={e=>upd({note:e.target.value})} style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
          </WizField>
        </div>
      )
    },
    {
      title:'Conferma',
      heading:'â Tutto ok?',
      subtitle:'Controlla i dati del fornitore.',
      content:(
        <Summary items={[
          {label:'Nome',      val:f.nome},
          {label:'Referente', val:f.contatto||'—'},
          {label:'Telefono',  val:f.telefono||'—'},
          {label:'Email',     val:f.email||'—'},
          {label:'P.IVA',     val:f.piva||'—'},
          {label:'Indirizzo', val:f.indirizzo||'—'},
        ]}/>
      )
    }
  ]

  const complete = async () => {
    try {
      if(editing?.id){ const {data}=await axios.put(`${api}/fornitori/${editing.id}`,f); onDone(data,'edit') }
      else { const {data}=await axios.post(`${api}/fornitori`,f); onDone(data,'add') }
    } catch { onDone({...f,id:Date.now().toString()},editing?.id?'edit':'add') }
    onClose()
  }

  return <Wizard title={editing?.id?'Modifica fornitore':'Aggiungi fornitore'} steps={steps} onClose={onClose} onComplete={complete}/>
}

// ââââââââââââââââââââââââââââââââââââââââââââââ
// WIZARD DISPOSITIVO
// ââââââââââââââââââââââââââââââââââââââââââââââ
function WizardDispositivo({ api, fornitori, onDone, onClose }) {
  const [f, setF] = useState({brand:'Apple',modello:'',storage:'128GB',colore:'',imei:'',condizione:'B',stato:'in_stock',provenienza:'fornitore',prezzo_acq:'',prezzo_vend:'',fornitore_id:''})
  const upd = c => setF(p=>({...p,...c}))

  const BRANDS = ['Apple','Samsung','Google','Xiaomi','OnePlus','Huawei']
  const STORAGES = ['32GB','64GB','128GB','256GB','512GB','1TB']

  const steps = [
    {
      title:'Brand',
      heading:'📱 Che marca è?',
      subtitle:'Seleziona il produttore del dispositivo.',
      content:(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          {BRANDS.map(b=>(
            <OptionCard key={b} label={b} selected={f.brand===b} onClick={()=>upd({brand:b})}
              icon={{'Apple':'ð','Samsung':'ð²','Google':'🔍','Xiaomi':'⚡','OnePlus':'🔴','Huawei':'ð'}[b]}
            />
          ))}
        </div>
      )
    },
    {
      title:'Modello e storage',
      heading:`⚙️ Qual è il modello?`,
      subtitle:`Inserisci il modello esatto e la capacità di memoria.`,
      validate:()=>{ if(!f.modello.trim()) return 'Il modello è obbligatorio' },
      content:(
        <div>
          <WizField label="Modello" hint={`Es. ${f.brand==='Apple'?'iPhone 15 Pro, iPhone 14':f.brand==='Samsung'?'Galaxy S24, Galaxy A54':'Pixel 8, Redmi Note 13...'}`}>
            <input {...wizInp} placeholder={`Es. ${f.brand==='Apple'?'iPhone 15 Pro':'Galaxy S24'}`} value={f.modello} onChange={e=>upd({modello:e.target.value})} autoFocus style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
          </WizField>
          <WizField label="Capacità di memoria">
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {STORAGES.map(s=>(
                <button key={s} onClick={()=>upd({storage:s})} style={{padding:'9px 18px',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'all 0.15s',background:f.storage===s?'rgba(124,58,237,0.25)':'rgba(255,255,255,0.04)',color:f.storage===s?'#c4b5fd':'rgba(255,255,255,0.5)',border:f.storage===s?'1px solid rgba(124,58,237,0.5)':'1px solid rgba(255,255,255,0.08)'}}>
                  {s}
                </button>
              ))}
            </div>
          </WizField>
          <WizField label="Colore" hint="Lascia vuoto se non lo conosci">
            <input {...wizInp} placeholder="Es. Nero, Bianco, Oro..." value={f.colore} onChange={e=>upd({colore:e.target.value})} style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
          </WizField>
        </div>
      )
    },
    {
      title:'Condizione',
      heading:'🔍 In che condizioni è?',
      subtitle:'Valuta onestamente le condizioni estetiche e funzionali del dispositivo.',
      content:(
        <div>
          {[
            {val:'A',label:'A — Ottima',icon:'â­',desc:'Come nuovo, nessun segno di usura'},
            {val:'B',label:'B — Buona', icon:'ð',desc:'Leggeri segni di usura, funziona perfettamente'},
            {val:'C',label:'C — Discreta',icon:'ð',desc:'Graffi evidenti o piccoli difetti ma funzionante'},
          ].map(c=>(
            <OptionCard key={c.val} icon={c.icon} label={c.label} desc={c.desc} selected={f.condizione===c.val} onClick={()=>upd({condizione:c.val})}/>
          ))}
          <div style={{marginTop:16}}/>
          <WizField label="Provenienza">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <OptionCard icon="🏭" label="Fornitore" desc="Acquistato da un grossista" selected={f.provenienza==='fornitore'} onClick={()=>upd({provenienza:'fornitore'})}/>
              <OptionCard icon="👤" label="Privato" desc="Acquistato da un cliente" selected={f.provenienza==='privato'} onClick={()=>upd({provenienza:'privato'})}/>
            </div>
          </WizField>
        </div>
      )
    },
    {
      title:'IMEI e prezzi',
      heading:'ð¶ IMEI e prezzi',
      subtitle:'Inserisci il numero IMEI e i prezzi. Il prezzo di vendita è facoltativo.',
      validate:()=>{ if(!f.prezzo_acq||isNaN(+f.prezzo_acq)||+f.prezzo_acq<=0) return 'Inserisci un prezzo di acquisto valido' },
      content:(
        <div>
          <WizField label="IMEI" hint="Digita *#06# sul telefono per trovarlo">
            <input {...wizInp} placeholder="356xxxxxxxxxxxxxx" value={f.imei} onChange={e=>upd({imei:e.target.value})} style={{...wizInp,fontFamily:'monospace',fontSize:13,width:'100%',boxSizing:'border-box'}} maxLength={15}/>
          </WizField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <WizField label="Prezzo acquisto (€)">
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.4)',fontSize:16}}>€</span>
                <input {...wizInp} type="number" step="0.01" min="0" placeholder="200" value={f.prezzo_acq} onChange={e=>upd({prezzo_acq:e.target.value})} style={{...wizInp,paddingLeft:30,width:'100%',boxSizing:'border-box'}}/>
              </div>
            </WizField>
            <WizField label="Prezzo vendita (€)" hint="Facoltativo, aggiungi dopo">
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.4)',fontSize:16}}>€</span>
                <input {...wizInp} type="number" step="0.01" min="0" placeholder="350" value={f.prezzo_vend} onChange={e=>upd({prezzo_vend:e.target.value})} style={{...wizInp,paddingLeft:30,width:'100%',boxSizing:'border-box'}}/>
              </div>
            </WizField>
          </div>
          <WizField label="Fornitore" hint="Da chi hai acquistato questo dispositivo?">
            <select value={f.fornitore_id||''} onChange={e=>upd({fornitore_id:e.target.value})} style={{...wizSel,width:'100%',boxSizing:'border-box'}}>
              <option value="">— Nessun fornitore —</option>
              {fornitori.map(fo=><option key={fo.id} value={fo.id}>{fo.nome}</option>)}
            </select>
          </WizField>
          <WizField label="Stato iniziale">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[{val:'in_stock',icon:'â',label:'In stock'},{val:'da_testare',icon:'ð¬',label:'Da testare'},{val:'in_riparazione',icon:'🔧',label:'In riparazione'},{val:'venduto',icon:'💰',label:'Venduto'}].map(s=>(
                <OptionCard key={s.val} icon={s.icon} label={s.label} selected={f.stato===s.val} onClick={()=>upd({stato:s.val})}/>
              ))}
            </div>
          </WizField>
        </div>
      )
    },
    {
      title:'Conferma',
      heading:'â Tutto ok?',
      subtitle:'Controlla i dati prima di aggiungere il dispositivo al magazzino.',
      content:(
        <Summary items={[
          {label:'Dispositivo',   val:`${f.brand} ${f.modello}`},
          {label:'Storage',       val:f.storage},
          {label:'Colore',        val:f.colore||'—'},
          {label:'IMEI',          val:f.imei||'Non inserito'},
          {label:'Condizione',    val:f.condizione},
          {label:'Provenienza',   val:f.provenienza},
          {label:'Prezzo acquisto',val:f.prezzo_acq?`€${f.prezzo_acq}`:''},
          {label:'Prezzo vendita', val:f.prezzo_vend?`€${f.prezzo_vend}`:'Non impostato'},
          {label:'Fornitore',      val:fornitori.find(fo=>fo.id===f.fornitore_id)?.nome||'Nessuno'},
          {label:'Stato',          val:STATO_DEVICE[f.stato]},
        ]}/>
      )
    }
  ]

  const complete = async () => {
    const payload = {brand:f.brand,modello:f.modello.trim(),storage:f.storage,colore:f.colore||undefined,imei:f.imei||undefined,condizione:f.condizione,stato:f.stato,provenienza:f.provenienza,prezzo_acq:+f.prezzo_acq,prezzo_vend:f.prezzo_vend?+f.prezzo_vend:0,fornitore_id:f.fornitore_id||undefined}
    try { const {data}=await axios.post(`${api}/devices`,payload); onDone(data,'add') }
    catch { onDone({...payload,id:Date.now().toString()},'add') }
    onClose()
  }

  return <Wizard title="Aggiungi dispositivo" steps={steps} onClose={onClose} onComplete={complete}/>
}

// ââââââââââââââââââââââââââââââââââââââââââââââ
// WIZARD INTERVENTO
// ââââââââââââââââââââââââââââââââââââââââââââââ
function WizardIntervento({ api, device, fornitori, onDone, onClose, editing }) {
  const [f, setF] = useState(editing||{tipo:'sostituzione_batteria',descrizione:'',costo:'',fornitore_id:'',eseguito_da:'interno',data:new Date().toISOString().slice(0,10),note:''})
  const upd = c => setF(p=>({...p,...c}))

  const steps = [
    {
      title:'Tipo intervento',
      heading:'🔧 Che intervento è stato fatto?',
      subtitle:`Seleziona il tipo di intervento eseguito su ${device.brand} ${device.modello}.`,
      content:(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {TIPI_INT.map(t=>(
            <OptionCard key={t.val} icon={t.label.split(' ')[0]} label={t.label.slice(t.label.indexOf(' ')+1)} desc={t.desc} selected={f.tipo===t.val} onClick={()=>upd({tipo:t.val})}/>
          ))}
        </div>
      )
    },
    {
      title:'Dettagli',
      heading:'📋 Dettagli intervento',
      subtitle:'Descrivi cosa è stato fatto e inserisci il costo.',
      content:(
        <div>
          <WizField label="Descrizione" hint="Cosa è stato fatto esattamente?">
            <input {...wizInp} placeholder="Es. Batteria originale Apple sostituita, 100% salute..." value={f.descrizione} onChange={e=>upd({descrizione:e.target.value})} style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
          </WizField>
          <WizField label="Costo dell'intervento (€)" hint="Costo del ricambio e/o della manodopera">
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.4)',fontSize:16}}>€</span>
              <input {...wizInp} type="number" step="0.01" min="0" placeholder="0" value={f.costo} onChange={e=>upd({costo:e.target.value})} style={{...wizInp,paddingLeft:30,width:'100%',boxSizing:'border-box'}}/>
            </div>
          </WizField>
          <WizField label="Data intervento">
            <input {...wizInp} type="date" value={f.data} onChange={e=>upd({data:e.target.value})} style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
          </WizField>
        </div>
      )
    },
    {
      title:'Chi ha eseguito',
      heading:'ð¨â🔧 Chi ha eseguito l\'intervento?',
      subtitle:'Specifica se è stato fatto internamente o da un fornitore esterno.',
      content:(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
            <OptionCard icon="ð " label="Interno" desc="Eseguito dal nostro tecnico" selected={f.eseguito_da==='interno'} onClick={()=>upd({eseguito_da:'interno'})}/>
            <OptionCard icon="🏭" label="Fornitore esterno" desc="Inviato a un centro esterno" selected={f.eseguito_da==='fornitore'} onClick={()=>upd({eseguito_da:'fornitore'})}/>
          </div>
          {f.eseguito_da==='fornitore'&&(
            <WizField label="Quale fornitore?">
              <select value={f.fornitore_id} onChange={e=>upd({fornitore_id:e.target.value})} style={{...wizSel,width:'100%',boxSizing:'border-box'}}>
                <option value="">— Seleziona fornitore —</option>
                {fornitori.map(fo=><option key={fo.id} value={fo.id}>{fo.nome}</option>)}
              </select>
            </WizField>
          )}
          <WizField label="Note aggiuntive" hint="Garanzia, numero d'ordine, ecc.">
            <input {...wizInp} placeholder="Note..." value={f.note} onChange={e=>upd({note:e.target.value})} style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
          </WizField>
        </div>
      )
    },
    {
      title:'Conferma',
      heading:'â Tutto ok?',
      subtitle:'Riepilogo intervento prima di salvare.',
      content:(
        <Summary items={[
          {label:'Dispositivo',   val:`${device.brand} ${device.modello}`},
          {label:'Tipo',          val:TIPI_INT.find(t=>t.val===f.tipo)?.label||f.tipo},
          {label:'Descrizione',   val:f.descrizione||'—'},
          {label:'Costo',         val:f.costo?`€${f.costo}`:'Gratuito'},
          {label:'Data',          val:f.data?new Date(f.data).toLocaleDateString('it-IT'):'—'},
          {label:'Eseguito da',   val:f.eseguito_da==='interno'?'Interno':'Fornitore esterno'},
          {label:'Fornitore',     val:fornitori.find(fo=>fo.id===f.fornitore_id)?.nome||'—'},
        ]}/>
      )
    }
  ]

  const complete = async () => {
    const payload = {device_id:device.id,tipo:f.tipo,descrizione:f.descrizione,costo:+f.costo||0,fornitore_id:f.fornitore_id||undefined,eseguito_da:f.eseguito_da,data:f.data,note:f.note}
    try {
      if(editing?.id){ const {data}=await axios.put(`${api}/interventi/${editing.id}`,payload); onDone(data,'edit') }
      else { const {data}=await axios.post(`${api}/interventi`,payload); onDone(data,'add') }
    } catch { onDone({...payload,id:Date.now().toString()},editing?.id?'edit':'add') }
    onClose()
  }

  return <Wizard title={editing?.id?'Modifica intervento':'Nuovo intervento'} steps={steps} onClose={onClose} onComplete={complete}/>
}

// ââââââââââââââââââââââââââââââââââââââââââââââ
// WIZARD RICAMBIO
// ââââââââââââââââââââââââââââââââââââââââââââââ
function WizardRicambio({ api, fornitori, onDone, onClose, editing }) {
  const [f, setF] = useState(editing||{nome:'',categoria:'batteria',compatibile:'',fornitore_id:'',qty:'0',qty_minima:'2',prezzo_acq:'',barcode:'',note:''})
  const upd = c => setF(p=>({...p,...c}))

  const CATS = [{val:'batteria',icon:'🔋'},{val:'schermo',icon:'📱'},{val:'scocca',icon:'🔧'},{val:'altoparlante',icon:'ð'},{val:'fotocamera',icon:'ð·'},{val:'connettore',icon:'ð'},{val:'altro',icon:'📦'}]

  const steps = [
    {
      title:'Tipo ricambio',
      heading:'🔧 Che tipo di ricambio è?',
      subtitle:'Seleziona la categoria del componente.',
      content:(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {CATS.map(c=>(
            <OptionCard key={c.val} icon={c.icon} label={c.val.charAt(0).toUpperCase()+c.val.slice(1)} selected={f.categoria===c.val} onClick={()=>upd({categoria:c.val})}/>
          ))}
        </div>
      )
    },
    {
      title:'Dettagli',
      heading:'📋 Descrivi il ricambio',
      subtitle:'Nome, compatibilità e fornitore.',
      validate:()=>{ if(!f.nome.trim()) return 'Il nome del ricambio è obbligatorio' },
      content:(
        <div>
          <WizField label="Nome ricambio" hint="Es. Batteria iPhone 14 3279mAh">
            <input {...wizInp} placeholder="Nome ricambio..." value={f.nome} onChange={e=>upd({nome:e.target.value})} autoFocus style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
          </WizField>
          <WizField label="Compatibile con" hint="Separa i modelli con una virgola">
            <input {...wizInp} placeholder="Es. iPhone 13, iPhone 14, iPhone 15" value={f.compatibile} onChange={e=>upd({compatibile:e.target.value})} style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
          </WizField>
          <WizField label="Fornitore">
            <select value={f.fornitore_id} onChange={e=>upd({fornitore_id:e.target.value})} style={{...wizSel,width:'100%',boxSizing:'border-box'}}>
              <option value="">— Nessuno —</option>
              {fornitori.map(fo=><option key={fo.id} value={fo.id}>{fo.nome}</option>)}
            </select>
          </WizField>
        </div>
      )
    },
    {
      title:'Quantità e prezzi',
      heading:'📦 Quanti ne hai?',
      subtitle:'Imposta la quantità e un alert per le scorte basse.',
      content:(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <WizField label="Quantità attuale">
              <input {...wizInp} type="number" min="0" placeholder="0" value={f.qty} onChange={e=>upd({qty:e.target.value})} style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
            </WizField>
            <WizField label="Soglia alert (scorte minime)" hint="Ti avvisa quando scendi sotto">
              <input {...wizInp} type="number" min="0" placeholder="2" value={f.qty_minima} onChange={e=>upd({qty_minima:e.target.value})} style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
            </WizField>
            <WizField label="Prezzo acquisto (€)">
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.4)',fontSize:16}}>€</span>
                <input {...wizInp} type="number" step="0.01" min="0" placeholder="0" value={f.prezzo_acq} onChange={e=>upd({prezzo_acq:e.target.value})} style={{...wizInp,paddingLeft:30,width:'100%',boxSizing:'border-box'}}/>
              </div>
            </WizField>
            <WizField label="Barcode / EAN (facoltativo)">
              <input {...wizInp} placeholder="Scansiona..." value={f.barcode} onChange={e=>upd({barcode:e.target.value})} style={{...wizInp,fontFamily:'monospace',width:'100%',boxSizing:'border-box'}}/>
            </WizField>
          </div>
        </div>
      )
    },
    {
      title:'Conferma',
      heading:'â Tutto ok?',
      content:(
        <Summary items={[
          {label:'Nome',        val:f.nome},
          {label:'Categoria',   val:f.categoria},
          {label:'Compatibile', val:f.compatibile||'—'},
          {label:'Fornitore',   val:fornitori.find(fo=>fo.id===f.fornitore_id)?.nome||'—'},
          {label:'Quantità',    val:f.qty},
          {label:'Alert sotto', val:f.qty_minima},
          {label:'Prezzo acq.', val:f.prezzo_acq?`€${f.prezzo_acq}`:'—'},
          {label:'Barcode',     val:f.barcode||'Non inserito'},
        ]}/>
      )
    }
  ]

  const complete = async () => {
    const payload = {nome:f.nome.trim(),categoria:f.categoria,compatibile:f.compatibile||undefined,fornitore_id:f.fornitore_id||undefined,qty:+f.qty||0,qty_minima:+f.qty_minima||2,prezzo_acq:+f.prezzo_acq||0,barcode:f.barcode||undefined,note:f.note||undefined}
    try {
      if(editing?.id){ const {data}=await axios.put(`${api}/ricambi/${editing.id}`,payload); onDone(data,'edit') }
      else { const {data}=await axios.post(`${api}/ricambi`,payload); onDone(data,'add') }
    } catch(e) {
      if(e.response?.status===409) throw new Error('Barcode già esistente')
      onDone({...payload,id:Date.now().toString()},editing?.id?'edit':'add')
    }
    onClose()
  }

  return <Wizard title={editing?.id?'Modifica ricambio':'Aggiungi ricambio'} steps={steps} onClose={onClose} onComplete={complete}/>
}

// ââââââââââââââââââââââââââââââââââââââââââââââ
// TAB PRODOTTI
// ââââââââââââââââââââââââââââââââââââââââââââââ
function TabProdotti({ api, showToast, autoOpen }) {
  const [products, setProducts] = useState([])
  const [fornitori, setFornitori] = useState([])
  const [wizard, setWizard] = useState(null) // null | 'add' | 'edit' | 'fornitore' | 'edit_fornitore'
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [showFornitori, setShowFornitori] = useState(false)

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { if (autoOpen) { setEditing(null); setWizard('prodotto') } }, [autoOpen])

  const fetchAll = async () => {
    try {
      const [p,f] = await Promise.all([axios.get(`${api}/products`),axios.get(`${api}/fornitori`)])
      setProducts(p.data.data||[]); setFornitori(f.data.data||[])
    } catch {}
  }

  const handleProdotto = (data, type) => {
    if(type==='add') setProducts(prev=>[data,...prev])
    else setProducts(prev=>prev.map(p=>p.id===data.id?data:p))
    showToast(type==='add'?'✓ Prodotto aggiunto':'✓ Prodotto aggiornato')
  }

  const handleFornitore = (data, type) => {
    if(type==='add') setFornitori(prev=>[...prev,data])
    else setFornitori(prev=>prev.map(f=>f.id===data.id?data:f))
    showToast(type==='add'?'✓ Fornitore aggiunto':'✓ Fornitore aggiornato')
  }

  const delProdotto = async (id) => {
    setProducts(prev=>prev.filter(p=>p.id!==id))
    try { await axios.delete(`${api}/products/${id}`) } catch {}
    showToast('Prodotto eliminato')
  }

  const delFornitore = async (id) => {
    setFornitori(prev=>prev.filter(f=>f.id!==id))
    try { await axios.delete(`${api}/fornitori/${id}`) } catch {}
    showToast('Fornitore eliminato')
  }

  const filtered = products.filter(p => !search || p.nome?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search))
  const nomeF = (id) => fornitori.find(f=>f.id===id)?.nome||'—'

  return (
    <div>
      {/* Toolbar */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <div style={{display:'flex',gap:10,alignItems:'center',flex:1}}>
          <div style={{position:'relative',flex:1,maxWidth:300}}>
            <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',opacity:0.4}}>🔍</span>
            <input placeholder="Cerca prodotto o barcode..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{...S.sel,padding:'9px 12px 9px 36px',width:'100%',boxSizing:'border-box',borderRadius:9}}/>
          </div>
          <GBtn small onClick={()=>setShowFornitori(!showFornitori)}>🏭 Fornitori ({fornitori.length})</GBtn>
        </div>
        <PBtn onClick={()=>{ setEditing(null); setWizard('prodotto') }}>+ Aggiungi prodotto</PBtn>
      </div>

      {/* Fornitori collassabili */}
      {showFornitori&&(
        <div style={{...S.card,marginBottom:18,padding:'16px 18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:600}}>🏭 Fornitori</div>
            <PBtn small onClick={()=>{ setEditing(null); setWizard('fornitore') }}>+ Aggiungi fornitore</PBtn>
          </div>
          {fornitori.length===0
            ? <div style={{fontSize:13,color:'rgba(255,255,255,0.25)',textAlign:'center',padding:'12px 0'}}>Nessun fornitore — aggiungine uno!</div>
            : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
                {fornitori.map(f=>(
                  <div key={f.id} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'12px 14px'}}>
                    <div style={{fontWeight:600,fontSize:13.5,marginBottom:3}}>{f.nome}</div>
                    {f.piva&&<div style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>P.IVA: {f.piva}</div>}
                    {f.telefono&&<div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:2}}>ð {f.telefono}</div>}
                    <div style={{display:'flex',gap:6,marginTop:10}}>
                      <GBtn small onClick={()=>{ setEditing(f); setWizard('fornitore') }}>✏️</GBtn>
                      <GBtn small danger onClick={()=>delFornitore(f.id)}>✕</GBtn>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* Tabella prodotti */}
      <div style={S.card}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr>{['Nome','Cat.','Barcode','Fornitore','Acq.','Vend.','Qtà','Margine',''].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan="9" style={{textAlign:'center',padding:'40px 0',color:'rgba(255,255,255,0.2)'}}>📦 Nessun prodotto — clicca "+ Aggiungi prodotto" per iniziare</td></tr>
                : filtered.map(p=>{
                    const m=p.prezzo_vend&&p.prezzo_acq?Math.round(((p.prezzo_vend-p.prezzo_acq)/p.prezzo_acq)*100):null
                    return (
                      <tr key={p.id} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <td style={{...S.td,color:'white',fontWeight:500}}>{p.nome}</td>
                        <td style={S.td}><Badge label={p.categoria} color="blue"/></td>
                        <td style={{...S.td,fontFamily:'monospace',fontSize:11,color:'rgba(255,255,255,0.35)'}}>{p.barcode||'—'}</td>
                        <td style={S.td}>{nomeF(p.fornitore_id)}</td>
                        <td style={S.td}>€{(p.prezzo_acq||0).toFixed(2)}</td>
                        <td style={S.td}>€{(p.prezzo_vend||0).toFixed(2)}</td>
                        <td style={S.td}>{p.qty}</td>
                        <td style={S.td}>{m!==null?<Badge label={`${m}%`} color={m>0?'green':'red'}/>:'—'}</td>
                        <td style={{...S.td,whiteSpace:'nowrap'}}>
                          <div style={{display:'flex',gap:6}}>
                            <GBtn small onClick={()=>{ setEditing(p); setWizard('prodotto') }}>✏️</GBtn>
                            <GBtn small danger onClick={()=>delProdotto(p.id)}>✕</GBtn>
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

      {wizard==='prodotto'&&<WizardProdotto api={api} fornitori={fornitori} editing={editing} onDone={handleProdotto} onClose={()=>setWizard(null)}/>}
      {wizard==='fornitore'&&<WizardFornitore api={api} editing={editing} onDone={handleFornitore} onClose={()=>setWizard(null)}/>}
    </div>
  )
}

// ââââââââââââââââââââââââââââââââââââââââââââââ
// TAB DISPOSITIVI
// ââââââââââââââââââââââââââââââââââââââââââââââ
function TabDispositivi({ api, showToast, autoOpen }) {
  const [devices, setDevices] = useState([])
  const [fornitori, setFornitori] = useState([])
  const [filters, setFilters] = useState({brand:'',stato:'',cond:''})
  const [wizard, setWizard] = useState(null)
  const [selectedDev, setSelectedDev] = useState(null)
  const [interventi, setInterventi] = useState([])
  const [editingInt, setEditingInt] = useState(null)

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { if (autoOpen) setWizard('add_device') }, [autoOpen])

  const fetchAll = async () => {
    try {
      const [d,f] = await Promise.all([axios.get(`${api}/devices`),axios.get(`${api}/fornitori`)])
      setDevices(d.data.data||[]); setFornitori(f.data.data||[])
    } catch {}
  }

  const fetchInt = async (id) => {
    try { const {data}=await axios.get(`${api}/interventi?device_id=${id}`); setInterventi(data.data||[]) } catch { setInterventi([]) }
  }

  const openDev = (d) => { setSelectedDev(d); fetchInt(d.id); setWizard('device_detail') }

  const updStato = async (id, stato) => {
    setDevices(prev=>prev.map(d=>d.id===id?{...d,stato}:d))
    try { await axios.put(`${api}/devices/${id}`,{...devices.find(d=>d.id===id),stato}) } catch {}
    showToast('Stato aggiornato')
  }

  const delDev = async (id) => {
    setDevices(prev=>prev.filter(d=>d.id!==id))
    try { await axios.delete(`${api}/devices/${id}`) } catch {}
    showToast('Eliminato')
  }

  const handleDev = (data) => { setDevices(prev=>[data,...prev]); showToast('✓ Dispositivo aggiunto') }

  const handleInt = (data, type) => {
    if(type==='add') setInterventi(prev=>[data,...prev])
    else setInterventi(prev=>prev.map(i=>i.id===data.id?data:i))
    showToast(type==='add'?'✓ Intervento aggiunto':'✓ Intervento aggiornato')
  }

  const delInt = async (id) => {
    setInterventi(prev=>prev.filter(i=>i.id!==id))
    try { await axios.delete(`${api}/interventi/${id}`) } catch {}
    showToast('Intervento eliminato')
  }

  const tipoLabel = (val) => TIPI_INT.find(t=>t.val===val)?.label||val
  const costoTot = () => interventi.reduce((s,i)=>s+(i.costo||0),0)

  const filtered = devices.filter(d => {
    if(filters.brand&&d.brand!==filters.brand) return false
    if(filters.stato&&d.stato!==filters.stato) return false
    if(filters.cond&&d.condizione!==filters.cond) return false
    return true
  })

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <div style={{display:'flex',gap:8}}>
          {[{id:'brand',opts:['','Apple','Samsung','Google','Xiaomi','OnePlus','Huawei'],labels:['Tutti i brand','Apple','Samsung','Google','Xiaomi','OnePlus','Huawei']},{id:'stato',opts:['','in_stock','da_testare','in_riparazione','venduto'],labels:['Tutti gli stati','In stock','Da testare','In riparazione','Venduto']},{id:'cond',opts:['','A','B','C'],labels:['Tutte le cond.','A — Ottima','B — Buona','C — Discreta']}].map(fi=>(
            <select key={fi.id} value={filters[fi.id]} onChange={e=>setFilters({...filters,[fi.id]:e.target.value})} style={{...S.sel,minWidth:130}}>
              {fi.opts.map((o,i)=><option key={o} value={o}>{fi.labels[i]}</option>)}
            </select>
          ))}
        </div>
        <PBtn onClick={()=>setWizard('add_device')}>+ Aggiungi dispositivo</PBtn>
      </div>

      <div style={S.card}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr>{['Dispositivo','Storage','IMEI','Cond.','Stato','Prov.','Acq.','Vend.','Interventi',''].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan="10" style={{textAlign:'center',padding:'40px 0',color:'rgba(255,255,255,0.2)'}}>📱 Nessun dispositivo</td></tr>
                : filtered.map(d=>(
                    <tr key={d.id} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td style={{...S.td,color:'white',fontWeight:500}}>
                        <button onClick={()=>openDev(d)} style={{background:'none',border:'none',color:'white',fontWeight:500,fontSize:13,cursor:'pointer',textAlign:'left',fontFamily:'Inter,sans-serif',padding:0}}>
                          <span style={{display:'block',fontSize:10,color:'rgba(255,255,255,0.3)'}}>{d.brand}</span>{d.modello}
                        </button>
                      </td>
                      <td style={{...S.td,fontFamily:'monospace',fontSize:11}}>{d.storage||'—'}</td>
                      <td style={{...S.td,fontFamily:'monospace',fontSize:10,color:'rgba(255,255,255,0.3)'}}>{d.imei?d.imei.slice(0,8)+'â¦':'—'}</td>
                      <td style={S.td}><Badge label={d.condizione||'—'} color={COND_COLOR[d.condizione]||'gray'}/></td>
                      <td style={S.td}>
                        <select onChange={e=>updStato(d.id,e.target.value)} value={d.stato} style={{...S.sel,fontSize:11,minWidth:110}}>
                          {Object.entries(STATO_DEVICE).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                        </select>
                      </td>
                      <td style={S.td}><Badge label={d.provenienza} color={d.provenienza==='privato'?'teal':'blue'}/></td>
                      <td style={S.td}>€{d.prezzo_acq||0}</td>
                      <td style={S.td}>{d.prezzo_vend?`€${d.prezzo_vend}`:'—'}</td>
                      <td style={S.td}>
                        <button onClick={()=>openDev(d)} style={{background:'rgba(124,58,237,0.1)',border:'1px solid rgba(124,58,237,0.2)',color:'#c4b5fd',borderRadius:7,padding:'4px 10px',fontSize:11,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>🔧 Vedi</button>
                      </td>
                      <td style={S.td}><GBtn small danger onClick={()=>delDev(d.id)}>✕</GBtn></td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Pannello dettaglio dispositivo */}
      {wizard==='device_detail'&&selectedDev&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(6px)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#0a0f1e',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,width:'100%',maxWidth:640,maxHeight:'90vh',overflowY:'auto',fontFamily:'Inter,sans-serif',color:'white'}}>
            {/* Header */}
            <div style={{padding:'22px 26px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{fontSize:17,fontWeight:700,marginBottom:3}}>{selectedDev.brand} {selectedDev.modello}</div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <Badge label={selectedDev.storage||'—'} color="gray"/>
                  <Badge label={selectedDev.condizione} color={COND_COLOR[selectedDev.condizione]}/>
                  <Badge label={STATO_DEVICE[selectedDev.stato]} color={STATO_COLOR[selectedDev.stato]}/>
                  <Badge label={selectedDev.provenienza} color={selectedDev.provenienza==='privato'?'teal':'blue'}/>
                </div>
              </div>
              <button onClick={()=>setWizard(null)} style={{background:'rgba(255,255,255,0.07)',border:'none',color:'rgba(255,255,255,0.5)',width:30,height:30,borderRadius:8,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>

            {/* Info grid */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,padding:'18px 26px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
              {[['Acquistato','€'+(selectedDev.prezzo_acq||0)],['Vendita',selectedDev.prezzo_vend?'€'+selectedDev.prezzo_vend:'Non impostato'],['Costo interventi',<span style={{color:'#f87171'}}>€{costoTot().toFixed(2)}</span>],['IMEI',<span style={{fontFamily:'monospace',fontSize:11}}>{selectedDev.imei||'—'}</span>],['Colore',selectedDev.colore||'—'],['Cliente',selectedDev.cliente_nome||'—']].map(([l,v])=>(
                <div key={l} style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'10px 12px'}}>
                  <div style={{fontSize:9.5,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4,fontWeight:600}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:500}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Interventi */}
            <div style={{padding:'18px 26px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <div style={{fontSize:14,fontWeight:600}}>🔧 Storico interventi</div>
                <PBtn small onClick={()=>{ setEditingInt(null); setWizard('add_intervento') }}>+ Nuovo intervento</PBtn>
              </div>

              {interventi.length===0
                ? <div style={{textAlign:'center',padding:'24px 0',color:'rgba(255,255,255,0.2)',fontSize:13}}>
                    Nessun intervento registrato<br/>
                    <span style={{fontSize:12,color:'rgba(255,255,255,0.15)'}}>Clicca "+ Nuovo intervento" per aggiungere</span>
                  </div>
                : <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {interventi.map(i=>(
                      <div key={i.id} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'12px 15px',display:'flex',alignItems:'flex-start',gap:12}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                            <span style={{fontSize:13.5,fontWeight:600}}>{tipoLabel(i.tipo)}</span>
                            <Badge label={i.eseguito_da==='interno'?'Interno':'Esterno'} color={i.eseguito_da==='interno'?'blue':'amber'}/>
                            {i.costo>0&&<Badge label={`€${i.costo}`} color="red"/>}
                          </div>
                          {i.descrizione&&<div style={{fontSize:12,color:'rgba(255,255,255,0.45)',marginBottom:3}}>{i.descrizione}</div>}
                          {i.note&&<div style={{fontSize:11,color:'rgba(255,255,255,0.3)',borderLeft:'2px solid rgba(255,255,255,0.1)',paddingLeft:8,marginBottom:3}}>{i.note}</div>}
                          <div style={{fontSize:10.5,color:'rgba(255,255,255,0.25)'}}>{i.data?new Date(i.data).toLocaleDateString('it-IT'):''}{i.fornitore_nome?` Â· ${i.fornitore_nome}`:''}</div>
                        </div>
                        <div style={{display:'flex',gap:6,flexShrink:0}}>
                          <GBtn small onClick={()=>{ setEditingInt(i); setWizard('add_intervento') }}>✏️</GBtn>
                          <GBtn small danger onClick={()=>delInt(i.id)}>✕</GBtn>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        </div>
      )}

      {wizard==='add_device'&&<WizardDispositivo api={api} fornitori={fornitori} onDone={handleDev} onClose={()=>setWizard(null)}/>}
      {wizard==='add_intervento'&&selectedDev&&(
        <WizardIntervento api={api} device={selectedDev} fornitori={fornitori} editing={editingInt}
          onDone={handleInt} onClose={()=>setWizard('device_detail')}/>
      )}
    </div>
  )
}

// ââââââââââââââââââââââââââââââââââââââââââââââ
// TAB RICAMBI
// ââââââââââââââââââââââââââââââââââââââââââââââ
function TabRicambi({ api, showToast, autoOpen }) {
  const [ricambi, setRicambi] = useState([])
  const [fornitori, setFornitori] = useState([])
  const [alerts, setAlerts] = useState([])
  const [wizard, setWizard] = useState(null)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { if (autoOpen) { setEditing(null); setWizard('ricambio') } }, [autoOpen])

  const fetchAll = async () => {
    try {
      const [r,f] = await Promise.all([axios.get(`${api}/ricambi`),axios.get(`${api}/fornitori`)])
      setRicambi(r.data.data||[]); setAlerts(r.data.alerts||[]); setFornitori(f.data.data||[])
    } catch {}
  }

  const handleRicambio = (data, type) => {
    if(type==='add') setRicambi(prev=>[data,...prev])
    else setRicambi(prev=>prev.map(r=>r.id===data.id?data:r))
    showToast(type==='add'?'✓ Ricambio aggiunto':'✓ Ricambio aggiornato')
  }

  const del = async (id) => {
    setRicambi(prev=>prev.filter(r=>r.id!==id))
    try { await axios.delete(`${api}/ricambi/${id}`) } catch {}
    showToast('Eliminato')
  }

  const adjQty = async (id, delta) => {
    setRicambi(prev=>prev.map(r=>r.id===id?{...r,qty:Math.max(0,r.qty+delta)}:r))
    try { await axios.patch(`${api}/ricambi/${id}/qty`,{delta}) } catch {}
  }

  const nomeF = (id) => fornitori.find(f=>f.id===id)?.nome||'—'
  const filtered = search ? ricambi.filter(r=>r.nome.toLowerCase().includes(search.toLowerCase())||r.barcode===search) : ricambi
  const CAT_ICON = {batteria:'🔋',schermo:'📱',scocca:'🔧',altoparlante:'ð',fotocamera:'ð·',connettore:'ð',altro:'📦'}

  return (
    <div>
      {alerts.length>0&&(
        <div style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:10,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:18}}>⚠️</span>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:'#fbbf24',marginBottom:2}}>Scorte basse — rifornisciti!</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.45)'}}>{alerts.map(a=>`${a.nome} (${a.qty} pz.)`).join(' Â· ')}</div>
          </div>
        </div>
      )}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <div style={{position:'relative',maxWidth:280}}>
          <span style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',opacity:0.4}}>🔍</span>
          <input placeholder="Cerca o scansiona barcode..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{...S.sel,padding:'9px 12px 9px 34px',width:280,boxSizing:'border-box',borderRadius:9}}/>
        </div>
        <PBtn onClick={()=>{ setEditing(null); setWizard('ricambio') }}>+ Aggiungi ricambio</PBtn>
      </div>

      <div style={S.card}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr>{['Ricambio','Cat.','Compatibile','Fornitore','Acq.','Qtà','Barcode',''].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan="8" style={{textAlign:'center',padding:'40px 0',color:'rgba(255,255,255,0.2)'}}>🔧 Nessun ricambio — aggiungine uno!</td></tr>
                : filtered.map(r=>{
                    const low=r.qty<=r.qty_minima
                    return (
                      <tr key={r.id} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <td style={{...S.td,color:'white',fontWeight:500}}>{CAT_ICON[r.categoria]||'📦'} {r.nome}</td>
                        <td style={S.td}><Badge label={r.categoria} color="blue"/></td>
                        <td style={{...S.td,fontSize:11,color:'rgba(255,255,255,0.4)',maxWidth:140}}>{r.compatibile||'—'}</td>
                        <td style={S.td}>{nomeF(r.fornitore_id)}</td>
                        <td style={S.td}>€{r.prezzo_acq||0}</td>
                        <td style={S.td}>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <button onClick={()=>adjQty(r.id,-1)} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white',width:24,height:24,borderRadius:6,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>â</button>
                            <span style={{fontFamily:'monospace',fontWeight:700,color:low?'#f87171':'#4ade80',minWidth:26,textAlign:'center'}}>{r.qty}</span>
                            <button onClick={()=>adjQty(r.id,+1)} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white',width:24,height:24,borderRadius:6,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                            {low&&<Badge label="Basso" color="amber"/>}
                          </div>
                        </td>
                        <td style={{...S.td,fontFamily:'monospace',fontSize:11,color:'rgba(255,255,255,0.3)'}}>{r.barcode||'—'}</td>
                        <td style={S.td}>
                          <div style={{display:'flex',gap:6}}>
                            <GBtn small onClick={()=>{ setEditing(r); setWizard('ricambio') }}>✏️</GBtn>
                            <GBtn small danger onClick={()=>del(r.id)}>✕</GBtn>
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

      {wizard==='ricambio'&&<WizardRicambio api={api} fornitori={fornitori} editing={editing} onDone={handleRicambio} onClose={()=>setWizard(null)}/>}
    </div>
  )
}

// ââââââââââââââââââââââââââââââââââââââââââââââ
// COMPONENTE PRINCIPALE
// ââââââââââââââââââââââââââââââââââââââââââââââ
export default function Magazzino({ api, showToast, autoAction, onAutoActionDone }) {
  const [tab, setTab] = useState('prodotti')

  // Gestione azioni automatiche da "Crea nuovo" nella sidebar
  useEffect(() => {
    if (!autoAction) return
    if (autoAction === 'nuovo_prodotto')    { setTab('prodotti');    }
    if (autoAction === 'nuovo_ricambio')    { setTab('ricambi');     }
    if (autoAction === 'nuovo_dispositivo') { setTab('dispositivi'); }
    onAutoActionDone && onAutoActionDone()
  }, [autoAction])

  return (
    <div className="animate-fade-in">
      <div style={{marginBottom:24}}>
        <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Magazzino</div>
        <div style={{fontSize:13,color:'#64748b'}}>Gestisci prodotti, dispositivi e ricambi</div>
      </div>

      <div style={{display:'flex',gap:3,background:'rgba(255,255,255,0.04)',borderRadius:11,padding:3,width:'fit-content',marginBottom:22}}>
        {[{id:'prodotti',label:'📦 Prodotti'},{id:'dispositivi',label:'📱 Dispositivi'},{id:'ricambi',label:'🔧 Ricambi'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'8px 22px',borderRadius:9,fontSize:13.5,fontWeight:500,cursor:'pointer',border:'none',fontFamily:'Inter,sans-serif',transition:'all 0.15s',background:tab===t.id?'rgba(124,58,237,0.25)':'transparent',color:tab===t.id?'#c4b5fd':'rgba(255,255,255,0.4)',boxShadow:tab===t.id?'0 2px 8px rgba(124,58,237,0.2)':'none'}}>{t.label}</button>
        ))}
      </div>

      {tab==='prodotti'    && <TabProdotti    api={api} showToast={showToast} autoOpen={autoAction==='nuovo_prodotto'}/>}
      {tab==='dispositivi' && <TabDispositivi api={api} showToast={showToast} autoOpen={autoAction==='nuovo_dispositivo'}/>}
      {tab==='ricambi'     && <TabRicambi     api={api} showToast={showToast} autoOpen={autoAction==='nuovo_ricambio'}/>}
    </div>
  )
}
// Magazzino.jsx v3 — con Wizard guidati step-by-step
