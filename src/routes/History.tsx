import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { HistoryEntry } from '../lib/types'
import { useAuth } from '../lib/useAuth'
import ui from '../ui.module.css'
import s from './History.module.css'

const MEDALS = ['🥇', '🥈', '🥉']

export default function History() {
  const { t, locale } = useI18n()
  const { isRegistered, ready } = useAuth()
  const [rows, setRows] = useState<HistoryEntry[] | null>(null)

  useEffect(() => {
    if (!ready || !isRegistered) return
    api.history().then(setRows).catch(() => setRows([]))
  }, [ready, isRegistered])

  // Intl viene en el navegador: fecha en el idioma activo sin ninguna dependencia.
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  const modeName = (m: HistoryEntry['mode']) =>
    m === 'relampago' ? t.modeRelampago : m === 'cadena' ? t.modeCadena : t.modeCiegas

  if (!ready) return <div className={`${ui.screen} ${ui.center}`}>{t.loading}</div>

  return (
    <div className={ui.screen}>
      <div className={ui.header}>
        <Link to="/" className={`${ui.btn} ${ui.ghost}`}>
          ← {t.back}
        </Link>
      </div>

      <h1 className={ui.title}>{t.history}</h1>

      {!isRegistered && <p className={ui.muted}>{t.historyNeedsAccount}</p>}
      {isRegistered && rows === null && <p className={ui.muted}>{t.loading}</p>}
      {rows?.length === 0 && <p className={ui.muted}>{t.noGames}</p>}

      <ul className={s.list}>
        {rows?.map((g) => (
          <li key={g.game_id}>
            <Link to={`/partida/${g.game_id}`} className={s.row}>
              <span className={s.pos}>{MEDALS[g.position - 1] ?? g.position}</span>
              <span className={s.main}>
                <span className={s.template}>{g.template}</span>
                <span className={s.meta}>
                  {fmt.format(new Date(g.played_at))} · {modeName(g.mode)} ·{' '}
                  {t.playersIn(g.players)}
                </span>
              </span>
              <span className={s.right}>
                <span className={s.emoji} aria-hidden>
                  {g.emoji}
                </span>
                <span className={s.score}>
                  {g.score} {t.points}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
