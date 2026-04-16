// pages/Cassa.jsx v4 — Chiusura Cassa
// Fix: wizard sempre navigabile, riepilogo giorno/mese/anno, storico espandibile,
//      fondo cassa visibile, contante da versare con destinazione, confronto anno prec
import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const IVA = 0.22;
const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const fmt  = n => Number(n||0).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtE = n => '€ ' + fmt(n);
function nv(x){ return parseFloat(x)||0; }
function scorporaIva(lordo){ return lordo / (1+IVA); }
function ivaLordo(lordo){ return lordo - scorporaIva(lordo); }

const TAGLIE_FC = [
  {key:'fc_100',label:'€ 100'},{key:'fc_50',label:'€ 50'},{key:'fc_20',label:'€ 20'},
  {key:'fc_10',label:'€ 10'},{key:'fc_5',label:'€ 5'},{key:'fc_2',label:'€ 2'},
  {key:'fc_1',label:'€ 1'},{key:'fc_050',label:'50ct',val:0.5},{key:'fc_020',label:'20ct',val:0.2},
  {key:'fc_010',label:'10ct',val:0.1},{key:'fc_005',label:'5ct',val:0.05},
  {key:'fc_002',label:'2ct',val:0.02},{key:'fc_001',label:'1ct',val:0.01},
];

const EMPTY = () => ({
  data: new Date().toISOString().slice(0,10),
  chiusura_fiscale:'', fatturato:'', fatturato_art36:'',
  contanti:'', pos:'', satispay:'', assegni:'', bonifico:'', compass:'', stripe:'', enwon_pay:'',
  note_credito:'',
  uscite_contante:'', uscite_bonifico:'', uscite_pos:'',
  destinazione_contante:'banca',
  fondo_cassa:'', operatore:'', note:'',
  ...Object.fromEntries(TAGLIE_FC.map(t=>[t.key,''])),
});

// ── UI atoms ──────────────────────────────────────────────────────────────────
function Campo({label,value,onChange,type='number',disabled,hint,prefix='€'}){
  return (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:11,color:'#64748b',marginBottom:4,textTransform:'uppercase',letterSpacing:.5}}>{label}</div>
      <div style={{display:'flex',alignItems:'center',background:'rgba(255,255,255,0.04)',
        border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,overflow:'hidden'}}>
        {prefix&&<span style={{padding:'8px 10px',color:'#475569',fontSize:13,borderRight:'1px solid rgba(255,255,255,0.06)'}}>{prefix}</span>}
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}
          style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#e2e8f0',
            padding:'8px 12px',fontSize:14,width:'100%'}}/>
      </div>
      {hint&&<div style={{fontSize:11,color:'#475569',marginTop:3}}>{hint}</div>}
    </div>
  );
}

function Riga({label,valore,bold,accent,small}){
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
      padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',
      opacity:small?.5:1}}>
      <span style={{fontSize:small?11:13,color:bold?'#e2e8f0':'#94a3b8',fontWeight:bold?600:400}}>{label}</span>
      <span style={{fontSize:small?11:14,color:accent||'#e2e8f0',fontWeight:bold?700:500,fontFamily:'monospace'}}>{fmtE(valore)}</span>
    </div>
  );
}

function Sezione({title,children,color='#3b82f6'}){
  return (
    <div style={{background:'rgba(255,255,255,0.02)',border:`1px solid ${color}22`,borderRadius:10,padding:16,marginBottom:16}}>
      <div style={{fontSize:11,fontWeight:700,color,textTransform:'uppercase',letterSpacing:1,marginBottom:12}}>{title}</div>
      {children}
    </div>
  );
}

function StepBar({step,total=6,labels}){
  return (
    <div style={{display:'flex',gap:6,marginBottom:20}}>
      {Array.from({length:total},(_,i)=>(
        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
          <div style={{height:4,borderRadius:2,width:'100%',
            background:i<step?'#3b82f6':i===step?'#60a5fa':'rgba(255,255,255,0.1)',
            transition:'background .3s'}}/>
          {labels&&<span style={{fontSize:9,color:i===step?'#93c5fd':'#475569',fontWeight:i===step?700:400,textAlign:'center'}}>
            {labels[i]}
          </span>}
        </div>
      ))}
    </div>
  );
}

