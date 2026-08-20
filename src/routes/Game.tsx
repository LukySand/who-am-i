import { useParams } from 'react-router'
import { FillCard } from '../components/FillCard'
import { Lobby } from '../components/Lobby'
import { useI18n } from '../lib/i18n'
import { useGameState } from '../lib/useGameState'
import ui from '../ui.module.css'

/**
 * Shell de la partida. Una sola ruta para todo el ciclo: el estado del servidor
 * decide qué pantalla toca, así una reconexión cae siempre donde corresponde
 * sin depender de nada guardado en el cliente.
 */
export default function Game() {
  const { gameId = '' } = useParams()
  const { state, refresh } = useGameState(gameId)
  const { t } = useI18n()

  if (!state) return <div className={`${ui.screen} ${ui.center}`}>{t.loading}</div>

  const { game, me, template, players } = state
  const myPlayer = players.find((p) => p.id === me?.player_id)

  if (game.status === 'lobby' || game.status === 'filling') {
    if (me?.plays && !myPlayer?.has_entry) {
      return (
        <FillCard gameId={gameId} fields={template.fields} onSaved={refresh} />
      )
    }
    return <Lobby state={state} onRefresh={refresh} />
  }

  // Fases 5 a 8. Hasta entonces, el lobby deja ver qué está pasando.
  return <Lobby state={state} onRefresh={refresh} />
}
