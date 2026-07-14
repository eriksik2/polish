export type HapticKind = 'tap' | 'confirm' | 'success' | 'error'

export function haptic(kind: HapticKind): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return

  switch (kind) {
    case 'tap':
      navigator.vibrate(8)
      break
    case 'confirm':
      navigator.vibrate(12)
      break
    case 'success':
      navigator.vibrate([10, 40, 15, 40, 25])
      break
    case 'error':
      navigator.vibrate([20, 30, 20, 30, 40])
      break
  }
}

export type FeedbackResult = 'correct' | 'incorrect' | null
