import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

/**
 * Los invitados entran con sesión anónima: así tienen auth.uid() y las policies
 * de RLS funcionan igual que para una cuenta real. También sobrevive al bloqueo
 * de pantalla, que en móvil pasa todo el tiempo.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  return {
    session,
    ready,
    /** Registrado de verdad, no invitado anónimo. */
    isRegistered: !!session && !session.user.is_anonymous,
    userId: session?.user.id ?? null,
    email: session?.user.email ?? null,
  }
}

/**
 * Garantiza una sesión válida antes de tocar cualquier RPC. Invitado si no hay cuenta.
 *
 * No alcanza con getSession(): lee el JWT de localStorage sin preguntarle al
 * servidor, y Supabase borra los usuarios anónimos abandonados. Un invitado que
 * vuelve a los días trae un token que valida bien pero cuyo usuario ya no existe,
 * y recién explota al insertar en players (violación de FK, 409 críptico).
 * getUser() sí consulta al servidor: si el usuario no está, arrancamos de cero.
 */
export async function ensureSession() {
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    const { error } = await supabase.auth.getUser()
    if (!error) return data.session
    await supabase.auth.signOut()
  }
  const { data: anon, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return anon.session!
}

export const signOut = () => supabase.auth.signOut()

export const signInWithEmail = (email: string) =>
  supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })

export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
