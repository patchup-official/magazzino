// pages/Noleggio.jsx — Plugin Subbyx Demo per Magazzino
// Noleggio dispositivi in abbonamento tramite Subbyx
import { useState, useEffect } from 'react';

// ─── MOCK CATALOGO SUBBYX ──────────────────────────────────────────────────
// In produzione: fetch(`${SUBBYX_API}/catalog`, { headers: { Authorization: `Bearer ${apiKey}` } })
const MOCK_CATALOG = [
  { id: 'iph16pro', brand: 'Apple', model: 'iPhone 16 Pro', storage: '256GB', color: 'Titanio Naturale', condition: 'Nuovo', image: '📱', johnnyx: 49.90, teddyx_start: 44.90, category: 'smartphone' },
  { id: 'iph16', brand: 'Apple', model: 'iPhone 16', storage: '128GB', color: 'Nero', condition: 'Nuovo', image: '📱', johnnyx: 39.90, teddyx_start: 35.90, category: 'smartphone' },
  { id: 'iph15', brand: 'Apple', model: 'iPhone 15', storage: '128GB', color: 'Blu', condition: 'Eccellente', image: '📱', johnnyx: 29.90, teddyx_start: 26.90, category: 'smartphone' },
  { id: 'sam25', brand: 'Samsung', model: 'Galaxy S25 Ultra', storage: '256GB', color: 'Titanio Grigio', condition: 'Nuovo', image: '📱', johnnyx: 54.90, teddyx_start: 49.90, category: 'smartphone' },
  { id: 'sam24', brand: 'Samsung', model: 'Galaxy S24', storage: '128GB', color: 'Nero Onyx', condition: 'Nuovo', image: '📱', johnnyx: 34.90, teddyx_start: 31.90, category: 'smartphone' },
  { id: 'sam24fe', brand: 'Samsung', model: 'Galaxy S24 FE', storage: '128GB', color: 'Viola', condition: 'Nuovo', image: '📱', johnnyx: 24.90, teddyx_start: 22.90, category: 'smartphone' },
  { id: 'ipadpro', brand: 'Apple', model: 'iPad Pro 13"', storage: '256GB', color: 'Argento', condition: 'Nuovo', image: '📲', johnnyx: 64.90, teddyx_start: 59.90, category: 'tablet' },
  { id: 'ipadair', brand: 'Apple', model: 'iPad Air M2', storage: '128GB', color: 'Blu', condition: 'Nuovo', image: '📲', johnnyx: 44.90, teddyx_start: 39.90, category: 'tablet' },
  { id: 'macbookair', brand: 'Apple', model: 'MacBook Air M3', storage: '256GB SSD', color: 'Mezzanotte', condition: 'Nuovo', image: '💻', johnnyx: 79.90, teddyx_start: 74.90, category: 'laptop' },
  { id: 'dell13', brand: 'Dell', model: 'XPS 13 Plus', storage: '512GB SSD', color: 'Platino', condition: 'Nuovo', image: '💻', johnnyx: 69.90, teddyx_start: 64.90, category: 'laptop' },
  { id: 'aw9', brand: 'Apple', model: 'Apple Watch Series 10', storage: '—', color: 'Alluminio Nero', condition: 'Nuovo', image: '⌚', johnnyx: 19.90, teddyx_start: 17.90, category: 'wearable' },
  { id: 'airpodspro', brand: 'Apple', model: 'AirPods Pro 2', storage: '—', color: 'Bianco', condition: 'Nuovo', image: '🎧', johnnyx: 14.90, teddyx_start: 13.90, category: 'audio' },
];

const CATEGORIES = [
  { key: 'all', label: 'Tutti', icon: '◈' },
  { key: 'smartphone', label: 'Smartphone', icon: '📱' },
  { key: 'tablet', label: 'Tablet', icon: '📲' },
  { key: 'laptop', label: 'Laptop', icon: '💻' },
  { key: 'wearable', label: 'Wearable', icon: '⌚' },
  { key: 'audio', label: 'Audio', icon: '🎧' },
];

const SUBBYX_TEAL = '#00C896';
const SUBBYX_DARK = '#0A1628';

const fmt = (n) => `€ ${Number(n).toFixed(2).replace('.', ',')}`;

