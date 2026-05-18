import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ASSISTENZE = [
  { cat: 'Display e vetro', icon: 'ti-device-mobile', items: [
    { label: 'Sostituzione Vetro e Display', orig: false, fonedayQ: 'display' },
    { label: 'Sostituzione Vetro e Display ORIGINALE', orig: true, fonedayQ: 'display' },
    { label: 'Riparazione Vetrino Fotocamera posteriore', orig: false, fonedayQ: 'camera lens glass' },
  ]},
  { cat: 'Batteria', icon: 'ti-battery-charging', items: [
    { label: 'Sostituzione Batteria', orig: false, fonedayQ: 'battery' },
    { label: 'Sostituzione Batteria ORIGINALE', orig: true, fonedayQ: 'battery' },
  ]},
  { cat: 'Fotocamera', icon: 'ti-camera', items: [
    { label: 'Riparazione Fotocamera Anteriore', orig: false, fonedayQ: 'front camera' },
    { label: 'Riparazione Fotocamera Posteriore', orig: false, fonedayQ: 'rear camera' },
  ]},
  { cat: 'Audio', icon: 'ti-volume', items: [
    { label: 'Riparazione Altoparlante', orig: false, fonedayQ: 'speaker' },
    { label: 'Riparazione Suoneria', orig: false, fonedayQ: 'speaker buzzer' },
    { label: 'Riparazione Microfono', orig: false, fonedayQ: 'microphone' },
  ]},
  { cat: 'Tasti e connettori', icon: 'ti-plug', items: [
    { label: 'Riparazione connettore di ricarica', orig: false, fonedayQ: 'charging connector port' },
    { label: 'Riparazione tasti volume', orig: false, fonedayQ: 'volume button flex' },
    { label: 'Riparazione tasto accensione', orig: false, fonedayQ: 'power button flex' },
    { label: 'Riparazione Vibrazione', orig: false, fonedayQ: 'vibrator motor' },
  ]},
  { cat: 'Scocca e pulizia', icon: 'ti-sparkles', items: [
    { label: 'Sostituzione Scocca', orig: false, fonedayQ: 'back cover housing' },
    { label: 'Pulizia', orig: false, fonedayQ: null },
    { label: 'Pulizia Ossidazione', orig: false, fonedayQ: null },
  ]},
];

const QUALITY_COLORS = {
  'Service Pack': { bg: '#1e3a5f', text: '#60a5fa' },
  'Pulled':       { bg: '#1a1060', text: '#a78bfa' },
  'Refurbished':  { bg: '#3b1a06', text: '#fb923c' },
  'OEM-Equivalent':{ bg:'#0f3320', text:'#4ade80' },
  'FDX':          { bg: '#1e1060', text: '#818cf8' },
};
function qColor(q) {
  for (const [k,v] of Object.entries(QUALITY_COLORS)) if (q && q.includes(k)) return v;
  return { bg:'rgba(255,255,255,0.06)', text:'#94a3b8' };
}

const S = {
  card: { background:'#0d1526', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14 },
  inp:  { width:'100%', fontSize:13, padding:'7px 10px', borderRadius:7, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.05)', color:'#e2e8f0', fontFamily:'inherit', boxSizing:'border-box' },
  lbl:  { fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.38)', textTransform:'uppercase', letterSpacing:'.07em', display:'block', marginBottom:5 },
  btnPrimary: { fontSize:13, fontWeight:600, padding:'9px 22px', borderRadius:8, border:'none', background:'#22c55e', color:'white', cursor:'pointer', fontFamily:'inherit' },
  btnSecondary: { fontSize:13, padding:'9px 16px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'#94a3b8', cursor:'pointer', fontFamily:'inherit' },
  btnGhost: { fontSize:12, padding:'6px 12px', borderRadius:7, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'#94a3b8', cursor:'pointer', fontFamily:'inherit' },
};

const STEP_LABELS = ['Cliente','Dispositivo','Assistenza','Ricambio','Caparra','Riepilogo'];
function StepBar({ current }) {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ display:'flex', alignItems:'center' }}>
        {STEP_LABELS.map((l, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', flex: i < STEP_LABELS.length-1 ? 1 : 'none' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:500, zIndex:1, background: i <= current ? '#22c55e' : 'rgba(255,255,255,0.04)', border: i <= current ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.12)', color: i <= current ? 'white' : 'rgba(255,255,255,0.3)' }}>
              {i < current ? 'v' : i+1}
            </div>
            {i < STEP_LABELS.length-1 && <div style={{ flex:1, height:1.5, background: i < current ? '#22c55e' : 'rgba(255,255,255,0.08)' }}/>}
          </div>
        ))}
      </div>
      <div style={{ display:'flex', marginTop:6 }}>
        {STEP_LABELS.map((l,i) => (
          <div key={i} style={{ flex: i < STEP_LABELS.length-1 ? 1 : 'none', fontSize:10, color: i===current ? '#e2e8f0' : i<current ? '#22c55e' : 'rgba(255,255,255,0.25)', fontWeight: i===current ? 600 : 400 }}>{l}</div>
        ))}
      </div>
    </div>
  );
}

