import { BrowserRouter, Route, Routes } from 'react-router'
import { I18nProvider } from './lib/i18n'
import Home from './routes/Home'
import Join from './routes/Join'
import Lobby from './routes/Lobby'
import NewGame from './routes/NewGame'
import SignIn from './routes/SignIn'

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cuenta" element={<SignIn />} />
          <Route path="/entrar" element={<Join />} />
          <Route path="/nueva" element={<NewGame />} />
          <Route path="/partida/:gameId" element={<Lobby />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}
