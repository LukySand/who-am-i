import { useI18n } from '../lib/i18n'
import type { GameState } from '../lib/types'
import s from './Podium.module.css'

const MEDALS = ['🥇', '🥈', '🥉']

/** Los empates comparten posición (1, 2, 2, 4): el rank() lo calcula la base. */
export function Podium({ podium }: { podium: NonNullable<GameState['podium']> }) {
  const { t } = useI18n()
  return (
    <ol className={s.list}>
      {podium.map((p, i) => (
        <li
          key={p.player_id}
          className={`${s.row} ${p.position <= 3 ? s.top : ''}`}
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <span className={s.pos}>{MEDALS[p.position - 1] ?? p.position}</span>
          <span className={s.emoji} aria-hidden>
            {p.emoji}
          </span>
          <span className={s.name}>{p.nickname}</span>
          <span className={s.score}>
            {p.score} <span className={s.pts}>{t.points}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}
