// pages/Cassa.jsx — Chiusura Cassa · Wizard conversazionale
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
  {key:'fc_100',label:'€ 100'},{key:'fc_50',label:'€ 50'},{key:'fc_20',label:'€ 20'},{key:'fc_10',label:'€ 10'},
  {key:'fc_5',label:'€ 5'},{key:'fc_2',label:'€ 2'},{key:'fc_1',label:'€ 1'},{key:'fc_050',label:'50ct',val:0.5},
  {key:'fc_020',label:'20ct',val:0.2},{key:'fc_010',label:'10ct',val:0.1},{key:'fc_005',label:'5ct',val:0.05},
  {key:'fc_002',label:'2ct',val:0.02},{key:'fc_001',label:'1ct',val:0.01},
].map(t => ({...t, val: t.val ?? parseInt(t.label.replace(/[^0-9]/g,''))}));

const EMPTY = () => ({
  data: new Date().toISOString().slice(0,10),
  chiusura_fiscale:'', fatturato:'', fatturato_art36:'',
  contanti:'', pos:'', satispay:'', assegni:'', bonifico:'', compass:'', stripe:'', enwon_pay:'',
  note_credito:'',
  uscite_contante:'', uscite_bonifico:'', uscite_pos:'',
  destinazione_contante:'',
  fondo_cassa: {},
  operatore:'', note:'',
});

