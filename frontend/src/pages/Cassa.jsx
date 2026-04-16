// pages/Cassa.jsx — Chiusura Cassa v4
import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const IVA = 0.22;
const MESI = ['','Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const fmt = (n) => Number(n||0).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtE = (n) => '€ ' + fmt(n);
const nv = (v) => parseFloat(v)||0;
const scorporaIva = (l) => l/(1+IVA);
const ivaLordo = (l) => l - scorporaIva(l);
const oggi = () => new Date().toISOString().slice(0,10);
const dataIT = (d) => d ? d.split('-').reverse().join('/') : '';

const TAGLIE = [
  {key:'fc_100',label:'€100',val:100},{key:'fc_50',label:'€50',val:50},{key:'fc_20',label:'€20',val:20},
  {key:'fc_10',label:'€10',val:10},{key:'fc_5',label:'€5',val:5},{key:'fc_2',label:'€2',val:2},
  {key:'fc_1',label:'€1',val:1},{key:'fc_050',label:'50ct',val:0.5},{key:'fc_020',label:'20ct',val:0.2},
  {key:'fc_010',label:'10ct',val:0.1},{key:'fc_005',label:'5ct',val:0.05},{key:'fc_002',label:'2ct',val:0.02},{key:'fc_001',label:'1ct',val:0.01},
];

const EMPTY = {
  chiusura_fiscale:'',fatturato:'',fatturato_art36:'',
  contanti:'',pos:'',satispay:'',assegni:'',bonifico:'',compass:'',stripe:'',enwon_pay:'',
  uscita_contante:'',uscita_tipo:'contante',versamento_contante:'',fattura_sifar:'',
  acquisto_privati:'',spostamento_contante:'',destinazione_contante:'banca',
  note_credito:'',fc_100:'',fc_50:'',fc_20:'',fc_10:'',fc_5:'',fc_2:'',fc_1:'',
  fc_050:'',fc_020:'',fc_010:'',fc_005:'',fc_002:'',fc_001:'',
  contante_da_versare:'',note:'',operatore:''
};

function Inp({label,k,form,onChange,hi,type='number',ph='0,00',suf}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4}}>
      {label && <label style={{fontSize:11,color:'#64748b',fontWeight:600,letterSpacing:0.5}}>{label}</label>}
      <div style={{position:'relative'}}>
        <input type={type} min={type==='number'?'0':undefined} step={type==='number'?'0.01':undefined}
          value={form[k]} placeholder={ph} onChange={e=>onChange(k,e.target.value)}
          style={{width:'100%',padding:suf?'8px 28px 8px 10px':'8px 10px',borderRadius:8,
            background:hi?'rgba(99,102,241,0.1)':'rgba(255,255,255,0.05)',
            border:`1px solid ${hi?'rgba(99,102,241,0.35)':'rgba(255,255,255,0.1)'}`,
            color:'#e2e8f0',fontSize:14,outline:'none',boxSizing:'border-box'}} />
        {suf && <span style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',color:'#475569',fontSize:11}}>{suf}</span>}
      </div>
    </div>
  );
}

function Riga({label,valore,color='#e2e8f0',bold,small,indent,hi,neg}) {
  const v = neg ? -Math.abs(valore) : valore;
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
      padding:small?'4px 12px':'8px 12px',background:hi?'rgba(99,102,241,0.06)':'transparent',
      borderRadius:hi?8:0,paddingLeft:indent?28:12}}>
      <span style={{color:small?'#64748b':'#94a3b8',fontSize:small?11:13,fontStyle:indent?'italic':'normal'}}>{label}</span>
      <span style={{color,fontWeight:bold?700:400,fontSize:small?11:14}}>{fmtE(v)}</span>
    </div>
  );
}

function Card({label,valore,color,icon,sub}) {
  return (
    <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'16px 18px',borderTop:`3px solid ${color}`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <div style={{fontSize:11,color:'#64748b',fontWeight:600,letterSpacing:0.5}}>{label}</div>
        {icon&&<span style={{fontSize:16}}>{icon}</span>}
      </div>
      <div style={{fontSize:typeof valore==='number'?22:18,fontWeight:800,color}}>{typeof valore==='number'?fmtE(valore):valore}</div>
      {sub&&<div style={{fontSize:11,color:'#475569',marginTop:4}}>{sub}</div>}
    </div>
  );
}

function Sez({titolo,children,color='#6366f1',open:initOpen=true,collapsible}) {
  const [open,setOpen] = useState(initOpen);
  return (
    <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,marginBottom:14,overflow:'hidden'}}>
      <div onClick={collapsible?()=>setOpen(o=>!o):undefined}
        style={{display:'flex',alignItems:'center',gap:10,padding:'13px 18px',
          borderBottom:open?'1px solid rgba(255,255,255,0.06)':'none',
          cursor:collapsible?'pointer':'default',
          background:`linear-gradient(90deg,${color}14,transparent)`}}>
        <div style={{width:3,height:16,borderRadius:2,background:color}}/>
        <span style={{fontSize:13,fontWeight:700,color:'#e2e8f0',flex:1}}>{titolo}</span>
        {collapsible&&<span style={{color:'#475569',fontSize:11}}>{open?'▾':'▸'}</span>}
      </div>
      {open&&<div style={{padding:'14px 18px'}}>{children}</div>}
    </div>
  );
}

function StepBar({step,labels}) {
  return (
    <div style={{display:'flex',alignItems:'center',marginBottom:28}}>
      {labels.map((l,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',flex:i<labels.length-1?1:'auto'}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
            <div style={{width:30,height:30,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
              background:i<step?'#22c55e':i===step?'#6366f1':'rgba(255,255,255,0.06)',
              border:`2px solid ${i<step?'#22c55e':i===step?'#6366f1':'rgba(255,255,255,0.1)'}`,
              color:i<=step?'#fff':'#475569',fontSize:11,fontWeight:700,flexShrink:0}}>
              {i<step?'✓':i+1}
            </div>
            <span style={{fontSize:9,color:i===step?'#a5b4fc':i<step?'#22c55e':'#475569',fontWeight:i===step?700:400,whiteSpace:'nowrap'}}>{l}</span>
          </div>
          {i<labels.length-1&&<div style={{flex:1,height:2,background:i<step?'#22c55e':'rgba(255,255,255,0.08)',margin:'0 4px',marginBottom:18}}/>}
        </div>
      ))}
    </div>
  );
}

