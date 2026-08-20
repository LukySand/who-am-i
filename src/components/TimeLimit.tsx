import { useI18n } from '../lib/i18n'
import ui from '../ui.module.css'
import s from './TimeLimit.module.css'

const CHOICES = [null, 15, 30, 45, 60, 90] as const

/** El timer vive en la plantilla (decisión 11), no en la partida. */
export function TimeLimit({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number | null) => void
}) {
  const { t } = useI18n()
  return (
    <div className={ui.field}>
      <span className={ui.label}>{t.timeLimit}</span>
      <div className={s.row}>
        {CHOICES.map((c) => (
          <button
            key={String(c)}
            type="button"
            className={s.chip}
            aria-pressed={value === c}
            onClick={() => onChange(c)}
          >
            {c === null ? '∞' : `${c}s`}
          </button>
        ))}
      </div>
      {value === null && <p className={ui.muted}>{t.noTimer}</p>}
    </div>
  )
}
