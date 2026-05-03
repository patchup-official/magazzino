// Servizi.jsx - Gestione servizi del negozio

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Wizard, { OptionCard, WizField, Summary } from '../components/Wizard'
import ClienteSelector from '../components/ClienteSelector'

const PRIORITA = { normale:'rgba(100,116,139,0.15)|#94a3b8', alta:'rgba(234,179,8,0.15)|#facc15', urgente:'rgba(239,68,68,0.15)|#f87171' }

const DEFAULT_TIPI = [
  { id:'sblocco', icon:'ð', nome:'Sblocco dispositivo', desc:'Sblocco operatore, codici unlock', prezzo_base:25 },
  { id:'diagnostica', icon:'ð', nome:'Diagnostica', desc:'Test funzionalitÃ , valutazione problemi', prezzo_base:15 },
  { id:'aggiornamento', icon:'â¬ï¸', nome:'Aggiornamento SW', desc:'iOS, Android, firmware update', prezzo_base:20 },
  { id:'backup', icon:'ð¾', nome:'Backup/Ripristino', desc:'Salvataggio e recupero dati', prezzo_base:30 },
  { id:'pellicola', icon:'ð¡ï¸', nome:'Applicazione pellicola', desc:'Installazione vetri temperati/pellicole', prezzo_base:10 },
  { id:'pulizia', icon:'ð§½', nome:'Pulizia/Manutenzione', desc:'Pulizia interna/esterna dispositivo', prezzo_base:15 },
  { id:'configurazione', icon:'âï¸', nome:'Configurazione', desc:'Setup iniziale, trasferimento dati', prezzo_base:25 },
  { id:'altro', icon:'ð§', nome:'Altro servizio', desc:'Servizio personalizzato', prezzo_base:20 }
]
function loadTipi(){ try{ const s=localStorage.getItem('tipi_servizio'); return s?JSON.parse(s):DEFAULT_TIPI; }catch{ return DEFAULT_TIPI; } }
function saveTipi(list){ try{ localStorage.setItem('tipi_servizio',JSON.stringify(list)); }catch{} }
let TIPI_SERVIZIO = loadTipi()

const Badge = ({label, color='#475569', bg='rgba(71,85,105,0.15)'}) => (
  <span style={{ background:bg, color, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:500 }}>{label}</span>
)

const PBtn = ({children, onClick, small}) => (
  <button onClick={onClick} style={{ background:'#1e3a6e', border:'1px solid rgba(37,99,235,0.5)', color:'#60a5fa', borderRadius:8, padding: small ? '6px 12px' : '8px 14px', fontSize: small ? 12 : 13, fontWeight:500, cursor:'pointer', fontFamily:'Inter,sans-serif', whiteSpace:'nowrap' }}>{children}</button>
)

const GBtn = ({children, onClick, small}) => (
  <button onClick={onClick} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:8, padding: small ? '6px 10px' : '8px 14px', fontSize: small ? 12 : 13, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>{children}</button>
)

