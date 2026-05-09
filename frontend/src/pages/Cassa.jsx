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

// ─── WIZARD CONVERSAZIONALE ────────────────────────────────────────────────

const DOMANDE = [
  // 0 - Conferma data
  ({ form, set, avanti, MESI }) => {
    const d = new Date(form.data);
    const giorno = d.getDate().toString().padStart(2,'0');
    const mese = MESI[d.getMonth()];
    const anno = d.getFullYear();
    return (
      <Card>
        <Domanda>Vuoi inserire la chiusura cassa per il <b>{giorno} {mese} {anno}</b>?</Domanda>
        <Hint>Se è la data di oggi puoi procedere. Altrimenti modifica la data qui sotto.</Hint>
        <div style={{display:'flex', gap:10, marginBottom:16}}>
          <input type="date" value={form.data} onChange={e=>set('data',e.target.value)}
            style={{background:'#1e293b',border:'1px solid #334155',borderRadius:8,padding:'8px 12px',color:'#f1f5f9',fontSize:14}} />
        </div>
        <BtnRow>
          <BtnSi onClick={avanti}>✅ Sì, procedo</BtnSi>
        </BtnRow>
      </Card>
    );
  },
  // 1 - Chiusura fiscale
  ({ form, set, avanti, indietro }) => (
    <Card>
      <Domanda>Inserisci la <b>chiusura fiscale</b> riportata sullo scontrino di chiusura del registratore di cassa.</Domanda>
      <Hint>È il totale giornaliero stampato dal registratore fiscale a fine giornata. Se non hai emesso scontrini oggi, inserisci 0.</Hint>
      <CampoEuro label="Chiusura fiscale (scontrini)" valore={form.chiusura_fiscale} onChange={v=>set('chiusura_fiscale',v)} />
      <BtnRow>
        <BtnNo onClick={indietro}>← Indietro</BtnNo>
        <BtnSi onClick={avanti}>Avanti →</BtnSi>
      </BtnRow>
    </Card>
  ),
  // 2 - Fatturato (no art.36)
  ({ form, set, avanti, indietro }) => (
    <Card>
      <Domanda>Inserisci il <b>totale fatturato della giornata</b> (fatture emesse, escluso Art. 36).</Domanda>
      <Hint>Somma gli importi di tutte le fatture emesse oggi, IVA inclusa. Non includere le vendite Art. 36 — quelle vanno nel campo successivo. Se non hai emesso fatture, inserisci 0.</Hint>
      <CampoEuro label="Fatturato (fatture, no Art. 36)" valore={form.fatturato} onChange={v=>set('fatturato',v)} />
      <BtnRow>
        <BtnNo onClick={indietro}>← Indietro</BtnNo>
        <BtnSi onClick={avanti}>Avanti →</BtnSi>
      </BtnRow>
    </Card>
  ),
  // 3 - Fatturato art.36
  ({ form, set, avanti, indietro }) => (
    <Card>
      <Domanda>Inserisci il <b>totale vendite Art. 36</b> della giornata.</Domanda>
      <Hint>Sono le vendite di dispositivi usati acquistati da privati. L'IVA viene calcolata solo sul margine (prezzo vendita meno costo acquisto). Se non ne hai fatte, inserisci 0.</Hint>
      <CampoEuro label="Vendite Art. 36 (usato da privati)" valore={form.fatturato_art36} onChange={v=>set('fatturato_art36',v)} />
      <BtnRow>
        <BtnNo onClick={indietro}>← Indietro</BtnNo>
        <BtnSi onClick={avanti}>Avanti →</BtnSi>
      </BtnRow>
    </Card>
  ),
  // 4 - Contanti
  ({ form, set, avanti, indietro }) => (
    <Card>
      <Domanda>Quanti <b>contanti</b> hai incassato oggi?</Domanda>
      <Hint>Inserisci il totale del denaro fisico ricevuto dai clienti durante la giornata.</Hint>
      <CampoEuro label="Contanti" valore={form.contanti} onChange={v=>set('contanti',v)} />
      <BtnRow>
        <BtnNo onClick={indietro}>← Indietro</BtnNo>
        <BtnSi onClick={avanti}>Avanti →</BtnSi>
      </BtnRow>
    </Card>
  ),
  // 5 - POS / Carte
  ({ form, set, avanti, indietro }) => (
    <Card>
      <Domanda>Quanti incassi tramite <b>POS / Carte</b> di credito o debito hai avuto oggi?</Domanda>
      <Hint>Guarda il totale giornaliero sul tuo terminale POS. Se non hai avuto pagamenti con carta, inserisci 0.</Hint>
      <CampoEuro label="POS / Carte" valore={form.pos} onChange={v=>set('pos',v)} />
      <BtnRow>
        <BtnNo onClick={indietro}>← Indietro</BtnNo>
        <BtnSi onClick={avanti}>Avanti →</BtnSi>
      </BtnRow>
    </Card>
  ),
  // 6 - Altri metodi
  ({ form, set, avanti, indietro }) => (
    <Card>
      <Domanda>Hai incassato tramite altri metodi di pagamento oggi?</Domanda>
      <Hint>Compila solo i campi relativi ai metodi che hai usato. Lascia a 0 quelli non utilizzati.</Hint>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <CampoEuro label="Satispay" valore={form.satispay} onChange={v=>set('satispay',v)} />
        <CampoEuro label="Bonifico" valore={form.bonifico} onChange={v=>set('bonifico',v)} />
        <CampoEuro label="Assegni" valore={form.assegni} onChange={v=>set('assegni',v)} />
        <CampoEuro label="Compass (Agenzia)" valore={form.compass} onChange={v=>set('compass',v)} />
        <CampoEuro label="Stripe (Online)" valore={form.stripe} onChange={v=>set('stripe',v)} />
        <CampoEuro label="Enwon Pay" valore={form.enwon_pay} onChange={v=>set('enwon_pay',v)} />
      </div>
      <BtnRow>
        <BtnNo onClick={indietro}>← Indietro</BtnNo>
        <BtnSi onClick={avanti}>Avanti →</BtnSi>
      </BtnRow>
    </Card>
  ),
  // 7 - Note credito / resi
  ({ form, set, avanti, indietro }) => (
    <Card>
      <Domanda>Hai emesso <b>note di credito o resi</b> oggi?</Domanda>
      <Hint>Inserisci il totale dei rimborsi o resi effettuati. Questo importo verrà sottratto dal totale incassato. Se non ce ne sono, inserisci 0 e prosegui.</Hint>
      <CampoEuro label="Note credito / Resi (sottratti)" valore={form.note_credito} onChange={v=>set('note_credito',v)} />
      <BtnRow>
        <BtnNo onClick={indietro}>← Indietro</BtnNo>
        <BtnSi onClick={avanti}>Avanti →</BtnSi>
      </BtnRow>
    </Card>
  ),
  // 8 - Uscite di cassa
  ({ form, set, avanti, indietro }) => (
    <Card>
      <Domanda>Hai fatto <b>uscite di cassa</b> oggi?</Domanda>
      <Hint>Sono le spese pagate dal fondo cassa: acquisto ricambi, pagamento fornitore, acquisto dispositivo da privato, spese varie. Indica l'importo per tipo di pagamento usato.</Hint>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
        <CampoEuro label="Uscite contante" valore={form.uscite_contante} onChange={v=>set('uscite_contante',v)} />
        <CampoEuro label="Uscite bonifico" valore={form.uscite_bonifico} onChange={v=>set('uscite_bonifico',v)} />
        <CampoEuro label="Uscite POS" valore={form.uscite_pos} onChange={v=>set('uscite_pos',v)} />
      </div>
      <BtnRow>
        <BtnNo onClick={indietro}>← Indietro</BtnNo>
        <BtnSi onClick={avanti}>Avanti →</BtnSi>
      </BtnRow>
    </Card>
  ),
  // 9 - Fondo cassa banconote
  ({ form, set, avanti, indietro, TAGLIE_FC, nv, fmt }) => {
    const totFondo = TAGLIE_FC.reduce((s,t) => s + (nv(form.fondo_cassa[t.key])||0)*t.val, 0);
    return (
      <Card>
        <Domanda>Conta le <b>banconote e monete</b> nel cassetto della cassa e inserisci quante ne hai per ogni taglio.</Domanda>
        <Hint>Esempio: se hai 3 banconote da €50, scrivi "3" nella casella €50. Il totale viene calcolato automaticamente.</Hint>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>
          {TAGLIE_FC.map(t => (
            <div key={t.key} style={{background:'#1e293b',borderRadius:8,padding:'8px 10px'}}>
              <div style={{color:'#64748b',fontSize:11,marginBottom:4}}>{t.label}</div>
              <input type="number" min="0" placeholder="0"
                value={form.fondo_cassa[t.key]||''}
                onChange={e=>set('fondo_cassa',{...form.fondo_cassa,[t.key]:e.target.value})}
                style={{width:'100%',background:'transparent',border:'none',color:'#f1f5f9',fontSize:16,fontWeight:700,outline:'none'}} />
            </div>
          ))}
        </div>
        <div style={{background:'#0f172a',borderRadius:8,padding:'10px 14px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{color:'#94a3b8',fontSize:13}}>Totale fondo cassa</span>
          <span style={{color:'#22c55e',fontWeight:700,fontSize:18}}>{fmt(totFondo)}</span>
        </div>
        <BtnRow>
          <BtnNo onClick={indietro}>← Indietro</BtnNo>
          <BtnSi onClick={avanti}>Avanti →</BtnSi>
        </BtnRow>
      </Card>
    );
  },
  // 10 - Operatore e note
  ({ form, set, avanti, indietro }) => (
    <Card>
      <Domanda>Chi ha fatto la chiusura cassa oggi?</Domanda>
      <Hint>Inserisci il tuo nome o il nome dell'operatore che ha compilato questa chiusura. Le note sono opzionali — usale per segnalare anomalie, differenze di cassa o qualsiasi cosa da ricordare.</Hint>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div>
          <div style={{color:'#94a3b8',fontSize:12,marginBottom:6}}>OPERATORE</div>
          <input placeholder="Nome operatore" value={form.operatore}
            onChange={e=>set('operatore',e.target.value)}
            style={{width:'100%',background:'#1e293b',border:'1px solid #334155',borderRadius:8,padding:'10px 14px',color:'#f1f5f9',fontSize:14,boxSizing:'border-box'}} />
        </div>
        <div>
          <div style={{color:'#94a3b8',fontSize:12,marginBottom:6}}>NOTE (opzionale)</div>
          <textarea placeholder="Anomalie, differenze, memo..." value={form.note}
            onChange={e=>set('note',e.target.value)} rows={3}
            style={{width:'100%',background:'#1e293b',border:'1px solid #334155',borderRadius:8,padding:'10px 14px',color:'#f1f5f9',fontSize:14,boxSizing:'border-box',resize:'vertical'}} />
        </div>
      </div>
      <BtnRow>
        <BtnNo onClick={indietro}>← Indietro</BtnNo>
        <BtnSi onClick={avanti}>Vai al riepilogo →</BtnSi>
      </BtnRow>
    </Card>
  ),
];

// Sotto-componenti UI
const Card = ({children}) => (
  <div style={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:14,padding:'28px 32px',maxWidth:640,margin:'0 auto'}}>
    {children}
  </div>
);
const Domanda = ({children}) => (
  <div style={{color:'#f1f5f9',fontSize:17,fontWeight:600,marginBottom:10,lineHeight:1.5}}>{children}</div>
);
const Hint = ({children}) => (
  <div style={{color:'#64748b',fontSize:13,marginBottom:20,lineHeight:1.6,background:'rgba(148,163,184,0.06)',borderLeft:'3px solid #334155',padding:'8px 12px',borderRadius:'0 6px 6px 0'}}>{children}</div>
);
const BtnRow = ({children}) => (
  <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:24}}>{children}</div>
);
const BtnSi = ({onClick,children}) => (
  <button onClick={onClick} style={{background:'#3b82f6',color:'#fff',border:'none',borderRadius:8,padding:'10px 22px',fontWeight:600,fontSize:14,cursor:'pointer'}}>{children}</button>
);
const BtnNo = ({onClick,children}) => (
  <button onClick={onClick} style={{background:'transparent',color:'#64748b',border:'1px solid #334155',borderRadius:8,padding:'10px 18px',fontWeight:500,fontSize:14,cursor:'pointer'}}>{children}</button>
);
const CampoEuro = ({label, valore, onChange}) => (
  <div>
    <div style={{color:'#94a3b8',fontSize:11,marginBottom:6,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div>
    <div style={{display:'flex',alignItems:'center',background:'#1e293b',border:'1px solid #334155',borderRadius:8,padding:'8px 12px'}}>
      <span style={{color:'#64748b',marginRight:6}}>€</span>
      <input type="number" min="0" step="0.01" placeholder="0,00"
        value={valore||''}
        onChange={e=>onChange(e.target.value)}
        style={{flex:1,background:'transparent',border:'none',color:'#f1f5f9',fontSize:16,outline:'none'}} />
    </div>
  </div>
);

// ProgressBar step
const ProgressWizard = ({step, total}) => (
  <div style={{marginBottom:24}}>
    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
      <span style={{color:'#64748b',fontSize:12}}>Domanda {step+1} di {total}</span>
      <span style={{color:'#3b82f6',fontSize:12}}>{Math.round((step/total)*100)}% completato</span>
    </div>
    <div style={{height:4,background:'#1e293b',borderRadius:2}}>
      <div style={{height:4,background:'#3b82f6',borderRadius:2,width:((step/total)*100)+'%',transition:'width 0.3s'}} />
    </div>
  </div>
);

function WizardChiusura({ form, setForm, onSalva, saving, TAGLIE_FC, nv, fmt, fmtE, MESI }) {
  const [step, setStep] = useState(0);
  const set = (k, v) => setForm(f => ({...f, [k]: v}));
  const avanti = () => setStep(s => Math.min(s+1, DOMANDE.length));
  const indietro = () => setStep(s => Math.max(s-1, 0));

  // Calcolo riepilogo
  const totVendite = nv(form.chiusura_fiscale) + nv(form.fatturato) + nv(form.fatturato_art36);
  const totIncassi = nv(form.contanti) + nv(form.pos) + nv(form.satispay) + nv(form.bonifico) + nv(form.assegni) + nv(form.compass) + nv(form.stripe) + nv(form.enwon_pay) - nv(form.note_credito);
  const totUscite = nv(form.uscite_contante) + nv(form.uscite_bonifico) + nv(form.uscite_pos);
  const totFondo = TAGLIE_FC.reduce((s,t) => s + (nv(form.fondo_cassa[t.key])||0)*t.val, 0);
  const contanteDaVersare = nv(form.contanti) - nv(form.uscite_contante) - totFondo;
  const diff = totIncassi - totVendite;

  const RigaRiepilogo = ({label, valore, color, bold}) => (
    <div style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #1e293b'}}>
      <span style={{color:'#94a3b8',fontSize:13}}>{label}</span>
      <span style={{color: color||'#f1f5f9', fontWeight: bold?700:400, fontSize:14}}>{fmtE(valore)}</span>
    </div>
  );

  // Riepilogo finale (step === DOMANDE.length)
  if (step === DOMANDE.length) {
    return (
      <div style={{maxWidth:640,margin:'0 auto'}}>
        <ProgressWizard step={DOMANDE.length} total={DOMANDE.length} />
        <Card>
          <Domanda>📋 Riepilogo chiusura — tutto ok?</Domanda>
          <Hint>Controlla i dati prima di salvare. Puoi tornare indietro per correggere qualsiasi campo.</Hint>
          <div style={{marginBottom:20}}>
            <div style={{color:'#64748b',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Vendite</div>
            <RigaRiepilogo label="Chiusura fiscale (scontrini)" valore={nv(form.chiusura_fiscale)} />
            <RigaRiepilogo label="Fatturato (fatture, no Art.36)" valore={nv(form.fatturato)} />
            <RigaRiepilogo label="Vendite Art. 36" valore={nv(form.fatturato_art36)} />
            <RigaRiepilogo label="TOTALE VENDITE" valore={totVendite} color="#f1f5f9" bold />
          </div>
          <div style={{marginBottom:20}}>
            <div style={{color:'#64748b',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Incassi</div>
            <RigaRiepilogo label="Contanti" valore={nv(form.contanti)} />
            <RigaRiepilogo label="POS / Carte" valore={nv(form.pos)} />
            {nv(form.satispay)>0 && <RigaRiepilogo label="Satispay" valore={nv(form.satispay)} />}
            {nv(form.bonifico)>0 && <RigaRiepilogo label="Bonifico" valore={nv(form.bonifico)} />}
            {nv(form.assegni)>0 && <RigaRiepilogo label="Assegni" valore={nv(form.assegni)} />}
            {nv(form.compass)>0 && <RigaRiepilogo label="Compass (Agenzia)" valore={nv(form.compass)} />}
            {nv(form.stripe)>0 && <RigaRiepilogo label="Stripe" valore={nv(form.stripe)} />}
            {nv(form.enwon_pay)>0 && <RigaRiepilogo label="Enwon Pay" valore={nv(form.enwon_pay)} />}
            {nv(form.note_credito)>0 && <RigaRiepilogo label="Note credito / Resi" valore={-nv(form.note_credito)} color="#f87171" />}
            <RigaRiepilogo label="TOTALE INCASSATO" valore={totIncassi} color="#f1f5f9" bold />
            <div style={{marginTop:8,padding:'8px 12px',borderRadius:8,background: Math.abs(diff)<0.01 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',color: Math.abs(diff)<0.01 ? '#22c55e' : '#ef4444',fontSize:13,fontWeight:600}}>
              {Math.abs(diff)<0.01 ? '✅ Incassi e vendite coincidono' : (diff>0 ? '⚠️ Incassi superiori di ' : '⚠️ Incassi inferiori di ') + fmtE(Math.abs(diff))}
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{color:'#64748b',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Uscite & Fondo</div>
            <RigaRiepilogo label="Uscite totali" valore={totUscite} color="#f87171" />
            <RigaRiepilogo label="Fondo cassa contato" valore={totFondo} />
            <RigaRiepilogo label="Contante da versare" valore={Math.max(0,contanteDaVersare)} color="#22c55e" bold />
          </div>
          {form.operatore && <div style={{color:'#64748b',fontSize:13,marginBottom:4}}>Operatore: <span style={{color:'#f1f5f9'}}>{form.operatore}</span></div>}
          {form.note && <div style={{color:'#64748b',fontSize:13,marginBottom:12}}>Note: <span style={{color:'#f1f5f9'}}>{form.note}</span></div>}
          <BtnRow>
            <BtnNo onClick={indietro}>← Modifica</BtnNo>
            <BtnSi onClick={onSalva} disabled={saving}>
              {saving ? '⏳ Salvataggio...' : '💾 Salva chiusura'}
            </BtnSi>
          </BtnRow>
        </Card>
      </div>
    );
  }

  const StepComponent = DOMANDE[step];
  return (
    <div style={{maxWidth:640,margin:'0 auto'}}>
      <ProgressWizard step={step} total={DOMANDE.length} />
      <StepComponent form={form} set={set} avanti={avanti} indietro={indietro} MESI={MESI} TAGLIE_FC={TAGLIE_FC} nv={nv} fmt={fmt} />
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
