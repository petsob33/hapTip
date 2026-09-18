// Sdílené inline SVG ikony — bez další závislosti (ikonová knihovna není
// v povoleném stacku, viz CLAUDE.md).
import type { SVGProps } from 'react'

function base(props: SVGProps<SVGSVGElement>) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  }
}

export function IconUser(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.2-3.8 4.2-6 7.5-6s6.3 2.2 7.5 6" />
    </svg>
  )
}

export function IconMatches(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
    </svg>
  )
}

export function IconTips(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 12.5 9 17l10.5-11" />
    </svg>
  )
}

export function IconTrophy(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v1.5A3.5 3.5 0 0 0 7.2 10M17 5h3v1.5A3.5 3.5 0 0 1 16.8 10" />
      <path d="M12 14v3M9 20.5h6M9.5 20.5c0-1.8.7-2.9 2.5-3s2.5 1.2 2.5 3" />
    </svg>
  )
}

export function IconFlame(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M12 3c1 2.3-1 3.4-1 5.8 0 1.3.9 2.2 1.9 2.2.9 0 1.5-.7 1.4-1.5C15.9 10.8 17 13 17 15a5 5 0 0 1-10 0c0-3 1.8-4.8 2.4-6.8C9.8 6.5 10.8 4.6 12 3Z" />
    </svg>
  )
}

export function IconExtra(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5 14.5 9l6 .9-4.3 4.2 1 6-5.2-2.8-5.2 2.8 1-6-4.3-4.2 6-.9 2.5-5.5Z" />
    </svg>
  )
}

export function IconAdmin(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.4-2-3.4-2.2.8a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.5a7.6 7.6 0 0 0-2.6 1.5l-2.2-.8-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3L2.7 15l2 3.4 2.2-.8a7.6 7.6 0 0 0 2.6 1.5l.5 2.4h4l.5-2.4a7.6 7.6 0 0 0 2.6-1.5l2.2.8 2-3.4-1.9-1.5Z" />
    </svg>
  )
}

export function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.9-3.3 3-5 5.5-5s4.6 1.7 5.5 5" />
      <path d="M15.5 4.3a3 3 0 0 1 0 5.9M18 19c-.6-2.3-1.7-3.8-3.3-4.6" />
    </svg>
  )
}

export function IconLogout(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M15 17.5 20 12.5 15 7.5" />
      <path d="M20 12.5H9M13 4H6.5A1.5 1.5 0 0 0 5 5.5v14A1.5 1.5 0 0 0 6.5 21H13" />
    </svg>
  )
}

export function IconMenu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  )
}

export function IconClose(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function IconChevronLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M15 5.5 8.5 12l6.5 6.5" />
    </svg>
  )
}

export function IconChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M9 5.5 15.5 12 9 18.5" />
    </svg>
  )
}

export function IconShield(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5 19 6v5.5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-2.5Z" />
    </svg>
  )
}

export function IconTable(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M3.5 14.5h17M9.5 4.5v15" />
    </svg>
  )
}

export function IconChevronUp(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M5.5 15 12 8.5 18.5 15" />
    </svg>
  )
}

export function IconChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M5.5 9 12 15.5 18.5 9" />
    </svg>
  )
}
