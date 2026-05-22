import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// ── Stili base condivisi ──────────────────────────────────────────────────
const card = {
  background: '#1e293b', borderRadius: 14, padding: '1.5rem',
  border: '1px solid #334155', marginBottom: 16,
};
const btn = (color = '#6366f1') => ({
  background: color, color: '#fff', border: 'none',
  borderRadius: 8, padding: '8px 16px', fontSize: 13,
  fontWeight: 600, cursor: 'pointer',
});
const input = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #334155', background: '#0f172a',
  color: '#f1f5f9', fontSize: 13, boxSizing: 'border-box',
};
const badge = (color) => ({
  display: 'inline-block', padding: '2px 10px', borderRadius: 20,
  fontSize: 11, fontWeight: 700, background: color + '22', color: color,
});

export default function AdminDashboard() {
  const { authFetch, logout, user } = useAuth();
  const [tab,     setTab]     = useState('stores');
  const [stores,  setStores]  = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState('');

  // Form nuovi
  const [newStore, setNewStore] = useState({ name: '', city: '', code: '' });
  const [newUser,  setNewUser]  = useState({ name: '', username: '', password: '', store_id: '' });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => { fetchStores(); fetchUsers(); }, []);

  async function fetchStores() {
    setLoading(true);
    const r = await authFetch('/admin/stores');
    if (r.ok) setStores(await r.json());
    setLoading(false);
  }

  async function fetchUsers() {
    const r = await authFetch('/admin/users');
    if (r.ok) setUsers(await r.json());
  }

  async function createStore(e) {
    e.preventDefault();
    const r = await authFetch('/admin/stores', {
      method: 'POST', body: JSON.stringify(newStore),
    });
    const data = await r.json();
    if (r.ok) {
      showToast('✅ Store creato!');
      setNewStore({ name: '', city: '', code: '' });
      fetchStores();
    } else {
      showToast('❌ ' + data.error);
    }
  }

  async function createAdmin(e) {
    e.preventDefault();
    const r = await authFetch('/admin/users', {
      method: 'POST', body: JSON.stringify(newUser),
    });
    const data = await r.json();
    if (r.ok) {
      showToast('✅ Admin creato!');
      setNewUser({ name: '', username: '', password: '', store_id: '' });
      fetchUsers();
    } else {
      showToast('❌ ' + data.error);
    }
  }

  async function toggleActive(type, id, current) {
    const url  = type === 'store' ? `/admin/stores/${id}` : `/admin/users/${id}`;
    const r    = await authFetch(url, { method: 'PATCH', body: JSON.stringify({ active: !current }) });
    if (r.ok) { type === 'store' ? fetchStores() : fetchUsers(); }
  }

  async function deleteItem(type, id) {
    if (!confirm('Confermi eliminazione?')) return;
    const url = type === 'store' ? `/admin/stores/${id}` : `/admin/users/${id}`;
    const r   = await authFetch(url, { method: 'DELETE' });
    if (r.ok) { type === 'store' ? fetchStores() : fetchUsers(); }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🔧</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Magazzino</span>
          <span style={{ ...badge('#a78bfa'), marginLeft: 8 }}>SUPER ADMIN</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>{user?.name}</span>
          <button onClick={logout} style={{ ...btn('#ef4444'), padding: '6px 14px', fontSize: 12 }}>
            Esci
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '12px 20px', zIndex: 999, color: '#f1f5f9', fontSize: 14 }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[['stores', '🏪 Stores'], ['users', '👥 Admin utenti']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '9px 20px', borderRadius: 10, border: 'none',
              background: tab === key ? '#6366f1' : '#1e293b',
              color: tab === key ? '#fff' : '#94a3b8',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
              border: '1px solid ' + (tab === key ? '#6366f1' : '#334155'),
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── TAB STORES ─────────────────────────────────────────────────── */}
        {tab === 'stores' && (
          <>
            {/* Form nuovo store */}
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#cbd5e1' }}>➕ Nuovo store</h3>
              <form onSubmit={createStore} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>NOME STORE</label>
                  <input style={input} placeholder="PatchUP Palermo" value={newStore.name} onChange={e => setNewStore(s => ({ ...s, name: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>CITTÀ</label>
                  <input style={input} placeholder="Palermo" value={newStore.city} onChange={e => setNewStore(s => ({ ...s, city: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>CODICE</label>
                  <input style={input} placeholder="PA01" value={newStore.code} onChange={e => setNewStore(s => ({ ...s, code: e.target.value }))} required />
                </div>
                <button type="submit" style={{ ...btn('#6366f1'), whiteSpace: 'nowrap' }}>Crea store</button>
              </form>
            </div>

            {/* Lista stores */}
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#cbd5e1' }}>🏪 Tutti gli store ({stores.length})</h3>
              {loading ? <p style={{ color: '#64748b' }}>Caricamento...</p> : stores.map(s => (
                <div key={s.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0', borderBottom: '1px solid #1e293b',
                }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{s.name}</span>
                    <span style={{ color: '#64748b', fontSize: 13, marginLeft: 10 }}>{s.city}</span>
                    <span style={{ ...badge('#6366f1'), marginLeft: 8 }}>{s.code}</span>
                    <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>
                      {s.operators_count} operatori
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => toggleActive('store', s.id, s.active)} style={btn(s.active ? '#f59e0b' : '#22c55e')}>
                      {s.active ? 'Disattiva' : 'Attiva'}
                    </button>
                    <button onClick={() => deleteItem('store', s.id)} style={btn('#ef4444')}>Elimina</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── TAB USERS ──────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <>
            {/* Form nuovo admin */}
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#cbd5e1' }}>➕ Nuovo admin store</h3>
              <form onSubmit={createAdmin} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>NOME</label>
                  <input style={input} placeholder="Mario Rossi" value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>USERNAME</label>
                  <input style={input} placeholder="mario.rossi" value={newUser.username} onChange={e => setNewUser(u => ({ ...u, username: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>PASSWORD</label>
                  <input style={input} type="password" placeholder="••••••••" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>STORE</label>
                  <select style={{ ...input }} value={newUser.store_id} onChange={e => setNewUser(u => ({ ...u, store_id: e.target.value }))} required>
                    <option value="">Seleziona store</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                <button type="submit" style={{ ...btn('#6366f1'), whiteSpace: 'nowrap' }}>Crea admin</button>
              </form>
            </div>

            {/* Lista utenti */}
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#cbd5e1' }}>👥 Admin e operatori ({users.length})</h3>
              {users.map(u => (
                <div key={u.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0', borderBottom: '1px solid #1e293b',
                }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{u.name}</span>
                    <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>@{u.username}</span>
                    <span style={{ ...badge(u.role === 'ADMIN' ? '#6366f1' : '#22c55e'), marginLeft: 8 }}>{u.role}</span>
                    {u.store_name && <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>🏪 {u.store_name}</span>}
                    {!u.active && <span style={{ ...badge('#ef4444'), marginLeft: 8 }}>inattivo</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => toggleActive('user', u.id, u.active)} style={btn(u.active ? '#f59e0b' : '#22c55e')}>
                      {u.active ? 'Disattiva' : 'Attiva'}
                    </button>
                    <button onClick={() => deleteItem('user', u.id)} style={btn('#ef4444')}>Elimina</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
