import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/practice', label: 'Practice', icon: '▶' },
  { to: '/learn', label: 'Learn', icon: '📚' },
  { to: '/stats', label: 'Stats', icon: '📊' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:static md:border-t-0 md:bg-transparent md:pb-0">
      <div className="mx-auto flex max-w-lg md:max-w-2xl items-stretch justify-around">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                isActive ? 'text-red-400' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <span className="text-lg leading-none">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-lg md:max-w-2xl pb-16 md:pb-4 md:pt-4">
      {children}
      <BottomNav />
    </div>
  )
}
