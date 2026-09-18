import { useState } from 'react'
import { useExtras } from '../../api/hooks/useExtra'
import { useRocniky } from '../../api/hooks/useRocniky'
import { useSeason } from '../../context/useSeason'
import Pagination from '../../components/Pagination'
import PageHeader from '../../components/PageHeader'
import InfoBox from '../../components/InfoBox'
import SeasonSelect from '../../components/SeasonSelect'
import ExtraRow from './ExtraRow'

export default function Extra() {
  const { seasonId } = useSeason()
  const [page, setPage] = useState(1)
  const { data: rocniky } = useRocniky()
  const { data, isLoading, isError } = useExtras(page, seasonId)

  const seasonLabel = rocniky?.find((r) => r.r_id === seasonId)?.r_rocnik ?? ''
  // Neplatné (e_platnost=N) extra otázky admin zatím nezveřejnil nebo je uzavřel.
  const visibleExtras = data ? data.data.filter((extra) => extra.e_platnost === 'A') : []

  return (
    <div>
      <PageHeader title="Extra tipy" subtitle={seasonLabel} action={<SeasonSelect />} />

      {isLoading && <InfoBox>Načítání…</InfoBox>}
      {isError && <InfoBox tone="error">Extra tipy se nepodařilo načíst.</InfoBox>}
      {data && visibleExtras.length === 0 && (
        <InfoBox>V této sezóně zatím nejsou žádné extra otázky.</InfoBox>
      )}

      {data && visibleExtras.length > 0 && (
        <>
          <ul className="flex flex-col gap-3">
            {visibleExtras.map((extra) => (
              <ExtraRow key={extra.e_id} extra={extra} />
            ))}
          </ul>
          <Pagination
            currentPage={data.meta.current_page}
            lastPage={data.meta.last_page}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
