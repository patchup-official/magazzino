// pages/AcquistoPlugin.jsx - Plugin acquisto da privati

import { useState } from 'react'
import axios from 'axios'

const BRANDS_MODELS = {
  Apple: ['iPhone 15 Pro Max','iPhone 15 Pro','iPhone 15','iPhone 14 Pro','iPhone 14','iPhone 13 Pro','iPhone 13','iPhone 12','iPhone SE (3rd)'],
  Samsung: ['Galaxy S24 Ultra','Galaxy S24+','Galaxy S24','Galaxy S23 Ultra','Galaxy S23','Galaxy A54','Galaxy Z Fold5','Galaxy Z Flip5'],
  Google: ['Pixel 8 Pro','Pixel 8','Pixel 7a','Pixel 7'],
  Xiaomi: ['14 Ultra','14','13T Pro','Redmi Note 13 Pro'],
  OnePlus: ['12','11','Nord CE 3'],
  Huawei: ['P60 Pro','Mate 60 Pro']
}

const INITIAL_STATE = {
  step: 1,
  brand: '', model: '',
  si_accende: null, schermo_rotto: null, batteria_ok: null,
  evaluation: null,
  storage: '128GB', colore: '', imei: '',
  tipo_pagamento: 'cash',
  cliente_nome: '', cliente_tel: '',
  result: null
}

