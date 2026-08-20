import { useEffect, useState } from 'react'
import { supabase } from './supabase'

/**
 * Diferencia entre el reloj del servidor y el del teléfono. Los deadlines de
 * fase son timestamps del servidor: sin esto, un teléfono con la hora corrida
 * muestra "quedan 20s" mientras el servidor ya rechaza el voto por vencido.
 *
 * Se mide una vez al montar. Restamos medio round-trip para no contar la
 * latencia de ida como si fuera desfasaje.
 */
export function useServerClock() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    let alive = true
    const sent = Date.now()
    supabase.rpc('server_now').then(({ data, error }) => {
      if (!alive || error || !data) return
      const rtt = Date.now() - sent
      setOffset(new Date(data as string).getTime() + rtt / 2 - Date.now())
    })
    return () => {
      alive = false
    }
  }, [])

  return offset
}

/** Segundos que faltan para el deadline, según el reloj del servidor. */
export function remainingSeconds(endsAt: string | null, offset: number) {
  if (!endsAt) return null
  return Math.max(0, (new Date(endsAt).getTime() - (Date.now() + offset)) / 1000)
}
