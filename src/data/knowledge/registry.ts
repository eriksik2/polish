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

  // Grapheme composition for words & case forms only (phrases decompose into words, not spellings)
  for (const entry of VOCABULARY) {
    const node = nodes.get(entry.id)!
    if (entry.kind !== 'phrase') {
      for (let i = 0; i < node.graphemeIds!.length; i++) {
        const g = node.graphemeIds![i]
        addLink({ from: entry.id, to: g, kind: 'contains', index: i })
      }
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
    for (let i = 0; i < tokenizeGraphemes(form.surface).length; i++) {
      const g = tokenizeGraphemes(form.surface)[i]
      addLink({ from: form.id, to: g, kind: 'contains', index: i })
    }
  }

  return { nodes, links }
}

function validateGraph(
  nodes: Map<string, KnowledgeNode>,
  links: KnowledgeLink[],
): void {
  for (const entry of VOCABULARY) {
    if (entry.wordIds) {
      for (const wordId of entry.wordIds) {
        if (!nodes.has(wordId)) {
          throw new Error(`Phrase "${entry.surface}" references missing word id "${wordId}"`)
        }
      }
    }
  }

  for (const link of links) {
    const from = nodes.get(link.from)
    const to = nodes.get(link.to)
    if (!from || !to) {
      throw new Error(`Dangling link: ${link.from} -[${link.kind}]-> ${link.to}`)
    }

    if (link.kind === 'part_of') {
      const valid =
        (from.kind === 'word' && to.kind === 'phrase') ||
        (from.kind === 'letter' && to.kind === 'digraph')
      if (!valid) {
        throw new Error(`Invalid part_of: ${from.kind} "${from.label}" -> ${to.kind} "${to.label}"`)
      }
    }

    if (link.kind === 'contains') {
      const valid =
        (from.kind === 'phrase' && to.kind === 'word') ||
        ((from.kind === 'word' || from.kind === 'case') &&
          (to.kind === 'letter' || to.kind === 'digraph'))
      if (!valid) {
        throw new Error(`Invalid contains: ${from.kind} "${from.label}" -> ${to.kind} "${to.label}"`)
      }
    }

    if (link.kind === 'constituent') {
      if (from.kind !== 'digraph' || to.kind !== 'letter') {
        throw new Error(`Invalid constituent: ${from.kind} -> ${to.kind}`)
      }
    }
  }
}

const graph = buildGraph()
validateGraph(graph.nodes, graph.links)

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

/** UI tab groups — letters and digraphs shown together as "Sounds". */
export type LinkGroup = 'words' | 'phrases' | 'sounds' | 'cases'

const LINK_GROUP_ORDER: LinkGroup[] = ['phrases', 'words', 'sounds', 'cases']

export const LINK_GROUP_LABELS: Record<LinkGroup, string> = {
  words: 'Words',
  phrases: 'Phrases',
  sounds: 'Sounds',
  cases: 'Case forms',
}

function linkGroupForNode(node: KnowledgeNode): LinkGroup | null {
  if (node.kind === 'word') return 'words'
  if (node.kind === 'phrase') return 'phrases'
  if (node.kind === 'case') return 'cases'
  if (node.kind === 'letter' || node.kind === 'digraph') return 'sounds'
  return null
}

export function groupLinkedNodes(nodes: KnowledgeNode[]): Partial<Record<LinkGroup, KnowledgeNode[]>> {
  const grouped: Partial<Record<LinkGroup, KnowledgeNode[]>> = {}
  for (const node of nodes) {
    const group = linkGroupForNode(node)
    if (!group) continue
    const list = grouped[group] ?? []
    list.push(node)
    grouped[group] = list
  }
  return grouped
}

export function getLinkGroupsWithNodes(nodes: KnowledgeNode[]): LinkGroup[] {
  const grouped = groupLinkedNodes(nodes)
  return LINK_GROUP_ORDER.filter((g) => (grouped[g]?.length ?? 0) > 0)
}

/** Downward composition: what this node is made of. */
export function getDownwardLinks(nodeId: string): KnowledgeNode[] {
  const node = getKnowledgeNode(nodeId)
  if (!node) return []

  switch (node.kind) {
    case 'digraph':
      return getConstituentLetters(nodeId)
    case 'phrase':
      return getConstituents(nodeId, ['word'])
    case 'word':
    case 'case':
      return getConstituents(nodeId, ['letter', 'digraph'])
    default:
      return []
  }
}

/** Upward composition: larger items this node belongs to. */
export function getUpwardLinks(nodeId: string): KnowledgeNode[] {
  const node = getKnowledgeNode(nodeId)
  if (!node) return []

  switch (node.kind) {
    case 'letter':
      return [
        ...getPartOfTargets(nodeId, ['digraph']),
        ...getContainers(nodeId, ['word', 'phrase', 'case']),
      ]
    case 'digraph':
      return getContainers(nodeId, ['word', 'phrase', 'case'])
    case 'word':
      return getPartOfTargets(nodeId, ['phrase'])
    case 'case':
      return getContainers(nodeId, ['phrase'])
    default:
      return []
  }
}

export function dedupeNodes(nodes: KnowledgeNode[]): KnowledgeNode[] {
  return [...new Map(nodes.map((n) => [n.id, n])).values()]
}

export function getLemmaForms(lemmaId: string): KnowledgeNode[] {
  return getIncomingLinks(lemmaId, 'inflection_of')
    .map((l) => getKnowledgeNode(l.from))
    .filter((n): n is KnowledgeNode => Boolean(n))
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
