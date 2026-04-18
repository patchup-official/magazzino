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
              <select value={parseInt(form.data?.split('-')[2]||new Date().getDate())}
                onChange={e=>{const p=form.data?.split('-')||[new Date().getFullYear()+'',String(new Date().getMonth()+1).padStart(2,'0'),'01']; set('data',p[0]+'-'+p[1]+'-'+String(e.target.value).padStart(2,'0'));}}
                style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:9,padding:'10px 12px',color:'#f1f5f9',fontSize:16,fontFamily:'Inter,sans-serif',cursor:'pointer',flex:1}}>
                {Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d}>{String(d).padStart(2,'0')}</option>)}
              </select>
              <span style={{color:'#475569',fontSize:20}}>/</span>
              <select value={parseInt(form.data?.split('-')[1]||new Date().getMonth()+1)}
                onChange={e=>{const p=form.data?.split('-')||[new Date().getFullYear()+'','01','01']; set('data',p[0]+'-'+String(e.target.value).padStart(2,'0')+'-'+p[2]);}}
                style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:9,padding:'10px 12px',color:'#f1f5f9',fontSize:16,fontFamily:'Inter,sans-serif',cursor:'pointer',flex:2}}>
                {['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'].map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <span style={{color:'#475569',fontSize:20}}>/</span>
              <select value={parseInt(form.data?.split('-')[0]||new Date().getFullYear())}
                onChange={e=>{const p=form.data?.split('-')||['2026','01','01']; set('data',e.target.value+'-'+p[1]+'-'+p[2]);}}
                style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:9,padding:'10px 12px',color:'#f1f5f9',fontSize:16,fontFamily:'Inter,sans-serif',cursor:'pointer',flex:1}}>
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
                <button onClick={()=>{setAggiungiUscita(false);setNuovaUscita({metodo:'contante',importo:'',tipo:'banca',nota:'');}}
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
