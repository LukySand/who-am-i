import { BrowserRouter, Route, Routes } from 'react-router'
import { I18nProvider } from './lib/i18n'
import Game from './routes/Game'
import Home from './routes/Home'
import Join from './routes/Join'
import NewGame from './routes/NewGame'
import SignIn from './routes/SignIn'
import TemplateEditor from './routes/TemplateEditor'
import Templates from './routes/Templates'

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cuenta" element={<SignIn />} />
          <Route path="/entrar" element={<Join />} />
          <Route path="/nueva" element={<NewGame />} />
          <Route path="/plantillas" element={<Templates />} />
          <Route path="/plantillas/nueva" element={<TemplateEditor />} />
          <Route path="/plantillas/:templateId" element={<TemplateEditor />} />
          <Route path="/partida/:gameId" element={<Game />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}
