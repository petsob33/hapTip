import type { Team } from '../../api/types'

interface TeamsTableProps {
  teams: Team[]
}

export default function TeamsTable({ teams }: TeamsTableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-left text-gray-500">
          <th className="py-2 pr-4 font-medium">Název</th>
          <th className="py-2 pr-4 font-medium">Město</th>
          <th className="py-2 pr-4 font-medium">Liga</th>
          <th className="py-2 pr-4 font-medium">Platnost</th>
        </tr>
      </thead>
      <tbody>
        {teams.map((team) => (
          <tr key={team.m_id} className="border-b border-gray-100">
            <td className="py-2 pr-4">{team.m_nazev}</td>
            <td className="py-2 pr-4">{team.m_mesto}</td>
            <td className="py-2 pr-4">{team.m_liga}</td>
            <td className="py-2 pr-4">{team.m_platnost}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
