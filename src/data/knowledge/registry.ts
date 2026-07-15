import { POLISH_ALPHABET, type PolishLetter } from '../alphabet'
import { POLISH_DIGRAPHS } from '../digraphs'
import { tokenizeGraphemes, findHighlightIndex } from '../../lib/graphemes'
import {
  CASE_FORMS,
  CASE_USAGE_RULES,
  VOCABULARY,
  getCaseForm,
  getVocabEntry,
  wordIdFromSurface,
} from './vocabulary'
import type { KnowledgeKind, KnowledgeLink, KnowledgeNode, VocabEntry } from './types'

export type { KnowledgeKind, KnowledgeLink, KnowledgeNode, VocabEntry }
export {
  CASE_FORMS,
  CASE_USAGE_RULES,
  VOCABULARY,
  getCaseForm,
  getVocabEntry,
  wordIdFromSurface,
}

/** Letters that compose each digraph (spelling, not IPA decomposition) */
const DIGRAPH_LETTER_PARTS: Record<string, string[]> = {
  ch: ['c', 'h'],
  cz: ['c', 'z'],
  dz: ['d', 'z'],
  'dź': ['d', 'ź'],
  'dż': ['d', 'ż'],
  rz: ['r', 'z'],
  sz: ['s', 'z'],
}

function moduleForGrapheme(g: string): 'alphabet' | 'digraphs' {
  return g in DIGRAPH_LETTER_PARTS ? 'digraphs' : 'alphabet'
}

function registerVocabNode(nodes: Map<string, KnowledgeNode>, entry: VocabEntry): void {
  const graphemeIds = tokenizeGraphemes(entry.surface)
  nodes.set(entry.id, {
    id: entry.id,
    kind: entry.kind,
    label: entry.surface,
    meaning: entry.meaning,
    tags: entry.tags,
    tip: entry.tip,
    graphemeIds,
    wordIds: entry.wordIds,
  })
}

function ensurePhonicsWord(
  nodes: Map<string, KnowledgeNode>,
  word: string,
  meaning: string,
): string {
  const id = wordIdFromSurface(word)
  if (!nodes.has(id)) {
    const existing = getVocabEntry(id)
    if (existing) {
      registerVocabNode(nodes, existing)
    } else {
      nodes.set(id, {
        id,
        kind: 'word',
        label: word,
        meaning,
        tags: ['phonics'],
        graphemeIds: tokenizeGraphemes(word),
      })
    }
  }
  return id
}

function buildGraph(): { nodes: Map<string, KnowledgeNode>; links: KnowledgeLink[] } {
  const nodes = new Map<string, KnowledgeNode>()
  const links: KnowledgeLink[] = []

  const addLink = (link: KnowledgeLink) => {
    links.push(link)
  }

  // Letters
  for (const letter of POLISH_ALPHABET) {
    nodes.set(letter.id, {
      id: letter.id,
      kind: 'letter',
      label: letter.upper,
      meaning: letter.englishApprox,
    })
  }

  // Digraphs + constituent letters
  for (const digraph of POLISH_DIGRAPHS) {
    nodes.set(digraph.id, {
      id: digraph.id,
      kind: 'digraph',
      label: digraph.upper,
      meaning: digraph.englishApprox,
      graphemeIds: DIGRAPH_LETTER_PARTS[digraph.id] ?? [],
    })
    for (const letterId of DIGRAPH_LETTER_PARTS[digraph.id] ?? []) {
      addLink({ from: digraph.id, to: letterId, kind: 'constituent' })
      addLink({ from: letterId, to: digraph.id, kind: 'part_of' })
    }
  }

  // Canonical vocabulary
  for (const entry of VOCABULARY) {
    registerVocabNode(nodes, entry)
  }

  // Grapheme composition for words & phrases (no reverse part_of — graphemes are not parents)
  for (const entry of VOCABULARY) {
    const node = nodes.get(entry.id)!
    for (let i = 0; i < node.graphemeIds!.length; i++) {
      const g = node.graphemeIds![i]
      addLink({ from: entry.id, to: g, kind: 'contains', index: i })
    }
    if (entry.wordIds) {
      for (let i = 0; i < entry.wordIds.length; i++) {
        const wordId = entry.wordIds[i]
        addLink({ from: entry.id, to: wordId, kind: 'contains', index: i })
        addLink({ from: wordId, to: entry.id, kind: 'part_of', index: i })
      }
    }
  }

  // Unit examples → teaches links (phonics words registered if missing)
  const registerUnitExamples = (units: PolishLetter[]) => {
    for (const unit of units) {
      for (const ex of unit.examples) {
        const wordId = ensurePhonicsWord(nodes, ex.word, ex.meaning)
        const wordNode = nodes.get(wordId)!
        // Vocabulary is canonical for meaning
        const vocab = getVocabEntry(wordId)
        if (vocab) {
          wordNode.meaning = vocab.meaning
          wordNode.tags = vocab.tags
          wordNode.tip = vocab.tip
        }

        let index = 0
        try {
          index = findHighlightIndex(ex.word, ex.highlight)
        } catch {
          index = wordNode.graphemeIds?.findIndex((g) => g === unit.id) ?? 0
        }

        addLink({
          from: unit.id,
          to: wordId,
          kind: 'teaches',
          index,
          highlight: ex.highlight,
        })
        addLink({ from: wordId, to: unit.id, kind: 'part_of', index })
      }
    }
  }

  registerUnitExamples(POLISH_ALPHABET)
  registerUnitExamples(POLISH_DIGRAPHS)

  // Case forms
  for (const form of CASE_FORMS) {
    nodes.set(form.id, {
      id: form.id,
      kind: 'case',
      label: form.surface,
      meaning: form.meaning,
      case: form.case,
      lemmaId: form.lemmaId,
      usageNote: form.usageNote,
      graphemeIds: tokenizeGraphemes(form.surface),
    })
    addLink({ from: form.id, to: form.lemmaId, kind: 'inflection_of' })
    addLink({ from: form.lemmaId, to: form.id, kind: 'part_of' })
    for (let i = 0; i < tokenizeGraphemes(form.surface).length; i++) {
      const g = tokenizeGraphemes(form.surface)[i]
      addLink({ from: form.id, to: g, kind: 'contains', index: i })
    }
  }

  return { nodes, links }
}

