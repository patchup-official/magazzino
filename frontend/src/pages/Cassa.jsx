// pages/Cassa.jsx — Plugin Cassa Giornaliera
import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const MESI = ['', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

const fmt = (n) => Number(n || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtEur = (n) => '€ ' + fmt(n);

const TAGLIE_FONDO = [
  { key: 'fc_100', label: '€ 100', val: 100 },
  { key: 'fc_50',  label: '€ 50',  val: 50  },
  { key: 'fc_20',  label: '€ 20',  val: 20  },
  { key: 'fc_10',  label: '€ 10',  val: 10  },
  { key: 'fc_5',   label: '€ 5',   val: 5   },
  { key: 'fc_2',   label: '€ 2',   val: 2   },
  { key: 'fc_1',   label: '€ 1',   val: 1   },
  { key: 'fc_050', label: '50 ct', val: 0.5  },
  { key: 'fc_020', label: '20 ct', val: 0.2  },
  { key: 'fc_010', label: '10 ct', val: 0.1  },
  { key: 'fc_005', label: '5 ct',  val: 0.05 },
  { key: 'fc_002', label: '2 ct',  val: 0.02 },
  { key: 'fc_001', label: '1 ct',  val: 0.01 },
];

const EMPTY_FORM = {
  chiusura_fiscale: '', fatturato: '', fatturato_art36: '',
  contanti: '', pos: '', satispay: '', assegni: '', bonifico: '', compass: '', stripe: '',
  uscita_contante: '', versamento_contante: '', fattura_sifar: '', acquisto_privati: '', spostamento_contante: '',
  fc_100: '', fc_50: '', fc_20: '', fc_10: '', fc_5: '', fc_2: '', fc_1: '',
  fc_050: '', fc_020: '', fc_010: '', fc_005: '', fc_002: '', fc_001: '',
  contante_da_versare: '', note: '', operatore: ''
};

function n(v) { return parseFloat(v) || 0; }

function CampoNum({ label, fieldKey, form, onChange, highlight }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.5 }}>{label}</label>
      <input
        type="number" min="0" step="0.01"
        value={form[fieldKey]}
        placeholder="0,00"
        onChange={e => onChange(fieldKey, e.target.value)}
        style={{
          padding: '8px 10px', borderRadius: 8,
          background: highlight ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${highlight ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.1)'}`,
          color: '#e2e8f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box'
        }}
      />
    </div>
  );
}

