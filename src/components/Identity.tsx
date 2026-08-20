import { useI18n } from '../lib/i18n'
import ui from '../ui.module.css'
import s from './Identity.module.css'

export function Identity({
  nickname,
  emoji,
  onNickname,
  onEmoji,
}: {
  nickname: string
  emoji: string
  onNickname: (v: string) => void
  onEmoji: (v: string) => void
}) {
  const { t } = useI18n()
  return (
    <div className={ui.stack}>
      <div className={s.row}>
        {/* El label del emoji no entra en 48px y desalinea la fila: va solo en
            aria-label, y el hint de abajo lo explica en pantalla. */}
        <input
          className={s.emoji}
          value={emoji}
          onChange={(e) => onEmoji([...e.target.value].slice(-2).join(''))}
          aria-label={t.yourEmoji}
          autoComplete="off"
        />
        <div className={ui.field}>
          <label className={ui.label} htmlFor="nickname">
            {t.yourName}
          </label>
          <input
            id="nickname"
            className={ui.input}
            value={nickname}
            onChange={(e) => onNickname(e.target.value.slice(0, 20))}
            placeholder={t.namePlaceholder}
            maxLength={20}
            autoComplete="off"
            enterKeyHint="done"
          />
        </div>
      </div>
      <p className={ui.muted}>{t.emojiHint}</p>
    </div>
  )
}