const graph = buildGraph()

export const KNOWLEDGE_NODES = graph.nodes
export const KNOWLEDGE_LINKS = graph.links

export function getKnowledgeNode(id: string): KnowledgeNode | undefined {
  return KNOWLEDGE_NODES.get(id)
}

export function getNodesByKind(kind: KnowledgeKind): KnowledgeNode[] {
  return [...KNOWLEDGE_NODES.values()].filter((n) => n.kind === kind)
}

export function getOutgoingLinks(id: string, kind?: KnowledgeLink['kind']): KnowledgeLink[] {
  return KNOWLEDGE_LINKS.filter((l) => l.from === id && (!kind || l.kind === kind))
}

export function getIncomingLinks(id: string, kind?: KnowledgeLink['kind']): KnowledgeLink[] {
  return KNOWLEDGE_LINKS.filter((l) => l.to === id && (!kind || l.kind === kind))
}

export function getTeachesWords(unitId: string): KnowledgeNode[] {
  return getOutgoingLinks(unitId, 'teaches')
    .map((l) => getKnowledgeNode(l.to))
    .filter((n): n is KnowledgeNode => Boolean(n))
}

export function getConstituents(nodeId: string, kinds?: KnowledgeKind[]): KnowledgeNode[] {
  return getOutgoingLinks(nodeId, 'contains')
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((l) => getKnowledgeNode(l.to))
    .filter((n): n is KnowledgeNode => Boolean(n))
    .filter((n) => !kinds || kinds.includes(n.kind))
}

export function getConstituentLetters(nodeId: string): KnowledgeNode[] {
  return getOutgoingLinks(nodeId, 'constituent')
    .map((l) => getKnowledgeNode(l.to))
    .filter((n): n is KnowledgeNode => Boolean(n))
}

/** Nodes that contain this node via a `contains` link (words/phrases/case forms). */
export function getContainers(nodeId: string, kinds?: KnowledgeKind[]): KnowledgeNode[] {
  return getIncomingLinks(nodeId, 'contains')
    .map((l) => getKnowledgeNode(l.from))
    .filter((n): n is KnowledgeNode => Boolean(n))
    .filter((n) => !kinds || kinds.includes(n.kind))
}

export function getParents(nodeId: string, kinds?: KnowledgeKind[]): KnowledgeNode[] {
  return getIncomingLinks(nodeId, 'part_of')
    .map((l) => getKnowledgeNode(l.from))
    .filter((n): n is KnowledgeNode => Boolean(n))
    .filter((n) => !kinds || kinds.includes(n.kind))
}

/** Nodes this item is a part of via outgoing `part_of` links (e.g. word → phrase, letter → digraph). */
export function getPartOfTargets(nodeId: string, kinds?: KnowledgeKind[]): KnowledgeNode[] {
  return getOutgoingLinks(nodeId, 'part_of')
    .map((l) => getKnowledgeNode(l.to))
    .filter((n): n is KnowledgeNode => Boolean(n))
    .filter((n) => !kinds || kinds.includes(n.kind))
}

export function getLinkedNodesByKind(
  nodes: KnowledgeNode[],
): Partial<Record<KnowledgeKind, KnowledgeNode[]>> {
  const grouped: Partial<Record<KnowledgeKind, KnowledgeNode[]>> = {}
  for (const node of nodes) {
    const list = grouped[node.kind] ?? []
    list.push(node)
    grouped[node.kind] = list
  }
  return grouped
}

export function getLemmaForms(lemmaId: string): KnowledgeNode[] {
  return getOutgoingLinks(lemmaId, 'part_of')
    .filter((l) => getKnowledgeNode(l.to)?.kind === 'case')
    .map((l) => getKnowledgeNode(l.to)!)
}

export function getUnitModuleId(unitId: string): 'alphabet' | 'digraphs' {
  return moduleForGrapheme(unitId)
}

export function resolveNodeLabel(id: string): string {
  const node = getKnowledgeNode(id)
  if (!node) return id
  return node.label
}

export function getAllKnowledgeWords(): KnowledgeNode[] {
  return getNodesByKind('word')
}

export function getAllPhrases(): KnowledgeNode[] {
  return getNodesByKind('phrase')
}

export function getAllCaseForms(): KnowledgeNode[] {
  return getNodesByKind('case')
}
