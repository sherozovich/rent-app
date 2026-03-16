import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Bike, FileText, Receipt, Settings, LogOut, Zap } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'

const navGroups = [
  {
    label: 'Основное',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Главная', end: true },
      { to: '/rentals', icon: FileText, label: 'Аренды' },
      { to: '/couriers', icon: Users, label: 'Курьеры' },
      { to: '/scooters', icon: Bike, label: 'Скутеры' },
    ],
  },
  {
    label: 'Финансы',
    items: [
      { to: '/expenses', icon: Receipt, label: 'Расходы' },
    ],
  },
  {
    label: 'Система',
    items: [
      { to: '/settings', icon: Settings, label: 'Настройки' },
    ],
  },
]

const routeLabels = {
  '/': 'Главная',
  '/couriers': 'Курьеры',
  '/scooters': 'Скутеры',
  '/rentals': 'Аренды',
  '/rentals/new': 'Новая аренда',
  '/expenses': 'Расходы',
  '/settings': 'Настройки',
}

function AppSidebar() {
  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <Zap size={15} className="text-white" fill="white" />
          </div>
          <span className="font-bold text-base tracking-wide">DOKON</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ to, icon: Icon, label, end }) => (
                  <SidebarMenuItem key={to}>
                    <NavLink to={to} end={end}>
                      {({ isActive }) => (
                        <SidebarMenuButton asChild isActive={isActive}>
                          <span>
                            <Icon />
                            <span>{label}</span>
                          </span>
                        </SidebarMenuButton>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
          <p className="text-xs text-muted-foreground">Управление арендой скутеров</p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    localStorage.removeItem('dokon_authed')
    navigate('/login')
  }

  // Build breadcrumb: "DOKON / <page>"
  const pathKey = Object.keys(routeLabels)
    .filter((k) => k !== '/')
    .find((k) => location.pathname.startsWith(k)) ?? '/'
  const pageLabel = routeLabels[pathKey] ?? 'Страница'

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 sticky top-0 z-50">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <span className="text-sm text-muted-foreground">DOKON</span>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
