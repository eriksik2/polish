/** Node kinds in the Polish knowledge graph */
export type KnowledgeKind = 'letter' | 'digraph' | 'word' | 'phrase' | 'case'

export type PolishCaseName =
  | 'nominative'
  | 'genitive'
  | 'dative'
  | 'accusative'
  | 'instrumental'
  | 'locative'
  | 'vocative'

export type GrammaticalGender = 'masculine' | 'feminine' | 'neuter'
export type GrammaticalNumber = 'singular' | 'plural'

/** When a grammatical case is typically used — for lessons and exercises later */
export interface CaseUsageRule {
  case: PolishCaseName
  summary: string
  /** Short Polish examples illustrating the rule */
  polishExamples?: string[]
}

export type VocabTag =
  | 'greeting'
  | 'farewell'
  | 'politeness'
  | 'response'
  | 'number'
  | 'question'
  | 'family'
  | 'time'
  | 'common'
  | 'phonics'

/** Canonical vocabulary entry — words and multi-word phrases */
export interface VocabEntry {
  id: string
  /** Single word or full phrase surface form */
  surface: string
  meaning: string
  kind: 'word' | 'phrase'
  /** For phrases: ordered word ids that make up the phrase */
  wordIds?: string[]
  tags?: VocabTag[]
  tip?: string
}

/** A specific inflected form linked to its lemma */
export interface CaseFormEntry {
  id: string
  surface: string
  meaning: string
  lemmaId: string
  case: PolishCaseName
  number: GrammaticalNumber
  gender?: GrammaticalGender
  /** When this form is used */
  usageNote: string
}

export type LinkKind =
  | 'contains'
  | 'teaches'
  | 'inflection_of'
  | 'part_of'
  | 'constituent'

export interface KnowledgeLink {
  from: string
  to: string
  kind: LinkKind
  /** grapheme index for teaches; position in phrase for part_of */
  index?: number
  highlight?: string
}

export interface KnowledgeNode {
  id: string
  kind: KnowledgeKind
  /** Primary display text */
  label: string
  meaning?: string
  tags?: VocabTag[]
  tip?: string
  /** letter/digraph ids in spelling order */
  graphemeIds?: string[]
  /** word ids for phrases */
  wordIds?: string[]
  /** case metadata */
  case?: PolishCaseName
  lemmaId?: string
  usageNote?: string
}
