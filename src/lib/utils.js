import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Format raw digit string as Uzbek phone: +998 XX XXX XX XX
export function formatUzPhone(val) {
  const digits = String(val).replace(/\D/g, '')
  const local = digits.startsWith('998') ? digits.slice(3) : digits
  const d = local.slice(0, 9)
  let r = '+998'
  if (d.length > 0) r += ' ' + d.slice(0, 2)
  if (d.length > 2) r += ' ' + d.slice(2, 5)
  if (d.length > 5) r += ' ' + d.slice(5, 7)
  if (d.length > 7) r += ' ' + d.slice(7, 9)
  return r
}

// Format raw digit string with space thousands separator: 1500000 → "1 500 000"
export function formatAmount(raw) {
  if (!raw && raw !== 0) return ''
  return String(raw).replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
