// Text analysis: six readability formulas side by side, sentence-level problems, jargon and the
// ISO 24495-1 review questions. The formulas were built for English prose: they count syllables,
// letters and sentence length, and cannot judge meaning, order, layout, numbers or other
// languages. A short, wrong sentence scores well. The app shows each formula's limits beside it.
import { findJargon, type JargonHit } from '../shared/jargon'

export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return 0
  if (w.length <= 3) return 1
  const s = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g)
  return Math.max(1, s?.length ?? 1)
}
export const WORD_RE = /[A-Za-z][A-Za-z'’-]*|\d+(?:[.,]\d+)?%?/g
export function sentencesOf(text: string): string[] {
  return text.replace(/\r/g, '').split(/(?<=[.!?])\s+(?=[A-Z0-9“"(])|\n+/).map((s) => s.trim()).filter((s) => /[A-Za-z]/.test(s))
}
const wordsOf = (t: string) => t.match(WORD_RE) ?? []
const letters = (ws: string[]) => ws.reduce((n, w) => n + w.replace(/[^A-Za-z0-9]/g, '').length, 0)

export interface Formula { id: string; name: string; value: number; unit: 'grade' | 'score'; counts: string; limit: string; ok: boolean; target?: number }
export const FORMULA_INFO: Record<string, { name: string; counts: string; limit: string }> = {
  fre: { name: 'Flesch Reading Ease', counts: 'Words per sentence and syllables per word; 0 to 100, higher is easier (60 to 70 is plain English).', limit: 'Built on adult American prose in 1948; long common words (“information”) are penalised as much as rare ones.' },
  fk: { name: 'Flesch-Kincaid grade', counts: 'The same counts, as a US school grade.', limit: 'Derived from US Navy readers; a grade is not an age, and it ignores whether words are familiar.' },
  smog: { name: 'SMOG grade', counts: 'Words of three or more syllables in a sample of 30 sentences.', limit: 'Needs at least 30 sentences to be valid; on short texts the result is unreliable. Predicts full comprehension, so it runs higher than others.' },
  fog: { name: 'Gunning Fog index', counts: 'Words per sentence and the share of words of three or more syllables.', limit: 'Counts every long word as hard, including familiar ones like “medicine”.' },
  cli: { name: 'Coleman-Liau index', counts: 'Letters per 100 words and sentences per 100 words (no syllables).', limit: 'Letter counts are a rough proxy for difficulty; abbreviations and numbers distort it.' },
  ari: { name: 'Automated Readability Index', counts: 'Characters per word and words per sentence.', limit: 'Very sensitive to how sentences are split; lists and headings without full stops skew it.' },
}

export interface Problem { kind: 'long' | 'passive' | 'nominal' | 'negative' | 'abbrev' | 'percent' | 'longword'; text: string; sentence: number; hint: string }
export interface Analysis {
  words: number; sentences: number; wordsPerSentence: number; longWordsPct: number; syllablesPerWord: number
  formulas: Formula[]; grade: number; problems: Problem[]; jargon: JargonHit[]; sentenceList: { text: string; words: number; flags: Problem['kind'][] }[]
}

const PASSIVE = /\b(?:am|is|are|was|were|be|been|being|get|gets|got)\s+(?:\w+ly\s+)?(?:\w+ed|given|taken|made|seen|known|shown|told|sent|kept|put|set|done|written|drawn|chosen|held|paid|found|brought)\b/i
const NOMINAL = /\b\w{4,}(?:tion|sion|ment|ance|ence|ity)\s+of\b/i
const DOUBLE_NEG = /\b(?:not|never)\s+(?:\w+\s+){0,2}(?:un\w+|in\w+able|no|never|nothing|none|without)\b/i
const ABBREV = /\b[A-Z]{2,}[A-Za-z0-9]*\b/g
const PERCENT = /\b\d+(?:\.\d+)?\s?%|\b\d+(?:\.\d+)? per ?cent\b/i
const NATURAL = /\b\d+\s+(?:in|out of)\s+(?:every\s+)?\d+/i

export function analyze(text: string, target = 8): Analysis {
  const sents = sentencesOf(text), ws = wordsOf(text)
  const W = Math.max(1, ws.length), S = Math.max(1, sents.length)
  const syl = ws.reduce((n, w) => n + syllables(w), 0), poly = ws.filter((w) => syllables(w) >= 3).length
  const L = letters(ws)
  const r = (x: number) => Math.round(x * 10) / 10
  const fre = r(Math.min(100, 206.835 - 1.015 * (W / S) - 84.6 * (syl / W)))
  const fk = r(Math.max(0, 0.39 * (W / S) + 11.8 * (syl / W) - 15.59))
  const smog = r(Math.max(0, 1.043 * Math.sqrt(poly * (30 / S)) + 3.1291))
  const fog = r(Math.max(0, 0.4 * (W / S + (100 * poly) / W)))
  const cli = r(Math.max(0, 0.0588 * ((100 * L) / W) - 0.296 * ((100 * S) / W) - 15.8))
  const ari = r(Math.max(0, 4.71 * (L / W) + 0.5 * (W / S) - 21.43))
  const F = (id: string, value: number, unit: Formula['unit'], ok: boolean): Formula => ({ id, ...FORMULA_INFO[id], value, unit, ok, target: unit === 'grade' ? target : undefined })
  const formulas = [F('fre', fre, 'score', fre >= 60), F('fk', fk, 'grade', fk <= target), F('smog', smog, 'grade', smog <= target + 1), F('fog', fog, 'grade', fog <= target + 2), F('cli', cli, 'grade', cli <= target), F('ari', ari, 'grade', ari <= target)]
  // Abbreviations count as defined once they appear in brackets after their words, or before them.
  const defined = new Set<string>([...text.matchAll(/\(([A-Z]{2,}[A-Za-z0-9]*)\)/g)].map((m) => m[1]))
  const problems: Problem[] = []
  const sentenceList = sents.map((s, i) => {
    const n = wordsOf(s).length, flags: Problem['kind'][] = []
    const add = (kind: Problem['kind'], t: string, hint: string) => { flags.push(kind); problems.push({ kind, text: t, sentence: i, hint }) }
    if (n > 20) add('long', s, `${n} words: split it, or move detail to a list.`)
    const pm = PASSIVE.exec(s); if (pm) add('passive', pm[0], 'Say who does it: “the study doctor will take…” rather than “will be taken”.')
    const nm = NOMINAL.exec(s); if (nm) add('nominal', nm[0], 'Use the verb: “giving” rather than “administration of”.')
    if (DOUBLE_NEG.test(s)) add('negative', s.match(DOUBLE_NEG)![0], 'Say it positively.')
    for (const a of s.match(ABBREV) ?? []) if (!defined.has(a) && !/^(I|OK|US|UK|EU|HIV|COVID|DNA|TV)$/.test(a) && !s.includes(`(${a})`)) { add('abbrev', a, `Spell out ${a} the first time, or use a plain word.`); defined.add(a) }
    if (PERCENT.test(s) && !NATURAL.test(s)) add('percent', s.match(PERCENT)![0], 'Add a natural frequency: “12% (about 12 in 100 people)”.')
    for (const w of wordsOf(s)) if (w.length > 12 && syllables(w) >= 4) { add('longword', w, 'Is there a shorter word?'); break }
    return { text: s, words: n, flags }
  })
  return { words: ws.length, sentences: sents.length, wordsPerSentence: r(W / S), longWordsPct: Math.round((100 * poly) / W), syllablesPerWord: Math.round((syl / W) * 100) / 100, formulas, grade: fk, problems, jargon: findJargon(text), sentenceList }
}

// ISO 24495-1:2023 governing principles, as review questions (the standard's text is not reproduced).
export const ISO_PRINCIPLES = [
  { id: 'relevant', name: 'Relevant', q: ['Is it clear who the reader is and what they need to do or decide?', 'Is everything the reader needs there, and nothing they do not?'] },
  { id: 'findable', name: 'Findable', q: ['Do headings tell the reader what each part is about?', 'Is the most important information first?'] },
  { id: 'understandable', name: 'Understandable', q: ['Are words familiar, with technical terms explained?', 'Are sentences short and active, one idea each?', 'Are numbers and risks given in a form the reader can use?'] },
  { id: 'usable', name: 'Usable', q: ['Could the reader act on it (take the medicine, decide to join)?', 'Has it been tested with people like the readers?'] },
]

// Default reading targets (US grade), changeable per class: a common ethics committee expectation,
// not a legal rule.
export const TARGETS: Record<string, number> = { consent: 8, 'lay-summary': 8, representative: 8, leaflet: 8, lay: 8, 'assent-12-17': 6, 'assent-7-11': 4, drill: 8 }
