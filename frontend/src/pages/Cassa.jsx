// pages/Cassa.jsx v3
import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const IVA = 0.22;
const MESI = ['','Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const fmt = (n) => Number(n||0).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtE = (n) => '€ ' + fmt(n);
function nv(v) { return parseFloat(v)||0; }
function scorporaIva(l) { return l/(1+IVA); }
function ivaLordo(l) { return l-scorporaIva(l); }

const TAGLIE = [
  {key:'fc_100',label:'€ 100',val:100},{key:'fc_50',label:'€ 50',val:50},{key:'fc_20',label:'€ 20',val:20},
  {key:'fc_10',label:'€ 10',val:10},{key:'fc_5',label:'€ 5',val:5},{key:'fc_2',label:'€ 2',val:2},
  {key:'fc_1',label:'€ 1',val:1},{key:'fc_050',label:'50ct',val:0.5},{key:'fc_020',label:'20ct',val:0.2},
  {key:'fc_010',label:'10ct',val:0.1},{key:'fc_005',label:'5ct',val:0.05},{key:'fc_002',label:'2ct',val:0.02},{key:'fc_001',label:'1ct',val:0.01},
];

const EMPTY = {
  chiusura_fiscale:'',fatturato:'',fatturato_art36:'',
  contanti:'',pos:'',satispay:'',assegni:'',bonifico:'',compass:'',stripe:'',enwon_pay:'',
  uscita_contante:'',uscita_tipo:'contante',versamento_contante:'',fattura_sifar:'',acquisto_privati:'',spostamento_contante:'',
  note_credito:'',fc_100:'',fc_50:'',fc_20:'',fc_10:'',fc_5:'',fc_2:'',fc_1:'',
  fc_050:'',fc_020:'',fc_010:'',fc_005:'',fc_002:'',fc_001:'',contante_da_versare:'',note:'',operatore:''
};

function Campo({ label, k, form, onChange, highlight, type='number', placeholder='0,00', suffix }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4}}>
      <label style={{fontSize:11,color:'#64748b',fontWeight:600,letterSpacing:0.5}}>{label}</label>
      <div style={{position:'relative'}}>
        <input type={type} min={type==='number'?'0':undefined} step={type==='number'?'0.01':undefined}
          value={form[k]} placeholder={placeholder} onChange={e => onChange(k, e.target.value)}
          style={{width:'100%',padding:suffix?'8px 32px 8px 10px':'8px 10px',borderRadius:8,
            background:highlight?'rgba(99,102,241,0.08)':'rgba(255,255,255,0.05)',
            border:`1px solid ${highlight?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.1)'}`,
            color:'#e2e8f0',fontSize:14,outline:'none',boxSizing:'border-box'}} />
        {suffix && <span style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',color:'#475569',fontSize:12}}>{suffix}</span>}
      </div>
    </div>
  );
}

function Riga({ label, valore, color='#e2e8f0', bold, small, indent, highlight }) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
      padding:small?'4px 12px':'8px 12px',background:highlight?'rgba(99,102,241,0.06)':'transparent',
      borderRadius:highlight?8:0,paddingLeft:indent?24:12}}>
      <span style={{color:small?'#64748b':'#94a3b8',fontSize:small?11:13,fontStyle:indent?'italic':'normal'}}>{label}</span>
      <span style={{color,fontWeight:bold?700:400,fontSize:small?11:14}}>{fmtE(valore)}</span>
    </div>
  );
}

function Sezione({ titolo, children, color='#6366f1', collapsible, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,marginBottom:14,overflow:'hidden'}}>
      <div onClick={collapsible?()=>setOpen(o=>!o):undefined}
        style={{display:'flex',alignItems:'center',gap:10,padding:'14px 18px',
          borderBottom:open?'1px solid rgba(255,255,255,0.06)':'none',
          cursor:collapsible?'pointer':'default',background:`linear-gradient(90deg, ${color}18, transparent)`}}>
        <div style={{width:3,height:18,borderRadius:2,background:color,flexShrink:0}}/>
        <span style={{fontSize:13,fontWeight:700,color:'#e2e8f0',flex:1}}>{titolo}</span>
        {collapsible && <span style={{color:'#475569',fontSize:12}}>{open?'▾':'▸'}</span>}
      </div>
      {open && <div style={{padding:'14px 18px'}}>{children}</div>}
    </div>
  );
}

function StepBar({ step, labels }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:28}}>
      {labels.map((l,i) => (
        <div key={i} style={{display:'flex',alignItems:'center',flex:i<labels.length-1?1:'auto'}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
            <div style={{width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
              background:i<step?'#22c55e':i===step?'#6366f1':'rgba(255,255,255,0.06)',
              border:`2px solid ${i<step?'#22c55e':i===step?'#6366f1':'rgba(255,255,255,0.1)'}`,
              color:i<=step?'#fff':'#475569',fontSize:12,fontWeight:700,flexShrink:0}}>
              {i<step?'✓':i+1}
            </div>
            <span style={{fontSize:10,color:i===step?'#a5b4fc':i<step?'#22c55e':'#475569',fontWeight:i===step?700:400,whiteSpace:'nowrap'}}>{l}</span>
          </div>
          {i<labels.length-1 && <div style={{flex:1,height:2,background:i<step?'#22c55e':'rgba(255,255,255,0.08)',margin:'0 4px',marginBottom:20}}/>}
        </div>
      ))}
    </div>
  );
}

