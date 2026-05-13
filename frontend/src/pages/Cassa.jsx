// pages/Cassa.jsx — Chiusura Cassa · Wizard conversazionale + Report
import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const fmt  = n => Number(n||0).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtE = n => '€ ' + fmt(n);
const nv   = x => parseFloat(x)||0;
const IVA  = 0.22;

const TAGLIE_FC = [
  {key:'fc_100',label:'€ 100',val:100},{key:'fc_50',label:'€ 50',val:50},
  {key:'fc_20',label:'€ 20',val:20},{key:'fc_10',label:'€ 10',val:10},
  {key:'fc_5',label:'€ 5',val:5},{key:'fc_2',label:'€ 2',val:2},
  {key:'fc_1',label:'€ 1',val:1},{key:'fc_050',label:'50ct',val:0.5},
  {key:'fc_020',label:'20ct',val:0.2},{key:'fc_010',label:'10ct',val:0.1},
  {key:'fc_005',label:'5ct',val:0.05},{key:'fc_002',label:'2ct',val:0.02},
  {key:'fc_001',label:'1ct',val:0.01},
];

const EMPTY = () => ({
  data: new Date().toISOString().slice(0,10),
  chiusura_fiscale:'', fatturato:'', fatturato_art36:'',
  contanti:'', pos:'', satispay:'', assegni:'', bonifico:'', compass:'', stripe:'', enwon_pay:'',
  note_credito:'',
  uscite_contante:'', uscite_bonifico:'', uscite_pos:'',
  fondo_cassa:{},
  operatore:'', note:'',
});

