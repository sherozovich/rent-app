import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'

export default function SearchCombobox({ value, onChange, options, placeholder, disabled }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const display = open ? query : (value || '')
  const filtered = open
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase())).slice(0, 80)
    : []

  return (
    <div ref={ref} className="relative">
      <Input
        value={display}
        onFocus={() => { setOpen(true); setQuery('') }}
        onChange={e => { setQuery(e.target.value); onChange('') }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-md border bg-white shadow-md">
          {filtered.map(o => (
            <button key={o} type="button"
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(o); setQuery(o); setOpen(false) }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