// Calcola rata Teddyx al mese N (scende del 2% ogni mese, min 50% del valore iniziale)
function teddyxRate(start, month) {
  return Math.max(start * 0.5, start * Math.pow(0.98, month - 1));
}

// ─── STEP 1: RICERCA CATALOGO ─────────────────────────────────────────────
function StepCatalogo({ onSelect }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800); // simula chiamata API
  }, []);

  const filtered = MOCK_CATALOG.filter(p => {
    const matchCat = category === 'all' || p.category === category;
    const matchSearch = !search || `${p.brand} ${p.model}`.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      {/* Header con logo Subbyx */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Catalogo Noleggio</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>Powered by <span style={{ color: SUBBYX_TEAL, fontWeight: 700 }}>Subbyx</span> · {MOCK_CATALOG.length} prodotti disponibili</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: `rgba(0,200,150,0.1)`, border: `1px solid rgba(0,200,150,0.3)` }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: SUBBYX_TEAL, animation: 'pulse 2s infinite' }} />
          <span style={{ color: SUBBYX_TEAL, fontSize: 12, fontWeight: 600 }}>API Connessa</span>
        </div>
      </div>

      {/* Barra ricerca */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          placeholder="🔍  Cerca dispositivo (es. iPhone 16, MacBook...)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '11px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 14, outline: 'none' }}
        />
      </div>

      {/* Filtri categoria */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setCategory(c.key)} style={{
            padding: '6px 14px', borderRadius: 20, border: '1px solid',
            borderColor: category === c.key ? SUBBYX_TEAL : 'rgba(255,255,255,0.1)',
            background: category === c.key ? `rgba(0,200,150,0.12)` : 'rgba(255,255,255,0.03)',
            color: category === c.key ? SUBBYX_TEAL : '#64748b',
            cursor: 'pointer', fontSize: 12, fontWeight: 600
          }}>{c.icon} {c.label}</button>
        ))}
      </div>

      {/* Griglia prodotti */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div>Caricamento catalogo Subbyx...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {filtered.map(p => (
            <button key={p.id} onClick={() => onSelect(p)} style={{
              padding: 16, borderRadius: 14, background: 'rgba(15,23,42,0.8)',
              border: '1px solid rgba(255,255,255,0.07)',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              position: 'relative', overflow: 'hidden'
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = SUBBYX_TEAL; e.currentTarget.style.background = 'rgba(0,200,150,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(15,23,42,0.8)'; }}
            >
              {p.condition === 'Eccellente' && (
                <div style={{ position: 'absolute', top: 10, right: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 10, fontWeight: 600 }}>PRELOVED</div>
              )}
              <div style={{ fontSize: 36, marginBottom: 10 }}>{p.image}</div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.5 }}>{p.brand}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{p.model}</div>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>{p.storage} · {p.color}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>da</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: SUBBYX_TEAL }}>{fmt(p.johnnyx)}<span style={{ fontSize: 11, fontWeight: 400, color: '#64748b' }}>/mese</span></div>
                </div>
                <div style={{ padding: '6px 10px', borderRadius: 8, background: `rgba(0,200,150,0.15)`, color: SUBBYX_TEAL, fontSize: 11, fontWeight: 600 }}>Noleggia →</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STEP 2: CALCOLATORE RATE ─────────────────────────────────────────────
