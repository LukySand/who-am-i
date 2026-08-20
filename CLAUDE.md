# Who Am I

Juego web mobile-first para adivinar quién escribió cada carta. Partidas por código
de 8 dígitos, tres modos de juego, host que controla el ritmo desde su teléfono.

## Documentación
- [docs/SPEC.md](docs/SPEC.md) — reglas de juego completas. **Fuente de verdad.**
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — stack, modelo de datos, modelo de seguridad.
- [docs/ROADMAP.md](docs/ROADMAP.md) — fases y estado actual.
- [docs/DECISIONS.md](docs/DECISIONS.md) — decisiones tomadas y por qué.

## Comandos
```
pnpm dev        # servidor local
pnpm build      # tsc -b && vite build
pnpm typecheck
pnpm test:db    # resetea la base local y corre smoke.sql + rls.sql
```

Base local: `pnpm exec supabase start` (necesita Docker). Studio en :54323.

## Reglas no negociables

1. **El cliente jamás recibe la relación carta→autor.** RLS bloquea `entries`.
   Todo pasa por funciones `security definer`. Si escribís un `select` desde el
   front que pueda revelar un autor antes de tiempo, está mal.
2. **El reloj vive en la base** (`games.phase_ends_at`). El cliente solo cuenta
   hacia esa fecha. Toda RPC de voto revalida contra `now()`.
3. **Solo dos variables de entorno**, ambas públicas por diseño:
   `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Cualquier otro secreto
   en el front es un bug: el repo es público y el bundle también.
   El client secret de Google va en el dashboard de Supabase, no acá.
4. **Cero dependencias nuevas sin justificar.** CSS plano con Modules, animaciones
   con `@keyframes`, i18n con un objeto y un hook. No entran librerías de UI,
   de animación, de estado ni de i18n.
5. **Mobile-first de verdad.** Todo target táctil ≥44px, `safe-area-inset`
   respetado, nada que dependa de hover.
6. **Respetar `prefers-reduced-motion`** en cada animación.

## Estilo
- CSS Modules (`Componente.module.css`) junto al componente. Tokens en `src/index.css`.
- Textos siempre vía i18n (es/en), nunca hardcodeados en JSX.
- SQL en `supabase/migrations/`, numeradas, nunca editar una migración ya aplicada.
- **Permisos siempre explícitos.** Supabase hospedado otorga `SELECT` por default
  privileges y el stack local no: si no declarás el `GRANT`/`REVOKE`, el mismo SQL
  se comporta distinto en local y en prod. Y para sacar `EXECUTE` de una función
  hay que revocar de `PUBLIC`, no de `anon`/`authenticated`.
- Toda RPC nueva va con su test en `supabase/tests/`. Si toca el secreto, además
  en `rls.sql` con `set role authenticated` — como superusuario RLS no se prueba.
