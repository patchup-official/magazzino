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
