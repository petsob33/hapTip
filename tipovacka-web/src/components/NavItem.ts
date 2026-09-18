import type { ComponentType, SVGProps } from 'react'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Aktivní i pro podcesty (např. libovolná /admin/* stránka). */
  matchPrefix?: boolean
}
