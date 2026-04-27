// pages/StoricoDispositivi.jsx v2.0
import { useState, useEffect, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://magazzino-backend-f7vr.onrender.com'
const IVA = 0.22
const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const TIPI_DISP = ['Smartphone','Tablet','Laptop','Smartwatch','Console','Fotocamera','Altro']
const MARCHE = ['Apple','Samsung','Xiaomi','Huawei','OnePlus','Google','Sony','LG','Motorola','Nokia','Oppo','Realme','Altra']
const CONDIZIONI = [{v:'ottimo',l:'Ottimo'},{v:'buono',l:'Buono'},{v:'discreto',l:'Discreto'},{v:'danneggiato',l:'Danneggiato'}]
const fmtE = v => String.fromCharCode(8364)+' '+Number(v||0).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2})
const oggi = () => new Date().toISOString().slice(0,10)

function generaNumOrdine(){
  const now=new Date()
  const ymd=now.getFullYear().toString()+String(now.getMonth()+1).padStart(2,'0')+String(now.getDate()).padStart(2,'0')
  return 'VND-'+ymd+'-'+Math.floor(1000+Math.random()*9000)
}

function buildPdfHtml(disp, form, pa, pv, margine, ivaReale, nom, numOrdine, isReprint){
  const css='body{font-family:Arial,sans-serif;font-size:12px;margin:30px;color:#222}'
    +'h1{font-size:18px;margin-bottom:4px}'
    +'.dis{background:#fff3cd;border:2px solid #f59e0b;padding:14px;margin:16px 0;font-weight:bold;text-align:center;color:#92400e;border-radius:6px}'
    +'table{border-collapse:collapse;width:100%;margin:10px 0}'
    +'th,td{border:1px solid #ccc;padding:6px 9px;text-align:left}'
    +'th{background:#f0f0f0}'
    +'.sec{margin-top:16px;font-weight:bold;font-size:13px;border-bottom:2px solid #333;padding-bottom:2px;margin-bottom:6px}'
    +'.tot{font-weight:bold;background:#e8f5e9}'
    +'.ft{margin-top:28px;font-size:10px;color:#888;border-top:1px solid #ccc;padding-top:8px}'
    +'@media print{body{margin:8px}}'
  const op=isReprint?(disp.operatore||'nd'):(form.operatore||'nd')
  const note=isReprint?(disp.note_vendita||''):(form.note_vendita||'')
  const email=isReprint?(disp.acquirente_email||''):(form.acquirente_email||'')
  const data=isReprint?(disp.data_vendita||''):(form.data_vendita||'')
  const tel=isReprint?(disp.acquirente_telefono||'nd'):(form.acquirente_telefono||'nd')
  const addr=isReprint
    ?((disp.acquirente_indirizzo||'')+', '+(disp.acquirente_cap||'')+' '+(disp.acquirente_citta||''))
    :(form.acquirente_indirizzo+', '+form.acquirente_cap+' '+form.acquirente_citta+' ('+form.acquirente_provincia+')')
  const cfp=isReprint?(disp.acquirente_cf||disp.acquirente_piva||'nd'):(form.acquirente_cf||form.acquirente_piva||'nd')
  const r1='<tr><th>Tipo</th><td>'+disp.dispositivo_tipo+'</td><th>Marca/Modello</th><td>'+disp.dispositivo_marca+' '+disp.dispositivo_modello+'</td></tr>'
    +'<tr><th>IMEI</th><td>'+(disp.dispositivo_imei||'nd')+'</td><th>Colore/Storage</th><td>'+(disp.dispositivo_colore||'nd')+' '+(disp.dispositivo_storage||'')+'</td></tr>'
    +'<tr><th>Condizione</th><td>'+disp.dispositivo_condizione+'</td><th>Note</th><td>'+(disp.dispositivo_note||'nd')+'</td></tr>'
  const r2='<tr><th>Nome/Ragione Sociale</th><td>'+nom+'</td><th>CF/PIVA</th><td>'+cfp+'</td></tr>'
    +'<tr><th>Indirizzo</th><td>'+addr+'</td><th>Email</th><td>'+email+'</td></tr>'
    +'<tr><th>Tel</th><td colspan="3">'+tel+'</td></tr>'
  const r3='<tr><th>Prezzo di acquisto</th><td style="text-align:right;font-weight:bold">euro '+pv.toFixed(2)+'</td></tr>'
  const nb=note?'<div class="sec">NOTE</div><p>'+note+'</p>':''
  const ft='Generato da Enown/Magazzino il '+new Date().toLocaleString('it-IT')+' N.Ordine '+numOrdine
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Doc '+numOrdine+'</title><style>'+css+'</style></head><body>'
    +'<h1>Documento di Vendita</h1><p style="color:#555">N. Ordine: <b>'+numOrdine+'</b> | Data: <b>'+data+'</b></p>'
    +'<div class="dis">ATTENZIONE: QUESTO DOCUMENTO NON VALE AI FINI FISCALI<br>Riepilogo interno - la fattura fiscale verra emessa separatamente.</div>'
    +'<div class="sec">VENDITORE</div><table><tr><th>Operatore</th><td>'+op+'</td></tr></table>'
    +'<div class="sec">DISPOSITIVO VENDUTO</div><table>'+r1+'</table>'
    +'<div class="sec">ACQUIRENTE</div><table>'+r2+'</table>'
    +'<div class="sec">RIEPILOGO ACQUISTO</div><table>'+r3+'</table>'
    +nb
    +'<div class="ft">'+ft+'<br>QUESTO DOCUMENTO NON SOSTITUISCE LA FATTURA FISCALE.</div>'
    +'</body></html>'
}

