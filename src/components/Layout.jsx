import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, Bike, FileText, Menu, X, Zap } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/couriers', icon: Users, label: 'Couriers' },
  { to: '/scooters', icon: Bike, label: 'Scooters' },
  { to: '/rentals', icon: FileText, label: 'Rentals' },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
        <Zap size={15} className="text-white" fill="white" />
      </div>
      <span className="font-bold text-lg text-white tracking-wide">DOKON</span>
    </div>
  )
}

function NavItems({ onNavigate }) {
  return (
    <nav className="flex-1 p-3 space-y-0.5">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`
          }
        >
          <Icon size={17} />
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
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 bg-gray-900 flex-col z-30 border-r border-gray-800">
        <div className="px-4 py-4 border-b border-gray-800">
          <Logo />
        </div>
        <NavItems />
        <div className="px-4 py-3 border-t border-gray-800">
          <p className="text-xs text-gray-600">Scooter Rental Manager</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 h-14">
        <Logo />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-400 hover:text-white p-1.5 rounded-md hover:bg-gray-800 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-gray-900 pt-14 flex flex-col">
          <NavItems onNavigate={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="md:ml-56 pt-14 md:pt-0 p-4 md:p-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