function Sezione({ titolo, badge, children, color = '#6366f1' }) {
  return (
    <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 4, height: 20, borderRadius: 2, background: color }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', letterSpacing: 0.3 }}>{titolo}</span>
        {badge !== undefined && (
          <span style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 800, color }}>{fmtEur(badge)}</span>
        )}
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
            <input
              type="number" min="0" step="1"
              value={form[t.key]} placeholder="0"
              onChange={e => onChange(t.key, e.target.value)}
              style={{
                padding: '7px 10px', borderRadius: 8,
                background: n(form[t.key]) > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${n(form[t.key]) > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)'}`,
                color: '#e2e8f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box'
              }}
            />
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

  const onChange = useCallback((k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
  }, []);

  useEffect(() => {
    fetch(`${API}/cassa/${dataSelezionata}`)
      .then(r => r.json())
      .then(data => {
        if (data) {
          setEsistente(true);
          const f = { ...EMPTY_FORM };
          Object.keys(f).forEach(k => { f[k] = data[k] !== undefined && data[k] !== null ? String(data[k]) : ''; });
          setForm(f);
        } else {
          setEsistente(false);
          setForm(EMPTY_FORM);
        }
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
      const r = await fetch(`${API}/cassa`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (r.ok) {
        setSaved(true); setEsistente(true);
        showToast('Chiusura salvata!', 'success');
        setTimeout(() => setSaved(false), 2000);
      } else { const e = await r.json(); showToast(e.error || 'Errore', 'error'); }
    } catch (e) { showToast('Errore di rete', 'error'); }
    setSaving(false);
  }

  const isToday = dataSelezionata === today;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, flex: '0 0 auto' }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.5, marginBottom: 6 }}>DATA CHIUSURA</div>
            <input type="date" value={dataSelezionata} onChange={e => setDataSelezionata(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 15, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {isToday && <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 11, fontWeight: 600 }}>● Oggi</span>}
            {esistente && <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontSize: 11, fontWeight: 600 }}>✓ Già compilata</span>}
          </div>
        </div>
        {[{ label: 'Chiusura Totale', val: chiusuraTotale, color: '#6366f1' }, { label: 'Incassato', val: totIncassato, color: '#22c55e' }, { label: 'Differenza', val: diffIncasso, color: Math.abs(diffIncasso) < 0.01 ? '#22c55e' : '#ef4444' }, { label: 'Fondo Cassa', val: fondoCassa, color: '#f59e0b' }].map(k => (
          <div key={k.label} style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 18px', flex: 1, minWidth: 130 }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.5, marginBottom: 6 }}>{k.label.toUpperCase()}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{fmtEur(k.val)}</div>
          </div>
        ))}
      </div>

      <Sezione titolo="Vendite del giorno" badge={chiusuraTotale} color="#6366f1">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <CampoNum label="CHIUSURA FISCALE (scontrini)" fieldKey="chiusura_fiscale" form={form} onChange={onChange} highlight />
          <CampoNum label="FATTURATO" fieldKey="fatturato" form={form} onChange={onChange} />
          <CampoNum label="FATTURATO ART. 36 (usato)" fieldKey="fatturato_art36" form={form} onChange={onChange} />
        </div>
        <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(99,102,241,0.06)', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>Chiusura totale (fiscale + fatture + art.36)</span>
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
          <span style={{ fontWeight: 700, color: Math.abs(diffIncasso) < 0.01 ? '#22c55e' : '#ef4444', fontSize: 15 }}>
            {diffIncasso >= 0 ? '+' : ''}{fmtEur(diffIncasso)}{Math.abs(diffIncasso) < 0.01 ? ' ✓' : ' ⚠️'}
          </span>
        </div>
      </Sezione>

      <Sezione titolo="Uscite Contante" badge={totUscite} color="#ef4444">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <CampoNum label="USCITA CONTANTE GENERICA" fieldKey="uscita_contante" form={form} onChange={onChange} />
          <CampoNum label="VERSAMENTO IN BANCA" fieldKey="versamento_contante" form={form} onChange={onChange} />
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
            <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>NOTE (es. acquisti privati, spese, anomalie)</label>
            <textarea value={form.note} onChange={e => onChange('note', e.target.value)}
              placeholder="Es. 22/01 €50 Samsung A16..." rows={4}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>OPERATORE</label>
            <input value={form.operatore} onChange={e => onChange('operatore', e.target.value)}
              placeholder="Nome operatore"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
      </Sezione>

      <button onClick={salva} disabled={saving} style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', background: saved ? '#22c55e' : saving ? 'rgba(99,102,241,0.4)' : '#6366f1', color: '#fff', fontSize: 16, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.3)', marginBottom: 8 }}>
        {saving ? '⏳ Salvataggio...' : saved ? '✓ Salvato!' : esistente ? '💾 Aggiorna chiusura' : '💾 Salva chiusura'}
      </button>
      <div style={{ textAlign: 'center', fontSize: 12, color: '#475569' }}>
        {esistente ? 'Aggiorna la chiusura esistente per ' : 'Nuova chiusura per '}{dataSelezionata}
      </div>
    </div>
  );
}

