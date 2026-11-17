// Simulated user testing of a patient leaflet, after the EU readability-testing method (Directive
// 2001/83/EC Article 59(3); the 2009 Readability Guideline): a questionnaire on the key messages, a
// pilot, then rounds of 10 participants drawn from the people likely to use the medicine. An answer
// passes when at least 90% of participants find it and at least 90% of those understand it: 16 of
// 20 understood, over two rounds of 10 on the same text. Here the participants are simulated: each
// has a literacy and numeracy level, and whether they find and understand an answer depends on the
// section it is in (is the answer there, does the heading lead to it, how long and how hard is the
// text). Results repeat for the same text and change when the text changes. A teaching model, not
// a substitute for testing with people.
import { analyze } from './analyze'
import { findJargon } from '../shared/jargon'
import type { LeafletSection } from './leaflet'

export interface Question { id: string; q: string; section: string; answer: string; message?: string }
export interface Participant { id: string; literacy: 'low' | 'medium' | 'high'; numeracy: 'low' | 'high' }
export interface QResult { id: string; found: number; understood: number; of: number }
export interface Round { n: number; utc: string; textHash: string; pilot: boolean; results: QResult[]; participants: Participant[] }

function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
export const textHash = (secs: LeafletSection[]) => hash(secs.map((s) => s.text).join('\u0001')).toString(36)
function rng(seed: number) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

