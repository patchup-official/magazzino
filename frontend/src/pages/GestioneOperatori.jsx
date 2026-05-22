import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const card  = { background: '#1e293b', borderRadius: 14, padding: '1.5rem', border: '1px solid #334155', marginBottom: 16 };
const btn   = (color = '#6366f1') => ({ background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' });
const input = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 13, boxSizing: 'border-box' };
const badge = (color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: color + '22', color });

export default function GestioneOperatori() {
  const { authFetch, user } = useAuth();
  const [operators, setOperators] = useState([]);
  const [newOp,     setNewOp]     = useState({ name: '', username: '', password: '' });
  const [toast,     setToast]     = useState('');
  const [editId,    setEditId]    = useState(null);
  const [editPass,  setEditPass]  = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => { fetchOperators(); }, []);

  async function fetchOperators() {
    const r = await authFetch('/store/operators');
    if (r.ok) setOperators(await r.json());
  }

  async function createOperator(e) {
    e.preventDefault();
    const r = await authFetch('/store/operators', {
      method: 'POST', body: JSON.stringify(newOp),
    });
    const data = await r.json();
    if (r.ok) {
      showToast('✅ Operatore creato!');
      setNewOp({ name: '', username: '', password: '' });
      fetchOperators();
    } else {
      showToast('❌ ' + data.error);
    }
  }

  async function toggleActive(id, current) {
    const r = await authFetch(`/store/operators/${id}`, {
      method: 'PATCH', body: JSON.stringify({ active: !current }),
    });
    if (r.ok) fetchOperators();
  }

  async function changePassword(id) {
    if (!editPass || editPass.length < 6) return showToast('❌ Password minimo 6 caratteri');
    const r = await authFetch(`/store/operators/${id}`, {
      method: 'PATCH', body: JSON.stringify({ password: editPass }),
    });
    if (r.ok) { showToast('✅ Password aggiornata'); setEditId(null); setEditPass(''); }
  }

  async function deleteOperator(id) {
    if (!confirm('Eliminare questo operatore?')) return;
    const r = await authFetch(`/store/operators/${id}`, { method: 'DELETE' });
    if (r.ok) fetchOperators();
  }

  return (
    <div style={{ color: '#f1f5f9' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '12px 20px', zIndex: 999, color: '#f1f5f9', fontSize: 14 }}>
          {toast}
        </div>
      )}

      {/* Header store */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>👥 Gestione Operatori</h2>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 13 }}>
          Store: <strong style={{ color: '#a78bfa' }}>{user?.store_name} ({user?.store_code})</strong>
        </p>
      </div>

      {/* Form nuovo operatore */}
      <div style={card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#cbd5e1' }}>➕ Aggiungi operatore</h3>
        <form onSubmit={createOperator} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>NOME COMPLETO</label>
            <input style={input} placeholder="Luigi Verdi" value={newOp.name} onChange={e => setNewOp(o => ({ ...o, name: e.target.value }))} required />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>USERNAME</label>
            <input style={input} placeholder="luigi.verdi" value={newOp.username} onChange={e => setNewOp(o => ({ ...o, username: e.target.value }))} required />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>PASSWORD</label>
            <input style={input} type="password" placeholder="••••••••" value={newOp.password} onChange={e => setNewOp(o => ({ ...o, password: e.target.value }))} required minLength={6} />
          </div>
          <button type="submit" style={btn()}>Aggiungi</button>
        </form>
      </div>

      {/* Lista operatori */}
      <div style={card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#cbd5e1' }}>
          Operatori del tuo store ({operators.length})
        </h3>
        {operators.length === 0 && (
          <p style={{ color: '#64748b', fontSize: 13 }}>Nessun operatore ancora. Aggiungine uno!</p>
        )}
        {operators.map(op => (
          <div key={op.id} style={{ padding: '14px 0', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{op.name}</span>
                <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>@{op.username}</span>
                <span style={{ ...badge('#22c55e'), marginLeft: 8 }}>OPERATOR</span>
                {!op.active && <span style={{ ...badge('#ef4444'), marginLeft: 6 }}>inattivo</span>}
                <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>
                  Creato: {new Date(op.created_at).toLocaleDateString('it-IT')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditId(editId === op.id ? null : op.id)} style={btn('#6366f1')}>
                  🔑 Password
                </button>
                <button onClick={() => toggleActive(op.id, op.active)} style={btn(op.active ? '#f59e0b' : '#22c55e')}>
                  {op.active ? 'Disattiva' : 'Attiva'}
                </button>
                <button onClick={() => deleteOperator(op.id)} style={btn('#ef4444')}>🗑</button>
              </div>
            </div>

            {/* Form cambio password inline */}
            {editId === op.id && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  style={{ ...input, maxWidth: 220 }}
                  type="password"
                  placeholder="Nuova password (min 6 car.)"
                  value={editPass}
                  onChange={e => setEditPass(e.target.value)}
                />
                <button onClick={() => changePassword(op.id)} style={btn('#22c55e')}>Salva</button>
                <button onClick={() => { setEditId(null); setEditPass(''); }} style={btn('#475569')}>Annulla</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
