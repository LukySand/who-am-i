import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Identity } from '../components/Identity'
import { isEmoji } from '../lib/validation'
import { api, ApiError } from '../lib/api'
import { errorKey, useI18n } from '../lib/i18n'
import { ensureSession } from '../lib/useAuth'
import ui from '../ui.module.css'
import s from './Join.module.css'

export default function Join() {
  const { t } = useI18n()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [code, setCode] = useState(params.get('code') ?? '')
  const [nickname, setNickname] = useState('')
  const [emoji, setEmoji] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const ready = /^[0-9]{8}$/.test(code) && nickname.trim().length > 0 && isEmoji(emoji)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      // Invitado = sesión anónima. Sin esto no hay auth.uid() y RLS rechaza todo.
      await ensureSession()
      const { game_id } = await api.joinGame(code, nickname.trim(), emoji)
      nav(`/partida/${game_id}`)
    } catch (e) {
      setErr(t[errorKey(e instanceof ApiError ? e.key : '')] as string)
      setBusy(false)
    }
  }

  return (
    <form className={ui.screen} onSubmit={submit}>
      <div className={ui.header}>
        <Link to="/" className={`${ui.btn} ${ui.ghost}`}>
          ← {t.back}
        </Link>
      </div>

      <h1 className={ui.title}>{t.join}</h1>

      <div className={ui.field}>
        <label className={ui.label} htmlFor="code">
          {t.gameCode}
        </label>
        <input
          id="code"
          className={`${ui.input} ${s.code}`}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="00000000"
          aria-describedby="code-hint"
        />
        <p id="code-hint" className={ui.muted}>
          {t.codeHint}
        </p>
      </div>

      <Identity nickname={nickname} emoji={emoji} onNickname={setNickname} onEmoji={setEmoji} />

      {err && <p className={ui.error}>{err}</p>}

      <div className={ui.spacer} />
      <button className={`${ui.btn} ${ui.primary}`} disabled={!ready || busy}>
        {busy ? t.loading : t.play}
      </button>
    </form>
  )
}
