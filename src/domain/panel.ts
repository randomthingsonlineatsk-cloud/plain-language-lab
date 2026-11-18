// Patient panel review: five reader personas, written for this app, comment on a document the
// way a patient advisory panel would before it goes to the ethics committees. The comments come
// from rules, so they are a rehearsal for a real panel, not a substitute for one. Each comment is
// resolved by revising the text (the rule must then stop firing) or by keeping the text with a
// reason, and the log records who decided what.
import { analyze } from './analyze'
import { unexplained } from './literacy'
import { numberChecks } from './risk'
import type { DocSection } from './types'

export interface Persona { id: string; name: string; who: string }
export const PERSONAS: Persona[] = [
  { id: 'meena', name: 'Meena, 52', who: 'Left school at 14; reads Marathi and Hindi first and English slowly. Wants short sentences and everyday words.' },
  { id: 'ravi', name: 'Ravi, 38', who: 'Cares for his father, who has hand eczema. Wants to know what the family must do, what it costs and whom to call.' },
  { id: 'margaret', name: 'Margaret, 74', who: 'Retired, uses reading glasses, takes several medicines. Loses her place in long paragraphs and worries about mixing medicines.' },
  { id: 'daniel', name: 'Daniel, 45', who: 'Teacher, comfortable with numbers. Wants real numbers for risks and benefits, not vague words.' },
  { id: 'aisha', name: 'Aisha, 19', who: 'Student, first time in a study. Wants to know what happens to her data and whether she can change her mind.' },
]

export interface PanelComment { id: string; persona: string; section: string; rule: string; text: string }
export interface Resolution { action: 'revised' | 'kept'; note: string; by: string; utc: string }
export interface PanelReview { doc: string; sections: string[]; comments: PanelComment[]; resolutions: Record<string, Resolution>; ranUtc: string }

const sentencesOf = (t: string) => t.split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter(Boolean)
const wc = (s: string) => s.split(/\s+/).filter(Boolean).length

/** The comments the panel makes on these sections. Ids are stable: persona, rule and section. */
export function panelComments(secs: DocSection[]): PanelComment[] {
  const out: PanelComment[] = []
  const add = (persona: string, s: DocSection, rule: string, text: string) => out.push({ id: `${persona}:${rule}:${s.id}`, persona, section: s.id, rule, text })
  for (const s of secs) {
    const t = s.text, sents = sentencesOf(t), a = analyze(t), jar = unexplained(t), nums = numberChecks(t)
    const long = sents.filter((x) => wc(x) > 25)
    if (long.length) add('meena', s, 'long-sentence', `I lost the meaning in ${long.length === 1 ? 'a sentence' : `${long.length} sentences`} of more than 25 words, starting “${long[0].split(/\s+/).slice(0, 6).join(' ')}…”. Can you split ${long.length === 1 ? 'it' : 'them'}?`)
    if (jar.length) add('meena', s, 'jargon', `I do not know these words: ${[...new Set(jar.map((j) => j.word.toLowerCase()))].slice(0, 4).join(', ')}. Please say what they mean or use simpler words.`)
    if (/\b(e\.g\.|i\.e\.|etc\.|approx\.|vs\.?)\b/i.test(t)) add('meena', s, 'latin', 'Short forms such as e.g., i.e. or etc. are hard for me. Please write the words out.')
    if (s.id === 'contacts' || s.id === 'costs' || s.id === 'what') {
      if (/\[Site to complete/.test(t)) add('ravi', s, 'missing-contact', 'There is a blank where the name and phone number should be. My father will need it when I am at work.')
      if (s.id === 'what' && !/\btravel|transport|time off|costs?\b/i.test(t)) add('ravi', s, 'travel', 'Eight visits is a lot. Will someone pay for the travel? It does not say here.')
    }
    if (s.id === 'what' && !/\bdiary|remind|calendar|schedule|list\b/i.test(t)) add('ravi', s, 'schedule', 'A simple list or calendar of the visits would help us plan.')
    if (wc(t) > 140 && !/\n/.test(t.trim())) add('margaret', s, 'wall-of-text', `This section is one block of ${wc(t)} words. Please break it into short paragraphs or a list so I do not lose my place.`)
    if (s.id === 'resp' && !/\bother medicines?|tell .{0,30}medicines?\b/i.test(t)) add('margaret', s, 'other-medicines', 'I take several medicines. Does it say I must tell the study doctor about them before I start?')
    if (s.id === 'risks' && !/\binteract|other medicines?|with your medicines?\b/i.test(t)) add('margaret', s, 'interactions', 'Can I take my usual tablets with this one? The risks do not mention other medicines.')
    const vague = /\b(very common|common|uncommon|rare|very rare|some people|a few people|most people)\b/i.exec(t)
    if (vague && !new RegExp(`${vague[0]}[^.]{0,60}\\d+\\s*(in|out of)\\s*\\d+`, 'i').test(t) && !/\d+\s*(in|out of)\s*\d+/i.test(t)) add('daniel', s, 'vague-frequency', `“${vague[0]}” means different things to different people. How many in 100?`)
    if (nums.some((n) => n.rule === 'PL-N01')) add('daniel', s, 'percent', 'Percentages are fine for me, but my neighbours prefer “x in 100”. Please give both, or use “in 100”.')
    if (nums.some((n) => ['PL-N02', 'PL-N03'].includes(n.rule))) add('daniel', s, 'relative', 'A relative risk alone does not tell me my own risk. What are the actual numbers in each group?')
    if (s.id === 'risks' && !/not known|unknown|do not know|no one knows/i.test(t)) add('daniel', s, 'unknowns', 'What is not known yet? I would trust it more if it said so.')
    if (s.id === 'privacy' && !/\bwho\b|\bsee\b|\bshare|\bkeep\b/i.test(t)) add('aisha', s, 'data', 'Who will see my information, and for how long is it kept?')
    if (s.id === 'voluntary' && !/change your mind|any time|at any time/i.test(t)) add('aisha', s, 'change-mind', 'Can I change my mind later? It should say so plainly.')
    if (a.grade > 10) add('aisha', s, 'tone', `This reads like a legal document (grade ${a.grade}). It makes me feel I cannot ask questions.`)
  }
  return out
}

export function runPanel(doc: string, secs: DocSection[], now = new Date().toISOString()): PanelReview {
  return { doc, sections: secs.map((s) => s.id), comments: panelComments(secs), resolutions: {}, ranUtc: now }
}

/** Each comment's state now: open, resolved by revision (the rule no longer fires), or kept with a reason. */
export function panelStatus(r: PanelReview, secs: DocSection[]) {
  const live = new Set(panelComments(secs.filter((s) => r.sections.includes(s.id))).map((c) => c.id))
  return r.comments.map((c) => {
    const res = r.resolutions[c.id]
    const state = live.has(c.id) ? (res?.action === 'kept' && res.note.trim().length >= 15 ? 'kept' : 'open') : 'revised'
    return { c, res, state: state as 'open' | 'revised' | 'kept' }
  })
}

export function panelLog(r: PanelReview, secs: DocSection[]) {
  const rows = panelStatus(r, secs)
  return ['Patient panel review log (training; personas written for the Plain Language Lab)', `Document: ${r.doc}; run ${r.ranUtc.slice(0, 16).replace('T', ' ')} UTC`, '',
    ...rows.map(({ c, res, state }) => `${c.id}\t${PERSONAS.find((p) => p.id === c.persona)?.name}\t${c.section}\t${state}\t${c.text}${res ? `\tResponse: ${res.note} (${res.by}, ${res.utc.slice(0, 10)})` : ''}`)].join('\n')
}
