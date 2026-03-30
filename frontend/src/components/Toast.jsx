export default function Toast({ msg, type = 'success' }) {
  const color = type === 'error' ? '#ef4444' : '#22c55e'
  return (
    <div className="animate-slide-in" style={{
      background: '#0d1529',
      border: `1px solid rgba(255,255,255,0.08)`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10,
      padding: '12px 16px',
      fontSize: 13,
      color: '#e2e8f0',
      maxWidth: 300,
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    }}>
      {msg}
    </div>
  )
}
