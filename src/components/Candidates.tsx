import { useI18n } from '../lib/i18n'
import type { Player } from '../lib/types'
import s from './Candidates.module.css'

/**
 * Grilla de 2 columnas: entra el pulgar cómodo y con 30 jugadores se scrollea
 * sin que los targets se achiquen. Nada de listas de una columna, que con
 * muchos jugadores obligan a scrollear a ciegas contra el reloj.
 */
export function Candidates({
  players,
  candidates,
  myGuess,
  disabled,
  onPick,
}: {
  players: Player[]
  candidates: string[]
  myGuess: string | null
  disabled: boolean
  onPick: (id: string) => void
}) {
  const { t } = useI18n()
  const byId = new Map(players.map((p) => [p.id, p]))

  return (
    <div className={s.grid} role="group" aria-label={t.chooseTemplate}>
      {candidates.map((id, i) => {
        const p = byId.get(id)
        if (!p) return null
        return (
          <button
            key={id}
            type="button"
            className={s.card}
            style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
            aria-pressed={myGuess === id}
            disabled={disabled}
            onClick={() => onPick(id)}
          >
            <span className={s.emoji} aria-hidden>
              {p.emoji}
            </span>
            <span className={s.name}>{p.nickname}</span>
          </button>
        )
      })}
    </div>
  )
}