function openPdf(h){const w=window.open('','_blank');if(w){w.document.write(h);w.document.close();setTimeout(()=>w.print(),500)}}

const inp = {background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:9,padding:'10px 14px',color:'#f1f5f9',fontFamily:'Inter,sans-serif',fontSize:13.5,width:'100%',boxSizing:'border-box',outline:'none'}
const lbl = {fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'.07em',display:'block',marginBottom:6}
const btnP = {background:'linear-gradient(135deg,#1d4ed8,#2563eb)',border:'none',borderRadius:10,padding:'11px 24px',color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer'}
const btnS = {background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'11px 20px',color:'#94a3b8',fontWeight:600,fontSize:14,cursor:'pointer'}

function Campo({label,required,error,children}){
  return(<div style={{display:'flex',flexDirection:'column',gap:4}}>
    <label style={lbl}>{label}{required&&<span style={{color:'#f87171',marginLeft:3}}>*</span>}</label>
    {children}
    {error&&<span style={{fontSize:11,color:'#f87171',marginTop:2}}>{error}</span>}
  </div>)
}

function WizardVendita({dispositivo,onSalva,onAnnulla}){
  const [step,setStep]=useState(0)
  const [form,setForm]=useState({numero_ordine:generaNumOrdine(),data_vendita:oggi(),prezzo_vendita:'',
    acquirente_tipo:'privato',acquirente_nome:'',acquirente_cognome:'',acquirente_email:'',acquirente_telefono:'',
    acquirente_cf:'',acquirente_piva:'',acquirente_ragione_sociale:'',
    acquirente_indirizzo:'',acquirente_cap:'',acquirente_citta:'',acquirente_provincia:'',
    operatore:'',note_vendita:''})
  const [errors,setErrors]=useState({})
  const [saving,setSaving]=useState(false)
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))
  const clr=(k)=>setErrors(e=>({...e,[k]:undefined}))
  const pv=parseFloat(form.prezzo_vendita)||0
  const pa=dispositivo?.prezzo_acquisto||0
  const margine=Math.max(0,pv-pa)
  const ivaReale=margine/(1+IVA)*IVA

  function valida(s){
    const e={}
    if(s===0&&(!form.prezzo_vendita||pv<=0))e.prezzo_vendita='Inserisci il prezzo di vendita'
    if(s===1){
      if(form.acquirente_tipo==='azienda'){
        if(!form.acquirente_ragione_sociale)e.acquirente_ragione_sociale='Ragione sociale obbligatoria'
        if(!form.acquirente_piva)e.acquirente_piva='P.IVA obbligatoria'
      }else{
        if(!form.acquirente_nome)e.acquirente_nome='Nome obbligatorio'
        if(!form.acquirente_cognome)e.acquirente_cognome='Cognome obbligatorio'
        if(!form.acquirente_cf)e.acquirente_cf='Codice Fiscale obbligatorio'
      }
      if(!form.acquirente_email)e.acquirente_email='Email obbligatoria per fattura'
      if(form.acquirente_email&&!/\S+@\S+\.\S+/.test(form.acquirente_email))e.acquirente_email='Email non valida'
      if(!form.acquirente_indirizzo)e.acquirente_indirizzo='Indirizzo obbligatorio'
      if(!form.acquirente_citta)e.acquirente_citta='Citta obbligatoria'
    }
    setErrors(e);return Object.keys(e).length===0
  }

  function avanti(){if(valida(step))setStep(s=>s+1)}

  function apriFirma(){
    const nom=(form.acquirente_tipo==='azienda'?form.acquirente_ragione_sociale:(form.acquirente_nome+' '+form.acquirente_cognome)).trim()
    openPdf(buildPdfHtml(dispositivo,form,pa,pv,margine,ivaReale,nom,form.numero_ordine,false))
  }

  async function conferma(){
    setSaving(true);setErrors({})
    try{
      const r=await fetch(API+'/storico-dispositivi/'+dispositivo.id+'/vendi',{
        method:'PUT',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...form,prezzo_vendita:pv,fattura_numero:form.numero_ordine})})
      const d=await r.json()
      if(!r.ok||d.error)throw new Error(d.error||'Errore server '+r.status)
      onSalva(d)
    }catch(e){setErrors({global:e.message})}
    finally{setSaving(false)}
  }

  if(!dispositivo)return null

  return(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
    <div style={{background:'#0a0f1e',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto',fontFamily:'Inter,sans-serif'}}>
      <div style={{padding:'22px 28px 18px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div style={{fontSize:16,fontWeight:700,color:'#f1f5f9',marginBottom:4}}>Registra vendita</div>
        <div style={{fontSize:13,color:'#64748b'}}>{dispositivo.dispositivo_marca} {dispositivo.dispositivo_modello}</div>
        <div style={{display:'flex',gap:6,marginTop:14}}>
          {['Prezzo','Acquirente','Conferma'].map((s,i)=>(
            <div key={i} style={{flex:1,textAlign:'center'}}>
              <div style={{height:3,borderRadius:2,background:i<=step?'#3b82f6':'rgba(255,255,255,0.1)',marginBottom:4}}/>
              <div style={{fontSize:10,fontWeight:600,color:i<=step?'#60a5fa':'#475569'}}>{s}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:'22px 28px'}}>
        {errors.global&&<div style={{padding:'10px 14px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,color:'#f87171',fontSize:13,marginBottom:16}}>{errors.global}</div>}

        {step===0&&<div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{textAlign:'center',padding:'14px',background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.2)',borderRadius:12}}>
            <div style={{fontSize:11,color:'#64748b',marginBottom:4}}>PREZZO ACQUISTO DA PRIVATO</div>
            <div style={{fontSize:24,fontWeight:800,fontFamily:'monospace',color:'#f87171'}}>{fmtE(pa)}</div>
          </div>
          <Campo label="Prezzo di vendita" required error={errors.prezzo_vendita}>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#64748b',fontSize:16}}>€</span>
              <input type="number" autoFocus value={form.prezzo_vendita}
                onChange={e=>{set('prezzo_vendita',e.target.value);clr('prezzo_vendita')}}
                style={{...inp,paddingLeft:32,fontSize:22,fontFamily:'monospace',fontWeight:700}}
                step="0.01" min="0" placeholder="0.00"/>
            </div>
          </Campo>
          {pv>0&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
            {[['Costo acquisto',pa,'#f87171'],['Margine reale',margine,'#34d399'],['IVA sul margine',ivaReale,'#fbbf24']].map(([n,v,c])=>(
              <div key={n} style={{padding:'10px 12px',borderRadius:9,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',textAlign:'center'}}>
                <div style={{fontSize:10,color:'#64748b',marginBottom:3}}>{n}</div>
                <div style={{fontFamily:'monospace',fontWeight:700,fontSize:14,color:c}}>{fmtE(v)}</div>
              </div>
            ))}
          </div>}
          <Campo label="Data vendita" required>
            <input type="date" value={form.data_vendita} onChange={e=>set('data_vendita',e.target.value)} style={inp}/>
          </Campo>
        </div>}

        {step===1&&<div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <label style={lbl}>Tipo acquirente</label>
            <div style={{display:'flex',gap:8}}>
              {[['privato','Privato'],['azienda','Azienda']].map(([v,l])=>(
                <button key={v} onClick={()=>set('acquirente_tipo',v)}
                  style={{flex:1,padding:'9px',borderRadius:9,cursor:'pointer',fontWeight:600,fontSize:13,
                    background:form.acquirente_tipo===v?'#2563eb':'rgba(255,255,255,0.05)',
                    border:'1px solid '+(form.acquirente_tipo===v?'#3b82f6':'rgba(255,255,255,0.1)'),
                    color:form.acquirente_tipo===v?'#fff':'#94a3b8'}}>{l}</button>
              ))}
            </div>
          </div>
          {form.acquirente_tipo==='azienda'?(<>
            <Campo label="Ragione Sociale" required error={errors.acquirente_ragione_sociale}><input style={inp} value={form.acquirente_ragione_sociale} onChange={e=>{set('acquirente_ragione_sociale',e.target.value);clr('acquirente_ragione_sociale')}} placeholder="Acme Srl"/></Campo>
            <Campo label="P.IVA" required error={errors.acquirente_piva}><input style={inp} value={form.acquirente_piva} onChange={e=>{set('acquirente_piva',e.target.value);clr('acquirente_piva')}} placeholder="IT12345678901"/></Campo>
          </>):(<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Campo label="Nome" required error={errors.acquirente_nome}><input style={inp} value={form.acquirente_nome} onChange={e=>{set('acquirente_nome',e.target.value);clr('acquirente_nome')}} placeholder="Mario"/></Campo>
            <Campo label="Cognome" required error={errors.acquirente_cognome}><input style={inp} value={form.acquirente_cognome} onChange={e=>{set('acquirente_cognome',e.target.value);clr('acquirente_cognome')}} placeholder="Rossi"/></Campo>
            <Campo label="Codice Fiscale" required error={errors.acquirente_cf}><input style={inp} value={form.acquirente_cf} onChange={e=>{set('acquirente_cf',e.target.value.toUpperCase());clr('acquirente_cf')}} placeholder="RSSMRA80A01H501Z" maxLength={16}/></Campo>
            <Campo label="Telefono"><input style={inp} value={form.acquirente_telefono} onChange={e=>set('acquirente_telefono',e.target.value)} placeholder="+39 333..."/></Campo>
          </div>)}
          <Campo label="Email (per fattura)" required error={errors.acquirente_email}><input type="email" style={inp} value={form.acquirente_email} onChange={e=>{set('acquirente_email',e.target.value);clr('acquirente_email')}} placeholder="mario.rossi@email.com"/></Campo>
          <Campo label="Indirizzo" required error={errors.acquirente_indirizzo}><input style={inp} value={form.acquirente_indirizzo} onChange={e=>{set('acquirente_indirizzo',e.target.value);clr('acquirente_indirizzo')}} placeholder="Via Roma 1"/></Campo>
          <div style={{display:'grid',gridTemplateColumns:'1fr 2fr 1fr',gap:10}}>
            <Campo label="CAP"><input style={inp} value={form.acquirente_cap} onChange={e=>set('acquirente_cap',e.target.value)} placeholder="10100" maxLength={5}/></Campo>
            <Campo label="Citta" required error={errors.acquirente_citta}><input style={inp} value={form.acquirente_citta} onChange={e=>{set('acquirente_citta',e.target.value);clr('acquirente_citta')}} placeholder="Torino"/></Campo>
            <Campo label="Prov."><input style={inp} value={form.acquirente_provincia} onChange={e=>set('acquirente_provincia',e.target.value.toUpperCase())} placeholder="TO" maxLength={2}/></Campo>
          </div>
          <Campo label="Operatore"><input style={inp} value={form.operatore} onChange={e=>set('operatore',e.target.value)} placeholder="Chi ha effettuato la vendita"/></Campo>
          <Campo label="Note"><textarea style={{...inp,resize:'vertical',minHeight:60}} value={form.note_vendita} onChange={e=>set('note_vendita',e.target.value)} placeholder="Note aggiuntive..."/></Campo>
        </div>}

        {step===2&&<div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{fontSize:15,fontWeight:700,color:'#f1f5f9',marginBottom:4}}>Riepilogo vendita</div>
          <div style={{padding:'14px 18px',background:'rgba(59,130,246,0.06)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:12}}>
            <div style={{fontSize:11,color:'#60a5fa',fontWeight:700,marginBottom:6,textTransform:'uppercase'}}>Dispositivo</div>
            <div style={{fontSize:14,fontWeight:600,color:'#f1f5f9'}}>{dispositivo.dispositivo_marca} {dispositivo.dispositivo_modello}</div>
          </div>
          <div style={{padding:'14px 18px',background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:12}}>
            <div style={{fontSize:11,color:'#34d399',fontWeight:700,marginBottom:8,textTransform:'uppercase'}}>Calcolo Art.36</div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}><span style={{fontSize:13,color:'#94a3b8'}}>Prezzo acquisto da privato</span><span style={{fontFamily:'monospace',fontWeight:700,color:'#f87171'}}>{fmtE(pa)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}><span style={{fontSize:13,color:'#94a3b8'}}>Prezzo vendita</span><span style={{fontFamily:'monospace',fontWeight:700,color:'#60a5fa'}}>{fmtE(pv)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}><span style={{fontSize:13,color:'#94a3b8'}}>Margine reale</span><span style={{fontFamily:'monospace',fontWeight:700,color:'#34d399'}}>{fmtE(margine)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0'}}><span style={{fontSize:13,color:'#94a3b8'}}>IVA da versare (22% su margine)</span><span style={{fontFamily:'monospace',fontWeight:700,color:'#fbbf24'}}>{fmtE(ivaReale)}</span></div>
          </div>
          <div style={{padding:'14px 18px',background:'rgba(168,85,247,0.06)',border:'1px solid rgba(168,85,247,0.2)',borderRadius:12}}>
            <div style={{fontSize:11,color:'#c084fc',fontWeight:700,marginBottom:6,textTransform:'uppercase'}}>Acquirente</div>
            <div style={{fontSize:14,fontWeight:600,color:'#f1f5f9'}}>{form.acquirente_tipo==='azienda'?form.acquirente_ragione_sociale:form.acquirente_nome+' '+form.acquirente_cognome}</div>
            <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{form.acquirente_email}{form.acquirente_citta?' - '+form.acquirente_citta:''}</div>
          </div>
          <div style={{padding:'10px 14px',background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.25)',borderRadius:8,fontSize:12,color:'#fbbf24',textAlign:'center'}}>
            N. Ordine: <strong>{form.numero_ordine}</strong>
          </div>
          <button onClick={apriFirma}
            style={{width:'100%',padding:'10px',borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:700,
              background:'rgba(59,130,246,0.15)',border:'1px solid rgba(59,130,246,0.3)',color:'#60a5fa'}}>
            Genera documento di vendita (PDF)
          </button>
        </div>}

        <div style={{display:'flex',justifyContent:'space-between',marginTop:20,paddingTop:16,borderTop:'1px solid rgba(255,255,255,0.07)'}}>
          <button onClick={step===0?onAnnulla:()=>setStep(s=>s-1)} style={btnS}>{step===0?'Annulla':'Indietro'}</button>
          {step<2
            ?<button onClick={avanti} style={btnP}>Avanti</button>
            :<button onClick={conferma} disabled={saving} style={{...btnP,background:saving?'#1e40af':'linear-gradient(135deg,#15803d,#16a34a)',opacity:saving?0.7:1}}>{saving?'Salvataggio...':'Conferma vendita'}</button>
          }
        </div>
      </div>
    </div>
  </div>)
}

function FormAcquisto({onSalva,onAnnulla,editItem}){
  const [form,setForm]=useState(editItem||{
    data_acquisto:oggi(),venditore_nome:'',venditore_cognome:'',
    venditore_doc_tipo:'CI',venditore_doc_numero:'',venditore_telefono:'',venditore_indirizzo:'',
    dispositivo_tipo:'Smartphone',dispositivo_marca:'Apple',dispositivo_modello:'',
    dispositivo_imei:'',dispositivo_seriale:'',dispositivo_colore:'',dispositivo_storage:'',
    dispositivo_condizione:'buono',dispositivo_note:'',prezzo_acquisto:'',operatore:''
  })
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))

  async function salva(){
    if(!form.venditore_nome)return setError('Nome venditore obbligatorio')
    if(!form.dispositivo_modello)return setError('Modello dispositivo obbligatorio')
    if(!form.prezzo_acquisto||+form.prezzo_acquisto<=0)return setError('Prezzo acquisto obbligatorio')
    setSaving(true);setError('')
    try{
      const url=editItem?API+'/storico-dispositivi/'+editItem.id:API+'/storico-dispositivi'
      const r=await fetch(url,{method:editItem?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,prezzo_acquisto:+form.prezzo_acquisto})})
      const d=await r.json()
      if(!r.ok||d.error)throw new Error(d.error||'Errore server')
      onSalva(d)
    }catch(e){setError(e.message)}
    finally{setSaving(false)}
  }

  return(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
    <div style={{background:'#0a0f1e',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,width:'100%',maxWidth:600,maxHeight:'90vh',overflowY:'auto',fontFamily:'Inter,sans-serif'}}>
      <div style={{padding:'22px 28px 16px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div style={{fontSize:16,fontWeight:700,color:'#f1f5f9'}}>{editItem?'Modifica acquisto':'Registra acquisto da privato'}</div>
        <div style={{fontSize:12,color:'#64748b',marginTop:3}}>Art.36 - tutti i dati per carico/scarico fiscale</div>
      </div>
      <div style={{padding:'22px 28px',display:'flex',flexDirection:'column',gap:18}}>
        {error&&<div style={{padding:'10px 14px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,color:'#f87171',fontSize:13}}>{error}</div>}
        <div>
          <div style={{fontSize:12,color:'#60a5fa',fontWeight:700,marginBottom:12,textTransform:'uppercase',letterSpacing:.7}}>Venditore (privato)</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Campo label="Nome" required><input style={inp} autoFocus value={form.venditore_nome} onChange={e=>set('venditore_nome',e.target.value)} placeholder="Mario"/></Campo>
            <Campo label="Cognome"><input style={inp} value={form.venditore_cognome} onChange={e=>set('venditore_cognome',e.target.value)} placeholder="Rossi"/></Campo>
            <Campo label="Tipo documento"><select style={inp} value={form.venditore_doc_tipo} onChange={e=>set('venditore_doc_tipo',e.target.value)}>{['CI','Passaporto','Patente','Permesso soggiorno'].map(t=><option key={t}>{t}</option>)}</select></Campo>
            <Campo label="N Documento"><input style={inp} value={form.venditore_doc_numero} onChange={e=>set('venditore_doc_numero',e.target.value)} placeholder="AB1234567"/></Campo>
            <Campo label="Telefono"><input style={inp} value={form.venditore_telefono} onChange={e=>set('venditore_telefono',e.target.value)} placeholder="+39 333..."/></Campo>
            <Campo label="Data acquisto" required><input type="date" style={inp} value={form.data_acquisto} onChange={e=>set('data_acquisto',e.target.value)}/></Campo>
          </div>
        </div>
        <div>
          <div style={{fontSize:12,color:'#a78bfa',fontWeight:700,marginBottom:12,textTransform:'uppercase',letterSpacing:.7}}>Dispositivo</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Campo label="Tipo"><select style={inp} value={form.dispositivo_tipo} onChange={e=>set('dispositivo_tipo',e.target.value)}>{TIPI_DISP.map(t=><option key={t}>{t}</option>)}</select></Campo>
            <Campo label="Marca"><select style={inp} value={form.dispositivo_marca} onChange={e=>set('dispositivo_marca',e.target.value)}>{MARCHE.map(m=><option key={m}>{m}</option>)}</select></Campo>
            <Campo label="Modello" required><input style={inp} value={form.dispositivo_modello} onChange={e=>set('dispositivo_modello',e.target.value)} placeholder="iPhone 13 128GB"/></Campo>
            <Campo label="IMEI / Seriale"><input style={inp} value={form.dispositivo_imei} onChange={e=>set('dispositivo_imei',e.target.value)} placeholder="353xxxxxxxxx"/></Campo>
            <Campo label="Colore"><input style={inp} value={form.dispositivo_colore} onChange={e=>set('dispositivo_colore',e.target.value)} placeholder="Nero"/></Campo>
            <Campo label="Storage"><input style={inp} value={form.dispositivo_storage} onChange={e=>set('dispositivo_storage',e.target.value)} placeholder="128GB"/></Campo>
          </div>
          <div style={{marginTop:12}}>
            <label style={lbl}>Condizione</label>
            <div style={{display:'flex',gap:8}}>
              {CONDIZIONI.map(c=>(
                <button key={c.v} onClick={()=>set('dispositivo_condizione',c.v)}
                  style={{flex:1,padding:'8px 4px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600,
                    background:form.dispositivo_condizione===c.v?'#2563eb':'rgba(255,255,255,0.05)',
                    border:'1px solid '+(form.dispositivo_condizione===c.v?'#3b82f6':'rgba(255,255,255,0.1)'),
                    color:form.dispositivo_condizione===c.v?'#fff':'#94a3b8'}}>{c.l}</button>
              ))}
            </div>
          </div>
          <div style={{marginTop:12}}><Campo label="Note dispositivo"><input style={inp} value={form.dispositivo_note} onChange={e=>set('dispositivo_note',e.target.value)} placeholder="Schermo graffiato, no caricatore..."/></Campo></div>
        </div>
        <div>
          <div style={{fontSize:12,color:'#34d399',fontWeight:700,marginBottom:12,textTransform:'uppercase',letterSpacing:.7}}>Prezzo acquisto</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Campo label="Prezzo pagato al privato" required>
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#64748b'}}>€</span>
                <input type="number" style={{...inp,paddingLeft:28,fontSize:18,fontFamily:'monospace',fontWeight:700}} value={form.prezzo_acquisto} onChange={e=>set('prezzo_acquisto',e.target.value)} step="0.01" min="0" placeholder="0.00"/>
              </div>
            </Campo>
            <Campo label="Operatore"><input style={inp} value={form.operatore} onChange={e=>set('operatore',e.target.value)} placeholder="Chi ha gestito l'acquisto"/></Campo>
          </div>
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.07)'}}>
          <button onClick={onAnnulla} style={btnS}>Annulla</button>
          <button onClick={salva} disabled={saving} style={btnP}>{saving?'Salvataggio...':'Registra acquisto'}</button>
        </div>
      </div>
    </div>
  </div>)
}

export default function StoricoDispositivi({showToast}){
  const [tab,setTab]=useState('magazzino')
  const [lista,setLista]=useState([])
  const [loading,setLoading]=useState(false)
  const [showAcquisto,setShowAcquisto]=useState(false)
  const [editItem,setEditItem]=useState(null)
  const [vendita,setVendita]=useState(null)
  const [filtroAnno,setFiltroAnno]=useState(new Date().getFullYear())
  const [filtroMese,setFiltroMese]=useState(new Date().getMonth()+1)
  const [filtroStato,setFiltroStato]=useState('')
  const [ricerca,setRicerca]=useState('')

  const carica=useCallback(async()=>{
    setLoading(true)
    try{
      let url
      if(tab==='magazzino'){url=API+'/storico-dispositivi/magazzino'}
      else{const p=new URLSearchParams();p.set('anno',filtroAnno);if(filtroMese)p.set('mese',filtroMese);if(filtroStato)p.set('stato',filtroStato);if(ricerca)p.set('q',ricerca);url=API+'/storico-dispositivi?'+p}
      const r=await fetch(url)
      setLista(r.ok?await r.json():[])
    }catch(e){setLista([])}
    finally{setLoading(false)}
  },[tab,filtroAnno,filtroMese,filtroStato,ricerca])

  useEffect(()=>{carica()},[carica])

  function ristampaPdf(item){
    const nom=(item.acquirente_tipo==='azienda'?item.acquirente_ragione_sociale:(item.acquirente_nome||'')+' '+(item.acquirente_cognome||'')).trim()
    const pa=item.prezzo_acquisto||0,pv=item.prezzo_vendita||0
    const margine=Math.max(0,pv-pa),ivaReale=margine/(1+IVA)*IVA
    const numOrdine=item.fattura_numero||('VND-'+(item.data_vendita||'').replace(/-/g,'')+'-????')
    openPdf(buildPdfHtml(item,item,pa,pv,margine,ivaReale,nom,numOrdine,true))
  }

  function esportaCsv(){
    const COLS=['ID','Data Acq.','Venditore Nome','Venditore Cognome','Doc Tipo','Doc N','Tel','Tipo','Marca','Modello','IMEI','Seriale','Colore','Storage','Condizione','Note Disp.','Prezzo Acquisto','Stato','Data Vendita','Acq. Tipo','Acq. Nome','Acq. Cognome','Email','Telefono','CF','PIVA','Ragione Sociale','Indirizzo','CAP','Citta','Provincia','Prezzo Vendita','Margine','IVA Margine','N Fattura','Operatore','Note Vendita']
    const rows=[COLS]
    lista.forEach(r=>{rows.push([r.id,r.data_acquisto,r.venditore_nome,r.venditore_cognome,r.venditore_doc_tipo,r.venditore_doc_numero,r.venditore_telefono,r.dispositivo_tipo,r.dispositivo_marca,r.dispositivo_modello,r.dispositivo_imei,r.dispositivo_seriale,r.dispositivo_colore,r.dispositivo_storage,r.dispositivo_condizione,r.dispositivo_note,(r.prezzo_acquisto||0).toFixed(2),r.stato,r.data_vendita||'',r.acquirente_tipo,r.acquirente_nome,r.acquirente_cognome,r.acquirente_email,r.acquirente_telefono,r.acquirente_cf,r.acquirente_piva,r.acquirente_ragione_sociale,r.acquirente_indirizzo,r.acquirente_cap,r.acquirente_citta,r.acquirente_provincia,(r.prezzo_vendita||0).toFixed(2),(r.margine_art36||0).toFixed(2),(r.iva_sul_margine||0).toFixed(2),r.fattura_numero||'',r.operatore||'',r.note_vendita||''])})
    const csv=rows.map(r=>r.map(v=>'"'+String(v||'').replace(/"/g,'""')+'"').join(';')).join('\n')
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url
    a.download='storico_dispositivi_'+(tab==='magazzino'?'magazzino':filtroAnno+'_'+String(filtroMese).padStart(2,'0'))+'.csv'
    a.click();URL.revokeObjectURL(url)
  }

  async function elimina(id){
    if(!confirm('Eliminare questo record?'))return
    await fetch(API+'/storico-dispositivi/'+id,{method:'DELETE'})
    showToast?.('Eliminato','ok');carica()
  }

  const inMag=lista.filter(r=>r.stato==='in_magazzino').length
  const totAcq=lista.reduce((s,r)=>s+(r.prezzo_acquisto||0),0)
  const totVend=lista.filter(r=>r.stato==='venduto').reduce((s,r)=>s+(r.prezzo_vendita||0),0)
  const totMarg=lista.filter(r=>r.stato==='venduto').reduce((s,r)=>s+(r.margine_art36||0),0)
  const totIva=lista.filter(r=>r.stato==='venduto').reduce((s,r)=>s+(r.iva_sul_margine||0),0)

  return(<div style={{maxWidth:1000,margin:'0 auto',fontFamily:'Inter,sans-serif'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
      <div>
        <h2 style={{fontSize:20,fontWeight:700,color:'#f1f5f9',margin:0}}>Storico Dispositivi</h2>
        <p style={{color:'#64748b',fontSize:13,margin:'4px 0 0'}}>Acquisto da privati - Vendita con fattura - Art.36 margine reale</p>
      </div>
      <button onClick={()=>{setEditItem(null);setShowAcquisto(true)}} style={btnP}>+ Nuovo acquisto</button>
    </div>

    <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.07)',marginBottom:20}}>
      {[{k:'magazzino',l:'In magazzino'},{k:'storico',l:'Storico completo'},{k:'export',l:'Export fiscale'}].map(({k,l})=>(
        <button key={k} onClick={()=>setTab(k)}
          style={{padding:'9px 18px',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,
            background:tab===k?'rgba(255,255,255,0.07)':'transparent',
            borderBottom:tab===k?'2px solid #3b82f6':'2px solid transparent',
            color:tab===k?'#e2e8f0':'#64748b'}}>{l}</button>
      ))}
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10,marginBottom:18}}>
      {[['In magazzino',inMag,'#fbbf24'],['Tot. acquistato',fmtE(totAcq),'#f87171'],['Tot. venduto',fmtE(totVend),'#34d399'],['Margine totale',fmtE(totMarg),'#60a5fa'],['IVA su margine',fmtE(totIva),'#fbbf24']].map(([n,v,c])=>(
        <div key={n} style={{padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{fontSize:11,color:'#64748b',marginBottom:3}}>{n}</div>
          <div style={{fontFamily:'monospace',fontWeight:700,fontSize:15,color:c}}>{v}</div>
        </div>
      ))}
    </div>

    {(tab==='storico'||tab==='export')&&<div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
      <select value={filtroMese} onChange={e=>setFiltroMese(+e.target.value)} style={{...inp,width:'auto',padding:'7px 10px'}}>{MESI.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select>
      <select value={filtroAnno} onChange={e=>setFiltroAnno(+e.target.value)} style={{...inp,width:'auto',padding:'7px 10px'}}>{[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}</select>
      <select value={filtroStato} onChange={e=>setFiltroStato(e.target.value)} style={{...inp,width:'auto',padding:'7px 10px'}}><option value="">Tutti gli stati</option><option value="in_magazzino">In magazzino</option><option value="venduto">Venduto</option></select>
      <input value={ricerca} onChange={e=>setRicerca(e.target.value)} style={{...inp,width:'auto',padding:'7px 12px',flex:1,minWidth:160}} placeholder="Cerca modello, IMEI, cliente..."/>
      <button onClick={carica} style={{...btnS,padding:'7px 14px',fontSize:13}}>Aggiorna</button>
    </div>}

    {tab==='export'&&<div style={{marginBottom:16,padding:18,borderRadius:12,background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.2)'}}>
      <div style={{fontSize:14,fontWeight:700,color:'#34d399',marginBottom:8}}>Export per studio fiscale</div>
      <div style={{fontSize:13,color:'#94a3b8',marginBottom:14}}>CSV completo: venditore, dispositivo, acquirente, prezzi, margine, IVA, fattura.</div>
      <button onClick={esportaCsv} style={{...btnP,background:'linear-gradient(135deg,#15803d,#16a34a)'}}>Scarica CSV ({lista.length} record)</button>
    </div>}

    {loading?<div style={{textAlign:'center',color:'#475569',padding:60}}>Caricamento...</div>
    :lista.length===0?<div style={{textAlign:'center',color:'#475569',padding:60,fontSize:14}}>
      {tab==='magazzino'?'Nessun dispositivo in magazzino':'Nessun record trovato'}
      <br/><button onClick={()=>{setEditItem(null);setShowAcquisto(true)}} style={{...btnP,marginTop:14,fontSize:13}}>+ Registra primo acquisto</button>
    </div>
    :<div style={{display:'flex',flexDirection:'column',gap:8}}>
      {lista.map(item=>(<div key={item.id} style={{padding:'14px 18px',borderRadius:11,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <div style={{flex:1,minWidth:200}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
            <span style={{fontSize:14,fontWeight:700,color:'#f1f5f9'}}>{item.dispositivo_marca} {item.dispositivo_modello}</span>
            <span style={{padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:700,
              background:item.stato==='venduto'?'rgba(52,211,153,0.15)':'rgba(251,191,36,0.15)',
              color:item.stato==='venduto'?'#34d399':'#fbbf24',
              border:'1px solid '+(item.stato==='venduto'?'rgba(52,211,153,0.3)':'rgba(251,191,36,0.3)')}}>
              {item.stato==='venduto'?'Venduto':'In magazzino'}
            </span>
            {item.dispositivo_condizione&&<span style={{fontSize:10,color:'#64748b',border:'1px solid rgba(255,255,255,0.1)',borderRadius:4,padding:'1px 5px'}}>{item.dispositivo_condizione}</span>}
          </div>
          <div style={{fontSize:12,color:'#64748b',display:'flex',gap:12,flexWrap:'wrap'}}>
            <span>{item.data_acquisto}</span>
            {item.dispositivo_imei&&<span>IMEI: {item.dispositivo_imei}</span>}
            <span>{item.venditore_nome} {item.venditore_cognome}</span>
            {item.stato==='venduto'&&<span>venduto a {item.acquirente_nome||item.acquirente_ragione_sociale} ({item.data_vendita})</span>}
          </div>
        </div>
        <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          <div style={{textAlign:'right'}}><div style={{fontSize:10,color:'#64748b'}}>Acquisto</div><div style={{fontFamily:'monospace',fontWeight:700,color:'#f87171',fontSize:14}}>{fmtE(item.prezzo_acquisto)}</div></div>
          {item.prezzo_vendita>0&&<>
            <div style={{textAlign:'right'}}><div style={{fontSize:10,color:'#64748b'}}>Vendita</div><div style={{fontFamily:'monospace',fontWeight:700,color:'#34d399',fontSize:14}}>{fmtE(item.prezzo_vendita)}</div></div>
            <div style={{textAlign:'right'}}><div style={{fontSize:10,color:'#64748b'}}>IVA marg.</div><div style={{fontFamily:'monospace',fontWeight:700,color:'#fbbf24',fontSize:13}}>{fmtE(item.iva_sul_margine)}</div></div>
          </>}
        </div>
        <div style={{display:'flex',gap:6}}>
          {item.stato==='in_magazzino'&&<button onClick={()=>setVendita(item)} style={{padding:'6px 12px',borderRadius:7,cursor:'pointer',fontSize:12,fontWeight:700,background:'rgba(52,211,153,0.15)',border:'1px solid rgba(52,211,153,0.3)',color:'#34d399'}}>Vendi</button>}
          <button onClick={()=>{setEditItem(item);setShowAcquisto(true)}} style={{padding:'6px 10px',borderRadius:7,cursor:'pointer',background:'rgba(96,165,250,0.15)',border:'1px solid rgba(96,165,250,0.3)',color:'#60a5fa',fontSize:12}}>Modifica</button>
          {item.stato==='venduto'&&<button onClick={()=>ristampaPdf(item)} style={{padding:'6px 10px',borderRadius:7,cursor:'pointer',background:'rgba(251,191,36,0.15)',border:'1px solid rgba(251,191,36,0.3)',color:'#fbbf24',fontSize:12}}>PDF</button>}
          <button onClick={()=>elimina(item.id)} style={{padding:'6px 10px',borderRadius:7,cursor:'pointer',background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.2)',color:'#f87171',fontSize:12}}>Elimina</button>
        </div>
      </div>))}
    </div>}

    {showAcquisto&&<FormAcquisto editItem={editItem} onSalva={()=>{showToast?.(editItem?'Aggiornato':'Acquisto registrato','ok');setShowAcquisto(false);setEditItem(null);carica()}} onAnnulla={()=>{setShowAcquisto(false);setEditItem(null)}}/>}
    {vendita&&<WizardVendita dispositivo={vendita} onSalva={()=>{showToast?.('Vendita registrata','ok');setVendita(null);carica()}} onAnnulla={()=>setVendita(null)}/>}
  </div>)
}
