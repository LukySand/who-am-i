import { useEffect, useState } from 'react'
import { useI18n } from '../lib/i18n'
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
  const { t } = useI18n()
  const [left, setLeft] = useState(() => remainingSeconds(endsAt, offset) ?? 0)

  useEffect(() => {
    const id = setInterval(() => setLeft(remainingSeconds(endsAt, offset) ?? 0), 250)
    return () => clearInterval(id)
  }, [endsAt, offset])

  const elapsed = Math.max(0, total - left)

  // Con la barra vaciada, un "0" suelto parece la pantalla rota. Cuando se
  // acabó se dice que se acabó — pasa al cargar con el plazo ya vencido.
  if (left <= 0) {
    return (
      <p className={s.up} role="status">
        {t.timeUp}
      </p>
    )
  }

  const urgent = left <= 5

  return (
    <div className={s.wrap}>
      <div
        key={endsAt}
        className={`${s.bar} ${urgent ? s.urgent : ''}`}
        style={{ animationDuration: `${total}s`, animationDelay: `-${elapsed}s` }}
      />
      <span className={`${s.num} ${urgent ? s.urgentText : ''}`} data-loop={urgent || undefined}>
        {Math.ceil(left)}
      </span>
    </div>
  )
}
