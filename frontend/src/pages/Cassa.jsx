// pages/Cassa.jsx — Plugin Cassa Giornaliera v2
import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const MESI = ['', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

const fmt = (n) => Number(n || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtEur = (n) => '€ ' + fmt(n);
function n(v) { return parseFloat(v) || 0; }

const TAGLIE_FONDO = [
  { key: 'fc_100', label: '€ 100', val: 100 }, { key: 'fc_50', label: '€ 50', val: 50 },
  { key: 'fc_20', label: '€ 20', val: 20 }, { key: 'fc_10', label: '€ 10', val: 10 },
  { key: 'fc_5', label: '€ 5', val: 5 }, { key: 'fc_2', label: '€ 2', val: 2 },
  { key: 'fc_1', label: '€ 1', val: 1 }, { key: 'fc_050', label: '50 ct', val: 0.5 },
  { key: 'fc_020', label: '20 ct', val: 0.2 }, { key: 'fc_010', label: '10 ct', val: 0.1 },
  { key: 'fc_005', label: '5 ct', val: 0.05 }, { key: 'fc_002', label: '2 ct', val: 0.02 },
  { key: 'fc_001', label: '1 ct', val: 0.01 },
];

const EMPTY_FORM = {
  chiusura_fiscale: '', fatturato: '', fatturato_art36: '',
  contanti: '', pos: '', satispay: '', assegni: '', bonifico: '', compass: '', stripe: '',
  uscita_contante: '', versamento_contante: '', fattura_sifar: '', acquisto_privati: '', spostamento_contante: '',
  fc_100: '', fc_50: '', fc_20: '', fc_10: '', fc_5: '', fc_2: '', fc_1: '',
  fc_050: '', fc_020: '', fc_010: '', fc_005: '', fc_002: '', fc_001: '',
  contante_da_versare: '', note: '', operatore: ''
};

function CampoNum({ label, fieldKey, form, onChange, highlight }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{label}</label>
      <input type="number" min="0" step="0.01" value={form[fieldKey]} placeholder="0,00"
        onChange={e => onChange(fieldKey, e.target.value)}
        style={{ padding: '8px 10px', borderRadius: 8, background: highlight ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.05)', border: `1px solid ${highlight ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.1)'}`, color: '#e2e8f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
    </div>
  );
}

function Sezione({ titolo, badge, children, color = '#6366f1' }) {
  return (
    <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 4, height: 20, borderRadius: 2, background: color }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{titolo}</span>
        {badge !== undefined && <span style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 800, color }}>{fmtEur(badge)}</span>}
      </div>
      {children}
    </div>
  );
}

function FondoCassa({ form, onChange }) {
  const totale = TAGLIE_FONDO.reduce((s, t) => s + (n(form[t.key]) * t.val), 0);
  return (
    <Sezione titolo="Fondo Cassa" badge={totale} color="#f59e0b">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {TAGLIE_FONDO.map(t => (
          <div key={t.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{t.label}</label>
              {n(form[t.key]) > 0 && <span style={{ fontSize: 10, color: '#f59e0b' }}>= {fmt(n(form[t.key]) * t.val)}</span>}
            </div>
            <input type="number" min="0" step="1" value={form[t.key]} placeholder="0"
              onChange={e => onChange(t.key, e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, background: n(form[t.key]) > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${n(form[t.key]) > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)'}`, color: '#e2e8f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>Totale fondo cassa contato</span>
        <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: 18 }}>{fmtEur(totale)}</span>
      </div>
    </Sezione>
  );
}

