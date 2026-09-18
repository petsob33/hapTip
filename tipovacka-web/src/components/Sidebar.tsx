import { NavLink } from 'react-router-dom'
import type { User } from '../api/types'
import { IconLogout } from './icons'
import type { NavItem } from './NavItem'

interface SidebarProps {
  navItems: NavItem[]
  adminNavItems: { to: string; label: string }[]
  isAdmin: boolean
  user: User | undefined
  /** Body v aktuálně vybrané sezóně (GET /leadboard) — null, dokud se nenačtou nebo hráč v žebříčku ještě není. */
  points: number | null
  onLogout: () => void
}

/** Postranní panel od šířky sm výše — na mobilu ho nahrazuje horní lišta + vysunuté hamburger menu. */
export default function Sidebar({ navItems, adminNavItems, isAdmin, user, points, onLogout }: SidebarProps) {
  return (
    <aside className="hidden shrink-0 flex-col justify-between bg-brand-950 p-5 sm:static sm:flex sm:w-64">
      <div className="flex flex-col gap-7">
        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-base font-bold text-white">
            T
          </span>
          <span className="text-lg font-bold text-white">Tipovačka</span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive ? 'bg-white text-brand-950' : 'text-brand-100/80 hover:bg-white/10'
                }`
              }
            >
              <item.icon className="size-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {isAdmin && (
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-brand-200/50">
              Administrace
            </p>
            <nav className="flex flex-col gap-1">
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-white/15 text-white' : 'text-brand-100/70 hover:bg-white/10'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {user && (
          <NavLink
            to="/profil"
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors ${
                isActive ? 'bg-white/15' : 'bg-white/5 hover:bg-white/10'
              }`
            }
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
              {(user.h_nick || user.h_jmeno || '?').slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
              {user.h_nick || user.h_jmeno}
            </span>
            {points !== null && (
              <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs font-extrabold tabular-nums text-white">
                {points} b
              </span>
            )}
          </NavLink>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-brand-100/70 hover:bg-white/10"
        >
          <IconLogout className="size-4" /> Odhlásit se
        </button>
      </div>
    </aside>
  )
}
