import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { deleteTemplate, myTemplates, type TemplateRow } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { useAuth } from '../lib/useAuth'
import ui from '../ui.module.css'
import s from './Templates.module.css'

export default function Templates() {
  const { t } = useI18n()
  const { userId, ready } = useAuth()
  const [rows, setRows] = useState<TemplateRow[] | null>(null)

  useEffect(() => {
    if (!userId) return
    myTemplates(userId).then(setRows).catch(() => setRows([]))
  }, [userId])

  async function remove(id: string) {
    if (!confirm(t.confirmDelete)) return
    await deleteTemplate(id)
    setRows((r) => r?.filter((x) => x.id !== id) ?? null)
  }

  if (!ready) return <div className={`${ui.screen} ${ui.center}`}>{t.loading}</div>

  return (
    <div className={ui.screen}>
      <div className={ui.header}>
        <Link to="/" className={`${ui.btn} ${ui.ghost}`}>
          ← {t.back}
        </Link>
      </div>

      <h1 className={ui.title}>{t.templates}</h1>

      <Link to="/plantillas/nueva" className={`${ui.btn} ${ui.primary}`}>
        + {t.newTemplate}
      </Link>

      {rows === null && <p className={ui.muted}>{t.loading}</p>}
      {rows?.length === 0 && <p className={ui.muted}>{t.noTemplates}</p>}

      <ul className={s.list}>
        {rows?.map((tpl) => (
          <li key={tpl.id} className={s.item}>
            <Link to={`/plantillas/${tpl.id}`} className={s.link}>
              <span className={s.name}>{tpl.name}</span>
              <span className={ui.muted}>
                {tpl.fields.length} · {tpl.time_limit_s ? `${tpl.time_limit_s}s` : '∞'}
                {tpl.is_shared && ' · ↗'}
              </span>
            </Link>
            <button
              className={s.del}
              onClick={() => remove(tpl.id)}
              aria-label={`${t.deleteTemplate}: ${tpl.name}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
