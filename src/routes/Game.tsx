import { useParams } from 'react-router'
import { Chain } from '../components/Chain'
import { FillCard } from '../components/FillCard'
import { Finished } from '../components/Finished'
import { Lobby } from '../components/Lobby'
import { Playing } from '../components/Playing'
import { Revealing } from '../components/Revealing'
import { useI18n } from '../lib/i18n'
import { useGameState } from '../lib/useGameState'
import { useHostClock } from '../lib/useHostClock'
import { useServerClock } from '../lib/useServerClock'
import ui from '../ui.module.css'

/**
 * Shell de la partida. Una sola ruta para todo el ciclo: el estado del servidor
 * decide qué pantalla toca, así una reconexión cae siempre donde corresponde
 * sin depender de nada guardado en el cliente.
 */
export default function Game() {
  const { gameId = '' } = useParams()
  const { state, refresh } = useGameState(gameId)
  const offset = useServerClock()
  const { t } = useI18n()

  // Solo hace algo si soy el host: destapa campos y cierra la votación al vencer.
  useHostClock(state, offset, refresh)

  if (!state) return <div className={`${ui.screen} ${ui.center}`}>{t.loading}</div>

  const { game, me, template, players } = state
  const myPlayer = players.find((p) => p.id === me?.player_id)

  if (game.status === 'lobby' || game.status === 'filling') {
    if (me?.plays && !myPlayer?.has_entry) {
      return <FillCard gameId={gameId} fields={template.fields} onSaved={refresh} />
    }
    return <Lobby state={state} onRefresh={refresh} />
  }

  if (game.status === 'finished') return <Finished state={state} />

  // Vuelta final de A Ciegas: recorre las cartas mostrando quién acertó.
  if (game.status === 'revealing') return <Revealing state={state} onRefresh={refresh} />

  if (game.mode === 'cadena') return <Chain state={state} offset={offset} onRefresh={refresh} />

  return <Playing state={state} offset={offset} onRefresh={refresh} />
}
