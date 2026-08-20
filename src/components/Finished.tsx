import { Link } from 'react-router'
import { useI18n } from '../lib/i18n'
import type { GameState } from '../lib/types'
import { Podium } from './Podium'
import ui from '../ui.module.css'

export function Finished({ state }: { state: GameState }) {
  const { t } = useI18n()
  return (
    <div className={ui.screen}>
      <div>
        <h1 className={ui.title}>{t.podium}</h1>
        <p className={ui.muted}>
          {state.template.name} · {t.gameOver}
        </p>
      </div>
      <Podium podium={state.podium ?? []} />
      <div className={ui.spacer} />
      <Link to="/" className={`${ui.btn} ${ui.primary}`}>
        {t.playAgain}
      </Link>
    </div>
  )
}
