import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'
import { supabase } from './supabase'
import type { GameState } from './types'

/**
 * Un canal por partida. `games` y `players` son las únicas tablas que el cliente
 * puede leer, así que ahí llega el ping; el estado real siempre se relee con
 * get_game_state, que decide qué puede ver este jugador.
 *
 * Nunca derivamos estado del payload de Realtime: vendría sin el filtrado del
 * secreto y llegaría desordenado.
 */
export function useGameState(gameId: string) {
  const [state, setState] = useState<GameState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inflight = useRef(false)

  const refresh = useCallback(async () => {
    if (inflight.current) return
    inflight.current = true
    try {
      setState(await api.getState(gameId))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error')
    } finally {
      inflight.current = false
    }
  }, [gameId])

  useEffect(() => {
    refresh()

    const channel = supabase
      .channel(`game:${gameId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` }, refresh)
      .subscribe()

    // El celular mata el websocket al bloquear la pantalla. Al volver, releemos.
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [gameId, refresh])

  return { state, error, refresh }
}
