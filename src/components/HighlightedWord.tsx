import { renderHighlightedWord } from '../lib/graphemes'

interface HighlightedWordProps {
  word: string
  highlightIndex: number
  size?: 'md' | 'lg'
}

export function HighlightedWord({ word, highlightIndex, size = 'lg' }: HighlightedWordProps) {
  const { before, highlight, after } = renderHighlightedWord(word, highlightIndex)
  const textSize = size === 'lg' ? 'text-5xl' : 'text-3xl'

  return (
    <p className={`${textSize} font-serif text-center`}>
      <span className="text-slate-300">{before}</span>
      <span className="text-red-400 underline decoration-red-400/60 decoration-4 underline-offset-4">
        {highlight}
      </span>
      <span className="text-slate-300">{after}</span>
    </p>
  )
}
