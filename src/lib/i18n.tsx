import { createContext, useContext, useState, type ReactNode } from 'react'

// Dos idiomas y un puñado de strings: un objeto y un hook alcanzan.
// Ver CLAUDE.md — nada de librerías de i18n.

const es = {
  appName: 'Who Am I',
  tagline: 'Adiviná quién escribió cada respuesta',

  play: 'Jugar',
  create: 'Crear partida',
  join: 'Entrar a una partida',
  history: 'Mis partidas',
  signIn: 'Iniciar sesión',
  signOut: 'Cerrar sesión',
  back: 'Volver',
  cancel: 'Cancelar',
  loading: 'Cargando…',

  gameCode: 'Código de partida',
  codeHint: '8 dígitos',
  yourName: 'Tu nombre',
  namePlaceholder: 'Con qué nombre jugás',
  yourEmoji: 'Tu emoji',
  emojiHint: 'Tocá y elegí uno del teclado',

  signInTitle: 'Iniciar sesión',
  signInBlurb: 'Necesitás una cuenta para crear partidas, guardar plantillas y ver tu historial.',
  email: 'Tu email',
  sendLink: 'Mandame el link',
  linkSent: 'Te mandamos un link a tu email. Abrilo desde este teléfono.',
  withGoogle: 'Entrar con Google',
  guestNote: 'Para jugar no hace falta cuenta: entrá con el código.',

  chooseTemplate: 'Elegí una plantilla',
  chooseMode: 'Elegí el modo',
  hostRole: '¿Vas a jugar?',
  hostPlays: 'Jugar y administrar',
  hostOnly: 'Solo administrar',
  noTimer: 'Sin límite de tiempo',
  seconds: 's por ronda',

  modeRelampago: 'Relámpago',
  modeRelampagoDesc: 'Todos votan a la vez y se ve el resultado al toque.',
  modeCadena: 'Cadena',
  modeCadenaDesc: 'Por turnos: si fallás, le toca al siguiente.',
  modeCiegas: 'A Ciegas',
  modeCiegasDesc: 'Votás en secreto y los resultados salen al final.',

  lobby: 'Sala de espera',
  waiting: 'Esperando jugadores…',
  playersIn: (n: number) => (n === 1 ? '1 jugador' : `${n} jugadores`),
  shareCode: 'Pasá este código',
  copied: '¡Copiado!',
  startGame: 'Empezar',
  needThree: 'Hacen falta 3 jugadores con la ficha completa',
  kick: 'Sacar',
  host: 'Anfitrión',
  onlyAdmin: 'solo administra',
  ready: 'listo',
  writing: 'escribiendo…',

  errNotFound: 'No existe una partida con ese código',
  errStarted: 'Esa partida ya empezó',
  errFull: 'La partida está llena',
  errNameTaken: 'Ese nombre ya está usado en esta partida',
  errNeedCards: 'Hacen falta al menos 3 fichas cargadas',

  fillTitle: 'Completá tu ficha',
  fillBlurb: 'Nadie ve lo que escribís hasta que la partida lo revele.',
  required: 'obligatorio',
  optional: 'opcional',
  addValue: 'Agregar otra',
  removeValue: 'Quitar',
  saveCard: 'Listo',
  editCard: 'Editar mi ficha',
  savedCard: 'Ficha guardada',

  templates: 'Mis plantillas',
  newTemplate: 'Nueva plantilla',
  editTemplate: 'Editar plantilla',
  templateName: 'Nombre de la plantilla',
  fieldLabel: 'Pregunta',
  fieldPlaceholder: '¿Qué les preguntás?',
  addField: 'Agregar pregunta',
  removeField: 'Quitar pregunta',
  multiValue: 'Permite varias respuestas',
  maxValues: 'Máximo',
  timeLimit: 'Tiempo por ronda',
  shareTemplate: 'Que otros puedan usarla',
  saveTemplate: 'Guardar',
  deleteTemplate: 'Borrar',
  confirmDelete: '¿Borrar esta plantilla?',
  noTemplates: 'Todavía no creaste ninguna',
  builtIn: 'De fábrica',
  fastPlay: 'Partida rápida',
  fastPlayDesc: 'Escribí las preguntas ahora, sin guardar plantilla.',
  needOneField: 'Poné al menos una pregunta',
  maxFields: 'Hasta 8 preguntas',

  errGeneric: 'Algo salió mal. Probá de nuevo.',
}

