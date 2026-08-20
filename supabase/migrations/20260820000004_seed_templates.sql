-- Plantillas de fabrica. Sin esto la primera partida arranca con pantalla vacia.
-- owner_id null = built-in: visible para todos (is_shared) y no editable por
-- nadie, porque la policy de escritura exige owner_id = auth.uid().

-- La app es bilingue y las etiquetas son texto libre, asi que cada built-in
-- existe una vez por idioma y el cliente filtra por locale. Mas simple que meter
-- i18n adentro del jsonb.
alter table templates add column locale text check (locale in ('es', 'en'));

create index templates_builtin on templates (locale) where owner_id is null;

insert into templates (owner_id, name, locale, is_shared, time_limit_s, fields) values
(null, 'Cosas de mí', 'es', true, 30, '[
  {"id":"miedo",   "label":"Un miedo que tenés",        "required":true,  "multi":false, "max_values":1},
  {"id":"talento", "label":"Un talento oculto",         "required":false, "multi":true,  "max_values":3},
  {"id":"comida",  "label":"Tu comida favorita",        "required":true,  "multi":false, "max_values":1}]'),
(null, 'About me', 'en', true, 30, '[
  {"id":"miedo",   "label":"A fear you have",           "required":true,  "multi":false, "max_values":1},
  {"id":"talento", "label":"A hidden talent",           "required":false, "multi":true,  "max_values":3},
  {"id":"comida",  "label":"Your favourite food",       "required":true,  "multi":false, "max_values":1}]'),

(null, 'Viajes', 'es', true, 30, '[
  {"id":"mejor",     "label":"El mejor viaje que hiciste",  "required":true,  "multi":false, "max_values":1},
  {"id":"pendiente", "label":"Un lugar que te falta",       "required":false, "multi":true,  "max_values":3},
  {"id":"perdido",   "label":"Algo que perdiste viajando",  "required":false, "multi":false, "max_values":1}]'),
(null, 'Travel', 'en', true, 30, '[
  {"id":"mejor",     "label":"Your best trip ever",         "required":true,  "multi":false, "max_values":1},
  {"id":"pendiente", "label":"A place still on your list",  "required":false, "multi":true,  "max_values":3},
  {"id":"perdido",   "label":"Something you lost travelling","required":false,"multi":false, "max_values":1}]'),

(null, 'Confesiones', 'es', true, 45, '[
  {"id":"mania",   "label":"Una manía rara que tenés",   "required":true,  "multi":false, "max_values":1},
  {"id":"nunca",   "label":"Algo que nunca contaste",    "required":true,  "multi":false, "max_values":1},
  {"id":"culposo", "label":"Un placer culposo",          "required":false, "multi":true,  "max_values":3}]'),
(null, 'Confessions', 'en', true, 45, '[
  {"id":"mania",   "label":"A weird habit of yours",     "required":true,  "multi":false, "max_values":1},
  {"id":"nunca",   "label":"Something you never told",   "required":true,  "multi":false, "max_values":1},
  {"id":"culposo", "label":"A guilty pleasure",          "required":false, "multi":true,  "max_values":3}]');