function WizardChiusura({showToast,onComplete}) {
  const [step,setStep] = useState(0);
  const [form,setForm] = useState({...EMPTY});
  const [saving,setSaving] = useState(false);
  const [esistente,setEsistente] = useState(false);
  const [data,setData] = useState(oggi());
  const [cfg,setCfg] = useState(null);
  const onChange = useCallback((k,v)=>setForm(p=>({...p,[k]:v})),[]);

  useEffect(()=>{
    const d=new Date(data); const m=d.getMonth()+1; const a=d.getFullYear();
    fetch(API+'/cassa/'+data).then(r=>r.json()).then(row=>{
      if(row){setEsistente(true);const f={...EMPTY};Object.keys(f).forEach(k=>{f[k]=row[k]!=null?String(row[k]):''});setForm(f);}
      else{setEsistente(false);setForm({...EMPTY});}
    }).catch(()=>{});
    fetch(API+'/cassa/config/'+a+'/'+m).then(r=>r.json()).then(setCfg).catch(()=>{});
  },[data]);

  const chiusuraTot=nv(form.chiusura_fiscale)+nv(form.fatturato)+nv(form.fatturato_art36);
  const totInc=nv(form.contanti)+nv(form.pos)+nv(form.satispay)+nv(form.assegni)+nv(form.bonifico)+nv(form.compass)+nv(form.stripe)+nv(form.enwon_pay);
  const diff=totInc-chiusuraTot;
  const totUsc=nv(form.uscita_contante)+nv(form.versamento_contante)+nv(form.fattura_sifar)+nv(form.acquisto_privati)+nv(form.spostamento_contante);
  const fondo=TAGLIE.reduce((s,t)=>s+(nv(form[t.key])*t.val),0);
  const acc=nv(cfg?.accantonato);
  const daVersare=Math.max(0,nv(form.contanti)-totUsc-acc);

  async function salva(){
    setSaving(true);
    try{
      const p={...form,data};
      Object.keys(EMPTY).forEach(k=>{if(!['uscita_tipo','destinazione_contante','note','operatore'].includes(k)) p[k]=nv(p[k])||0;});
      p.contante_da_versare=nv(form.contante_da_versare)||daVersare;
      const r=await fetch(API+'/cassa',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});
      if(r.ok){showToast('Chiusura salvata!','success');onComplete&&onComplete();}
      else{const e=await r.json();showToast(e.error||'Errore','error');}
    }catch{showToast('Errore di rete','error');}
    setSaving(false);
  }

  const STEPS=['Data','Vendite','Incassi','Uscite','Fondo Cassa','Riepilogo'];
  const goNext=()=>setStep(s=>Math.min(s+1,STEPS.length-1));
  const goBack=()=>setStep(s=>Math.max(s-1,0));

  const Nav=({lbl='Avanti →'})=>(
    <div style={{display:'flex',gap:10,marginTop:22}}>
      {step>0&&<button onClick={goBack} style={{padding:'11px 22px',borderRadius:10,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',cursor:'pointer',fontSize:14}}>← Indietro</button>}
      <button onClick={step<STEPS.length-1?goNext:salva} disabled={saving}
        style={{flex:1,padding:'13px',borderRadius:10,border:'none',
          background:step<STEPS.length-1?'#6366f1':'#22c55e',
          color:'#fff',fontSize:15,fontWeight:700,cursor:saving?'not-allowed':'pointer',
          opacity:saving?0.7:1,boxShadow:'0 4px 16px rgba(99,102,241,0.25)'}}>
        {saving?'⏳ Salvataggio...':(step<STEPS.length-1?lbl:(esistente?'💾 Aggiorna':'💾 Salva chiusura'))}
      </button>
    </div>
  );

  const box=(ch)=>(<div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:26}}>{ch}</div>);
  const hdr=(t,s)=>(<div style={{marginBottom:20}}><div style={{fontSize:17,fontWeight:700,color:'#e2e8f0',marginBottom:4}}>{t}</div>{s&&<div style={{color:'#64748b',fontSize:13}}>{s}</div>}</div>);

  return (
    <div style={{maxWidth:800,margin:'0 auto'}}>
      <StepBar step={step} labels={STEPS}/>

      {step===0&&box(<>
        {hdr('Per quale data stai inserendo la chiusura?','Seleziona la data. Se esiste già una chiusura verrà aggiornata.')}
        <input type="date" value={data} onChange={e=>setData(e.target.value)}
          style={{padding:'12px 16px',borderRadius:10,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.15)',color:'#e2e8f0',fontSize:16,outline:'none',width:'100%',boxSizing:'border-box'}}/>
        {esistente&&<div style={{marginTop:12,padding:'10px 14px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:8,color:'#f59e0b',fontSize:13}}>⚠️ Esiste già una chiusura per questa data — verrà aggiornata.</div>}
        {cfg?<div style={{marginTop:12,padding:'10px 14px',background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.15)',borderRadius:8,fontSize:13,color:'#94a3b8'}}>✓ Accantonato mensile: <strong style={{color:'#22c55e'}}>{fmtE(cfg.accantonato)}</strong></div>
          :<div style={{marginTop:12,padding:'10px 14px',background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.15)',borderRadius:8,fontSize:13,color:'#a5b4fc'}}>ℹ️ Accantonato non configurato — impostalo nel tab Riepilogo.</div>}
        <Nav lbl="Inizia inserimento →"/>
      </>)}

      {step===1&&box(<>
        {hdr("Quant'è stato il fatturato di oggi?","Inserisci i totali dalla chiusura del registratore di cassa.")}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
          <div><Inp label="CHIUSURA FISCALE (scontrini)" k="chiusura_fiscale" form={form} onChange={onChange} hi suf="€"/><div style={{fontSize:11,color:'#475569',marginTop:3}}>Totale scontrini emessi</div></div>
          <div><Inp label="FATTURATO" k="fatturato" form={form} onChange={onChange} suf="€"/><div style={{fontSize:11,color:'#475569',marginTop:3}}>Fatture a clienti</div></div>
          <div><Inp label="FATTURATO ART.36 (usato)" k="fatturato_art36" form={form} onChange={onChange} suf="€"/><div style={{fontSize:11,color:'#475569',marginTop:3}}>Vendita dispositivi usati</div></div>
        </div>
        {nv(form.fatturato_art36)>0&&(
          <div style={{marginTop:14,padding:'14px 16px',background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:10}}>
            <div style={{fontSize:12,color:'#f59e0b',fontWeight:600,marginBottom:10}}>📋 ART.36 — IVA calcolata solo sul margine (vendita − costo acquisto)</div>
            <Inp label="COSTO ACQUISTO DA PRIVATI (dispositivi venduti oggi in art.36)" k="acquisto_privati" form={form} onChange={onChange} suf="€"/>
            <div style={{fontSize:11,color:'#64748b',marginTop:6}}>IVA su: ({fmtE(nv(form.fatturato_art36))} − {fmtE(nv(form.acquisto_privati))}) × 22%</div>
            {nv(form.acquisto_privati)>0&&(
              <div style={{marginTop:8,display:'flex',gap:20,fontSize:12}}>
                <span style={{color:'#94a3b8'}}>Margine: <strong style={{color:'#e2e8f0'}}>{fmtE(Math.max(0,nv(form.fatturato_art36)-nv(form.acquisto_privati)))}</strong></span>
                <span style={{color:'#94a3b8'}}>IVA art.36: <strong style={{color:'#f59e0b'}}>{fmtE(ivaLordo(Math.max(0,nv(form.fatturato_art36)-nv(form.acquisto_privati))))}</strong></span>
              </div>
            )}
          </div>
        )}
        <div style={{marginTop:14,padding:'10px 14px',background:'rgba(99,102,241,0.06)',borderRadius:8,display:'flex',justifyContent:'space-between'}}>
          <span style={{color:'#64748b',fontSize:13}}>Totale chiusura</span>
          <span style={{color:'#a5b4fc',fontWeight:700,fontSize:16}}>{fmtE(chiusuraTot)}</span>
        </div>
        {nv(form.chiusura_fiscale)>0&&(
          <div style={{marginTop:6,display:'flex',gap:14,flexWrap:'wrap'}}>
            <span style={{fontSize:11,color:'#475569'}}>Netto IVA: <strong style={{color:'#e2e8f0'}}>{fmtE(scorporaIva(nv(form.chiusura_fiscale)))}</strong></span>
            <span style={{fontSize:11,color:'#475569'}}>IVA 22%: <strong style={{color:'#6366f1'}}>{fmtE(ivaLordo(nv(form.chiusura_fiscale)))}</strong></span>
          </div>
        )}
        <Nav/>
      </>)}

      {step===2&&box(<>
        {hdr('Come è stato incassato?','Inserisci gli importi per ogni metodo di pagamento.')}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:14}}>
          <Inp label="CONTANTI" k="contanti" form={form} onChange={onChange} hi suf="€"/>
          <Inp label="POS" k="pos" form={form} onChange={onChange} suf="€"/>
          <Inp label="SATISPAY" k="satispay" form={form} onChange={onChange} suf="€"/>
          <Inp label="ASSEGNI" k="assegni" form={form} onChange={onChange} suf="€"/>
          <Inp label="BONIFICO BANCARIO" k="bonifico" form={form} onChange={onChange} suf="€"/>
          <Inp label="COMPASS" k="compass" form={form} onChange={onChange} suf="€"/>
          <Inp label="STRIPE" k="stripe" form={form} onChange={onChange} suf="€"/>
          <Inp label="ENWON PAY" k="enwon_pay" form={form} onChange={onChange} suf="€"/>
        </div>
        <Inp label="NOTE DI CREDITO (storni/rimborsi emessi oggi)" k="note_credito" form={form} onChange={onChange} suf="€"/>
        <div style={{marginTop:14,padding:'12px 16px',borderRadius:10,
          background:Math.abs(diff)<0.01?'rgba(34,197,94,0.07)':'rgba(239,68,68,0.07)',
          border:`1px solid ${Math.abs(diff)<0.01?'rgba(34,197,94,0.2)':'rgba(239,68,68,0.2)'}`,
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{color:'#94a3b8',fontSize:13}}>Incassato {fmtE(totInc)} vs Chiusura {fmtE(chiusuraTot)}</div>
            {Math.abs(diff)>=0.01&&<div style={{fontSize:11,color:'#ef4444',marginTop:2}}>La differenza verrà registrata — verifica i dati prima di salvare</div>}
          </div>
          <span style={{fontWeight:700,color:Math.abs(diff)<0.01?'#22c55e':'#ef4444',fontSize:16,flexShrink:0,marginLeft:12}}>{diff>=0?'+':''}{fmtE(diff)} {Math.abs(diff)<0.01?'✓':'⚠️'}</span>
        </div>
        {(nv(form.compass)+nv(form.stripe)+nv(form.enwon_pay))>0&&(
          <div style={{marginTop:10,padding:'9px 14px',background:'rgba(99,102,241,0.06)',borderRadius:8,fontSize:12,color:'#a5b4fc'}}>
            💳 Bonifici da incassare da agenzie: <strong>{fmtE(nv(form.compass)+nv(form.stripe)+nv(form.enwon_pay))}</strong>
            <span style={{color:'#475569',marginLeft:8}}>Compass {fmtE(nv(form.compass))} · Stripe {fmtE(nv(form.stripe))} · Enwon {fmtE(nv(form.enwon_pay))}</span>
          </div>
        )}
        <Nav/>
      </>)}

      {step===3&&box(<>
        {hdr('Ci sono uscite di contante?','Specifica tipo e destinazione per calcolare correttamente il contante da versare.')}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
          <div><Inp label="VERSAMENTO IN BANCA" k="versamento_contante" form={form} onChange={onChange} suf="€"/><div style={{fontSize:11,color:'#475569',marginTop:3}}>Contante portato in banca</div></div>
          <div><Inp label="FATTURA SIFAR (contante)" k="fattura_sifar" form={form} onChange={onChange} suf="€"/><div style={{fontSize:11,color:'#475569',marginTop:3}}>Pagamento fornitore</div></div>
          <div><Inp label="ACQUISTO DA PRIVATI" k="acquisto_privati" form={form} onChange={onChange} suf="€"/><div style={{fontSize:11,color:'#475569',marginTop:3}}>Già inserito nel passo vendite se art.36</div></div>
          <div><Inp label="SPOSTAMENTO CONTANTE" k="spostamento_contante" form={form} onChange={onChange} suf="€"/><div style={{fontSize:11,color:'#475569',marginTop:3}}>Trasferimento tra sedi</div></div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:6,letterSpacing:0.5}}>USCITA CONTANTE GENERICA</div>
          <div style={{display:'flex',gap:8}}>
            <input type="number" min="0" step="0.01" value={form.uscita_contante} placeholder="0,00" onChange={e=>onChange('uscita_contante',e.target.value)}
              style={{flex:1,padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',fontSize:14,outline:'none'}}/>
            <select value={form.uscita_tipo} onChange={e=>onChange('uscita_tipo',e.target.value)}
              style={{padding:'8px 10px',borderRadius:8,background:'rgba(30,41,59,0.9)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',fontSize:13,outline:'none'}}>
              <option value="contante">In contante</option>
              <option value="bonifico">Bonifico</option>
              <option value="pos">POS</option>
            </select>
          </div>
        </div>
        <div style={{padding:'10px 14px',background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.15)',borderRadius:8,display:'flex',justifyContent:'space-between',marginBottom:12}}>
          <span style={{color:'#94a3b8',fontSize:13}}>Totale uscite</span>
          <span style={{color:'#ef4444',fontWeight:700}}>{fmtE(totUsc)}</span>
        </div>
        <div style={{padding:'14px 16px',background:'rgba(245,158,11,0.08)',border:'2px solid rgba(245,158,11,0.3)',borderRadius:12}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div>
              <div style={{color:'#f59e0b',fontWeight:700,fontSize:14}}>💵 CONTANTE DA VERSARE</div>
              <div style={{fontSize:11,color:'#64748b',marginTop:2}}>Contanti {fmtE(nv(form.contanti))} − Uscite {fmtE(totUsc)} − Accantonato {fmtE(acc)}</div>
            </div>
            <span style={{color:'#f59e0b',fontWeight:800,fontSize:22}}>{fmtE(daVersare)}</span>
          </div>
          <div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:8}}>DESTINAZIONE</div>
          <div style={{display:'flex',gap:8}}>
            {['banca','store','fornitore'].map(d=>(
              <button key={d} onClick={()=>onChange('destinazione_contante',d)}
                style={{flex:1,padding:'8px',borderRadius:8,border:'1px solid',
                  borderColor:form.destinazione_contante===d?'#f59e0b':'rgba(255,255,255,0.1)',
                  background:form.destinazione_contante===d?'rgba(245,158,11,0.15)':'rgba(255,255,255,0.03)',
                  color:form.destinazione_contante===d?'#f59e0b':'#64748b',cursor:'pointer',fontSize:12,fontWeight:600}}>
                {d==='banca'?'🏦 Banca':d==='store'?'🏪 Altro Store':'🤝 Fornitore'}
              </button>
            ))}
          </div>
        </div>
        <Nav/>
      </>)}

      {step===4&&box(<>
        {hdr('Conta il fondo cassa','Inserisci la quantità di ogni taglio rimasto in cassa.')}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
          {TAGLIE.map(t=>(
            <div key={t.key} style={{display:'flex',flexDirection:'column',gap:4}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <label style={{fontSize:12,color:'#94a3b8',fontWeight:600}}>{t.label}</label>
                {nv(form[t.key])>0&&<span style={{fontSize:10,color:'#f59e0b'}}>={fmt(nv(form[t.key])*t.val)}</span>}
              </div>
              <input type="number" min="0" step="1" value={form[t.key]} placeholder="0" onChange={e=>onChange(t.key,e.target.value)}
                style={{padding:'7px 10px',borderRadius:8,
                  background:nv(form[t.key])>0?'rgba(245,158,11,0.08)':'rgba(255,255,255,0.04)',
                  border:`1px solid ${nv(form[t.key])>0?'rgba(245,158,11,0.25)':'rgba(255,255,255,0.08)'}`,
                  color:'#e2e8f0',fontSize:14,outline:'none',width:'100%',boxSizing:'border-box'}}/>
            </div>
          ))}
        </div>
        <div style={{padding:'12px 16px',background:'rgba(245,158,11,0.1)',border:'2px solid rgba(245,158,11,0.25)',borderRadius:12,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <span style={{color:'#94a3b8',fontSize:14,fontWeight:600}}>🪙 TOTALE FONDO CASSA</span>
          <span style={{color:'#f59e0b',fontWeight:800,fontSize:22}}>{fmtE(fondo)}</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div>
            <div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:6}}>CONTANTE DA VERSARE (conferma)</div>
            <input type="number" min="0" step="0.01" value={form.contante_da_versare||''} placeholder={fmt(daVersare)} onChange={e=>onChange('contante_da_versare',e.target.value)}
              style={{width:'100%',padding:'9px 12px',borderRadius:8,background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.2)',color:'#f59e0b',fontSize:14,fontWeight:600,outline:'none',boxSizing:'border-box'}}/>
            <div style={{fontSize:11,color:'#475569',marginTop:3}}>Auto: {fmtE(daVersare)} → destinazione: {form.destinazione_contante}</div>
          </div>
          <div>
            <div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:6}}>OPERATORE</div>
            <input value={form.operatore} onChange={e=>onChange('operatore',e.target.value)} placeholder="Nome operatore"
              style={{width:'100%',padding:'9px 12px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
          </div>
        </div>
        <div style={{marginTop:12}}>
          <div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:6}}>NOTE</div>
          <textarea value={form.note} onChange={e=>onChange('note',e.target.value)} placeholder="Anomalie, acquisti privati, spese..." rows={2}
            style={{width:'100%',padding:'9px 12px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box',fontFamily:'inherit'}}/>
        </div>
        <Nav nextLabel="Vedi riepilogo →"/>
      </>)}

      {step===5&&(
        <div>
          <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:22,marginBottom:14}}>
            <div style={{fontSize:17,fontWeight:700,color:'#e2e8f0',marginBottom:4}}>✅ Riepilogo chiusura {dataIT(data)}</div>
            <div style={{color:'#64748b',fontSize:13,marginBottom:16}}>Verifica prima di salvare. Puoi tornare indietro a correggere.</div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:'#6366f1',fontWeight:700,letterSpacing:1,marginBottom:4,padding:'0 12px'}}>VENDITE</div>
              <Riga label="Chiusura Fiscale (lordo)" valore={nv(form.chiusura_fiscale)} hi/>
              <Riga label="  → Netto IVA" valore={scorporaIva(nv(form.chiusura_fiscale))} small indent/>
              <Riga label="  → IVA 22%" valore={ivaLordo(nv(form.chiusura_fiscale))} small indent color="#6366f1"/>
              {nv(form.fatturato)>0&&<><Riga label="Fatturato" valore={nv(form.fatturato)} hi/><Riga label="  IVA 22%" valore={ivaLordo(nv(form.fatturato))} small indent color="#6366f1"/></>}
              {nv(form.fatturato_art36)>0&&<><Riga label="Art.36" valore={nv(form.fatturato_art36)} hi/><Riga label="  Costo acquisto" valore={nv(form.acquisto_privati)} small indent color="#ef4444"/><Riga label="  IVA sul margine" valore={ivaLordo(Math.max(0,nv(form.fatturato_art36)-nv(form.acquisto_privati)))} small indent color="#f59e0b"/></>}
              <Riga label="TOTALE" valore={chiusuraTot} color="#a5b4fc" bold hi/>
            </div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:'#22c55e',fontWeight:700,letterSpacing:1,marginBottom:4,padding:'0 12px'}}>INCASSI</div>
              {nv(form.contanti)>0&&<Riga label="Contanti" valore={nv(form.contanti)} color="#f59e0b"/>}
              {nv(form.pos)>0&&<Riga label="POS" valore={nv(form.pos)}/>}
              {nv(form.satispay)>0&&<Riga label="Satispay" valore={nv(form.satispay)}/>}
              {nv(form.bonifico)>0&&<Riga label="Bonifico" valore={nv(form.bonifico)}/>}
              {nv(form.compass)>0&&<Riga label="Compass (da incassare)" valore={nv(form.compass)} color="#a5b4fc"/>}
              {nv(form.stripe)>0&&<Riga label="Stripe (da incassare)" valore={nv(form.stripe)} color="#a5b4fc"/>}
              {nv(form.enwon_pay)>0&&<Riga label="Enwon Pay (da incassare)" valore={nv(form.enwon_pay)} color="#a5b4fc"/>}
              {nv(form.note_credito)>0&&<Riga label="Note di credito" valore={nv(form.note_credito)} color="#ef4444" neg/>}
              <Riga label="TOTALE INCASSATO" valore={totInc} color="#22c55e" bold hi/>
              <Riga label={`Differenza ${Math.abs(diff)<0.01?'(✓ ok)':'(⚠️ verifica)'}`} valore={diff} color={Math.abs(diff)<0.01?'#22c55e':'#ef4444'} bold/>
            </div>
            <div>
              <div style={{fontSize:10,color:'#f59e0b',fontWeight:700,letterSpacing:1,marginBottom:4,padding:'0 12px'}}>CONTANTE & USCITE</div>
              {nv(form.versamento_contante)>0&&<Riga label="Versamento banca" valore={nv(form.versamento_contante)}/>}
              {nv(form.fattura_sifar)>0&&<Riga label="Fattura Sifar" valore={nv(form.fattura_sifar)}/>}
              {nv(form.uscita_contante)>0&&<Riga label={`Uscita (${form.uscita_tipo})`} valore={nv(form.uscita_contante)}/>}
              <Riga label="Accantonato mensile" valore={acc} color="#f59e0b"/>
              <Riga label={`CONTANTE DA VERSARE → ${form.destinazione_contante}`} valore={nv(form.contante_da_versare)||daVersare} color="#f59e0b" bold hi/>
              <Riga label="🪙 Fondo cassa" valore={fondo} color="#f59e0b"/>
            </div>
            {form.operatore&&<div style={{marginTop:10,textAlign:'right',fontSize:12,color:'#475569'}}>Operatore: <strong style={{color:'#94a3b8'}}>{form.operatore}</strong></div>}
          </div>
          <Nav/>
        </div>
      )}
    </div>
  );
}

