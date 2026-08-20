import { useState } from 'react'
import { useParams } from 'react-router'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { useGameState } from '../lib/useGameState'
import ui from '../ui.module.css'
import s from './Lobby.module.css'

export default function Lobby() {
  const { gameId = '' } = useParams()
  const { t } = useI18n()
  const { state } = useGameState(gameId)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!state) return <div className={`${ui.screen} ${ui.center}`}>{t.loading}</div>

  const { game, players, me } = state
  const withCard = players.filter((p) => p.plays && p.has_entry).length
  const canStart = me?.is_host && withCard >= 3

  async function copy() {
    await navigator.clipboard.writeText(game.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function start() {
    setBusy(true)
    try {
      await api.startGame(gameId)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={ui.screen}>
      <h1 className={ui.title}>{t.lobby}</h1>

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
              <span className={s.name}>{p.nickname}</span>
              <span className={`${s.tag} ${p.has_entry ? s.tagReady : ''}`}>
                {!p.plays ? t.onlyAdmin : p.has_entry ? t.ready : t.writing}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className={ui.spacer} />

      {me?.is_host ? (
        <div className={ui.stack}>
          {!canStart && <p className={ui.muted}>{t.needThree}</p>}
          <button className={`${ui.btn} ${ui.primary}`} disabled={!canStart || busy} onClick={start}>
            {busy ? t.loading : t.startGame}
          </button>
        </div>
      ) : (
        <p className={ui.muted}>{t.waiting}</p>
      )}
    </div>
  )
}
