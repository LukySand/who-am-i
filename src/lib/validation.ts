/** Un emoji real, no una letra. Cubre banderas y secuencias con ZWJ. */
export const isEmoji = (v: string) =>
  v.length > 0 && v.length <= 16 && /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(v)