function TabChiusura({ showToast }) {
  const today = new Date().toISOString().slice(0, 10);
  const [dataSelezionata, setDataSelezionata] = useState(today);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [esistente, setEsistente] = useState(false);
  const onChange = useCallback((k, v) => setForm(prev => ({ ...prev, [k]: v })), []);

  useEffect(() => {
    fetch(`${API}/cassa/${dataSelezionata}`).then(r => r.json()).then(data => {
      if (data) {
        setEsistente(true);
        const f = { ...EMPTY_FORM };
        Object.keys(f).forEach(k => { f[k] = data[k] !== undefined && data[k] !== null ? String(data[k]) : ''; });
        setForm(f);
      } else { setEsistente(false); setForm(EMPTY_FORM); }
    }).catch(() => {});
  }, [dataSelezionata]);

  const chiusuraTotale = n(form.chiusura_fiscale) + n(form.fatturato) + n(form.fatturato_art36);
  const totIncassato = n(form.contanti) + n(form.pos) + n(form.satispay) + n(form.assegni) + n(form.bonifico) + n(form.compass) + n(form.stripe);
  const totUscite = n(form.uscita_contante) + n(form.versamento_contante) + n(form.fattura_sifar) + n(form.acquisto_privati) + n(form.spostamento_contante);
  const fondoCassa = TAGLIE_FONDO.reduce((s, t) => s + (n(form[t.key]) * t.val), 0);
  const diffIncasso = totIncassato - chiusuraTotale;

  async function salva() {
    setSaving(true);
    try {
      const payload = { data: dataSelezionata };
      Object.keys(EMPTY_FORM).forEach(k => { payload[k] = n(form[k]) || form[k]; });
      const r = await fetch(`${API}/cassa`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (r.ok) { setSaved(true); setEsistente(true); showToast('Chiusura salvata!', 'success'); setTimeout(() => setSaved(false), 2000); }
      else { const e = await r.json(); showToast(e.error || 'Errore', 'error'); }
    } catch { showToast('Errore di rete', 'error'); }
    setSaving(false);
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>DATA CHIUSURA</div>
            <input type="date" value={dataSelezionata} onChange={e => setDataSelezionata(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 15, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {dataSelezionata === today && <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 11, fontWeight: 600 }}>● Oggi</span>}
            {esistente && <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontSize: 11, fontWeight: 600 }}>✓ Già compilata</span>}
          </div>
        </div>
        {[{ label: 'Chiusura Totale', val: chiusuraTotale, color: '#6366f1' }, { label: 'Incassato', val: totIncassato, color: '#22c55e' }, { label: 'Differenza', val: diffIncasso, color: Math.abs(diffIncasso) < 0.01 ? '#22c55e' : '#ef4444' }, { label: 'Fondo Cassa', val: fondoCassa, color: '#f59e0b' }].map(k => (
          <div key={k.label} style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 18px', flex: 1, minWidth: 130 }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>{k.label.toUpperCase()}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{fmtEur(k.val)}</div>
          </div>
        ))}
      </div>
      <Sezione titolo="Vendite del giorno" badge={chiusuraTotale} color="#6366f1">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <CampoNum label="CHIUSURA FISCALE" fieldKey="chiusura_fiscale" form={form} onChange={onChange} highlight />
          <CampoNum label="FATTURATO" fieldKey="fatturato" form={form} onChange={onChange} />
          <CampoNum label="FATTURATO ART. 36" fieldKey="fatturato_art36" form={form} onChange={onChange} />
        </div>
        <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(99,102,241,0.06)', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>Totale (fiscale + fatture + art.36)</span>
          <span style={{ color: '#a5b4fc', fontWeight: 700 }}>{fmtEur(chiusuraTotale)}</span>
        </div>
      </Sezione>
      <Sezione titolo="Come è stato incassato" badge={totIncassato} color="#22c55e">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
          <CampoNum label="CONTANTI" fieldKey="contanti" form={form} onChange={onChange} highlight />
          <CampoNum label="POS" fieldKey="pos" form={form} onChange={onChange} />
          <CampoNum label="SATISPAY" fieldKey="satispay" form={form} onChange={onChange} />
          <CampoNum label="ASSEGNI" fieldKey="assegni" form={form} onChange={onChange} />
          <CampoNum label="BONIFICO" fieldKey="bonifico" form={form} onChange={onChange} />
          <CampoNum label="COMPASS" fieldKey="compass" form={form} onChange={onChange} />
          <CampoNum label="STRIPE" fieldKey="stripe" form={form} onChange={onChange} />
        </div>
        <div style={{ padding: '10px 14px', borderRadius: 10, background: Math.abs(diffIncasso) < 0.01 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${Math.abs(diffIncasso) < 0.01 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>Incassato {fmtEur(totIncassato)} vs Chiusura {fmtEur(chiusuraTotale)}</span>
          <span style={{ fontWeight: 700, color: Math.abs(diffIncasso) < 0.01 ? '#22c55e' : '#ef4444', fontSize: 15 }}>{diffIncasso >= 0 ? '+' : ''}{fmtEur(diffIncasso)}{Math.abs(diffIncasso) < 0.01 ? ' ✓' : ' ⚠️'}</span>
        </div>
      </Sezione>
      <Sezione titolo="Uscite Contante" badge={totUscite} color="#ef4444">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <CampoNum label="USCITA CONTANTE" fieldKey="uscita_contante" form={form} onChange={onChange} />
          <CampoNum label="VERSAMENTO BANCA" fieldKey="versamento_contante" form={form} onChange={onChange} />
          <CampoNum label="FATTURA SIFAR" fieldKey="fattura_sifar" form={form} onChange={onChange} />
          <CampoNum label="ACQUISTO DA PRIVATI" fieldKey="acquisto_privati" form={form} onChange={onChange} highlight />
          <CampoNum label="SPOSTAMENTO CONTANTE" fieldKey="spostamento_contante" form={form} onChange={onChange} />
          <CampoNum label="CONTANTE DA VERSARE" fieldKey="contante_da_versare" form={form} onChange={onChange} />
        </div>
      </Sezione>
      <FondoCassa form={form} onChange={onChange} />
      <Sezione titolo="Note e Operatore" color="#94a3b8">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 5 }}>NOTE</label>
            <textarea value={form.note} onChange={e => onChange('note', e.target.value)} placeholder="Es. €50 Samsung A16..." rows={3}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 5 }}>OPERATORE</label>
            <input value={form.operatore} onChange={e => onChange('operatore', e.target.value)} placeholder="Nome operatore"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
      </Sezione>
      <button onClick={salva} disabled={saving} style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', background: saved ? '#22c55e' : saving ? 'rgba(99,102,241,0.4)' : '#6366f1', color: '#fff', fontSize: 16, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
        {saving ? '⏳ Salvataggio...' : saved ? '✓ Salvato!' : esistente ? '💾 Aggiorna chiusura' : '💾 Salva chiusura'}
      </button>
    </div>
  );
}

