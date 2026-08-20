import { useEffect, useRef } from 'react'
import { api } from './api'
import type { GameState } from './types'
import { remainingSeconds } from './useServerClock'

/** Cada cuánto se destapa un campo mientras se revela la ficha (decisión 14). */
export const REVEAL_MS = 2500

/**
 * El cliente del host es el reloj de la partida: destapa los campos de a uno y
 * cierra la votación cuando vence el tiempo. Evita cron y edge functions, y el
 * servidor revalida igual todos los deadlines, así que un host con mala fe solo
 * se puede apurar, nunca robar tiempo.
 */
export function useHostClock(state: GameState | null, offset: number, onDone: () => void) {
  const busy = useRef(false)

  useEffect(() => {
    if (!state?.me?.is_host) return
    const { game } = state
    if (game.status !== 'playing') return

    const fire = async () => {
      if (busy.current) return
      busy.current = true
      try {
        await api.advancePhase(game.id)
        onDone()
      } finally {
        busy.current = false
      }
    }

    if (game.phase === 'reveal_fields') {
      const id = setTimeout(fire, REVEAL_MS)
      return () => clearTimeout(id)
    }

    if (game.phase === 'voting' && game.phase_ends_at) {
      const left = remainingSeconds(game.phase_ends_at, offset) ?? 0
      // +250ms de colchón: mejor cerrar un pelo tarde que rechazar un voto
      // que el jugador mandó justo a tiempo.
      const id = setTimeout(fire, left * 1000 + 250)
      return () => clearTimeout(id)
    }
    // En 'result' avanza el host a mano.
  }, [state, offset, onDone])
}
