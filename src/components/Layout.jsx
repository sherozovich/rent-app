import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Bike, FileText, Menu, X, Zap, LogOut, Settings } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/couriers', icon: Users, label: 'Couriers' },
  { to: '/scooters', icon: Bike, label: 'Scooters' },
  { to: '/rentals', icon: FileText, label: 'Rentals' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
        <Zap size={15} className="text-white" fill="white" />
      </div>
      <span className="font-bold text-base text-gray-900 tracking-wide">DOKON</span>
    </div>
  )
}

function NavItems({ onNavigate }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={17} className={isActive ? 'text-blue-600' : ''} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('dokon_authed')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 bg-white flex-col z-30 border-r border-gray-200">
        <div className="px-4 py-4 border-b border-gray-100">
          <Logo />
        </div>
        <NavItems />
        <div className="px-3 py-3 border-t border-gray-100 space-y-1">
          <div className="flex items-center gap-2 px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <p className="text-xs text-gray-400">Scooter Rental Manager</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-200 flex items-center justify-between px-4 h-14">
        <Logo />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-500 hover:text-gray-900 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-white pt-14 flex flex-col border-r border-gray-200">
          <NavItems onNavigate={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="md:ml-56 pt-14 md:pt-0 min-h-screen">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
