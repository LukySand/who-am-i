import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { FieldEditor, newField } from '../components/FieldEditor'
import { TimeLimit } from '../components/TimeLimit'
import { getTemplate, saveTemplate } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { Field } from '../lib/types'
import { useAuth } from '../lib/useAuth'
import ui from '../ui.module.css'

export default function TemplateEditor() {
  const { templateId } = useParams()
  const nav = useNavigate()
  const { t } = useI18n()
  const { userId, ready } = useAuth()

  const [name, setName] = useState('')
  const [fields, setFields] = useState<Field[]>([newField()])
  const [limit, setLimit] = useState<number | null>(30)
  const [shared, setShared] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!templateId) return
    getTemplate(templateId)
      .then((tpl) => {
        setName(tpl.name)
        setFields(tpl.fields)
        setLimit(tpl.time_limit_s)
        setShared(tpl.is_shared)
      })
      .catch(() => setErr(t.errGeneric))
  }, [templateId, t])

  const valid = name.trim() && fields.length > 0 && fields.every((f) => f.label.trim())

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setBusy(true)
    setErr('')
    try {
      await saveTemplate(
        { name: name.trim(), fields, time_limit_s: limit, is_shared: shared },
        userId,
        templateId,
      )
      nav('/plantillas')
    } catch {
      setErr(t.errGeneric)
      setBusy(false)
    }
  }

  if (!ready) return <div className={`${ui.screen} ${ui.center}`}>{t.loading}</div>

  return (
    <form className={ui.screen} onSubmit={submit}>
      <div className={ui.header}>
        <Link to="/plantillas" className={`${ui.btn} ${ui.ghost}`}>
          ← {t.back}
        </Link>
      </div>

      <h1 className={ui.title}>{templateId ? t.editTemplate : t.newTemplate}</h1>

      <div className={ui.field}>
        <label className={ui.label} htmlFor="tpl-name">
          {t.templateName}
        </label>
        <input
          id="tpl-name"
          className={ui.input}
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 60))}
          maxLength={60}
        />
      </div>

      <FieldEditor fields={fields} onChange={setFields} />

      <TimeLimit value={limit} onChange={setLimit} />

      <label className={ui.card} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={shared}
          onChange={(e) => setShared(e.target.checked)}
          style={{ width: 20, height: 20, accentColor: 'var(--accent)' }}
        />
        {t.shareTemplate}
      </label>

      {err && <p className={ui.error}>{err}</p>}
      {!valid && <p className={ui.muted}>{t.needOneField}</p>}

      <div className={ui.spacer} />
      <button className={`${ui.btn} ${ui.primary}`} disabled={!valid || busy}>
        {busy ? t.loading : t.saveTemplate}
      </button>
    </form>
  )
}
