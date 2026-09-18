import type { ReactNode } from 'react'

interface InfoBoxProps {
  tone?: 'muted' | 'error'
  children: ReactNode
}

/** Sdílený box pro stavy loading/error/prázdná data napříč obrazovkami. */
export default function InfoBox({ tone = 'muted', children }: InfoBoxProps) {
  return (
    <div
      className={`rounded-3xl border border-dashed p-10 text-center text-sm ${
        tone === 'error'
          ? 'border-red-200 bg-red-50/50 text-red-600'
          : 'border-slate-200 bg-white/60 text-slate-400'
      }`}
    >
      {children}
    </div>
  )
}
