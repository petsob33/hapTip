import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearToken } from '../api/client'
import { useCurrentUser } from '../api/hooks/useCurrentUser'
import { useLeaderboard } from '../api/hooks/useLeaderboard'
import { useSeason } from '../context/useSeason'
import { type NavItem } from './NavItem'
import Sidebar from './Sidebar'
import MobileMenu from './MobileMenu'
import { IconAdmin, IconExtra, IconMatches, IconMenu, IconTable, IconTips, IconTrophy, IconUsers } from './icons'

const navItems: NavItem[] = [
  { to: '/zapasy', label: 'Zápasy', icon: IconMatches },
  { to: '/moje-tipy', label: 'Moje tipy', icon: IconTips },
  { to: '/ostatni-tipy', label: 'Ostatní tipy', icon: IconUsers },
  { to: '/extra', label: 'Extra tipy', icon: IconExtra },
  { to: '/tabulka', label: 'Tabulka ligy', icon: IconTable },
  { to: '/zebricek', label: 'Žebříček', icon: IconTrophy },
]

const adminNavItems = [
  { to: '/admin/zapasy', label: 'Zápasy' },
  { to: '/admin/extra', label: 'Extra tipy' },
  { to: '/admin/tymy', label: 'Týmy' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: user } = useCurrentUser()
  const { seasonId } = useSeason()
  const { data: leaderboard } = useLeaderboard(seasonId)
  const [menuOpen, setMenuOpen] = useState(false)

  const myPointsRaw = leaderboard?.data.find((entry) => entry.h_nick === user?.h_nick)?.total_points ?? null
  const myPoints = myPointsRaw === null ? null : Number(myPointsRaw)

  const isAdmin = user?.h_admin === 'A'
  const isAdminRoute = location.pathname.startsWith('/admin')
  const mobileItems = isAdmin
    ? [...navItems, { to: '/admin/zapasy', label: 'Admin', icon: IconAdmin, matchPrefix: true }]
    : navItems

  function handleLogout() {
    clearToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen sm:flex">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-950 text-sm font-bold text-white">
            T
          </span>
          <span className="text-base font-bold text-slate-900">Tipovačka</span>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Otevřít menu"
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
        >
          <IconMenu className="size-5" />
        </button>
      </div>

      {menuOpen && (
        <MobileMenu
          navItems={mobileItems}
          user={user}
          points={myPoints}
          onClose={() => setMenuOpen(false)}
          onLogout={handleLogout}
        />
      )}

      {isAdminRoute && (
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 sm:hidden">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                  isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}

      <Sidebar
        navItems={navItems}
        adminNavItems={adminNavItems}
        isAdmin={isAdmin}
        user={user}
        points={myPoints}
        onLogout={handleLogout}
      />

      <main className="flex-1 px-4 pb-8 pt-5 sm:px-8 sm:pt-8">
        <div className="mx-auto w-full max-w-3xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