function CardWrap({ icon, title, subtitle, children, footer }) {
  return (
    <div style={S.card}>
      <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:'rgba(34,197,94,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'#22c55e', flexShrink:0 }}>{icon}</div>
        <div><div style={{ fontSize:14, fontWeight:600, color:'#e2e8f0' }}>{title}</div>{subtitle && <div style={{ fontSize:12, color:'#475569', marginTop:1 }}>{subtitle}</div>}</div>
      </div>
      <div style={{ padding:'16px 18px' }}>{children}</div>
      {footer && <div style={{ padding:'13px 18px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>{footer}</div>}
    </div>
  );
}

function Step1({ onNext, BASE }) {
  const [q, setQ] = useState('');
  const [clienti, setClienti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newC, setNewC] = useState({ nome:'', cognome:'', telefono:'', email:'' });

  const search = async (val) => {
    if (!val || val.length < 2) { setClienti([]); return; }
    setLoading(true);
    try { const r = await fetch(`${BASE}/clienti?search=${encodeURIComponent(val)}`); const d = await r.json(); setClienti(Array.isArray(d) ? d : []); } catch(e) {}
    setLoading(false);
  };

  const saveNew = async () => {
    if (!newC.nome) return;
    try { const r = await fetch(`${BASE}/clienti`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(newC) }); const d = await r.json(); setSelected(d); setShowNew(false); } catch(e) {}
  };

  const initials = c => [c.nome, c.cognome].filter(Boolean).map(s=>s[0]).join('').toUpperCase().slice(0,2);
  const fullName = c => [c.nome, c.cognome].filter(Boolean).join(' ');

  return (
    <CardWrap icon="person" title="Seleziona cliente" subtitle="Cerca nel registro o aggiungi nuovo"
      footer={<><span style={{ fontSize:12, color:'#475569' }}>{selected ? fullName(selected) : 'Nessuno selezionato'}</span><button style={{ ...S.btnPrimary, opacity: selected?1:.35 }} disabled={!selected} onClick={() => onNext(selected)}>Avanti</button></>}>
      {!showNew ? (<>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <input value={q} onChange={e=>{setQ(e.target.value); search(e.target.value);}} placeholder="Cerca per nome, telefono..." style={S.inp}/>
          <button onClick={()=>setShowNew(true)} style={{ ...S.btnGhost, background:'rgba(34,197,94,0.1)', borderColor:'rgba(34,197,94,0.3)', color:'#22c55e', whiteSpace:'nowrap' }}>+ Nuovo</button>
        </div>
        {(clienti.length > 0 || loading) && (
          <div style={{ border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, overflow:'hidden', maxHeight:240, overflowY:'auto' }}>
            {loading && <div style={{ padding:'12px 16px', fontSize:13, color:'#475569' }}>Ricerca...</div>}
            {clienti.map(c => (
              <div key={c.id} onClick={() => setSelected(c)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.05)', cursor:'pointer', background: selected?.id===c.id ? 'rgba(34,197,94,0.1)' : 'transparent' }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(59,130,246,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'#60a5fa', flexShrink:0 }}>{initials(c)}</div>
                <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:13, fontWeight:500, color:'#e2e8f0' }}>{fullName(c)}</div><div style={{ fontSize:11, color:'#475569' }}>{[c.telefono, c.email].filter(Boolean).join(' - ')}</div></div>
                {selected?.id===c.id && <span style={{ color:'#22c55e' }}>ok</span>}
              </div>
            ))}
            {!loading && clienti.length===0 && q.length>=2 && <div style={{ padding:'12px 16px', fontSize:13, color:'#475569' }}>Nessun cliente - <button onClick={()=>setShowNew(true)} style={{ background:'none', border:'none', color:'#22c55e', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>aggiungi nuovo</button></div>}
          </div>
        )}
      </>) : (
        <div style={{ border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'14px 16px' }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0', marginBottom:12 }}>Nuovo cliente</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div><label style={S.lbl}>Nome *</label><input value={newC.nome} onChange={e=>setNewC(p=>({...p,nome:e.target.value}))} style={S.inp}/></div>
            <div><label style={S.lbl}>Cognome</label><input value={newC.cognome} onChange={e=>setNewC(p=>({...p,cognome:e.target.value}))} style={S.inp}/></div>
            <div><label style={S.lbl}>Telefono</label><input value={newC.telefono} onChange={e=>setNewC(p=>({...p,telefono:e.target.value}))} placeholder="+39..." style={S.inp}/></div>
            <div><label style={S.lbl}>Email</label><input value={newC.email} onChange={e=>setNewC(p=>({...p,email:e.target.value}))} style={S.inp}/></div>
          </div>
          <div style={{ display:'flex', gap:8 }}><button onClick={()=>setShowNew(false)} style={S.btnSecondary}>Annulla</button><button onClick={saveNew} style={{ ...S.btnPrimary, opacity: newC.nome?1:.4 }} disabled={!newC.nome}>Salva cliente</button></div>
        </div>
      )}
    </CardWrap>
  );
  }

function Step2({ cliente, onNext, onBack, BASE }) {
  const [q, setQ] = useState('');
  const [dispositivi, setDispositivi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newD, setNewD] = useState({ brand:'', modello:'', colore_storage:'', imei:'' });
  const BRANDS = ['Apple','Samsung','Xiaomi','Huawei','OnePlus','Google','Motorola','Nokia','Sony','Altro'];

  useEffect(() => { if (cliente?.id) loadDev(); }, [cliente]);

  const loadDev = async () => {
    setLoading(true);
    try { const r = await fetch(`${BASE}/devices?cliente_id=${cliente.id}`); const d = await r.json(); setDispositivi(Array.isArray(d)?d:[]); } catch(e) { setDispositivi([]); }
    setLoading(false);
  };

  const saveNew = async () => {
    if (!newD.brand || !newD.modello) return;
    try { const r = await fetch(`${BASE}/devices`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...newD, cliente_id: cliente?.id }) }); const d = await r.json(); setSelected(d); setShowNew(false); loadDev(); } catch(e) {}
  };

  const filtered = dispositivi.filter(d => !q || [d.brand,d.modello,d.imei,d.colore_storage].join(' ').toLowerCase().includes(q.toLowerCase()));
  const fullName = c => [c.nome, c.cognome].filter(Boolean).join(' ');

  return (
    <CardWrap icon="phone" title="Dispositivo del cliente" subtitle={`Cliente: ${fullName(cliente)}`}
      footer={<><button onClick={onBack} style={S.btnSecondary}>Indietro</button><button style={{ ...S.btnPrimary, opacity:selected?1:.35 }} disabled={!selected} onClick={() => onNext(selected)}>Avanti</button></>}>
      {!showNew ? (<>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filtra per modello, IMEI..." style={S.inp}/>
          <button onClick={()=>setShowNew(true)} style={{ ...S.btnGhost, background:'rgba(34,197,94,0.1)', borderColor:'rgba(34,197,94,0.3)', color:'#22c55e', whiteSpace:'nowrap' }}>+ Nuovo</button>
        </div>
        <div style={{ border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, overflow:'hidden', maxHeight:240, overflowY:'auto' }}>
          {loading && <div style={{ padding:'12px 16px', fontSize:13, color:'#475569' }}>Caricamento...</div>}
          {filtered.map(d => (
            <div key={d.id} onClick={() => setSelected(d)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.05)', cursor:'pointer', background: selected?.id===d.id ? 'rgba(34,197,94,0.1)' : 'transparent' }}>
              <div style={{ width:34, height:34, borderRadius:8, background:'rgba(139,92,246,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📱</div>
              <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:13, fontWeight:500, color:'#e2e8f0' }}>{d.brand} {d.modello}{d.colore_storage?` - ${d.colore_storage}`:''}</div><div style={{ fontSize:11, color:'#475569' }}>{d.imei?`IMEI: ${d.imei}`:'Nessun IMEI'}</div></div>
              {selected?.id===d.id && <span style={{ color:'#22c55e' }}>ok</span>}
            </div>
          ))}
          {!loading && filtered.length===0 && <div style={{ padding:'16px', textAlign:'center', fontSize:13, color:'#475569' }}>Nessun dispositivo - <button onClick={()=>setShowNew(true)} style={{ background:'none', border:'none', color:'#22c55e', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>registra nuovo</button></div>}
        </div>
      </>) : (
        <div style={{ border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'14px 16px' }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0', marginBottom:12 }}>Nuovo dispositivo</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div><label style={S.lbl}>Marca *</label><select value={newD.brand} onChange={e=>setNewD(p=>({...p,brand:e.target.value}))} style={S.inp}><option value="">--</option>{BRANDS.map(b=><option key={b}>{b}</option>)}</select></div>
            <div><label style={S.lbl}>Modello *</label><input value={newD.modello} onChange={e=>setNewD(p=>({...p,modello:e.target.value}))} placeholder="es. iPhone 15 Pro" style={S.inp}/></div>
            <div><label style={S.lbl}>Colore / Storage</label><input value={newD.colore_storage} onChange={e=>setNewD(p=>({...p,colore_storage:e.target.value}))} placeholder="es. Nero 128GB" style={S.inp}/></div>
            <div><label style={S.lbl}>IMEI</label><input value={newD.imei} onChange={e=>setNewD(p=>({...p,imei:e.target.value}))} placeholder="15 cifre" style={S.inp}/></div>
          </div>
          <div style={{ display:'flex', gap:8 }}><button onClick={()=>setShowNew(false)} style={S.btnSecondary}>Annulla</button><button onClick={saveNew} style={{ ...S.btnPrimary, opacity:newD.brand&&newD.modello?1:.4 }} disabled={!newD.brand||!newD.modello}>Salva</button></div>
        </div>
      )}
    </CardWrap>
  );
}

function Step3({ dispositivo, onNext, onBack }) {
  const [selected, setSelected] = useState(null);
  const CAT_BG = { 'Display e vetro':'#0d1e35','Batteria':'#0a1f15','Fotocamera':'#110d35','Audio':'#1f150a','Tasti e connettori':'#1f0d0d','Scocca e pulizia':'#151515' };

  return (
    <CardWrap icon="tool" title="Tipo di assistenza" subtitle={`${dispositivo.brand} ${dispositivo.modello} - seleziona l'intervento`}
      footer={<><button onClick={onBack} style={S.btnSecondary}>Indietro</button><button style={{ ...S.btnPrimary, opacity:selected?1:.35 }} disabled={!selected} onClick={() => onNext(selected)}>{selected?.fonedayQ?'Cerca ricambio su Foneday':'Avanti'}</button></>}>
      {ASSISTENZE.map(cat => (
        <div key={cat.cat} style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>{cat.cat}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            {cat.items.map(item => {
              const isSel = selected?.label === item.label;
              return (
                <button key={item.label} onClick={() => setSelected(item)} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 11px', borderRadius:8, border:`1px solid ${isSel?'#22c55e':'rgba(255,255,255,0.08)'}`, background: isSel?'rgba(34,197,94,0.12)':CAT_BG[cat.cat]||'rgba(255,255,255,0.02)', cursor:'pointer', fontFamily:'inherit', fontSize:12.5, color:isSel?'#4ade80':'#e2e8f0', textAlign:'left', width:'100%', fontWeight:isSel?600:400, transition:'all .12s' }}>
                  <span style={{ flex:1 }}>{item.label.replace(' ORIGINALE','')}</span>
                  {item.orig && <span style={{ fontSize:9, fontWeight:600, padding:'1px 5px', borderRadius:20, background:'#FAEEDA', color:'#633806', whiteSpace:'nowrap' }}>ORIG.</span>}
                  {isSel && <span style={{ color:'#22c55e', fontSize:14, flexShrink:0 }}>ok</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </CardWrap>
  );
        }

function Step4({ dispositivo, assistenza, onNext, onBack, BASE }) {
  const autoQ = assistenza.fonedayQ ? `${dispositivo.brand} ${dispositivo.modello} ${assistenza.fonedayQ}` : '';
  const [q, setQ] = useState(autoQ);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [instockOnly, setInstockOnly] = useState(true);
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [cartSent, setCartSent] = useState(false);
  const [cartSending, setCartSending] = useState(false);
  const [error, setError] = useState('');

  const search = useCallback(async (val) => {
    if (!val || val.trim().length < 2) return;
    setLoading(true); setError('');
    try { const r = await fetch(`${BASE}/foneday/search?q=${encodeURIComponent(val)}&instock=${instockOnly}`); const d = await r.json(); if (!r.ok) throw new Error(d.error); setResults(d.products||[]); } catch(e) { setError(e.message); }
    setLoading(false);
  }, [instockOnly, BASE]);

  useEffect(() => { if (autoQ) search(autoQ); }, []);

  const addCart = async () => {
    if (!selected) return;
    setCartSending(true);
    try { const r = await fetch(`${BASE}/foneday/cart/add`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ articles:[{ sku:selected.sku, quantity:qty, note:null }] }) }); if (!r.ok) throw new Error((await r.json()).error); setCartSent(true); } catch(e) { setError(e.message); }
    setCartSending(false);
  };

  if (!assistenza.fonedayQ) return (
    <CardWrap icon="box" title="Ricambio" subtitle="Questo intervento non richiede ricambi dal catalogo"
      footer={<><button onClick={onBack} style={S.btnSecondary}>Indietro</button><button style={S.btnPrimary} onClick={() => onNext(null)}>Avanti</button></>}>
      <p style={{ fontSize:13, color:'#475569', textAlign:'center', padding:'20px 0' }}>Servizio senza ricambio fisico — si passa alla caparra.</p>
    </CardWrap>
  );

  return (
    <CardWrap icon="search" title="Ricambio da Foneday" subtitle={`${assistenza.label} - ${dispositivo.brand} ${dispositivo.modello}`}
      footer={<><button onClick={onBack} style={S.btnSecondary}>Indietro</button><button style={{ ...S.btnPrimary, opacity:selected?1:.35 }} disabled={!selected} onClick={() => onNext({ ...selected, qty, cartSent })}>Avanti</button></>}>
      {error && <div style={{ marginBottom:10, padding:'8px 12px', background:'rgba(248,113,113,0.1)', borderRadius:7, fontSize:12, color:'#f87171' }}>{error}</div>}
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search(q)} style={S.inp} placeholder="Cerca nel catalogo Foneday..."/>
        <button onClick={()=>search(q)} disabled={loading} style={{ ...S.btnGhost, whiteSpace:'nowrap', background:'rgba(99,102,241,0.15)', borderColor:'rgba(99,102,241,0.4)', color:'#818cf8' }}>{loading?'...':'Cerca'}</button>
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#475569', cursor:'pointer', marginBottom:10 }}>
        <input type="checkbox" checked={instockOnly} onChange={e=>{setInstockOnly(e.target.checked); search(q);}}/> Solo prodotti disponibili
      </label>
      <div style={{ border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, overflow:'hidden', maxHeight:240, overflowY:'auto' }}>
        {loading && <div style={{ padding:'16px', textAlign:'center', color:'#475569', fontSize:13 }}>Ricerca...</div>}
        {!loading && results.length===0 && q && <div style={{ padding:'16px', textAlign:'center', color:'#475569', fontSize:13 }}>Nessun risultato per "{q}"</div>}
        {results.map(p => {
          const qc = qColor(p.quality);
          const isSel = selected?.sku===p.sku;
          return (
            <div key={p.sku} onClick={() => { setSelected(p); setCartSent(false); }} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.05)', cursor:'pointer', background:isSel?'rgba(34,197,94,0.08)':'transparent', opacity:p.instock==='N'?.5:1 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:500, color:'#e2e8f0', marginBottom:3, lineHeight:1.3 }}>{p.title}</div>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:p.instock==='Y'?'#0f3320':'#3b0f0f', color:p.instock==='Y'?'#4ade80':'#f87171' }}>{p.instock==='Y'?'Disponibile':'Non disp.'}</span>
                  <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:qc.bg, color:qc.text }}>{p.quality}</span>
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>euro{p.price?.toFixed(2)}</div>
                {isSel && <span style={{ fontSize:11, color:'#22c55e' }}>ok</span>}
              </div>
            </div>
          );
        })}
      </div>
      {selected && (
        <div style={{ marginTop:12, padding:'12px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8 }}>
          <div style={{ fontSize:12, fontWeight:500, color:'#e2e8f0', marginBottom:8 }}>{selected.title}</div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <label style={{ fontSize:12, color:'#475569' }}>Qty</label>
              <input type="number" value={qty} min={1} onChange={e=>setQty(Number(e.target.value))} style={{ ...S.inp, width:64 }}/>
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:'#22c55e' }}>Totale: euro{(selected.price*qty).toFixed(2)}</span>
            {cartSent ? <span style={{ fontSize:12, color:'#22c55e', marginLeft:'auto' }}>Aggiunto al carrello Foneday</span>
              : <button onClick={addCart} disabled={cartSending} style={{ ...S.btnPrimary, marginLeft:'auto', fontSize:12, padding:'6px 14px', opacity:cartSending?.6:1 }}>{cartSending?'Invio...':'Aggiungi al carrello Foneday'}</button>}
          </div>
          {cartSent && <a href="https://foneday.shop/it/cart" target="_blank" rel="noreferrer" style={{ display:'block', marginTop:6, fontSize:11, color:'#6366f1' }}>Apri carrello Foneday</a>}
        </div>
      )}
    </CardWrap>
  );
}

function Step5({ onNext, onBack }) {
  const [hasCap, setHasCap] = useState(false);
  const [importo, setImporto] = useState('');
  const [totale, setTotale] = useState('');
  const [metodo, setMetodo] = useState('Contanti');
  const [note, setNote] = useState('');
  const saldo = hasCap && importo && totale ? (parseFloat(totale)-parseFloat(importo)).toFixed(2) : null;

  return (
    <CardWrap icon="cash" title="Caparra" subtitle="Importo anticipato dal cliente (opzionale)"
      footer={<><button onClick={onBack} style={S.btnSecondary}>Indietro</button><button style={S.btnPrimary} onClick={() => onNext({ attiva:hasCap, importo, totale, metodo, note })}>Avanti</button></>}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <span style={{ fontSize:13, color:'#e2e8f0' }}>Il cliente ha lasciato una caparra?</span>
        <div style={{ display:'flex', gap:6 }}>
          {['Si','No'].map(v => <button key={v} onClick={() => setHasCap(v==='Si')} style={{ fontSize:12, padding:'5px 16px', borderRadius:20, border:'1px solid', cursor:'pointer', fontFamily:'inherit', background:(v==='Si'&&hasCap)||(v==='No'&&!hasCap)?'rgba(34,197,94,0.15)':'transparent', borderColor:(v==='Si'&&hasCap)||(v==='No'&&!hasCap)?'#22c55e':'rgba(255,255,255,0.12)', color:(v==='Si'&&hasCap)||(v==='No'&&!hasCap)?'#4ade80':'#94a3b8' }}>{v}</button>)}
        </div>
      </div>
      {hasCap && (<>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div><label style={S.lbl}>Importo caparra (euro)</label><input type="number" value={importo} min={0} step={0.01} onChange={e=>setImporto(e.target.value)} placeholder="0.00" style={S.inp}/></div>
          <div><label style={S.lbl}>Totale preventivo (euro)</label><input type="number" value={totale} min={0} step={0.01} onChange={e=>setTotale(e.target.value)} placeholder="0.00" style={S.inp}/></div>
        </div>
        <label style={S.lbl}>Metodo</label>
        <div style={{ display:'flex', gap:8, marginBottom:12, marginTop:5 }}>
          {['Contanti','Bonifico'].map(m => <button key={m} onClick={() => setMetodo(m)} style={{ fontSize:12, padding:'5px 16px', borderRadius:20, border:'1px solid', cursor:'pointer', fontFamily:'inherit', background:metodo===m?'rgba(34,197,94,0.15)':'transparent', borderColor:metodo===m?'#22c55e':'rgba(255,255,255,0.12)', color:metodo===m?'#4ade80':'#94a3b8' }}>{m}</button>)}
        </div>
        <label style={S.lbl}>Note caparra</label>
        <input value={note} onChange={e=>setNote(e.target.value)} placeholder="es. Ricevuta n..." style={{ ...S.inp, marginBottom:12 }}/>
        {saldo !== null && <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:8 }}><span style={{ fontSize:13, color:'#475569' }}>Saldo residuo</span><span style={{ fontSize:14, fontWeight:600, color:'#22c55e' }}>euro {saldo}</span></div>}
      </>)}
    </CardWrap>
  );
}

function Step6({ data, onBack, onSave, saving }) {
  const { cliente, dispositivo, assistenza, ricambio, caparra } = data;
  const fullName = c => [c.nome, c.cognome].filter(Boolean).join(' ');
  const Row = ({ label, children }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize:12, color:'#475569', flexShrink:0, marginRight:16 }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:500, color:'#e2e8f0', textAlign:'right' }}>{children}</span>
    </div>
  );
  return (
    <CardWrap icon="check" title="Riepilogo prenotazione" subtitle="Controlla e conferma"
      footer={<><button onClick={onBack} style={S.btnSecondary}>Indietro</button><button onClick={onSave} disabled={saving} style={{ ...S.btnPrimary, opacity:saving?.6:1 }}>{saving?'Salvataggio...':'Salva prenotazione'}</button></>}>
      <Row label="Cliente">{fullName(cliente)}{cliente.telefono?` - ${cliente.telefono}`:''}</Row>
      <Row label="Dispositivo">{dispositivo.brand} {dispositivo.modello}{dispositivo.colore_storage?` - ${dispositivo.colore_storage}`:''}</Row>
      <Row label="Assistenza">{assistenza.label}</Row>
      {ricambio && <Row label="Ricambio Foneday"><div><div>{ricambio.title}</div><div style={{ fontSize:11, color:'#475569', marginTop:2 }}>SKU: {ricambio.sku} - euro{ricambio.price?.toFixed(2)} x {ricambio.qty}</div>{ricambio.cartSent && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#0f3320', color:'#4ade80', display:'inline-block', marginTop:3 }}>Nel carrello Foneday</span>}</div></Row>}
      {caparra?.attiva && <Row label="Caparra">euro{caparra.importo} {caparra.metodo}{caparra.totale?` - saldo euro${(parseFloat(caparra.totale)-parseFloat(caparra.importo)).toFixed(2)}`:''}</Row>}
      <Row label="Stato"><span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'#1a1060', color:'#a78bfa' }}>Da ordinare</span></Row>
    </CardWrap>
  );
}

