import { useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { GameState } from '../lib/types'
import { CardReveal } from './CardReveal'
import { Candidates } from './Candidates'
import { RoundResult } from './RoundResult'
import { Timer } from './Timer'
import ui from '../ui.module.css'
import s from './Playing.module.css'

/** Modo Relámpago: todos votan a la vez y el resultado sale en la fase result. */
export function Playing({
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

  const voting = game.phase === 'voting'
  const result = game.phase === 'result'
  const voted = round.my_guess !== null
  const iPlay = !!me?.plays && !round.is_mine

  async function pick(id: string) {
    if (busy || voted) return
    setBusy(true)
    try {
      await api.submitGuess(game.id, round!.index, id)
      onRefresh()
    } finally {
      setBusy(false)
    }
  }

  async function hostAction(fn: () => Promise<unknown>) {
    setBusy(true)
    try {
      await fn()
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

      {result ? (
        <RoundResult round={round} players={players} mePlayerId={me?.player_id ?? null} />
      ) : round.is_mine ? (
        <div className={s.notice}>
          <p className={s.noticeTitle}>{t.yourCard}</p>
          <p className={ui.muted}>{t.yourCardWait}</p>
        </div>
      ) : voting && iPlay ? (
        <div className={ui.stack}>
          <span className={ui.label}>{voted ? t.voteLocked : t.votePrompt}</span>
          <Candidates
            players={players}
            candidates={round.candidates}
            myGuess={round.my_guess}
            disabled={voted || busy}
            onPick={pick}
          />
        </div>
      ) : (
        <p className={`${ui.muted} ${s.hint}`}>{voting ? t.waitingHost : t.whoIsIt}</p>
      )}

      <div className={ui.spacer} />

      {me?.is_host ? (
        <div className={ui.stack}>
          {/* ponytail: sin contador de "X de Y votaron". `guesses` no está en la
              publicación de Realtime a propósito (filtraría quién votó qué), así
              que nadie recibiría el aviso. Hacerlo bien = columna `votes_in` en
              `games` + trigger + resetearla en advance_phase. Agregar si molesta
              en partidas sin límite de tiempo, donde el host queda a ciegas. */}
          {game.phase === 'reveal_fields' && (
            <button
              className={`${ui.btn} ${ui.primary}`}
              disabled={busy}
              onClick={() => hostAction(() => api.openVoting(game.id))}
            >
              {t.showOptions}
            </button>
          )}
          {(voting || result) && (
            <button
              className={`${ui.btn} ${ui.primary}`}
              disabled={busy}
              onClick={() => hostAction(() => api.advancePhase(game.id))}
            >
              {result && round.index + 1 >= round.total ? t.finish : t.nextCard}
            </button>
          )}
        </div>
      ) : (
        result && <p className={ui.muted}>{t.waitingHost}</p>
      )}
    </div>
  )
}
