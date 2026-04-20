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
  const [usciteVoci,setUsciteVoci]=useState([]); // [{id,metodo,importo,tipo,nota}]
  const [nuovaUscita,setNuovaUscita]=useState({metodo:'contante',importo:'',tipo:'banca',nota:''});
  const [aggiungiUscita,setAggiungiUscita]=useState(false);
  const TIPI_USCITA = [
    {v:'banca', l:'🏦 Versamento Banca'},
    {v:'acquisto_privato', l:'👤 Acquisto da Privato'},
    {v:'fornitore', l:'🤝 Pagamento Fornitore'},
    {v:'store', l:'🏪 Trasferimento Store'},
    {v:'spese', l:'🧾 Spese varie'},
    {v:'altro', l:'📦 Altro'},
  ];

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
  const usciteContanteVoci = usciteVoci.filter(u=>u.metodo==='contante').reduce((s,u)=>s+nv(u.importo),0);
  const usciteBonificoVoci = usciteVoci.filter(u=>u.metodo==='bonifico').reduce((s,u)=>s+nv(u.importo),0);
  const uscitePosvVoci = usciteVoci.filter(u=>u.metodo==='pos').reduce((s,u)=>s+nv(u.importo),0);
  const totUsciteVoci = usciteVoci.reduce((s,u)=>s+nv(u.importo),0);
  const contanteDaVersare = Math.max(0, nv(form.contanti)-usciteContanteVoci-accantonato);

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
          <div style={{marginBottom:4}}>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>DATA</div>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <select value={parseInt(form.data?.split('-')[2]||new Date().getDate())} onChange={e=>{const p=form.data?.split('-')||[new Date().getFullYear()+'',String(new Date().getMonth()+1).padStart(2,'0'),'01']; set('data',p[0]+'-'+p[1]+'-'+String(e.target.value).padStart(2,'0'));}} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:9,padding:'10px 12px',color:'#f1f5f9',fontSize:16,fontFamily:'Inter,sans-serif',cursor:'pointer',flex:1}}>
                {Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d}>{String(d).padStart(2,'0')}</option>)}
              </select>
              <span style={{color:'#475569',fontSize:20}}>/</span>
              <select value={parseInt(form.data?.split('-')[1]||new Date().getMonth()+1)} onChange={e=>{const p=form.data?.split('-')||[new Date().getFullYear()+'','01','01']; set('data',p[0]+'-'+String(e.target.value).padStart(2,'0')+'-'+p[2]);}} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:9,padding:'10px 12px',color:'#f1f5f9',fontSize:16,fontFamily:'Inter,sans-serif',cursor:'pointer',flex:2}}>
                {['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'].map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <span style={{color:'#475569',fontSize:20}}>/</span>
              <select value={parseInt(form.data?.split('-')[0]||new Date().getFullYear())} onChange={e=>{const p=form.data?.split('-')||['2026','01','01']; set('data',e.target.value+'-'+p[1]+'-'+p[2]);}} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:9,padding:'10px 12px',color:'#f1f5f9',fontSize:16,fontFamily:'Inter,sans-serif',cursor:'pointer',flex:1}}>
                {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
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

          {/* Lista voci già inserite */}
          {usciteVoci.length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:.8,marginBottom:8}}>Uscite registrate</div>
              {usciteVoci.map((u,i)=>(
                <div key={u.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                  padding:'10px 14px',marginBottom:6,borderRadius:9,
                  background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.2)'}}>
                  <div>
                    <span style={{fontSize:13,color:'#f1f5f9',fontWeight:600}}>
                      {TIPI_USCITA.find(t=>t.v===u.tipo)?.l||u.tipo}
                    </span>
                    <span style={{fontSize:11,color:'#64748b',marginLeft:8}}>
                      {u.metodo==='contante'?'💵':u.metodo==='bonifico'?'🏦':'💳'} {u.metodo}
                      {u.nota?' · '+u.nota:''}
                    </span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontFamily:'monospace',fontWeight:700,color:'#fbbf24',fontSize:15}}>{fmtE(u.importo)}</span>
                    <button onClick={()=>setUsciteVoci(v=>v.filter((_,j)=>j!==i))}
                      style={{background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.2)',
                        borderRadius:6,color:'#f87171',cursor:'pointer',padding:'3px 8px',fontSize:12}}>✕</button>
                  </div>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',padding:'8px 14px',
                background:'rgba(245,158,11,0.12)',border:'1px solid rgba(245,158,11,0.3)',
                borderRadius:9,marginTop:4}}>
                <span style={{fontSize:13,fontWeight:700,color:'#fbbf24'}}>Totale uscite</span>
                <span style={{fontFamily:'monospace',fontWeight:800,color:'#f59e0b',fontSize:15}}>{fmtE(totUsciteVoci)}</span>
              </div>
            </div>
          )}

          {/* Domanda: nuova uscita? */}
          {!aggiungiUscita?(
            <div style={{padding:20,borderRadius:12,background:'rgba(255,255,255,0.03)',
              border:'1px solid rgba(255,255,255,0.08)',textAlign:'center'}}>
              <div style={{fontSize:15,color:'#e2e8f0',fontWeight:600,marginBottom:16}}>
                {usciteVoci.length===0?"Hai fatto un'uscita di cassa oggi?":"Hai un'altra uscita da registrare?"}
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'center'}}>
                <button onClick={()=>setAggiungiUscita(true)}
                  style={{padding:'10px 28px',borderRadius:9,fontSize:14,fontWeight:700,cursor:'pointer',
                    background:'linear-gradient(135deg,#d97706,#f59e0b)',border:'none',color:'#000'}}>
                  ✅ Sì, aggiungi
                </button>
                <button onClick={()=>setAggiungiUscita(false)}
                  style={{padding:'10px 28px',borderRadius:9,fontSize:14,fontWeight:600,cursor:'pointer',
                    background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.12)',color:'#94a3b8'}}>
                  ❌ No, continua
                </button>
              </div>
            </div>
          ):(
            /* Form nuova uscita */
            <div style={{padding:18,borderRadius:12,background:'rgba(245,158,11,0.06)',
              border:'1px solid rgba(245,158,11,0.25)'}}>
              <div style={{fontSize:13,fontWeight:700,color:'#fbbf24',marginBottom:14}}>
                ➕ Nuova uscita
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div>
                  <div style={{fontSize:11,color:'#64748b',fontWeight:600,textTransform:'uppercase',letterSpacing:.6,marginBottom:6}}>Metodo di pagamento</div>
                  <div style={{display:'flex',gap:6}}>
                    {[['contante','💵 Contante'],['bonifico','🏦 Bonifico'],['pos','💳 POS']].map(([v,l])=>(
                      <button key={v} onClick={()=>setNuovaUscita(u=>({...u,metodo:v}))}
                        style={{flex:1,padding:'8px 4px',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',
                          background:nuovaUscita.metodo===v?'#f59e0b':'rgba(255,255,255,0.05)',
                          border:`1px solid ${nuovaUscita.metodo===v?'#f59e0b':'rgba(255,255,255,0.1)'}`,
                          color:nuovaUscita.metodo===v?'#000':'#94a3b8'}}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,color:'#64748b',fontWeight:600,textTransform:'uppercase',letterSpacing:.6,marginBottom:6}}>Importo *</div>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',fontSize:14}}>€</span>
                    <input type="number" value={nuovaUscita.importo}
                      onChange={e=>setNuovaUscita(u=>({...u,importo:e.target.value}))}
                      style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.15)',
                        borderRadius:8,padding:'9px 12px 9px 28px',color:'#e2e8f0',fontSize:15,
                        fontFamily:'monospace',width:'100%',boxSizing:'border-box'}}
                      placeholder="0,00" step="0.01" min="0" autoFocus/>
                  </div>
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11,color:'#64748b',fontWeight:600,textTransform:'uppercase',letterSpacing:.6,marginBottom:6}}>Per cosa? *</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {TIPI_USCITA.map(({v,l})=>(
                    <button key={v} onClick={()=>setNuovaUscita(u=>({...u,tipo:v}))}
                      style={{padding:'7px 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',
                        background:nuovaUscita.tipo===v?'#f59e0b':'rgba(255,255,255,0.05)',
                        border:`1px solid ${nuovaUscita.tipo===v?'#f59e0b':'rgba(255,255,255,0.1)'}`,
                        color:nuovaUscita.tipo===v?'#000':'#94a3b8'}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,color:'#64748b',fontWeight:600,textTransform:'uppercase',letterSpacing:.6,marginBottom:6}}>Nota (opzionale)</div>
                <input value={nuovaUscita.nota} onChange={e=>setNuovaUscita(u=>({...u,nota:e.target.value}))}
                  style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',
                    borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:13,width:'100%',boxSizing:'border-box'}}
                  placeholder="es. Versamento cassa serale, Acquisto iPhone da Mario Rossi..."/>
              </div>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button onClick={()=>{setAggiungiUscita(false);setNuovaUscita({metodo:'contante',importo:'',tipo:'banca',nota:''});}}
                  style={{padding:'9px 18px',borderRadius:8,fontSize:13,cursor:'pointer',
                    background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8'}}>
                  Annulla
                </button>
                <button onClick={()=>{
                  if(!nuovaUscita.importo||isNaN(+nuovaUscita.importo)||+nuovaUscita.importo<=0) return;
                  const voce = {...nuovaUscita, importo:+nuovaUscita.importo, id:Date.now()};
                  setUsciteVoci(v=>[...v,voce]);
                  // Aggiorna anche i campi form per il salvataggio
                  const nuoveVoci = [...usciteVoci, voce];
                  set('uscite_contante', nuoveVoci.filter(u=>u.metodo==='contante').reduce((s,u)=>s+u.importo,0));
                  set('uscite_bonifico', nuoveVoci.filter(u=>u.metodo==='bonifico').reduce((s,u)=>s+u.importo,0));
                  set('uscite_pos', nuoveVoci.filter(u=>u.metodo==='pos').reduce((s,u)=>s+u.importo,0));
                  setNuovaUscita({metodo:'contante',importo:'',tipo:'banca',nota:''});
                  setAggiungiUscita(false);
                }}
                  style={{padding:'9px 22px',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',
                    background:'linear-gradient(135deg,#d97706,#f59e0b)',border:'none',color:'#000'}}>
                  ✅ Aggiungi uscita
                </button>
              </div>
            </div>
          )}

          {/* Contante da versare — sempre visibile */}
          <div style={{marginTop:20,padding:16,background:'rgba(245,158,11,0.08)',
            border:'2px solid rgba(245,158,11,0.3)',borderRadius:12}}>
            <div style={{fontSize:13,fontWeight:700,color:'#fbbf24',marginBottom:8}}>💵 CONTANTE DA VERSARE</div>
            <div style={{fontSize:26,fontWeight:800,color:'#f59e0b',fontFamily:'monospace',marginBottom:8}}>
              {fmtE(contanteDaVersare)}
            </div>
            <div style={{fontSize:11,color:'#94a3b8'}}>
              Contanti ({fmtE(nv(form.contanti))}) − Uscite contante ({fmtE(usciteContanteVoci)}) − Accantonato ({fmtE(accantonato)})
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
  const oggi=new Date();
  const [sez,setSez]=useState('cassa');
  const [modo,setModo]=useState('mese');
  const [data,setData]=useState(oggi.toISOString().slice(0,10));
  const [mese,setMese]=useState(oggi.getMonth()+1);
  const [anno,setAnno]=useState(oggi.getFullYear());
  const [dati,setDati]=useState(null);
  const [datiPrec,setDatiPrec]=useState(null);
  const [config,setConfig]=useState(null);
  const [accantonato,setAccantonato]=useState(0);
  const [editAcc,setEditAcc]=useState(false);
  const [accInput,setAccInput]=useState('0');
  const [fcTarget,setFcTarget]=useState(150);
  const [editFc,setEditFc]=useState(false);
  const [fcInput,setFcInput]=useState('150');
  const [costoA36,setCostoA36]=useState('');
  const [editCostoA36,setEditCostoA36]=useState(false);
  const [giorni,setGiorni]=useState([]);
  const [loading,setLoading]=useState(false);

  const carica=useCallback(async()=>{
    setLoading(true);
    try{
      if(modo==='giorno'){
        const [r,r2]=await Promise.all([
          fetch(`${API}/cassa/${data}`).then(r=>r.ok?r.json():null),
          fetch(`${API}/cassa/${data.replace(/^(\d{4})/,y=>parseInt(y)-1)}`).then(r=>r.ok?r.json():null),
        ]);
        setDati(r);setDatiPrec(r2);setGiorni(r?[r]:[]);
      } else if(modo==='mese'){
        const [r,rC,r2,rD]=await Promise.all([
          fetch(`${API}/cassa/riepilogo/${anno}/${mese}`).then(r=>r.ok?r.json():null),
          fetch(`${API}/cassa/config/${anno}/${mese}`).then(r=>r.ok?r.json():null),
          fetch(`${API}/cassa/riepilogo/${anno-1}/${mese}`).then(r=>r.ok?r.json():null),
          fetch(`${API}/cassa?anno=${anno}&mese=${mese}`).then(r=>r.ok?r.json():[]),
        ]);
        setDati(r);setDatiPrec(r2);setConfig(rC);
        const acc=rC?.accantonato||0;setAccantonato(acc);setAccInput(String(acc));
        if(rC?.fondo_cassa_target){setFcTarget(rC.fondo_cassa_target);setFcInput(String(rC.fondo_cassa_target));}
        setGiorni(Array.isArray(rD)?rD:[]);
      } else {
        const [r,r2]=await Promise.all([
          fetch(`${API}/cassa/sommario?anno=${anno}`).then(r=>r.ok?r.json():[]),
          fetch(`${API}/cassa/sommario?anno=${anno-1}`).then(r=>r.ok?r.json():[]),
        ]);
        const S=rows=>rows.reduce((a,m)=>({
          tot_fiscale_lordo:(a.tot_fiscale_lordo||0)+nv(m.tot_fiscale),
          tot_fatture_lordo:(a.tot_fatture_lordo||0)+nv(m.tot_fatture||m.tot_fatturato||0),
          tot_art36_lordo:(a.tot_art36_lordo||0)+nv(m.tot_art36),
          tot_incasso_lordo:(a.tot_incasso_lordo||0)+nv(m.tot_incasso),
          tot_contanti:(a.tot_contanti||0)+nv(m.tot_contanti),
          tot_pos:(a.tot_pos||0)+nv(m.tot_pos||0),
          tot_satispay:(a.tot_satispay||0)+nv(m.tot_satispay||0),
          contante_da_versare:(a.contante_da_versare||0)+nv(m.tot_da_versare||m.contante_da_versare||0),
          tot_note_credito:(a.tot_note_credito||0)+nv(m.tot_note_credito||0),
          giorni:(a.giorni||0)+nv(m.giorni),
        }),{});
        setDati(S(Array.isArray(r)?r:[]));setDatiPrec(S(Array.isArray(r2)?r2:[]));setGiorni([]);
      }
    }finally{setLoading(false);}
  },[modo,data,mese,anno]);

  useEffect(()=>{carica();},[carica]);

  const saveAcc=async()=>{const val=parseFloat(accInput)||0;
    await fetch(`${API}/cassa/config`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mese,anno,accantonato:val,fondo_cassa_target:fcTarget,agenzie_bonifico:config?.agenzie_bonifico||[]})});
    setAccantonato(val);setEditAcc(false);showToast&&showToast('Salvato','ok');carica();};
  const saveFc=async()=>{const val=parseFloat(fcInput)||0;
    await fetch(`${API}/cassa/config`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mese,anno,accantonato,fondo_cassa_target:val,agenzie_bonifico:config?.agenzie_bonifico||[]})});
    setFcTarget(val);setEditFc(false);showToast&&showToast('Target salvato','ok');carica();};

  function scaricaCsvUscite(){
    const p=modo==='giorno'?data:modo==='mese'?`${anno}-${String(mese).padStart(2,'0')}`:`${anno}`;
    const rows=[['Data','Operatore','Contante','Bonifico','POS','Totale','Note']];
    giorni.filter(r=>nv(r.uscite_contante||r.uscita_contante||0)+nv(r.uscite_bonifico||0)+nv(r.uscite_pos||0)>0).forEach(r=>{
      const uc=nv(r.uscite_contante||r.uscita_contante||0),ub=nv(r.uscite_bonifico||0),up=nv(r.uscite_pos||0);
      rows.push([r.data,r.operatore||'',uc.toFixed(2),ub.toFixed(2),up.toFixed(2),(uc+ub+up).toFixed(2),r.note||'']);
    });
    rows.push(['TOTALE','',ucont.toFixed(2),ubon.toFixed(2),upos.toFixed(2),utot.toFixed(2),'']);
    const csv=rows.map(r=>r.join(';')).join('\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');
    a.href=url;a.download='uscite_'+p+'.csv';a.click();URL.revokeObjectURL(url);
  }
  function apriPdfUscite(){
    const p=modo==='giorno'?data:modo==='mese'?MESI[mese-1]+' '+anno:'Anno '+anno;
    const righe=giorni.filter(r=>nv(r.uscite_contante||r.uscita_contante||0)+nv(r.uscite_bonifico||0)+nv(r.uscite_pos||0)>0);
    const body=righe.map(r=>{const uc=nv(r.uscite_contante||r.uscita_contante||0),ub=nv(r.uscite_bonifico||0),up=nv(r.uscite_pos||0);
      return '<tr><td>'+r.data+'</td><td>'+(r.operatore||'—')+'</td><td>'+(uc?'€ '+uc.toFixed(2):'—')+'</td><td>'+(ub?'€ '+ub.toFixed(2):'—')+'</td><td>'+(up?'€ '+up.toFixed(2):'—')+'</td><td style="font-weight:bold">€ '+(uc+ub+up).toFixed(2)+'</td><td>'+(r.note||'')+'</td></tr>';
    }).join('');
    const w=window.open('','_blank');
    w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Uscite '+p+'</title><style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:5px 8px}th{background:#f0f0f0}tr:nth-child(even){background:#fafafa}.tot{background:#fff3cd;font-weight:bold}</style></head><body><h2>Uscite di cassa — '+p+'</h2><table><thead><tr><th>Data</th><th>Operatore</th><th>Contante</th><th>Bonifico</th><th>POS</th><th>Totale</th><th>Note</th></tr></thead><tbody>'+body+'<tr class="tot"><td colspan="2">TOTALE</td><td>€ '+ucont.toFixed(2)+'</td><td>€ '+ubon.toFixed(2)+'</td><td>€ '+upos.toFixed(2)+'</td><td>€ '+utot.toFixed(2)+'</td><td></td></tr></tbody></table><br><script>window.print();<\/script></body></html>');
    w.document.close();
  }
  const g=(k,...a)=>nv(dati?.[k]||a.reduce((x,y)=>x||nv(dati?.[y]),0)||0);
  const fisc=g('tot_fiscale_lordo','tot_fiscale','chiusura_fiscale');
  const fatt=g('tot_fatture_lordo','tot_fatturato','fatturato');
  const a36=g('tot_art36_lordo','tot_art36','fatturato_art36');
  const inc=g('tot_incasso_lordo','incasso')||(fisc+fatt);
  const cont=g('tot_contanti','contanti');
  const pos_=g('tot_pos','pos');
  const sat=g('tot_satispay','satispay');
  const ass=g('tot_assegni','assegni');
  const bon=g('tot_bonifico','bonifico');
  const cmp=g('tot_compass','compass');
  const str=g('tot_stripe','stripe');
  const enw=g('tot_enwon','enwon_pay','enwon');
  const nc=g('tot_note_credito','note_credito');
  const dav=g('contante_da_versare','tot_da_versare');
  const iF=ivaLordo(fisc);const iB=ivaLordo(fatt);
  const costoA36Num=parseFloat(costoA36)||g('tot_acquisti_privati','acquisto_privati')||0;
  const margineA36Reale=Math.max(0,a36-costoA36Num);
  const iA=ivaLordo(margineA36Reale);
  const ucont=giorni.reduce((s,r)=>s+nv(r.uscite_contante||r.uscita_contante||0),0);
  const ubon=giorni.reduce((s,r)=>s+nv(r.uscite_bonifico||0),0);
  const upos=giorni.reduce((s,r)=>s+nv(r.uscite_pos||0),0);
  const utot=ucont+ubon+upos;
  const fcMedia=giorni.length?giorni.reduce((s,r)=>s+nv(r.fondo_cassa_calcolato||0),0)/giorni.length:0;
  const gestione=Math.max(0,cont-ucont-accantonato);
  const incP=nv(datiPrec?.tot_incasso_lordo||datiPrec?.incasso||0);
  const delta=incP>0?((inc-incP)/incP*100):null;
  const labP=modo==='giorno'?`stesso giorno ${anno-1}`:modo==='mese'?`${MESI[mese-1]} ${anno-1}`:`anno ${anno-1}`;
  const bx=(br,bg)=>({borderRadius:12,padding:'16px 20px',background:bg||'rgba(255,255,255,0.04)',border:`1px solid ${br||'rgba(255,255,255,0.08)'}`});
  const lbl={fontSize:11,color:'#64748b',textTransform:'uppercase',letterSpacing:.8,fontWeight:600,marginBottom:6,display:'block'};
  const BIG=(c)=>({fontSize:26,fontWeight:800,fontFamily:'monospace',color:c||'#f1f5f9',lineHeight:1.1});
  const MED=(c)=>({fontSize:15,fontWeight:700,fontFamily:'monospace',color:c||'#cbd5e1'});
  const sub={fontSize:11,color:'#94a3b8',marginTop:3};

  return(<div style={{display:'flex',flexDirection:'column',gap:16}}>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
      {[['giorno','📅 Giorno'],['mese','📆 Mese'],['anno','🗓️ Anno']].map(([k,l])=>(
        <button key={k} onClick={()=>setModo(k)} style={{padding:'6px 14px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',
          background:modo===k?'#2563eb':'rgba(255,255,255,0.05)',border:`1px solid ${modo===k?'#3b82f6':'rgba(255,255,255,0.1)'}`,color:modo===k?'#fff':'#94a3b8'}}>{l}</button>
      ))}
      {modo==='giorno'&&<input type="date" value={data} onChange={e=>setData(e.target.value)} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'6px 10px',color:'#e2e8f0',fontSize:13}}/>}
      {modo==='mese'&&<select value={mese} onChange={e=>setMese(parseInt(e.target.value))} style={{background:'#0f172a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'6px 10px',color:'#e2e8f0',fontSize:13}}>{MESI.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select>}
      {modo!=='giorno'&&<select value={anno} onChange={e=>setAnno(parseInt(e.target.value))} style={{background:'#0f172a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'6px 10px',color:'#e2e8f0',fontSize:13}}>{[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}</select>}
      <button onClick={carica} style={{padding:'6px 12px',background:'rgba(59,130,246,0.15)',border:'1px solid rgba(59,130,246,0.3)',borderRadius:8,color:'#60a5fa',cursor:'pointer',fontSize:13}}>🔄</button>
    </div>
    <div style={{display:'flex',gap:0,borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
      {[{k:'cassa',l:'💵 Cassa'},{k:'fondo',l:'🪙 Fondo Cassa'},{k:'uscite',l:'📤 Uscite'},{k:'contabile',l:'🧾 Contabile'}].map(({k,l})=>(
        <button key={k} onClick={()=>setSez(k)} style={{padding:'8px 16px',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,
          background:sez===k?'rgba(255,255,255,0.07)':'transparent',
          borderBottom:sez===k?'2px solid #3b82f6':'2px solid transparent',
          color:sez===k?'#e2e8f0':'#64748b'}}>{l}</button>
      ))}
    </div>
    {loading&&<div style={{textAlign:'center',color:'#475569',padding:40}}>Caricamento…</div>}
    {!loading&&!dati&&<div style={{textAlign:'center',color:'#475569',padding:60}}>Nessun dato</div>}
    {!loading&&dati&&(<>
      {sez==='cassa'&&<div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          <div style={{...bx('rgba(16,185,129,0.35)','rgba(16,185,129,0.06)'),textAlign:'center'}}>
            <span style={lbl}>💶 Contante in gestione</span>
            <div style={BIG('#34d399')}>{fmtE(gestione)}</div>
            <div style={sub}>Incassato − uscite − accantonato</div>
          </div>
          <div style={{...bx('rgba(251,191,36,0.35)','rgba(251,191,36,0.06)'),textAlign:'center'}}>
            <span style={lbl}>💵 Da versare</span>
            <div style={BIG('#fbbf24')}>{fmtE(dav)}</div>
            <div style={sub}>Da portare in banca</div>
          </div>
          <div style={bx('rgba(168,85,247,0.3)','rgba(168,85,247,0.05)')}>
            <span style={lbl}>🏦 Accantonato mese</span>
            {editAcc?(<div style={{display:'flex',gap:6,alignItems:'center',marginTop:4}}>
              <input type="number" value={accInput} onChange={e=>setAccInput(e.target.value)} autoFocus onKeyDown={e=>e.key==='Enter'&&saveAcc()}
                style={{background:'#0f172a',border:'1px solid #7c3aed',borderRadius:7,padding:'5px 8px',color:'#e2e8f0',fontSize:18,width:100,fontFamily:'monospace'}}/>
              <button onClick={saveAcc} style={{padding:'5px 10px',background:'#7c3aed',border:'none',borderRadius:7,color:'#fff',cursor:'pointer'}}>✓</button>
              <button onClick={()=>{setEditAcc(false);setAccInput(String(accantonato));}} style={{padding:'5px 8px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:7,color:'#94a3b8',cursor:'pointer'}}>✕</button>
            </div>):(
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                <span style={BIG('#c084fc')}>{fmtE(accantonato)}</span>
                {modo==='mese'&&<button onClick={()=>setEditAcc(true)} style={{padding:'3px 8px',background:'rgba(168,85,247,0.15)',border:'1px solid rgba(168,85,247,0.3)',borderRadius:6,color:'#c084fc',cursor:'pointer',fontSize:12}}>✏️</button>}
              </div>
            )}
            <div style={sub}>Imposta a inizio mese</div>
          </div>
        </div>
        {incP>0&&delta!==null&&(<div style={{padding:12,borderRadius:10,background:delta>=0?'rgba(22,163,74,0.08)':'rgba(239,68,68,0.08)',border:`1px solid ${delta>=0?'rgba(22,163,74,0.3)':'rgba(239,68,68,0.3)'}`}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:24}}>{delta>=0?'🚀':'💪'}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:delta>=0?'#4ade80':'#f87171'}}>{delta>=0?`+${delta.toFixed(1)}% vs ${labP}!`:`${delta.toFixed(1)}% vs ${labP}`}</div>
              <div style={{fontSize:11,color:'#94a3b8'}}>{delta>=0?`Prec: ${fmtE(incP)}`:`Obiettivo ${fmtE(incP)} — mancano ${fmtE(incP-inc)}`}</div>
            </div>
            <span style={{fontSize:18,fontWeight:800,fontFamily:'monospace',color:delta>=0?'#4ade80':'#f87171'}}>{delta>=0?'+':''}{delta.toFixed(1)}%</span>
          </div>
        </div>)}
        <div style={{...bx('rgba(59,130,246,0.3)'),display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
          <div>
            <span style={lbl}>📊 Totale incasso</span>
            <div style={BIG('#60a5fa')}>{fmtE(inc)}</div>
            {dati?.giorni>0&&<div style={sub}>{dati.giorni} giorni · media {fmtE(inc/(dati.giorni||1))}/g</div>}
          </div>
          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
            {fisc>0&&<div><div style={sub}>Fiscale</div><div style={MED('#818cf8')}>{fmtE(fisc)}</div></div>}
            {fatt>0&&<div><div style={sub}>Fatturato</div><div style={MED('#38bdf8')}>{fmtE(fatt)}</div></div>}
            {a36>0&&<div><div style={sub}>Art.36</div><div style={MED('#fb923c')}>{fmtE(a36)}</div></div>}
            {nc>0&&<div><div style={sub}>Note cred.</div><div style={MED('#f87171')}>-{fmtE(nc)}</div></div>}
          </div>
        </div>
        <div>
          <span style={lbl}>💳 Metodi</span>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:8}}>
            {[['Contanti','#fbbf24',cont],['POS','#34d399',pos_],['Satispay','#f472b6',sat],['Assegni','#a78bfa',ass],
              ['Bonifico','#38bdf8',bon],['Compass','#fb923c',cmp],['Stripe','#818cf8',str],['Enwon','#4ade80',enw],
            ].filter(([,,v])=>v>0).map(([n,c,v])=>(
              <div key={n} style={{padding:'10px 12px',borderRadius:9,background:'rgba(255,255,255,0.04)',border:`1px solid ${c}44`}}>
                <div style={{fontSize:11,color:'#64748b',marginBottom:2}}>{n}</div>
                <div style={MED(c)}>{fmtE(v)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {sez==='fondo'&&<div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{...bx('rgba(251,191,36,0.3)','rgba(251,191,36,0.05)')}}>
          <span style={lbl}>🎯 Target fondo cassa fisso</span>
          <div style={{fontSize:11,color:'#94a3b8',marginBottom:10}}>Il negozio deve avere sempre questo importo come fondo operativo</div>
          {editFc?(<div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{color:'#64748b'}}>€</span>
            <input type="number" value={fcInput} onChange={e=>setFcInput(e.target.value)} autoFocus onKeyDown={e=>e.key==='Enter'&&saveFc()}
              style={{background:'#0f172a',border:'1px solid #f59e0b',borderRadius:8,padding:'8px 12px',color:'#e2e8f0',fontSize:20,width:130,fontFamily:'monospace'}}/>
            <button onClick={saveFc} style={{padding:'8px 14px',background:'#d97706',border:'none',borderRadius:8,color:'#000',cursor:'pointer',fontWeight:700}}>✓ Salva</button>
            <button onClick={()=>{setEditFc(false);setFcInput(String(fcTarget));}} style={{padding:'8px 10px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#94a3b8',cursor:'pointer'}}>✕</button>
          </div>):(
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <span style={BIG('#fbbf24')}>{fmtE(fcTarget)}</span>
              <button onClick={()=>setEditFc(true)} style={{padding:'4px 10px',background:'rgba(251,191,36,0.15)',border:'1px solid rgba(251,191,36,0.3)',borderRadius:6,color:'#fbbf24',cursor:'pointer',fontSize:12}}>✏️ Modifica</button>
            </div>
          )}
        </div>
        {giorni.length>0&&<div>
          <span style={lbl}>📋 Fondo per giorno</span>
          <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>
            {giorni.map(r=>{const fc=nv(r.fondo_cassa_calcolato)||0;const diff=fc-fcTarget;const ok=Math.abs(diff)<5;const ec=diff>5;
              return(<div key={r.data} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderRadius:9,flexWrap:'wrap',gap:8,
                background:ok?'rgba(22,163,74,0.06)':ec?'rgba(59,130,246,0.06)':'rgba(239,68,68,0.06)',
                border:`1px solid ${ok?'rgba(22,163,74,0.2)':ec?'rgba(59,130,246,0.2)':'rgba(239,68,68,0.2)'}`}}>
                <div style={{display:'flex',gap:12,alignItems:'center'}}>
                  <span style={{color:'#94a3b8',fontSize:13,minWidth:90}}>{r.data}</span>
                  {r.operatore&&<span style={{fontSize:11,color:'#64748b'}}>👤 {r.operatore}</span>}
                </div>
                <div style={{display:'flex',gap:14,alignItems:'center'}}>
                  <div style={{textAlign:'right'}}><div style={{fontSize:11,color:'#64748b'}}>Dichiarato</div><div style={{fontFamily:'monospace',fontWeight:700,color:'#f1f5f9',fontSize:15}}>{fmtE(fc)}</div></div>
                  <div style={{textAlign:'right',minWidth:70}}><div style={{fontSize:11,color:'#64748b'}}>vs target</div><div style={{fontFamily:'monospace',fontWeight:700,fontSize:14,color:ok?'#4ade80':ec?'#60a5fa':'#f87171'}}>{diff>=0?'+':''}{fmtE(diff)}</div></div>
                  <span style={{fontSize:16}}>{ok?'✅':ec?'📈':'⚠️'}</span>
                </div>
              </div>);
            })}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10}}>
            {[['Media dichiarata',fmtE(fcMedia),'#94a3b8'],['Target',fmtE(fcTarget),'#fbbf24'],
              ['Giorni ok',giorni.filter(r=>Math.abs(nv(r.fondo_cassa_calcolato)-fcTarget)<5).length+'/'+giorni.length,'#34d399'],
              ['Giorni sotto',giorni.filter(r=>nv(r.fondo_cassa_calcolato)<fcTarget-5).length,'#f87171'],
            ].map(([n,v,c])=>(
              <div key={n} style={{padding:'10px 14px',borderRadius:9,background:'rgba(255,255,255,0.04)',border:`1px solid ${c}33`}}>
                <div style={{fontSize:11,color:'#64748b',marginBottom:3}}>{n}</div>
                <div style={{fontFamily:'monospace',fontWeight:700,fontSize:15,color:c}}>{v}</div>
              </div>
            ))}
          </div>
        </div>}
        {modo==='anno'&&<div style={{color:'#475569',fontSize:13,textAlign:'center',padding:30}}>Seleziona Mese per il dettaglio</div>}
      </div>}

      {sez==='uscite'&&<div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button onClick={scaricaCsvUscite} style={{padding:'7px 16px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.3)',color:'#34d399'}}>📥 Esporta CSV</button>
          <button onClick={apriPdfUscite} style={{padding:'7px 16px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',background:'rgba(59,130,246,0.15)',border:'1px solid rgba(59,130,246,0.3)',color:'#60a5fa'}}>📄 Esporta PDF</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10}}>
          {[['Uscite contante','#f87171',ucont],['Uscite bonifico','#38bdf8',ubon],['Uscite POS','#a78bfa',upos],['TOTALE USCITE','#fbbf24',utot]].map(([n,c,v])=>(
            <div key={n} style={{padding:'12px 16px',borderRadius:10,background:'rgba(255,255,255,0.04)',border:`1px solid ${c}33`}}>
              <div style={{fontSize:11,color:'#64748b',marginBottom:4}}>{n}</div>
              <div style={{fontFamily:'monospace',fontWeight:700,fontSize:n==='TOTALE USCITE'?20:15,color:c}}>{fmtE(v)}</div>
            </div>
          ))}
        </div>
        {giorni.length>0&&<div>
          <span style={lbl}>📋 Uscite per giorno — operatore in evidenza</span>
          {giorni.filter(r=>nv(r.uscite_contante||r.uscita_contante||0)+nv(r.uscite_bonifico||0)+nv(r.uscite_pos||0)>0).length===0
            ?<div style={{color:'#475569',textAlign:'center',padding:30,fontSize:13}}>Nessuna uscita dichiarata</div>
            :giorni.filter(r=>nv(r.uscite_contante||r.uscita_contante||0)+nv(r.uscite_bonifico||0)+nv(r.uscite_pos||0)>0).map(r=>{
              const uc=nv(r.uscite_contante||r.uscita_contante||0),ub=nv(r.uscite_bonifico||0),up=nv(r.uscite_pos||0);
              return(<div key={r.data} style={{padding:'12px 16px',borderRadius:10,marginBottom:6,background:'rgba(248,113,113,0.05)',border:'1px solid rgba(248,113,113,0.15)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,flexWrap:'wrap',gap:6}}>
                  <div style={{display:'flex',gap:10,alignItems:'center'}}>
                    <span style={{color:'#94a3b8',fontSize:13,fontWeight:600}}>{r.data}</span>
                    {r.operatore&&<span style={{background:'rgba(96,165,250,0.15)',border:'1px solid rgba(96,165,250,0.3)',borderRadius:6,padding:'2px 8px',fontSize:11,color:'#60a5fa',fontWeight:600}}>👤 {r.operatore}</span>}
                  </div>
                  <span style={{fontFamily:'monospace',fontWeight:800,color:'#f87171',fontSize:16}}>{fmtE(uc+ub+up)}</span>
                </div>
                <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                  {uc>0&&<span style={{fontSize:12,color:'#94a3b8'}}>💵 Contante: <b style={{color:'#fbbf24'}}>{fmtE(uc)}</b></span>}
                  {ub>0&&<span style={{fontSize:12,color:'#94a3b8'}}>🏦 Bonifico: <b style={{color:'#38bdf8'}}>{fmtE(ub)}</b></span>}
                  {up>0&&<span style={{fontSize:12,color:'#94a3b8'}}>💳 POS: <b style={{color:'#a78bfa'}}>{fmtE(up)}</b></span>}
                  {r.note&&<span style={{fontSize:12,color:'#64748b'}}>📝 {r.note}</span>}
                </div>
              </div>);
            })
          }
        </div>}
        {modo==='anno'&&<div style={{color:'#475569',fontSize:13,textAlign:'center',padding:30}}>Seleziona Mese per il dettaglio con operatore</div>}
      </div>}

      {sez==='contabile'&&<div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={bx('rgba(16,185,129,0.25)')}>
          <span style={{...lbl,color:'#34d399'}}>🧾 IVA scorporata (22%) — calcolo netto reale</span>
          <div style={{background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.25)',borderRadius:10,padding:'12px 16px',marginBottom:12}}>
            <div style={{fontSize:11,color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:.7,marginBottom:6}}>📦 Costo acquisto dispositivi Art.36 del periodo</div>
            <div style={{fontSize:12,color:'#64748b',marginBottom:10}}>Inserisci il totale pagato ai privati per i dispositivi venduti — serve per calcolare margine reale e IVA esatta</div>
            {editCostoA36?(
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <span style={{color:'#64748b',fontSize:14}}>€</span>
                <input type="number" value={costoA36} onChange={e=>setCostoA36(e.target.value)} autoFocus
                  onKeyDown={e=>e.key==='Enter'&&setEditCostoA36(false)}
                  style={{background:'#0f172a',border:'1px solid #f59e0b',borderRadius:8,padding:'8px 12px',color:'#e2e8f0',fontSize:18,width:150,fontFamily:'monospace'}}
                  placeholder="0.00" step="0.01" min="0"/>
                <button onClick={()=>setEditCostoA36(false)} style={{padding:'8px 14px',background:'#d97706',border:'none',borderRadius:8,color:'#000',cursor:'pointer',fontWeight:700}}>✓ Ok</button>
              </div>
            ):(
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontFamily:'monospace',fontWeight:700,fontSize:20,color:costoA36Num>0?'#f87171':'#475569'}}>{costoA36Num>0?fmtE(costoA36Num):'Non inserito'}</span>
                <button onClick={()=>setEditCostoA36(true)} style={{padding:'4px 10px',background:'rgba(251,191,36,0.15)',border:'1px solid rgba(251,191,36,0.3)',borderRadius:6,color:'#fbbf24',cursor:'pointer',fontSize:12}}>✏️ Inserisci costo</button>
              </div>
            )}
            {costoA36Num>0&&<div style={{marginTop:10,display:'flex',gap:16,flexWrap:'wrap',fontSize:12,color:'#94a3b8'}}>
              <span>Venduto: <b style={{color:'#fb923c'}}>{fmtE(a36)}</b></span>
              <span>Costo: <b style={{color:'#f87171'}}>-{fmtE(costoA36Num)}</b></span>
              <span>Margine reale: <b style={{color:'#34d399'}}>{fmtE(margineA36Reale)}</b></span>
            </div>}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12}}>
            {[['Fiscale lordo',fisc,'#94a3b8'],['Fiscale netto',scorporaIva(fisc),'#64748b'],['IVA fiscale',iF,'#34d399'],
              ['Fatturato lordo',fatt,'#94a3b8'],['Fatturato netto',scorporaIva(fatt),'#64748b'],['IVA fatture',iB,'#34d399'],
              ['Art.36 lordo',a36,'#fb923c'],['Costo acquisto',costoA36Num,'#f87171'],
              ['Margine reale',margineA36Reale,'#fb923c'],['IVA su margine',iA,'#fbbf24'],['TOTALE IVA',iF+iB+iA,'#10b981'],
            ].map(([n,v,c])=>(
              <div key={n} style={{padding:'10px 12px',borderRadius:9,background:n==='TOTALE IVA'?'rgba(16,185,129,0.1)':'rgba(255,255,255,0.04)',border:`1px solid ${c}33`}}>
                <div style={{fontSize:11,color:'#64748b',marginBottom:3}}>{n}</div>
                <div style={{fontFamily:'monospace',fontWeight:700,fontSize:n==='TOTALE IVA'?20:14,color:c}}>{fmtE(v)}</div>
              </div>
            ))}
          </div>
          {!costoA36Num&&a36>0&&<div style={{marginTop:10,padding:'8px 12px',borderRadius:8,background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.2)',fontSize:12,color:'#fbbf24'}}>
            ⚠️ Inserisci il costo di acquisto per calcolare IVA reale sul margine Art.36
          </div>}
        </div>
        <div style={bx('rgba(255,255,255,0.08)')}>
          <span style={lbl}>📊 Riepilogo cassa completo</span>
          {[['Incasso totale',inc,'#60a5fa',true],['  Contanti',cont,'#fbbf24',false],['  POS',pos_,'#34d399',false],
            ['  Satispay',sat,'#f472b6',false],['  Bonifico+agenzie',bon+cmp+str+enw,'#38bdf8',false],
            ['  Note credito',-nc,'#f87171',false],[null,null,null,false],
            ['Totale uscite',-utot,'#f87171',true],['  Contante',-ucont,'#f87171',false],
            ['  Bonifico',-ubon,'#f87171',false],['  POS',-upos,'#f87171',false],
            ['Accantonato',-accantonato,'#c084fc',false],[null,null,null,false],
            ['Contante in gestione',gestione,'#34d399',true],['Da versare',dav,'#fbbf24',true],
          ].map(([n,v,c,bold],i)=>(
            n===null?<div key={i} style={{borderTop:'1px solid rgba(255,255,255,0.06)',margin:'4px 0'}}/>:(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',borderRadius:6,background:bold?'rgba(255,255,255,0.04)':'transparent'}}>
                <span style={{fontSize:13,color:bold?'#e2e8f0':'#94a3b8',fontWeight:bold?700:400}}>{n}</span>
                <span style={{fontFamily:'monospace',fontWeight:bold?700:500,fontSize:bold?15:13,color:c||'#94a3b8'}}>{v<0?'-':''}{fmtE(Math.abs(v))}</span>
              </div>
            )
          ))}
        </div>
        {giorni.length>0&&[...new Set(giorni.map(r=>r.operatore).filter(Boolean))].length>0&&(
          <div style={bx('rgba(255,255,255,0.07)')}>
            <span style={lbl}>👤 Operatori del periodo</span>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:4}}>
              {[...new Set(giorni.map(r=>r.operatore).filter(Boolean))].map(op=>{
                const gg=giorni.filter(r=>r.operatore===op).length;
                const ii=giorni.filter(r=>r.operatore===op).reduce((s,r)=>s+nv(r.chiusura_fiscale)+nv(r.fatturato)+nv(r.fatturato_art36),0);
                return(<div key={op} style={{padding:'10px 16px',borderRadius:10,background:'rgba(96,165,250,0.08)',border:'1px solid rgba(96,165,250,0.2)'}}>
                  <div style={{fontWeight:700,color:'#60a5fa',fontSize:14}}>👤 {op}</div>
                  <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{gg} giorni · {fmtE(ii)}</div>
                </div>);
              })}
            </div>
          </div>
        )}
      </div>}
    </>)}
  </div>);
}
function TabStorico(){
  const [anno,setAnno]=useState(new Date().getFullYear());
  const [sommario,setSommario]=useState([]);
  const [aperto,setAperto]=useState(null);
  const [dettaglio,setDettaglio]=useState([]);
  const [loading,setLoading]=useState(false);
  const [loadingDett,setLoadingDett]=useState(false);
  // Per export giorno specifico
  const [expGiorno,setExpGiorno]=useState('');
  const [expMeseM,setExpMeseM]=useState(String(new Date().getMonth()+1).padStart(2,'0'));
  const [expMeseA,setExpMeseA]=useState(String(new Date().getFullYear()));

  useEffect(()=>{
    setLoading(true);
    fetch(`${API}/cassa/sommario?anno=${anno}`)
      .then(r=>r.ok?r.json():[])
      .then(d=>{setSommario(d);setAperto(null);})
      .finally(()=>setLoading(false));
  },[anno]);

  async function apriMese(m){
    if(aperto===m){setAperto(null);return;}
    setAperto(m);setLoadingDett(true);
    try{const r=await fetch(`${API}/cassa?anno=${anno}&mese=${m}`);
      setDettaglio(r.ok?await r.json():[]);
    }finally{setLoadingDett(false);}
  }

  /* ── SHARED HELPERS ── */
  function scaricaCsv(rows,filename){
    const csv=rows.map(r=>r.join(';')).join('\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');
    a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
  }

  function apriPdf(html,titolo){
    const w=window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${titolo}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#111}
  h2{font-size:16px;margin-bottom:8px}
  table{border-collapse:collapse;width:100%}
  th,td{border:1px solid #ccc;padding:5px 8px;text-align:left}
  th{background:#f0f0f0;font-weight:bold}
  tr:nth-child(even){background:#fafafa}
  .tot{font-weight:bold;background:#e8f5e9}
  @media print{body{margin:0}}
</style></head><body>${html}<br><script>window.print();<\/script></body></html>`);
    w.document.close();
  }

  function righeHeader(){return ['Data','Fiscale €','Fatturato €','Art36 €','Contanti €','POS €','Satispay €','Da Versare €','Operatore'];}
  function rigaDa(r){return[
    r.data,fmt(r.chiusura_fiscale),fmt(r.fatturato),fmt(r.fatturato_art36),
    fmt(r.contanti),fmt(r.pos),fmt(r.satispay),fmt(r.contante_da_versare),r.operatore||''
  ];}

  /* ── EXPORT GIORNO ── */
  async function csvGiorno(data){
    if(!data)return;
    const r=await fetch(`${API}/cassa/${data}`);
    const d=await r.json();
    if(!d){alert('Nessuna chiusura trovata per '+data);return;}
    scaricaCsv([righeHeader(),rigaDa(d)],`chiusura_${data}.csv`);
  }
  async function pdfGiorno(data){
    if(!data)return;
    const r=await fetch(`${API}/cassa/${data}`);
    const d=await r.json();
    if(!d){alert('Nessuna chiusura trovata per '+data);return;}
    const riga=rigaDa(d);
    const html=`<h2>Chiusura Cassa — ${data}</h2>
<table><thead><tr>${righeHeader().map(h=>`<th>${h}</th>`).join('')}</tr></thead>
<tbody><tr>${riga.map(c=>`<td>${c}</td>`).join('')}</tr></tbody></table>`;
    apriPdf(html,`Chiusura ${data}`);
  }

  /* ── EXPORT MESE ── */
  async function csvMeseBtn(m,a){
    const r=await fetch(`${API}/cassa?anno=${a}&mese=${m}`);
    const righe=await r.json();
    const rows=[righeHeader(),...righe.map(rigaDa)];
    const tot=['TOTALE',
      fmt(righe.reduce((s,x)=>s+nv(x.chiusura_fiscale),0)),
      fmt(righe.reduce((s,x)=>s+nv(x.fatturato),0)),
      fmt(righe.reduce((s,x)=>s+nv(x.fatturato_art36),0)),
      fmt(righe.reduce((s,x)=>s+nv(x.contanti),0)),
      fmt(righe.reduce((s,x)=>s+nv(x.pos),0)),
      fmt(righe.reduce((s,x)=>s+nv(x.satispay),0)),
      fmt(righe.reduce((s,x)=>s+nv(x.contante_da_versare),0)),''];
    rows.push(tot);
    scaricaCsv(rows,`chiusura_${a}_${String(m).padStart(2,'0')}.csv`);
  }
  async function pdfMeseBtn(m,a){
    const r=await fetch(`${API}/cassa?anno=${a}&mese=${m}`);
    const righe=await r.json();
    const header=righeHeader().map(h=>`<th>${h}</th>`).join('');
    const body=righe.map(x=>`<tr>${rigaDa(x).map(c=>`<td>${c}</td>`).join('')}</tr>`).join('');
    const tot=`<tr class="tot"><td>TOTALE</td>
      <td>${fmt(righe.reduce((s,x)=>s+nv(x.chiusura_fiscale),0))}</td>
      <td>${fmt(righe.reduce((s,x)=>s+nv(x.fatturato),0))}</td>
      <td>${fmt(righe.reduce((s,x)=>s+nv(x.fatturato_art36),0))}</td>
      <td>${fmt(righe.reduce((s,x)=>s+nv(x.contanti),0))}</td>
      <td>${fmt(righe.reduce((s,x)=>s+nv(x.pos),0))}</td>
      <td>${fmt(righe.reduce((s,x)=>s+nv(x.satispay),0))}</td>
      <td>${fmt(righe.reduce((s,x)=>s+nv(x.contante_da_versare),0))}</td><td></td></tr>`;
    const html=`<h2>Chiusura Cassa — ${MESI[m-1]} ${a}</h2>
<table><thead><tr>${header}</tr></thead><tbody>${body}${tot}</tbody></table>`;
    apriPdf(html,`Chiusura ${MESI[m-1]} ${a}`);
  }

  /* ── EXPORT ANNO ── */
  async function csvAnnoBtn(){
    const rows=[['Mese','Fiscale €','Fatturato €','Art36 €','Incasso €','Contanti €','Da Versare €','Giorni']];
    sommario.forEach(m=>{rows.push([
      `${MESI[m.mese-1]} ${anno}`,
      fmt(m.tot_fiscale),fmt(m.tot_fatture||m.tot_fatturato||0),fmt(m.tot_art36),
      fmt(m.tot_incasso),fmt(m.tot_contanti),fmt(m.tot_da_versare||m.contante_da_versare||0),m.giorni
    ]);});
    scaricaCsv(rows,`chiusura_cassa_${anno}.csv`);
  }
  function pdfAnnoBtn(){
    const header=['Mese','Fiscale €','Fatturato €','Art36 €','Incasso €','Contanti €','Da Versare €','Giorni']
      .map(h=>`<th>${h}</th>`).join('');
    const body=sommario.map(m=>`<tr>
      <td>${MESI[m.mese-1]} ${anno}</td>
      <td>${fmt(m.tot_fiscale)}</td><td>${fmt(m.tot_fatture||m.tot_fatturato||0)}</td>
      <td>${fmt(m.tot_art36)}</td><td>${fmt(m.tot_incasso)}</td>
      <td>${fmt(m.tot_contanti)}</td><td>${fmt(m.tot_da_versare||m.contante_da_versare||0)}</td>
      <td>${m.giorni}</td></tr>`).join('');
    const html=`<h2>Chiusura Cassa — Anno ${anno}</h2>
<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
    apriPdf(html,`Chiusura Anno ${anno}`);
  }

  /* ── EXPORT GIORNO DA LISTA DETTAGLIO ── */
  function csvGiornoRiga(r){scaricaCsv([righeHeader(),rigaDa(r)],`chiusura_${r.data}.csv`);}
  function pdfGiornoRiga(r){
    const html=`<h2>Chiusura Cassa — ${r.data}</h2>
<table><thead><tr>${righeHeader().map(h=>`<th>${h}</th>`).join('')}</tr></thead>
<tbody><tr>${rigaDa(r).map(c=>`<td>${c}</td>`).join('')}</tr></tbody></table>`;
    apriPdf(html,`Chiusura ${r.data}`);
  }

  const totAnno=sommario.reduce((a,m)=>({
    incasso:a.incasso+nv(m.tot_incasso),fiscale:a.fiscale+nv(m.tot_fiscale)
  }),{incasso:0,fiscale:0});

  const btnStyle=(col)=>({
    padding:'5px 11px',borderRadius:7,cursor:'pointer',fontSize:12,fontWeight:500,
    background:col==='green'?'rgba(16,185,129,0.15)':col==='blue'?'rgba(59,130,246,0.15)':'rgba(251,191,36,0.15)',
    border:`1px solid ${col==='green'?'rgba(16,185,129,0.35)':col==='blue'?'rgba(59,130,246,0.35)':'rgba(251,191,36,0.35)'}`,
    color:col==='green'?'#34d399':col==='blue'?'#60a5fa':'#fbbf24'
  });

  return (
    <div>
      {/* ── SELETTORE ANNO ── */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        <select value={anno} onChange={e=>setAnno(parseInt(e.target.value))}
          style={{background:'#0f172a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,
            padding:'7px 12px',color:'#e2e8f0',fontSize:13}}>
          {[2023,2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <span style={{color:'#64748b',fontSize:13}}>Totale anno: <b style={{color:'#e2e8f0'}}>{fmtE(totAnno.fiscale)}</b> fiscale · <b style={{color:'#e2e8f0'}}>{fmtE(totAnno.incasso)}</b> incasso</span>
      </div>

      {/* ── SEZIONE EXPORT RAPIDO ── */}
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',
        borderRadius:12,padding:18,marginBottom:24}}>
        <div style={{color:'#94a3b8',fontSize:12,fontWeight:600,marginBottom:14,textTransform:'uppercase',letterSpacing:1}}>
          📥 Export Rapido
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>

          {/* Giorno specifico */}
          <div style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:14}}>
            <div style={{color:'#cbd5e1',fontSize:13,fontWeight:600,marginBottom:10}}>📅 Giorno</div>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <input type="date" value={expGiorno} onChange={e=>setExpGiorno(e.target.value)}
                style={{background:'#0f172a',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,
                  padding:'6px 10px',color:'#e2e8f0',fontSize:13,flex:1,minWidth:140}}/>
              <button onClick={()=>csvGiorno(expGiorno)} style={btnStyle('green')}>📥 CSV</button>
              <button onClick={()=>pdfGiorno(expGiorno)} style={btnStyle('blue')}>📄 PDF</button>
            </div>
          </div>

          {/* Mese */}
          <div style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:14}}>
            <div style={{color:'#cbd5e1',fontSize:13,fontWeight:600,marginBottom:10}}>📆 Mese</div>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <select value={expMeseM} onChange={e=>setExpMeseM(e.target.value)}
                style={{background:'#0f172a',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,
                  padding:'6px 10px',color:'#e2e8f0',fontSize:13}}>
                {MESI.map((n,i)=><option key={i} value={String(i+1).padStart(2,'0')}>{n}</option>)}
              </select>
              <select value={expMeseA} onChange={e=>setExpMeseA(e.target.value)}
                style={{background:'#0f172a',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,
                  padding:'6px 10px',color:'#e2e8f0',fontSize:13}}>
                {[2023,2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
              </select>
              <button onClick={()=>csvMeseBtn(parseInt(expMeseM),parseInt(expMeseA))} style={btnStyle('green')}>📥 CSV</button>
              <button onClick={()=>pdfMeseBtn(parseInt(expMeseM),parseInt(expMeseA))} style={btnStyle('blue')}>📄 PDF</button>
            </div>
          </div>

          {/* Anno */}
          <div style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:14}}>
            <div style={{color:'#cbd5e1',fontSize:13,fontWeight:600,marginBottom:10}}>📊 Anno completo</div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{color:'#94a3b8',fontSize:13}}>{anno}</span>
              <button onClick={csvAnnoBtn} style={btnStyle('green')}>📥 CSV</button>
              <button onClick={pdfAnnoBtn} style={btnStyle('blue')}>📄 PDF</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── LISTA MESI ── */}
      {loading?<div style={{color:'#64748b',textAlign:'center',padding:40}}>Caricamento...</div>:
      sommario.length===0?<div style={{color:'#64748b',textAlign:'center',padding:40}}>Nessuna chiusura per {anno}</div>:
      sommario.map(m=>(
        <div key={m.mese} style={{marginBottom:10,border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,overflow:'hidden'}}>
          {/* Intestazione mese */}
          <div onClick={()=>apriMese(m.mese)}
            style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',
              background:'rgba(255,255,255,0.04)',cursor:'pointer',userSelect:'none',flexWrap:'wrap',gap:8}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{color:'#f1f5f9',fontWeight:600,fontSize:14}}>{MESI[m.mese-1]} {anno}</span>
              <span style={{color:'#64748b',fontSize:12}}>{m.giorni} giorn{m.giorni===1?'o':'i'}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
              <span style={{color:'#34d399',fontSize:13,fontWeight:500}}>{fmtE(m.tot_fiscale||0)}</span>
              <button onClick={e=>{e.stopPropagation();csvMeseBtn(m.mese,anno);}} style={btnStyle('green')}>📥 CSV</button>
              <button onClick={e=>{e.stopPropagation();pdfMeseBtn(m.mese,anno);}} style={btnStyle('blue')}>📄 PDF</button>
              <span style={{color:'#475569',fontSize:16}}>{aperto===m.mese?'▲':'▼'}</span>
            </div>
          </div>

          {/* Dettaglio giorni */}
          {aperto===m.mese && (
            <div style={{padding:'0 12px 12px'}}>
              {loadingDett?<div style={{color:'#64748b',padding:16,textAlign:'center'}}>Caricamento...</div>:
              dettaglio.length===0?<div style={{color:'#64748b',padding:12}}>Nessun giorno</div>:
              dettaglio.map(r=>(
                <div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                  padding:'10px 8px',borderBottom:'1px solid rgba(255,255,255,0.05)',flexWrap:'wrap',gap:6}}>
                  <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
                    <span style={{color:'#94a3b8',fontSize:13,minWidth:90}}>{r.data}</span>
                    <span style={{color:'#f1f5f9',fontSize:13}}>Fiscale: <b>{fmtE(r.chiusura_fiscale)}</b></span>
                    <span style={{color:'#94a3b8',fontSize:12}}>Contanti: {fmtE(r.contanti)}</span>
                    {r.operatore&&<span style={{color:'#64748b',fontSize:11}}>👤 {r.operatore}</span>}
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>csvGiornoRiga(r)} style={btnStyle('green')}>📥 CSV</button>
                    <button onClick={()=>pdfGiornoRiga(r)} style={btnStyle('blue')}>📄 PDF</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

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
