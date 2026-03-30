// components/Toast.jsx

export default function Toast({ msg, type = 'success' }) {
  const accent = type === 'error' ? 'border-red-500' : 'border-emerald-500'
  return (
    <div className={`bg-gray-800 border border-white/10 border-l-2 ${accent} rounded-lg px-4 py-3 text-sm text-gray-100 shadow-xl max-w-xs animate-slide-in`}>
      {msg}
    </div>
  )
}
