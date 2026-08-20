import { useI18n } from '../lib/i18n'
import type { Field } from '../lib/types'
import ui from '../ui.module.css'
import s from './FieldEditor.module.css'

export const MAX_FIELDS = 8
export const MAX_VALUES = 5

export const newField = (): Field => ({
  id: crypto.randomUUID().slice(0, 8),
  label: '',
  required: true,
  multi: false,
  max_values: 1,
})

/** Editor de las preguntas de una plantilla. Lo usan el creador de plantillas
 *  y Partida Rápida, que es lo mismo pero sin guardar. */
export function FieldEditor({
  fields,
  onChange,
}: {
  fields: Field[]
  onChange: (f: Field[]) => void
}) {
  const { t } = useI18n()

  const patch = (i: number, p: Partial<Field>) =>
    onChange(fields.map((f, j) => (j === i ? { ...f, ...p } : f)))

  return (
    <div className={ui.stack}>
      {fields.map((f, i) => (
        <div key={f.id} className={ui.card}>
          <div className={ui.field}>
            <label className={ui.label} htmlFor={`f-${f.id}`}>
              {t.fieldLabel} {i + 1}
            </label>
            <div className={s.labelRow}>
              <input
                id={`f-${f.id}`}
                className={ui.input}
                value={f.label}
                placeholder={t.fieldPlaceholder}
                onChange={(e) => patch(i, { label: e.target.value.slice(0, 60) })}
                maxLength={60}
              />
              {fields.length > 1 && (
                <button
                  type="button"
                  className={s.iconBtn}
                  onClick={() => onChange(fields.filter((_, j) => j !== i))}
                  aria-label={`${t.removeField} ${i + 1}`}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className={s.toggles}>
            <label className={s.check}>
              <input
                type="checkbox"
                checked={f.required}
                onChange={(e) => patch(i, { required: e.target.checked })}
              />
              {t.required}
            </label>

            <label className={s.check}>
              <input
                type="checkbox"
                checked={f.multi}
                onChange={(e) =>
                  patch(i, { multi: e.target.checked, max_values: e.target.checked ? 3 : 1 })
                }
              />
              {t.multiValue}
            </label>

            {f.multi && (
              <label className={s.check}>
                {t.maxValues}
                <select
                  className={s.select}
                  value={f.max_values}
                  onChange={(e) => patch(i, { max_values: Number(e.target.value) })}
                >
                  {[2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
      ))}

      {fields.length < MAX_FIELDS ? (
        <button type="button" className={ui.btn} onClick={() => onChange([...fields, newField()])}>
          + {t.addField}
        </button>
      ) : (
        <p className={ui.muted}>{t.maxFields}</p>
      )}
    </div>
  )
}