function TabRiepilogo({showToast}) {
  const [periodo,setPeriodo] = useState('mese');
  const [dataG,setDataG] = useState(oggi());
  const [mese,setMese] = useState(new Date().getMonth()+1);
  const [anno,setAnno] = useState(new Date().getFullYear());
  const [dati,setDati] = useState(null);
  const [datiPrec,setDatiPrec] = useState(null);
  const [cfg,setCfg] = useState(null);
  const [loading,setLoading] = useState(false);
  const [editAcc,setEditAcc] = useState(false);
  const [nuovoAcc,setNuovoAcc] = useState('');
  const iS={padding:'8px 12px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',fontSize:14,outline:'none'};

  async function carica(){
    setLoading(true);
    try{
      let url,urlP;
      if(periodo==='giorno'){
        url=API+'/cassa/'+dataG;
        const dp=new Date(dataG); dp.setFullYear(dp.getFullYear()-1);
        urlP=API+'/cassa/'+dp.toISOString().slice(0,10);
      } else if(periodo==='mese'){
        url=API+'/cassa/riepilogo/'+anno+'/'+mese;
        urlP=API+'/cassa/riepilogo/'+(anno-1)+'/'+mese;
      } else {
        url=API+'/cassa/sommario?anno='+anno;
        urlP=API+'/cassa/sommario?anno='+(anno-1);
      }
      const [r,rp,c]=await Promise.all([
        fetch(url).then(r=>r.json()).catch(()=>null),
        fetch(urlP).then(r=>r.json()).catch(()=>null),
        fetch(API+'/cassa/config/'+anno+'/'+mese).then(r=>r.json()).catch(()=>null)
      ]);
      setDati(r); setDatiPrec(rp); setCfg(c); setNuovoAcc(c?.accantonato||0);
    }catch{showToast('Errore caricamento','error');}
    setLoading(false);
  }

  useEffect(()=>{carica();},[periodo,dataG,mese,anno]);

  async function salvaAcc(){
    try{
      await fetch(API+'/cassa/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mese,anno,accantonato:parseFloat(nuovoAcc)||0,agenzie_bonifico:cfg?.agenzie_bonifico||['Compass','Stripe','Enwon Pay']})});
      showToast('Accantonato salvato!','success'); setEditAcc(false); carica();
    }catch{showToast('Errore','error');}
  }

  function getV(d){
    if(!d) return null;
    if(periodo==='giorno'){
      if(!d||typeof d!=='object'||Array.isArray(d)) return null;
      return {incasso:nv(d.contanti)+nv(d.pos)+nv(d.satispay)+nv(d.assegni)+nv(d.bonifico)+nv(d.compass)+nv(d.stripe)+nv(d.enwon_pay),fiscale:nv(d.chiusura_fiscale),fatture:nv(d.fatturato),art36:nv(d.fatturato_art36)};
    } else if(periodo==='mese'){
      return {incasso:nv(d.tot_incasso_lordo),fiscale:nv(d.tot_fiscale_lordo),fatture:nv(d.tot_fatture_lordo),art36:nv(d.tot_art36_lordo)};
    } else {
      if(!Array.isArray(d)) return null;
      return d.reduce((a,m)=>({incasso:a.incasso+(m.tot_incasso||0),fiscale:a.fiscale+(m.tot_fiscale||0),fatture:a.fatture+(m.tot_fatture||0),art36:a.art36+(m.tot_art36||0)}),{incasso:0,fiscale:0,fatture:0,art36:0});
    }
  }

  const v=getV(dati); const vp=getV(datiPrec);
  const delta=v&&vp&&vp.incasso>0?((v.incasso-vp.incasso)/vp.incasso*100):null;
  const dLbl=delta!==null?(delta>=0?`+${delta.toFixed(1)}%`:`${delta.toFixed(1)}%`):null;

  function mot(){
    if(delta===null) return {msg:'Nessun dato per il periodo equivalente dell\u2019anno scorso.',icon:'📭',color:'#64748b'};
    if(delta>=20) return {msg:`Straordinario! +${delta.toFixed(1)}% rispetto all\u2019anno scorso. Continua cos\u00ec! 🚀`,icon:'🚀',color:'#22c55e'};
    if(delta>=5) return {msg:`Ottimo! Sei avanti del ${dLbl} rispetto all\u2019anno scorso 💪`,icon:'💪',color:'#22c55e'};
    if(delta>=-5) return {msg:`In linea con l\u2019anno scorso (${dLbl}). Spingi per superarlo! 🎯`,icon:'🎯',color:'#f59e0b'};
    if(delta>=-20) return {msg:`Sotto dell\u2019anno scorso del ${Math.abs(delta).toFixed(1)}%. Recupera! 💡`,icon:'💡',color:'#f59e0b'};
    return {msg:`Significativamente sotto rispetto all\u2019anno scorso (${dLbl}). Analizza le cause. 📉`,icon:'📉',color:'#ef4444'};
  }

  const m=mot();
  const lbP=periodo==='giorno'?`${dataIT(dataG)}`:periodo==='mese'?`${MESI[mese]} ${anno}`:`Anno ${anno}`;
  const lbPr=periodo==='giorno'?`Stesso giorno ${anno-1}`:periodo==='mese'?`${MESI[mese]} ${anno-1}`:`Anno ${anno-1}`;

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap',alignItems:'flex-end'}}>
        {['giorno','mese','anno'].map(p=>(
          <button key={p} onClick={()=>setPeriodo(p)} style={{padding:'8px 18px',borderRadius:10,border:'1px solid',borderColor:periodo===p?'#6366f1':'rgba(255,255,255,0.1)',background:periodo===p?'rgba(99,102,241,0.15)':'rgba(255,255,255,0.03)',color:periodo===p?'#a5b4fc':'#64748b',cursor:'pointer',fontWeight:600,fontSize:14}}>
            {p==='giorno'?'📅 Giorno':p==='mese'?'📆 Mese':'📊 Anno'}
          </button>
        ))}
        {periodo==='giorno'&&<input type="date" value={dataG} onChange={e=>setDataG(e.target.value)} style={{...iS,fontSize:13}}/>}
        {(periodo==='mese'||periodo==='anno')&&<select value={anno} onChange={e=>setAnno(Number(e.target.value))} style={iS}>{[2024,2025,2026,2027].map(a=><option key={a} value={a}>{a}</option>)}</select>}
        {periodo==='mese'&&<select value={mese} onChange={e=>setMese(Number(e.target.value))} style={iS}>{MESI.slice(1).map((mn,i)=><option key={i+1} value={i+1}>{mn}</option>)}</select>}
        <div style={{marginLeft:'auto',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:12,padding:'8px 14px'}}>
          <div style={{fontSize:10,color:'#f59e0b',fontWeight:700}}>ACCANTONATO MESE</div>
          {editAcc?(
            <div style={{display:'flex',gap:6,marginTop:3}}>
              <input type="number" value={nuovoAcc} onChange={e=>setNuovoAcc(e.target.value)} style={{...iS,width:90,padding:'5px 8px',fontSize:13}}/>
              <button onClick={salvaAcc} style={{padding:'5px 10px',borderRadius:6,background:'#22c55e',border:'none',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600}}>✓</button>
              <button onClick={()=>setEditAcc(false)} style={{padding:'5px 8px',borderRadius:6,background:'rgba(255,255,255,0.06)',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:12}}>✕</button>
            </div>
          ):(
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:2}}>
              <span style={{color:'#e2e8f0',fontWeight:700,fontSize:15}}>{fmtE(cfg?.accantonato||0)}</span>
              <button onClick={()=>setEditAcc(true)} style={{padding:'2px 7px',borderRadius:5,background:'rgba(245,158,11,0.15)',border:'none',color:'#f59e0b',cursor:'pointer',fontSize:10}}>Modifica</button>
            </div>
          )}
        </div>
      </div>

      {loading&&<div style={{textAlign:'center',padding:'40px',color:'#64748b'}}>⏳ Caricamento...</div>}

      {!loading&&v&&<>
        <div style={{background:'rgba(15,23,42,0.85)',border:`1px solid ${m.color}40`,borderRadius:14,padding:'14px 18px',marginBottom:16,display:'flex',alignItems:'center',gap:14}}>
          <span style={{fontSize:26}}>{m.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,color:m.color,fontWeight:700,marginBottom:3}}>{m.msg}</div>
            {vp&&<div style={{fontSize:12,color:'#64748b'}}>{lbPr}: <strong style={{color:'#94a3b8'}}>{fmtE(vp.incasso)}</strong> · {lbP}: <strong style={{color:m.color}}>{fmtE(v.incasso)}</strong></div>}
          </div>
          {delta!==null&&<div style={{textAlign:'center',background:`${m.color}15`,borderRadius:10,padding:'8px 14px',flexShrink:0}}>
            <div style={{fontSize:22,fontWeight:800,color:m.color}}>{dLbl}</div>
            <div style={{fontSize:10,color:'#64748b'}}>vs anno scorso</div>
          </div>}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
          <Card label="INCASSO TOTALE" valore={v.incasso} color="#22c55e" icon="💰" sub={lbP}/>
          <Card label="FISCALE" valore={v.fiscale} color="#6366f1" icon="🧾"/>
          <Card label="FATTURATO" valore={v.fatture} color="#a5b4fc" icon="📄"/>
          <Card label="ART.36" valore={v.art36} color="#f59e0b" icon="🔄"/>
        </div>

        {periodo!=='giorno'&&dati&&!Array.isArray(dati)&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
            <Sez titolo="Vendite & IVA" color="#6366f1">
              <Riga label="Fiscale (lordo)" valore={dati.tot_fiscale_lordo} hi/>
              <Riga label="  Netto IVA" valore={dati.tot_fiscale_netto} small indent/>
              <Riga label="  IVA 22%" valore={dati.tot_fiscale_iva} small indent color="#6366f1"/>
              {dati.tot_fatture_lordo>0&&<><div style={{height:1,background:'rgba(255,255,255,0.05)',margin:'4px 0'}}/><Riga label="Fatturato" valore={dati.tot_fatture_lordo} hi/><Riga label="  IVA 22%" valore={dati.tot_fatture_iva} small indent color="#6366f1"/></>}
              {dati.tot_art36_lordo>0&&<><div style={{height:1,background:'rgba(255,255,255,0.05)',margin:'4px 0'}}/><Riga label="Art.36" valore={dati.tot_art36_lordo} hi/><Riga label="  Costo acquisto" valore={dati.tot_acquisti_privati} small indent color="#ef4444"/><Riga label="  Margine" valore={dati.margine_art36} small indent/><Riga label="  IVA sul margine" valore={dati.tot_art36_iva} small indent color="#f59e0b"/></>}
              <div style={{height:1,background:'rgba(255,255,255,0.08)',margin:'8px 0'}}/>
              <Riga label="INCASSO LORDO" valore={dati.tot_incasso_lordo} color="#a5b4fc" bold hi/>
              <Riga label="NETTO IVA" valore={dati.tot_incasso_netto} color="#e2e8f0" bold/>
              <Riga label="IVA TOTALE" valore={dati.tot_iva_incassata} color="#6366f1" bold/>
            </Sez>
            <div>
              <Sez titolo="Pagamenti" color="#22c55e">
                {dati.tot_contanti>0&&<Riga label="Contanti" valore={dati.tot_contanti} color="#f59e0b"/>}
                {dati.tot_pos>0&&<Riga label="POS" valore={dati.tot_pos}/>}
                {dati.tot_satispay>0&&<Riga label="Satispay" valore={dati.tot_satispay}/>}
                {dati.tot_assegni>0&&<Riga label="Assegni" valore={dati.tot_assegni}/>}
                {dati.tot_bonifico>0&&<Riga label="Bonifico" valore={dati.tot_bonifico}/>}
                <div style={{height:1,background:'rgba(255,255,255,0.06)',margin:'5px 0'}}/>
                {dati.tot_compass>0&&<Riga label="Compass" valore={dati.tot_compass} color="#a5b4fc"/>}
                {dati.tot_stripe>0&&<Riga label="Stripe" valore={dati.tot_stripe} color="#a5b4fc"/>}
                {dati.tot_enwon>0&&<Riga label="Enwon Pay" valore={dati.tot_enwon} color="#a5b4fc"/>}
                {dati.bonifici_agenzie>0&&<><div style={{height:1,background:'rgba(255,255,255,0.06)',margin:'5px 0'}}/><Riga label="BONIFICI DA INCASSARE" valore={dati.bonifici_agenzie} color="#a5b4fc" bold hi/></>}
              </Sez>
              <Sez titolo="Contante" color="#f59e0b">
                <Riga label="Contanti incassati" valore={dati.tot_contanti} color="#f59e0b"/>
                <Riga label="Uscite contante" valore={dati.tot_uscite_contante} color="#ef4444"/>
                <Riga label="Accantonato" valore={dati.accantonato} color="#f59e0b"/>
                <div style={{height:1,background:'rgba(255,255,255,0.08)',margin:'6px 0'}}/>
                <Riga label="CONTANTE DA VERSARE" valore={dati.contante_da_versare} color="#f59e0b" bold hi/>
                {dati.tot_note_credito>0&&<Riga label="Note di credito" valore={dati.tot_note_credito} color="#ef4444" neg/>}
              </Sez>
            </div>
          </div>
        )}

        {periodo==='giorno'&&dati&&typeof dati==='object'&&!Array.isArray(dati)&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <Sez titolo="Vendite" color="#6366f1">
              <Riga label="Chiusura Fiscale" valore={nv(dati.chiusura_fiscale)} hi/>
              <Riga label="  Netto IVA" valore={scorporaIva(nv(dati.chiusura_fiscale))} small indent/>
              <Riga label="  IVA 22%" valore={ivaLordo(nv(dati.chiusura_fiscale))} small indent color="#6366f1"/>
              {nv(dati.fatturato)>0&&<><Riga label="Fatturato" valore={nv(dati.fatturato)} hi/><Riga label="  IVA" valore={ivaLordo(nv(dati.fatturato))} small indent color="#6366f1"/></>}
              {nv(dati.fatturato_art36)>0&&<><Riga label="Art.36" valore={nv(dati.fatturato_art36)} hi/><Riga label="  IVA margine" valore={ivaLordo(Math.max(0,nv(dati.fatturato_art36)-nv(dati.acquisto_privati)))} small indent color="#f59e0b"/></>}
            </Sez>
            <Sez titolo="Incassi & Cassa" color="#22c55e">
              {nv(dati.contanti)>0&&<Riga label="Contanti" valore={nv(dati.contanti)} color="#f59e0b"/>}
              {nv(dati.pos)>0&&<Riga label="POS" valore={nv(dati.pos)}/>}
              {nv(dati.satispay)>0&&<Riga label="Satispay" valore={nv(dati.satispay)}/>}
              {nv(dati.compass)>0&&<Riga label="Compass" valore={nv(dati.compass)} color="#a5b4fc"/>}
              {nv(dati.stripe)>0&&<Riga label="Stripe" valore={nv(dati.stripe)} color="#a5b4fc"/>}
              {nv(dati.enwon_pay)>0&&<Riga label="Enwon Pay" valore={nv(dati.enwon_pay)} color="#a5b4fc"/>}
              <div style={{height:1,background:'rgba(255,255,255,0.08)',margin:'6px 0'}}/>
              <Riga label="Fondo cassa" valore={TAGLIE.reduce((s,t)=>s+(nv(dati[t.key])*t.val),0)} color="#f59e0b"/>
              <Riga label="Contante da versare" valore={nv(dati.contante_da_versare)} color="#f59e0b" bold hi/>
              {dati.destinazione_contante&&<div style={{padding:'4px 12px',fontSize:11,color:'#64748b'}}>Destinazione: {dati.destinazione_contante}</div>}
              {dati.operatore&&<div style={{padding:'4px 12px',fontSize:11,color:'#64748b'}}>Operatore: <strong>{dati.operatore}</strong></div>}
              {dati.note&&<div style={{padding:'4px 12px',fontSize:11,color:'#64748b',fontStyle:'italic'}}>"{dati.note}"</div>}
            </Sez>
          </div>
        )}

        {periodo==='anno'&&Array.isArray(dati)&&(
          <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                {['MESE','GG','FISCALE','FATTURATO','ART.36','INCASSO','CONTANTI','POS','AGENZIE'].map(h=><th key={h} style={{padding:'10px 12px',color:'#64748b',fontSize:10,fontWeight:600,textAlign:h==='MESE'||h==='GG'?'left':'right'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {dati.map(mn=>(
                  <tr key={mn.mese} style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <td style={{padding:'10px 12px',color:'#e2e8f0',fontWeight:600}}>{MESI[mn.mese]}</td>
                    <td style={{padding:'10px 12px',color:'#64748b'}}>{mn.giorni}</td>
                    <td style={{padding:'10px 12px',color:'#a5b4fc',textAlign:'right'}}>{fmtE(mn.tot_fiscale)}</td>
                    <td style={{padding:'10px 12px',color:'#e2e8f0',textAlign:'right'}}>{fmtE(mn.tot_fatture)}</td>
                    <td style={{padding:'10px 12px',color:'#f59e0b',textAlign:'right'}}>{fmtE(mn.tot_art36)}</td>
                    <td style={{padding:'10px 12px',color:'#22c55e',fontWeight:700,textAlign:'right'}}>{fmtE(mn.tot_incasso)}</td>
                    <td style={{padding:'10px 12px',color:'#f59e0b',textAlign:'right'}}>{fmtE(mn.tot_contanti)}</td>
                    <td style={{padding:'10px 12px',color:'#e2e8f0',textAlign:'right'}}>{fmtE(mn.tot_pos)}</td>
                    <td style={{padding:'10px 12px',color:'#a5b4fc',textAlign:'right'}}>{fmtE((mn.tot_compass||0)+(mn.tot_stripe||0)+(mn.tot_enwon||0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>}

      {!loading&&!v&&<div style={{textAlign:'center',padding:'60px',color:'#64748b'}}>Nessun dato per {lbP}.</div>}
    </div>
  );
}

function TabStorico({showToast}) {
  const annoCorr=new Date().getFullYear(); const meseCorr=new Date().getMonth()+1;
  const [anno,setAnno] = useState(annoCorr);
  const [sommario,setSommario] = useState([]);
  const [chiusure,setChiusure] = useState([]);
  const [meseAperto,setMeseAperto] = useState(meseCorr);
  const [loading,setLoading] = useState(false);
  const iS={padding:'8px 12px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',fontSize:14,outline:'none'};
  useEffect(()=>{
    setLoading(true);
    Promise.all([fetch(API+'/cassa/sommario?anno='+anno).then(r=>r.json()).catch(()=>[]),fetch(API+'/cassa?anno='+anno).then(r=>r.json()).catch(()=>[])])
    .then(([s,c])=>{setSommario(Array.isArray(s)?s:[]);setChiusure(Array.isArray(c)?c:[]);setLoading(false);});
  },[anno]);
  function csvDown(righe,nome){
    const bom='\uFEFF';
    const content=bom+righe.map(r=>r.join(';')).join('\n');
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8;'})); a.download=nome; a.click();
    showToast('CSV scaricato!','success');
  }
  function esportaMese(m){
    const chi=chiusure.filter(c=>c.mese===m).sort((a,b)=>a.data.localeCompare(b.data));
    const h=['Data','Fiscale','Art.36','Incasso','Contanti','POS','Compass','Stripe','Enwon','Fondo','Da Versare','Dest.','Operatore'];
    const rows=chi.map(c=>{
      const tI=nv(c.contanti)+nv(c.pos)+nv(c.satispay)+nv(c.assegni)+nv(c.bonifico)+nv(c.compass)+nv(c.stripe)+nv(c.enwon_pay);
      const fC=TAGLIE.reduce((s,t)=>s+(nv(c[t.key])*t.val),0);
      return[dataIT(c.data),fmt(c.chiusura_fiscale),fmt(c.fatturato_art36),fmt(tI),fmt(c.contanti),fmt(c.pos),fmt(c.compass),fmt(c.stripe),fmt(c.enwon_pay),fmt(fC),fmt(c.contante_da_versare),c.destinazione_contante||'',c.operatore||''];
    });
    csvDown([h,...rows],'chiusura_'+MESI[m].toLowerCase()+'_'+anno+'.csv');
  }
  function esportaAnno(){
    const h=['Mese','Giorni','Fiscale','Art.36','Incasso','Contanti','POS','Agenzie'];
    const rows=sommario.map(m=>[MESI[m.mese],m.giorni,fmt(m.tot_fiscale),fmt(m.tot_art36),fmt(m.tot_incasso),fmt(m.tot_contanti),fmt(m.tot_pos),fmt((m.tot_compass||0)+(m.tot_stripe||0)+(m.tot_enwon||0))]);
    csvDown([h,...rows],'chiusura_anno_'+anno+'.csv');
  }
  const tot=sommario.reduce((a,m)=>({inc:a.inc+(m.tot_incasso||0),fisc:a.fisc+(m.tot_fiscale||0)}),{inc:0,fisc:0});
  return (
    <div>
      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:18,flexWrap:'wrap'}}>
        <select value={anno} onChange={e=>setAnno(Number(e.target.value))} style={iS}>{[2024,2025,2026,2027].map(a=><option key={a} value={a}>{a}</option>)}</select>
        <button onClick={esportaAnno} style={{padding:'8px 16px',borderRadius:8,background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.3)',color:'#22c55e',cursor:'pointer',fontSize:13,fontWeight:600,marginLeft:'auto'}}>📥 Export anno {anno}</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:18}}>
        <Card label={'INCASSO '+anno} valore={tot.inc} color='#22c55e' icon='💰'/>
        <Card label={'FISCALE '+anno} valore={tot.fisc} color='#6366f1' icon='🧾'/>
        <Card label='MESI REGISTRATI' valore={String(sommario.length)+' mesi'} color='#a5b4fc' icon='📅'/>
      </div>
      {loading&&<div style={{textAlign:'center',padding:'40px',color:'#64748b'}}>⏳ Caricamento...</div>}
      {!loading&&sommario.map(sm=>(
        <div key={sm.mese} style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,marginBottom:10,overflow:'hidden'}}>
          <div onClick={()=>setMeseAperto(meseAperto===sm.mese?null:sm.mese)} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 18px',cursor:'pointer',background:sm.mese===meseCorr?'rgba(34,197,94,0.04)':'transparent',borderBottom:meseAperto===sm.mese?'1px solid rgba(255,255,255,0.06)':'none'}}>
            <span style={{fontSize:13,fontWeight:700,color:sm.mese===meseCorr?'#22c55e':'#e2e8f0',minWidth:110}}>{meseAperto===sm.mese?'▾':'▸'} {MESI[sm.mese]}</span>
            <span style={{color:'#64748b',fontSize:12,minWidth:30}}>{sm.giorni}gg</span>
            <span style={{color:'#a5b4fc',fontSize:13,minWidth:130}}>Fisc: {fmtE(sm.tot_fiscale)}</span>
            <span style={{color:'#22c55e',fontWeight:700,minWidth:130}}>Inc: {fmtE(sm.tot_incasso)}</span>
            <span style={{color:'#f59e0b',fontSize:12,minWidth:110}}>Cash: {fmtE(sm.tot_contanti)}</span>
            <button onClick={e=>{e.stopPropagation();esportaMese(sm.mese);}} style={{marginLeft:'auto',padding:'4px 12px',borderRadius:6,background:'rgba(255,255,255,0.06)',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:11,fontWeight:600}}>📥 CSV</button>
          </div>
          {meseAperto===sm.mese&&(
            <div style={{padding:'8px 18px 12px'}}>
              <div style={{display:'grid',gridTemplateColumns:'80px 1fr 80px 1fr 90px 80px 90px 70px',gap:4,padding:'5px 10px',fontSize:10,color:'#475569',fontWeight:600,borderBottom:'1px solid rgba(255,255,255,0.04)',marginBottom:4}}>
                <span>DATA</span><span>FISCALE</span><span>ART.36</span><span>INCASSO</span><span>CASH</span><span>FONDO</span><span>VERSARE</span><span>OP.</span>
              </div>
              {chiusure.filter(c=>c.mese===sm.mese).sort((a,b)=>b.data.localeCompare(a.data)).map(c=>{
                const tI=nv(c.contanti)+nv(c.pos)+nv(c.satispay)+nv(c.assegni)+nv(c.bonifico)+nv(c.compass)+nv(c.stripe)+nv(c.enwon_pay);
                const fC=TAGLIE.reduce((s,t)=>s+(nv(c[t.key])*t.val),0);
                return(<div key={c.data} style={{display:'grid',gridTemplateColumns:'80px 1fr 80px 1fr 90px 80px 90px 70px',gap:4,padding:'7px 10px',background:'rgba(255,255,255,0.02)',borderRadius:8,fontSize:12,marginBottom:3,alignItems:'center'}}>
                  <span style={{color:'#64748b',fontWeight:600}}>{dataIT(c.data)}</span>
                  <span style={{color:'#a5b4fc'}}>{fmtE(c.chiusura_fiscale)}</span>
                  <span style={{color:nv(c.fatturato_art36)>0?'#f59e0b':'#334155'}}>{fmtE(c.fatturato_art36)}</span>
                  <span style={{color:'#22c55e',fontWeight:600}}>{fmtE(tI)}</span>
                  <span style={{color:'#f59e0b'}}>{fmtE(c.contanti)}</span>
                  <span style={{color:fC>0?'#f59e0b':'#334155'}}>{fmtE(fC)}</span>
                  <span style={{color:'#f59e0b',fontWeight:600}}>{fmtE(c.contante_da_versare)}</span>
                  <span style={{color:'#475569',fontSize:10}}>{c.operatore||'—'}</span>
                </div>);
              })}
            </div>
          )}
        </div>
      ))}
      {!loading&&sommario.length===0&&<div style={{textAlign:'center',padding:'60px',color:'#64748b'}}>Nessuna chiusura per il {anno}.</div>}
    </div>
  );
}

export default function Cassa({showToast}) {
  const [tab,setTab] = useState('wizard');
  const toast=showToast||((m,t)=>console.log(t,m));
  const TABS=[{key:'wizard',label:'📋 Inserimento guidato'},{key:'riepilogo',label:'📊 Riepilogo'},{key:'storico',label:'📁 Storico'}];
  return (
    <div style={{padding:'24px 28px',maxWidth:1200,margin:'0 auto'}}>
      <div style={{marginBottom:22}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <h2 style={{margin:0,fontSize:22,fontWeight:700,color:'#e2e8f0'}}>💰 Chiusura Cassa</h2>
          <div style={{padding:'3px 10px',borderRadius:20,background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.3)',fontSize:11,fontWeight:700,color:'#a5b4fc'}}>AMMINISTRAZIONE</div>
        </div>
        <p style={{margin:0,color:'#64748b',fontSize:13}}>Inserimento guidato · Riepilogo IVA giorno/mese/anno · Confronto anno precedente · Storico con export</p>
      </div>
      <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        {TABS.map(t=><button key={t.key} onClick={()=>setTab(t.key)} style={{padding:'10px 22px',background:'none',border:'none',cursor:'pointer',color:tab===t.key?'#a5b4fc':'#64748b',borderBottom:tab===t.key?'2px solid #6366f1':'2px solid transparent',fontSize:14,fontWeight:tab===t.key?600:400,marginBottom:-1}}>{t.label}</button>)}
      </div>
      {tab==='wizard'&&<WizardChiusura showToast={toast} onComplete={()=>setTab('storico')}/>}
      {tab==='riepilogo'&&<TabRiepilogo showToast={toast}/>}
      {tab==='storico'&&<TabStorico showToast={toast}/>}
    </div>
  );
}