function WizardChiusura({ showToast, onComplete }) {
  const today = new Date().toISOString().slice(0,10);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({...EMPTY});
  const [saving, setSaving] = useState(false);
  const [esistente, setEsistente] = useState(false);
  const [dataSelezionata, setDataSelezionata] = useState(today);
  const [configMese, setConfigMese] = useState(null);
  const onChange = useCallback((k,v) => setForm(p=>({...p,[k]:v})),[]);

  useEffect(() => {
    const d = new Date(dataSelezionata);
    const mese = d.getMonth()+1, anno = d.getFullYear();
    fetch(API+'/cassa/'+dataSelezionata).then(r=>r.json()).then(data => {
      if (data) { setEsistente(true); const f={...EMPTY}; Object.keys(f).forEach(k=>{f[k]=data[k]!==undefined&&data[k]!==null?String(data[k]):''}); setForm(f); }
      else { setEsistente(false); setForm({...EMPTY}); }
    }).catch(()=>{});
    fetch(API+'/cassa/config/'+anno+'/'+mese).then(r=>r.json()).then(setConfigMese).catch(()=>{});
  }, [dataSelezionata]);

  const chiusuraTot = nv(form.chiusura_fiscale)+nv(form.fatturato)+nv(form.fatturato_art36);
  const totIncassato = nv(form.contanti)+nv(form.pos)+nv(form.satispay)+nv(form.assegni)+nv(form.bonifico)+nv(form.compass)+nv(form.stripe)+nv(form.enwon_pay);
  const diff = totIncassato - chiusuraTot;
  const totUscite = nv(form.uscita_contante)+nv(form.versamento_contante)+nv(form.fattura_sifar)+nv(form.acquisto_privati)+nv(form.spostamento_contante);
  const fondo = TAGLIE.reduce((s,t)=>s+(nv(form[t.key])*t.val),0);
  const accantonato = configMese?.accantonato||0;
  const contanteDaVersare = Math.max(0, nv(form.contanti) - totUscite - accantonato);

  async function salva() {
    setSaving(true);
    try {
      const payload = {...form, data: dataSelezionata};
      Object.keys(EMPTY).forEach(k=>{ if(k!=='uscita_tipo'&&k!=='note'&&k!=='operatore') payload[k]=nv(payload[k])||0; });
      const r = await fetch(API+'/cassa',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if (r.ok) { showToast('Chiusura salvata!','success'); onComplete && onComplete(); }
      else { const e=await r.json(); showToast(e.error||'Errore','error'); }
    } catch { showToast('Errore di rete','error'); }
    setSaving(false);
  }

  const STEPS = ['Data','Vendite','Incassi','Uscite','Fondo Cassa','Riepilogo'];
  const btnNext = () => setStep(s=>Math.min(s+1,STEPS.length-1));
  const btnBack = () => setStep(s=>Math.max(s-1,0));

  const Nav = ({canNext=true,nextLabel='Avanti →'}) => (
    <div style={{display:'flex',gap:10,marginTop:24}}>
      {step>0 && <button onClick={btnBack} style={{padding:'11px 24px',borderRadius:10,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',cursor:'pointer',fontSize:14}}>← Indietro</button>}
      <button onClick={step<STEPS.length-1?btnNext:salva} disabled={!canNext||saving}
        style={{flex:1,padding:'13px',borderRadius:10,border:'none',
          background:canNext?(step<STEPS.length-1?'#6366f1':'#22c55e'):'rgba(255,255,255,0.05)',
          color:'#fff',fontSize:15,fontWeight:700,cursor:canNext?'pointer':'not-allowed',
          boxShadow:canNext?'0 4px 16px rgba(99,102,241,0.3)':'none'}}>
        {saving?'⏳ Salvataggio...':(step<STEPS.length-1?nextLabel:(esistente?'💾 Aggiorna':'💾 Salva chiusura'))}
      </button>
    </div>
  );

  return (
    <div style={{maxWidth:780,margin:'0 auto'}}>
      <StepBar step={step} labels={STEPS} />

      {step===0 && (
        <div>
          <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:28}}>
            <div style={{fontSize:18,fontWeight:700,color:'#e2e8f0',marginBottom:6}}>Per quale data stai inserendo la chiusura?</div>
            <div style={{color:'#64748b',fontSize:13,marginBottom:24}}>Seleziona la data. Se esiste già una chiusura verrà aggiornata.</div>
            <input type="date" value={dataSelezionata} onChange={e=>setDataSelezionata(e.target.value)}
              style={{padding:'12px 16px',borderRadius:10,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.15)',color:'#e2e8f0',fontSize:16,outline:'none',width:'100%',boxSizing:'border-box'}}/>
            {esistente && <div style={{marginTop:14,padding:'10px 14px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:8,color:'#f59e0b',fontSize:13}}>⚠️ Esiste già una chiusura per questa data. Continuando la aggiornerai.</div>}
            {configMese ? <div style={{marginTop:14,padding:'10px 14px',background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.15)',borderRadius:8,fontSize:13,color:'#94a3b8'}}>✓ Accantonato mensile: <strong style={{color:'#22c55e'}}>{fmtE(configMese.accantonato)}</strong></div>
            : <div style={{marginTop:14,padding:'10px 14px',background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.15)',borderRadius:8,fontSize:13,color:'#a5b4fc'}}>ℹ️ Accantonato non configurato. Impostalo nel tab Riepilogo.</div>}
          </div>
          <Nav nextLabel="Inizia inserimento →"/>
        </div>
      )}

      {step===1 && (
        <div>
          <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:28}}>
            <div style={{fontSize:18,fontWeight:700,color:'#e2e8f0',marginBottom:4}}>Quant'è stato il fatturato di oggi?</div>
            <div style={{color:'#64748b',fontSize:13,marginBottom:24}}>Inserisci i totali dalla chiusura fiscale del registratore di cassa.</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
              <div><Campo label="CHIUSURA FISCALE *" k="chiusura_fiscale" form={form} onChange={onChange} highlight suffix="€"/><div style={{fontSize:11,color:'#475569',marginTop:4}}>Totale scontrini emessi</div></div>
              <div><Campo label="FATTURATO" k="fatturato" form={form} onChange={onChange} suffix="€"/><div style={{fontSize:11,color:'#475569',marginTop:4}}>Fatture emesse</div></div>
              <div><Campo label="FATTURATO ART. 36 (usato)" k="fatturato_art36" form={form} onChange={onChange} suffix="€"/><div style={{fontSize:11,color:'#475569',marginTop:4}}>Vendita dispositivi usati</div></div>
            </div>
            {nv(form.fatturato_art36)>0 && (
              <div style={{marginTop:16,padding:'14px 16px',background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:10}}>
                <div style={{fontSize:12,color:'#f59e0b',fontWeight:600,marginBottom:10}}>📋 ART.36 — IVA solo sul margine (vendita - costo acquisto)</div>
                <Campo label="ACQUISTO DA PRIVATI (costo d'acquisto dispositivi art.36)" k="acquisto_privati" form={form} onChange={onChange} suffix="€"/>
                <div style={{fontSize:11,color:'#64748b',marginTop:6}}>IVA calcolata su: ({fmtE(nv(form.fatturato_art36))} − {fmtE(nv(form.acquisto_privati))}) × 22%</div>
                {nv(form.acquisto_privati)>0 && (
                  <div style={{marginTop:8,display:'flex',gap:20,fontSize:12}}>
                    <span style={{color:'#94a3b8'}}>Margine: <strong style={{color:'#e2e8f0'}}>{fmtE(Math.max(0,nv(form.fatturato_art36)-nv(form.acquisto_privati)))}</strong></span>
                    <span style={{color:'#94a3b8'}}>IVA art.36: <strong style={{color:'#f59e0b'}}>{fmtE(ivaLordo(Math.max(0,nv(form.fatturato_art36)-nv(form.acquisto_privati))))}</strong></span>
                  </div>
                )}
              </div>
            )}
            <div style={{marginTop:16,padding:'10px 14px',background:'rgba(99,102,241,0.06)',borderRadius:8,display:'flex',justifyContent:'space-between'}}>
              <span style={{color:'#64748b',fontSize:13}}>Totale chiusura</span>
              <span style={{color:'#a5b4fc',fontWeight:700,fontSize:16}}>{fmtE(chiusuraTot)}</span>
            </div>
            {nv(form.chiusura_fiscale)>0 && (
              <div style={{marginTop:6,display:'flex',gap:16,flexWrap:'wrap'}}>
                <span style={{fontSize:11,color:'#475569'}}>Netto IVA: <strong style={{color:'#e2e8f0'}}>{fmtE(scorporaIva(nv(form.chiusura_fiscale)))}</strong></span>
                <span style={{fontSize:11,color:'#475569'}}>IVA 22%: <strong style={{color:'#6366f1'}}>{fmtE(ivaLordo(nv(form.chiusura_fiscale)))}</strong></span>
              </div>
            )}
          </div>
          <Nav/>
        </div>
      )}

      {step===2 && (
        <div>
          <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:28}}>
            <div style={{fontSize:18,fontWeight:700,color:'#e2e8f0',marginBottom:4}}>Come è stato incassato?</div>
            <div style={{color:'#64748b',fontSize:13,marginBottom:24}}>Inserisci gli importi per ogni metodo. Il totale deve corrispondere alla chiusura.</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:14}}>
              <Campo label="CONTANTI" k="contanti" form={form} onChange={onChange} highlight suffix="€"/>
              <Campo label="POS" k="pos" form={form} onChange={onChange} suffix="€"/>
              <Campo label="SATISPAY" k="satispay" form={form} onChange={onChange} suffix="€"/>
              <Campo label="ASSEGNI" k="assegni" form={form} onChange={onChange} suffix="€"/>
              <Campo label="BONIFICO BANCARIO" k="bonifico" form={form} onChange={onChange} suffix="€"/>
              <Campo label="COMPASS" k="compass" form={form} onChange={onChange} suffix="€"/>
              <Campo label="STRIPE" k="stripe" form={form} onChange={onChange} suffix="€"/>
              <Campo label="ENWON PAY" k="enwon_pay" form={form} onChange={onChange} suffix="€"/>
            </div>
            <Campo label="NOTE DI CREDITO (storni/rimborsi)" k="note_credito" form={form} onChange={onChange} suffix="€"/>
            <div style={{marginTop:14,padding:'12px 16px',borderRadius:10,
              background:Math.abs(diff)<0.01?'rgba(34,197,94,0.07)':'rgba(239,68,68,0.07)',
              border:`1px solid ${Math.abs(diff)<0.01?'rgba(34,197,94,0.2)':'rgba(239,68,68,0.2)'}`,
              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{color:'#94a3b8',fontSize:13}}>Incassato {fmtE(totIncassato)} vs Chiusura {fmtE(chiusuraTot)}</span>
              <span style={{fontWeight:700,color:Math.abs(diff)<0.01?'#22c55e':'#ef4444',fontSize:15}}>{diff>=0?'+':''}{fmtE(diff)} {Math.abs(diff)<0.01?'✓':'⚠️'}</span>
            </div>
            {(nv(form.compass)+nv(form.stripe)+nv(form.enwon_pay))>0 && (
              <div style={{marginTop:10,padding:'8px 14px',background:'rgba(99,102,241,0.06)',borderRadius:8,fontSize:12,color:'#a5b4fc'}}>
                💳 Bonifici da incassare da agenzie: <strong>{fmtE(nv(form.compass)+nv(form.stripe)+nv(form.enwon_pay))}</strong>
                <span style={{color:'#475569',marginLeft:8}}>Compass {fmtE(nv(form.compass))} · Stripe {fmtE(nv(form.stripe))} · Enwon {fmtE(nv(form.enwon_pay))}</span>
              </div>
            )}
          </div>
          <Nav/>
        </div>
      )}

      {step===3 && (
        <div>
          <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:28}}>
            <div style={{fontSize:18,fontWeight:700,color:'#e2e8f0',marginBottom:4}}>Ci sono uscite di contante?</div>
            <div style={{color:'#64748b',fontSize:13,marginBottom:24}}>Specifica il tipo di pagamento per calcolare correttamente il contante da versare.</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:14}}>
              <div><Campo label="VERSAMENTO IN BANCA" k="versamento_contante" form={form} onChange={onChange} suffix="€"/><div style={{fontSize:11,color:'#475569',marginTop:4}}>Contante portato in banca</div></div>
              <div><Campo label="FATTURA SIFAR" k="fattura_sifar" form={form} onChange={onChange} suffix="€"/><div style={{fontSize:11,color:'#475569',marginTop:4}}>Pagamento fornitore</div></div>
              <div>
                <div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:6,letterSpacing:0.5}}>USCITA CONTANTE GENERICA</div>
                <div style={{display:'flex',gap:8}}>
                  <input type="number" min="0" step="0.01" value={form.uscita_contante} placeholder="0,00" onChange={e=>onChange('uscita_contante',e.target.value)}
                    style={{flex:1,padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',fontSize:14,outline:'none'}}/>
                  <select value={form.uscita_tipo} onChange={e=>onChange('uscita_tipo',e.target.value)}
                    style={{padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',fontSize:13,outline:'none'}}>
                    <option value="contante">In contante</option>
                    <option value="bonifico">Bonifico</option>
                    <option value="pos">POS</option>
                  </select>
                </div>
              </div>
              <div><Campo label="SPOSTAMENTO CONTANTE" k="spostamento_contante" form={form} onChange={onChange} suffix="€"/><div style={{fontSize:11,color:'#475569',marginTop:4}}>Trasferimento tra sedi</div></div>
            </div>
            {nv(form.fatturato_art36)===0 && <Campo label="ACQUISTO DA PRIVATI" k="acquisto_privati" form={form} onChange={onChange} suffix="€"/>}
            <div style={{marginTop:14,padding:'10px 14px',background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.15)',borderRadius:8,display:'flex',justifyContent:'space-between'}}>
              <span style={{color:'#94a3b8',fontSize:13}}>Totale uscite contante</span>
              <span style={{color:'#ef4444',fontWeight:700}}>{fmtE(totUscite)}</span>
            </div>
            <div style={{marginTop:10,padding:'12px 14px',background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.15)',borderRadius:8}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div><div style={{color:'#94a3b8',fontSize:13}}>Contante da versare stimato</div><div style={{fontSize:11,color:'#475569',marginTop:2}}>Contanti {fmtE(nv(form.contanti))} − Uscite {fmtE(totUscite)} − Accantonato {fmtE(accantonato)}</div></div>
                <span style={{color:'#f59e0b',fontWeight:700,fontSize:16}}>{fmtE(contanteDaVersare)}</span>
              </div>
            </div>
          </div>
          <Nav/>
        </div>
      )}

      {step===4 && (
        <div>
          <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:28}}>
            <div style={{fontSize:18,fontWeight:700,color:'#e2e8f0',marginBottom:4}}>Conta il fondo cassa</div>
            <div style={{color:'#64748b',fontSize:13,marginBottom:20}}>Conta le banconote/monete rimaste e inserisci le quantità.</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
              {TAGLIE.map(t => (
                <div key={t.key} style={{display:'flex',flexDirection:'column',gap:4}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <label style={{fontSize:12,color:'#94a3b8',fontWeight:600}}>{t.label}</label>
                    {nv(form[t.key])>0 && <span style={{fontSize:10,color:'#f59e0b'}}>={fmt(nv(form[t.key])*t.val)}</span>}
                  </div>
                  <input type="number" min="0" step="1" value={form[t.key]} placeholder="0" onChange={e=>onChange(t.key,e.target.value)}
                    style={{padding:'7px 10px',borderRadius:8,background:nv(form[t.key])>0?'rgba(245,158,11,0.08)':'rgba(255,255,255,0.04)',border:`1px solid ${nv(form[t.key])>0?'rgba(245,158,11,0.25)':'rgba(255,255,255,0.08)'}`,color:'#e2e8f0',fontSize:14,outline:'none',width:'100%',boxSizing:'border-box'}}/>
                </div>
              ))}
            </div>
            <div style={{padding:'10px 14px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:10,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <span style={{color:'#94a3b8',fontSize:13}}>Totale fondo cassa</span>
              <span style={{color:'#f59e0b',fontWeight:800,fontSize:18}}>{fmtE(fondo)}</span>
            </div>
            <Campo label="CONTANTE DA VERSARE (conferma)" k="contante_da_versare" form={form} onChange={onChange} suffix="€" placeholder={fmt(contanteDaVersare)}/>
            <div style={{fontSize:11,color:'#475569',marginTop:4}}>Calcolato: {fmtE(contanteDaVersare)}. Modifica se necessario.</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:14}}>
              <div>
                <div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:6}}>NOTE</div>
                <textarea value={form.note} onChange={e=>onChange('note',e.target.value)} placeholder="Es. €50 Samsung A16 acquisto privato..." rows={3}
                  style={{width:'100%',padding:'9px 12px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box',fontFamily:'inherit'}}/>
              </div>
              <div>
                <div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:6}}>OPERATORE</div>
                <input value={form.operatore} onChange={e=>onChange('operatore',e.target.value)} placeholder="Nome"
                  style={{width:'100%',padding:'9px 12px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
              </div>
            </div>
          </div>
          <Nav nextLabel="Vedi riepilogo →"/>
        </div>
      )}

      {step===5 && (
        <div>
          <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:24,marginBottom:14}}>
            <div style={{fontSize:18,fontWeight:700,color:'#e2e8f0',marginBottom:4}}>Riepilogo chiusura {dataSelezionata.split('-').reverse().join('/')}</div>
            <div style={{color:'#64748b',fontSize:13,marginBottom:18}}>Verifica i dati prima di salvare.</div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:'#6366f1',fontWeight:700,letterSpacing:1,marginBottom:6,padding:'0 12px'}}>VENDITE</div>
              <Riga label="Chiusura Fiscale (lordo)" valore={nv(form.chiusura_fiscale)} highlight/>
              <Riga label="  → Netto IVA" valore={scorporaIva(nv(form.chiusura_fiscale))} small indent/>
              <Riga label="  → IVA 22%" valore={ivaLordo(nv(form.chiusura_fiscale))} small indent color="#6366f1"/>
              {nv(form.fatturato)>0 && <><Riga label="Fatturato" valore={nv(form.fatturato)} highlight/><Riga label="  → Netto IVA" valore={scorporaIva(nv(form.fatturato))} small indent/><Riga label="  → IVA 22%" valore={ivaLordo(nv(form.fatturato))} small indent color="#6366f1"/></>}
              {nv(form.fatturato_art36)>0 && <><Riga label="Art.36 (lordo)" valore={nv(form.fatturato_art36)} highlight/><Riga label="  Acquisto privati" valore={nv(form.acquisto_privati)} small indent color="#ef4444"/><Riga label="  IVA sul margine" valore={ivaLordo(Math.max(0,nv(form.fatturato_art36)-nv(form.acquisto_privati)))} small indent color="#f59e0b"/></>}
              <Riga label="TOTALE CHIUSURA" valore={chiusuraTot} color="#a5b4fc" bold highlight/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:'#22c55e',fontWeight:700,letterSpacing:1,marginBottom:6,padding:'0 12px'}}>INCASSI</div>
              {nv(form.contanti)>0&&<Riga label="Contanti" valore={nv(form.contanti)} color="#f59e0b"/>}
              {nv(form.pos)>0&&<Riga label="POS" valore={nv(form.pos)}/>}
              {nv(form.satispay)>0&&<Riga label="Satispay" valore={nv(form.satispay)}/>}
              {nv(form.assegni)>0&&<Riga label="Assegni" valore={nv(form.assegni)}/>}
              {nv(form.bonifico)>0&&<Riga label="Bonifico bancario" valore={nv(form.bonifico)}/>}
              {nv(form.compass)>0&&<Riga label="Compass (da incassare)" valore={nv(form.compass)} color="#a5b4fc"/>}
              {nv(form.stripe)>0&&<Riga label="Stripe (da incassare)" valore={nv(form.stripe)} color="#a5b4fc"/>}
              {nv(form.enwon_pay)>0&&<Riga label="Enwon Pay (da incassare)" valore={nv(form.enwon_pay)} color="#a5b4fc"/>}
              {nv(form.note_credito)>0&&<Riga label="Note di credito" valore={-nv(form.note_credito)} color="#ef4444"/>}
              <Riga label="TOTALE INCASSATO" valore={totIncassato} color="#22c55e" bold highlight/>
              <Riga label={`Differenza ${Math.abs(diff)<0.01?'(✓ ok)':'(⚠️ verifica)'}`} valore={diff} color={Math.abs(diff)<0.01?'#22c55e':'#ef4444'} bold/>
            </div>
            <div>
              <div style={{fontSize:11,color:'#f59e0b',fontWeight:700,letterSpacing:1,marginBottom:6,padding:'0 12px'}}>CONTANTE & USCITE</div>
              {nv(form.versamento_contante)>0&&<Riga label="Versamento banca" valore={nv(form.versamento_contante)}/>}
              {nv(form.fattura_sifar)>0&&<Riga label="Fattura Sifar" valore={nv(form.fattura_sifar)}/>}
              {nv(form.uscita_contante)>0&&<Riga label={'Uscita ('+form.uscita_tipo+')'} valore={nv(form.uscita_contante)}/>}
              <Riga label="Accantonato mensile" valore={accantonato} color="#f59e0b"/>
              <Riga label="CONTANTE DA VERSARE" valore={nv(form.contante_da_versare)||contanteDaVersare} color="#f59e0b" bold highlight/>
              <Riga label="Fondo cassa" valore={fondo} color="#f59e0b"/>
            </div>
          </div>
          {form.operatore&&<div style={{textAlign:'right',fontSize:12,color:'#475569',marginBottom:10}}>Operatore: <strong style={{color:'#94a3b8'}}>{form.operatore}</strong></div>}
          <Nav/>
        </div>
      )}
    </div>
  );
}