function TabStorico() {
  const anno = new Date().getFullYear();
  const [sommario, setSommario] = useState([]);
  const [chiusure, setChiusure] = useState([]);
  const [meseAperto, setMeseAperto] = useState(null);
  useEffect(() => {
    fetch(`${API}/cassa/sommario?anno=${anno}`).then(r=>r.json()).then(setSommario).catch(()=>{});
    fetch(`${API}/cassa?anno=${anno}`).then(r=>r.json()).then(setChiusure).catch(()=>{});
  }, []);
  const tot = sommario.reduce((a,m) => ({ fiscale: a.fiscale+(m.tot_fiscale||0), fatture: a.fatture+(m.tot_fatture||0), art36: a.art36+(m.tot_art36||0), incasso: a.incasso+(m.tot_incasso||0) }), {fiscale:0,fatture:0,art36:0,incasso:0});
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
        {[{label:'Fiscale Anno',val:tot.fiscale,color:'#6366f1'},{label:'Fatturato',val:tot.fatture,color:'#22c55e'},{label:'Art.36',val:tot.art36,color:'#a5b4fc'},{label:'Incasso Totale',val:tot.incasso,color:'#f59e0b'}].map(k=>(
          <div key={k.label} style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'18px 20px'}}>
            <div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:8}}>{k.label.toUpperCase()}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.color}}>{fmtEur(k.val)}</div>
          </div>
        ))}
      </div>
      <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,overflow:'hidden'}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between'}}>
          <span style={{color:'#e2e8f0',fontWeight:700}}>Riepilogo mensile {anno}</span>
          <span style={{color:'#64748b',fontSize:13}}>{sommario.length} mesi con dati</span>
        </div>
        {sommario.length===0 && <div style={{textAlign:'center',padding:'48px 0',color:'#475569'}}>Nessuna chiusura per il {anno}. Inizia dalla scheda Chiusura Giornaliera.</div>}
        {sommario.map(m => (
          <div key={m.mese}>
            <div onClick={()=>setMeseAperto(meseAperto===m.mese?null:m.mese)} style={{display:'flex',gap:16,padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.04)',cursor:'pointer',alignItems:'center'}}>
              <span style={{color:'#e2e8f0',fontWeight:600,minWidth:120}}>{meseAperto===m.mese?'▾':'▸'} {MESI[m.mese]}</span>
              <span style={{color:'#64748b',minWidth:30}}>{m.giorni}gg</span>
              <span style={{color:'#a5b4fc',minWidth:120}}>Fisc: {fmtEur(m.tot_fiscale)}</span>
              <span style={{color:'#22c55e',fontWeight:700,minWidth:130}}>Inc: {fmtEur(m.tot_incasso)}</span>
              <span style={{color:'#94a3b8',minWidth:110}}>Cash: {fmtEur(m.tot_contanti)}</span>
              <span style={{color:'#94a3b8',minWidth:100}}>POS: {fmtEur(m.tot_pos)}</span>
              <span style={{color:'#94a3b8'}}>Bon: {fmtEur(m.tot_bonifico)}</span>
            </div>
            {meseAperto===m.mese && (
              <div style={{padding:'8px 20px 12px',background:'rgba(99,102,241,0.03)'}}>
                {chiusure.filter(c=>c.mese===m.mese).sort((a,b)=>b.data.localeCompare(a.data)).map(c => {
                  const totInc = n(c.contanti)+n(c.pos)+n(c.satispay)+n(c.assegni)+n(c.bonifico)+n(c.compass)+n(c.stripe);
                  return (
                    <div key={c.data} style={{display:'flex',gap:14,padding:'7px 10px',background:'rgba(255,255,255,0.02)',borderRadius:8,fontSize:12,alignItems:'center',marginBottom:4}}>
                      <span style={{color:'#64748b',minWidth:80}}>{c.data.split('-').reverse().join('/')}</span>
                      <span style={{color:'#a5b4fc'}}>Fisc: {fmtEur(c.chiusura_fiscale)}</span>
                      <span style={{color:'#22c55e',fontWeight:600}}>Inc: {fmtEur(totInc)}</span>
                      {c.contanti>0&&<span style={{color:'#94a3b8'}}>Cash: {fmtEur(c.contanti)}</span>}
                      {c.pos>0&&<span style={{color:'#94a3b8'}}>POS: {fmtEur(c.pos)}</span>}
                      {c.acquisto_privati>0&&<span style={{color:'#f59e0b'}}>Acq: {fmtEur(c.acquisto_privati)}</span>}
                      {c.operatore&&<span style={{color:'#475569',marginLeft:'auto'}}>{c.operatore}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {sommario.length>0&&(
          <div style={{display:'flex',gap:16,padding:'14px 20px',borderTop:'2px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.02)',fontWeight:700}}>
            <span style={{color:'#e2e8f0',minWidth:120}}>TOTALE {anno}</span>
            <span style={{color:'#64748b',minWidth:30}}>{sommario.reduce((s,m)=>s+m.giorni,0)}gg</span>
            <span style={{color:'#a5b4fc',minWidth:120}}>Fisc: {fmtEur(tot.fiscale)}</span>
            <span style={{color:'#22c55e',fontSize:15,minWidth:130}}>Inc: {fmtEur(tot.incasso)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Cassa({ showToast }) {
  const [tab, setTab] = useState('chiusura');
  const toast = showToast || ((msg, t) => console.log(t, msg));
  const TABS = [{ key: 'chiusura', label: '📋 Chiusura Giornaliera' }, { key: 'storico', label: '📊 Storico & Sommario' }];
  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>💰 Cassa</h2>
          <div style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 11, fontWeight: 700, color: '#a5b4fc' }}>AMMINISTRAZIONE</div>
        </div>
        <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Chiusura giornaliera · Incassi · Fondo cassa · Sommario mensile</p>
      </div>
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '10px 22px', background: 'none', border: 'none', cursor: 'pointer', color: tab===t.key ? '#a5b4fc' : '#64748b', borderBottom: tab===t.key ? '2px solid #6366f1' : '2px solid transparent', fontSize: 14, fontWeight: tab===t.key ? 600 : 400, marginBottom: -1 }}>{t.label}</button>
        ))}
      </div>
      {tab==='chiusura' && <TabChiusura showToast={toast} />}
      {tab==='storico' && <TabStorico />}
    </div>
  );
}
