import { useI18n } from '../lib/i18n'
import type { Player, Round } from '../lib/types'
import ui from '../ui.module.css'
import s from './RoundResult.module.css'

export function RoundResult({
  round,
  players,
  mePlayerId,
}: {
  round: Round
  players: Player[]
  mePlayerId: string | null
}) {
  const { t } = useI18n()
  const byId = new Map(players.map((p) => [p.id, p]))
  const author = round.author_id ? byId.get(round.author_id) : null
  const mine = round.results.find((r) => r.guesser_id === mePlayerId)
  const right = round.results.filter((r) => r.is_correct)

  return (
    <div className={s.wrap}>
      <div className={s.reveal}>
        <span className={ui.label}>{t.itWas}</span>
        <span className={s.emoji} aria-hidden>
          {author?.emoji}
        </span>
        <span className={s.name}>{author?.nickname}</span>
      </div>

      {mine && (
        <p className={`${s.verdict} ${mine.is_correct ? s.ok : s.bad}`}>
          {mine.is_correct ? t.youGotIt : mine.guessed_player_id ? t.youMissed : t.youDidntVote}
        </p>
      )}

      <div className={s.who}>
        <span className={ui.label}>
          {right.length} / {round.results.length} {t.gotItRight}
        </span>
        <div className={s.chips}>
          {right.map((r) => {
            const p = byId.get(r.guesser_id)
            return (
              <span key={r.guesser_id} className={s.chip}>
                <span aria-hidden>{p?.emoji}</span> {p?.nickname}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