export default function PrenotazioneOrdini({ api, showToast }) {
  const BASE = api || API;
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ cliente:null, dispositivo:null, assistenza:null, ricambio:null, caparra:null });
  const [saving, setSaving] = useState(false);
  const [lista, setLista] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [viewMode, setViewMode] = useState('lista');
  const [filtro, setFiltro] = useState('');
  const [searchQ, setSearchQ] = useState('');

  const STATI = [
    { key:'da_ordinare', label:'Da ordinare', bg:'#1a1060', text:'#a78bfa' },
    { key:'ordinato', label:'Ordinato', bg:'#3b1a06', text:'#fb923c' },
    { key:'arrivato', label:'Arrivato', bg:'#0f3320', text:'#4ade80' },
  ];

  const loadLista = useCallback(async () => {
    setLoadingLista(true);
    try { const p = new URLSearchParams(); if(filtro) p.set('stato',filtro); if(searchQ) p.set('search',searchQ); const r = await fetch(`${BASE}/prenotazioni-ordini?${p}`); const d = await r.json(); setLista(Array.isArray(d)?d:[]); } catch(e) { setLista([]); }
    setLoadingLista(false);
  }, [filtro, searchQ, BASE]);

  useEffect(() => { if (viewMode==='lista') loadLista(); }, [viewMode, loadLista]);

  const save = async () => {
    setSaving(true);
    try {
      const { cliente, dispositivo, assistenza, ricambio, caparra } = data;
      const body = { cliente_id:cliente.id||null, cliente_nome:[cliente.nome,cliente.cognome].filter(Boolean).join(' '), cliente_telefono:cliente.telefono||null, cliente_email:cliente.email||null, brand:dispositivo.brand, modello:dispositivo.modello, colore_variante:dispositivo.colore_storage||null, tipo_riparazione:assistenza.label, ricambio:ricambio?.title||null, in_store:true, stato:'da_ordinare', data_inserimento:new Date().toISOString().split('T')[0], caparra_attiva:caparra?.attiva||false, caparra_importo:caparra?.importo?parseFloat(caparra.importo):null, caparra_totale:caparra?.totale?parseFloat(caparra.totale):null, caparra_metodo:caparra?.metodo||null, caparra_note:caparra?.note||null };
      const r = await fetch(`${BASE}/prenotazioni-ordini`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      if (!r.ok) throw new Error(await r.text());
      showToast&&showToast('Prenotazione salvata');
      setViewMode('lista'); setStep(0); setData({ cliente:null, dispositivo:null, assistenza:null, ricambio:null, caparra:null });
    } catch(e) { showToast?showToast('Errore: '+e.message,'error'):alert(e.message); }
    setSaving(false);
  };

  const delPren = async (id) => {
    if (!confirm('Eliminare questa prenotazione?')) return;
    await fetch(`${BASE}/prenotazioni-ordini/${id}`, { method:'DELETE' });
    showToast&&showToast('Eliminata'); loadLista();
  };

  const updateStato = async (id, stato) => {
    const extra = stato==='ordinato'?{data_ordine:new Date().toISOString().split('T')[0]}:stato==='arrivato'?{data_arrivo:new Date().toISOString().split('T')[0]}:{};
    await fetch(`${BASE}/prenotazioni-ordini/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ stato, ...extra }) });
    loadLista();
  };

  if (viewMode === 'wizard') return (
    <div style={{ maxWidth:660, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h1 style={{ fontSize:18, fontWeight:700, color:'#e2e8f0', margin:0 }}>Nuova prenotazione</h1>
        <button onClick={()=>setViewMode('lista')} style={{ ...S.btnSecondary, fontSize:12 }}>Annulla</button>
      </div>
      <StepBar current={step}/>
      {step===0 && <Step1 BASE={BASE} onNext={c=>{setData(p=>({...p,cliente:c}));setStep(1);}}/>}
      {step===1 && <Step2 BASE={BASE} cliente={data.cliente} onBack={()=>setStep(0)} onNext={d=>{setData(p=>({...p,dispositivo:d}));setStep(2);}}/>}
      {step===2 && <Step3 dispositivo={data.dispositivo} onBack={()=>setStep(1)} onNext={a=>{setData(p=>({...p,assistenza:a}));setStep(3);}}/>}
      {step===3 && <Step4 BASE={BASE} dispositivo={data.dispositivo} assistenza={data.assistenza} onBack={()=>setStep(2)} onNext={r=>{setData(p=>({...p,ricambio:r}));setStep(4);}}/>}
      {step===4 && <Step5 onBack={()=>setStep(3)} onNext={cap=>{setData(p=>({...p,caparra:cap}));setStep(5);}}/>}
      {step===5 && <Step6 data={data} onBack={()=>setStep(4)} onSave={save} saving={saving}/>}
    </div>
  );

  const count = k => lista.filter(p=>p.stato===k).length;
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div><h1 style={{ fontSize:20, fontWeight:700, color:'#e2e8f0', margin:0 }}>Prenotazione Ordini</h1><p style={{ fontSize:13, color:'#475569', marginTop:3 }}>Gestione ricambi per riparazioni</p></div>
        <button onClick={()=>setViewMode('wizard')} style={S.btnPrimary}>+ Nuova prenotazione</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:18 }}>
        {STATI.map(s => <div key={s.key} onClick={()=>setFiltro(filtro===s.key?'':s.key)} style={{ background:filtro===s.key?s.bg:'rgba(255,255,255,0.03)', border:`1px solid ${filtro===s.key?s.text:'rgba(255,255,255,0.08)'}`, borderRadius:10, padding:14, cursor:'pointer', textAlign:'center' }}><div style={{ fontSize:22, fontWeight:700, color:filtro===s.key?s.text:'#e2e8f0' }}>{count(s.key)}</div><div style={{ fontSize:12, color:'#475569', marginTop:3 }}>{s.label}</div></div>)}
      </div>
      <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Cerca cliente, brand, modello, ricambio..." style={{ ...S.inp, marginBottom:14 }}/>
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12 }}>
        {loadingLista?<div style={{ padding:'2rem', textAlign:'center', color:'#475569' }}>Caricamento...</div>:
        lista.length===0?<div style={{ padding:'2.5rem', textAlign:'center', color:'rgba(255,255,255,0.25)' }}><div style={{ fontSize:28, marginBottom:8 }}>Nessuna prenotazione</div><button onClick={()=>setViewMode('wizard')} style={{ marginTop:12, ...S.btnGhost, color:'#60a5fa', borderColor:'rgba(96,165,250,0.3)' }}>Crea la prima</button></div>:
        lista.map(p => {
          const s = STATI.find(x=>x.key===p.stato)||STATI[0];
          return (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <select value={p.stato} onChange={e=>updateStato(p.id,e.target.value)} style={{ fontSize:11, padding:'2px 6px', borderRadius:20, border:'none', background:s.bg, color:s.text, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                {STATI.map(x=><option key={x.key} value={x.key}>{x.label}</option>)}
              </select>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:500, fontSize:14, color:'#e2e8f0', marginBottom:2 }}>{p.brand} {p.modello}{p.colore_variante?` - ${p.colore_variante}`:''}</div>
                <div style={{ fontSize:12, color:'#475569' }}>{p.cliente_nome}{p.cliente_telefono?` - ${p.cliente_telefono}`:''}{p.tipo_riparazione?` - ${p.tipo_riparazione}`:''}</div>
              </div>
              <div style={{ fontSize:11, color:'#334155', textAlign:'right', flexShrink:0 }}>{p.data_inserimento&&<div>{p.data_inserimento}</div>}</div>
              {!!p.caparra_attiva&&<div style={{ fontSize:12, color:'#60a5fa', background:'#1e3a5f', borderRadius:6, padding:'3px 8px', flexShrink:0 }}>euro{p.caparra_importo}</div>}
              <button onClick={()=>delPren(p.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#f87171', fontSize:14, padding:'3px 6px' }}>X</button>
            </div>
          );
        })}
      </div>
    </div>
  );
      }