function TabRiepilogo({ showToast }) {
  const oggi = new Date();
  const [mese, setMese] = useState(oggi.getMonth()+1);
  const [anno, setAnno] = useState(oggi.getFullYear());
  const [riepilogo, setRiepilogo] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editAcc, setEditAcc] = useState(false);
  const [nuovoAcc, setNuovoAcc] = useState('');
  const iStyle = {padding:'8px 12px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',fontSize:14,outline:'none'};

  async function carica() {
    setLoading(true);
    try {
      const [r,c] = await Promise.all([
        fetch(API+'/cassa/riepilogo/'+anno+'/'+mese).then(r=>r.json()),
        fetch(API+'/cassa/config/'+anno+'/'+mese).then(r=>r.json())
      ]);
      setRiepilogo(r); setConfig(c); setNuovoAcc(c?.accantonato||0);
    } catch { showToast('Errore caricamento','error'); }
    setLoading(false);
  }

  useEffect(() => { carica(); }, [mese, anno]);

  async function salvaAccantonato() {
    try {
      await fetch(API+'/cassa/config',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({mese,anno,accantonato:parseFloat(nuovoAcc)||0,agenzie_bonifico:config?.agenzie_bonifico||['Compass','Stripe','Enwon Pay']})});
      showToast('Accantonato salvato!','success'); setEditAcc(false); carica();
    } catch { showToast('Errore','error'); }
  }

  return (
    <div>
      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:24,flexWrap:'wrap'}}>
        <div><div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:6}}>MESE</div><select value={mese} onChange={e=>setMese(Number(e.target.value))} style={iStyle}>{MESI.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select></div>
        <div><div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:6}}>ANNO</div><select value={anno} onChange={e=>setAnno(Number(e.target.value))} style={iStyle}>{[2024,2025,2026,2027].map(a=><option key={a} value={a}>{a}</option>)}</select></div>
        <div style={{marginLeft:'auto',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:12,padding:'10px 16px'}}>
          <div style={{fontSize:11,color:'#f59e0b',fontWeight:600}}>ACCANTONATO MESE</div>
          {editAcc ? (
            <div style={{display:'flex',gap:8,marginTop:4}}>
              <input type="number" value={nuovoAcc} onChange={e=>setNuovoAcc(e.target.value)} style={{...iStyle,width:100,padding:'6px 10px',fontSize:13}}/>
              <button onClick={salvaAccantonato} style={{padding:'6px 12px',borderRadius:8,background:'#22c55e',border:'none',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600}}>✓</button>
              <button onClick={()=>setEditAcc(false)} style={{padding:'6px 10px',borderRadius:8,background:'rgba(255,255,255,0.06)',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:12}}>✕</button>
            </div>
          ) : (
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:2}}>
              <span style={{color:'#e2e8f0',fontWeight:700,fontSize:16}}>{fmtE(config?.accantonato||0)}</span>
              <button onClick={()=>setEditAcc(true)} style={{padding:'3px 8px',borderRadius:6,background:'rgba(245,158,11,0.15)',border:'none',color:'#f59e0b',cursor:'pointer',fontSize:11}}>Modifica</button>
            </div>
          )}
        </div>
      </div>

      {loading && <div style={{textAlign:'center',padding:'40px',color:'#64748b'}}>⏳ Caricamento...</div>}
      {!loading && riepilogo && riepilogo.giorni===0 && <div style={{textAlign:'center',padding:'60px',color:'#64748b'}}>Nessuna chiusura per {MESI[mese]} {anno}.</div>}

      {!loading && riepilogo && riepilogo.giorni>0 && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div>
            <Sezione titolo="Vendite" color="#6366f1">
              <Riga label="Chiusura Fiscale (lordo)" valore={riepilogo.tot_fiscale_lordo} highlight/>
              <Riga label="  Netto IVA" valore={riepilogo.tot_fiscale_netto} small indent/>
              <Riga label="  IVA 22%" valore={riepilogo.tot_fiscale_iva} small indent color="#6366f1"/>
              {riepilogo.tot_fatture_lordo>0&&<><div style={{height:1,background:'rgba(255,255,255,0.05)',margin:'6px 0'}}/><Riga label="Fatturato (lordo)" valore={riepilogo.tot_fatture_lordo} highlight/><Riga label="  Netto IVA" valore={riepilogo.tot_fatture_netto} small indent/><Riga label="  IVA 22%" valore={riepilogo.tot_fatture_iva} small indent color="#6366f1"/></>}
              {riepilogo.tot_art36_lordo>0&&<><div style={{height:1,background:'rgba(255,255,255,0.05)',margin:'6px 0'}}/><Riga label="Art.36 (lordo)" valore={riepilogo.tot_art36_lordo} highlight/><Riga label="  Acquisto privati" valore={riepilogo.tot_acquisti_privati} small indent color="#ef4444"/><Riga label="  Margine" valore={riepilogo.margine_art36} small indent/><Riga label="  IVA sul margine" valore={riepilogo.tot_art36_iva} small indent color="#f59e0b"/><Riga label="  Netto IVA" valore={riepilogo.tot_art36_netto} small indent/></>}
              <div style={{height:1,background:'rgba(255,255,255,0.08)',margin:'8px 0'}}/>
              <Riga label="TOTALE INCASSO LORDO" valore={riepilogo.tot_incasso_lordo} color="#a5b4fc" bold highlight/>
              <Riga label="TOTALE NETTO IVA" valore={riepilogo.tot_incasso_netto} color="#e2e8f0" bold/>
              <Riga label="IVA TOTALE INCASSATA" valore={riepilogo.tot_iva_incassata} color="#6366f1" bold/>
            </Sezione>
            <Sezione titolo="Note di Credito" color="#ef4444" collapsible>
              <Riga label="Totale note di credito" valore={riepilogo.tot_note_credito} color="#ef4444" bold highlight/>
            </Sezione>
          </div>
          <div>
            <Sezione titolo="Metodi di Pagamento" color="#22c55e">
              {riepilogo.tot_contanti>0&&<Riga label="Contanti" valore={riepilogo.tot_contanti} color="#f59e0b"/>}
              {riepilogo.tot_pos>0&&<Riga label="POS" valore={riepilogo.tot_pos}/>}
              {riepilogo.tot_satispay>0&&<Riga label="Satispay" valore={riepilogo.tot_satispay}/>}
              {riepilogo.tot_assegni>0&&<Riga label="Assegni" valore={riepilogo.tot_assegni}/>}
              {riepilogo.tot_bonifico>0&&<Riga label="Bonifico bancario" valore={riepilogo.tot_bonifico}/>}
              <div style={{height:1,background:'rgba(255,255,255,0.06)',margin:'6px 0'}}/>
              {riepilogo.tot_compass>0&&<Riga label="Compass" valore={riepilogo.tot_compass} color="#a5b4fc"/>}
              {riepilogo.tot_stripe>0&&<Riga label="Stripe" valore={riepilogo.tot_stripe} color="#a5b4fc"/>}
              {riepilogo.tot_enwon>0&&<Riga label="Enwon Pay" valore={riepilogo.tot_enwon} color="#a5b4fc"/>}
              {riepilogo.bonifici_agenzie>0&&<><div style={{height:1,background:'rgba(255,255,255,0.06)',margin:'6px 0'}}/><Riga label="BONIFICI DA INCASSARE" valore={riepilogo.bonifici_agenzie} color="#a5b4fc" bold highlight/></>}
            </Sezione>
            <Sezione titolo="Contante & Accantonato" color="#f59e0b">
              <Riga label="Contanti incassati" valore={riepilogo.tot_contanti} color="#f59e0b"/>
              <Riga label="Uscite contante" valore={riepilogo.tot_uscite_contante} color="#ef4444"/>
              <Riga label="Accantonato mese" valore={riepilogo.accantonato} color="#f59e0b"/>
              <div style={{height:1,background:'rgba(255,255,255,0.08)',margin:'8px 0'}}/>
              <Riga label="CONTANTE DA VERSARE" valore={riepilogo.contante_da_versare} color="#f59e0b" bold highlight/>
            </Sezione>
            <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'14px 18px'}}>
              <div style={{fontSize:11,color:'#475569',fontWeight:600,letterSpacing:1,marginBottom:10}}>SINTESI {MESI[mese].toUpperCase()} {anno}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[{l:'Giorni',v:riepilogo.giorni+'gg',c:'#64748b'},{l:'Incasso lordo',v:fmtE(riepilogo.tot_incasso_lordo),c:'#22c55e'},{l:'IVA incassata',v:fmtE(riepilogo.tot_iva_incassata),c:'#6366f1'},{l:'Netto IVA',v:fmtE(riepilogo.tot_incasso_netto),c:'#e2e8f0'},{l:'Da versare',v:fmtE(riepilogo.contante_da_versare),c:'#f59e0b'},{l:'Agenzie',v:fmtE(riepilogo.bonifici_agenzie),c:'#a5b4fc'}].map(k=>(
                  <div key={k.l} style={{padding:'8px 10px',background:'rgba(255,255,255,0.03)',borderRadius:8}}>
                    <div style={{fontSize:10,color:'#475569',fontWeight:600}}>{k.l.toUpperCase()}</div>
                    <div style={{fontSize:14,fontWeight:700,color:k.c,marginTop:2}}>{k.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabStorico() {
  const anno = new Date().getFullYear();
  const mese = new Date().getMonth()+1;
  const [sommario, setSommario] = useState([]);
  const [chiusure, setChiusure] = useState([]);
  const [meseAperto, setMeseAperto] = useState(null);
  useEffect(() => {
    fetch(API+'/cassa/sommario?anno='+anno).then(r=>r.json()).then(d=>setSommario(Array.isArray(d)?d:[])).catch(()=>{});
    fetch(API+'/cassa?anno='+anno).then(r=>r.json()).then(d=>setChiusure(Array.isArray(d)?d:[])).catch(()=>{});
  }, []);
  const tot = sommario.reduce((a,m)=>({inc:a.inc+(m.tot_incasso||0),fisc:a.fisc+(m.tot_fiscale||0),art36:a.art36+(m.tot_art36||0)}),{inc:0,fisc:0,art36:0});
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:24}}>
        {[{l:'Incasso Anno',v:tot.inc,c:'#22c55e'},{l:'Fiscale Anno',v:tot.fisc,c:'#6366f1'},{l:'Art.36 Anno',v:tot.art36,c:'#f59e0b'}].map(k=>(
          <div key={k.l} style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'18px 20px'}}>
            <div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:8}}>{k.l.toUpperCase()}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.c}}>{fmtE(k.v)}</div>
          </div>
        ))}
      </div>
      <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,overflow:'hidden'}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between'}}>
          <span style={{color:'#e2e8f0',fontWeight:700}}>Riepilogo {anno}</span>
          <span style={{color:'#64748b',fontSize:13}}>{sommario.length} mesi</span>
        </div>
        {sommario.map(m=>(
          <div key={m.mese}>
            <div onClick={()=>setMeseAperto(meseAperto===m.mese?null:m.mese)}
              style={{display:'flex',gap:16,padding:'12px 20px',borderBottom:'1px solid rgba(255,255,255,0.04)',cursor:'pointer',alignItems:'center',background:m.mese===mese?'rgba(34,197,94,0.03)':'transparent'}}>
              <span style={{color:m.mese===mese?'#22c55e':'#e2e8f0',fontWeight:600,minWidth:110}}>{meseAperto===m.mese?'▾':'▸'} {MESI[m.mese]}</span>
              <span style={{color:'#64748b',minWidth:30,fontSize:12}}>{m.giorni}gg</span>
              <span style={{color:'#a5b4fc',minWidth:120,fontSize:13}}>Fisc: {fmtE(m.tot_fiscale)}</span>
              <span style={{color:'#22c55e',fontWeight:700,minWidth:130}}>Inc: {fmtE(m.tot_incasso)}</span>
              <span style={{color:'#f59e0b',minWidth:110,fontSize:12}}>Cash: {fmtE(m.tot_contanti)}</span>
              <span style={{color:'#94a3b8',fontSize:12}}>POS: {fmtE(m.tot_pos)}</span>
            </div>
            {meseAperto===m.mese&&(
              <div style={{padding:'8px 20px 12px',background:'rgba(99,102,241,0.02)'}}>
                {chiusure.filter(c=>c.mese===m.mese).sort((a,b)=>b.data.localeCompare(a.data)).map(c=>{
                  const totInc=nv(c.contanti)+nv(c.pos)+nv(c.satispay)+nv(c.assegni)+nv(c.bonifico)+nv(c.compass)+nv(c.stripe)+nv(c.enwon_pay);
                  return(
                    <div key={c.data} style={{display:'flex',gap:14,padding:'7px 10px',background:'rgba(255,255,255,0.02)',borderRadius:8,fontSize:12,alignItems:'center',marginBottom:4}}>
                      <span style={{color:'#64748b',minWidth:80}}>{c.data.split('-').reverse().join('/')}</span>
                      <span style={{color:'#a5b4fc'}}>Fisc: {fmtE(c.chiusura_fiscale)}</span>
                      <span style={{color:'#22c55e',fontWeight:600}}>Inc: {fmtE(totInc)}</span>
                      {nv(c.contanti)>0&&<span style={{color:'#f59e0b'}}>Cash: {fmtE(c.contanti)}</span>}
                      {nv(c.acquisto_privati)>0&&<span style={{color:'#ef4444'}}>Acq.priv: {fmtE(c.acquisto_privati)}</span>}
                      {nv(c.note_credito)>0&&<span style={{color:'#ef4444'}}>NC: {fmtE(c.note_credito)}</span>}
                      {c.operatore&&<span style={{color:'#475569',marginLeft:'auto'}}>{c.operatore}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {sommario.length===0&&<div style={{textAlign:'center',padding:'48px',color:'#64748b'}}>Nessuna chiusura per il {anno}.</div>}
      </div>
    </div>
  );
}

export default function Cassa({ showToast }) {
  const [tab, setTab] = useState('wizard');
  const toast = showToast || ((m,t)=>console.log(t,m));
  const TABS = [{key:'wizard',label:'📋 Inserimento guidato'},{key:'riepilogo',label:'📊 Riepilogo contabile'},{key:'storico',label:'📁 Storico'}];
  return (
    <div style={{padding:'24px 28px',maxWidth:1200,margin:'0 auto'}}>
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <h2 style={{margin:0,fontSize:22,fontWeight:700,color:'#e2e8f0'}}>💰 Chiusura Cassa</h2>
          <div style={{padding:'3px 10px',borderRadius:20,background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.3)',fontSize:11,fontWeight:700,color:'#a5b4fc'}}>AMMINISTRAZIONE</div>
        </div>
        <p style={{margin:0,color:'#64748b',fontSize:13}}>Chiusura giornaliera · Riepilogo IVA · Contante da versare · Bonifici agenzie</p>
      </div>
      <div style={{display:'flex',gap:0,marginBottom:28,borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        {TABS.map(t=><button key={t.key} onClick={()=>setTab(t.key)} style={{padding:'10px 22px',background:'none',border:'none',cursor:'pointer',color:tab===t.key?'#a5b4fc':'#64748b',borderBottom:tab===t.key?'2px solid #6366f1':'2px solid transparent',fontSize:14,fontWeight:tab===t.key?600:400,marginBottom:-1}}>{t.label}</button>)}
      </div>
      {tab==='wizard'&&<WizardChiusura showToast={toast} onComplete={()=>setTab('riepilogo')}/>}
      {tab==='riepilogo'&&<TabRiepilogo showToast={toast}/>}
      {tab==='storico'&&<TabStorico/>}
    </div>
  );
}