function WizardServizio({ api, editing, onDone, onClose }) {
  const [f, setF] = useState(editing || {
    cliente:'', telefono:'', dispositivo:'', tipo_servizio:'sblocco',
    descrizione:'', priorita:'normale', prezzo:'', note:'',
    data_richiesta: new Date().toISOString().slice(0,10),
    data_consegna_prevista: '',
    ora_inizio: '',
    durata_minuti: 60
  })
  const upd = c => setF(p=>({...p,...c}))

  useEffect(() => {
    if (!editing) {
      const tipo = TIPI_SERVIZIO.find(t => t.id === f.tipo_servizio)
      if (tipo && !f.prezzo) upd({prezzo: tipo.prezzo_base.toString()})
    }
  }, [f.tipo_servizio])

  const steps = [
    {
      label: 'Cliente e dispositivo',
      heading: 'ð¤ Cliente e dispositivo',
      subtitle: 'Chi Ã¨ il cliente e su quale dispositivo lavoriamo?',
      validate: () => {
        if (!f.cliente.trim()) return 'Inserisci il nome del cliente'
        if (!f.dispositivo.trim()) return 'Inserisci il dispositivo'
      },
      content: (
        <div>
          <WizField label="Cliente">
            <ClienteSelector
              api={api}
              value={f.cliente}
              onChange={val => upd({ cliente: val })}
              onTelChange={tel => upd({ telefono: tel })}
            />
          </WizField>
          <WizField label="Telefono" hint="Si compila automaticamente dall'archivio">
            <input value={f.telefono} onChange={e=>upd({telefono:e.target.value})} placeholder="+39 333 123456" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:13,width:'100%',boxSizing:'border-box',fontFamily:'Inter,sans-serif'}}/>
          </WizField>
          <WizField label="Dispositivo">
            <input value={f.dispositivo} onChange={e=>upd({dispositivo:e.target.value})} placeholder="iPhone 14 Pro, Samsung Galaxy S23..." style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:13,width:'100%',boxSizing:'border-box',fontFamily:'Inter,sans-serif'}}/>
          </WizField>
        </div>
      )
    },
    {
      label: 'Tipo di servizio',
      heading: 'ð ï¸ Che servizio serve?',
      subtitle: 'Scegli il tipo di servizio da erogare.',
      content: (
        <div>
          <WizField label="Servizio richiesto">
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
              {TIPI_SERVIZIO.map(tipo => (
                <OptionCard
                  key={tipo.id}
                  icon={tipo.icon}
                  label={tipo.nome}
                  sublabel={`â¬${tipo.prezzo_base}`}
                  selected={f.tipo_servizio === tipo.id}
                  onClick={() => upd({tipo_servizio: tipo.id, prezzo: tipo.prezzo_base.toString()})}
                />
              ))}
            </div>
          </WizField>
          <WizField label="Descrizione dettagliata">
            <textarea value={f.descrizione} onChange={e=>upd({descrizione:e.target.value})} placeholder="Dettagli specifici del servizio richiesto..." style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:13,minHeight:80,resize:'vertical',width:'100%',boxSizing:'border-box',fontFamily:'Inter,sans-serif'}}/>
          </WizField>
        </div>
      )
    },
    {
      label: 'PrioritÃ  e prezzo',
      heading: 'ð° PrioritÃ  e tariffazione',
      subtitle: 'Imposta prioritÃ , prezzo e tempistiche.',
      validate: () => {
        if (!f.prezzo || isNaN(+f.prezzo) || +f.prezzo <= 0) return 'Inserisci un prezzo valido'
      },
      content: (
        <div>
          <WizField label="PrioritÃ ">
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {[
                {val:'normale', icon:'ð¢', label:'Normale', desc:'Standard'},
                {val:'alta', icon:'ð¡', label:'Alta', desc:'Prioritaria'},
                {val:'urgente', icon:'ð´', label:'Urgente', desc:'Immediata'}
              ].map(p => (
                <OptionCard key={p.val} icon={p.icon} label={p.label} sublabel={p.desc} selected={f.priorita === p.val} onClick={() => upd({priorita: p.val})}/>
              ))}
            </div>
          </WizField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <WizField label="Prezzo (â¬)">
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.4)',fontSize:16}}>â¬</span>
                <input type="number" step="0.01" min="0" value={f.prezzo} onChange={e=>upd({prezzo:e.target.value})} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:13,paddingLeft:30,width:'100%',boxSizing:'border-box',fontFamily:'Inter,sans-serif'}}/>
              </div>
            </WizField>
            <WizField label="Consegna prevista" hint="Facoltativo">
              <input type="date" value={f.data_consegna_prevista} onChange={e=>upd({data_consegna_prevista:e.target.value})} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:13,width:'100%',boxSizing:'border-box',fontFamily:'Inter,sans-serif'}}/>
            </WizField>
          </div>
          <WizField label="Note aggiuntive" hint="Facoltativo">
            <textarea value={f.note} onChange={e=>upd({note:e.target.value})} placeholder="Note interne o comunicazioni al cliente..." style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:13,minHeight:60,resize:'vertical',width:'100%',boxSizing:'border-box',fontFamily:'Inter,sans-serif'}}/>
          </WizField>
        </div>
      )
    },
    {
      label: 'Conferma',
      heading: 'â Tutto ok?',
      subtitle: 'Controlla i dati prima di creare il servizio.',
      content: (
        <Summary items={[
          {label:'Cliente', val:f.cliente},
          {label:'Telefono', val:f.telefono||'â'},
          {label:'Dispositivo', val:f.dispositivo},
          {label:'Servizio', val:TIPI_SERVIZIO.find(t=>t.id===f.tipo_servizio)?.nome},
          {label:'PrioritÃ ', val:f.priorita},
          {label:'Prezzo', val:f.prezzo ? `â¬${f.prezzo}` : 'â'},
          {label:'Consegna prevista', val:f.data_consegna_prevista||'Da definire'},
        ]}/>
      )
    }
  ]

  const complete = async () => {
    const tipoServizio = TIPI_SERVIZIO.find(t => t.id === f.tipo_servizio)
    const payload = {
      cliente: f.cliente.trim(),
      telefono: f.telefono || null,
      dispositivo: f.dispositivo.trim(),
      tipo_servizio: f.tipo_servizio,
      nome_servizio: tipoServizio?.nome,
      descrizione: f.descrizione || null,
      priorita: f.priorita,
      prezzo: +f.prezzo,
      note: f.note || null,
      data_richiesta: f.data_richiesta,
      data_consegna_prevista: f.data_consegna_prevista,
        ora_inizio: f.ora_inizio||undefined,
        durata_minuti: f.durata_minuti||undefined || null,
      stato: 'in_corso'
    }
    try {
      const {data} = await axios.post(`${api}/servizi`, payload)
      onDone(data, 'add')
    } catch {
      onDone({...payload, id:Date.now().toString()}, 'add')
    }
    onClose()
  }

  return <Wizard steps={steps} onComplete={complete} onClose={onClose} title={editing ? 'Modifica servizio' : 'Nuovo servizio'}/>
}