export function panel(round: number, size: number): Participant[] {
  const r = rng(9973 * (round + 1))
  return Array.from({ length: size }, (_, i) => { const x = r(); return { id: `R${round}-P${i + 1}`, literacy: x < 0.3 ? 'low' : x < 0.8 ? 'medium' : 'high', numeracy: r() < 0.4 ? 'low' : 'high' } })
}
const CAP = { low: 6, medium: 9, high: 12 }
const words = (s: string) => (s.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((w) => !['what', 'when', 'should', 'does', 'have', 'this', 'that', 'with', 'your', 'take', 'about', 'which', 'will', 'from'].includes(w))

/** The chance a participant finds and understands one answer, from the text as it stands. */
export function odds(secs: LeafletSection[], q: Question, p: Participant) {
  const sec = secs.find((s) => s.num === q.section), re = new RegExp(q.answer, 'i')
  const here = !!sec && re.test(sec.text), elsewhere = secs.some((s) => re.test(s.text))
  const t = sec?.text ?? '', a = analyze(t)
  // A term explained in brackets beside it (“feeling sick (nausea)”) does not count as jargon.
  const jar = findJargon(t).filter((j) => t[j.index - 1] !== '(' && !/^\s*\(/.test(t.slice(j.index + j.word.length, j.index + j.word.length + 3))).length
  const headingHit = sec ? words(q.q).some((w) => sec.heading.toLowerCase().includes(w.slice(0, 5))) : false
  let find = here ? 0.995 : elsewhere ? 0.55 : 0.04
  if (here) find -= (a.words > 150 ? 0.05 : 0) + (headingHit ? 0 : 0.015) + Math.max(0, a.wordsPerSentence - 22) * 0.008
  let und = 0.99 - Math.max(0, a.grade - CAP[p.literacy]) * 0.06 - Math.min(0.4, jar * 0.035)
  if (p.numeracy === 'low' && /\d+\s?%/.test(sec?.text ?? '') && !/\d+\s+in\s+\d/.test(sec?.text ?? '')) und -= 0.15
  if (!here && !elsewhere) und = 0.05
  return { find: Math.max(0.02, Math.min(0.995, find)), understand: Math.max(0.03, Math.min(0.995, und)), here, elsewhere }
}

export function runRound(secs: LeafletSection[], qs: Question[], n: number, pilot = false): Round {
  const th = textHash(secs), people = panel(n, pilot ? 3 : 10)
  const results = qs.map((q) => {
    const r = rng(hash(`${q.id}|${n}|${th}`))
    let found = 0, understood = 0
    for (const p of people) { const o = odds(secs, q, p); if (r() < o.find) { found++; if (r() < o.understand) understood++ } }
    return { id: q.id, found, understood, of: people.length }
  })
  return { n, utc: new Date().toISOString(), textHash: th, pilot, results, participants: people }
}

/** The verdict: the last two full rounds on the same text, 20 participants. */
export function verdict(rounds: Round[], qs: Question[], secs: LeafletSection[]) {
  const full = rounds.filter((r) => !r.pilot), th = textHash(secs)
  const last2 = full.slice(-2)
  const sameText = last2.length === 2 && last2.every((r) => r.textHash === th)
  const per = qs.map((q) => {
    const rs = last2.map((r) => r.results.find((x) => x.id === q.id)).filter(Boolean) as QResult[]
    const found = rs.reduce((s, r) => s + r.found, 0), understood = rs.reduce((s, r) => s + r.understood, 0), of = rs.reduce((s, r) => s + r.of, 0)
    return { q, found, understood, of, pass: of === 20 && found >= 18 && understood >= 16 }
  })
  return { ready: sameText, pass: sameText && per.every((x) => x.pass), per, why: !last2.length ? 'Run the pilot, then two rounds of 10.' : !sameText ? 'The final verdict needs two rounds of 10 on the current text: revise, then run two rounds without changing it.' : per.every((x) => x.pass) ? 'Every answer was found by at least 18 of 20 and understood by at least 16 of 20.' : `${per.filter((x) => !x.pass).length} question(s) below the criterion.` }
}

// A starting questionnaire for the Ostrevia EU leaflet; learners add, edit and remove questions.
export const EU_QUESTIONS: Question[] = [
  { id: 'Q1', q: 'Who should not take Ostrevia?', section: 'pl2.1', answer: 'allerg', message: 'allergy' },
  { id: 'Q2', q: 'Can you take Ostrevia if you have TB?', section: 'pl2.1', answer: 'tuberculosis|\\bTB\\b', message: 'tb' },
  { id: 'Q3', q: 'What should you do if you get a fever or a cough while taking it?', section: 'pl2.2', answer: 'fever', message: 'infection' },
  { id: 'Q4', q: 'What tests will you have before and during treatment?', section: 'pl2.2', answer: 'blood test', message: 'bloodtests' },
  { id: 'Q5', q: 'Can you take Ostrevia while pregnant?', section: 'pl2.6', answer: 'pregnan', message: 'pregnant' },
  { id: 'Q6', q: 'For how long after the last dose must you use contraception?', section: 'pl2.6', answer: '4 weeks', message: 'contraception' },
  { id: 'Q7', q: 'For how long after the last dose should you not breast-feed?', section: 'pl2.6', answer: '4 days', message: 'breastfeed' },
  { id: 'Q8', q: 'How much should you take, and how often?', section: 'pl3', answer: 'once (a|each|every) day|once daily', message: 'dose' },
  { id: 'Q9', q: 'What should you do if you forget a tablet?', section: 'pl3.2', answer: 'double|two doses|2 doses', message: 'missed' },
  { id: 'Q10', q: 'What should you do if you take too many tablets?', section: 'pl3.1', answer: 'doctor|pharmacist', message: 'overdose' },
  { id: 'Q11', q: 'Which signs of a blood clot need a doctor straight away?', section: 'pl4', answer: 'leg pain', message: 'clot' },
  { id: 'Q12', q: 'How common is a cold as a side effect?', section: 'pl4', answer: 'more than 1 in 10|1 in 10', },
  { id: 'Q13', q: 'Can a 15-year-old take Ostrevia?', section: 'pl2.3', answer: 'under 18|children and adolescents', message: 'children' },
  { id: 'Q14', q: 'Where should you keep the tablets?', section: 'pl5', answer: 'reach of children', message: 'reach' },
]
