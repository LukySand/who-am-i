import { useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { GameState } from '../lib/types'
import ui from '../ui.module.css'
import s from './Lobby.module.css'

export function Lobby({ state, onRefresh }: { state: GameState; onRefresh: () => void }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const { game, players, me, template } = state
  const withCard = players.filter((p) => p.plays && p.has_entry).length
  const canStart = me?.is_host && withCard >= 3 && game.status !== 'playing'
  const myPlayer = players.find((p) => p.id === me?.player_id)

  async function copy() {
    await navigator.clipboard.writeText(game.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function start() {
    setBusy(true)
    setErr('')
    try {
      await api.startGame(game.id)
      onRefresh()
    } catch {
      setErr(t.errNeedCards)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={ui.screen}>
      <div>
        <h1 className={ui.title}>{t.lobby}</h1>
        <p className={ui.muted}>{template.name}</p>
      </div>

      <button type="button" className={`${ui.card} ${s.code}`} onClick={copy}>
        <span className={ui.label}>{copied ? t.copied : t.shareCode}</span>
        <span className={s.digits}>{game.code}</span>
      </button>

      <div className={ui.field}>
        <span className={ui.label}>{t.playersIn(players.length)}</span>
        <ul className={s.players}>
          {players.map((p) => (
            <li key={p.id} className={s.player}>
              <span className={s.avatar} aria-hidden>
                {p.emoji}
              </span>
              <span className={s.name}>
                {p.nickname}
                {p.is_host && <span className={s.hostTag}> · {t.host}</span>}
              </span>
              <span className={`${s.tag} ${p.has_entry ? s.tagReady : ''}`}>
                {!p.plays ? t.onlyAdmin : p.has_entry ? t.ready : t.writing}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className={ui.spacer} />

      {err && <p className={ui.error}>{err}</p>}

      <div className={ui.stack}>
        {myPlayer?.has_entry && (
          <p className={ui.muted}>✓ {t.savedCard}</p>
        )}
        {me?.is_host ? (
          <>
            {!canStart && <p className={ui.muted}>{t.needThree}</p>}
            <button className={`${ui.btn} ${ui.primary}`} disabled={!canStart || busy} onClick={start}>
              {busy ? t.loading : t.startGame}
            </button>
          </>
        ) : (
          <p className={ui.muted}>{t.waiting}</p>
        )}
      </div>
    </div>
  )
}
