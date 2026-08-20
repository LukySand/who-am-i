import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { GameState } from '../lib/types'
import { CardReveal } from './CardReveal'
import { RoundResult } from './RoundResult'
import ui from '../ui.module.css'
import s from './Revealing.module.css'

const HOLD_MS = 3000

/**
 * Vuelta final de A Ciegas: se recorren las cartas una por una, se deja un
 * compás de 3 segundos, y recién ahí sale quién acertó.
 *
 * El compás lo cuenta el cliente, no el servidor. Acá sí se puede: la partida
 * ya terminó y los puntos están cerrados, así que adelantarse 3 segundos por
 * DevTools no da ninguna ventaja. Durante el juego esto iría contra la regla 1.
 */
export function Revealing({
  state,
  onRefresh,
}: {
  state: GameState
  onRefresh: () => void
}) {
  const { t } = useI18n()
  const { game, players, me, round } = state
  const [held, setHeld] = useState(false)
  const [busy, setBusy] = useState(false)

  const index = round?.index ?? 0

  useEffect(() => {
    setHeld(false)
    const id = setTimeout(() => setHeld(true), HOLD_MS)
    return () => clearTimeout(id)
  }, [index])

  if (!round) return <div className={`${ui.screen} ${ui.center}`}>{t.loading}</div>

  const last = round.index + 1 >= round.total

  async function next() {
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
      <div>
        <span className={ui.label}>{t.roundOf(round.index + 1, round.total)}</span>
        <h1 className={s.heading}>{t.revealTitle}</h1>
      </div>

      <CardReveal key={round.index} steps={round.steps} dimmed={held} />

      {held ? (
        <RoundResult round={round} players={players} mePlayerId={me?.player_id ?? null} />
      ) : (
        <div className={s.hold} aria-live="polite">
          <div className={s.dots} data-loop>
            <span />
            <span />
            <span />
          </div>
          <p className={ui.muted}>{t.whoIsIt}</p>
        </div>
      )}

      <div className={ui.spacer} />

      {me?.is_host ? (
        <button
          className={`${ui.btn} ${ui.primary}`}
          disabled={busy || !held}
          onClick={next}
        >
          {last ? t.finish : t.nextCard}
        </button>
      ) : (
        held && <p className={ui.muted}>{t.waitingHost}</p>
      )}
    </div>
  )
}
