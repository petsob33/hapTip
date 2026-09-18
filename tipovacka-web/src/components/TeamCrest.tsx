import { useState } from 'react'
import { teamCrestUrl } from '../api/assets'
import { IconShield } from './icons'

interface TeamCrestProps {
  m_znak: string | null | undefined
  name: string
  className?: string
}

/** Znak týmu, nebo obecná ikona štítu, pokud obrázek chybí / se nenačte. */
export default function TeamCrest({ m_znak, name, className = 'size-5' }: TeamCrestProps) {
  const [failed, setFailed] = useState(false)

  if (!m_znak || failed) {
    return (
      <span className={`flex ${className} shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-300`}>
        <IconShield className="size-3" />
      </span>
    )
  }

  return (
    <img
      src={teamCrestUrl(m_znak)}
      alt={name}
      className={`${className} shrink-0 rounded-full bg-slate-50 object-contain`}
      onError={() => setFailed(true)}
    />
  )
}
