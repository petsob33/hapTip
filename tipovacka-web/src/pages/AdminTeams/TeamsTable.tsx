import type { Team } from '../../api/types'

interface TeamsTableProps {
  teams: Team[]
}

export default function TeamsTable({ teams }: TeamsTableProps) {
  return (
    <div className="overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-900/5">
      <table className="w-full text-sm">
        <thead className="bg-brand-50/60">
          <tr className="text-left text-brand-700">
            <th className="px-5 py-3.5 font-semibold">Název</th>
            <th className="px-5 py-3.5 font-semibold">Město</th>
            <th className="px-5 py-3.5 font-semibold">Liga</th>
            <th className="px-5 py-3.5 font-semibold">Platnost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {teams.map((team) => (
            <tr key={team.m_id} className="transition-colors hover:bg-slate-50">
              <td className="px-5 py-3 font-medium text-slate-900">{team.m_nazev}</td>
              <td className="px-5 py-3 text-slate-500">{team.m_mesto}</td>
              <td className="px-5 py-3 text-slate-500">{team.m_liga}</td>
              <td className="px-5 py-3 text-slate-500">{team.m_platnost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