export default function Servizi({ api, showToast, autoAction, onAutoActionDone }) {
  const [servizi, setServizi] = useState([])
  const [filter, setFilter] = useState('in_corso')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const EMOJI_OPZIONI = ['ð§','ð','ð','ð¾','ð¡ï¸','ð§½','âï¸','â¬ï¸','ð±','ð','ð¡','ð¥ï¸','â¨ï¸','ð¨ï¸','ð·','ð®','ð§','ð¡','ð','ð³']

  const autoActionHandled = useRef(false)
  useEffect(() => {
    if (autoAction === 'nuovo_servizio' && !autoActionHandled.current) {
      autoActionHandled.current = true
      setModal(true)
      onAutoActionDone?.()
    }
  }, [autoAction])

  useEffect(() => { fetchServizi() }, [])

  const salvaTipo = () => {
    if(!tipoForm.nome.trim()) return showToast('Nome obbligatorio','error')
    if(!tipoForm.prezzo_base || +tipoForm.prezzo_base<0) return showToast('Prezzo non valido','error')
    let nuovi
    if(editTipo){
      nuovi = tipiLista.map(t=>t.id===editTipo.id ? {...editTipo,...tipoForm,prezzo_base:+tipoForm.prezzo_base} : t)
    } else {
      const id = tipoForm.nome.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')+'-'+Date.now().toString(36)
      nuovi = [...tipiLista, {id,...tipoForm,prezzo_base:+tipoForm.prezzo_base}]
    }
    setTipiLista(nuovi); saveTipi(nuovi); TIPI_SERVIZIO=nuovi
    setShowTipoForm(false); setEditTipo(null); setTipoForm({nome:'',icon:'ð§',desc:'',prezzo_base:''})
    showToast(editTipo?'Tipo aggiornato':'Tipo aggiunto')
  }

  const eliminaTipo = (id) => {
    if(!confirm('Eliminare questo tipo di servizio?')) return
    const nuovi = tipiLista.filter(t=>t.id!==id)
    setTipiLista(nuovi); saveTipi(nuovi); TIPI_SERVIZIO=nuovi
    showToast('Tipo eliminato')
  }

  const fetchServizi = async () => {
    try {
      const { data } = await axios.get(`${api}/servizi`)
      setServizi(data.data || [])
    } catch {
      setServizi(JSON.parse(localStorage.getItem('mag_servizi') || '[]'))
    }
  }

  const handleServizio = (data, type) => {
    if (type === 'add') setServizi(prev => [data, ...prev])
    if (type === 'edit') setServizi(prev => prev.map(s => s.id === data.id ? data : s))
    setModal(false)
    setEditing(null)
    showToast(type === 'add' ? 'â Servizio creato' : 'â Servizio aggiornato')
  }

  const completeServizio = async (id) => {
    setServizi(prev => prev.map(s => s.id === id ? {...s, stato:'completato'} : s))
    try { await axios.put(`${api}/servizi/${id}/complete`) } catch {}
    showToast('â Servizio completato')
  }

  const deleteServizio = async (id) => {
    setServizi(prev => prev.filter(s => s.id !== id))
    try { await axios.delete(`${api}/servizi/${id}`) } catch {}
    showToast('Servizio eliminato')
  }

  const filtered = servizi.filter(s => filter === 'all' ? true : s.stato === filter)

  const priorStyle = (p) => {
    const [bg, color] = (PRIORITA[p] || PRIORITA.normale).split('|')
    return { background: bg, color }
  }

  const StatoBadge = ({ stato }) => {
    const colors = {
      in_corso: { bg:'rgba(37,99,235,0.15)', color:'#60a5fa' },
      completato: { bg:'rgba(22,163,74,0.15)', color:'#4ade80' },
      annullato: { bg:'rgba(239,68,68,0.15)', color:'#f87171' }
    }
    const style = colors[stato] || colors.in_corso
    return <Badge label={stato} bg={style.bg} color={style.color}/>
  }

  return (
    <div className="animate-fade-in">

      
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, marginBottom:3 }}>Servizi</div>
          <div style={{ fontSize:13, color:'#64748b' }}>Gestisci i servizi del negozio</div>
        </div>
        <PBtn onClick={() => { setEditing(null); setModal(true) }}>+ Nuovo servizio</PBtn>
      </div>

      <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:3, width:'fit-content', marginBottom:20 }}>
        {[['in_corso','In corso'],['completato','Completati'],['all','Tutti']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding:'7px 18px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', border:'none', fontFamily:'Inter,sans-serif',
            background: filter === v ? '#1e3a6e' : 'transparent',
            color: filter === v ? '#60a5fa' : '#64748b',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px 0', color:'#475569' }}>
            <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>ð ï¸</div>
            <div style={{ fontSize:14, color:'#64748b' }}>Nessun servizio {filter === 'in_corso' ? 'in corso' : 'trovato'}</div>
          </div>
        ) : filtered.map(s => (
          <div key={s.id} style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:14, marginBottom:3 }}>{s.cliente}</div>
                <div style={{ fontSize:12, color:'#64748b' }}>{s.dispositivo}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5, alignItems:'flex-end' }}>
                <span style={{ ...priorStyle(s.priorita), padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:500 }}>{s.priorita}</span>
                <StatoBadge stato={s.stato}/>
              </div>
            </div>

            <div style={{ fontSize:13, fontWeight:500, color:'#e2e8f0', marginBottom:8 }}>
              {TIPI_SERVIZIO.find(t => t.id === s.tipo_servizio)?.icon} {s.nome_servizio}
            </div>

            {s.descrizione && (
              <div style={{ fontSize:12, color:'#64748b', borderLeft:'2px solid rgba(255,255,255,0.1)', paddingLeft:10, marginBottom:12, lineHeight:1.5 }}>
                {s.descrizione}
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#475569', marginBottom:12 }}>
              <span>{s.telefono || s.data_richiesta}</span>
              <span style={{ fontFamily:'monospace', fontWeight:600 }}>â¬{s.prezzo}</span>
            </div>

            {s.data_consegna_prevista && (
              <div style={{ fontSize:11, color:'#64748b', marginBottom:12 }}>
                ð Consegna: {new Date(s.data_consegna_prevista).toLocaleDateString('it-IT')}
              </div>
            )}

            <div style={{ display:'flex', gap:8 }}>
              {s.stato === 'in_corso' && (
                <button onClick={() => completeServizio(s.id)} style={{ flex:1, background:'rgba(22,163,74,0.15)', border:'1px solid rgba(22,163,74,0.25)', color:'#4ade80', borderRadius:8, padding:'7px 0', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                  â Completato
                </button>
              )}
              <GBtn small onClick={() => { setEditing(s); setModal(true) }}>âï¸</GBtn>
              <GBtn small onClick={() => deleteServizio(s.id)}>ðï¸</GBtn>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <WizardServizio
          api={api}
          editing={editing}
          onDone={handleServizio}
          onClose={() => { setModal(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
// Servizi.jsx - Gestione servizi del negozio

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Wizard, { OptionCard, WizField, Summary } from '../components/Wizard'
import ClienteSelector from '../components/ClienteSelector'

const PRIORITA = { normale:'rgba(100,116,139,0.15)|#94a3b8', alta:'rgba(234,179,8,0.15)|#facc15', urgente:'rgba(239,68,68,0.15)|#f87171' }

const DEFAULT_TIPI = [
  { id:'sblocco', icon:'🔓', nome:'Sblocco dispositivo', desc:'Sblocco operatore, codici unlock', prezzo_base:25 },
  { id:'diagnostica', icon:'🔍', nome:'Diagnostica', desc:'Test funzionalità, valutazione problemi', prezzo_base:15 },
  { id:'aggiornamento', icon:'⬆️', nome:'Aggiornamento SW', desc:'iOS, Android, firmware update', prezzo_base:20 },
  { id:'backup', icon:'💾', nome:'Backup/Ripristino', desc:'Salvataggio e recupero dati', prezzo_base:30 },
  { id:'pellicola', icon:'🛡️', nome:'Applicazione pellicola', desc:'Installazione vetri temperati/pellicole', prezzo_base:10 },
  { id:'pulizia', icon:'🧽', nome:'Pulizia/Manutenzione', desc:'Pulizia interna/esterna dispositivo', prezzo_base:15 },
  { id:'configurazione', icon:'⚙️', nome:'Configurazione', desc:'Setup iniziale, trasferimento dati', prezzo_base:25 },
  { id:'altro', icon:'🔧', nome:'Altro servizio', desc:'Servizio personalizzato', prezzo_base:20 }
]
function loadTipi(){ try{ const s=localStorage.getItem('tipi_servizio'); return s?JSON.parse(s):DEFAULT_TIPI; }catch{ return DEFAULT_TIPI; } }
function saveTipi(list){ try{ localStorage.setItem('tipi_servizio',JSON.stringify(list)); }catch{} }
let TIPI_SERVIZIO = loadTipi()

const Badge = ({label, color='#475569', bg='rgba(71,85,105,0.15)'}) => (
  <span style={{ background:bg, color, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:500 }}>{label}</span>
)

const PBtn = ({children, onClick, small}) => (
  <button onClick={onClick} style={{ background:'#1e3a6e', border:'1px solid rgba(37,99,235,0.5)', color:'#60a5fa', borderRadius:8, padding: small ? '6px 12px' : '8px 14px', fontSize: small ? 12 : 13, fontWeight:500, cursor:'pointer', fontFamily:'Inter,sans-serif', whiteSpace:'nowrap' }}>{children}</button>
)

const GBtn = ({children, onClick, small}) => (
  <button onClick={onClick} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:8, padding: small ? '6px 10px' : '8px 14px', fontSize: small ? 12 : 13, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>{children}</button>
)

function WizardServizio({ api, editing, onDone, onClose }) {
  const [f, setF] = useState(editing || {
    cliente:'', telefono:'', dispositivo:'', tipo_servizio:'sblocco',
    descrizione:'', priorita:'normale', prezzo:'', note:'',
    data_richiesta: new Date().toISOString().slice(0,10),
    data_consegna_prevista: ''
  })
  const upd = c => setF(p=>({...p,...c}))

  useEffect(() => {
    if (!editing) {
      const tipo = TIPI_SERVIZIO.find(t => t.id === f.tipo_servizio)
      if (tipo && !f.prezzo) upd({prezzo: tipo.prezzo_base.toString()})
    }
  }, [f.tipo_servizio])

  const steps = [
    {
      label: 'Cliente e dispositivo',
      heading: '👤 Cliente e dispositivo',
      subtitle: 'Chi è il cliente e su quale dispositivo lavoriamo?',
      validate: () => {
        if (!f.cliente.trim()) return 'Inserisci il nome del cliente'
        if (!f.dispositivo.trim()) return 'Inserisci il dispositivo'
      },
      content: (
        <div>
          <WizField label="Cliente">
            <ClienteSelector
              api={api}
              value={f.cliente}
              onChange={val => upd({ cliente: val })}
              onTelChange={tel => upd({ telefono: tel })}
            />
          </WizField>
          <WizField label="Telefono" hint="Si compila automaticamente dall'archivio">
            <input value={f.telefono} onChange={e=>upd({telefono:e.target.value})} placeholder="+39 333 123456" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:13,width:'100%',boxSizing:'border-box',fontFamily:'Inter,sans-serif'}}/>
          </WizField>
          <WizField label="Dispositivo">
            <input value={f.dispositivo} onChange={e=>upd({dispositivo:e.target.value})} placeholder="iPhone 14 Pro, Samsung Galaxy S23..." style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:13,width:'100%',boxSizing:'border-box',fontFamily:'Inter,sans-serif'}}/>
          </WizField>
        </div>
      )
    },
    {
      label: 'Tipo di servizio',
      heading: '🛠️ Che servizio serve?',
      subtitle: 'Scegli il tipo di servizio da erogare.',
      content: (
        <div>
          <WizField label="Servizio richiesto">
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
              {TIPI_SERVIZIO.map(tipo => (
                <OptionCard
                  key={tipo.id}
                  icon={tipo.icon}
                  label={tipo.nome}
                  sublabel={`€${tipo.prezzo_base}`}
                  selected={f.tipo_servizio === tipo.id}
                  onClick={() => upd({tipo_servizio: tipo.id, prezzo: tipo.prezzo_base.toString()})}
                />
              ))}
            </div>
          </WizField>
          <WizField label="Descrizione dettagliata">
            <textarea value={f.descrizione} onChange={e=>upd({descrizione:e.target.value})} placeholder="Dettagli specifici del servizio richiesto..." style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:13,minHeight:80,resize:'vertical',width:'100%',boxSizing:'border-box',fontFamily:'Inter,sans-serif'}}/>
          </WizField>
        </div>
      )
    },
    {
      label: 'Priorità e prezzo',
      heading: '💰 Priorità e tariffazione',
      subtitle: 'Imposta priorità, prezzo e tempistiche.',
      validate: () => {
        if (!f.prezzo || isNaN(+f.prezzo) || +f.prezzo <= 0) return 'Inserisci un prezzo valido'
      },
      content: (
        <div>
          <WizField label="Priorità">
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {[
                {val:'normale', icon:'🟢', label:'Normale', desc:'Standard'},
                {val:'alta', icon:'🟡', label:'Alta', desc:'Prioritaria'},
                {val:'urgente', icon:'🔴', label:'Urgente', desc:'Immediata'}
              ].map(p => (
                <OptionCard key={p.val} icon={p.icon} label={p.label} sublabel={p.desc} selected={f.priorita === p.val} onClick={() => upd({priorita: p.val})}/>
              ))}
            </div>
          </WizField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <WizField label="Prezzo (€)">
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.4)',fontSize:16}}>€</span>
                <input type="number" step="0.01" min="0" value={f.prezzo} onChange={e=>upd({prezzo:e.target.value})} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:13,paddingLeft:30,width:'100%',boxSizing:'border-box',fontFamily:'Inter,sans-serif'}}/>
              </div>
            </WizField>
            <WizField label="Consegna prevista" hint="Facoltativo">
              <input type="date" value={f.data_consegna_prevista} onChange={e=>upd({data_consegna_prevista:e.target.value})} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:13,width:'100%',boxSizing:'border-box',fontFamily:'Inter,sans-serif'}}/>
            </WizField>
          </div>
          <WizField label="Note aggiuntive" hint="Facoltativo">
            <textarea value={f.note} onChange={e=>upd({note:e.target.value})} placeholder="Note interne o comunicazioni al cliente..." style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:13,minHeight:60,resize:'vertical',width:'100%',boxSizing:'border-box',fontFamily:'Inter,sans-serif'}}/>
          </WizField>
        </div>
      )
    },
    {
      label: 'Conferma',
      heading: '✅ Tutto ok?',
      subtitle: 'Controlla i dati prima di creare il servizio.',
      content: (
        <Summary items={[
          {label:'Cliente', val:f.cliente},
          {label:'Telefono', val:f.telefono||'—'},
          {label:'Dispositivo', val:f.dispositivo},
          {label:'Servizio', val:TIPI_SERVIZIO.find(t=>t.id===f.tipo_servizio)?.nome},
          {label:'Priorità', val:f.priorita},
          {label:'Prezzo', val:f.prezzo ? `€${f.prezzo}` : '—'},
          {label:'Consegna prevista', val:f.data_consegna_prevista||'Da definire'},
        ]}/>
      )
    }
  ]

  const complete = async () => {
    const tipoServizio = TIPI_SERVIZIO.find(t => t.id === f.tipo_servizio)
    const payload = {
      cliente: f.cliente.trim(),
      telefono: f.telefono || null,
      dispositivo: f.dispositivo.trim(),
      tipo_servizio: f.tipo_servizio,
      nome_servizio: tipoServizio?.nome,
      descrizione: f.descrizione || null,
      priorita: f.priorita,
      prezzo: +f.prezzo,
      note: f.note || null,
      data_richiesta: f.data_richiesta,
      data_consegna_prevista: f.data_consegna_prevista || null,
      stato: 'in_corso'
    }
    try {
      const {data} = await axios.post(`${api}/servizi`, payload)
      onDone(data, 'add')
    } catch {
      onDone({...payload, id:Date.now().toString()}, 'add')
    }
    onClose()
  }

  return <Wizard steps={steps} onComplete={complete} onClose={onClose} title={editing ? 'Modifica servizio' : 'Nuovo servizio'}/>
}

