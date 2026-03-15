import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, Bike, FileText, Menu, X } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/couriers', icon: Users, label: 'Couriers' },
  { to: '/scooters', icon: Bike, label: 'Scooters' },
  { to: '/rentals', icon: FileText, label: 'Rentals' },
]

function NavItems({ onNavigate }) {
  return (
    <nav className="flex-1 p-2 space-y-1">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 bg-gray-900 flex-col z-30">
        <div className="px-4 py-5 font-bold text-lg text-white border-b border-gray-700 tracking-wide">
          DOKON
        </div>
        <NavItems />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-gray-900 flex items-center justify-between px-4 h-14">
        <span className="font-bold text-lg text-white tracking-wide">DOKON</span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-300 hover:text-white p-1"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile overlay menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-gray-900 pt-14 flex flex-col">
          <NavItems onNavigate={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="md:ml-56 pt-14 md:pt-0 p-4 md:p-6 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