function TabDashboard() {
  const anno = new Date().getFullYear();
  const meseCorrente = new Date().getMonth() + 1;
  const [sommario, setSommario] = useState([]);
  const [chiusure, setChiusure] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([
      fetch(`${API}/cassa/sommario?anno=${anno}`).then(r => r.json()),
      fetch(`${API}/cassa?anno=${anno}`).then(r => r.json())
    ]).then(([som, chi]) => { setSommario(Array.isArray(som)?som:[]); setChiusure(Array.isArray(chi)?chi:[]); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  if (loading) return <div style={{textAlign:'center',padding:'60px 0',color:'#64748b'}}>⏳ Caricamento...</div>;
  if (sommario.length === 0) return <div style={{textAlign:'center',padding:'60px 0',color:'#64748b'}}>Nessun dato. Inserisci le prime chiusure.</div>;
  const tot = sommario.reduce((a,m) => ({ fiscale:a.fiscale+(m.tot_fiscale||0), fatture:a.fatture+(m.tot_fatture||0), art36:a.art36+(m.tot_art36||0), incasso:a.incasso+(m.tot_incasso||0), contanti:a.contanti+(m.tot_contanti||0), pos:a.pos+(m.tot_pos||0) }), {fiscale:0,fatture:0,art36:0,incasso:0,contanti:0,pos:0});
  const ultime7 = chiusure.slice(0,7).reverse();
  const maxGiorno = Math.max(...ultime7.map(c => n(c.chiusura_fiscale)+n(c.fatturato)+n(c.fatturato_art36)), 1);
  const maxMese = Math.max(...sommario.map(m => m.tot_incasso||0), 1);
  const mixIncassi = [
    {label:'Contanti',val:tot.contanti,color:'#f59e0b'},
    {label:'POS',val:tot.pos,color:'#6366f1'},
    {label:'Satispay',val:sommario.reduce((s,m)=>s+(m.tot_satispay||0),0),color:'#22c55e'},
    {label:'Bonifico',val:sommario.reduce((s,m)=>s+(m.tot_bonifico||0),0),color:'#a5b4fc'},
    {label:'Compass',val:sommario.reduce((s,m)=>s+(m.tot_compass||0),0),color:'#f87171'},
    {label:'Stripe',val:sommario.reduce((s,m)=>s+(m.tot_stripe||0),0),color:'#34d399'},
  ].filter(i=>i.val>0);
  const totMix = mixIncassi.reduce((s,i)=>s+i.val,0)||1;
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
        {[{label:'Incasso Anno',val:tot.incasso,color:'#22c55e',icon:'💰'},{label:'Fiscale Anno',val:tot.fiscale,color:'#6366f1',icon:'🧾'},{label:'Fatturato',val:tot.fatture,color:'#a5b4fc',icon:'📄'},{label:'Art. 36',val:tot.art36,color:'#f59e0b',icon:'🔄'}].map(k=>(
          <div key={k.label} style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'20px',borderTop:`3px solid ${k.color}`}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
              <div style={{fontSize:11,color:'#64748b',fontWeight:600}}>{k.label.toUpperCase()}</div>
              <span style={{fontSize:18}}>{k.icon}</span>
            </div>
            <div style={{fontSize:24,fontWeight:800,color:k.color}}>{fmtEur(k.val)}</div>
            <div style={{fontSize:11,color:'#475569',marginTop:4}}>{anno} · {sommario.length} mesi</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:'#e2e8f0',marginBottom:20}}>Incasso mensile {anno}</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:8,height:140}}>
            {sommario.map(m => {
              const h = Math.round((m.tot_incasso/maxMese)*120);
              const isCurr = m.mese===meseCorrente;
              return (
                <div key={m.mese} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <div style={{fontSize:9,color:'#64748b'}}>{fmt(m.tot_incasso||0).split(',')[0]}</div>
                  <div style={{width:'100%',height:h+'px',background:isCurr?'#22c55e':'rgba(99,102,241,0.5)',borderRadius:'4px 4px 0 0',minHeight:4}} title={`${MESI[m.mese]}: ${fmtEur(m.tot_incasso)}`} />
                  <div style={{fontSize:9,color:isCurr?'#22c55e':'#475569',fontWeight:isCurr?700:400}}>{MESI[m.mese].slice(0,3)}</div>
                </div>
              );
            })}
          </div>
          <div style={{display:'flex',gap:12,marginTop:10}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:10,height:10,borderRadius:2,background:'#22c55e'}} /><span style={{color:'#64748b',fontSize:11}}>Mese corrente</span></div>
            <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:10,height:10,borderRadius:2,background:'rgba(99,102,241,0.5)'}} /><span style={{color:'#64748b',fontSize:11}}>Altri mesi</span></div>
          </div>
        </div>
        <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:'#e2e8f0',marginBottom:20}}>Mix incassi anno</div>
          {mixIncassi.map(i=>(
            <div key={i.label} style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{color:'#94a3b8',fontSize:13}}>{i.label}</span>
                <span style={{color:i.color,fontWeight:700,fontSize:13}}>{fmtEur(i.val)} · {((i.val/totMix)*100).toFixed(1)}%</span>
              </div>
              <div style={{height:6,borderRadius:3,background:'rgba(255,255,255,0.06)'}}>
                <div style={{height:'100%',width:((i.val/totMix)*100)+'%',background:i.color,borderRadius:3}} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {ultime7.length>0&&(
        <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:20,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:'#e2e8f0',marginBottom:16}}>Ultime 7 chiusure</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:12,height:100,marginBottom:8}}>
            {ultime7.map(c=>{
              const totC=n(c.chiusura_fiscale)+n(c.fatturato)+n(c.fatturato_art36);
              const h=Math.round((totC/maxGiorno)*80);
              return(
                <div key={c.data} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <div style={{fontSize:9,color:'#64748b'}}>{fmt(totC).split(',')[0]}</div>
                  <div style={{width:'100%',height:h+'px',background:'rgba(99,102,241,0.6)',borderRadius:'4px 4px 0 0',minHeight:4}} />
                  <div style={{fontSize:9,color:'#475569'}}>{c.data.split('-').reverse().join('/').slice(0,5)}</div>
                  {c.operatore&&<div style={{fontSize:8,color:'#334155'}}>{c.operatore}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,overflow:'hidden'}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}><span style={{color:'#e2e8f0',fontWeight:700}}>Riepilogo per mese</span></div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>{['MESE','GG','FISCALE','FATTURE','ART.36','INCASSO TOT','CONTANTI','POS','SATISPAY'].map(h=><th key={h} style={{padding:'9px 12px',color:'#64748b',fontSize:10,fontWeight:600,textAlign:h==='MESE'||h==='GG'?'left':'right'}}>{h}</th>)}</tr></thead>
          <tbody>{sommario.map(m=>(<tr key={m.mese} style={{borderBottom:'1px solid rgba(255,255,255,0.03)',background:m.mese===meseCorrente?'rgba(34,197,94,0.03)':'transparent'}}><td style={{padding:'10px 12px',color:m.mese===meseCorrente?'#22c55e':'#e2e8f0',fontWeight:m.mese===meseCorrente?700:400}}>{MESI[m.mese]}</td><td style={{padding:'10px 12px',color:'#64748b'}}>{m.giorni}</td><td style={{padding:'10px 12px',color:'#a5b4fc',textAlign:'right'}}>{fmtEur(m.tot_fiscale)}</td><td style={{padding:'10px 12px',color:'#e2e8f0',textAlign:'right'}}>{fmtEur(m.tot_fatture)}</td><td style={{padding:'10px 12px',color:'#e2e8f0',textAlign:'right'}}>{fmtEur(m.tot_art36)}</td><td style={{padding:'10px 12px',color:'#22c55e',fontWeight:700,textAlign:'right'}}>{fmtEur(m.tot_incasso)}</td><td style={{padding:'10px 12px',color:'#f59e0b',textAlign:'right'}}>{fmtEur(m.tot_contanti)}</td><td style={{padding:'10px 12px',color:'#e2e8f0',textAlign:'right'}}>{fmtEur(m.tot_pos)}</td><td style={{padding:'10px 12px',color:'#e2e8f0',textAlign:'right'}}>{fmtEur(m.tot_satispay)}</td></tr>))}</tbody>
          <tfoot><tr style={{borderTop:'2px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.02)'}}><td style={{padding:'11px 12px',color:'#e2e8f0',fontWeight:700}}>TOTALE</td><td style={{padding:'11px 12px',color:'#64748b',fontWeight:600}}>{sommario.reduce((s,m)=>s+m.giorni,0)}</td><td style={{padding:'11px 12px',color:'#a5b4fc',fontWeight:700,textAlign:'right'}}>{fmtEur(tot.fiscale)}</td><td style={{padding:'11px 12px',color:'#e2e8f0',fontWeight:700,textAlign:'right'}}>{fmtEur(tot.fatture)}</td><td style={{padding:'11px 12px',color:'#e2e8f0',fontWeight:700,textAlign:'right'}}>{fmtEur(tot.art36)}</td><td style={{padding:'11px 12px',color:'#22c55e',fontWeight:800,fontSize:15,textAlign:'right'}}>{fmtEur(tot.incasso)}</td><td style={{padding:'11px 12px',color:'#f59e0b',fontWeight:700,textAlign:'right'}}>{fmtEur(tot.contanti)}</td><td style={{padding:'11px 12px',color:'#e2e8f0',fontWeight:700,textAlign:'right'}}>{fmtEur(tot.pos)}</td><td/></tr></tfoot>
        </table>
      </div>
    </div>
  );
}

function TabExport({ showToast }) {
  const annoOggi = new Date().getFullYear();
  const meseOggi = new Date().getMonth() + 1;
  const today = new Date().toISOString().slice(0,10);
  const [tipo, setTipo] = useState('mese');
  const [dataGiorno, setDataGiorno] = useState(today);
  const [meseSelezionato, setMeseSelezionato] = useState(meseOggi);
  const [annoSelezionato, setAnnoSelezionato] = useState(annoOggi);
  const [exporting, setExporting] = useState(false);

  function generaCSV(righe, intestazione) {
    const bom = '\uFEFF';
    return bom + intestazione.join(';') + '\n' + righe.map(r => r.join(';')).join('\n');
  }
  function scaricaFile(contenuto, nomeFile) {
    const blob = new Blob([contenuto], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = nomeFile; a.click();
    URL.revokeObjectURL(url);
  }
  function generaHTML(titolo, dati, colonne) {
    const righe = dati.map(r => '<tr>' + colonne.map(c => '<td>' + (r[c.key] !== undefined ? r[c.key] : '') + '</td>').join('') + '</tr>').join('');
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;margin:30px;color:#111}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#1e293b;color:#fff;padding:8px 10px;text-align:left}td{padding:7px 10px;border-bottom:1px solid #e2e8f0}tr:nth-child(even) td{background:#f8fafc}</style></head><body><h1>' + titolo + '</h1><table><thead><tr>' + colonne.map(c => '<th>' + c.label + '</th>').join('') + '</tr></thead><tbody>' + righe + '</tbody></table></body></html>';
  }

  async function esportaGiorno() {
    setExporting(true);
    try {
      const d = await fetch(API + '/cassa/' + dataGiorno).then(r => r.json());
      if (!d) { showToast('Nessun dato', 'error'); setExporting(false); return; }
      const totInc = n(d.contanti)+n(d.pos)+n(d.satispay)+n(d.assegni)+n(d.bonifico)+n(d.compass)+n(d.stripe);
      const totUsc = n(d.uscita_contante)+n(d.versamento_contante)+n(d.fattura_sifar)+n(d.acquisto_privati)+n(d.spostamento_contante);
      const fondo = TAGLIE_FONDO.reduce((s,t) => s+(n(d[t.key])*t.val), 0);
      const righe = [['Data', dataGiorno.split('-').reverse().join('/')],['',''],['Chiusura Fiscale',fmt(d.chiusura_fiscale)],['Fatturato',fmt(d.fatturato)],['Fatturato Art.36',fmt(d.fatturato_art36)],['Chiusura Totale',fmt(n(d.chiusura_fiscale)+n(d.fatturato)+n(d.fatturato_art36))],['',''],['Contanti',fmt(d.contanti)],['POS',fmt(d.pos)],['Satispay',fmt(d.satispay)],['Bonifico',fmt(d.bonifico)],['Compass',fmt(d.compass)],['Stripe',fmt(d.stripe)],['TOTALE INCASSATO',fmt(totInc)],['',''],['Uscita contante',fmt(d.uscita_contante)],['Versamento banca',fmt(d.versamento_contante)],['Fattura Sifar',fmt(d.fattura_sifar)],['Acquisto privati',fmt(d.acquisto_privati)],['TOTALE USCITE',fmt(totUsc)],['',''],['FONDO CASSA',fmt(fondo)],['Contante da versare',fmt(d.contante_da_versare)],['Operatore',d.operatore||''],['Note',(d.note||'').split('\n').join(' | ')]];
      scaricaFile(generaCSV(righe, ['Voce','Importo (€)']), 'chiusura_' + dataGiorno + '.csv');
      showToast('CSV scaricato!', 'success');
    } catch { showToast('Errore export', 'error'); }
    setExporting(false);
  }

  async function esportaMese() {
    setExporting(true);
    try {
      const dati = await fetch(API + '/cassa?anno=' + annoSelezionato + '&mese=' + meseSelezionato).then(r => r.json());
      if (!dati || dati.length === 0) { showToast('Nessun dato', 'error'); setExporting(false); return; }
      const hdr = ['Data','Fiscale','Fatturato','Art.36','Chius.Tot.','Contanti','POS','Satispay','Assegni','Bonifico','Compass','Stripe','Incasso Tot.','Uscite Tot.','Fondo Cassa','Da Versare','Operatore','Note'];
      const righe = dati.sort((a,b) => a.data.localeCompare(b.data)).map(d => {
        const totInc=n(d.contanti)+n(d.pos)+n(d.satispay)+n(d.assegni)+n(d.bonifico)+n(d.compass)+n(d.stripe);
        const totUsc=n(d.uscita_contante)+n(d.versamento_contante)+n(d.fattura_sifar)+n(d.acquisto_privati)+n(d.spostamento_contante);
        const fondo=TAGLIE_FONDO.reduce((s,t)=>s+(n(d[t.key])*t.val),0);
        return [d.data.split('-').reverse().join('/'),fmt(d.chiusura_fiscale),fmt(d.fatturato),fmt(d.fatturato_art36),fmt(n(d.chiusura_fiscale)+n(d.fatturato)+n(d.fatturato_art36)),fmt(d.contanti),fmt(d.pos),fmt(d.satispay),fmt(d.assegni),fmt(d.bonifico),fmt(d.compass),fmt(d.stripe),fmt(totInc),fmt(totUsc),fmt(fondo),fmt(d.contante_da_versare),d.operatore||'',(d.note||'').split('\n').join(' | ')];
      });
      scaricaFile(generaCSV(righe, hdr), 'cassa_' + MESI[meseSelezionato].toLowerCase() + '_' + annoSelezionato + '.csv');
      showToast('CSV mese scaricato!', 'success');
    } catch { showToast('Errore export', 'error'); }
    setExporting(false);
  }

  async function esportaAnno() {
    setExporting(true);
    try {
      const dati = await fetch(API + '/cassa/sommario?anno=' + annoSelezionato).then(r => r.json());
      if (!dati || dati.length === 0) { showToast('Nessun dato', 'error'); setExporting(false); return; }
      const hdr = ['Mese','Giorni','Fiscale','Fatturato','Art.36','Incasso Tot.','Contanti','POS','Satispay','Assegni','Bonifico','Compass','Stripe','Versamenti','Acq.Privati','Da Versare'];
      const righe = dati.map(m => [MESI[m.mese],m.giorni,fmt(m.tot_fiscale),fmt(m.tot_fatture),fmt(m.tot_art36),fmt(m.tot_incasso),fmt(m.tot_contanti),fmt(m.tot_pos),fmt(m.tot_satispay||0),fmt(m.tot_assegni||0),fmt(m.tot_bonifico),fmt(m.tot_compass||0),fmt(m.tot_stripe||0),fmt(m.tot_versamenti||0),fmt(m.tot_acquisti_privati||0),fmt(m.tot_da_versare||0)]);
      const tot = dati.reduce((a,m) => ({g:a.g+m.giorni,f:a.f+(m.tot_fiscale||0),fa:a.fa+(m.tot_fatture||0),a36:a.a36+(m.tot_art36||0),i:a.i+(m.tot_incasso||0),c:a.c+(m.tot_contanti||0),p:a.p+(m.tot_pos||0)}),{g:0,f:0,fa:0,a36:0,i:0,c:0,p:0});
      righe.push(['TOTALE ' + annoSelezionato, tot.g, fmt(tot.f), fmt(tot.fa), fmt(tot.a36), fmt(tot.i), fmt(tot.c), fmt(tot.p), '', '', '', '', '', '', '', '']);
      scaricaFile(generaCSV(righe, hdr), 'cassa_anno_' + annoSelezionato + '.csv');
      showToast('CSV anno scaricato!', 'success');
    } catch { showToast('Errore export', 'error'); }
    setExporting(false);
  }

  async function stampaPDF(modalita) {
    setExporting(true);
    try {
      let titolo, dati, colonne;
      if (modalita === 'giorno') {
        const d = await fetch(API + '/cassa/' + dataGiorno).then(r => r.json());
        if (!d) { showToast('Nessun dato', 'error'); setExporting(false); return; }
        const totInc = n(d.contanti)+n(d.pos)+n(d.satispay)+n(d.assegni)+n(d.bonifico)+n(d.compass)+n(d.stripe);
        titolo = 'Chiusura Cassa ' + dataGiorno.split('-').reverse().join('/');
        dati = [{v:'Chiusura Fiscale',i:fmtEur(d.chiusura_fiscale)},{v:'Fatturato',i:fmtEur(d.fatturato)},{v:'Art.36',i:fmtEur(d.fatturato_art36)},{v:'TOTALE INCASSATO',i:fmtEur(totInc)},{v:'Contanti',i:fmtEur(d.contanti)},{v:'POS',i:fmtEur(d.pos)},{v:'Satispay',i:fmtEur(d.satispay)},{v:'Operatore',i:d.operatore||''},{v:'Note',i:(d.note||'').split('\n').join(' | ')}];
        colonne = [{key:'v',label:'Voce'},{key:'i',label:'Importo'}];
      } else if (modalita === 'mese') {
        const d = await fetch(API + '/cassa?anno=' + annoSelezionato + '&mese=' + meseSelezionato).then(r => r.json());
        titolo = 'Cassa ' + MESI[meseSelezionato] + ' ' + annoSelezionato;
        dati = (d||[]).sort((a,b) => a.data.localeCompare(b.data)).map(c => { const totInc=n(c.contanti)+n(c.pos)+n(c.satispay)+n(c.assegni)+n(c.bonifico)+n(c.compass)+n(c.stripe); return {data:c.data.split('-').reverse().join('/'),fiscale:fmtEur(c.chiusura_fiscale),incasso:fmtEur(totInc),contanti:fmtEur(c.contanti),pos:fmtEur(c.pos),op:c.operatore||''}; });
        colonne = [{key:'data',label:'Data'},{key:'fiscale',label:'Fiscale'},{key:'incasso',label:'Incasso Tot.'},{key:'contanti',label:'Contanti'},{key:'pos',label:'POS'},{key:'op',label:'Operatore'}];
      } else {
        const d = await fetch(API + '/cassa/sommario?anno=' + annoSelezionato).then(r => r.json());
        titolo = 'Sommario Cassa Anno ' + annoSelezionato;
        dati = (d||[]).map(m => ({mese:MESI[m.mese],gg:m.giorni,fiscale:fmtEur(m.tot_fiscale),incasso:fmtEur(m.tot_incasso),contanti:fmtEur(m.tot_contanti),pos:fmtEur(m.tot_pos)}));
        colonne = [{key:'mese',label:'Mese'},{key:'gg',label:'GG'},{key:'fiscale',label:'Fiscale'},{key:'incasso',label:'Incasso'},{key:'contanti',label:'Contanti'},{key:'pos',label:'POS'}];
      }
      const w = window.open('', '_blank'); w.document.write(generaHTML(titolo, dati, colonne)); w.document.close(); w.print();
      showToast('PDF aperto!', 'success');
    } catch { showToast('Errore PDF', 'error'); }
    setExporting(false);
  }

  const iStyle = {padding:'9px 12px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',fontSize:14,outline:'none'};
  const bStyle = (color) => ({padding:'10px 20px',borderRadius:10,border:'none',background:color,color:'#fff',cursor:exporting?'not-allowed':'pointer',fontSize:13,fontWeight:600,opacity:exporting?0.6:1});
  const nota = (txt) => <div style={{marginTop:14,padding:'10px 14px',background:'rgba(255,255,255,0.03)',borderRadius:8,fontSize:12,color:'#475569'}}>{txt}</div>;

  return (
    <div style={{maxWidth:700}}>
      <div style={{display:'flex',gap:8,marginBottom:24}}>
        {[['giorno','📅 Giorno'],['mese','📆 Mese'],['anno','📈 Anno']].map(([k,l]) => (
          <button key={k} onClick={() => setTipo(k)} style={{padding:'8px 20px',borderRadius:10,border:'1px solid',borderColor:tipo===k?'#6366f1':'rgba(255,255,255,0.1)',background:tipo===k?'rgba(99,102,241,0.15)':'rgba(255,255,255,0.03)',color:tipo===k?'#a5b4fc':'#64748b',cursor:'pointer',fontWeight:600,fontSize:14}}>{l}</button>
        ))}
      </div>
      {tipo==='giorno' && (
        <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:24}}>
          <h3 style={{color:'#e2e8f0',margin:'0 0 16px'}}>Export chiusura giornaliera</h3>
          <div style={{marginBottom:20}}><div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:6}}>DATA</div><input type="date" value={dataGiorno} onChange={e=>setDataGiorno(e.target.value)} style={iStyle} /></div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={esportaGiorno} disabled={exporting} style={bStyle('#22c55e')}>📥 Scarica CSV</button>
            <button onClick={() => stampaPDF('giorno')} disabled={exporting} style={bStyle('#6366f1')}>🗈️ Stampa PDF</button>
          </div>
          {nota('CSV con tutte le voci: vendite, incassi per tipo, uscite contante, fondo cassa, operatore e note.')}
        </div>
      )}
      {tipo==='mese' && (
        <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:24}}>
          <h3 style={{color:'#e2e8f0',margin:'0 0 16px'}}>Export mensile</h3>
          <div style={{display:'flex',gap:12,marginBottom:20}}>
            <div><div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:6}}>MESE</div><select value={meseSelezionato} onChange={e=>setMeseSelezionato(Number(e.target.value))} style={iStyle}>{MESI.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select></div>
            <div><div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:6}}>ANNO</div><select value={annoSelezionato} onChange={e=>setAnnoSelezionato(Number(e.target.value))} style={iStyle}>{[2024,2025,2026,2027].map(a=><option key={a} value={a}>{a}</option>)}</select></div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={esportaMese} disabled={exporting} style={bStyle('#22c55e')}>📥 Scarica CSV dettaglio</button>
            <button onClick={() => stampaPDF('mese')} disabled={exporting} style={bStyle('#6366f1')}>🗈️ Stampa PDF riepilogo</button>
          </div>
          {nota('Una riga per ogni giorno con tutti gli incassi, uscite, fondo cassa e operatore. Include riga TOTALE finale.')}
        </div>
      )}
      {tipo==='anno' && (
        <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:24}}>
          <h3 style={{color:'#e2e8f0',margin:'0 0 16px'}}>Export annuale (sommario)</h3>
          <div style={{marginBottom:20}}><div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:6}}>ANNO</div><select value={annoSelezionato} onChange={e=>setAnnoSelezionato(Number(e.target.value))} style={iStyle}>{[2024,2025,2026,2027].map(a=><option key={a} value={a}>{a}</option>)}</select></div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={esportaAnno} disabled={exporting} style={bStyle('#22c55e')}>📥 Scarica CSV sommario</button>
            <button onClick={() => stampaPDF('anno')} disabled={exporting} style={bStyle('#6366f1')}>🗈️ Stampa PDF anno</button>
          </div>
          {nota('Riepilogo mensile: totali fiscale, incasso, contanti, POS, versamenti, acquisti privati, contante da versare.')}
        </div>
      )}
    </div>
  );
}

