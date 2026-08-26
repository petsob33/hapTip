import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearToken } from '../api/client'
import { useCurrentUser } from '../api/hooks/useCurrentUser'
import SeasonSelect from './SeasonSelect'

const navItems = [
  { to: '/zapasy', label: 'Zápasy' },
  { to: '/moje-tipy', label: 'Moje tipy' },
  { to: '/zebricek', label: 'Žebříček' },
]

const adminNavItems = [
  { to: '/admin/zapasy', label: 'Admin: Zápasy' },
  { to: '/admin/extra', label: 'Admin: Extra tipy' },
  { to: '/admin/tymy', label: 'Admin: Týmy' },
]

export default function Layout() {
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    clearToken()
    navigate('/login', { replace: true })
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  const items = user?.h_admin === 'A' ? [...navItems, ...adminNavItems] : navItems

  return (
    <div className="min-h-screen sm:flex">
      {/* Horní lišta jen na mobilu — od sm výšky je vidět celý postranní panel,
          takže hamburger a jeho stav (menuOpen) tam nejsou potřeba. */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4 sm:hidden">
        <span className="text-lg font-semibold text-gray-900">Tipovačka</span>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Otevřít menu"
          className="rounded p-2 text-gray-700 hover:bg-gray-200"
        >
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <button
          type="button"
          aria-label="Zavřít menu"
          onClick={closeMenu}
          className="fixed inset-0 z-20 bg-black/30 sm:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 -translate-x-full transform flex-col justify-between border-r border-gray-200 bg-gray-50 p-4 transition-transform duration-200 ease-in-out sm:static sm:z-auto sm:w-56 sm:shrink-0 sm:translate-x-0 ${
          menuOpen ? 'translate-x-0' : ''
        }`}
      >
        <div>
          <div className="mb-4 hidden px-2 text-lg font-semibold text-gray-900 sm:block">
            Tipovačka
          </div>

          <SeasonSelect />

          <nav className="flex flex-col gap-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `rounded px-3 py-2 text-sm font-medium ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Odhlásit se
        </button>
      </aside>
      <main className="flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  )
}