function StepCalcolatore({ product, onProceed, onBack }) {
  const [piano, setPiano] = useState('johnnyx'); // johnnyx | teddyx
  const [mesi, setMesi] = useState(12);

  const rata = piano === 'johnnyx'
    ? product.johnnyx
    : teddyxRate(product.teddyx_start, Math.ceil(mesi / 2));

  const totale = piano === 'johnnyx'
    ? product.johnnyx * mesi
    : Array.from({ length: mesi }, (_, i) => teddyxRate(product.teddyx_start, i + 1)).reduce((a, b) => a + b, 0);

  // Preview 6 mesi per Teddyx
  const teddyxPreview = Array.from({ length: Math.min(mesi, 6) }, (_, i) => ({
    mese: i + 1,
    rata: teddyxRate(product.teddyx_start, i + 1)
  }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>← Indietro</button>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Configura il noleggio</h3>
          <p style={{ margin: '2px 0 0', color: SUBBYX_TEAL, fontSize: 13, fontWeight: 600 }}>{product.image} {product.brand} {product.model}</p>
        </div>
      </div>

      {/* Scelta piano */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {/* Johnnyx */}
        <button onClick={() => setPiano('johnnyx')} style={{
          padding: 20, borderRadius: 14, textAlign: 'left', cursor: 'pointer',
          background: piano === 'johnnyx' ? `rgba(0,200,150,0.08)` : 'rgba(255,255,255,0.03)',
          border: `2px solid ${piano === 'johnnyx' ? SUBBYX_TEAL : 'rgba(255,255,255,0.08)'}`,
        }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>⚡</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: piano === 'johnnyx' ? SUBBYX_TEAL : '#e2e8f0', marginBottom: 4 }}>Johnnyx</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>Rata fissa ogni mese. Sempre il dispositivo più aggiornato quando esce il nuovo modello.</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: SUBBYX_TEAL }}>{fmt(product.johnnyx)}<span style={{ fontSize: 13, fontWeight: 400, color: '#64748b' }}>/mese</span></div>
        </button>

        {/* Teddyx */}
        <button onClick={() => setPiano('teddyx')} style={{
          padding: 20, borderRadius: 14, textAlign: 'left', cursor: 'pointer',
          background: piano === 'teddyx' ? `rgba(99,102,241,0.08)` : 'rgba(255,255,255,0.03)',
          border: `2px solid ${piano === 'teddyx' ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
        }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>🐻</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: piano === 'teddyx' ? '#a5b4fc' : '#e2e8f0', marginBottom: 4 }}>Teddyx</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>Rata che si abbassa progressivamente ogni mese. Tieni il device finché vuoi.</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#a5b4fc' }}>{fmt(product.teddyx_start)}<span style={{ fontSize: 13, fontWeight: 400, color: '#64748b' }}>/1° mese</span></div>
        </button>
      </div>

      {/* Durata */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Durata stimata</span>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 16 }}>{mesi} mesi</span>
        </div>
        <input type="range" min="1" max="36" value={mesi} onChange={e => setMesi(Number(e.target.value))}
          style={{ width: '100%', accentColor: SUBBYX_TEAL, cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569', marginTop: 4 }}>
          <span>1 mese</span><span>36 mesi</span>
        </div>
      </div>

      {/* Preview Teddyx */}
      {piano === 'teddyx' && (
        <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>ANDAMENTO RATA TEDDYX</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 60 }}>
            {teddyxPreview.map(({ mese, rata }) => {
              const pct = (rata / product.teddyx_start) * 100;
              return (
                <div key={mese} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', height: `${pct * 0.5}px`, background: 'rgba(99,102,241,0.4)', borderRadius: 4, minHeight: 8 }} />
                  <div style={{ fontSize: 9, color: '#64748b' }}>M{mese}</div>
                  <div style={{ fontSize: 9, color: '#a5b4fc', fontWeight: 600 }}>€{rata.toFixed(0)}</div>
                </div>
              );
            })}
            {mesi > 6 && <div style={{ color: '#475569', fontSize: 12, alignSelf: 'center' }}>···</div>}
          </div>
        </div>
      )}

      {/* Riepilogo */}
      <div style={{ background: piano === 'johnnyx' ? `rgba(0,200,150,0.06)` : 'rgba(99,102,241,0.06)', border: `1px solid ${piano === 'johnnyx' ? 'rgba(0,200,150,0.2)' : 'rgba(99,102,241,0.2)'}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Piano selezionato</span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{piano === 'johnnyx' ? '⚡ Johnnyx' : '🐻 Teddyx'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Durata</span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{mesi} mesi</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Rata {piano === 'teddyx' ? 'media' : ''}</span>
          <span style={{ color: piano === 'johnnyx' ? SUBBYX_TEAL : '#a5b4fc', fontWeight: 700, fontSize: 18 }}>{fmt(rata)}/mese</span>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b', fontSize: 13 }}>Totale stimato ({mesi} mesi)</span>
          <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{fmt(totale)}</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#475569' }}>
          ✓ Senza vincoli · ✓ Assistenza inclusa · ✓ Recesso libero
        </div>
      </div>

      <button onClick={() => onProceed({ piano, mesi, rata, totale })} style={{
        width: '100%', padding: '14px', borderRadius: 12, border: 'none',
        background: `linear-gradient(135deg, ${SUBBYX_TEAL}, #00A878)`,
        color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
        boxShadow: `0 4px 20px rgba(0,200,150,0.3)`
      }}>
        Procedi con l'attivazione →
      </button>
    </div>
  );
}

// ─── FIELD COMPONENT (fuori dal componente per evitare re-mount ad ogni render) ──
function Field({ label, k, placeholder, half, form, set }) {
  return (
    <div style={{ flex: half ? '0 0 calc(50% - 5px)' : '1' }}>
      <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: 0.5, marginBottom: 5 }}>{label}</div>
      <input
        value={form[k]}
        placeholder={placeholder}
        onChange={e => set(k, e.target.value)}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
      />
    </div>
  );
}

