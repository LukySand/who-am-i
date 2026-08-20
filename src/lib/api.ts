import { supabase } from './supabase'
import type { Field, GameState, HistoryEntry, Mode } from './types'

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
    .select('id, name, fields, time_limit_s, owner_id, is_shared, locale')
    .eq('is_adhoc', false)
    // De fábrica solo las del idioma activo; las propias y las compartidas siempre.
    .or(`locale.eq.${locale},owner_id.not.is.null`)
    .order('owner_id', { nullsFirst: true })
  if (error) throw new ApiError(error.message)
  return data
}

export type TemplateRow = {
  id: string
  name: string
  fields: Field[]
  time_limit_s: number | null
  owner_id: string | null
  is_shared: boolean
  locale: string | null
}

export type TemplateDraft = {
  name: string
  fields: Field[]
  time_limit_s: number | null
  is_shared: boolean
}

/** Las plantillas se escriben directo: la policy de RLS ya limita al dueño. */
export async function saveTemplate(draft: TemplateDraft, userId: string, id?: string) {
  const row = { ...draft, owner_id: userId, is_adhoc: false }
  const q = id
    ? supabase.from('templates').update(row).eq('id', id).select('id').single()
    : supabase.from('templates').insert(row).select('id').single()
  const { data, error } = await q
  if (error) throw new ApiError(error.message)
  return data.id as string
}

export async function getTemplate(id: string) {
  const { data, error } = await supabase.from('templates').select('*').eq('id', id).single()
  if (error) throw new ApiError(error.message)
  return data as unknown as TemplateRow
}

export async function myTemplates(userId: string) {
  const { data, error } = await supabase
    .from('templates')
    .select('id, name, fields, time_limit_s, owner_id, is_shared, locale')
    .eq('owner_id', userId)
    .eq('is_adhoc', false)
    .order('created_at', { ascending: false })
  if (error) throw new ApiError(error.message)
  return data as unknown as TemplateRow[]
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase.from('templates').delete().eq('id', id)
  if (error) throw new ApiError(error.message)
}

/** Partida Rápida: plantilla descartable que no aparece en ninguna lista. */
export async function createAdhocTemplate(draft: TemplateDraft, userId: string) {
  const { data, error } = await supabase
    .from('templates')
    .insert({ ...draft, owner_id: userId, is_adhoc: true, is_shared: false })
    .select('id')
    .single()
  if (error) throw new ApiError(error.message)
  return data.id as string
}