export default function Servizi({ api, showToast, autoAction, onAutoActionDone }) {
  const [servizi, setServizi] = useState([])
  const [filter, setFilter] = useState('in_corso')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const EMOJI_OPZIONI = ['🔧','🔓','🔍','💾','🛡️','🧽','⚙️','⬆️','📱','🔋','💡','🖥️','⌨️','🖨️','📷','🎮','🎧','📡','🔌','💳']

  const autoActionHandled = useRef(false)
  useEffect(() => {
    if (autoAction === 'nuovo_servizio' && !autoActionHandled.current) {
      autoActionHandled.current = true
      setModal(true)
      onAutoActionDone?.()
    }
  }, [autoAction])

  useEffect(() => { fetchServizi() }, [])

  const salvaTipo = () => {
    if(!tipoForm.nome.trim()) return showToast('Nome obbligatorio','error')
    if(!tipoForm.prezzo_base || +tipoForm.prezzo_base<0) return showToast('Prezzo non valido','error')
    let nuovi
    if(editTipo){
      nuovi = tipiLista.map(t=>t.id===editTipo.id ? {...editTipo,...tipoForm,prezzo_base:+tipoForm.prezzo_base} : t)
    } else {
      const id = tipoForm.nome.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')+'-'+Date.now().toString(36)
      nuovi = [...tipiLista, {id,...tipoForm,prezzo_base:+tipoForm.prezzo_base}]
    }
    setTipiLista(nuovi); saveTipi(nuovi); TIPI_SERVIZIO=nuovi
    setShowTipoForm(false); setEditTipo(null); setTipoForm({nome:'',icon:'🔧',desc:'',prezzo_base:''})
    showToast(editTipo?'Tipo aggiornato':'Tipo aggiunto')
  }

  const eliminaTipo = (id) => {
    if(!confirm('Eliminare questo tipo di servizio?')) return
    const nuovi = tipiLista.filter(t=>t.id!==id)
    setTipiLista(nuovi); saveTipi(nuovi); TIPI_SERVIZIO=nuovi
    showToast('Tipo eliminato')
  }

  const fetchServizi = async () => {
    try {
      const { data } = await axios.get(`${api}/servizi`)
      setServizi(data.data || [])
    } catch {
      setServizi(JSON.parse(localStorage.getItem('mag_servizi') || '[]'))
    }
  }

  const handleServizio = (data, type) => {
    if (type === 'add') setServizi(prev => [data, ...prev])
    if (type === 'edit') setServizi(prev => prev.map(s => s.id === data.id ? data : s))
    setModal(false)
    setEditing(null)
    showToast(type === 'add' ? '✓ Servizio creato' : '✓ Servizio aggiornato')
  }

  const completeServizio = async (id) => {
    setServizi(prev => prev.map(s => s.id === id ? {...s, stato:'completato'} : s))
    try { await axios.put(`${api}/servizi/${id}/complete`) } catch {}
    showToast('✓ Servizio completato')
  }

  const deleteServizio = async (id) => {
    setServizi(prev => prev.filter(s => s.id !== id))
    try { await axios.delete(`${api}/servizi/${id}`) } catch {}
    showToast('Servizio eliminato')
  }

  const filtered = servizi.filter(s => filter === 'all' ? true : s.stato === filter)

  const priorStyle = (p) => {
    const [bg, color] = (PRIORITA[p] || PRIORITA.normale).split('|')
    return { background: bg, color }
  }

  const StatoBadge = ({ stato }) => {
    const colors = {
      in_corso: { bg:'rgba(37,99,235,0.15)', color:'#60a5fa' },
      completato: { bg:'rgba(22,163,74,0.15)', color:'#4ade80' },
      annullato: { bg:'rgba(239,68,68,0.15)', color:'#f87171' }
    }
    const style = colors[stato] || colors.in_corso
    return <Badge label={stato} bg={style.bg} color={style.color}/>
  }

  return (
    <div className="animate-fade-in">

      
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, marginBottom:3 }}>Servizi</div>
          <div style={{ fontSize:13, color:'#64748b' }}>Gestisci i servizi del negozio</div>
        </div>
        <PBtn onClick={() => { setEditing(null); setModal(true) }}>+ Nuovo servizio</PBtn>
      </div>

      <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:3, width:'fit-content', marginBottom:20 }}>
        {[['in_corso','In corso'],['completato','Completati'],['all','Tutti']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding:'7px 18px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', border:'none', fontFamily:'Inter,sans-serif',
            background: filter === v ? '#1e3a6e' : 'transparent',
            color: filter === v ? '#60a5fa' : '#64748b',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px 0', color:'#475569' }}>
            <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>🛠️</div>
            <div style={{ fontSize:14, color:'#64748b' }}>Nessun servizio {filter === 'in_corso' ? 'in corso' : 'trovato'}</div>
          </div>
        ) : filtered.map(s => (
          <div key={s.id} style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:14, marginBottom:3 }}>{s.cliente}</div>
                <div style={{ fontSize:12, color:'#64748b' }}>{s.dispositivo}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5, alignItems:'flex-end' }}>
                <span style={{ ...priorStyle(s.priorita), padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:500 }}>{s.priorita}</span>
                <StatoBadge stato={s.stato}/>
              </div>
            </div>

            <div style={{ fontSize:13, fontWeight:500, color:'#e2e8f0', marginBottom:8 }}>
              {TIPI_SERVIZIO.find(t => t.id === s.tipo_servizio)?.icon} {s.nome_servizio}
            </div>

            {s.descrizione && (
              <div style={{ fontSize:12, color:'#64748b', borderLeft:'2px solid rgba(255,255,255,0.1)', paddingLeft:10, marginBottom:12, lineHeight:1.5 }}>
                {s.descrizione}
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#475569', marginBottom:12 }}>
              <span>{s.telefono || s.data_richiesta}</span>
              <span style={{ fontFamily:'monospace', fontWeight:600 }}>€{s.prezzo}</span>
            </div>

            {s.data_consegna_prevista && (
              <div style={{ fontSize:11, color:'#64748b', marginBottom:12 }}>
                📅 Consegna: {new Date(s.data_consegna_prevista).toLocaleDateString('it-IT')}
              </div>
            )}

            <div style={{ display:'flex', gap:8 }}>
              {s.stato === 'in_corso' && (
                <button onClick={() => completeServizio(s.id)} style={{ flex:1, background:'rgba(22,163,74,0.15)', border:'1px solid rgba(22,163,74,0.25)', color:'#4ade80', borderRadius:8, padding:'7px 0', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                  ✓ Completato
                </button>
              )}
              <GBtn small onClick={() => { setEditing(s); setModal(true) }}>✏️</GBtn>
              <GBtn small onClick={() => deleteServizio(s.id)}>🗑️</GBtn>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <WizardServizio
          api={api}
          editing={editing}
          onDone={handleServizio}
          onClose={() => { setModal(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
