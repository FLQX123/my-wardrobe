import { useState, useEffect, useRef } from 'react'

const seasons = ['春季', '夏季', '秋季', '冬季', '其他']

const seasonStyles = {
  '春季': 'border-emerald-400/50 text-emerald-600 bg-emerald-50/60',
  '夏季': 'border-sky-400/50 text-sky-600 bg-sky-50/60',
  '秋季': 'border-amber-400/50 text-amber-600 bg-amber-50/60',
  '冬季': 'border-indigo-400/50 text-indigo-600 bg-indigo-50/60',
  '其他': 'border-gray-300/50 text-gray-500 bg-gray-50/60',
}

const seasonIcons = {
  '春季': (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c-4 0-8 3.5-8 8 0 5 3 9 8 11 5-2 8-6 8-11 0-4.5-4-8-8-8zM12 8v1M12 14h.01" /></svg>),
  '夏季': (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" strokeWidth={1.5} /><path strokeLinecap="round" strokeWidth={1.5} d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>),
  '秋季': (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v6M10 4h4M8 14c0-2 2-3 4-3s4 1 4 3a4 4 0 01-8 0zM4 22l4-8M20 22l-4-8M12 14v8" /></svg>),
  '冬季': (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v6M6 4l2 4M18 4l-2 4M12 8l-3 5h6l-3-5zM12 13v9M12 17l-4 2M12 17l4 2" /></svg>),
  '其他': (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>),
}

export default function SaveModal({ open, onClose, onConfirm }) {
  const [name, setName] = useState('')
  const [season, setSeason] = useState('春季')
  const inputRef = useRef(null)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName('')
      setSeason('春季')
      setLeaving(false)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 100)
    }
  }, [open])

  const handleClose = () => {
    setLeaving(true)
    setTimeout(() => {
      setLeaving(false)
      onClose()
    }, 200)
  }

  const handleConfirm = () => {
    const finalName = name.trim() || '搭配方案'
    onConfirm(finalName, season)
    handleClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleConfirm() }
    if (e.key === 'Escape') { handleClose() }
  }

  if (!open && !leaving) return null

  return (
    <>
      <div className={`fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm transition-opacity duration-200 ${leaving ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none">
        <div className={`pointer-events-auto glass-card gallery-shadow rounded-2xl p-6 w-[92vw] max-w-[360px] transition-all duration-200 ${leaving ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100'}`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm tracking-widest uppercase text-gray-700 font-medium">保存搭配</h3>
            <button onClick={handleClose} className="w-7 h-7 rounded-full hover:bg-gray-100/50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-[10px] tracking-wider uppercase text-gray-400 mb-2">搭配名称</label>
            <input ref={inputRef} type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKeyDown} placeholder="搭配方案" className="w-full px-3 py-2.5 rounded-xl bg-white/60 border border-gray-200/50 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-gray-400/50 focus:bg-white/80 transition-all duration-200" />
          </div>

          <div className="mb-6">
            <label className="block text-[10px] tracking-wider uppercase text-gray-400 mb-2">选择分类</label>
            <div className="flex flex-wrap gap-1.5">
              {seasons.map((s) => (
                <button key={s} onClick={() => setSeason(s)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] tracking-wide border transition-all duration-200 ${season === s ? `${seasonStyles[s]} border-opacity-100 shadow-sm` : 'border-gray-200/50 text-gray-400 hover:text-gray-600 hover:border-gray-300/50'}`}>
                  {seasonIcons[s]}<span className={season === s ? 'font-medium' : ''}>{s}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl text-xs tracking-wide text-gray-400 hover:text-gray-600 hover:bg-gray-50/50 transition-all duration-200">取消</button>
            <button onClick={handleConfirm} className="flex-[2] py-2.5 rounded-xl bg-gray-800 text-white text-xs tracking-widest hover:bg-gray-700 transition-all duration-200 shadow-sm">确认保存</button>
          </div>
        </div>
      </div>
    </>
  )
}
