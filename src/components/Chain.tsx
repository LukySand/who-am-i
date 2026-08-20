import { useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { GameState } from '../lib/types'
import { CardReveal } from './CardReveal'
import { Candidates } from './Candidates'
import { RoundResult } from './RoundResult'
import { Timer } from './Timer'
import ui from '../ui.module.css'
import s from './Chain.module.css'

/**
 * Modo Cadena: por turnos. El de turno intenta; si falla, sigue el próximo de
 * la cola. Los intentos fallidos quedan a la vista de todos — es información
 * pública en cuanto alguien la dice en voz alta, y esconderla solo haría que la
 * gente tenga que acordarse de memoria.
 */
export function Chain({
  state,
  offset,
  onRefresh,
}: {
  state: GameState
  offset: number
  onRefresh: () => void
}) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const { game, players, me, template, round } = state

  if (!round) return <div className={`${ui.screen} ${ui.center}`}>{t.loading}</div>

  const byId = new Map(players.map((p) => [p.id, p]))
  const chain = round.chain
  const current = chain?.current ? byId.get(chain.current) : null
  const myTurn = !!me?.player_id && chain?.current === me.player_id
  const voting = game.phase === 'voting'
  const result = game.phase === 'result'

  async function pick(id: string) {
    if (busy) return
    setBusy(true)
    try {
      await api.submitGuess(game.id, round!.index, id)
      onRefresh()
    } finally {
      setBusy(false)
    }
  }

  async function advance() {
    setBusy(true)
    try {
      await api.advancePhase(game.id)
      onRefresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={ui.screen}>
      <div className={s.top}>
        <span className={ui.label}>{t.roundOf(round.index + 1, round.total)}</span>
        {voting && game.phase_ends_at && template.time_limit_s && (
          <Timer endsAt={game.phase_ends_at} total={template.time_limit_s} offset={offset} />
        )}
      </div>

      <CardReveal steps={round.steps} />

      {chain && chain.attempts.length > 0 && (
        <div className={s.attempts}>
          <span className={ui.label}>{t.ruledOut}</span>
          <div className={s.chips}>
            {chain.attempts.map((a, i) => (
              <span key={i} className={s.chip}>
                <span aria-hidden>{byId.get(a.guesser_id)?.emoji}</span>
                {' → '}
                {a.guessed_player_id ? (
                  <s>{byId.get(a.guessed_player_id)?.nickname}</s>
                ) : (
                  <em>{t.noAnswer}</em>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {result ? (
        <RoundResult round={round} players={players} mePlayerId={me?.player_id ?? null} />
      ) : round.is_mine ? (
        <div className={s.notice}>
          <p className={s.noticeTitle}>{t.yourCard}</p>
          <p className={ui.muted}>{t.yourCardWait}</p>
        </div>
      ) : myTurn ? (
        <div className={ui.stack}>
          <p className={s.yourTurn}>{t.yourTurn}</p>
          <Candidates
            players={players}
            candidates={round.candidates}
            myGuess={round.my_guess}
            disabled={busy}
            onPick={pick}
          />
        </div>
      ) : (
        <div className={s.waiting}>
          <span className={s.turnEmoji} aria-hidden>
            {current?.emoji}
          </span>
          <p className={s.turnName}>{current ? t.turnOf(current.nickname) : t.waitingHost}</p>
        </div>
      )}

      <div className={ui.spacer} />

      {me?.is_host && (
        <div className={ui.stack}>
          {game.phase === 'reveal_fields' && (
            <button className={`${ui.btn} ${ui.primary}`} disabled={busy} onClick={() => api.openVoting(game.id).then(onRefresh)}>
              {t.showOptions}
            </button>
          )}
          {voting && !myTurn && (
            <button className={`${ui.btn} ${ui.ghost}`} disabled={busy} onClick={advance}>
              {t.skipTurn}
            </button>
          )}
          {result && (
            <button className={`${ui.btn} ${ui.primary}`} disabled={busy} onClick={advance}>
              {round.index + 1 >= round.total ? t.finish : t.nextCard}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