const en: typeof es = {
  appName: 'Who Am I',
  tagline: 'Guess who wrote each answer',

  play: 'Play',
  create: 'New game',
  join: 'Join a game',
  history: 'My games',
  signIn: 'Sign in',
  signOut: 'Sign out',
  back: 'Back',
  cancel: 'Cancel',
  loading: 'Loading…',

  gameCode: 'Game code',
  codeHint: '8 digits',
  yourName: 'Your name',
  namePlaceholder: 'The name you play with',
  yourEmoji: 'Your emoji',
  emojiHint: 'Tap and pick one from the keyboard',

  signInTitle: 'Sign in',
  signInBlurb: 'You need an account to host games, save templates and keep your history.',
  email: 'Your email',
  sendLink: 'Send me the link',
  linkSent: 'We sent a link to your email. Open it on this phone.',
  withGoogle: 'Continue with Google',
  guestNote: 'No account needed to play — just use the code.',

  chooseTemplate: 'Pick a template',
  chooseMode: 'Pick a mode',
  hostRole: 'Are you playing?',
  hostPlays: 'Play and host',
  hostOnly: 'Host only',
  noTimer: 'No time limit',
  seconds: 's per round',

  modeRelampago: 'Lightning',
  modeRelampagoDesc: 'Everyone votes at once and sees the result right away.',
  modeCadena: 'Chain',
  modeCadenaDesc: 'Turn by turn: miss it and the next player tries.',
  modeCiegas: 'Blind',
  modeCiegasDesc: 'Vote in secret, results come out at the end.',

  lobby: 'Lobby',
  waiting: 'Waiting for players…',
  playersIn: (n: number) => (n === 1 ? '1 player' : `${n} players`),
  shareCode: 'Share this code',
  copied: 'Copied!',
  startGame: 'Start',
  needThree: 'You need 3 players with their card filled in',
  kick: 'Remove',
  host: 'Host',
  onlyAdmin: 'hosting only',
  ready: 'ready',
  writing: 'writing…',

  errNotFound: 'No game with that code',
  errStarted: 'That game already started',
  errFull: 'The game is full',
  errNameTaken: 'That name is taken in this game',
  errNeedCards: 'At least 3 cards must be filled in',

  fillTitle: 'Fill in your card',
  fillBlurb: 'Nobody sees what you write until the game reveals it.',
  required: 'required',
  optional: 'optional',
  addValue: 'Add another',
  removeValue: 'Remove',
  saveCard: 'Done',
  editCard: 'Edit my card',
  savedCard: 'Card saved',

  templates: 'My templates',
  newTemplate: 'New template',
  editTemplate: 'Edit template',
  templateName: 'Template name',
  fieldLabel: 'Question',
  fieldPlaceholder: 'What do you ask them?',
  addField: 'Add question',
  removeField: 'Remove question',
  multiValue: 'Allows several answers',
  maxValues: 'Max',
  timeLimit: 'Time per round',
  shareTemplate: 'Let others use it',
  saveTemplate: 'Save',
  deleteTemplate: 'Delete',
  confirmDelete: 'Delete this template?',
  noTemplates: "You haven't created any yet",
  builtIn: 'Built-in',
  fastPlay: 'Fast play',
  fastPlayDesc: 'Write the questions now, no template saved.',
  needOneField: 'Add at least one question',
  maxFields: 'Up to 8 questions',

  errGeneric: 'Something went wrong. Try again.',
}

const dicts = { es, en }
export type Locale = keyof typeof dicts

function detect(): Locale {
  const saved = localStorage.getItem('locale')
  if (saved === 'es' || saved === 'en') return saved
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en'
}

const Ctx = createContext<{ t: typeof es; locale: Locale; setLocale: (l: Locale) => void }>({
  t: es,
  locale: 'es',
  setLocale: () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, set] = useState<Locale>(detect)
  const setLocale = (l: Locale) => {
    localStorage.setItem('locale', l)
    document.documentElement.lang = l
    set(l)
  }
  return <Ctx.Provider value={{ t: dicts[locale], locale, setLocale }}>{children}</Ctx.Provider>
}

export const useI18n = () => useContext(Ctx)

/** Traduce el mensaje crudo que vuelve de Postgres. */
export function errorKey(message: string): keyof typeof es {
  if (message.includes('game not found')) return 'errNotFound'
  if (message.includes('already started')) return 'errStarted'
  if (message.includes('game full')) return 'errFull'
  if (message.includes('nickname taken')) return 'errNameTaken'
  if (message.includes('at least 3 cards')) return 'errNeedCards'
  return 'errGeneric'
}
