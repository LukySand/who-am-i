import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { FieldEditor, newField } from '../components/FieldEditor'
import { Identity } from '../components/Identity'
import { TimeLimit } from '../components/TimeLimit'
import { api, ApiError, createAdhocTemplate, listTemplates } from '../lib/api'
import { errorKey, useI18n } from '../lib/i18n'
import type { Field, Mode } from '../lib/types'
import { useAuth } from '../lib/useAuth'
import { isEmoji } from '../lib/validation'
import ui from '../ui.module.css'
import s from './NewGame.module.css'

type Tpl = { id: string; name: string; time_limit_s: number | null; owner_id: string | null }

export default function NewGame() {
  const { t, locale } = useI18n()
  const nav = useNavigate()
  const { userId } = useAuth()

  const [tpls, setTpls] = useState<Tpl[] | null>(null)
  const [tplId, setTplId] = useState('')
  const [fast, setFast] = useState(false)
  const [fastFields, setFastFields] = useState<Field[]>([newField()])
  const [fastLimit, setFastLimit] = useState<number | null>(30)
  const [mode, setMode] = useState<Mode>('relampago')
  const [hostPlays, setHostPlays] = useState(true)
  const [nickname, setNickname] = useState('')
  const [emoji, setEmoji] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    listTemplates(locale)
      .then((rows) => {
        setTpls(rows as Tpl[])
        setTplId((prev) => prev || rows[0]?.id || '')
      })
      .catch(() => setErr(t.errGeneric))
  }, [locale, t])

  const modes: { id: Mode; name: string; desc: string }[] = [
    { id: 'relampago', name: t.modeRelampago, desc: t.modeRelampagoDesc },
    { id: 'cadena', name: t.modeCadena, desc: t.modeCadenaDesc },
    { id: 'a_ciegas', name: t.modeCiegas, desc: t.modeCiegasDesc },
  ]

  const fastValid = fastFields.length > 0 && fastFields.every((f) => f.label.trim())
  const ready = (fast ? fastValid : !!tplId) && nickname.trim().length > 0 && isEmoji(emoji)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setBusy(true)
    setErr('')
    try {
      // Partida Rápida crea una plantilla descartable: así games.template_id
      // sigue apuntando siempre a algo y el resto del motor no cambia.
      const id = fast
        ? await createAdhocTemplate(
            { name: t.fastPlay, fields: fastFields, time_limit_s: fastLimit, is_shared: false },
            userId,
          )
        : tplId
      const { game_id } = await api.createGame(id, mode, hostPlays, nickname.trim(), emoji)
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

      <h1 className={ui.title}>{t.create}</h1>

      <div className={s.pair}>
        <button type="button" className={s.option} aria-pressed={!fast} onClick={() => setFast(false)}>
          <span className={s.optionName}>{t.chooseTemplate}</span>
        </button>
        <button type="button" className={s.option} aria-pressed={fast} onClick={() => setFast(true)}>
          <span className={s.optionName}>{t.fastPlay}</span>
        </button>
      </div>

      {fast ? (
        <>
          <p className={ui.muted}>{t.fastPlayDesc}</p>
          <FieldEditor fields={fastFields} onChange={setFastFields} />
          <TimeLimit value={fastLimit} onChange={setFastLimit} />
        </>
      ) : (
        <div className={ui.field}>
          <div className={s.options}>
            {tpls === null && <p className={ui.muted}>{t.loading}</p>}
            {tpls?.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                className={s.option}
                aria-pressed={tplId === tpl.id}
                onClick={() => setTplId(tpl.id)}
              >
                <div className={s.optionName}>{tpl.name}</div>
                <div className={s.optionDesc}>
                  {tpl.owner_id === null && `${t.builtIn} · `}
                  {tpl.time_limit_s ? `${tpl.time_limit_s}${t.seconds}` : t.noTimer}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={ui.field}>
        <span className={ui.label}>{t.chooseMode}</span>
        <div className={s.options}>
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              className={s.option}
              aria-pressed={mode === m.id}
              onClick={() => setMode(m.id)}
            >
              <div className={s.optionName}>{m.name}</div>
              <div className={s.optionDesc}>{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className={ui.field}>
        <span className={ui.label}>{t.hostRole}</span>
        <div className={s.pair}>
          <button type="button" className={s.option} aria-pressed={hostPlays} onClick={() => setHostPlays(true)}>
            <span className={s.optionName}>{t.hostPlays}</span>
          </button>
          <button type="button" className={s.option} aria-pressed={!hostPlays} onClick={() => setHostPlays(false)}>
            <span className={s.optionName}>{t.hostOnly}</span>
          </button>
        </div>
      </div>

      <Identity nickname={nickname} emoji={emoji} onNickname={setNickname} onEmoji={setEmoji} />

      {err && <p className={ui.error}>{err}</p>}

      <div className={ui.spacer} />
      <button className={`${ui.btn} ${ui.primary}`} disabled={!ready || busy}>
        {busy ? t.loading : t.create}
      </button>
    </form>
  )
}
