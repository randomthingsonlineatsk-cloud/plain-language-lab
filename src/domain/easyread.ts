// Easy Read and audio versions. Easy Read is for people with a learning disability and others who
// find reading hard: one idea per line, short everyday words, a picture beside each line, large
// print, no abbreviations or percentages. The checks follow common Easy Read guidance (for example
// the UK Department of Health’s guidance for Easy Read information, 2010); there is no single
// legal standard. The audio script is read aloud at a steady pace for people who cannot read print.
import { analyze } from './analyze'
import { unexplained } from './literacy'
import type { DocSection } from './types'

export const PICTURES: { id: string; label: string; re: RegExp }[] = [
  { id: 'pill', label: 'Tablet', re: /\btablets?|medicine|pill|dose|placebo\b/i },
  { id: 'calendar', label: 'Calendar', re: /\bweeks?|months?|days?|visits?|year\b/i },
  { id: 'doctor', label: 'Doctor', re: /\bdoctor|nurse|study team\b/i },
  { id: 'blood', label: 'Blood test', re: /\bblood|liver test\b/i },
  { id: 'stop', label: 'Stop', re: /\bstop|leave|say no|refuse\b/i },
  { id: 'phone', label: 'Phone', re: /\bcall|phone|contact|tell\b/i },
  { id: 'question', label: 'Question', re: /\bask|question|not sure|unknown|do not know\b/i },
  { id: 'warning', label: 'Warning', re: /\bside effect|risk|harm|unwell|sick|danger\b/i },
  { id: 'people', label: 'People', re: /\bpeople|groups?|others|family\b/i },
  { id: 'baby', label: 'Pregnancy', re: /\bpregnan|baby|unborn\b/i },
  { id: 'lock', label: 'Private', re: /\bprivate|name|records?|data\b/i },
  { id: 'hand', label: 'Hands', re: /\bhands?|skin|eczema\b/i },
  { id: 'check', label: 'Yes / OK', re: /\byes|agree|choice|free\b/i },
]
export interface ERLine { text: string; picture: string }
export interface EasyRead { lines: ERLine[]; fontPt: number; audio: string }

const pictureFor = (t: string) => PICTURES.find((p) => p.re.test(t))?.id ?? ''
/** A first draft from document sections: one sentence a line, with a suggested picture. The writer rewrites it. */
export function draftEasyRead(secs: DocSection[]): EasyRead {
  const lines = secs.flatMap((s) => [s.heading, ...s.text.split(/(?<=[.!?])\s+|\n+/)].map((x) => x.trim()).filter(Boolean)).map((text) => ({ text, picture: pictureFor(text) }))
  return { lines, fontPt: 12, audio: '' }
}

export interface ERCheck { id: string; label: string; ok: boolean; why: string }
const words = (s: string) => s.split(/\s+/).filter(Boolean).length
export function easyReadChecks(e: EasyRead): ERCheck[] {
  const L = e.lines.filter((l) => l.text.trim()), text = L.map((l) => l.text).join('\n')
  const long = L.filter((l) => words(l.text) > 15), two = L.filter((l) => /[^.!?]\.\s+\S|;/.test(l.text) || (l.text.match(/,/g) ?? []).length > 1)
  const pics = L.filter((l) => l.picture).length, g = analyze(text).grade, jar = unexplained(text)
  const c = (id: string, label: string, ok: boolean, why: string): ERCheck => ({ id, label, ok, why })
  return [
    c('ER1', 'Each line is 15 words or fewer', !long.length, long.length ? `${long.length} longer lines, for example “${long[0].text.slice(0, 60)}…”.` : ''),
    c('ER2', 'One idea per line (one sentence, no semicolons, at most one comma)', !two.length, two.length ? `${two.length} lines hold more than one idea.` : ''),
    c('ER3', 'A picture beside every line', pics === L.length && L.length > 0, `${pics} of ${L.length} lines have a picture.`),
    c('ER4', 'Everyday words: grade 5 or below', g <= 5, `Grade ${g}.`),
    c('ER5', 'No unexplained medical words', !jar.length, jar.length ? `Unexplained: ${[...new Set(jar.map((j) => j.word))].slice(0, 5).join(', ')}.` : ''),
    c('ER6', 'No abbreviations, percentages or Latin short forms', !/\b[A-Z]{2,}\b|%|\b(e\.g|i\.e|etc)\b/.test(text), 'Write words and “x in 100” instead.'),
    c('ER7', 'Large print: at least 14 point', e.fontPt >= 14, `Set to ${e.fontPt} point.`),
    c('ER8', 'Speaks to the reader as “you”', /\byou\b/i.test(text), ''),
  ]
}

export const WPM = 130 // a steady pace for health information read aloud
/** An audio script made from the Easy Read lines: a pause between lines, the contact said twice. */
export function audioScriptFrom(e: EasyRead) {
  const body = e.lines.filter((l) => l.text.trim()).map((l) => l.text.trim()).join('\n[pause]\n')
  return `${body}\n[pause]\nThis was information about a research study. You can listen again at any time.`
}
export function audioChecks(script: string): ERCheck[] {
  const t = script.replace(/\[pause\]/g, ''), w = words(t), mins = Math.round((w / WPM) * 10) / 10
  const long = t.split(/(?<=[.!?])\s+|\n+/).filter((x) => words(x) > 20).length
  const c = (id: string, label: string, ok: boolean, why: string): ERCheck => ({ id, label, ok, why })
  return [
    c('AU1', `About ${mins} minutes at ${WPM} words a minute: 4 minutes or less`, w > 0 && mins <= 4, ''),
    c('AU2', 'No sentence longer than 20 words when spoken', w > 0 && !long, long ? `${long} long sentences.` : ''),
    c('AU3', 'Pauses between ideas', (script.match(/\[pause\]/g) ?? []).length >= 3, ''),
    c('AU4', 'Says how to ask questions or get help', /\b(call|phone|ask|tell)\b/i.test(t), ''),
    c('AU5', 'No symbols that cannot be read aloud (%, /, &, brackets)', w > 0 && !/[%/&()]/.test(t), ''),
  ]
}
