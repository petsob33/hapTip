import { Link, NavLink } from 'react-router-dom'
import type { User } from '../api/types'
import { IconClose, IconLogout, IconUser } from './icons'
import type { NavItem } from './NavItem'

interface MobileMenuProps {
  navItems: NavItem[]
  user: User | undefined
  /** Body v aktuálně vybrané sezóně (GET /leadboard) — null, dokud se nenačtou nebo hráč v žebříčku ještě není. */
  points: number | null
  onClose: () => void
  onLogout: () => void
}

/** Vysunuté menu z horní lišty na mobilu — navigace, sezóna, uživatel, odhlášení. */
export default function MobileMenu({ navItems, user, points, onClose, onLogout }: MobileMenuProps) {
  return (
    <div className="fixed inset-0 z-40 sm:hidden">
      <button
        type="button"
        aria-label="Zavřít"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40"
      />
      <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col gap-6 overflow-y-auto bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zavřít"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <IconClose className="size-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={!item.matchPrefix}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <item.icon className="size-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        {user && (
          <Link
            to="/profil"
            onClick={onClose}
            className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5 hover:bg-slate-100"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              <IconUser className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900">
                {user.h_nick || user.h_jmeno}
              </span>
              <span className="block text-xs text-slate-400">Zobrazit profil</span>
            </span>
            {points !== null && (
              <span className="shrink-0 text-sm font-extrabold tabular-nums text-brand-700">{points} b</span>
            )}
          </Link>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="mt-auto flex items-center justify-center gap-2 rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <IconLogout className="size-4" /> Odhlásit se
        </button>
      </div>
    </div>
  )
}
