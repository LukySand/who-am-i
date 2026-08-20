import { supabase } from './supabase'
import type { GameState, HistoryEntry, Mode } from './types'

/** Los errores de Postgres traen el mensaje crudo; el UI los traduce por clave. */
export class ApiError extends Error {
  constructor(public key: string) {
    super(key)
  }
}

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn as never, args as never)
  if (error) throw new ApiError(error.message)
  return data as T
}

export const api = {
  createGame: (templateId: string, mode: Mode, hostPlays: boolean, nickname: string, emoji: string) =>
    rpc<{ game_id: string; code: string }>('create_game', {
      p_template_id: templateId,
      p_mode: mode,
      p_host_plays: hostPlays,
      p_nickname: nickname,
      p_emoji: emoji,
    }),

  joinGame: (code: string, nickname: string, emoji: string) =>
    rpc<{ game_id: string; player_id: string }>('join_game', {
      p_code: code,
      p_nickname: nickname,
      p_emoji: emoji,
    }),

  submitEntry: (gameId: string, answers: Record<string, string[]>) =>
    rpc<void>('submit_entry', { p_game_id: gameId, p_answers: answers }),

  startGame: (gameId: string) => rpc<void>('start_game', { p_game_id: gameId }),
  openVoting: (gameId: string) => rpc<void>('open_voting', { p_game_id: gameId }),
  advancePhase: (gameId: string) => rpc<void>('advance_phase', { p_game_id: gameId }),

  submitGuess: (gameId: string, round: number, guess: string) =>
    rpc<{ ok?: boolean; correct?: boolean }>('submit_guess', {
      p_game_id: gameId,
      p_round: round,
      p_guess: guess,
    }),

  getState: (gameId: string) => rpc<GameState>('get_game_state', { p_game_id: gameId }),
  history: () => rpc<HistoryEntry[]>('my_history'),
}

/** Plantillas de fábrica del idioma activo, más las propias y las compartidas. */
export async function listTemplates(locale: string) {
  const { data, error } = await supabase
    .from('templates')
    .select('id, name, fields, time_limit_s, owner_id, locale')
    .or(`locale.eq.${locale},locale.is.null`)
    .eq('is_adhoc', false)
    .order('owner_id', { nullsFirst: true })
  if (error) throw new ApiError(error.message)
  return data
}
