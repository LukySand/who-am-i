import { useState } from 'react'
import { Link } from 'react-router'
import { useI18n } from '../lib/i18n'
import { signInWithEmail, signInWithGoogle } from '../lib/useAuth'
import ui from '../ui.module.css'

export default function SignIn() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const { error } = await signInWithEmail(email.trim())
    setBusy(false)
    if (error) setErr(t.errGeneric)
    else setSent(true)
  }

  return (
    <div className={ui.screen}>
      <div className={ui.header}>
        <Link to="/" className={`${ui.btn} ${ui.ghost}`}>
          ← {t.back}
        </Link>
      </div>

      <h1 className={ui.title}>{t.signInTitle}</h1>
      <p className={ui.muted}>{t.signInBlurb}</p>

      {sent ? (
        <p className={ui.card}>{t.linkSent}</p>
      ) : (
        <form className={ui.stack} onSubmit={send}>
          <div className={ui.field}>
            <label className={ui.label} htmlFor="email">
              {t.email}
            </label>
            <input
              id="email"
              className={ui.input}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {err && <p className={ui.error}>{err}</p>}
          <button className={`${ui.btn} ${ui.primary}`} disabled={busy || !email.trim()}>
            {busy ? t.loading : t.sendLink}
          </button>
          <button type="button" className={ui.btn} onClick={() => signInWithGoogle()}>
            {t.withGoogle}
          </button>
        </form>
      )}

      <div className={ui.spacer} />
      <p className={ui.muted}>{t.guestNote}</p>
    </div>
  )
}
