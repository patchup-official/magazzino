// Magazzino.jsx v3 — con Wizard guidati step-by-step

import { useState, useEffect } from 'react'
import axios from 'axios'
import Wizard, { OptionCard, WizField, wizInp, wizSel, Summary } from '../components/Wizard'

// ── Stili base ────────────────────────────────
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
  {val:'rigenerazione',        label:'♻️ Rigenerazione completa',desc:'Ripristino e test completo'},
  {val:'altro',                label:'📝 Altro',                 desc:'Intervento personalizzato'},
]

// ══════════════════════════════════════════════
// WIZARD PRODOTTO
// ══════════════════════════════════════════════
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
                  icon={{'Cover':'🛡️','Caricabatterie':'⚡','Cavo':'🔌','Auricolari':'🎧','Vetro temperato':'🔲','Accessori':'🎒','Prodotto proprio':'⭐'}[c]}
                />
              ))}
            </div>
          </WizField>
        </div>
      )
    },
    {
      title: 'Prezzi e quantità',
      heading: '💶 Quanto costa?',
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
      heading: '✅ Tutto ok?',
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

// ══════════════════════════════════════════════
// WIZARD FORNITORE
// ══════════════════════════════════════════════

// ââââââââââââââââââââââââââââââââââââââââââââââ
function WizardFornitore({ api, onDone, onClose, editing }) {
  const [f, setF] = useState(editing || {nome:'',contatto:'',email:'',telefono:'',piva:'',indirizzo:'',note:''})
  const upd = c => setF(p=>({...p,...c}))

  const steps = [
    {
      title:'Nome azienda',
      heading:'ð­ Come si chiama il fornitore?',
      subtitle:'Inserisci il nome dell\'azienda o del fornitore.',
      validate:()=>{ if(!f.nome.trim()) return 'Il nome del fornitore Ã¨ obbligatorio' },
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
          {label:'Referente', val:f.contatto||'â'},
          {label:'Telefono',  val:f.telefono||'â'},
          {label:'Email',     val:f.email||'â'},
          {label:'P.IVA',     val:f.piva||'â'},
          {label:'Indirizzo', val:f.indirizzo||'â'},
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
      heading:'ð± Che marca Ã¨?',
      subtitle:'Seleziona il produttore del dispositivo.',
      content:(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          {BRANDS.map(b=>(
            <OptionCard key={b} label={b} selected={f.brand===b} onClick={()=>upd({brand:b})}
              icon={{'Apple':'ð','Samsung':'ð²','Google':'ð','Xiaomi':'â¡','OnePlus':'ð´','Huawei':'ð'}[b]}
            />
          ))}
        </div>
      )
    },
    {
      title:'Modello e storage',
      heading:`âï¸ Qual Ã¨ il modello?`,
      subtitle:`Inserisci il modello esatto e la capacitÃ  di memoria.`,
      validate:()=>{ if(!f.modello.trim()) return 'Il modello Ã¨ obbligatorio' },
      content:(
        <div>
          <WizField label="Modello" hint={`Es. ${f.brand==='Apple'?'iPhone 15 Pro, iPhone 14':f.brand==='Samsung'?'Galaxy S24, Galaxy A54':'Pixel 8, Redmi Note 13...'}`}>
            <input {...wizInp} placeholder={`Es. ${f.brand==='Apple'?'iPhone 15 Pro':'Galaxy S24'}`} value={f.modello} onChange={e=>upd({modello:e.target.value})} autoFocus style={{...wizInp,width:'100%',boxSizing:'border-box'}}/>
          </WizField>
          <WizField label="CapacitÃ  di memoria">
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
      heading:'ð In che condizioni Ã¨?',
      subtitle:'Valuta onestamente le condizioni estetiche e funzionali del dispositivo.',
      content:(
        <div>
          {[
            {val:'A',label:'A â Ottima',icon:'â­',desc:'Come nuovo, nessun segno di usura'},
            {val:'B',label:'B â Buona', icon:'ð',desc:'Leggeri segni di usura, funziona perfettamente'},
            {val:'C',label:'C â Discreta',icon:'ð',desc:'Graffi evidenti o piccoli difetti ma funzionante'},
          ].map(c=>(
            <OptionCard key={c.val} icon={c.icon} label={c.label} desc={c.desc} selected={f.condizione===c.val} onClick={()=>upd({condizione:c.val})}/>
          ))}
          <div style={{marginTop:16}}/>
          <WizField label="Provenienza">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <OptionCard icon="ð­" label="Fornitore" desc="Acquistato da un grossista" selected={f.provenienza==='fornitore'} onClick={()=>upd({provenienza:'fornitore'})}/>
              <OptionCard icon="ð¤" label="Privato" desc="Acquistato da un cliente" selected={f.provenienza==='privato'} onClick={()=>upd({provenienza:'privato'})}/>
            </div>
          </WizField>
        </div>
      )
    },
    {
      title:'IMEI e prezzi',
      heading:'ð¶ IMEI e prezzi',
      subtitle:'Inserisci il numero IMEI e i prezzi. Il prezzo di vendita Ã¨ facoltativo.',
      validate:()=>{ if(!f.prezzo_acq||isNaN(+f.prezzo_acq)||+f.prezzo_acq<=0) return 'Inserisci un prezzo di acquisto valido' },
      content:(
        <div>
          <WizField label="IMEI" hint="Digita *#06# sul telefono per trovarlo">
            <input {...wizInp} placeholder="356xxxxxxxxxxxxxx" value={f.imei} onChange={e=>upd({imei:e.target.value})} style={{...wizInp,fontFamily:'monospace',fontSize:13,width:'100%',boxSizing:'border-box'}} maxLength={15}/>
          </WizField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <WizField label="Prezzo acquisto (â¬)">
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.4)',fontSize:16}}>â¬</span>
                <input {...wizInp} type="number" step="0.01" min="0" placeholder="200" value={f.prezzo_acq} onChange={e=>upd({prezzo_acq:e.target.value})} style={{...wizInp,paddingLeft:30,width:'100%',boxSizing:'border-box'}}/>
              </div>
            </WizField>
            <WizField label="Prezzo vendita (â¬)" hint="Facoltativo, aggiungi dopo">
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.4)',fontSize:16}}>â¬</span>
                <input {...wizInp} type="number" step="0.01" min="0" placeholder="350" value={f.prezzo_vend} onChange={e=>upd({prezzo_vend:e.target.value})} style={{...wizInp,paddingLeft:30,width:'100%',boxSizing:'border-box'}}/>
              </div>
            </WizField>
          </div>