// ── UI atoms ──────────────────────────────────────────────────────────────────
const Card = ({children}) => (
  <div style={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:14,padding:'28px 32px',marginBottom:8}}>
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
const BtnP = ({onClick,children,disabled}) => (
  <button onClick={onClick} disabled={!!disabled}
    style={{background:disabled?'#334155':'#3b82f6',color:'#fff',border:'none',borderRadius:8,padding:'10px 22px',fontWeight:600,fontSize:14,cursor:disabled?'default':'pointer'}}>
    {children}
  </button>
);
const BtnS = ({onClick,children}) => (
  <button onClick={onClick}
    style={{background:'transparent',color:'#64748b',border:'1px solid #334155',borderRadius:8,padding:'10px 18px',fontWeight:500,fontSize:14,cursor:'pointer'}}>
    {children}
  </button>
);
const Euro = ({label,val,onChange}) => (
  <div>
    {label && <div style={{color:'#94a3b8',fontSize:11,marginBottom:5,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div>}
    <div style={{display:'flex',alignItems:'center',background:'#1e293b',border:'1px solid #334155',borderRadius:8,padding:'8px 12px'}}>
      <span style={{color:'#64748b',marginRight:6}}>€</span>
      <input type="number" min="0" step="0.01" placeholder="0,00" value={val||''}
        onChange={e=>onChange(e.target.value)}
        style={{flex:1,background:'transparent',border:'none',color:'#f1f5f9',fontSize:16,outline:'none'}} />
    </div>
  </div>
);
const Barra = ({step,total}) => (
  <div style={{marginBottom:20}}>
    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
      <span style={{color:'#64748b',fontSize:12}}>Passo {step+1} di {total}</span>
      <span style={{color:'#3b82f6',fontSize:12,fontWeight:600}}>{Math.round((step/Math.max(total-1,1))*100)}%</span>
    </div>
    <div style={{height:4,background:'#1e293b',borderRadius:2}}>
      <div style={{height:4,background:'#3b82f6',borderRadius:2,width:Math.round((step/Math.max(total-1,1))*100)+'%',transition:'width 0.3s'}} />
    </div>
  </div>
);

// ── Wizard ────────────────────────────────────────────────────────────────────
function WizardChiusura({ form, setForm, onSalva, saving }) {
  const [step, setStep] = useState(0);
  const TOTAL = 12;
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const av = () => setStep(s => s+1);
  const in_ = () => setStep(s => s-1);

  const totV = nv(form.chiusura_fiscale)+nv(form.fatturato)+nv(form.fatturato_art36);
  const totI = nv(form.contanti)+nv(form.pos)+nv(form.satispay)+nv(form.bonifico)+nv(form.assegni)+nv(form.compass)+nv(form.stripe)+nv(form.enwon_pay)-nv(form.note_credito);
  const totU = nv(form.uscite_contante)+nv(form.uscite_bonifico)+nv(form.uscite_pos);
  const totF = TAGLIE_FC.reduce((s,t)=>s+(nv(form.fondo_cassa[t.key])||0)*t.val,0);
  const cdv  = Math.max(0, nv(form.contanti)-nv(form.uscite_contante)-totF);
  const diff = totI-totV;

  const d = new Date(form.data+'T12:00:00');
  const dataStr = d.getDate().toString().padStart(2,'0')+' '+MESI[d.getMonth()]+' '+d.getFullYear();

  const RR = ({label,val,color,bold}) => (
    <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #1e293b'}}>
      <span style={{color:'#94a3b8',fontSize:13}}>{label}</span>
      <span style={{color:color||'#f1f5f9',fontWeight:bold?700:400,fontSize:13}}>{fmtE(val)}</span>
    </div>
  );

  let body;
  if (step===0) {
    body = (
      <Card>
        <Domanda>Vuoi inserire la chiusura cassa per il <b style={{color:'#60a5fa'}}>{dataStr}</b>?</Domanda>
        <Hint>Se la data è corretta procedi. Altrimenti modificala qui sotto prima di continuare.</Hint>
        <div style={{marginBottom:20}}>
          <div style={{color:'#94a3b8',fontSize:11,marginBottom:5,textTransform:'uppercase',letterSpacing:0.5}}>Data chiusura</div>
          <input type="date" value={form.data} onChange={e=>set('data',e.target.value)}
            style={{background:'#1e293b',border:'1px solid #334155',borderRadius:8,padding:'10px 14px',color:'#f1f5f9',fontSize:14}} />
        </div>
        <BtnRow><BtnP onClick={av}>✅ Sì, procedo →</BtnP></BtnRow>
      </Card>
    );
  } else if (step===1) {
    body = (
      <Card>
        <Domanda>Inserisci la <b>chiusura fiscale</b> riportata sullo scontrino Z del registratore di cassa.</Domanda>
        <Hint>È il totale giornaliero stampato dal registratore fiscale a fine giornata (scontrino di chiusura Z). Se non hai emesso scontrini oggi, inserisci 0.</Hint>
        <Euro label="Chiusura fiscale (scontrini)" val={form.chiusura_fiscale} onChange={v=>set('chiusura_fiscale',v)} />
        <BtnRow><BtnS onClick={in_}>← Indietro</BtnS><BtnP onClick={av}>Avanti →</BtnP></BtnRow>
      </Card>
    );
  } else if (step===2) {
    body = (
      <Card>
        <Domanda>Inserisci il <b>totale fatturato della giornata</b> — solo fatture emesse, escluso Art. 36.</Domanda>
        <Hint>Somma gli importi di tutte le fatture emesse oggi (IVA inclusa). Non includere le vendite Art. 36, quelle vanno nel passo successivo. Se non hai emesso fatture, inserisci 0.</Hint>
        <Euro label="Fatturato (fatture, no Art. 36)" val={form.fatturato} onChange={v=>set('fatturato',v)} />
        <BtnRow><BtnS onClick={in_}>← Indietro</BtnS><BtnP onClick={av}>Avanti →</BtnP></BtnRow>
      </Card>
    );
  } else if (step===3) {
    body = (
      <Card>
        <Domanda>Inserisci il <b>totale vendite Art. 36</b> della giornata.</Domanda>
        <Hint>Sono le vendite di dispositivi usati acquistati da privati. L'IVA si calcola solo sul margine (prezzo di vendita meno costo di acquisto). Se non ne hai fatte oggi, inserisci 0.</Hint>
        <Euro label="Vendite Art. 36 (usato da privati)" val={form.fatturato_art36} onChange={v=>set('fatturato_art36',v)} />
        <BtnRow><BtnS onClick={in_}>← Indietro</BtnS><BtnP onClick={av}>Avanti →</BtnP></BtnRow>
      </Card>
    );
  } else if (step===4) {
    body = (
      <Card>
        <Domanda>Quanti <b>contanti</b> hai incassato oggi?</Domanda>
        <Hint>Inserisci il totale del denaro fisico ricevuto dai clienti durante la giornata. Se non hai incassato nulla in contanti, inserisci 0.</Hint>
        <Euro label="Contanti" val={form.contanti} onChange={v=>set('contanti',v)} />
        <BtnRow><BtnS onClick={in_}>← Indietro</BtnS><BtnP onClick={av}>Avanti →</BtnP></BtnRow>
      </Card>
    );
  } else if (step===5) {
    body = (
      <Card>
        <Domanda>Quanti incassi tramite <b>POS / Carte</b> hai avuto oggi?</Domanda>
        <Hint>Guarda il totale giornaliero sul terminale POS. Se non hai avuto pagamenti con carta, inserisci 0.</Hint>
        <Euro label="POS / Carte" val={form.pos} onChange={v=>set('pos',v)} />
        <BtnRow><BtnS onClick={in_}>← Indietro</BtnS><BtnP onClick={av}>Avanti →</BtnP></BtnRow>
      </Card>
    );
  } else if (step===6) {
    body = (
      <Card>
        <Domanda>Hai incassato tramite <b>altri metodi</b> di pagamento oggi?</Domanda>
        <Hint>Compila solo i metodi che hai usato. Lascia a 0 quelli non utilizzati.</Hint>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Euro label="Satispay" val={form.satispay} onChange={v=>set('satispay',v)} />
          <Euro label="Bonifico" val={form.bonifico} onChange={v=>set('bonifico',v)} />
          <Euro label="Assegni" val={form.assegni} onChange={v=>set('assegni',v)} />
          <Euro label="Compass (Agenzia)" val={form.compass} onChange={v=>set('compass',v)} />
          <Euro label="Stripe (Online)" val={form.stripe} onChange={v=>set('stripe',v)} />
          <Euro label="Enwon Pay" val={form.enwon_pay} onChange={v=>set('enwon_pay',v)} />
        </div>
        <BtnRow><BtnS onClick={in_}>← Indietro</BtnS><BtnP onClick={av}>Avanti →</BtnP></BtnRow>
      </Card>
    );
  } else if (step===7) {
    body = (
      <Card>
        <Domanda>Hai emesso <b>note di credito o resi</b> oggi?</Domanda>
        <Hint>Inserisci il totale dei rimborsi o resi effettuati — verrà sottratto dal totale incassato. Se non ce ne sono, inserisci 0 e vai avanti.</Hint>
        <Euro label="Note credito / Resi (sottratti)" val={form.note_credito} onChange={v=>set('note_credito',v)} />
        <BtnRow><BtnS onClick={in_}>← Indietro</BtnS><BtnP onClick={av}>Avanti →</BtnP></BtnRow>
      </Card>
    );
  } else if (step===8) {
    body = (
      <Card>
        <Domanda>Hai fatto <b>uscite di cassa</b> oggi?</Domanda>
        <Hint>Sono le spese pagate dal fondo cassa: acquisto ricambi, pagamento fornitore, acquisto dispositivo da privato, spese varie. Indica l'importo per tipo. Se non ce ne sono, lascia tutto a 0.</Hint>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          <Euro label="Uscite contante" val={form.uscite_contante} onChange={v=>set('uscite_contante',v)} />
          <Euro label="Uscite bonifico" val={form.uscite_bonifico} onChange={v=>set('uscite_bonifico',v)} />
          <Euro label="Uscite POS" val={form.uscite_pos} onChange={v=>set('uscite_pos',v)} />
        </div>
        <BtnRow><BtnS onClick={in_}>← Indietro</BtnS><BtnP onClick={av}>Avanti →</BtnP></BtnRow>
      </Card>
    );
  } else if (step===9) {
    body = (
      <Card>
        <Domanda>Conta le <b>banconote e monete</b> nel cassetto e inserisci quante ne hai per ogni taglio.</Domanda>
        <Hint>Esempio: se hai 3 banconote da €50, scrivi "3" nella casella €50. Il totale viene calcolato automaticamente.</Hint>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>
          {TAGLIE_FC.map(t=>(
            <div key={t.key} style={{background:'#1e293b',borderRadius:8,padding:'8px 10px'}}>
              <div style={{color:'#64748b',fontSize:11,marginBottom:4}}>{t.label}</div>
              <input type="number" min="0" placeholder="0" value={form.fondo_cassa[t.key]||''}
                onChange={e=>set('fondo_cassa',{...form.fondo_cassa,[t.key]:e.target.value})}
                style={{width:'100%',background:'transparent',border:'none',color:'#f1f5f9',fontSize:16,fontWeight:700,outline:'none'}} />
            </div>
          ))}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'#111827',borderRadius:8,marginBottom:8}}>
          <span style={{color:'#94a3b8',fontSize:13}}>Totale fondo cassa</span>
          <span style={{color:'#22c55e',fontWeight:700,fontSize:16}}>{fmtE(totF)}</span>
        </div>
        <BtnRow><BtnS onClick={in_}>← Indietro</BtnS><BtnP onClick={av}>Avanti →</BtnP></BtnRow>
      </Card>
    );
  } else if (step===10) {
    body = (
      <Card>
        <Domanda>Chi ha fatto la <b>chiusura cassa</b> oggi?</Domanda>
        <Hint>Inserisci il nome dell'operatore. Le note sono opzionali — usale per segnalare anomalie o differenze di cassa.</Hint>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div>
            <div style={{color:'#94a3b8',fontSize:11,marginBottom:5,textTransform:'uppercase',letterSpacing:0.5}}>Operatore</div>
            <input placeholder="Il tuo nome" value={form.operatore} onChange={e=>set('operatore',e.target.value)}
              style={{width:'100%',background:'#1e293b',border:'1px solid #334155',borderRadius:8,padding:'10px 14px',color:'#f1f5f9',fontSize:14,boxSizing:'border-box'}} />
          </div>
          <div>
            <div style={{color:'#94a3b8',fontSize:11,marginBottom:5,textTransform:'uppercase',letterSpacing:0.5}}>Note (opzionale)</div>
            <textarea placeholder="Anomalie, differenze di cassa, memo..." value={form.note} onChange={e=>set('note',e.target.value)} rows={3}
              style={{width:'100%',background:'#1e293b',border:'1px solid #334155',borderRadius:8,padding:'10px 14px',color:'#f1f5f9',fontSize:14,boxSizing:'border-box',resize:'vertical'}} />
          </div>
        </div>
        <BtnRow><BtnS onClick={in_}>← Indietro</BtnS><BtnP onClick={av}>Vai al riepilogo →</BtnP></BtnRow>
      </Card>
    );
  } else {
    body = (
      <Card>
        <Domanda>📋 Riepilogo — tutto corretto?</Domanda>
        <Hint>Controlla i dati prima di salvare. Puoi tornare indietro per modificare qualsiasi campo.</Hint>
        {msg && !msg.ok && (
          <div style={{padding:'10px 14px',borderRadius:8,marginBottom:16,
            background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.3)',
            color:'#fca5a5',fontSize:13,fontWeight:500}}>
            {msg.text}
          </div>
        )}
        <div style={{marginBottom:14}}>
          <div style={{color:'#64748b',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Vendite</div>
          <RR label="Chiusura fiscale (scontrini)" val={nv(form.chiusura_fiscale)} />
          <RR label="Fatturato (fatture, no Art.36)" val={nv(form.fatturato)} />
          <RR label="Vendite Art. 36" val={nv(form.fatturato_art36)} />
          <RR label="Totale vendite" val={totV} bold />
        </div>
        <div style={{marginBottom:14}}>
          <div style={{color:'#64748b',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Incassi</div>
          <RR label="Contanti" val={nv(form.contanti)} />
          <RR label="POS / Carte" val={nv(form.pos)} />
          {nv(form.satispay)>0 && <RR label="Satispay" val={nv(form.satispay)} />}
          {nv(form.bonifico)>0 && <RR label="Bonifico" val={nv(form.bonifico)} />}
          {nv(form.assegni)>0 && <RR label="Assegni" val={nv(form.assegni)} />}
          {nv(form.compass)>0 && <RR label="Compass" val={nv(form.compass)} />}
          {nv(form.stripe)>0 && <RR label="Stripe" val={nv(form.stripe)} />}
          {nv(form.enwon_pay)>0 && <RR label="Enwon Pay" val={nv(form.enwon_pay)} />}
          {nv(form.note_credito)>0 && <RR label="Note credito / Resi" val={-nv(form.note_credito)} color="#f87171" />}
          <RR label="Totale incassato" val={totI} bold />
          <div style={{marginTop:8,padding:'8px 12px',borderRadius:8,
            background:Math.abs(diff)<0.01?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',
            color:Math.abs(diff)<0.01?'#22c55e':'#ef4444',fontSize:13,fontWeight:600}}>
            {Math.abs(diff)<0.01?'✅ Incassi e vendite coincidono':(diff>0?'⚠️ Incassi superiori di ':'⚠️ Incassi inferiori di ')+fmtE(Math.abs(diff))}
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{color:'#64748b',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Uscite e fondo cassa</div>
          {totU>0 && <RR label="Uscite totali" val={totU} color="#f87171" />}
          <RR label="Fondo cassa contato" val={totF} />
          <RR label="Contante da versare" val={cdv} color="#22c55e" bold />
        </div>
        {form.operatore && <div style={{color:'#64748b',fontSize:13,marginBottom:4}}>Operatore: <b style={{color:'#f1f5f9'}}>{form.operatore}</b></div>}
        {form.note && <div style={{color:'#64748b',fontSize:13,marginBottom:12}}>Note: <span style={{color:'#f1f5f9'}}>{form.note}</span></div>}
        
        {(() => {
          const avvisi = [];
          if(Math.abs(diff)>0.01) avvisi.push({tipo:'errore', testo: diff>0 ? `⚠️ Gli incassi superano le vendite di ${fmtE(Math.abs(diff))} — verifica i metodi di pagamento.` : `⚠️ Gli incassi sono inferiori alle vendite di ${fmtE(Math.abs(diff))} — manca qualcosa nei metodi di pagamento?`});
          if(totF<50) avvisi.push({tipo:'warning', testo:`⚠️ Fondo cassa molto basso (${fmtE(totF)}) — hai contato tutte le banconote?`});
          if(!form.operatore.trim()) avvisi.push({tipo:'warning', testo:'⚠️ Nessun operatore indicato — torna indietro e inserisci il tuo nome.'});
          if(avvisi.length===0) return null;
          return (
            <div style={{marginBottom:16}}>
              {avvisi.map((a,i)=>(
                <div key={i} style={{padding:'10px 14px',borderRadius:8,marginBottom:8,
                  background: a.tipo==='errore' ? 'rgba(239,68,68,0.12)' : 'rgba(234,179,8,0.1)',
                  border: `1px solid ${a.tipo==='errore' ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'}`,
                  color: a.tipo==='errore' ? '#fca5a5' : '#fde68a',
                  fontSize:13, lineHeight:1.5}}>
                  {a.testo}
                </div>
              ))}
            </div>
          );
        })()}
        <BtnRow>
          <BtnS onClick={in_}>← Modifica</BtnS>
          <BtnP onClick={onSalva} disabled={saving}>{saving?'⏳ Salvataggio...':'💾 Salva chiusura'}</BtnP>
        </BtnRow>
      </Card>
    );
  }

  return (
    <div style={{maxWidth:640,margin:'0 auto'}}>
      <Barra step={step} total={TOTAL} />
      {body}
    </div>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────
export default function Cassa() {
  const [tab, setTab] = useState('wizard');
  const [form, setForm] = useState(EMPTY());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [storico, setStorico] = useState([]);
  const [loadingStorico, setLoadingStorico] = useState(false);

  const caricaStorico = useCallback(async () => {
    setLoadingStorico(true);
    try {
      const r = await fetch(`${API}/api/cassa`);
      const d = await r.json();
      setStorico(Array.isArray(d) ? d : []);
    } catch(e) { setStorico([]); }
    setLoadingStorico(false);
  }, []);

  useEffect(() => { if(tab==='storico') caricaStorico(); }, [tab, caricaStorico]);

  const salva = async () => {
    setSaving(true); setMsg(null);
    try {
      const r = await fetch(`${API}/api/cassa`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if(r.ok) {
        setMsg({ok:true, text:'✅ Chiusura salvata correttamente!'});
        setForm(EMPTY());
        setTab('storico');
      } else {
        const errMsg = r.status === 409
          ? '❌ Esiste già una chiusura per questa data. Torna al passo 1 e modifica la data.'
          : '❌ ' + (d.error || 'Errore durante il salvataggio. Riprova.');
        setMsg({ok:false, text: errMsg});
      }
    } catch(e) {
      setMsg({ok:false, text:'❌ Errore di rete: '+e.message});
    }
    setSaving(false);
  };

  const TAB_STYLE = (active) => ({
    padding:'8px 20px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:500, fontSize:13,
    background: active ? '#3b82f6' : 'transparent',
    color: active ? '#fff' : '#64748b',
  });

  return (
    <div style={{padding:'24px 32px', minHeight:'100vh', background:'#0a0f1e', color:'#f1f5f9'}}>
      {/* Header */}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <span style={{fontSize:24}}>💰</span>
          <h1 style={{margin:0,fontSize:22,fontWeight:700}}>Chiusura Cassa</h1>
        </div>
        <p style={{margin:0,color:'#64748b',fontSize:13}}>Chiusura giornaliera · Riepilogo IVA · Contante da versare</p>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:6,marginBottom:28,background:'#111827',borderRadius:10,padding:4,width:'fit-content'}}>
        <button style={TAB_STYLE(tab==='wizard')} onClick={()=>setTab('wizard')}>📝 Inserimento guidato</button>
        <button style={TAB_STYLE(tab==='storico')} onClick={()=>setTab('storico')}>📋 Storico</button>
      </div>

      {/* Messaggio */}
      {msg && (
        <div style={{padding:'12px 16px',borderRadius:8,marginBottom:20,
          background:msg.ok?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',
          color:msg.ok?'#22c55e':'#ef4444',fontSize:14,fontWeight:500}}>
          {msg.text}
        </div>
      )}

      {/* Wizard */}
      {tab==='wizard' && (
        <WizardChiusura form={form} setForm={setForm} onSalva={salva} saving={saving} />
      )}

      {/* Storico */}
      {tab==='storico' && (
        <div>
          {loadingStorico ? (
            <p style={{color:'#64748b'}}>Caricamento...</p>
          ) : storico.length===0 ? (
            <p style={{color:'#64748b'}}>Nessuna chiusura registrata.</p>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {storico.map((s,i)=>(
                <div key={i} style={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:10,padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:600,marginBottom:2}}>{s.data}</div>
                    <div style={{color:'#64748b',fontSize:12}}>{s.operatore || 'N/D'}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{color:'#22c55e',fontWeight:700,fontSize:15}}>{fmtE(nv(s.chiusura_fiscale)+nv(s.fatturato)+nv(s.fatturato_art36))}</div>
                    <div style={{color:'#64748b',fontSize:12}}>Totale vendite</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