// ── Atoms ─────────────────────────────────────────────────────────────────────
const Card = ({children,style}) => (<div style={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:14,padding:'28px 32px',marginBottom:8,...style}}>{children}</div>);
const Q = ({children}) => (<div style={{color:'#f1f5f9',fontSize:17,fontWeight:600,marginBottom:10,lineHeight:1.5}}>{children}</div>);
const Hint = ({children}) => (<div style={{color:'#64748b',fontSize:13,marginBottom:20,lineHeight:1.6,background:'rgba(148,163,184,0.06)',borderLeft:'3px solid #334155',padding:'8px 12px',borderRadius:'0 6px 6px 0'}}>{children}</div>);
const Errore = ({testo}) => testo ? (<div style={{padding:'12px 16px',borderRadius:8,marginTop:16,background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.35)',color:'#fca5a5',fontSize:14,fontWeight:500,lineHeight:1.5}}>⚠️ {testo}</div>) : null;
const Row = ({children}) => (<div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:24}}>{children}</div>);
const BtnP = ({onClick,children,disabled}) => (<button onClick={onClick} disabled={!!disabled} style={{background:disabled?'#334155':'#3b82f6',color:'#fff',border:'none',borderRadius:8,padding:'10px 22px',fontWeight:600,fontSize:14,cursor:disabled?'default':'pointer'}}>{children}</button>);
const BtnS = ({onClick,children}) => (<button onClick={onClick} style={{background:'transparent',color:'#64748b',border:'1px solid #334155',borderRadius:8,padding:'10px 18px',fontWeight:500,fontSize:14,cursor:'pointer'}}>{children}</button>);
const Euro = ({label,val,onChange}) => (<div>{label && <div style={{color:'#94a3b8',fontSize:11,marginBottom:5,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div>}<div style={{display:'flex',alignItems:'center',background:'#1e293b',border:'1px solid #334155',borderRadius:8,padding:'8px 12px'}}><span style={{color:'#64748b',marginRight:6}}>€</span><input type="number" min="0" step="0.01" placeholder="0,00" value={val||''} onChange={e=>onChange(e.target.value)} style={{flex:1,background:'transparent',border:'none',color:'#f1f5f9',fontSize:16,outline:'none'}} /></div></div>);
const Barra = ({step,total}) => (<div style={{marginBottom:20}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:'#64748b',fontSize:12}}>Passo {step+1} di {total}</span><span style={{color:'#3b82f6',fontSize:12,fontWeight:600}}>{Math.round((step/Math.max(total-1,1))*100)}%</span></div><div style={{height:4,background:'#1e293b',borderRadius:2}}><div style={{height:4,background:'#3b82f6',borderRadius:2,width:Math.round((step/Math.max(total-1,1))*100)+'%',transition:'width 0.3s'}} /></div></div>);
// ── Wizard ────────────────────────────────────────────────────────────────────
function WizardChiusura({ form, setForm, onSalva, saving, msg }) {
  const [step, setStep] = useState(0);
  const [errStep, setErrStep] = useState('');
  const TOTAL = 12;
  const set = (k,v) => { setForm(f => ({...f,[k]:v})); setErrStep(''); };
  const totV = nv(form.chiusura_fiscale)+nv(form.fatturato)+nv(form.fatturato_art36);
  const totI = nv(form.contanti)+nv(form.pos)+nv(form.satispay)+nv(form.bonifico)+nv(form.assegni)+nv(form.compass)+nv(form.stripe)+nv(form.enwon_pay)-nv(form.note_credito);
  const totU = nv(form.uscite_contante)+nv(form.uscite_bonifico)+nv(form.uscite_pos);
  const totF = TAGLIE_FC.reduce((s,t) => s+(nv(form.fondo_cassa[t.key])||0)*t.val, 0);
  const cdv  = Math.max(0, nv(form.contanti)-nv(form.uscite_contante)-totF);
  const diff = totI-totV;
  const avanti = () => {
    setErrStep('');
    if (step===7 && Math.abs(diff)>0.01) { setErrStep(diff>0?'Gli incassi ('+fmtE(totI)+') superano le vendite ('+fmtE(totV)+') di '+fmtE(Math.abs(diff))+'.':'Gli incassi ('+fmtE(totI)+') sono inferiori alle vendite ('+fmtE(totV)+') di '+fmtE(Math.abs(diff))+'.'); return; }
    if (step===9 && totF===0) { setErrStep('Hai inserito un fondo cassa di € 0,00. Sei sicuro? Se è corretto clicca di nuovo Avanti.'); setStep(s=>s+1); return; }
    setStep(s=>s+1);
  };
  const bk = () => { setStep(s=>s-1); setErrStep(''); };
  const d = new Date(form.data+'T12:00:00');
  const dataStr = d.getDate().toString().padStart(2,'0')+' '+MESI[d.getMonth()]+' '+d.getFullYear();
  const RR = ({label,val,color,bold}) => (<div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #1e293b'}}><span style={{color:'#94a3b8',fontSize:13}}>{label}</span><span style={{color:color||'#f1f5f9',fontWeight:bold?700:400,fontSize:13}}>{fmtE(val)}</span></div>);
  let body;
  if (step===0) { body=(<Card><Q>Vuoi inserire la chiusura cassa per il <b style={{color:'#60a5fa'}}>{dataStr}</b>?</Q><Hint>Se la data è corretta procedi. Altrimenti modificala qui sotto.</Hint><div style={{marginBottom:20}}><div style={{color:'#94a3b8',fontSize:11,marginBottom:5,textTransform:'uppercase',letterSpacing:0.5}}>Data chiusura</div><input type="date" value={form.data} onChange={e=>set('data',e.target.value)} style={{background:'#1e293b',border:'1px solid #334155',borderRadius:8,padding:'10px 14px',color:'#f1f5f9',fontSize:14}} /></div><Row><BtnP onClick={avanti}>✅ Sì, procedo →</BtnP></Row></Card>);
  } else if (step===1) { body=(<Card><Q>Inserisci la <b>chiusura fiscale</b> (scontrino Z).</Q><Hint>Il totale giornaliero del registratore fiscale. Se non hai emesso scontrini, inserisci 0.</Hint><Euro label="Chiusura fiscale (scontrini)" val={form.chiusura_fiscale} onChange={v=>set('chiusura_fiscale',v)} /><Errore testo={errStep} /><Row><BtnS onClick={bk}>← Indietro</BtnS><BtnP onClick={avanti}>Avanti →</BtnP></Row></Card>);
  } else if (step===2) { body=(<Card><Q>Inserisci il <b>totale fatturato</b> — solo fatture emesse, escluso Art. 36.</Q><Hint>Somma le fatture emesse oggi (IVA inclusa). Se non ne hai emesse, inserisci 0.</Hint><Euro label="Fatturato (fatture, no Art. 36)" val={form.fatturato} onChange={v=>set('fatturato',v)} /><Errore testo={errStep} /><Row><BtnS onClick={bk}>← Indietro</BtnS><BtnP onClick={avanti}>Avanti →</BtnP></Row></Card>);
  } else if (step===3) { body=(<Card><Q>Inserisci il <b>totale vendite Art. 36</b>.</Q><Hint>Vendite di usato da privati. IVA solo sul margine. Se non ne hai fatte, inserisci 0.</Hint><Euro label="Vendite Art. 36 (usato da privati)" val={form.fatturato_art36} onChange={v=>set('fatturato_art36',v)} /><Errore testo={errStep} /><Row><BtnS onClick={bk}>← Indietro</BtnS><BtnP onClick={avanti}>Avanti →</BtnP></Row></Card>);
  } else if (step===4) { body=(<Card><Q>Quanti <b>contanti</b> hai incassato oggi?</Q><Hint>Denaro fisico ricevuto dai clienti. Se nessuno, inserisci 0.</Hint><Euro label="Contanti" val={form.contanti} onChange={v=>set('contanti',v)} /><Errore testo={errStep} /><Row><BtnS onClick={bk}>← Indietro</BtnS><BtnP onClick={avanti}>Avanti →</BtnP></Row></Card>);
  } else if (step===5) { body=(<Card><Q>Quanti incassi tramite <b>POS / Carte</b>?</Q><Hint>Totale giornaliero sul terminale POS. Se nessuno, inserisci 0.</Hint><Euro label="POS / Carte" val={form.pos} onChange={v=>set('pos',v)} /><Errore testo={errStep} /><Row><BtnS onClick={bk}>← Indietro</BtnS><BtnP onClick={avanti}>Avanti →</BtnP></Row></Card>);
  } else if (step===6) { body=(<Card><Q>Hai incassato tramite <b>altri metodi</b>?</Q><Hint>Compila solo i metodi usati. Lascia a 0 quelli non utilizzati.</Hint><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Euro label="Satispay" val={form.satispay} onChange={v=>set('satispay',v)} /><Euro label="Bonifico" val={form.bonifico} onChange={v=>set('bonifico',v)} /><Euro label="Assegni" val={form.assegni} onChange={v=>set('assegni',v)} /><Euro label="Compass (Agenzia)" val={form.compass} onChange={v=>set('compass',v)} /><Euro label="Stripe (Online)" val={form.stripe} onChange={v=>set('stripe',v)} /><Euro label="Enwon Pay" val={form.enwon_pay} onChange={v=>set('enwon_pay',v)} /></div><Errore testo={errStep} /><Row><BtnS onClick={bk}>← Indietro</BtnS><BtnP onClick={avanti}>Avanti →</BtnP></Row></Card>);
  } else if (step===7) { body=(<Card><Q>Hai emesso <b>note di credito o resi</b>?</Q><Hint>Rimborsi o resi — verranno sottratti dal totale. Se nessuno, inserisci 0.</Hint><Euro label="Note credito / Resi (sottratti)" val={form.note_credito} onChange={v=>set('note_credito',v)} /><div style={{marginTop:16,padding:'10px 14px',borderRadius:8,background:Math.abs(diff)<0.01?'rgba(34,197,94,0.08)':'rgba(239,68,68,0.08)',border:Math.abs(diff)<0.01?'1px solid rgba(34,197,94,0.25)':'1px solid rgba(239,68,68,0.25)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:'#94a3b8',fontSize:12}}>Totale vendite</span><span style={{color:'#f1f5f9',fontSize:13,fontWeight:600}}>{fmtE(totV)}</span></div><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:'#94a3b8',fontSize:12}}>Totale incassato</span><span style={{color:'#f1f5f9',fontSize:13,fontWeight:600}}>{fmtE(totI)}</span></div><div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid #1e293b',paddingTop:6}}><span style={{color:'#94a3b8',fontSize:12}}>Differenza</span><span style={{color:Math.abs(diff)<0.01?'#22c55e':'#ef4444',fontSize:13,fontWeight:700}}>{Math.abs(diff)<0.01?'✅ Quadra':(diff>0?'+':'')+fmtE(diff)}</span></div></div><Errore testo={errStep} /><Row><BtnS onClick={bk}>← Indietro</BtnS><BtnP onClick={avanti}>Avanti →</BtnP></Row></Card>);
  } else if (step===8) { body=(<Card><Q>Hai fatto <b>uscite di cassa</b>?</Q><Hint>Spese pagate dal fondo cassa. Se nessuna, lascia tutto a 0.</Hint><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}><Euro label="Uscite contante" val={form.uscite_contante} onChange={v=>set('uscite_contante',v)} /><Euro label="Uscite bonifico" val={form.uscite_bonifico} onChange={v=>set('uscite_bonifico',v)} /><Euro label="Uscite POS" val={form.uscite_pos} onChange={v=>set('uscite_pos',v)} /></div><Errore testo={errStep} /><Row><BtnS onClick={bk}>← Indietro</BtnS><BtnP onClick={avanti}>Avanti →</BtnP></Row></Card>);
  } else if (step===9) { body=(<Card><Q>Conta le <b>banconote e monete</b> nel cassetto.</Q><Hint>Inserisci le quantità per ogni taglio. Il totale viene calcolato automaticamente.</Hint><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>{TAGLIE_FC.map(t=>(<div key={t.key} style={{background:'#1e293b',borderRadius:8,padding:'8px 10px'}}><div style={{color:'#64748b',fontSize:11,marginBottom:4}}>{t.label}</div><input type="number" min="0" placeholder="0" value={form.fondo_cassa[t.key]||''} onChange={e=>set('fondo_cassa',{...form.fondo_cassa,[t.key]:e.target.value})} style={{width:'100%',background:'transparent',border:'none',color:'#f1f5f9',fontSize:16,fontWeight:700,outline:'none'}} /></div>))}</div><div style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'#111827',borderRadius:8,marginBottom:8}}><span style={{color:'#94a3b8',fontSize:13}}>Totale fondo cassa</span><span style={{color:'#22c55e',fontWeight:700,fontSize:16}}>{fmtE(totF)}</span></div><Errore testo={errStep} /><Row><BtnS onClick={bk}>← Indietro</BtnS><BtnP onClick={avanti}>Avanti →</BtnP></Row></Card>);
  } else if (step===10) { body=(<Card><Q>Chi ha fatto la <b>chiusura cassa</b>?</Q><Hint>Inserisci il nome dell'operatore. Le note sono opzionali.</Hint><div style={{display:'flex',flexDirection:'column',gap:12}}><div><div style={{color:'#94a3b8',fontSize:11,marginBottom:5,textTransform:'uppercase',letterSpacing:0.5}}>Operatore</div><input placeholder="Il tuo nome" value={form.operatore} onChange={e=>set('operatore',e.target.value)} style={{width:'100%',background:'#1e293b',border:'1px solid #334155',borderRadius:8,padding:'10px 14px',color:'#f1f5f9',fontSize:14,boxSizing:'border-box'}} /></div><div><div style={{color:'#94a3b8',fontSize:11,marginBottom:5,textTransform:'uppercase',letterSpacing:0.5}}>Note (opzionale)</div><textarea placeholder="Anomalie, differenze di cassa, memo..." value={form.note} onChange={e=>set('note',e.target.value)} rows={3} style={{width:'100%',background:'#1e293b',border:'1px solid #334155',borderRadius:8,padding:'10px 14px',color:'#f1f5f9',fontSize:14,boxSizing:'border-box',resize:'vertical'}} /></div></div><Errore testo={errStep} /><Row><BtnS onClick={bk}>← Indietro</BtnS><BtnP onClick={avanti}>Vai al riepilogo →</BtnP></Row></Card>);
  } else { body=(<Card><Q>📋 Riepilogo — tutto corretto?</Q><Hint>Controlla i dati prima di salvare.</Hint>{msg&&!msg.ok&&(<div style={{padding:'10px 14px',borderRadius:8,marginBottom:16,background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.3)',color:'#fca5a5',fontSize:13}}>{msg.text}</div>)}<div style={{marginBottom:14}}><div style={{color:'#64748b',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Vendite</div><RR label="Chiusura fiscale" val={nv(form.chiusura_fiscale)} /><RR label="Fatturato (no Art.36)" val={nv(form.fatturato)} /><RR label="Vendite Art. 36" val={nv(form.fatturato_art36)} /><RR label="Totale vendite" val={totV} bold /></div><div style={{marginBottom:14}}><div style={{color:'#64748b',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Incassi</div><RR label="Contanti" val={nv(form.contanti)} /><RR label="POS / Carte" val={nv(form.pos)} />{nv(form.satispay)>0&&<RR label="Satispay" val={nv(form.satispay)} />}{nv(form.bonifico)>0&&<RR label="Bonifico" val={nv(form.bonifico)} />}{nv(form.assegni)>0&&<RR label="Assegni" val={nv(form.assegni)} />}{nv(form.compass)>0&&<RR label="Compass" val={nv(form.compass)} />}{nv(form.stripe)>0&&<RR label="Stripe" val={nv(form.stripe)} />}{nv(form.enwon_pay)>0&&<RR label="Enwon Pay" val={nv(form.enwon_pay)} />}{nv(form.note_credito)>0&&<RR label="Note credito / Resi" val={-nv(form.note_credito)} color="#f87171" />}<RR label="Totale incassato" val={totI} bold /></div><div style={{marginBottom:14}}><div style={{color:'#64748b',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Uscite e fondo cassa</div>{totU>0&&<RR label="Uscite totali" val={totU} color="#f87171" />}<RR label="Fondo cassa contato" val={totF} /><RR label="Contante da versare" val={cdv} color="#22c55e" bold /></div>{form.operatore&&<div style={{color:'#64748b',fontSize:13,marginBottom:4}}>Operatore: <b style={{color:'#f1f5f9'}}>{form.operatore}</b></div>}{form.note&&<div style={{color:'#64748b',fontSize:13,marginBottom:12}}>Note: <span style={{color:'#f1f5f9'}}>{form.note}</span></div>}<Row><BtnS onClick={bk}>← Modifica</BtnS><BtnP onClick={onSalva} disabled={saving}>{saving?'⏳ Salvataggio...':'💾 Salva chiusura'}</BtnP></Row></Card>); }
  return (<div style={{maxWidth:640,margin:'0 auto'}}><Barra step={step} total={TOTAL} />{body}</div>);
}

// ── Export CSV ──────────────────────────────────────────────────────────────────
// Converte una chiusura in riga CSV completa con tutti i campi
function chiusuraToRiga(s) {
  const nv = x => parseFloat(x)||0;
  const f  = n => Number(n||0).toFixed(2).replace('.',',');

  // Vendite
  const fiscale   = nv(s.chiusura_fiscale);
  const fatturato = nv(s.fatturato);
  const art36     = nv(s.fatturato_art36);
  const totV      = fiscale + fatturato + art36;

  // IVA scorporo
  const IVA = 0.22;
  const fiscale_iva   = fiscale   * IVA / (1 + IVA);
  const fatturato_iva = fatturato * IVA / (1 + IVA);
  // Art.36: IVA solo su margine (costo non disponibile per singola riga)
  const fiscale_netto   = fiscale   - fiscale_iva;
  const fatturato_netto = fatturato - fatturato_iva;

  // Incassi
  const contanti   = nv(s.contanti);
  const pos        = nv(s.pos);
  const satispay   = nv(s.satispay);
  const bonifico   = nv(s.bonifico);
  const assegni    = nv(s.assegni);
  const compass    = nv(s.compass);
  const stripe     = nv(s.stripe);
  const enwon_pay  = nv(s.enwon_pay);
  const note_cred  = nv(s.note_credito);
  const totI       = contanti+pos+satispay+bonifico+assegni+compass+stripe+enwon_pay-note_cred;

  // Uscite
  const usc_cont   = nv(s.uscite_contante);
  const usc_bon    = nv(s.uscite_bonifico);
  const usc_pos    = nv(s.uscite_pos);
  const totU       = usc_cont + usc_bon + usc_pos;

  // Fondo cassa
  let totF = 0;
  if (s.fondo_cassa) {
    try {
      const obj = typeof s.fondo_cassa==='string' ? JSON.parse(s.fondo_cassa) : s.fondo_cassa;
      const TAGLIE = [{key:'fc_100',val:100},{key:'fc_50',val:50},{key:'fc_20',val:20},{key:'fc_10',val:10},{key:'fc_5',val:5},{key:'fc_2',val:2},{key:'fc_1',val:1},{key:'fc_050',val:0.5},{key:'fc_020',val:0.2},{key:'fc_010',val:0.1},{key:'fc_005',val:0.05},{key:'fc_002',val:0.02},{key:'fc_001',val:0.01}];
      totF = TAGLIE.reduce((sum,t) => sum+(nv(obj[t.key])||0)*t.val, 0);
    } catch(e){}
  }
  const cdv = Math.max(0, contanti - usc_cont - totF);
  const diff = totI - totV;

  return [
    s.data||'',
    s.operatore||'',
    // Vendite
    f(fiscale), f(fatturato), f(art36), f(totV),
    // IVA
    f(fiscale_iva), f(fiscale_netto),
    f(fatturato_iva), f(fatturato_netto),
    // Incassi per metodo
    f(contanti), f(pos), f(satispay), f(bonifico), f(assegni), f(compass), f(stripe), f(enwon_pay),
    f(note_cred), f(totI),
    // Differenza vendite/incassi
    f(diff),
    // Uscite
    f(usc_cont), f(usc_bon), f(usc_pos), f(totU),
    // Fondo cassa e versamento
    f(totF), f(cdv),
    // Note
    (s.note||'').replace(/"/g,"'").replace(/\n/g,' '),
  ];
}

const CSV_INTESTAZIONE = [
  'Data','Operatore',
  // Vendite
  'Chiusura Fiscale (€)','Fatturato (€)','Art.36 (€)','Totale Vendite (€)',
  // IVA
  'IVA Fiscale (€)','Netto Fiscale (€)',
  'IVA Fatturato (€)','Netto Fatturato (€)',
  // Incassi
  'Contanti (€)','POS/Carte (€)','Satispay (€)','Bonifico (€)','Assegni (€)','Compass (€)','Stripe (€)','Enwon Pay (€)',
  'Note Credito/Resi (€)','Totale Incassato (€)',
  // Differenza
  'Differenza Vendite-Incassi (€)',
  // Uscite
  'Uscite Contante (€)','Uscite Bonifico (€)','Uscite POS (€)','Totale Uscite (€)',
  // Fondo cassa
  'Fondo Cassa (€)','Contante da Versare (€)',
  'Note',
];

function scaricaCSV(chiusure, labelPeriodo) {
  if(!chiusure.length){alert('Nessuna chiusura nel periodo selezionato.');return;}
  const righe = [CSV_INTESTAZIONE, ...chiusure.map(chiusuraToRiga)];
  const csv = righe.map(r => r.map(v => '"'+String(v)+'"').join(';')).join('\n');
  const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'chiusure_cassa_'+labelPeriodo+'.csv'; a.click();
  URL.revokeObjectURL(url);
}

function scaricaCSVGiorno(s) {
  scaricaCSV([s], s.data||'giorno');
}

// ── Report components ───────────────────────────────────────────────────────────
function calcolaReport(chiusure, accantonato, costo_art36) {
  const acc=nv(accantonato), costoA36=nv(costo_art36);
  let fiscale_lordo=0,fatturato_lordo=0,art36_lordo=0,contanti_tot=0;
  let uscite_contante_tot=0,uscite_bonifico_tot=0,uscite_pos_tot=0,note_credito_tot=0;
  let fondo_cassa_ultimo=0,pos_tot=0,satispay_tot=0,bonifico_tot=0,assegni_tot=0,compass_tot=0,stripe_tot=0,enwon_pay_tot=0;
  chiusure.forEach(s => {
    fiscale_lordo+=nv(s.chiusura_fiscale); fatturato_lordo+=nv(s.fatturato); art36_lordo+=nv(s.fatturato_art36);
    contanti_tot+=nv(s.contanti); uscite_contante_tot+=nv(s.uscite_contante);
    uscite_bonifico_tot+=nv(s.uscite_bonifico); uscite_pos_tot+=nv(s.uscite_pos);
    note_credito_tot+=nv(s.note_credito); pos_tot+=nv(s.pos); satispay_tot+=nv(s.satispay);
    bonifico_tot+=nv(s.bonifico); assegni_tot+=nv(s.assegni); compass_tot+=nv(s.compass);
    stripe_tot+=nv(s.stripe); enwon_pay_tot+=nv(s.enwon_pay);
    const fc_json=s.fondo_cassa; let fc=0;
    if(fc_json){try{const obj=typeof fc_json==='string'?JSON.parse(fc_json):fc_json;fc=TAGLIE_FC.reduce((sum,t)=>sum+(nv(obj[t.key])||0)*t.val,0);}catch(e){}}
    if(fc>0)fondo_cassa_ultimo=fc;
  });
  const fiscale_iva=fiscale_lordo*IVA/(1+IVA), fiscale_netto=fiscale_lordo-fiscale_iva;
  const fatturato_iva=fatturato_lordo*IVA/(1+IVA), fatturato_netto=fatturato_lordo-fatturato_iva;
  const margine_art36=Math.max(0,art36_lordo-costoA36);
  const iva_art36=margine_art36*IVA/(1+IVA), art36_netto=art36_lordo-iva_art36;
  const totale_lordo=fiscale_lordo+fatturato_lordo+art36_lordo;
  const iva_totale=fiscale_iva+fatturato_iva+iva_art36;
  const totale_netto=fiscale_netto+fatturato_netto+art36_netto;
  const contante_da_versare=Math.max(0,contanti_tot-uscite_contante_tot-acc);
  const bonifici_agenzie=compass_tot+stripe_tot+enwon_pay_tot;
  return {fiscale_lordo,fiscale_iva,fiscale_netto,fatturato_lordo,fatturato_iva,fatturato_netto,
    art36_lordo,costoA36,margine_art36,iva_art36,art36_netto,totale_lordo,iva_totale,totale_netto,
    contanti_tot,uscite_contante_tot,uscite_bonifico_tot,uscite_pos_tot,accantonato:acc,
    contante_da_versare,fondo_cassa_ultimo,note_credito_tot,bonifici_agenzie,
    compass_tot,stripe_tot,enwon_pay_tot,pos_tot,satispay_tot,bonifico_tot,assegni_tot};
}
function RigaReport({ label, valore, colore, bold, sub, nota }) {
  return (<div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:sub?'4px 0 4px 16px':'7px 0',borderBottom:'1px solid #1e293b'}}><div><span style={{color:sub?'#64748b':'#94a3b8',fontSize:sub?12:13}}>{label}</span>{nota&&<div style={{color:'#475569',fontSize:11,marginTop:2}}>{nota}</div>}</div><span style={{color:colore||'#f1f5f9',fontWeight:bold?700:400,fontSize:bold?14:13,whiteSpace:'nowrap',marginLeft:12}}>{fmtE(valore)}</span></div>);
}
function SezioneReport({ titolo, emoji, children, highlight }) {
  return (<div style={{background:highlight?'rgba(59,130,246,0.04)':'#0f172a',border:highlight?'1px solid rgba(59,130,246,0.25)':'1px solid #1e293b',borderRadius:12,marginBottom:16,overflow:'hidden'}}><div style={{padding:'12px 20px',borderBottom:'1px solid #1e293b',background:highlight?'rgba(59,130,246,0.08)':'rgba(255,255,255,0.02)',display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:16}}>{emoji}</span><span style={{color:'#e2e8f0',fontWeight:600,fontSize:14}}>{titolo}</span></div><div style={{padding:'4px 20px 12px'}}>{children}</div></div>);
}
function KpiCard({ label, valore, sub, colore, icon }) {
  return (<div style={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:10,padding:'14px 18px',display:'flex',flexDirection:'column',gap:4}}><div style={{color:'#475569',fontSize:11,textTransform:'uppercase',letterSpacing:0.5,display:'flex',alignItems:'center',gap:5}}>{icon&&<span>{icon}</span>}{label}</div><div style={{color:colore||'#f1f5f9',fontWeight:700,fontSize:18}}>{fmtE(valore)}</div>{sub&&<div style={{color:'#475569',fontSize:11}}>{sub}</div>}</div>);
}

function TabReport({ storico }) {
  const oggi = new Date();
  const [mese,setMese]=useState(oggi.getMonth());
  const [anno,setAnno]=useState(oggi.getFullYear());
  const [accantonato,setAccantonato]=useState('');
  const [costoArt36,setCostoArt36]=useState('');
  const [periodo,setPeriodo]=useState('mese');
  const chiusureFiltrate=storico.filter(s=>{
    if(!s.data)return false;
    const d=new Date(s.data+'T12:00:00');
    if(periodo==='anno')return d.getFullYear()===anno;
    return d.getMonth()===mese&&d.getFullYear()===anno;
  });
  const r=calcolaReport(chiusureFiltrate,accantonato,costoArt36);
  const anniDisp=[...new Set(storico.map(s=>s.data?new Date(s.data+'T12:00:00').getFullYear():null).filter(Boolean))].sort((a,b)=>b-a);
  const labelPeriodo = periodo==='mese' ? MESI[mese]+'_'+anno : String(anno);
  return (
    <div style={{maxWidth:820,margin:'0 auto'}}>
      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{display:'flex',gap:4,background:'#111827',borderRadius:8,padding:3}}>
          {['mese','anno'].map(p=>(<button key={p} onClick={()=>setPeriodo(p)} style={{padding:'6px 16px',borderRadius:6,border:'none',cursor:'pointer',fontWeight:500,fontSize:13,background:periodo===p?'#3b82f6':'transparent',color:periodo===p?'#fff':'#64748b'}}>{p==='mese'?'Mese':'Anno'}</button>))}
        </div>
        {periodo==='mese'&&(<select value={mese} onChange={e=>setMese(Number(e.target.value))} style={{background:'#1e293b',border:'1px solid #334155',borderRadius:8,padding:'6px 12px',color:'#f1f5f9',fontSize:13}}>{MESI.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>)}
        <select value={anno} onChange={e=>setAnno(Number(e.target.value))} style={{background:'#1e293b',border:'1px solid #334155',borderRadius:8,padding:'6px 12px',color:'#f1f5f9',fontSize:13}}>
          {(anniDisp.length?anniDisp:[oggi.getFullYear()]).map(a=><option key={a} value={a}>{a}</option>)}
        </select>
        <span style={{color:'#475569',fontSize:12}}>{chiusureFiltrate.length} chiusur{chiusureFiltrate.length===1?'a':'e'} nel periodo</span>
        <button onClick={()=>scaricaCSV(chiusureFiltrate,labelPeriodo)}
          style={{marginLeft:'auto',background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.25)',borderRadius:8,color:'#60a5fa',cursor:'pointer',padding:'7px 16px',fontSize:13,fontWeight:500}}>
          ⬇️ Esporta CSV completo
        </button>
      </div>
      {chiusureFiltrate.length===0?(<div style={{padding:'40px 20px',textAlign:'center',color:'#475569',fontSize:14}}>Nessuna chiusura trovata per il periodo selezionato.</div>):(
        <>
          <div style={{background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:10,padding:'14px 20px',marginBottom:20,display:'flex',gap:20,flexWrap:'wrap',alignItems:'center'}}>
            <div style={{color:'#fbbf24',fontSize:13,fontWeight:600,minWidth:200}}>⚙️ Parametri periodo</div>
            <div style={{flex:1,minWidth:180}}><div style={{color:'#94a3b8',fontSize:11,marginBottom:4,textTransform:'uppercase',letterSpacing:0.4}}>Accantonato (€)</div><div style={{display:'flex',alignItems:'center',background:'#1e293b',border:'1px solid #334155',borderRadius:7,padding:'6px 10px'}}><span style={{color:'#64748b',marginRight:5,fontSize:13}}>€</span><input type="number" min="0" step="0.01" placeholder="0,00" value={accantonato} onChange={e=>setAccantonato(e.target.value)} style={{flex:1,background:'transparent',border:'none',color:'#f1f5f9',fontSize:14,outline:'none'}} /></div><div style={{color:'#475569',fontSize:10,marginTop:3}}>Denaro tenuto in negozio come riserva</div></div>
            <div style={{flex:1,minWidth:180}}><div style={{color:'#94a3b8',fontSize:11,marginBottom:4,textTransform:'uppercase',letterSpacing:0.4}}>Investimento Art. 36 (€)</div><div style={{display:'flex',alignItems:'center',background:'#1e293b',border:'1px solid #334155',borderRadius:7,padding:'6px 10px'}}><span style={{color:'#64748b',marginRight:5,fontSize:13}}>€</span><input type="number" min="0" step="0.01" placeholder="0,00" value={costoArt36} onChange={e=>setCostoArt36(e.target.value)} style={{flex:1,background:'transparent',border:'none',color:'#f1f5f9',fontSize:14,outline:'none'}} /></div><div style={{color:'#475569',fontSize:10,marginTop:3}}>Totale pagato ai privati per acquisto dispositivi</div></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10,marginBottom:20}}>
            <KpiCard icon="💵" label="Flusso contante da versare" valore={r.contante_da_versare} colore="#22c55e" sub={'Contanti '+fmtE(r.contanti_tot)+' − uscite '+fmtE(r.uscite_contante_tot)+' − acc. '+fmtE(r.accantonato)} />
            <KpiCard icon="🪙" label="Fondo cassa dichiarato" valore={r.fondo_cassa_ultimo} colore="#60a5fa" sub="Ultimo conteggio cassetto" />
            <KpiCard icon="🧾" label="Totale lordo maturato" valore={r.totale_lordo} colore="#f1f5f9" sub="Fiscale + Fatture + Art.36 IVA incl." />
            <KpiCard icon="📊" label="Totale netto maturato" valore={r.totale_netto} colore="#a78bfa" sub="IVA esclusa (art.36: solo su margine)" />
            <KpiCard icon="📋" label="Note di credito" valore={r.note_credito_tot} colore="#f87171" sub="Totale resi e rimborsi periodo" />
          </div>
          <SezioneReport emoji="💵" titolo="Flusso contante da versare" highlight>
            <RigaReport label="Contanti incassati" valore={r.contanti_tot} /><RigaReport label="− Uscite pagate in contante" valore={-r.uscite_contante_tot} colore="#f87171" /><RigaReport label="− Accantonato (riserva negozio)" valore={-r.accantonato} colore="#fbbf24" /><RigaReport label="= Contante da versare" valore={r.contante_da_versare} colore="#22c55e" bold nota="Importo da portare in banca o trasferire" /><div style={{height:8}} /><RigaReport label="Fondo cassa dichiarato" valore={r.fondo_cassa_ultimo} colore="#60a5fa" bold nota="Ultimo conteggio fisico del cassetto" />
          </SezioneReport>
          <SezioneReport emoji="🧾" titolo="Totale fiscale maturato (scontrini)">
            <RigaReport label="Totale fiscale IVA inclusa" valore={r.fiscale_lordo} bold /><RigaReport label="  di cui IVA 22% (scorporo)" valore={r.fiscale_iva} colore="#fbbf24" sub /><RigaReport label="  Imponibile (IVA esclusa)" valore={r.fiscale_netto} colore="#a78bfa" sub bold />
          </SezioneReport>
          <SezioneReport emoji="📄" titolo="Totale fatturato maturato (fatture, no Art. 36)">
            <RigaReport label="Totale fatturato IVA inclusa" valore={r.fatturato_lordo} bold /><RigaReport label="  di cui IVA 22% (scorporo)" valore={r.fatturato_iva} colore="#fbbf24" sub /><RigaReport label="  Imponibile (IVA esclusa)" valore={r.fatturato_netto} colore="#a78bfa" sub bold />
          </SezioneReport>
          <SezioneReport emoji="🔄" titolo="Totale Art. 36 maturato (usato da privati)">
            <RigaReport label="Ricavi Art. 36 (IVA inclusa solo su margine)" valore={r.art36_lordo} bold /><RigaReport label="  Investimento acquisti da privati" valore={r.costoA36} colore="#f87171" sub /><RigaReport label="  Margine lordo (ricavi − costi)" valore={r.margine_art36} colore="#fbbf24" sub /><RigaReport label="  IVA 22% sul solo margine" valore={r.iva_art36} colore="#fbbf24" sub /><RigaReport label="  Netto Art. 36 (ricavi − IVA su margine)" valore={r.art36_netto} colore="#a78bfa" sub bold />
          </SezioneReport>
          <SezioneReport emoji="📊" titolo="Riepilogo generale maturato" highlight>
            <RigaReport label="Totale lordo (fiscale + fatture + art.36)" valore={r.totale_lordo} bold /><RigaReport label="  Fiscale" valore={r.fiscale_lordo} sub /><RigaReport label="  Fatturato" valore={r.fatturato_lordo} sub /><RigaReport label="  Art. 36" valore={r.art36_lordo} sub /><div style={{height:4}} /><RigaReport label="IVA totale" valore={r.iva_totale} colore="#fbbf24" bold /><RigaReport label="  IVA su fiscale" valore={r.fiscale_iva} sub /><RigaReport label="  IVA su fatturato" valore={r.fatturato_iva} sub /><RigaReport label="  IVA art.36 (solo sul margine)" valore={r.iva_art36} sub /><div style={{height:4}} /><RigaReport label="Totale netto maturato (IVA esclusa)" valore={r.totale_netto} colore="#a78bfa" bold />
          </SezioneReport>
          <SezioneReport emoji="📋" titolo="Note di credito"><RigaReport label="Totale note di credito / resi periodo" valore={r.note_credito_tot} colore="#f87171" bold /></SezioneReport>
          <SezioneReport emoji="📤" titolo="Uscite di cassa">
            <RigaReport label="Uscite totali" valore={r.uscite_contante_tot+r.uscite_bonifico_tot+r.uscite_pos_tot} bold /><RigaReport label="  Contante" valore={r.uscite_contante_tot} sub /><RigaReport label="  Bonifico" valore={r.uscite_bonifico_tot} sub /><RigaReport label="  POS" valore={r.uscite_pos_tot} sub />
          </SezioneReport>
          <SezioneReport emoji="💳" titolo="Incassi per metodo di pagamento">
            <RigaReport label="Contanti" valore={r.contanti_tot} /><RigaReport label="POS / Carte" valore={r.pos_tot} />{r.satispay_tot>0&&<RigaReport label="Satispay" valore={r.satispay_tot} />}{r.bonifico_tot>0&&<RigaReport label="Bonifico (clienti diretti)" valore={r.bonifico_tot} />}{r.assegni_tot>0&&<RigaReport label="Assegni" valore={r.assegni_tot} />}{r.bonifici_agenzie>0&&(<><RigaReport label="Bonifici agenzie (da incassare)" valore={r.bonifici_agenzie} colore="#fbbf24" bold />{r.compass_tot>0&&<RigaReport label="  Compass" valore={r.compass_tot} sub />}{r.stripe_tot>0&&<RigaReport label="  Stripe" valore={r.stripe_tot} sub />}{r.enwon_pay_tot>0&&<RigaReport label="  Enwon Pay" valore={r.enwon_pay_tot} sub />}</>)}<RigaReport label="− Note di credito" valore={-r.note_credito_tot} colore="#f87171" />
          </SezioneReport>
        </>
      )}
    </div>
  );
}

// ── Dettaglio chiusura giornaliera ──────────────────────────────────────────────
function DettaglioChiusura({ s, onClose }) {
  const d = new Date(s.data + 'T12:00:00');
  const dataStr = d.getDate().toString().padStart(2,'0') + ' ' + MESI[d.getMonth()] + ' ' + d.getFullYear();
  const totV = nv(s.chiusura_fiscale)+nv(s.fatturato)+nv(s.fatturato_art36);
  const totI = nv(s.contanti)+nv(s.pos)+nv(s.satispay)+nv(s.bonifico)+nv(s.assegni)+nv(s.compass)+nv(s.stripe)+nv(s.enwon_pay)-nv(s.note_credito);
  const totU = nv(s.uscite_contante)+nv(s.uscite_bonifico)+nv(s.uscite_pos);
  let totF = 0;
  if (s.fondo_cassa) { try { const obj=typeof s.fondo_cassa==='string'?JSON.parse(s.fondo_cassa):s.fondo_cassa; totF=TAGLIE_FC.reduce((sum,t)=>sum+(nv(obj[t.key])||0)*t.val,0); } catch(e){} }
  const cdv = Math.max(0, nv(s.contanti)-nv(s.uscite_contante)-totF);
  const diff = totI - totV;
  const R = ({label,val,colore,bold,sub}) => (<div style={{display:'flex',justifyContent:'space-between',padding:sub?'3px 0 3px 14px':'6px 0',borderBottom:'1px solid #1e293b'}}><span style={{color:sub?'#64748b':'#94a3b8',fontSize:sub?12:13}}>{label}</span><span style={{color:colore||'#f1f5f9',fontWeight:bold?700:400,fontSize:13,whiteSpace:'nowrap',marginLeft:8}}>{fmtE(val)}</span></div>);
  const Sez = ({title,children}) => (<div style={{marginBottom:16}}><div style={{color:'#475569',fontSize:11,textTransform:'uppercase',letterSpacing:0.8,marginBottom:6}}>{title}</div>{children}</div>);
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'center',overflowY:'auto',padding:'40px 16px'}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:'#0a0f1e',border:'1px solid #1e293b',borderRadius:16,width:'100%',maxWidth:580,padding:'28px 32px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
          <div>
            <div style={{color:'#f1f5f9',fontSize:20,fontWeight:700,marginBottom:4}}>{dataStr}</div>
            <div style={{color:'#64748b',fontSize:13}}>{s.operatore||'Operatore non specificato'}</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>scaricaCSVGiorno(s)}
              style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.25)',borderRadius:8,color:'#60a5fa',cursor:'pointer',padding:'6px 12px',fontSize:12,fontWeight:500}}>
              ⬇️ CSV completo
            </button>
            <button onClick={onClose}
              style={{background:'rgba(255,255,255,0.05)',border:'1px solid #334155',borderRadius:8,color:'#94a3b8',cursor:'pointer',padding:'6px 12px',fontSize:13}}>
              × Chiudi
            </button>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:24}}>
          <div style={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:10,padding:'12px 16px'}}><div style={{color:'#475569',fontSize:11,textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>Totale vendite</div><div style={{color:'#f1f5f9',fontWeight:700,fontSize:20}}>{fmtE(totV)}</div></div>
          <div style={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:10,padding:'12px 16px'}}><div style={{color:'#475569',fontSize:11,textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>Totale incassato</div><div style={{color:Math.abs(diff)<0.01?'#22c55e':'#f87171',fontWeight:700,fontSize:20}}>{fmtE(totI)}</div><div style={{color:Math.abs(diff)<0.01?'#22c55e':'#ef4444',fontSize:11,marginTop:2}}>{Math.abs(diff)<0.01?'✅ Quadra':(diff>0?'⚠️ +':'⚠️ ')+fmtE(diff)}</div></div>
          <div style={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:10,padding:'12px 16px'}}><div style={{color:'#475569',fontSize:11,textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>Contante da versare</div><div style={{color:'#22c55e',fontWeight:700,fontSize:20}}>{fmtE(cdv)}</div></div>
          <div style={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:10,padding:'12px 16px'}}><div style={{color:'#475569',fontSize:11,textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>Fondo cassa</div><div style={{color:'#60a5fa',fontWeight:700,fontSize:20}}>{fmtE(totF)}</div></div>
        </div>
        <Sez title="Vendite">
          <R label="Chiusura fiscale (scontrini)" val={nv(s.chiusura_fiscale)} /><R label="Fatturato (fatture, no Art.36)" val={nv(s.fatturato)} /><R label="Vendite Art. 36" val={nv(s.fatturato_art36)} /><R label="Totale vendite" val={totV} bold colore="#f1f5f9" />
        </Sez>
        <Sez title="Incassi">
          <R label="Contanti" val={nv(s.contanti)} /><R label="POS / Carte" val={nv(s.pos)} />{nv(s.satispay)>0&&<R label="Satispay" val={nv(s.satispay)} sub />}{nv(s.bonifico)>0&&<R label="Bonifico" val={nv(s.bonifico)} sub />}{nv(s.assegni)>0&&<R label="Assegni" val={nv(s.assegni)} sub />}{nv(s.compass)>0&&<R label="Compass" val={nv(s.compass)} sub />}{nv(s.stripe)>0&&<R label="Stripe" val={nv(s.stripe)} sub />}{nv(s.enwon_pay)>0&&<R label="Enwon Pay" val={nv(s.enwon_pay)} sub />}{nv(s.note_credito)>0&&<R label="− Note credito / Resi" val={-nv(s.note_credito)} colore="#f87171" />}<R label="Totale incassato" val={totI} bold colore={Math.abs(diff)<0.01?'#22c55e':'#f87171'} />
        </Sez>
        {totU>0&&(<Sez title="Uscite di cassa"><R label="Uscite contante" val={nv(s.uscite_contante)} colore="#f87171" /><R label="Uscite bonifico" val={nv(s.uscite_bonifico)} colore="#f87171" /><R label="Uscite POS" val={nv(s.uscite_pos)} colore="#f87171" /><R label="Totale uscite" val={totU} bold colore="#f87171" /></Sez>)}
        <Sez title="Fondo cassa contato">
          {(()=>{ try { const obj=typeof s.fondo_cassa==='string'?JSON.parse(s.fondo_cassa):s.fondo_cassa; const tagli=TAGLIE_FC.filter(t=>nv(obj[t.key])>0); if(!tagli.length)return <div style={{color:'#475569',fontSize:13,padding:'6px 0'}}>Nessun taglio inserito</div>; return tagli.map(t=>(<div key={t.key} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid #1e293b'}}><span style={{color:'#94a3b8',fontSize:13}}>{nv(obj[t.key])} × {t.label}</span><span style={{color:'#f1f5f9',fontSize:13}}>{fmtE(nv(obj[t.key])*t.val)}</span></div>)); } catch(e){return null;} })()}
          <R label="Totale fondo cassa" val={totF} bold colore="#60a5fa" /><R label="Contante da versare" val={cdv} bold colore="#22c55e" />
        </Sez>
        {s.note&&(<div style={{background:'rgba(148,163,184,0.06)',border:'1px solid #1e293b',borderRadius:8,padding:'12px 16px',marginTop:8}}><div style={{color:'#475569',fontSize:11,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>Note</div><div style={{color:'#94a3b8',fontSize:13,lineHeight:1.6}}>{s.note}</div></div>)}
      </div>
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
  const [chiusuraDettaglio, setChiusuraDettaglio] = useState(null);

  const caricaStorico = useCallback(async () => {
    setLoadingStorico(true);
    try { const r=await fetch(`${API}/cassa`); const d=await r.json(); setStorico(Array.isArray(d)?d:[]); } catch(e) { setStorico([]); }
    setLoadingStorico(false);
  }, []);

  useEffect(() => { if (tab==='storico'||tab==='report') caricaStorico(); }, [tab, caricaStorico]);

  const salva = async () => {
    setSaving(true); setMsg(null);
    try {
      const r=await fetch(`${API}/cassa`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const d=await r.json();
      if(r.ok){setMsg({ok:true,text:'✅ Chiusura salvata correttamente!'});setForm(EMPTY());setTab('storico');}
      else{setMsg({ok:false,text:r.status===409?'❌ Esiste già una chiusura per questa data.':'❌ '+(d.error||'Errore durante il salvataggio.')});}
    } catch(e){setMsg({ok:false,text:'❌ Errore di rete: '+e.message});}
    setSaving(false);
  };

  const TS = (active) => ({padding:'8px 20px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:500,fontSize:13,background:active?'#3b82f6':'transparent',color:active?'#fff':'#64748b'});

  return (
    <div style={{padding:'24px 32px',minHeight:'100vh',background:'#0a0f1e',color:'#f1f5f9'}}>
      {chiusuraDettaglio && (
        <DettaglioChiusura s={chiusuraDettaglio} onClose={()=>setChiusuraDettaglio(null)} />
      )}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <span style={{fontSize:24}}>💰</span>
          <h1 style={{margin:0,fontSize:22,fontWeight:700}}>Chiusura Cassa</h1>
        </div>
        <p style={{margin:0,color:'#64748b',fontSize:13}}>Chiusura giornaliera · Riepilogo IVA · Contante da versare</p>
      </div>
      <div style={{display:'flex',gap:6,marginBottom:28,background:'#111827',borderRadius:10,padding:4,width:'fit-content'}}>
        <button style={TS(tab==='wizard')} onClick={()=>setTab('wizard')}>📝 Inserimento guidato</button>
        <button style={TS(tab==='report')} onClick={()=>setTab('report')}>📊 Report</button>
        <button style={TS(tab==='storico')} onClick={()=>setTab('storico')}>📋 Storico</button>
      </div>
      {msg&&msg.ok&&(<div style={{padding:'12px 16px',borderRadius:8,marginBottom:20,background:'rgba(34,197,94,0.1)',color:'#22c55e',fontSize:14,fontWeight:500}}>{msg.text}</div>)}
      {tab==='wizard'&&(<WizardChiusura form={form} setForm={setForm} onSalva={salva} saving={saving} msg={msg} />)}
      {tab==='report'&&(loadingStorico?<p style={{color:'#64748b'}}>Caricamento dati...</p>:<TabReport storico={storico} />)}
      {tab==='storico'&&(
        <div>
          {loadingStorico?(<p style={{color:'#64748b'}}>Caricamento...</p>):storico.length===0?(<p style={{color:'#64748b'}}>Nessuna chiusura registrata.</p>):(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:4}}>
                <button onClick={()=>scaricaCSV(storico,'storico_completo')}
                  style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.25)',borderRadius:8,color:'#60a5fa',cursor:'pointer',padding:'7px 16px',fontSize:13,fontWeight:500}}>
                  ⬇️ Esporta CSV completo (tutto lo storico)
                </button>
              </div>
              {storico.map((s,i) => {
                const totV=nv(s.chiusura_fiscale)+nv(s.fatturato)+nv(s.fatturato_art36);
                const totI=nv(s.contanti)+nv(s.pos)+nv(s.satispay)+nv(s.bonifico)+nv(s.assegni)+nv(s.compass)+nv(s.stripe)+nv(s.enwon_pay)-nv(s.note_credito);
                const diff=totI-totV;
                const d=new Date(s.data+'T12:00:00');
                return (
                  <div key={i} onClick={()=>setChiusuraDettaglio(s)}
                    style={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:10,padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer',transition:'border-color 0.15s'}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor='#3b82f6'}
                    onMouseLeave={e=>e.currentTarget.style.borderColor='#1e293b'}>
                    <div style={{display:'flex',alignItems:'center',gap:14}}>
                      <div style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:8,padding:'6px 10px',textAlign:'center',minWidth:48}}>
                        <div style={{color:'#60a5fa',fontWeight:700,fontSize:16,lineHeight:1}}>{d.getDate().toString().padStart(2,'0')}</div>
                        <div style={{color:'#475569',fontSize:10}}>{MESI[d.getMonth()].slice(0,3).toUpperCase()}</div>
                      </div>
                      <div>
                        <div style={{fontWeight:600,fontSize:14,marginBottom:2,color:'#f1f5f9'}}>{s.data}</div>
                        <div style={{color:'#64748b',fontSize:12}}>{s.operatore||'N/D'}</div>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:20}}>
                      <div style={{textAlign:'right'}}><div style={{color:'#f1f5f9',fontWeight:700,fontSize:15}}>{fmtE(totV)}</div><div style={{color:'#64748b',fontSize:11}}>vendite</div></div>
                      <div style={{textAlign:'right'}}><div style={{color:Math.abs(diff)<0.01?'#22c55e':'#f87171',fontWeight:700,fontSize:15}}>{fmtE(totI)}</div><div style={{color:'#64748b',fontSize:11}}>incassato</div></div>
                      <div style={{color:'#334155',fontSize:18}}>›</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

