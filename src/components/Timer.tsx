import { useEffect, useState } from 'react'
import { remainingSeconds } from '../lib/useServerClock'
import s from './Timer.module.css'

/**
 * La barra la anima el CSS con duración total y delay negativo por lo ya
 * transcurrido: queda fluida sin re-renderizar. El número sí necesita un tick,
 * pero uno por segundo.
 */
export function Timer({
  endsAt,
  total,
  offset,
}: {
  endsAt: string
  total: number
  offset: number
}) {
  const [left, setLeft] = useState(() => remainingSeconds(endsAt, offset) ?? 0)

  useEffect(() => {
    const id = setInterval(() => setLeft(remainingSeconds(endsAt, offset) ?? 0), 250)
    return () => clearInterval(id)
  }, [endsAt, offset])

  const elapsed = Math.max(0, total - left)

  return (
    <div className={s.wrap}>
      <div
        key={endsAt}
        className={`${s.bar} ${left <= 5 ? s.urgent : ''}`}
        style={{ animationDuration: `${total}s`, animationDelay: `-${elapsed}s` }}
      />
      <span className={`${s.num} ${left <= 5 ? s.urgentText : ''}`}>{Math.ceil(left)}</span>
    </div>
  )
}