// ─── STEP 3: DATI CLIENTE E ATTIVAZIONE ──────────────────────────────────
function StepAttivazione({ product, config, onBack, onDone }) {
  const [form, setForm] = useState({ nome: '', cognome: '', email: '', telefono: '', cf: '', indirizzo: '', cap: '', citta: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function attiva() {
    setLoading(true);
    // Simula chiamata API Subbyx
    await new Promise(r => setTimeout(r, 2000));
    setOrderId('SUB-' + Date.now().toString().slice(-6));
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h3 style={{ color: SUBBYX_TEAL, fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Noleggio attivato!</h3>
        <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>Ordine inviato a Subbyx con successo</p>
        <div style={{ background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)', borderRadius: 14, padding: 20, marginBottom: 24, textAlign: 'left' }}>
          <div style={{ fontSize: 11, color: SUBBYX_TEAL, fontWeight: 600, letterSpacing: 1, marginBottom: 12 }}>RIEPILOGO ORDINE</div>
          {[
            ['ID Ordine', orderId],
            ['Cliente', `${form.nome} ${form.cognome}`],
            ['Dispositivo', `${product.brand} ${product.model}`],
            ['Piano', config.piano === 'johnnyx' ? '⚡ Johnnyx' : '🐻 Teddyx'],
            ['Rata', `${fmt(config.rata)}/mese`],
            ['Durata', `${config.mesi} mesi`],
            ['Stato', '🟢 Confermato — Spedizione entro 2 gg lavorativi'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: '#64748b', fontSize: 13 }}>{k}</span>
              <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#475569', marginBottom: 24 }}>
          Il cliente riceverà una email di conferma da Subbyx. Il dispositivo verrà spedito direttamente all'indirizzo indicato.
        </div>
        <button onClick={onDone} style={{ padding: '12px 32px', borderRadius: 10, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          Nuovo noleggio
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>← Indietro</button>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Dati del cliente</h3>
          <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: 13 }}>{product.brand} {product.model} · {config.piano === 'johnnyx' ? '⚡ Johnnyx' : '🐻 Teddyx'} · {fmt(config.rata)}/mese</p>
        </div>
      </div>

      {/* Riepilogo dispositivo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.15)', borderRadius: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 32 }}>{product.image}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{product.brand} {product.model}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{product.storage} · {product.color} · {product.condition}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: SUBBYX_TEAL }}>{fmt(config.rata)}<span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>/mese</span></div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{config.mesi} mesi · {config.piano === 'johnnyx' ? 'Johnnyx' : 'Teddyx'}</div>
        </div>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <Field label="NOME *" k="nome" placeholder="Mario" half form={form} set={set} />
        <Field label="COGNOME *" k="cognome" placeholder="Rossi" half form={form} set={set} />
        <Field label="EMAIL *" k="email" placeholder="mario.rossi@email.it" form={form} set={set} />
        <Field label="TELEFONO *" k="telefono" placeholder="+39 340 1234567" half form={form} set={set} />
        <Field label="CODICE FISCALE" k="cf" placeholder="RSSMRA80A01H501Z" half form={form} set={set} />
        <Field label="INDIRIZZO *" k="indirizzo" placeholder="Via Roma 1" form={form} set={set} />
        <Field label="CAP *" k="cap" placeholder="20100" half form={form} set={set} />
        <Field label="CITTÀ *" k="citta" placeholder="Milano" half form={form} set={set} />
        <Field label="NOTE" k="note" placeholder="Note per la spedizione..." form={form} set={set} />
      </div>

      {/* Footer legale */}
      <div style={{ fontSize: 11, color: '#475569', marginBottom: 16, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, lineHeight: 1.6 }}>
        Attivando il noleggio il cliente accetta i <span style={{ color: SUBBYX_TEAL }}>Termini e Condizioni Subbyx</span>. Il contratto di abbonamento sarà gestito direttamente da Subbyx S.r.l. La spedizione avviene entro 2 giorni lavorativi dalla conferma.
      </div>

      <button onClick={attiva} disabled={loading || !form.nome || !form.cognome || !form.email} style={{
        width: '100%', padding: '14px', borderRadius: 12, border: 'none',
        background: loading || !form.nome ? 'rgba(0,200,150,0.3)' : `linear-gradient(135deg, ${SUBBYX_TEAL}, #00A878)`,
        color: '#fff', fontSize: 16, fontWeight: 700,
        cursor: loading || !form.nome ? 'not-allowed' : 'pointer',
        boxShadow: `0 4px 20px rgba(0,200,150,0.25)`
      }}>
        {loading ? '⏳ Attivazione in corso...' : `🚀 Attiva noleggio ${fmt(config.rata)}/mese`}
      </button>
    </div>
  );
}

// ─── PANNELLO IMPOSTAZIONI API ─────────────────────────────────────────────
function PannelloImpostazioni({ onSave }) {
  const [apiKey, setApiKey] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testOk, setTestOk] = useState(null);

  async function testApi() {
    setTesting(true);
    setTestOk(null);
    await new Promise(r => setTimeout(r, 1500));
    setTestOk(apiKey.length > 0);
    setTesting(false);
  }

  function save() {
    setSaved(true);
    setTimeout(() => { setSaved(false); onSave && onSave(); }, 1500);
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h3 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: 6 }}>Impostazioni API Subbyx</h3>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
        Inserisci le credenziali fornite da Subbyx per attivare il plugin noleggio. Per ottenere le chiavi API contatta <span style={{ color: SUBBYX_TEAL }}>partner@subbyx.com</span>
      </p>

      <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
        {[
          { label: 'API KEY *', key: 'apiKey', val: apiKey, set: setApiKey, placeholder: 'sbx_live_xxxxxxxxxxxxxxxxxxxx', type: 'password' },
          { label: 'PARTNER CODE', key: 'partnerCode', val: partnerCode, set: setPartnerCode, placeholder: 'ENWON-001', type: 'text' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: 0.5, marginBottom: 6 }}>{f.label}</div>
            <input type={f.type} value={f.val} placeholder={f.placeholder} onChange={e => f.set(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: f.type === 'password' ? 'monospace' : 'inherit' }} />
          </div>
        ))}

        {/* Test connessione */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={testApi} disabled={testing || !apiKey} style={{
            padding: '9px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: apiKey ? 'pointer' : 'not-allowed', fontSize: 13
          }}>
            {testing ? '⏳ Test...' : '🔌 Testa connessione'}
          </button>
          {testOk === true && <span style={{ color: SUBBYX_TEAL, fontSize: 13 }}>✓ Connessione riuscita!</span>}
          {testOk === false && <span style={{ color: '#ef4444', fontSize: 13 }}>✗ API Key non valida</span>}
        </div>
      </div>

      {/* Opzioni */}
      <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: 1, marginBottom: 14 }}>CONFIGURAZIONE</div>
        {[
          ['Mostra piano Johnnyx', true],
          ['Mostra piano Teddyx', true],
          ['Mostra prodotti Preloved', true],
          ['Invio automatico email cliente', false],
        ].map(([label, def]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: '#94a3b8', fontSize: 14 }}>{label}</span>
            <div style={{ width: 36, height: 20, borderRadius: 10, background: def ? SUBBYX_TEAL : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 2, left: def ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </div>
          </div>
        ))}
      </div>

      <button onClick={save} style={{
        padding: '12px 28px', borderRadius: 10, border: 'none',
        background: saved ? '#22c55e' : `linear-gradient(135deg, ${SUBBYX_TEAL}, #00A878)`,
        color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700
      }}>
        {saved ? '✓ Salvato!' : 'Salva impostazioni'}
      </button>
    </div>
  );
}

