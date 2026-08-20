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

/** Garantiza una sesión antes de tocar cualquier RPC. Invitado si no hay cuenta. */
export async function ensureSession() {
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session
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
