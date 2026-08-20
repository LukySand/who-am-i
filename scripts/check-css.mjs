// Guardián contra animaciones muertas.
//
// CSS Modules reescribe el identificador de `animation:` aunque el keyframe sea
// global, dejándolo apuntando a un nombre que no existe. La animación no corre y
// el elemento aparece en su estado final: no hay error, no hay warning, y en una
// captura se ve bien. Este chequeo compara cada nombre referenciado en el bundle
// contra los @keyframes declarados.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const RESERVADAS = new Set([
  'normal', 'none', 'infinite', 'alternate', 'alternate-reverse', 'reverse',
  'forwards', 'backwards', 'both', 'running', 'paused', 'linear', 'ease',
  'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end',
])

const dir = 'dist/assets'
const css = readdirSync(dir).filter((f) => f.endsWith('.css'))
if (!css.length) {
  console.error('No hay CSS compilado. Corré `pnpm build` primero.')
  process.exit(1)
}

let fallas = 0
for (const file of css) {
  const src = readFileSync(join(dir, file), 'utf8')
  const declarados = new Set([...src.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]))

  const usados = new Set()
  for (const m of src.matchAll(/animation:([^;}]+)/g)) {
    for (const tok of m[1].split(/[\s,]+/)) {
      if (/^[a-zA-Z_][\w-]*$/.test(tok) && !RESERVADAS.has(tok)) usados.add(tok)
    }
  }

  for (const nombre of usados) {
    if (!declarados.has(nombre)) {
      console.error(`✗ ${file}: "animation: ${nombre}" no tiene @keyframes`)
      fallas++
    }
  }
}

if (fallas) {
  console.error(`\n${fallas} animación(es) apuntan a keyframes inexistentes.`)
  console.error('En un .module.css usá: --anim: nombre; animation: var(--anim) ...')
  process.exit(1)
}
console.log('CSS OK: todas las animaciones resuelven a un @keyframes')
