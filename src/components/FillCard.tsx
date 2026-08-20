import { useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { Field } from '../lib/types'
import ui from '../ui.module.css'
import s from './FillCard.module.css'

/** answers guarda siempre arrays, aunque el campo sea de un valor: así el
 *  aplanado que revela de a uno en la base es uniforme. Ver card_steps(). */
export type Answers = Record<string, string[]>

const blank = (fields: Field[]): Answers =>
  Object.fromEntries(fields.map((f) => [f.id, ['']]))

export function FillCard({
  gameId,
  fields,
  initial,
  onSaved,
}: {
  gameId: string
  fields: Field[]
  initial?: Answers
  onSaved: () => void
}) {
  const { t } = useI18n()
  const [answers, setAnswers] = useState<Answers>(initial ?? blank(fields))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const set = (fid: string, i: number, v: string) =>
    setAnswers((a) => ({ ...a, [fid]: a[fid].map((old, j) => (j === i ? v : old)) }))

  const add = (fid: string) => setAnswers((a) => ({ ...a, [fid]: [...a[fid], ''] }))

  const remove = (fid: string, i: number) =>
    setAnswers((a) => ({ ...a, [fid]: a[fid].filter((_, j) => j !== i) }))

  const complete = fields
    .filter((f) => f.required)
    .every((f) => answers[f.id]?.some((v) => v.trim()))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    // Los vacíos no viajan: si no, generarían pasos de revelación en blanco.
    const clean = Object.fromEntries(
      Object.entries(answers).map(([k, vs]) => [k, vs.map((v) => v.trim()).filter(Boolean)]),
    )
    try {
      await api.submitEntry(gameId, clean)
      onSaved()
    } catch {
      setErr(t.errGeneric)
      setBusy(false)
    }
  }

  return (
    <form className={ui.screen} onSubmit={submit}>
      <div>
        <h1 className={ui.title}>{t.fillTitle}</h1>
        <p className={ui.muted}>{t.fillBlurb}</p>
      </div>

      {fields.map((f) => (
        <div key={f.id} className={ui.field}>
          <label className={ui.label} htmlFor={`${f.id}-0`}>
            {f.label} <span className={s.tag}>{f.required ? t.required : t.optional}</span>
          </label>

          {answers[f.id]?.map((v, i) => (
            <div key={i} className={s.valueRow}>
              <input
                id={`${f.id}-${i}`}
                className={ui.input}
                value={v}
                onChange={(e) => set(f.id, i, e.target.value.slice(0, 120))}
                maxLength={120}
                autoComplete="off"
              />
              {f.multi && answers[f.id].length > 1 && (
                <button
                  type="button"
                  className={s.iconBtn}
                  onClick={() => remove(f.id, i)}
                  aria-label={`${t.removeValue}: ${f.label}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {f.multi && answers[f.id].length < f.max_values && (
            <button type="button" className={`${ui.btn} ${ui.ghost} ${s.add}`} onClick={() => add(f.id)}>
              + {t.addValue}
            </button>
          )}
        </div>
      ))}

      {err && <p className={ui.error}>{err}</p>}

      <div className={ui.spacer} />
      <button className={`${ui.btn} ${ui.primary}`} disabled={!complete || busy}>
        {busy ? t.loading : t.saveCard}
      </button>
    </form>
  )
}
