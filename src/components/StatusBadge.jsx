import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusConfig = {
  available: { label: 'Доступен', className: 'bg-green-100 text-green-800 border-green-200' },
  rented: { label: 'Арендован', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  maintenance: { label: 'Обслуживание', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  active: { label: 'Активна', className: 'bg-green-100 text-green-800 border-green-200' },
  completed: { label: 'Завершена', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  cancelled: { label: 'Отменена', className: 'bg-red-100 text-red-800 border-red-200' },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' }
  return (
    <Badge variant="outline" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  )
}
