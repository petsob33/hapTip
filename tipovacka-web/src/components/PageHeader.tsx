import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  action?: ReactNode
}

/** Sjednocená hlavička obrazovky — titulek, volitelný podtitulek a akce vpravo. */
export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
