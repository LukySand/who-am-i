import { Link } from 'react-router'
import { useI18n } from '../lib/i18n'
import { useAuth, signOut } from '../lib/useAuth'
import ui from '../ui.module.css'

export default function Home() {
  const { t, locale, setLocale } = useI18n()
  const { isRegistered, email } = useAuth()

  return (
    <div className={`${ui.screen} ${ui.center}`}>
      <div>
        <h1 className={ui.title}>{t.appName}</h1>
        <p className={ui.muted}>{t.tagline}</p>
      </div>

      <div className={ui.stack}>
        <Link to="/entrar" className={`${ui.btn} ${ui.primary}`}>
          {t.join}
        </Link>
        {isRegistered ? (
          <Link to="/nueva" className={ui.btn}>
            {t.create}
          </Link>
        ) : (
          <Link to="/cuenta" className={ui.btn}>
            {t.signIn}
          </Link>
        )}
        {isRegistered && (
          <Link to="/historial" className={ui.btn}>
            {t.history}
          </Link>
        )}
      </div>

      <div className={ui.spacer} />

      <div className={ui.header}>
        <button
          className={`${ui.btn} ${ui.ghost}`}
          onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
        >
          {locale === 'es' ? 'English' : 'Español'}
        </button>
        {isRegistered && (
          <button className={`${ui.btn} ${ui.ghost}`} onClick={() => signOut()} title={email ?? ''}>
            {t.signOut}
          </button>
        )}
      </div>
    </div>
  )
}
