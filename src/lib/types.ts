// Forma de lo que devuelve get_game_state(). La RPC devuelve jsonb, así que los
// tipos generados la ven como Json: esto es el contrato del lado del cliente.
// Si tocás la función en supabase/migrations/…_state.sql, actualizá esto.

export type Mode = 'relampago' | 'cadena' | 'a_ciegas'
export type Status = 'lobby' | 'filling' | 'playing' | 'revealing' | 'finished'
export type Phase = 'reveal_fields' | 'voting' | 'result'

export type Field = {
  id: string
  label: string
  required: boolean
  multi: boolean
  max_values: number
}

export type Player = {
  id: string
  nickname: string
  emoji: string
  score: number
  is_host: boolean
  plays: boolean
  has_entry: boolean
}

export type Round = {
  index: number
  total: number
  steps: { label: string; value: string }[]
  is_mine: boolean
  /** Solo llega cuando la fase ya lo reveló. Nunca antes. */
  author_id: string | null
  candidates: string[]
  my_guess: string | null
  results: { guesser_id: string; guessed_player_id: string | null; is_correct: boolean }[]
  chain?: {
    current: string | null
    attempts: { guesser_id: string; guessed_player_id: string | null }[]
  }
}

export type GameState = {
  game: {
    id: string
    code: string
    mode: Mode
    status: Status
    round_index: number
    field_index: number
    phase: Phase
    phase_ends_at: string | null
    host_plays: boolean
    total_rounds: number
  }
  template: { name: string; fields: Field[]; time_limit_s: number | null }
  me: { player_id: string; is_host: boolean; plays: boolean } | null
  players: Player[]
  round?: Round
  podium?: {
    player_id: string
    nickname: string
    emoji: string
    score: number
    position: number
  }[]
}

export type HistoryEntry = {
  game_id: string
  mode: Mode
  template: string
  played_at: string
  nickname: string
  emoji: string
  score: number
  position: number
  players: number
}