// ─── COMPONENTE PRINCIPALE ────────────────────────────────────────────────
export default function Noleggio({ api, showToast, onNavigate }) {
  const [tab, setTab] = useState('noleggio'); // noleggio | storico | impostazioni
  const [step, setStep] = useState('catalogo'); // catalogo | calcolatore | attivazione
  const [product, setProduct] = useState(null);
  const [config, setConfig] = useState(null);

  // Storico ordini mock
  const storico = [
    { id: 'SUB-482931', cliente: 'Marco Bianchi', device: 'iPhone 16 Pro', piano: 'Johnnyx', rata: 49.90, data: '12/04/2026', stato: 'attivo' },
    { id: 'SUB-371028', cliente: 'Sara Ferri', device: 'MacBook Air M3', piano: 'Teddyx', rata: 74.90, data: '08/04/2026', stato: 'attivo' },
    { id: 'SUB-294710', cliente: 'Luca Neri', device: 'Samsung Galaxy S25', piano: 'Johnnyx', rata: 54.90, data: '01/04/2026', stato: 'spedito' },
  ];

  const toast = showToast || (() => {});

  const TABS = [
    { key: 'noleggio', label: '📦 Nuovo Noleggio' },
    { key: 'storico', label: '📋 Storico' },
    { key: 'impostazioni', label: '🔑 Impostazioni API' },
  ];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Noleggio Dispositivi</h2>
            <div style={{ padding: '3px 10px', borderRadius: 20, background: `rgba(0,200,150,0.12)`, border: `1px solid rgba(0,200,150,0.3)`, fontSize: 11, fontWeight: 700, color: SUBBYX_TEAL, letterSpacing: 0.5 }}>BETA</div>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
            Abbonamenti flessibili senza vincoli · Powered by{' '}
            <a href="https://subbyx.com" target="_blank" rel="noreferrer" style={{ color: SUBBYX_TEAL, fontWeight: 700, textDecoration: 'none' }}>Subbyx</a>
          </p>
        </div>
        {/* Badge statistiche */}
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'Noleggi attivi', value: '3', color: SUBBYX_TEAL },
            { label: 'Ricavi/mese', value: '€ 179,70', color: '#a5b4fc' },
          ].map(s => (
            <div key={s.label} style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setStep('catalogo'); }} style={{
            padding: '10px 22px', background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t.key ? SUBBYX_TEAL : '#64748b',
            borderBottom: tab === t.key ? `2px solid ${SUBBYX_TEAL}` : '2px solid transparent',
            fontSize: 14, fontWeight: tab === t.key ? 600 : 400, marginBottom: -1
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab: Nuovo noleggio */}
      {tab === 'noleggio' && (
        <>
          {step === 'catalogo' && (
            <StepCatalogo onSelect={p => { setProduct(p); setStep('calcolatore'); }} />
          )}
          {step === 'calcolatore' && product && (
            <StepCalcolatore
              product={product}
              onBack={() => setStep('catalogo')}
              onProceed={cfg => { setConfig(cfg); setStep('attivazione'); }}
            />
          )}
          {step === 'attivazione' && product && config && (
            <StepAttivazione
              product={product}
              config={config}
              onBack={() => setStep('calcolatore')}
              onDone={() => { setStep('catalogo'); setProduct(null); setConfig(null); }}
            />
          )}
        </>
      )}

      {/* Tab: Storico */}
      {tab === 'storico' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ color: '#64748b', fontSize: 14 }}>{storico.length} noleggi totali</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {storico.map(o => (
              <div key={o.id} style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `rgba(0,200,150,0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: SUBBYX_TEAL, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {o.cliente[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 15 }}>{o.cliente}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{o.device} · {o.piano} · Attivato {o.data}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: SUBBYX_TEAL, fontSize: 16 }}>{fmt(o.rata)}<span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>/mese</span></div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 10, background: o.stato === 'attivo' ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)', color: o.stato === 'attivo' ? '#22c55e' : '#a5b4fc', fontWeight: 600 }}>
                      {o.stato === 'attivo' ? '● Attivo' : '📦 Spedito'}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#475569', textAlign: 'right', minWidth: 80 }}>{o.id}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Impostazioni */}
      {tab === 'impostazioni' && (
        <PannelloImpostazioni onSave={() => toast('Impostazioni salvate!', 'success')} />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