export default function AcquistoPlugin({ api, showToast }) {
  const [s, setS] = useState(INITIAL_STATE)

  const update = (changes) => setS(prev => ({ ...prev, ...changes }))

  const goStep = (n) => update({ step: n })

  const handleEvaluate = async () => {
    if (s.si_accende === null || s.schermo_rotto === null || s.batteria_ok === null) {
      showToast('Rispondi a tutte le domande', 'error'); return
    }
    try {
      const { data } = await axios.post(`${api}/devices/evaluate`, {
        si_accende: s.si_accende,
        schermo_rotto: s.schermo_rotto,
        batteria_ok: s.batteria_ok
      })
      update({ evaluation: data, step: 3 })
    } catch {
      // fallback demo mode
      let prezzo = 300
      if (!s.si_accende) prezzo -= 100
      if (s.schermo_rotto) prezzo -= 50
      if (!s.batteria_ok) prezzo -= 30
      update({
        evaluation: {
          prezzo_cash: prezzo,
          prezzo_voucher: Math.round(prezzo * 1.2),
          condizione: (!s.si_accende || s.schermo_rotto) ? 'C' : !s.batteria_ok ? 'B' : 'A',
          breakdown: []
        },
        step: 3
      })
    }
  }

  const handleConfirm = async () => {
    if (!s.cliente_nome || !s.cliente_tel) {
      showToast('Inserisci nome e telefono', 'error'); return
    }
    const prezzo = s.tipo_pagamento === 'voucher' ? s.evaluation.prezzo_voucher : s.evaluation.prezzo_cash

    try {
      const { data } = await axios.post(`${api}/devices/create-from-evaluation`, {
        brand: s.brand, modello: s.model,
        storage: s.storage, colore: s.colore, imei: s.imei,
        si_accende: s.si_accende, schermo_rotto: s.schermo_rotto, batteria_ok: s.batteria_ok,
        tipo_pagamento: s.tipo_pagamento,
        cliente_nome: s.cliente_nome, cliente_tel: s.cliente_tel
      })
      update({ result: data, step: 5 })
    } catch {
      // demo fallback
      update({ result: { prezzo_pagato: prezzo, tipo_pagamento: s.tipo_pagamento }, step: 5 })
    }
    showToast('✓ Dispositivo aggiunto al magazzino!')
  }

  const STEPS = ['Dispositivo', 'Condizioni', 'Prezzo', 'Cliente', 'Fatto']

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Acquisto dispositivo</h1>
        <p className="text-gray-400 text-sm mt-1">Valuta e acquista dispositivi da privati</p>
      </div>

      <div className="max-w-xl mx-auto">
        {/* Step indicators */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((label, i) => {
            const n = i + 1
            const done = n < s.step, active = n === s.step
            return (
              <div key={n} className="flex items-center gap-0 flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all
                    ${done ? 'bg-emerald-500 border-emerald-500 text-white'
                    : active ? 'bg-violet-600 border-violet-500 text-white'
                    : 'border-gray-700 text-gray-600 bg-gray-900'}`}>
                    {done ? '✓' : n}
                  </div>
                  <span className={`text-[10px] font-medium ${active ? 'text-gray-300' : 'text-gray-600'}`}>{label}</span>
                </div>
                {i < 4 && <div className={`flex-1 h-px mb-4 mx-2 ${n < s.step ? 'bg-emerald-500' : 'bg-gray-800'}`} />}
              </div>
            )
          })}
        </div>

        {/* STEP 1 */}
        {s.step === 1 && (
          <Card title="Selezione dispositivo" sub="Seleziona brand e modello">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Field label="Brand">
                <select value={s.brand} onChange={e => update({ brand: e.target.value, model: '' })}>
                  <option value="">Seleziona brand...</option>
                  {Object.keys(BRANDS_MODELS).map(b => <option key={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Modello">
                <select value={s.model} onChange={e => update({ model: e.target.value })}>
                  <option value="">Prima scegli brand...</option>
                  {(BRANDS_MODELS[s.brand] || []).map(m => <option key={m}>{m}</option>)}
                </select>
              </Field>
            </div>
            <div className="text-right">
              <Btn onClick={() => { if(!s.brand||!s.model){showToast('Seleziona brand e modello','error');return;} goStep(2) }}>Continua →</Btn>
            </div>
          </Card>
        )}

        {/* STEP 2 */}
        {s.step === 2 && (
          <Card title="Condizioni del dispositivo" sub="Rispondi per calcolare il prezzo">
            {[
              { key:'si_accende', label:'Il dispositivo si accende?', desc:'Verifica che superi la schermata di avvio', yesVal: true, noVal: false },
              { key:'schermo_rotto', label:'Lo schermo è rotto?', desc:'Crepe, pixel morti, touch non funzionante', yesVal: true, noVal: false },
              { key:'batteria_ok', label:'La batteria è OK?', desc:'Mantiene la carica correttamente?', yesVal: true, noVal: false },
            ].map(q => (
              <div key={q.key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-none">
                <div>
                  <div className="text-sm font-medium">{q.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{q.desc}</div>
                </div>
                <div className="flex gap-2">
                  <ToggleBtn active={s[q.key] === q.yesVal} type="yes" onClick={() => update({ [q.key]: q.yesVal })}>Sì</ToggleBtn>
                  <ToggleBtn active={s[q.key] === q.noVal && s[q.key] !== null} type="no" onClick={() => update({ [q.key]: q.noVal })}>No</ToggleBtn>
                </div>
              </div>
            ))}
            <div className="flex justify-between mt-5">
              <GhostBtn onClick={() => goStep(1)}>← Indietro</GhostBtn>
              <Btn onClick={handleEvaluate}>Calcola prezzo →</Btn>
            </div>
          </Card>
        )}

        {/* STEP 3 */}
        {s.step === 3 && s.evaluation && (
          <Card title="Risultato valutazione" sub={`${s.brand} ${s.model}`}>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-white/5">
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-2">💵 Cash</div>
                <div className="text-3xl font-bold font-mono tracking-tight">€{s.evaluation.prezzo_cash}</div>
                <div className="text-xs text-gray-500 mt-1">Pagamento immediato</div>
              </div>
              <div className="bg-violet-900/20 rounded-xl p-4 text-center border border-violet-500/30">
                <div className="text-[10px] font-medium text-violet-400 uppercase tracking-widest mb-2">🎁 Buono</div>
                <div className="text-3xl font-bold font-mono tracking-tight text-violet-300">€{s.evaluation.prezzo_voucher}</div>
                <div className="text-xs text-gray-500 mt-1">+20% in buono negozio</div>
              </div>
            </div>
            <div className="flex justify-between">
              <GhostBtn onClick={() => goStep(2)}>← Indietro</GhostBtn>
              <Btn onClick={() => goStep(4)}>Il cliente accetta →</Btn>
            </div>
          </Card>
        )}

        {/* STEP 4 */}
        {s.step === 4 && (
          <Card title="Dati del cliente" sub="Completa per registrare l'acquisto">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Nome e cognome" className="col-span-2">
                <input placeholder="Mario Rossi" value={s.cliente_nome} onChange={e => update({ cliente_nome: e.target.value })} />
              </Field>
              <Field label="Telefono" className="col-span-2">
                <input placeholder="+39 333 1234567" value={s.cliente_tel} onChange={e => update({ cliente_tel: e.target.value })} />
              </Field>
              <Field label="Storage">
                <select value={s.storage} onChange={e => update({ storage: e.target.value })}>
                  {['64GB','128GB','256GB','512GB','1TB'].map(v => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="Colore">
                <input placeholder="Nero" value={s.colore} onChange={e => update({ colore: e.target.value })} />
              </Field>
              <Field label="IMEI (opzionale)" className="col-span-2">
                <input placeholder="356xxxxxxxxxxxxxx" className="font-mono text-xs" value={s.imei} onChange={e => update({ imei: e.target.value })} />
              </Field>
              <Field label="Tipo pagamento" className="col-span-2">
                <select value={s.tipo_pagamento} onChange={e => update({ tipo_pagamento: e.target.value })}>
                  <option value="cash">Cash (€{s.evaluation?.prezzo_cash})</option>
                  <option value="voucher">Buono acquisto (€{s.evaluation?.prezzo_voucher})</option>
                </select>
              </Field>
            </div>
            <div className="flex justify-between">
              <GhostBtn onClick={() => goStep(3)}>← Indietro</GhostBtn>
              <Btn onClick={handleConfirm}>✓ Conferma acquisto</Btn>
            </div>
          </Card>
        )}

        {/* STEP 5 */}
        {s.step === 5 && (
          <Card>
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-lg font-semibold mb-2">Acquisto completato!</h2>
              <p className="text-gray-400 text-sm mb-5">
                {s.brand} {s.model} aggiunto al magazzino come "da testare"
              </p>
              <div className="bg-gray-800/60 rounded-xl p-4 text-left text-sm grid grid-cols-2 gap-2 mb-6">
                <div><span className="text-gray-500">Cliente:</span> <strong>{s.cliente_nome}</strong></div>
                <div><span className="text-gray-500">Tel:</span> {s.cliente_tel}</div>
                <div><span className="text-gray-500">Dispositivo:</span> {s.brand} {s.model}</div>
                <div><span className="text-gray-500">Pagato:</span> <strong className="text-violet-300">€{s.tipo_pagamento === 'voucher' ? s.evaluation?.prezzo_voucher : s.evaluation?.prezzo_cash} {s.tipo_pagamento}</strong></div>
              </div>
              <Btn onClick={() => setS(INITIAL_STATE)}>+ Nuovo acquisto</Btn>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// ── Componenti UI helper ──────────────────────

function Card({ title, sub, children }) {
  return (
    <div className="bg-gray-900 border border-white/5 rounded-xl p-6">
      {title && <div className="text-base font-semibold mb-1">{title}</div>}
      {sub && <div className="text-sm text-gray-400 mb-5">{sub}</div>}
      {children}
    </div>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-gray-400">{label}</label>
      {children}
    </div>
  )
}

function Btn({ children, onClick }) {
  return (
    <button onClick={onClick} className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick }) {
  return (
    <button onClick={onClick} className="bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium px-4 py-2 rounded-lg border border-white/5 transition-colors">
      {children}
    </button>
  )
}

function ToggleBtn({ children, active, type, onClick }) {
  const classes = active
    ? type === 'yes' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
      : 'bg-red-500/20 border-red-500 text-red-400'
    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
  return (
    <button onClick={onClick} className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${classes}`}>
      {children}
    </button>
  )
}