function KpiCard({label,value,color='#3b82f6',sub}){
  return (
    <div style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${color}33`,borderRadius:10,padding:14,flex:1,minWidth:0}}>
      <div style={{fontSize:10,color:'#64748b',textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>{label}</div>
      <div style={{fontSize:20,fontWeight:700,color,fontFamily:'monospace'}}>{fmtE(value)}</div>
      {sub&&<div style={{fontSize:11,color:'#475569',marginTop:4}}>{sub}</div>}
    </div>
  );
}

// ── Nav step buttons ──────────────────────────────────────────────────────────
function Nav({step,setStep,total=6,onSave,saving,canSave=true}){
  return (
    <div style={{display:'flex',justifyContent:'space-between',marginTop:20}}>
      {step>0
        ? <button onClick={()=>setStep(s=>s-1)}
            style={{padding:'8px 20px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:8,color:'#94a3b8',cursor:'pointer',fontSize:13}}>← Indietro</button>
        : <div/>}
      {step<total-1
        ? <button onClick={()=>setStep(s=>s+1)}
            style={{padding:'8px 24px',background:'#2563eb',border:'none',borderRadius:8,
              color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600}}>Avanti →</button>
        : <button onClick={onSave} disabled={saving||!canSave}
            style={{padding:'8px 24px',background:saving||!canSave?'#1e3a5f':'#16a34a',border:'none',
              borderRadius:8,color:'#fff',cursor:saving||!canSave?'not-allowed':'pointer',fontSize:13,fontWeight:700}}>
            {saving?'Salvataggio…':'💾 Salva Chiusura'}
          </button>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WIZARD
// ─────────────────────────────────────────────────────────────────────────────
function WizardChiusura({showToast,onComplete}){
  const [step,setStep]=useState(0);
  const [form,setForm]=useState(EMPTY());
  const [saving,setSaving]=useState(false);
  const [esistente,setEsistente]=useState(null);
  const [accantonato,setAccantonato]=useState(0);

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  // Carica accantonato del mese quando cambia data
  useEffect(()=>{
    if(!form.data) return;
    const [y,m]=form.data.split('-');
    fetch(`${API}/cassa/config/${y}/${m}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(d) setAccantonato(d.accantonato||0); })
      .catch(()=>{});
    // Verifica se esiste già una chiusura per questa data
    fetch(`${API}/cassa/${form.data}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>setEsistente(d))
      .catch(()=>setEsistente(null));
  },[form.data]);

  // Calcoli real-time
  const totIncassi = nv(form.contanti)+nv(form.pos)+nv(form.satispay)+nv(form.assegni)
                   + nv(form.bonifico)+nv(form.compass)+nv(form.stripe)+nv(form.enwon_pay)
                   - nv(form.note_credito);
  const totChiusura = nv(form.chiusura_fiscale)+nv(form.fatturato)+nv(form.fatturato_art36);
  const diff = totIncassi - totChiusura;
  const diffOk = Math.abs(diff)<0.01;

  const totUscite = nv(form.uscite_contante)+nv(form.uscite_bonifico)+nv(form.uscite_pos);
  const contanteDaVersare = Math.max(0, nv(form.contanti)-nv(form.uscite_contante)-accantonato);

  const fondoCassa = TAGLIE_FC.reduce((acc,t)=>{
    const val = t.val || parseInt(t.key.replace('fc_',''));
    return acc + nv(form[t.key])*val;
  },0);

  const stepLabels=['Data','Vendite','Incassi','Uscite','Fondo Cassa','Riepilogo'];

  async function salva(){
    setSaving(true);
    try{
      const body={...form, accantonato, fondo_cassa_calcolato: fondoCassa};
      const r=await fetch(`${API}/cassa`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      if(!r.ok) throw new Error(await r.text());
      showToast('Chiusura salvata ✓','success');
      onComplete();
    }catch(e){ showToast('Errore: '+e.message,'error'); }
    finally{ setSaving(false); }
  }

  return (
    <div>
      <StepBar step={step} total={6} labels={stepLabels}/>

      {/* STEP 0 — Data */}
      {step===0&&(
        <Sezione title="📅 Data chiusura" color="#6366f1">
          <Campo label="Data" value={form.data} onChange={v=>set('data',v)} type="date" prefix=""/>
          {accantonato>0&&<div style={{marginTop:8,padding:'8px 12px',background:'rgba(99,102,241,0.1)',
            borderRadius:8,fontSize:12,color:'#818cf8'}}>
            💰 Accantonato del mese: {fmtE(accantonato)}
          </div>}
          {esistente&&<div style={{marginTop:8,padding:'8px 12px',background:'rgba(234,179,8,0.1)',
            borderRadius:8,fontSize:12,color:'#facc15'}}>
            ⚠️ Esiste già una chiusura per questa data — verrà sovrascritta
          </div>}
          <Nav step={step} setStep={setStep} total={6}/>
        </Sezione>
      )}

      {/* STEP 1 — Vendite */}
      {step===1&&(
        <Sezione title="🧾 Vendite del giorno" color="#8b5cf6">
          <Campo label="Chiusura fiscale (scontrini)" value={form.chiusura_fiscale} onChange={v=>set('chiusura_fiscale',v)}/>
          <Campo label="Fatturato (fatture emesse)" value={form.fatturato} onChange={v=>set('fatturato',v)}/>
          <Campo label="Vendite Art. 36 (usato da privati)" value={form.fatturato_art36} onChange={v=>set('fatturato_art36',v)}
            hint="Margine = vendita − costo acquisto privato"/>
          {totChiusura>0&&<div style={{marginTop:8,padding:'8px 12px',background:'rgba(139,92,246,0.1)',
            borderRadius:8,fontSize:13,color:'#a78bfa',fontWeight:600}}>
            Totale dichiarato: {fmtE(totChiusura)}
          </div>}
          <Nav step={step} setStep={setStep} total={6}/>
        </Sezione>
      )}

      {/* STEP 2 — Incassi */}
      {step===2&&(
        <Sezione title="💳 Come è stato incassato?" color="#0ea5e9">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            <Campo label="Contanti" value={form.contanti} onChange={v=>set('contanti',v)}/>
            <Campo label="POS / Carte" value={form.pos} onChange={v=>set('pos',v)}/>
            <Campo label="Satispay" value={form.satispay} onChange={v=>set('satispay',v)}/>
            <Campo label="Assegni" value={form.assegni} onChange={v=>set('assegni',v)}/>
            <Campo label="Bonifico" value={form.bonifico} onChange={v=>set('bonifico',v)}/>
            <Campo label="Compass (agenzia)" value={form.compass} onChange={v=>set('compass',v)}/>
            <Campo label="Stripe (online)" value={form.stripe} onChange={v=>set('stripe',v)}/>
            <Campo label="Enwon Pay" value={form.enwon_pay} onChange={v=>set('enwon_pay',v)}/>
          </div>
          <Campo label="Note credito / Resi (sottratti)" value={form.note_credito} onChange={v=>set('note_credito',v)}/>
          <div style={{padding:'10px 14px',borderRadius:8,marginTop:8,
            background:diffOk?'rgba(22,163,74,0.1)':'rgba(239,68,68,0.1)',
            border:`1px solid ${diffOk?'#16a34a':'#ef4444'}33`}}>
            <div style={{fontSize:12,color:'#94a3b8'}}>Incassato {fmtE(totIncassi)} vs Chiusura {fmtE(totChiusura)}</div>
            <div style={{fontSize:16,fontWeight:700,color:diffOk?'#4ade80':'#f87171',fontFamily:'monospace'}}>
              {diff>=0?'+':''}{fmtE(diff)} {diffOk?'✓':'⚠️'}
            </div>
            {!diffOk&&<div style={{fontSize:11,color:'#f87171',marginTop:4}}>
              Differenza da verificare — puoi procedere comunque
            </div>}
          </div>
          <Nav step={step} setStep={setStep} total={6}/>
        </Sezione>
      )}

      {/* STEP 3 — Uscite */}
      {step===3&&(
        <Sezione title="📤 Uscite del giorno" color="#f59e0b">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0 16px'}}>
            <Campo label="Uscite contante" value={form.uscite_contante} onChange={v=>set('uscite_contante',v)}/>
            <Campo label="Uscite bonifico" value={form.uscite_bonifico} onChange={v=>set('uscite_bonifico',v)}/>
            <Campo label="Uscite POS" value={form.uscite_pos} onChange={v=>set('uscite_pos',v)}/>
          </div>
          {totUscite>0&&<Riga label="Totale uscite" valore={totUscite} bold accent="#f59e0b"/>}

          {/* CONTANTE DA VERSARE — sezione prominente */}
          <div style={{marginTop:20,padding:16,background:'rgba(245,158,11,0.08)',
            border:'2px solid rgba(245,158,11,0.3)',borderRadius:12}}>
            <div style={{fontSize:13,fontWeight:700,color:'#fbbf24',marginBottom:12}}>
              💵 CONTANTE DA VERSARE
            </div>
            <div style={{fontSize:22,fontWeight:800,color:'#f59e0b',fontFamily:'monospace',marginBottom:12}}>
              {fmtE(contanteDaVersare)}
            </div>
            <div style={{fontSize:11,color:'#94a3b8',marginBottom:12}}>
              Contanti ({fmtE(nv(form.contanti))}) − Uscite ({fmtE(nv(form.uscite_contante))}) − Accantonato ({fmtE(accantonato)})
            </div>
            <div style={{fontSize:12,color:'#94a3b8',marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:.5}}>
              Destinazione
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {[['banca','🏦 Banca'],['store','🏪 Altro Store'],['fornitore','🤝 Fornitore'],['privato','👤 Acquisto Privato']].map(([v,l])=>(
                <button key={v} onClick={()=>set('destinazione_contante',v)}
                  style={{padding:'7px 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',
                    background:form.destinazione_contante===v?'#f59e0b':'rgba(255,255,255,0.05)',
                    border:`1px solid ${form.destinazione_contante===v?'#f59e0b':'rgba(255,255,255,0.1)'}`,
                    color:form.destinazione_contante===v?'#000':'#94a3b8'}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <Nav step={step} setStep={setStep} total={6}/>
        </Sezione>
      )}

      {/* STEP 4 — Fondo Cassa */}
      {step===4&&(
        <Sezione title="🪙 Fondo Cassa" color="#10b981">
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:16}}>
            {TAGLIE_FC.map(t=>{
              const val = t.val || parseInt(t.key.replace('fc_',''));
              return (
                <div key={t.key} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:8,padding:'8px 10px'}}>
                  <div style={{fontSize:11,color:'#64748b',marginBottom:4}}>{t.label}</div>
                  <input type="number" value={form[t.key]} min="0"
                    onChange={e=>set(t.key,e.target.value)}
                    style={{width:'100%',background:'transparent',border:'none',outline:'none',
                      color:'#e2e8f0',fontSize:16,fontWeight:700}}/>
                  {nv(form[t.key])>0&&<div style={{fontSize:10,color:'#10b981',marginTop:2}}>
                    = {fmtE(nv(form[t.key])*val)}
                  </div>}
                </div>
              );
            })}
          </div>
          <div style={{padding:'10px 14px',background:'rgba(16,185,129,0.1)',borderRadius:8,marginBottom:16}}>
            <div style={{fontSize:12,color:'#94a3b8'}}>Totale fondo cassa</div>
            <div style={{fontSize:22,fontWeight:700,color:'#10b981',fontFamily:'monospace'}}>{fmtE(fondoCassa)}</div>
          </div>
          {/* Recap contante da versare anche qui */}
          {contanteDaVersare>0&&<div style={{padding:'10px 14px',background:'rgba(245,158,11,0.08)',
            border:'1px solid rgba(245,158,11,0.3)',borderRadius:8,marginBottom:16}}>
            <div style={{fontSize:12,color:'#fbbf24',fontWeight:600}}>
              💵 Contante da versare: {fmtE(contanteDaVersare)} → {
                {banca:'🏦 Banca',store:'🏪 Altro Store',fornitore:'🤝 Fornitore',privato:'👤 Acquisto Privato'}[form.destinazione_contante]
              }
            </div>
          </div>}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Campo label="Operatore" value={form.operatore} onChange={v=>set('operatore',v)} type="text" prefix="👤"/>
            <Campo label="Note" value={form.note} onChange={v=>set('note',v)} type="text" prefix="📝"/>
          </div>
          <Nav step={step} setStep={setStep} total={6}/>
        </Sezione>
      )}

      {/* STEP 5 — Riepilogo finale */}
      {step===5&&(
        <Sezione title="📋 Riepilogo finale" color="#6366f1">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <KpiCard label="Incasso totale" value={totIncassi} color="#3b82f6"/>
            <KpiCard label="Chiusura fiscale" value={nv(form.chiusura_fiscale)} color="#8b5cf6"/>
            <KpiCard label="Fatturato" value={nv(form.fatturato)} color="#0ea5e9"/>
            <KpiCard label="Art. 36" value={nv(form.fatturato_art36)} color="#f59e0b"/>
          </div>
          <Sezione title="IVA scorporata" color="#10b981">
            <Riga label="Fiscale — netto" valore={scorporaIva(nv(form.chiusura_fiscale))} small/>
            <Riga label="Fiscale — IVA 22%" valore={ivaLordo(nv(form.chiusura_fiscale))} small accent="#10b981"/>
            <Riga label="Fatturato — netto" valore={scorporaIva(nv(form.fatturato))} small/>
            <Riga label="Fatturato — IVA 22%" valore={ivaLordo(nv(form.fatturato))} small accent="#10b981"/>
            <Riga label="Art.36 — IVA solo sul margine" valore={ivaLordo(nv(form.fatturato_art36))} small accent="#f59e0b"/>
          </Sezione>
          <Sezione title="Contante" color="#f59e0b">
            <Riga label="Contanti incassati" valore={nv(form.contanti)}/>
            <Riga label="Uscite contante" valore={-nv(form.uscite_contante)}/>
            <Riga label="Accantonato mese" valore={-accantonato}/>
            <Riga label="Da versare" valore={contanteDaVersare} bold accent="#f59e0b"/>
            <div style={{fontSize:12,color:'#94a3b8',marginTop:4}}>
              Destinazione: {{banca:'🏦 Banca',store:'🏪 Altro Store',fornitore:'🤝 Fornitore',privato:'👤 Acquisto Privato'}[form.destinazione_contante]}
            </div>
          </Sezione>
          <Sezione title="Bonifici da incassare (agenzie)" color="#0ea5e9">
            <Riga label="Compass" valore={nv(form.compass)}/>
            <Riga label="Stripe" valore={nv(form.stripe)}/>
            <Riga label="Enwon Pay" valore={nv(form.enwon_pay)}/>
            <Riga label="Totale bonifici agenzie" valore={nv(form.compass)+nv(form.stripe)+nv(form.enwon_pay)} bold accent="#0ea5e9"/>
          </Sezione>
          <Sezione title="Fondo Cassa" color="#10b981">
            <Riga label="Totale fondo contato" valore={fondoCassa} bold accent="#10b981"/>
          </Sezione>
          {!diffOk&&<div style={{padding:'8px 12px',background:'rgba(239,68,68,0.1)',borderRadius:8,marginBottom:12,
            fontSize:12,color:'#f87171'}}>
            ⚠️ Differenza di {fmtE(Math.abs(diff))} tra incassi e chiusura — verrà registrata
          </div>}
          <div style={{fontSize:12,color:'#475569',marginBottom:8}}>
            {form.operatore&&`Operatore: ${form.operatore}`} {form.data}
          </div>
          <Nav step={step} setStep={setStep} total={6} onSave={salva} saving={saving}/>
        </Sezione>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB RIEPILOGO — giorno / mese / anno con confronto anno precedente
// ─────────────────────────────────────────────────────────────────────────────
function TabRiepilogo({showToast}){
  const oggi = new Date();
  const [modo,setModo]=useState('mese'); // 'giorno' | 'mese' | 'anno'
  const [data,setData]=useState(oggi.toISOString().slice(0,10));
  const [mese,setMese]=useState(oggi.getMonth()+1);
  const [anno,setAnno]=useState(oggi.getFullYear());
  const [dati,setDati]=useState(null);
  const [datiPrecAnno,setDatiPrecAnno]=useState(null);
  const [accantonato,setAccantonato]=useState(0);
  const [loading,setLoading]=useState(false);

  const carica = useCallback(async()=>{
    setLoading(true);
    try{
      if(modo==='giorno'){
        const r=await fetch(`${API}/cassa/${data}`);
        setDati(r.ok?await r.json():null);
        // anno prec stesso giorno
        const dataPrev=data.replace(/^(\d{4})/,y=>parseInt(y)-1);
        const r2=await fetch(`${API}/cassa/${dataPrev}`);
        setDatiPrecAnno(r2.ok?await r2.json():null);
      } else if(modo==='mese'){
        const r=await fetch(`${API}/cassa/riepilogo/${anno}/${mese}`);
        const d=r.ok?await r.json():null;
        setDati(d);
        const rc=await fetch(`${API}/cassa/config/${anno}/${mese}`);
        setAccantonato(rc.ok?(await rc.json()).accantonato||0:0);
        // anno prec
        const r2=await fetch(`${API}/cassa/riepilogo/${anno-1}/${mese}`);
        setDatiPrecAnno(r2.ok?await r2.json():null);
      } else {
        const r=await fetch(`${API}/cassa/sommario?anno=${anno}`);
        const rows=r.ok?await r.json():[];
        const tot={incasso:0,fiscale:0,fatturato:0,art36:0,contanteDaVersare:0};
        rows.forEach(row=>{
          tot.incasso+=nv(row.tot_incasso);
          tot.fiscale+=nv(row.tot_fiscale);
          tot.fatturato+=nv(row.tot_fatturato);
          tot.art36+=nv(row.tot_art36);
          tot.contanteDaVersare+=nv(row.contante_da_versare);
        });
        setDati({...tot,mesi:rows.length});
        // anno prec
        const r2=await fetch(`${API}/cassa/sommario?anno=${anno-1}`);
        const rows2=r2.ok?await r2.json():[];
        const tot2={incasso:0,fiscale:0};
        rows2.forEach(row=>{tot2.incasso+=nv(row.tot_incasso);tot2.fiscale+=nv(row.tot_fiscale);});
        setDatiPrecAnno(tot2);
      }
    }finally{setLoading(false);}
  },[modo,data,mese,anno]);

  useEffect(()=>{carica();},[carica]);

  const pct=(curr,prev)=>{
    if(!prev||prev===0) return null;
    const d=((curr-prev)/prev*100);
    return {val:d,pos:d>=0};
  };

  const incassoAttuale = nv(dati?.incasso||dati?.tot_incasso||dati?.chiusura_fiscale);
  const incassoPrev = nv(datiPrecAnno?.incasso||datiPrecAnno?.tot_incasso||datiPrecAnno?.chiusura_fiscale);
  const delta = pct(incassoAttuale,incassoPrev);

  const labelPeriodo = modo==='giorno'?`stesso giorno ${anno-1}`:modo==='mese'?`${MESI[mese-1]} ${anno-1}`:`anno ${anno-1}`;

  return (
    <div>
      {/* Selettore modo */}
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[['giorno','📅 Giorno'],['mese','📆 Mese'],['anno','🗓️ Anno']].map(([k,l])=>(
          <button key={k} onClick={()=>setModo(k)}
            style={{padding:'7px 16px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',
              background:modo===k?'#2563eb':'rgba(255,255,255,0.05)',
              border:`1px solid ${modo===k?'#3b82f6':'rgba(255,255,255,0.1)'}`,
              color:modo===k?'#fff':'#94a3b8'}}>
            {l}
          </button>
        ))}
      </div>

      {/* Filtri data */}
      <div style={{display:'flex',gap:12,marginBottom:20,alignItems:'center',flexWrap:'wrap'}}>
        {modo==='giorno'&&(
          <input type="date" value={data} onChange={e=>setData(e.target.value)}
            style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:8,padding:'7px 12px',color:'#e2e8f0',fontSize:13}}/>
        )}
        {modo!=='giorno'&&(
          <>
            {modo==='mese'&&(
              <select value={mese} onChange={e=>setMese(parseInt(e.target.value))}
                style={{background:'#0f172a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,
                  padding:'7px 12px',color:'#e2e8f0',fontSize:13}}>
                {MESI.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
              </select>
            )}
            <select value={anno} onChange={e=>setAnno(parseInt(e.target.value))}
              style={{background:'#0f172a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,
                padding:'7px 12px',color:'#e2e8f0',fontSize:13}}>
              {[2023,2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </>
        )}
        <button onClick={carica} style={{padding:'7px 14px',background:'rgba(59,130,246,0.15)',
          border:'1px solid rgba(59,130,246,0.3)',borderRadius:8,color:'#60a5fa',cursor:'pointer',fontSize:13}}>
          🔄 Aggiorna
        </button>
      </div>

      {loading&&<div style={{textAlign:'center',color:'#475569',padding:40}}>Caricamento…</div>}

      {!loading&&dati&&(
        <>
          {/* Box motivazionale confronto anno precedente */}
          {incassoPrev>0&&delta!==null&&(
            <div style={{padding:16,borderRadius:12,marginBottom:20,
              background:delta.pos?'rgba(22,163,74,0.08)':'rgba(239,68,68,0.08)',
              border:`1px solid ${delta.pos?'rgba(22,163,74,0.3)':'rgba(239,68,68,0.3)'}`}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{fontSize:32}}>{delta.pos?'🚀':'💪'}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:delta.pos?'#4ade80':'#f87171'}}>
                    {delta.pos
                      ? `+${delta.val.toFixed(1)}% rispetto al ${labelPeriodo}!`
                      : `${delta.val.toFixed(1)}% rispetto al ${labelPeriodo}`}
                  </div>
                  <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>
                    {delta.pos
                      ? `Stai battendo il record! ${labelPeriodo}: ${fmtE(incassoPrev)}`
                      : `Dai, puoi farcela! Obiettivo: ${fmtE(incassoPrev)}, mancano ${fmtE(incassoPrev-incassoAttuale)}`}
                  </div>
                </div>
                <div style={{fontSize:22,fontWeight:800,color:delta.pos?'#4ade80':'#f87171',fontFamily:'monospace'}}>
                  {delta.pos?'+':''}{delta.val.toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* KPI cards */}
          <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:20}}>
            <KpiCard label="Incasso totale" value={nv(dati.incasso||dati.tot_incasso||dati.chiusura_fiscale)} color="#3b82f6"/>
            <KpiCard label="Fiscale (scontrini)" value={nv(dati.fiscale||dati.tot_fiscale||dati.chiusura_fiscale)} color="#8b5cf6"/>
            <KpiCard label="Fatturato" value={nv(dati.fatturato||dati.tot_fatturato)} color="#0ea5e9"/>
            <KpiCard label="Art. 36" value={nv(dati.art36||dati.tot_art36||dati.fatturato_art36)} color="#f59e0b"/>
          </div>

          {/* Riepilogo contabile */}
          {modo!=='anno'&&(
            <Sezione title="Riepilogo contabile IVA" color="#10b981">
              <Riga label="Fiscale lordo" valore={nv(dati.tot_fiscale||dati.chiusura_fiscale)} bold/>
              <Riga label="  → Netto" valore={scorporaIva(nv(dati.tot_fiscale||dati.chiusura_fiscale))} small/>
              <Riga label="  → IVA 22%" valore={ivaLordo(nv(dati.tot_fiscale||dati.chiusura_fiscale))} small accent="#10b981"/>
              <Riga label="Fatturato lordo" valore={nv(dati.tot_fatturato||dati.fatturato)} bold/>
              <Riga label="  → Netto" valore={scorporaIva(nv(dati.tot_fatturato||dati.fatturato))} small/>
              <Riga label="  → IVA 22%" valore={ivaLordo(nv(dati.tot_fatturato||dati.fatturato))} small accent="#10b981"/>
              <Riga label="Art.36 (IVA solo su margine)" valore={ivaLordo(nv(dati.tot_art36||dati.fatturato_art36))} bold accent="#f59e0b"/>
            </Sezione>
          )}

          {/* Contante da versare */}
          {modo==='mese'&&nv(dati.contante_da_versare)>0&&(
            <Sezione title="💵 Contante da versare (mese)" color="#f59e0b">
              <Riga label="Totale da versare" valore={nv(dati.contante_da_versare)} bold accent="#f59e0b"/>
              {accantonato>0&&<Riga label="Accantonato" valore={accantonato}/>}
            </Sezione>
          )}
        </>
      )}

      {!loading&&!dati&&(
        <div style={{textAlign:'center',color:'#475569',padding:60,fontSize:14}}>
          Nessun dato per il periodo selezionato
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB STORICO — anni / mesi espandibili / export CSV
// ─────────────────────────────────────────────────────────────────────────────
function TabStorico(){
  const [anno,setAnno]=useState(new Date().getFullYear());
  const [sommario,setSommario]=useState([]);
  const [aperto,setAperto]=useState(null); // mese aperto
  const [dettaglio,setDettaglio]=useState([]);
  const [loading,setLoading]=useState(false);
  const [loadingDett,setLoadingDett]=useState(false);

  useEffect(()=>{
    setLoading(true);
    fetch(`${API}/cassa/sommario?anno=${anno}`)
      .then(r=>r.ok?r.json():[])
      .then(d=>{setSommario(d);setAperto(null);})
      .finally(()=>setLoading(false));
  },[anno]);

  async function apriMese(m){
    if(aperto===m){setAperto(null);return;}
    setAperto(m);
    setLoadingDett(true);
    try{
      const r=await fetch(`${API}/cassa?anno=${anno}&mese=${m}`);
      setDettaglio(r.ok?await r.json():[]);
    }finally{setLoadingDett(false);}
  }

  function csvAnno(){
    const rows=[['Data','Fiscale','Fatturato','Art36','Incasso','Contanti','Da Versare','Fondo Cassa','Operatore']];
    sommario.forEach(m=>{
      rows.push([`${MESI[m.mese-1]} ${anno}`,
        fmt(m.tot_fiscale),fmt(m.tot_fatturato),fmt(m.tot_art36),
        fmt(m.tot_incasso),fmt(m.tot_contanti),fmt(m.contante_da_versare),'','']);
    });
    scaricaCsv(rows,`chiusura_cassa_${anno}.csv`);
  }

  function csvMese(m,righe){
    const rows=[['Data','Fiscale','Fatturato','Art36','Incasso','Contanti','Da Versare','Fondo Cassa','Operatore']];
    righe.forEach(r=>{
      rows.push([r.data,fmt(r.chiusura_fiscale),fmt(r.fatturato),fmt(r.fatturato_art36),
        fmt(r.tot_incasso||nv(r.chiusura_fiscale)+nv(r.fatturato)+nv(r.fatturato_art36)),
        fmt(r.contanti),fmt(r.contante_da_versare),fmt(r.fondo_cassa_calcolato||r.fondo_cassa),r.operatore||'']);
    });
    scaricaCsv(rows,`chiusura_cassa_${anno}_${String(m).padStart(2,'0')}.csv`);
  }

  function scaricaCsv(rows,filename){
    const csv=rows.map(r=>r.join(';')).join('\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=filename;a.click();
    URL.revokeObjectURL(url);
  }

  const totAnno=sommario.reduce((a,m)=>({
    incasso:a.incasso+nv(m.tot_incasso),
    fiscale:a.fiscale+nv(m.tot_fiscale),
  }),{incasso:0,fiscale:0});

  return (
    <div>
      {/* Selettore anno + export */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <select value={anno} onChange={e=>setAnno(parseInt(e.target.value))}
          style={{background:'#0f172a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,
            padding:'7px 12px',color:'#e2e8f0',fontSize:13}}>
          {[2023,2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={csvAnno}
          style={{padding:'7px 14px',background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.3)',
            borderRadius:8,color:'#34d399',cursor:'pointer',fontSize:13,fontWeight:600}}>
          📥 Export anno {anno}
        </button>
      </div>

      {/* KPI anno */}
      {sommario.length>0&&(
        <div style={{display:'flex',gap:12,marginBottom:20}}>
          <KpiCard label={`Incasso ${anno}`} value={totAnno.incasso} color="#3b82f6" sub={`${sommario.length} mesi registrati`}/>
          <KpiCard label={`Fiscale ${anno}`} value={totAnno.fiscale} color="#8b5cf6"/>
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:10,
            padding:14,flex:1,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center'}}>
            <div style={{fontSize:10,color:'#64748b',textTransform:'uppercase',letterSpacing:.5}}>Mesi registrati</div>
            <div style={{fontSize:36,fontWeight:800,color:'#10b981'}}>{sommario.length}</div>
          </div>
        </div>
      )}

      {loading&&<div style={{textAlign:'center',color:'#475569',padding:40}}>Caricamento…</div>}

      {/* Lista mesi */}
      {!loading&&sommario.map(m=>(
        <div key={m.mese} style={{marginBottom:8}}>
          {/* Header mese — cliccabile */}
          <div onClick={()=>apriMese(m.mese)} style={{
            display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'12px 16px',borderRadius:aperto===m.mese?'10px 10px 0 0':'10px',
            background:aperto===m.mese?'rgba(59,130,246,0.12)':'rgba(255,255,255,0.03)',
            border:`1px solid ${aperto===m.mese?'rgba(59,130,246,0.3)':'rgba(255,255,255,0.07)'}`,
            cursor:'pointer',transition:'all .2s'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:18}}>{aperto===m.mese?'▾':'▸'}</span>
              <span style={{fontSize:14,fontWeight:700,color:'#e2e8f0'}}>{MESI[m.mese-1]} {anno}</span>
            </div>
            <div style={{display:'flex',gap:20,alignItems:'center'}}>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:10,color:'#64748b'}}>Incasso</div>
                <div style={{fontSize:14,fontWeight:700,color:'#60a5fa',fontFamily:'monospace'}}>{fmtE(m.tot_incasso)}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:10,color:'#64748b'}}>Fiscale</div>
                <div style={{fontSize:14,fontWeight:600,color:'#a78bfa',fontFamily:'monospace'}}>{fmtE(m.tot_fiscale)}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:10,color:'#64748b'}}>Art.36</div>
                <div style={{fontSize:14,fontWeight:600,color:'#fbbf24',fontFamily:'monospace'}}>{fmtE(m.tot_art36)}</div>
              </div>
              <button onClick={e=>{e.stopPropagation();apriMese(m.mese);setTimeout(()=>csvMese(m.mese,dettaglio),500);}}
                style={{padding:'5px 10px',background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',
                  borderRadius:6,color:'#34d399',cursor:'pointer',fontSize:11}}>
                📥 CSV
              </button>
            </div>
          </div>

          {/* Dettaglio giornaliero */}
          {aperto===m.mese&&(
            <div style={{border:'1px solid rgba(59,130,246,0.2)',borderTop:'none',
              borderRadius:'0 0 10px 10px',overflow:'hidden'}}>
              {loadingDett?<div style={{padding:20,textAlign:'center',color:'#475569'}}>Caricamento…</div>:(
                <>
                  {/* Header tabella */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
                    padding:'8px 16px',background:'rgba(255,255,255,0.03)',
                    fontSize:10,color:'#475569',textTransform:'uppercase',letterSpacing:.5}}>
                    <span>Data</span><span>Fiscale</span><span>Art.36</span>
                    <span>Incasso</span><span>Contanti</span><span>Da Versare</span>
                    <span>Fondo</span><span>Operatore</span>
                  </div>
                  {dettaglio.length===0&&<div style={{padding:20,textAlign:'center',color:'#475569',fontSize:13}}>
                    Nessuna chiusura in questo mese
                  </div>}
                  {dettaglio.map((r,i)=>{
                    const incassoGiorno = nv(r.chiusura_fiscale)+nv(r.fatturato)+nv(r.fatturato_art36);
                    return (
                      <div key={i} style={{display:'grid',
                        gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
                        padding:'10px 16px',fontSize:12,
                        background:i%2===0?'rgba(255,255,255,0.01)':'transparent',
                        borderTop:'1px solid rgba(255,255,255,0.04)'}}>
                        <span style={{color:'#94a3b8'}}>{r.data?.slice(5)}</span>
                        <span style={{color:'#a78bfa',fontFamily:'monospace'}}>{fmtE(r.chiusura_fiscale)}</span>
                        <span style={{color:'#fbbf24',fontFamily:'monospace'}}>{fmtE(r.fatturato_art36)}</span>
                        <span style={{color:'#60a5fa',fontFamily:'monospace'}}>{fmtE(incassoGiorno)}</span>
                        <span style={{color:'#e2e8f0',fontFamily:'monospace'}}>{fmtE(r.contanti)}</span>
                        <span style={{color:'#f59e0b',fontFamily:'monospace'}}>{fmtE(r.contante_da_versare)}</span>
                        <span style={{color:'#10b981',fontFamily:'monospace'}}>{fmtE(r.fondo_cassa_calcolato||r.fondo_cassa)}</span>
                        <span style={{color:'#64748b'}}>{r.operatore||'—'}</span>
                      </div>
                    );
                  })}
                  {/* Download CSV mese */}
                  <div style={{padding:'8px 16px',borderTop:'1px solid rgba(255,255,255,0.06)',textAlign:'right'}}>
                    <button onClick={()=>csvMese(m.mese,dettaglio)}
                      style={{padding:'6px 14px',background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',
                        borderRadius:6,color:'#34d399',cursor:'pointer',fontSize:12,fontWeight:600}}>
                      📥 Scarica CSV {MESI[m.mese-1]}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {!loading&&sommario.length===0&&(
        <div style={{textAlign:'center',color:'#475569',padding:60,fontSize:14}}>
          Nessuna chiusura registrata per il {anno}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────
export default function Cassa({showToast}){
  const [tab,setTab]=useState('wizard');
  const [toast,setToast]=useState((m,t)=>showToast?.(m,t));

  useEffect(()=>{ setToast(()=>(m,t)=>showToast?.(m,t)); },[showToast]);

  const tabs=[
    {key:'wizard',label:'📋 Inserimento guidato'},
    {key:'riepilogo',label:'📊 Riepilogo contabile'},
    {key:'storico',label:'📁 Storico'},
  ];

  return (
    <div style={{maxWidth:860,margin:'0 auto'}}>
      <h2 style={{fontSize:22,fontWeight:800,color:'#e2e8f0',marginBottom:4}}>💰 Chiusura Cassa</h2>
      <p style={{fontSize:13,color:'#475569',marginBottom:24}}>
        Chiusura giornaliera · Riepilogo IVA · Contante da versare · Bonifici agenzie
      </p>

      {/* Tab bar */}
      <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.07)',marginBottom:24}}>
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{padding:'10px 20px',background:'transparent',border:'none',cursor:'pointer',
              color:tab===t.key?'#60a5fa':'#64748b',
              borderBottom:tab===t.key?'2px solid #3b82f6':'2px solid transparent',
              fontWeight:tab===t.key?600:400,fontSize:13,transition:'all .2s',
              marginBottom:-1}}>
            {t.label}
          </button>
        ))}
      </div>

      {tab==='wizard'&&<WizardChiusura showToast={m=>showToast?.(m,'success')} onComplete={()=>setTab('riepilogo')}/>}
      {tab==='riepilogo'&&<TabRiepilogo showToast={showToast}/>}
      {tab==='storico'&&<TabStorico/>}
    </div>
  );
}
