import s from './CardReveal.module.css'

/** Los pasos llegan ya recortados por el servidor: lo no revelado todavía nunca
 *  viaja al cliente, así que no hay nada que ocultar por CSS. */
export function CardReveal({
  steps,
  dimmed = false,
}: {
  steps: { label: string; value: string }[]
  /** Cede el foco cuando el autor ya está en pantalla. */
  dimmed?: boolean
}) {
  return (
    <ul className={`${s.list} ${dimmed ? s.dimmed : ''}`}>
      {steps.map((st, i) => (
        <li key={i} className={s.item}>
          <span className={s.label}>{st.label}</span>
          <span className={s.value}>{st.value}</span>
        </li>
      ))}
    </ul>
  )
}