export default function Cassa({ showToast }) {
  const [tab, setTab] = useState('chiusura');
  const toast = showToast || ((msg, t) => console.log(t, msg));
  const TABS = [{key:'chiusura',label:'📋 Chiusura Giornaliera'},{key:'dashboard',label:'📊 Dashboard'},{key:'export',label:'📥 Export & Stampa'}];
  return (
    <div style={{padding:'24px 28px',maxWidth:1200,margin:'0 auto'}}>
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <h2 style={{margin:0,fontSize:22,fontWeight:700,color:'#e2e8f0'}}>💰 Cassa</h2>
          <div style={{padding:'3px 10px',borderRadius:20,background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.3)',fontSize:11,fontWeight:700,color:'#a5b4fc'}}>AMMINISTRAZIONE</div>
        </div>
        <p style={{margin:0,color:'#64748b',fontSize:13}}>Chiusura giornaliera · Dashboard · Export CSV & PDF</p>
      </div>
      <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        {TABS.map(t => <button key={t.key} onClick={() => setTab(t.key)} style={{padding:'10px 22px',background:'none',border:'none',cursor:'pointer',color:tab===t.key?'#a5b4fc':'#64748b',borderBottom:tab===t.key?'2px solid #6366f1':'2px solid transparent',fontSize:14,fontWeight:tab===t.key?600:400,marginBottom:-1}}>{t.label}</button>)}
      </div>
      {tab==='chiusura' && <TabChiusura showToast={toast} />}
      {tab==='dashboard' && <TabDashboard />}
      {tab==='export' && <TabExport showToast={toast} />}
    </div>
  );
}
