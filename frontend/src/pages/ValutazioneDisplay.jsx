// pages/ValutazioneDisplay.jsx
import { useState, useEffect, useRef } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001');
const VD = `${API_BASE}/valutazione-display`;
const DO = `${API_BASE}/display-ordini`;

const fmt = (n) => Number(n || 0).toFixed(2).replace('.', ',') + ' €';
const fmtNum = (n) => Number(n || 0).toFixed(2).replace('.', ',');

function BrandIcon({ brand }) {
  const icons = {
    Apple: '🍎', Samsung: '📱', Huawei: '📶', Xiaomi: '💫',
    OPPO: '🔵', Vivo: '🎵', Motorola: '〽️', LG: '⬜', OnePlus: '➕'
  };
  const icon = icons[brand] || brand?.[0]?.toUpperCase() || '?';
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: typeof icon === 'string' && icon.length > 1 ? 20 : 18,
      fontWeight: 700, color: '#a5b4fc', flexShrink: 0
    }}>{icon}</div>
  );
}

function TabRicerca({ api, showToast }) {
  const [step, setStep] = useState('brand');
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [brandFilter, setBrandFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [addingToOrder, setAddingToOrder] = useState(false);
  const [addedOk, setAddedOk] = useState(false);
  const [openOrder, setOpenOrder] = useState(null);

  useEffect(() => {
    fetch(`${VD}/brands`).then(r => r.json()).then(setBrands).catch(() => {});
    fetch(`${DO}/open`).then(r => r.json()).then(setOpenOrder).catch(() => {});
  }, []);

  async function selectBrand(brand) {
    setSelectedBrand(brand);
    const r = await fetch(`${VD}/search?brand=${encodeURIComponent(brand)}`);
    const data = await r.json();
    setModels(data.items || data.rows || []);
    setStep('model');
    setModelFilter('');
  }

  async function selectModel(item) {
    setSelectedModel(item);
    setPriceData(item);
    setStep('price');
    setAddedOk(false);
  }

  async function aggiungiOrdine() {
    setAddingToOrder(true);
    try {
      let ordine = openOrder;
      if (!ordine) {
        const r = await fetch(`${DO}/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        if (!r.ok) {
          const e = await r.json();
          showToast(e.error || 'Errore creazione ordine', 'error');
          setAddingToOrder(false);
          return;
        }
        ordine = await r.json();
        setOpenOrder(ordine);
      }
      const r2 = await fetch(`${DO}/${ordine.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: priceData.brand, model: priceData.model, quantity: 1, unit_price: priceData.purchase_price, notes: '' })
      });
      if (!r2.ok) {
        const e = await r2.json();
        showToast(e.error || 'Errore aggiunta', 'error');
      } else {
        setAddedOk(true);
        const ro = await fetch(`${DO}/open`);
        setOpenOrder(await ro.json());
      }
    } catch (e) { showToast('Errore di rete', 'error'); }
    setAddingToOrder(false);
  }

  const filteredBrands = brands.filter(b => b.toLowerCase().includes(brandFilter.toLowerCase()));
  const filteredModels = models.filter(m => m.model?.toLowerCase().includes(modelFilter.toLowerCase()));
  const steps = [
    { key: 'brand', label: '1 · Marca' },
    { key: 'model', label: '2 · Modello' },
    { key: 'price', label: '3 · Prezzo' }
  ];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
        {steps.map((s, i) => {
          const done = steps.findIndex(x => x.key === step) > i;
          const active = s.key === step;
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                background: active ? '#6366f1' : done ? '#22c55e' : 'rgba(255,255,255,0.06)',
                color: active || done ? '#fff' : '#64748b', cursor: done ? 'pointer' : 'default'
              }}
                onClick={() => {
                  if (done) {
                    if (s.key === 'brand') { setStep('brand'); setSelectedBrand(null); }
                    if (s.key === 'model') { setStep('model'); setSelectedModel(null); }
                  }
                }}
              >{s.label}</div>
              {i < steps.length - 1 && <span style={{ color: '#334155', fontSize: 16 }}>›</span>}
            </div>
          );
        })}
        {openOrder && (
          <div style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: 12, fontWeight: 600 }}>
            🧾 Ordine aperto · {openOrder.items?.length || 0} pezzi
          </div>
        )}
      </div>

      {step === 'brand' && (
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>1</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Seleziona la marca</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Di che marca è il display che vuoi valutare?</div>
            </div>
          </div>
          <input placeholder="Filtra marca..." value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 14, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
          />
          {brands.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>Nessun listino attivo. Carica un listino nella sezione Admin.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {filteredBrands.map(b => (
                <button key={b} onClick={() => selectBrand(b)} style={{ padding: '14px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                  <BrandIcon brand={b} />{b}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'model' && (
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <button onClick={() => setStep('brand')} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>← Indietro</button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>2</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Seleziona il modello</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Hai selezionato <span style={{ color: '#6366f1' }}>{selectedBrand}</span> · {models.length} modelli disponibili</div>
            </div>
          </div>
          <input placeholder="Cerca modello..." value={modelFilter} onChange={e => setModelFilter(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
            {filteredModels.map((m, i) => (
              <button key={i} onClick={() => selectModel(m)} style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#cbd5e1', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', fontSize: 14 }}>
                <span>{m.model}</span><span style={{ color: '#475569', fontSize: 16 }}>›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'price' && priceData && (
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <button onClick={() => setStep('model')} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>← Cambia modello</button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>3</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Ecco il prezzo</div>
              <div style={{ fontSize: 13, color: '#6366f1', marginTop: 2 }}>{priceData.brand} · {priceData.model}</div>
            </div>
          </div>
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: '24px', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ color: '#22c55e', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>💰 Prezzo che puoi offrire al cliente</div>
            <div style={{ color: '#22c55e', fontSize: 52, fontWeight: 800, letterSpacing: -1 }}>{fmtNum(priceData.my_price)} <span style={{ fontSize: 28 }}>€</span></div>
            <div style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>Offri questo importo — ci guadagni {fmt(priceData.gain)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 12 }}>📊 DETTAGLIO MARGINE (VISIBILE SOLO A TE)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: 14 }}>Il fornitore ti paga</span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{fmt(priceData.purchase_price)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: 14 }}>Margine applicato</span>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>− {priceData.margin_type === 'fixed' ? fmt(priceData.margin_value) : `${priceData.margin_value}%`}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>Tu guadagni</span>
                <span style={{ color: '#22c55e', fontWeight: 700 }}>{fmt(priceData.gain)}</span>
              </div>
            </div>
          </div>
          <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#94a3b8', fontSize: 13 }}>
            🖥️ {priceData.brand} {priceData.model}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {!addedOk ? (
              <button onClick={aggiungiOrdine} disabled={addingToOrder} style={{ flex: 2, padding: '14px', borderRadius: 10, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
                {addingToOrder ? '...' : '🧾 Aggiungi all\'ordine'}
              </button>
            ) : (
              <button disabled style={{ flex: 2, padding: '14px', borderRadius: 10, background: '#22c55e', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700 }}>✓ Aggiunto all'ordine!</button>
            )}
            <button onClick={() => { setStep('brand'); setSelectedBrand(null); setSelectedModel(null); setPriceData(null); setAddedOk(false); setBrandFilter(''); }} style={{ flex: 1, padding: '14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>
              🔍 Nuova ricerca
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function TabOrdini({ showToast }) {
  const [tab, setTab] = useState('attivo');
  const [ordini, setOrdini] = useState([]);
  const [openOrder, setOpenOrder] = useState(null);
  const [fornitori, setFornitori] = useState([]);
  const [nuovoFornitore, setNuovoFornitore] = useState({ nome: '', email: '', telefono: '' });
  const [loading, setLoading] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [oa, allO, forni] = await Promise.all([
        fetch(`${DO}/open`).then(r => r.json()),
        fetch(`${DO}/`).then(r => r.json()),
        fetch(`${DO}/suppliers`).then(r => r.json())
      ]);
      setOpenOrder(oa);
      setOrdini(Array.isArray(allO) ? allO : []);
      setFornitori(Array.isArray(forni) ? forni : []);
    } catch (e) { showToast('Errore caricamento', 'error'); }
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function creaOrdine() {
    const r = await fetch(`${DO}/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    if (r.ok) { await loadAll(); showToast('Ordine creato!', 'success'); }
    else { const e = await r.json(); showToast(e.error, 'error'); }
  }

  async function aggFornitore(ordineId, fornitoreId) {
    await fetch(`${DO}/${ordineId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ supplier_id: fornitoreId }) });
    await loadAll();
  }

  async function rimuoviItem(ordineId, itemId) {
    await fetch(`${DO}/${ordineId}/items/${itemId}`, { method: 'DELETE' });
    await loadAll();
  }

  async function aggiornaQta(ordineId, itemId, qty) {
    if (qty < 1) return;
    await fetch(`${DO}/${ordineId}/items/${itemId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity: qty }) });
    await loadAll();
  }

  async function cambiStato(ordineId, status) {
    await fetch(`${DO}/${ordineId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    await loadAll();
  }

  async function eliminaOrdine(ordineId) {
    if (!confirm('Eliminare questo ordine?')) return;
    await fetch(`${DO}/${ordineId}`, { method: 'DELETE' });
    await loadAll();
    showToast('Ordine eliminato', 'success');
  }

  async function aggiungiFornitore() {
    if (!nuovoFornitore.nome) return showToast('Nome obbligatorio', 'error');
    const r = await fetch(`${DO}/suppliers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nuovoFornitore.nome, email: nuovoFornitore.email, phone: nuovoFornitore.telefono }) });
    if (r.ok) { setNuovoFornitore({ nome: '', email: '', telefono: '' }); await loadAll(); showToast('Fornitore aggiunto!', 'success'); }
    else showToast('Errore', 'error');
  }

  async function eliminaFornitore(id) {
    await fetch(`${DO}/suppliers/${id}`, { method: 'DELETE' });
    await loadAll();
    showToast('Fornitore eliminato', 'success');
  }

  function generaPDF(ordine) {
    const forn = ordine.supplier_name || ordine.fornitore_nome || '—';
    const fornEmail = ordine.supplier_email || ordine.fornitore_email || '';
    const fornTel = ordine.supplier_phone || ordine.fornitore_tel || '';
    const righe = (ordine.items || []).map(it => `<tr><td>${it.brand}</td><td>${it.model || it.modello}</td><td style="text-align:center">${it.quantity || it.quantita}</td><td style="text-align:right">€ ${Number(it.unit_price || it.prezzo_unitario).toFixed(2)}</td><td style="text-align:right">€ ${Number((it.unit_price || it.prezzo_unitario) * (it.quantity || it.quantita)).toFixed(2)}</td></tr>`).join('');
    const mittente = (db_company_cache?.company_name) || 'Azienda';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;margin:40px;color:#111}h1{font-size:22px;text-align:right;text-transform:uppercase;letter-spacing:2px}.sub{color:#555;font-size:13px;text-align:right}hr{border:none;border-top:2px solid #111;margin:20px 0}.row2{display:flex;justify-content:space-between;margin:20px 0}.box{flex:1}.box b{display:block;font-size:11px;letter-spacing:1px;color:#888;margin-bottom:6px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#111;color:#fff;padding:10px 12px;font-size:12px;text-align:left}td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}.total-row td{font-weight:700;background:#f9fafb;font-size:14px}.footer{margin-top:60px;display:flex;justify-content:space-between;font-size:12px;color:#888}.firma{border-top:1px solid #ccc;width:200px;padding-top:6px;text-align:right}</style></head><body><div style="display:flex;justify-content:space-between;align-items:flex-start"><div style="font-size:20px;font-weight:700">${mittente}</div><div><h1>DOCUMENTO DI CONSEGNA</h1><div class="sub">N° ${ordine.numero || ordine.order_number}<br>Data: ${new Date().toLocaleDateString('it-IT')}</div></div></div><hr><div class="row2"><div class="box"><b>MITTENTE</b><div>—</div></div><div class="box" style="text-align:right"><b>DESTINATARIO</b><div><strong>${forn}</strong><br>${fornEmail}<br>${fornTel}</div></div></div><table><thead><tr><th>MARCA</th><th>MODELLO</th><th style="text-align:center">QUANTITÀ</th><th style="text-align:right">PREZZO UNIT.</th><th style="text-align:right">TOTALE</th></tr></thead><tbody>${righe}</tbody><tfoot><tr class="total-row"><td colspan="4" style="text-align:right">TOTALE ORDINE</td><td style="text-align:right">€ ${Number(ordine.totale || ordine.total_amount || 0).toFixed(2)}</td></tr></tfoot></table><div class="footer"><div>Documento generato il ${new Date().toLocaleDateString('it-IT')}<br>Da: ${mittente}</div><div class="firma">Firma e timbro destinatario</div></div></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
    cambiStato(ordine.id, 'pdf_generated');
  }

  const ordiniDaIncassare = ordini.filter(o => ['inviato','pdf_generato','waiting_payment','pdf_generated'].includes(o.stato || o.status));
  const ordiniPagati = ordini.filter(o => o.stato === 'pagato' || o.status === 'paid');
  const tabs = [
    { key: 'attivo', label: '🧾 Ordine Attivo' },
    { key: 'incassare', label: '📩 Da Incassare' },
    { key: 'archivio', label: '📁 Archivio' },
    { key: 'fornitori', label: '👥 Fornitori' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid', borderColor: tab === t.key ? '#6366f1' : 'rgba(255,255,255,0.1)', background: tab === t.key ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', color: tab === t.key ? '#a5b4fc' : '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{t.label}</button>
        ))}
      </div>

      {tab === 'attivo' && (
        <div>
          {!openOrder ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ color: '#64748b', marginBottom: 20, fontSize: 15 }}>Nessun ordine attivo</div>
              <button onClick={creaOrdine} style={{ padding: '12px 28px', borderRadius: 10, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>+ Nuovo ordine</button>
            </div>
          ) : (
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>{openOrder.numero || openOrder.order_number}</div>
                  <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Creato il {new Date(openOrder.created_at).toLocaleString('it-IT')}</div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 1 }}>MODELLI</div><div style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>{openOrder.items?.length || 0}</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 1 }}>PEZZI</div><div style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>{(openOrder.items || []).reduce((s, i) => s + (i.quantita || i.quantity || 1), 0)}</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 1 }}>TOTALE</div><div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{fmt(openOrder.totale || openOrder.total_amount)}</div></div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, marginBottom: 16 }}>
                <span style={{ color: '#64748b', fontSize: 13 }}>👥 Fornitore:</span>
                <select value={openOrder.fornitore_id || openOrder.supplier_id || ''} onChange={e => aggFornitore(openOrder.id, e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 14 }}>
                  <option value="">— Seleziona fornitore —</option>
                  {fornitori.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              {openOrder.items?.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                  <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{['MARCA','MODELLO','PREZZO UNIT.','QUANTITÀ','TOTALE',''].map(h => <th key={h} style={{ padding: '8px 12px', color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: 1, textAlign: 'left' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {openOrder.items.map(it => (
                      <tr key={it.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px' }}><span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 12 }}>{it.brand}</span></td>
                        <td style={{ padding: '12px', color: '#cbd5e1', fontSize: 14 }}>{it.model || it.modello}</td>
                        <td style={{ padding: '12px', color: '#e2e8f0' }}>{fmt(it.unit_price || it.prezzo_unitario)}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={() => aggiornaQta(openOrder.id, it.id, (it.quantita || it.quantity || 1) - 1)} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#e2e8f0', cursor: 'pointer', fontSize: 16 }}>−</button>
                            <span style={{ color: '#e2e8f0', fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{it.quantita || it.quantity || 1}</span>
                            <button onClick={() => aggiornaQta(openOrder.id, it.id, (it.quantita || it.quantity || 1) + 1)} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#e2e8f0', cursor: 'pointer', fontSize: 16 }}>+</button>
                          </div>
                        </td>
                        <td style={{ padding: '12px', color: '#22c55e', fontWeight: 600 }}>{fmt((it.unit_price || it.prezzo_unitario) * (it.quantita || it.quantity || 1))}</td>
                        <td style={{ padding: '12px' }}><button onClick={() => rimuoviItem(openOrder.id, it.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (<div style={{ color: '#64748b', textAlign: 'center', padding: '24px 0', fontSize: 14 }}>Nessun articolo. Usa la ricerca per aggiungere display.</div>)}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={() => eliminaOrdine(openOrder.id)} style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>🗑️ Elimina ordine</button>
                <button onClick={() => generaPDF(openOrder)} style={{ padding: '12px 24px', borderRadius: 10, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>📄 Genera PDF & Stampa</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'incassare' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ordiniDaIncassare.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '48px 0' }}>Nessun ordine da incassare</div>
          ) : ordiniDaIncassare.map(o => (
            <div key={o.id} style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{o.numero || o.order_number}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{o.supplier_name || o.fornitore_nome} · {o.items_count || 0} modelli · {new Date(o.created_at).toLocaleDateString('it-IT')}</div>
              </div>
              <span style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>📄 PDF Generato</span>
              <span style={{ color: '#22c55e', fontWeight: 700 }}>{fmt(o.totale || o.total_amount)}</span>
              <button onClick={() => generaPDF(o)} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>🖸️ Ristampa</button>
              <button onClick={() => cambiStato(o.id, 'waiting_payment')} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', cursor: 'pointer', fontSize: 12 }}>📨 Segna Inviato</button>
              <button onClick={() => cambiStato(o.id, 'paid')} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', cursor: 'pointer', fontSize: 12 }}>✅ Forza ✓</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'archivio' && (
        <div>
          <div style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>{ordiniPagati.length} ordini · {fmt(ordiniPagati.reduce((s, o) => s + Number(o.totale || o.total_amount || 0), 0))} incassati</div>
          {ordiniPagati.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '48px 0' }}>Nessun ordine pagato</div>
          ) : ordiniPagati.map(o => (
            <div key={o.id} style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700, color: '#e2e8f0' }}>{o.numero || o.order_number}</div><div style={{ color: '#64748b', fontSize: 12 }}>{o.supplier_name || o.fornitore_nome} · {o.items_count || 0} modelli · {new Date(o.created_at).toLocaleDateString('it-IT')}</div></div>
              <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>✅ Pagato</span>
              <span style={{ color: '#22c55e', fontWeight: 700 }}>{fmt(o.totale || o.total_amount)}</span>
              <button onClick={() => generaPDF(o)} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>🖸️ Ristampa</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'fornitori' && (
        <div>
          <h3 style={{ color: '#e2e8f0', margin: '0 0 20px' }}>Fornitori</h3>
          <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#a5b4fc', marginBottom: 14 }}>+ Nuovo Fornitore</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input placeholder="Nome *" value={nuovoFornitore.nome} onChange={e => setNuovoFornitore(p => ({ ...p, nome: e.target.value }))} style={{ flex: 2, minWidth: 160, padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 13 }} />
              <input placeholder="Email" value={nuovoFornitore.email} onChange={e => setNuovoFornitore(p => ({ ...p, email: e.target.value }))} style={{ flex: 2, minWidth: 160, padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 13 }} />
              <input placeholder="Telefono" value={nuovoFornitore.telefono} onChange={e => setNuovoFornitore(p => ({ ...p, telefono: e.target.value }))} style={{ flex: 1, minWidth: 120, padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 13 }} />
              <button onClick={aggiungiFornitore} style={{ padding: '9px 20px', borderRadius: 8, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Aggiungi</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fornitori.map(f => (
              <div key={f.id} style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{f.nome?.[0]?.toUpperCase()}</div>
                <div style={{ flex: 1 }}><div style={{ color: '#e2e8f0', fontWeight: 600 }}>{f.nome}</div><div style={{ color: '#64748b', fontSize: 12 }}>{f.email} {f.telefono ? `· ${f.telefono}` : ''}</div></div>
                <button onClick={() => eliminaFornitore(f.id)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
            ))}
            {fornitori.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>Nessun fornitore. Aggiungine uno sopra.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function TabAdmin({ showToast }) {
  const [adminTab, setAdminTab] = useState('panoramica');
  const [stats, setStats] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [settings, setSettings] = useState({ global_margin_type: 'percentage', global_margin_value: 20 });
  const [company, setCompany] = useState({ company_name: '', company_address: '', company_city: '', company_phone: '', company_email: '', company_vat: '' });
  const [uploading, setUploading] = useState(false);
  const [versionName, setVersionName] = useState('');
  const fileRef = useRef();

  async function loadData() {
    try {
      const [st, up, se, co] = await Promise.all([
        fetch(`${VD}/stats`).then(r => r.json()),
        fetch(`${VD}/uploads`).then(r => r.json()),
        fetch(`${VD}/settings`).then(r => r.json()),
        fetch(`${VD}/company`).then(r => r.json())
      ]);
      setStats(st);
      setUploads(Array.isArray(up) ? up : []);
      setSettings(se);
      const compRow = Array.isArray(co) ? co[0] : co;
      if (compRow) setCompany(compRow);
    } catch (e) { showToast('Errore caricamento', 'error'); }
  }

  useEffect(() => { loadData(); }, []);

  async function uploadFile() {
    if (!fileRef.current?.files?.[0]) return showToast('Seleziona un file', 'error');
    setUploading(true);
    const fd = new FormData();
    fd.append('file', fileRef.current.files[0]);
    fd.append('version_name', versionName || fileRef.current.files[0].name);
    const r = await fetch(`${VD}/uploads`, { method: 'POST', body: fd });
    const data = await r.json();
    setUploading(false);
    if (r.ok) { showToast(`✅ Caricati ${data.count} modelli`, 'success'); setVersionName(''); fileRef.current.value = ''; await loadData(); }
    else showToast(data.error || 'Errore upload', 'error');
  }

  async function activateUpload(id) {
    await fetch(`${VD}/uploads/${id}/activate`, { method: 'POST' });
    showToast('Listino attivato!', 'success');
    await loadData();
  }

  async function deleteUpload(id) {
    if (!confirm('Eliminare questo listino?')) return;
    await fetch(`${VD}/uploads/${id}`, { method: 'DELETE' });
    showToast('Listino eliminato', 'success');
    await loadData();
  }

  async function saveSettings() {
    const r = await fetch(`${VD}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    if (r.ok) showToast('Impostazioni salvate!', 'success');
    else showToast('Errore', 'error');
    await loadData();
  }

  async function saveCompany() {
    const r = await fetch(`${VD}/company`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(company) });
    if (r.ok) showToast('Dati azienda salvati!', 'success');
    else showToast('Errore', 'error');
  }

  const marginVal = parseFloat(settings.global_margin_value) || 0;
  const isPerc = settings.global_margin_type === 'percentage';
  const examples = [10, 25, 50];
  const adminTabs = [
    { key: 'panoramica', label: '📊 Panoramica' },
    { key: 'listino', label: '📥 Carica Listino' },
    { key: 'margine', label: '⚙️ Margine' },
    { key: 'azienda', label: '🏢 Dati Azienda' }
  ];

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ width: 180, flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: 1, marginBottom: 12 }}>PANNELLO ADMIN</div>
        {adminTabs.map(t => (
          <button key={t.key} onClick={() => setAdminTab(t.key)} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 8, marginBottom: 4, background: adminTab === t.key ? 'rgba(99,102,241,0.15)' : 'transparent', border: adminTab === t.key ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent', color: adminTab === t.key ? '#a5b4fc' : '#64748b', cursor: 'pointer', fontSize: 13 }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1 }}>
        {adminTab === 'panoramica' && stats && (
          <div>
            <h3 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: 20 }}>Panoramica</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
              {[
                { label: 'MODELLI ATTIVI', value: stats.totalModels, color: '#6366f1' },
                { label: 'MARCHE', value: stats.totalBrands, color: '#22c55e' },
                { label: 'LISTINO ATTIVO', value: stats.activeUpload?.filename || 'Nessuno', color: '#f59e0b', small: true },
                { label: 'MARGINE GLOBALE', value: `${stats.settings?.global_margin_value ?? 20}${stats.settings?.global_margin_type === 'fixed' ? ' €' : '%'}`, color: '#a5b4fc' }
              ].map(c => (
                <div key={c.label} style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px', borderTop: `2px solid ${c.color}` }}>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>{c.label}</div>
                  <div style={{ fontSize: c.small ? 14 : 28, fontWeight: 700, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>
            <h4 style={{ color: '#94a3b8', marginBottom: 12 }}>Storico Listini</h4>
            {uploads.map(u => (
              <div key={u.id} style={{ background: u.attivo ? 'rgba(34,197,94,0.05)' : 'rgba(15,23,42,0.6)', border: `1px solid ${u.attivo ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: u.attivo ? '#22c55e' : '#334155', flexShrink: 0 }} />
                <div style={{ flex: 1 }}><div style={{ color: '#e2e8f0', fontWeight: 600 }}>{u.filename}</div><div style={{ color: '#64748b', fontSize: 12 }}>{u.righe} modelli · {new Date(u.created_at).toLocaleString('it-IT')}</div></div>
                {u.attivo && <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>✓ Attivo</span>}
              </div>
            ))}
          </div>
        )}

        {adminTab === 'listino' && (
          <div>
            <h3 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: 20 }}>Carica Listino</h3>
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Carica un file Excel (.xlsx) con colonne: <strong style={{ color: '#a5b4fc' }}>brand, modello, prezzo</strong>. Le colonne vengono riconosciute automaticamente.</div>
              <input placeholder="Nome versione (es. Listino Q1 2026)" value={versionName} onChange={e => setVersionName(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
              <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ marginBottom: 12, color: '#94a3b8', fontSize: 13 }} />
              <button onClick={uploadFile} disabled={uploading} style={{ padding: '11px 24px', borderRadius: 10, background: uploading ? '#334155' : '#6366f1', border: 'none', color: '#fff', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}>
                {uploading ? '⏳ Caricamento...' : '📤 Carica Listino'}
              </button>
            </div>
            {uploads.map(u => (
              <div key={u.id} style={{ background: u.attivo ? 'rgba(34,197,94,0.05)' : 'rgba(15,23,42,0.6)', border: `1px solid ${u.attivo ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}><div style={{ color: '#e2e8f0', fontWeight: 600 }}>{u.filename}</div><div style={{ color: '#64748b', fontSize: 12 }}>{u.righe} modelli · {new Date(u.created_at).toLocaleString('it-IT')}</div></div>
                {!u.attivo && <button onClick={() => activateUpload(u.id)} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', cursor: 'pointer', fontSize: 12 }}>✓ Attiva</button>}
                {u.attivo && <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>✓ Attivo</span>}
                {!u.attivo && <button onClick={() => deleteUpload(u.id)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>🗑️</button>}
              </div>
            ))}
          </div>
        )}

        {adminTab === 'margine' && (
          <div>
            <h3 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: 8 }}>Impostazioni Margine</h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>Il listino indica il prezzo a cui <strong style={{ color: '#e2e8f0' }}>loro ti pagano</strong> i display. Il margine viene <strong style={{ color: '#e2e8f0' }}>sottratto</strong> per calcolare quanto offrire al cliente.</p>
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, maxWidth: 500 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 14 }}>Tipo di margine</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                {[['percentage', 'Percentuale (%)', 'Es. 20% → fornitore paga €15, tu offri €12'], ['fixed', 'Fisso (€)', 'Es. €5 → fornitore paga €15, tu offri €10']].map(([k, label, desc]) => (
                  <button key={k} onClick={() => setSettings(s => ({ ...s, global_margin_type: k }))} style={{ flex: 1, padding: '14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', background: settings.global_margin_type === k ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)', border: `2px solid ${settings.global_margin_type === k ? '#6366f1' : 'rgba(255,255,255,0.08)'}`, color: settings.global_margin_type === k ? '#a5b4fc' : '#64748b' }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 12 }}>{desc}</div>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>VALORE MARGINE ({isPerc ? '%' : '€'})</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ color: '#64748b', fontSize: 14 }}>{isPerc ? '%' : '€'}</span>
                <input type="number" value={settings.global_margin_value} min="0" max={isPerc ? 100 : 1000} step="0.5" onChange={e => setSettings(s => ({ ...s, global_margin_value: e.target.value }))} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 18, fontWeight: 700 }} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>ANTEPRIMA — COSA SUCCEDE AI PREZZI</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 8, alignItems: 'center', fontSize: 13 }}>
                  <div style={{ color: '#64748b' }}>Fornitore ti paga</div><div /><div style={{ color: '#a5b4fc' }}>Tu offri</div><div /><div style={{ color: '#22c55e' }}>Guadagni</div>
                  {examples.map(ex => {
                    const off = isPerc ? Math.max(0, ex * (1 - marginVal / 100)) : Math.max(0, ex - marginVal);
                    const gain = ex - off;
                    return [
                      <div key={`p${ex}`} style={{ color: '#e2e8f0', fontWeight: 600 }}>{ex.toFixed(2)} €</div>,
                      <div key={`a${ex}`} style={{ color: '#475569' }}>→</div>,
                      <div key={`o${ex}`} style={{ color: '#a5b4fc', fontWeight: 700 }}>{off.toFixed(2)} €</div>,
                      <div key={`b${ex}`} />,
                      <div key={`g${ex}`} style={{ color: '#22c55e' }}>+{gain.toFixed(2)} €</div>
                    ];
                  })}
                </div>
              </div>
              <button onClick={saveSettings} style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Salva impostazioni</button>
            </div>
          </div>
        )}

        {adminTab === 'azienda' && (
          <div>
            <h3 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: 8 }}>Dati Azienda</h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>Questi dati appaiono nell'intestazione dei PDF degli ordini.</p>
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, maxWidth: 560 }}>
              {[
                { key: 'company_name', label: 'RAGIONE SOCIALE *', placeholder: 'Es. PatchUP Srl' },
                { key: 'company_address', label: 'INDIRIZZO', placeholder: 'Es. Via Roma 1' },
                { key: 'company_city', label: 'CITTÀ', placeholder: 'Es. Milano, MI 20100' },
                { key: 'company_phone', label: 'TELEFONO', placeholder: '+39 02 1234567' },
                { key: 'company_email', label: 'EMAIL', placeholder: 'info@azienda.it' },
                { key: 'company_vat', label: 'P.IVA / C.F.', placeholder: 'IT12345678901' }
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
                  <input value={company[f.key] || ''} placeholder={f.placeholder} onChange={e => setCompany(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>📄 ANTEPRIMA INTESTAZIONE PDF</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#e2e8f0' }}>{company.company_name || 'Nome Azienda'}</div>
              </div>
              <button onClick={saveCompany} style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Salva Dati Azienda</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Cache company per PDF
let db_company_cache = null;

export default function ValutazioneDisplay({ api, showToast, onNavigate }) {
  const [activeTab, setActiveTab] = useState('ricerca');

  useEffect(() => {
    fetch(`${VD}/company`).then(r => r.json()).then(data => {
      db_company_cache = Array.isArray(data) ? data[0] : data;
    }).catch(() => {});
  }, []);

  const toast = showToast || ((msg, type) => console.log(type, msg));
  const tabs = [
    { key: 'ricerca', label: '🔍 Ricerca' },
    { key: 'ordini', label: '🧾 Ordini' },
    { key: 'admin', label: '⚙️ Admin' }
  ];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>🔍 Valutazione Display</h2>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13 }}>Strumento per valutare e acquistare display dai clienti</p>
      </div>
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === t.key ? '#a5b4fc' : '#64748b', borderBottom: activeTab === t.key ? '2px solid #6366f1' : '2px solid transparent', fontSize: 14, fontWeight: activeTab === t.key ? 600 : 400, transition: 'all 0.15s', marginBottom: -1 }}>{t.label}</button>
        ))}
      </div>
      {activeTab === 'ricerca' && <TabRicerca api={api} showToast={toast} />}
      {activeTab === 'ordini' && <TabOrdini showToast={toast} />}
      {activeTab === 'admin' && <TabAdmin showToast={toast} />}
    </div>
  );
}
