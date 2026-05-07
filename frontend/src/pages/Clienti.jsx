// Clienti.jsx - Gestione anagrafica clienti

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Wizard, { OptionCard, WizField, Summary } from '../components/Wizard'

const GBtn = ({ children, onClick, small, active }) => (
  <button onClick={onClick} style={{
    background: active ? '#1e3a6e' : 'rgba(255,255,255,0.05)',
    border: active ? '1px solid rgba(37,99,235,0.5)' : '1px solid rgba(255,255,255,0.1)',
    color: active ? '#60a5fa' : '#94a3b8',
    borderRadius: 8, padding: small ? '6px 10px' : '8px 14px',
    fontSize: small ? 12 : 13, cursor: 'pointer', fontFamily: 'Inter,sans-serif'
  }}>{children}</button>
)

const PBtn = ({ children, onClick }) => (
  <button onClick={onClick} style={{
    background: '#1e3a6e', border: '1px solid rgba(37,99,235,0.5)', color: '#60a5fa',
    borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'Inter,sans-serif', whiteSpace: 'nowrap'
  }}>{children}</button>
)

const inp = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: 13,
  width: '100%', boxSizing: 'border-box', fontFamily: 'Inter,sans-serif'
}

function WizardCliente({ api, editing, onDone, onClose }) {
  const [f, setF] = useState(editing || {
    tipo: 'persona_fisica',
    nome: '', cognome: '', ragione_soc: '',
    codice_fisc: '', piva: '',
    telefono: '', email: '',
    indirizzo: '', cap: '', citta: '', note: ''
  })
  const upd = c => setF(p => ({ ...p, ...c }))

  const isAzienda = f.tipo === 'partita_iva'

  const steps = [
    {
      label: 'Tipo cliente',
      heading: '👤 Nuovo cliente',
      subtitle: 'Di chi si tratta?',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
          <OptionCard icon="🏢" label="Partita IVA" desc="Azienda o libero professionista"
            selected={f.tipo === 'partita_iva'} onClick={() => upd({ tipo: 'partita_iva' })} />
          <OptionCard icon="🙋" label="Persona Fisica" desc="Cliente privato"
            selected={f.tipo === 'persona_fisica'} onClick={() => upd({ tipo: 'persona_fisica' })} />
        </div>
      )
    },
    {
      label: 'Dati principali',
      heading: isAzienda ? '🏢 Partita IVA' : '🙋 Persona Fisica',
      subtitle: 'Inserisci i dati principali del cliente.',
      validate: () => {
        if (!f.nome.trim()) return 'Il nome è obbligatorio'
        if (isAzienda && !f.ragione_soc.trim()) return 'La ragione sociale è obbligatoria'
      },
      content: (
        <div>
          {isAzienda ? (
            <>
              <WizField label="Ragione Sociale *">
                <input value={f.ragione_soc} onChange={e => upd({ ragione_soc: e.target.value })} placeholder="Acme S.r.l." style={inp} />
              </WizField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <WizField label="Nome referente *">
                  <input value={f.nome} onChange={e => upd({ nome: e.target.value })} placeholder="Mario" style={inp} />
                </WizField>
                <WizField label="Cognome referente">
                  <input value={f.cognome} onChange={e => upd({ cognome: e.target.value })} placeholder="Rossi" style={inp} />
                </WizField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <WizField label="Partita IVA">
                  <input value={f.piva} onChange={e => upd({ piva: e.target.value })} placeholder="IT12345678901" style={inp} />
                </WizField>
                <WizField label="Codice Fiscale">
                  <input value={f.codice_fisc} onChange={e => upd({ codice_fisc: e.target.value })} placeholder="RSSMRA80A01H501Z" style={inp} />
                </WizField>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <WizField label="Nome *">
                  <input value={f.nome} onChange={e => upd({ nome: e.target.value })} placeholder="Mario" style={inp} />
                </WizField>
                <WizField label="Cognome">
                  <input value={f.cognome} onChange={e => upd({ cognome: e.target.value })} placeholder="Rossi" style={inp} />
                </WizField>
              </div>
              <WizField label="Codice Fiscale">
                <input value={f.codice_fisc} onChange={e => upd({ codice_fisc: e.target.value })} placeholder="RSSMRA80A01H501Z" style={inp} />
              </WizField>
            </>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <WizField label="Telefono">
              <input value={f.telefono} onChange={e => upd({ telefono: e.target.value })} placeholder="+39 333 123456" style={inp} />
            </WizField>
            <WizField label="Email">
              <input value={f.email} onChange={e => upd({ email: e.target.value })} placeholder="mario@email.com" style={inp} />
            </WizField>
          </div>
        </div>
      )
    },
    {
      label: 'Recapito',
      heading: '📍 Informazioni recapito',
      subtitle: 'Indirizzo e note aggiuntive. Tutto facoltativo.',
      content: (
        <div>
          <WizField label="Indirizzo">
            <input value={f.indirizzo} onChange={e => upd({ indirizzo: e.target.value })} placeholder="Via Roma 1" style={inp} />
          </WizField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <WizField label="CAP">
              <input value={f.cap} onChange={e => upd({ cap: e.target.value })} placeholder="20100" style={inp} />
            </WizField>
            <WizField label="Città">
              <input value={f.citta} onChange={e => upd({ citta: e.target.value })} placeholder="Milano" style={inp} />
            </WizField>
          </div>
          <WizField label="Note" hint="Informazioni aggiuntive sul cliente">
            <textarea value={f.note} onChange={e => upd({ note: e.target.value })}
              placeholder="Note interne..." style={{ ...inp, minHeight: 70, resize: 'vertical' }} />
          </WizField>
        </div>
      )
    },
    {
      label: 'Conferma',
      heading: '✅ È quasi tutto pronto!',
      subtitle: isAzienda
        ? `Stai creando la scheda di ${f.ragione_soc || f.nome}`
        : `Stai creando la scheda di ${f.nome} ${f.cognome}`.trim(),
      content: (
        <Summary items={[
          { label: 'Tipo', val: isAzienda ? 'Partita IVA' : 'Persona Fisica' },
          isAzienda && { label: 'Ragione Sociale', val: f.ragione_soc },
          { label: 'Nome', val: `${f.nome} ${f.cognome}`.trim() },
          isAzienda && { label: 'P.IVA', val: f.piva },
          { label: 'Cod. Fiscale', val: f.codice_fisc || '—' },
          { label: 'Telefono', val: f.telefono || '—' },
          { label: 'Email', val: f.email || '—' },
          { label: 'Indirizzo', val: [f.indirizzo, f.cap, f.citta].filter(Boolean).join(' ') || '—' },
        ].filter(Boolean)} />
      )
    }
  ]

  const complete = async () => {
    try {
      const { data } = editing
        ? await axios.put(`${api}/clienti/${editing.id}`, f)
        : await axios.post(`${api}/clienti`, f)
      onDone(data.data, editing ? 'edit' : 'add')
    } catch {
      onDone({ ...f, id: Date.now().toString() }, editing ? 'edit' : 'add')
    }
    onClose()
  }

  return <Wizard steps={steps} onComplete={complete} onClose={onClose} title={editing ? 'Modifica cliente' : 'Nuovo cliente'} />
}

// ── Vista Lista ────────────────────────────────────────────────────────────────
function ListaRow({ c, nomeCompleto, onEdit, onDelete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 10, padding: '12px 16px',
    }}>
      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: c.tipo === 'partita_iva' ? 'rgba(124,58,237,0.2)' : 'rgba(37,99,235,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
      }}>
        {c.tipo === 'partita_iva' ? '🏢' : '🙋'}
      </div>

      {/* Nome e tipo */}
      <div style={{ flex: 2, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nomeCompleto(c)}</div>
        <div style={{ fontSize: 11, color: '#475569' }}>{c.tipo === 'partita_iva' ? 'Partita IVA' : 'Persona Fisica'}</div>
      </div>

      {/* Telefono */}
      <div style={{ flex: 1, fontSize: 12, color: '#94a3b8', minWidth: 0 }}>
        {c.telefono ? `📞 ${c.telefono}` : '—'}
      </div>

      {/* Email */}
      <div style={{ flex: 2, fontSize: 12, color: '#94a3b8', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {c.email ? `✉️ ${c.email}` : '—'}
      </div>

      {/* Città */}
      <div style={{ flex: 1, fontSize: 12, color: '#64748b', minWidth: 0 }}>
        {c.citta || '—'}
      </div>

      {/* Azioni */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <GBtn small onClick={() => onEdit(c)}>✏️</GBtn>
        <GBtn small onClick={() => onDelete(c.id)}>🗑️</GBtn>
      </div>
    </div>
  )
}

// ── Vista Griglia ──────────────────────────────────────────────────────────────
function GridCard({ c, nomeCompleto, onEdit, onDelete }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: c.tipo === 'partita_iva' ? 'rgba(124,58,237,0.2)' : 'rgba(37,99,235,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
          }}>
            {c.tipo === 'partita_iva' ? '🏢' : '🙋'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{nomeCompleto(c)}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              {c.tipo === 'partita_iva' ? 'Partita IVA' : 'Persona Fisica'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
        {c.telefono && <div style={{ fontSize: 12, color: '#94a3b8' }}>📞 {c.telefono}</div>}
        {c.email && <div style={{ fontSize: 12, color: '#94a3b8' }}>✉️ {c.email}</div>}
        {c.citta && <div style={{ fontSize: 12, color: '#94a3b8' }}>📍 {[c.indirizzo, c.citta].filter(Boolean).join(', ')}</div>}
        {c.tipo === 'partita_iva' && c.piva && <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>P.IVA {c.piva}</div>}
        {c.codice_fisc && <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>CF {c.codice_fisc}</div>}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <GBtn small onClick={() => onEdit(c)}>✏️ Modifica</GBtn>
        <GBtn small onClick={() => onDelete(c.id)}>🗑️</GBtn>
      </div>
    </div>
  )
}

export default function Clienti({ api, showToast, autoAction, onAutoActionDone }) {
  const [clienti, setClienti] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('griglia') // 'griglia' | 'lista'

  const autoHandled = useRef(false)
  useEffect(() => {
    if (autoAction === 'nuovo_cliente' && !autoHandled.current) {
      autoHandled.current = true
      setModal(true)
      onAutoActionDone?.()
    }
  }, [autoAction])

  useEffect(() => { fetchClienti() }, [])

  const fetchClienti = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${api}/clienti`)
      setClienti(data.data || [])
    } catch {
      setClienti([])
    } finally {
      setLoading(false)
    }
  }

  const handleDone = (cliente, type) => {
    if (type === 'add') setClienti(prev => [cliente, ...prev])
    if (type === 'edit') setClienti(prev => prev.map(c => c.id === cliente.id ? cliente : c))
    setModal(false)
    setEditing(null)
    showToast(type === 'add' ? '✓ Cliente creato' : '✓ Cliente aggiornato')
  }

  const deleteCliente = async (id) => {
    if (!confirm('Eliminare questo cliente?')) return
    setClienti(prev => prev.filter(c => c.id !== id))
    try { await axios.delete(`${api}/clienti/${id}`) } catch {}
    showToast('Cliente eliminato')
  }

  const filtered = clienti.filter(c => {
    const matchTipo = filter === 'all' || c.tipo === filter
    const q = search.toLowerCase()
    const matchSearch = !q || [c.nome, c.cognome, c.ragione_soc, c.telefono, c.email]
      .some(v => v && v.toLowerCase().includes(q))
    return matchTipo && matchSearch
  })

  const nomeCompleto = c => c.tipo === 'partita_iva' && c.ragione_soc
    ? c.ragione_soc
    : `${c.nome || ''} ${c.cognome || ''}`.trim()

  const handleEdit = (c) => { setEditing(c); setModal(true) }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 3 }}>Clienti</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{clienti.length} clienti in archivio</div>
        </div>
        <PBtn onClick={() => { setEditing(null); setModal(true) }}>+ Nuovo cliente</PBtn>
      </div>

      {/* Filtri, ricerca e toggle vista */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Cerca per nome, telefono, email..."
          style={{
            flex: 1, minWidth: 200,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '9px 14px', color: '#e2e8f0', fontSize: 13,
            fontFamily: 'Inter,sans-serif'
          }}
        />

        {/* Filtro tipo */}
        <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3 }}>
          {[['all', 'Tutti'], ['persona_fisica', 'Privati'], ['partita_iva', 'Aziende']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              cursor: 'pointer', border: 'none', fontFamily: 'Inter,sans-serif',
              background: filter === v ? '#1e3a6e' : 'transparent',
              color: filter === v ? '#60a5fa' : '#64748b',
            }}>{l}</button>
          ))}
        </div>

        {/* Toggle griglia/lista */}
        <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3 }}>
          <button onClick={() => setView('griglia')} title="Vista griglia" style={{
            padding: '7px 12px', borderRadius: 8, fontSize: 15, cursor: 'pointer', border: 'none',
            background: view === 'griglia' ? '#1e3a6e' : 'transparent',
            color: view === 'griglia' ? '#60a5fa' : '#64748b',
          }}>⊞</button>
          <button onClick={() => setView('lista')} title="Vista lista" style={{
            padding: '7px 12px', borderRadius: 8, fontSize: 15, cursor: 'pointer', border: 'none',
            background: view === 'lista' ? '#1e3a6e' : 'transparent',
            color: view === 'lista' ? '#60a5fa' : '#64748b',
          }}>☰</button>
        </div>
      </div>

      {/* Contenuto */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>👥</div>
          <div style={{ fontSize: 14, color: '#64748b' }}>
            {search ? 'Nessun risultato per la ricerca' : 'Nessun cliente ancora. Crea il primo!'}
          </div>
        </div>
      ) : view === 'griglia' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
          {filtered.map(c => (
            <GridCard key={c.id} c={c} nomeCompleto={nomeCompleto} onEdit={handleEdit} onDelete={deleteCliente} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Header lista */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '6px 16px', fontSize: 10, fontWeight: 700,
            color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em'
          }}>
            <div style={{ width: 36, flexShrink: 0 }} />
            <div style={{ flex: 2 }}>Nome</div>
            <div style={{ flex: 1 }}>Telefono</div>
            <div style={{ flex: 2 }}>Email</div>
            <div style={{ flex: 1 }}>Città</div>
            <div style={{ width: 80 }} />
          </div>
          {filtered.map(c => (
            <ListaRow key={c.id} c={c} nomeCompleto={nomeCompleto} onEdit={handleEdit} onDelete={deleteCliente} />
          ))}
        </div>
      )}

      {modal && (
        <WizardCliente
          api={api}
          editing={editing}
          onDone={handleDone}
          onClose={() => { setModal(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
