// Health-literacy scorecard: the CDC Clear Communication Index (20 scored items in four parts;
// each item 0 or 1, the score is points over applicable items times 100, and 90 or more passes)
// and AHRQ's Patient Education Materials Assessment Tool for printable materials (PEMAT-P:
// understandability items 1 to 12 and 15 to 19, actionability items 20 to 26; each Agree = 1,
// Disagree = 0, N/A left out; the score is a percentage). Both tools need a person's judgement:
// the app suggests a rating where it can measure something in the text, and the reviewer decides.
// Item wording here is shortened; read the official tools for the full wording and guidance.
import { analyze } from './analyze'
import { findJargon } from '../shared/jargon'
import { numberChecks } from './risk'

export type Rating = 'yes' | 'no' | 'na'
export interface ToolItem { id: string; part: string; text: string; na?: boolean; reverse?: boolean }

export const CDC_ITEMS: ToolItem[] = [
  { id: 'C1', part: 'Main message and call to action', text: 'The material has one main message statement.' },
  { id: 'C2', part: 'Main message and call to action', text: 'The main message is at the top, beginning or front.' },
  { id: 'C3', part: 'Main message and call to action', text: 'The main message is emphasised with visual cues.' },
  { id: 'C4', part: 'Main message and call to action', text: 'At least one visual conveys or supports the main message.' },
  { id: 'C5', part: 'Main message and call to action', text: 'There are one or more calls to action for the primary audience.' },
  { id: 'C6', part: 'Language', text: 'The main message and the call to action use the active voice.' },
  { id: 'C7', part: 'Language', text: 'The material always uses words the primary audience uses.' },
  { id: 'C8', part: 'Information design', text: 'The material uses bulleted or numbered lists.' },
  { id: 'C9', part: 'Information design', text: 'The material is organised in chunks with headings.' },
  { id: 'C10', part: 'Information design', text: 'The most important information is summarised in the first paragraph or section.' },
  { id: 'C11', part: 'State of the science', text: 'It explains what authoritative sources know and do not know about the topic.' },
  { id: 'C12', part: 'Behavioural recommendations', text: 'It includes one or more behavioural recommendations.', na: true },
  { id: 'C13', part: 'Behavioural recommendations', text: 'It explains why the recommendation is important to the audience.', na: true },
  { id: 'C14', part: 'Behavioural recommendations', text: 'The recommendation includes specific directions on how to do it.', na: true },
  { id: 'C15', part: 'Numbers', text: 'It always presents numbers the primary audience uses.', na: true },
  { id: 'C16', part: 'Numbers', text: 'It always explains what the numbers mean.', na: true },
  { id: 'C17', part: 'Numbers', text: 'The audience has to do mathematical calculations. (Scored 1 for “no”.)', na: true, reverse: true },
  { id: 'C18', part: 'Risk', text: 'It explains the nature of the risk.', na: true },
  { id: 'C19', part: 'Risk', text: 'It addresses both the risks and the benefits of the recommended behaviours.', na: true },
  { id: 'C20', part: 'Risk', text: 'If it gives a numeric probability, the probability is also explained in words or a visual.', na: true },
]

export const PEMAT_ITEMS: ToolItem[] = [
  { id: 'P1', part: 'Understandability: content', text: 'The material makes its purpose completely evident.' },
  { id: 'P2', part: 'Understandability: content', text: 'It does not include information or content that distracts from its purpose.' },
  { id: 'P3', part: 'Understandability: word choice and style', text: 'It uses common, everyday language.' },
  { id: 'P4', part: 'Understandability: word choice and style', text: 'Medical terms are used only to familiarise the audience with them, and are defined.' },
  { id: 'P5', part: 'Understandability: word choice and style', text: 'It uses the active voice.' },
  { id: 'P6', part: 'Understandability: use of numbers', text: 'Numbers in the material are clear and easy to understand.', na: true },
  { id: 'P7', part: 'Understandability: use of numbers', text: 'It does not expect the user to perform calculations.' },
  { id: 'P8', part: 'Understandability: organisation', text: 'It breaks or “chunks” information into short sections.', na: true },
  { id: 'P9', part: 'Understandability: organisation', text: 'Its sections have informative headers.', na: true },
  { id: 'P10', part: 'Understandability: organisation', text: 'It presents information in a logical sequence.' },
  { id: 'P11', part: 'Understandability: organisation', text: 'It provides a summary.', na: true },
  { id: 'P12', part: 'Understandability: layout and design', text: 'It uses visual cues (arrows, boxes, bullets, bold, larger font, highlighting) to draw attention to key points.', na: true },
  { id: 'P15', part: 'Understandability: visual aids', text: 'It uses visual aids whenever they could make content more easily understood.' },
  { id: 'P16', part: 'Understandability: visual aids', text: 'Its visual aids reinforce rather than distract from the content.', na: true },
  { id: 'P17', part: 'Understandability: visual aids', text: 'Its visual aids have clear titles or captions.', na: true },
  { id: 'P18', part: 'Understandability: visual aids', text: 'It uses illustrations and photographs that are clear and uncluttered.', na: true },
  { id: 'P19', part: 'Understandability: visual aids', text: 'It uses simple tables with short and clear row and column headings.', na: true },
  { id: 'P20', part: 'Actionability', text: 'It clearly identifies at least one action the user can take.' },
  { id: 'P21', part: 'Actionability', text: 'It addresses the user directly when describing actions.' },
  { id: 'P22', part: 'Actionability', text: 'It breaks down any action into manageable, explicit steps.' },
  { id: 'P23', part: 'Actionability', text: 'It provides a tangible tool (such as a checklist) whenever it could help the user act.' },
  { id: 'P24', part: 'Actionability', text: 'It gives simple instructions or examples of how to perform calculations.', na: true },
  { id: 'P25', part: 'Actionability', text: 'It explains how to use the charts, graphs, tables or diagrams to take actions.', na: true },
  { id: 'P26', part: 'Actionability', text: 'It uses visual aids whenever they could make it easier to act on the instructions.' },
]
export const UNDERSTAND = PEMAT_ITEMS.filter((i) => !i.part.startsWith('Actionability')).map((i) => i.id)
export const ACTION = PEMAT_ITEMS.filter((i) => i.part.startsWith('Actionability')).map((i) => i.id)
export const CDC_PASS = 90
export const PEMAT_BENCHMARK = 70 // a benchmark often used in published studies; AHRQ sets no official pass mark

/** Jargon not explained in the same sentence (the drills' rule). */
export function unexplained(text: string) {
  const explained = (w: string) => new RegExp(`${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:[(–—:,]|\\b(?:means|which|that|with|is a|is an|looks)\\b)[^.]{3,}`, 'i').test(text)
  const seen = new Set<string>()
  return findJargon(text).filter((j) => { const k = j.word.toLowerCase(); if (seen.has(k) || explained(j.word)) return false; seen.add(k); return true })
}
const pct = (ids: string[], r: Record<string, Rating>, items: ToolItem[]) => {
  const used = ids.filter((id) => r[id] && r[id] !== 'na')
  if (!used.length) return null
  const pts = used.filter((id) => { const it = items.find((x) => x.id === id)!; return it.reverse ? r[id] === 'no' : r[id] === 'yes' }).length
  return Math.round((100 * pts) / used.length)
}
export const cdcScore = (r: Record<string, Rating>) => pct(CDC_ITEMS.map((i) => i.id), r, CDC_ITEMS)
export const pematScores = (r: Record<string, Rating>) => ({ understandability: pct(UNDERSTAND, r, PEMAT_ITEMS), actionability: pct(ACTION, r, PEMAT_ITEMS) })

export interface Hint { rating: Rating; why: string }
/** What the text itself can tell: a suggested rating for the items a rule can measure. */
export function hints(text: string, target = 8): Record<string, Hint> {
  const a = analyze(text, target), jar = unexplained(text)
  const passive = a.problems.filter((p) => p.kind === 'passive').length, sentences = Math.max(1, a.sentences)
  const lines = text.split('\n'), bullets = lines.filter((l) => /^\s*([-•*]|\d+[.)])\s+/.test(l)).length
  const headings = lines.filter((l) => l.trim() && l.trim().length < 70 && !/[.;,]$/.test(l.trim()) && /^[A-Z#]/.test(l.trim())).length
  const nums = numberChecks(text), hasNums = /\d/.test(text), you = /\byou(r)?\b/i.test(text)
  const calc = /\b(relative(ly)?|times (higher|more|as)|% (more|less|higher|lower)|percentage of|reduced by \d+%|increase of \d+%)/i.test(text)
  const action = /\b(call|phone|tell|ask|take|bring|come|stop|contact|go to|write|keep)\b/i.test(text)
  const paras = text.split(/\n\s*\n/).filter((x) => x.trim()).length
  const h = (rating: Rating, why: string): Hint => ({ rating, why })
  return {
    C5: action ? h('yes', 'There is at least one instruction such as call, tell, take or bring.') : h('no', 'No instruction to the reader was found.'),
    C7: jar.length ? h('no', `Unexplained terms: ${jar.slice(0, 5).map((j) => j.word).join(', ')}.`) : h('yes', 'No unexplained jargon from the dictionary.'),
    C8: bullets ? h('yes', `${bullets} list line${bullets === 1 ? '' : 's'}.`) : h('no', 'No bulleted or numbered lines.'),
    C9: headings >= 2 ? h('yes', `${headings} heading-like lines.`) : h('no', 'Fewer than two headings.'),
    C15: !hasNums ? h('na', 'No numbers.') : nums.some((n) => ['PL-N01', 'PL-N03', 'PL-N04'].includes(n.rule)) ? h('no', 'Percentages, decimals or mixed denominators.') : h('yes', 'Numbers are counts or “x in 100”.'),
    C17: !hasNums ? h('na', 'No numbers.') : calc ? h('yes', 'A relative or derived number: the reader must work out the real figure.') : h('no', 'No calculation needed.'),
    P3: a.grade <= target && !jar.length ? h('yes', `Grade ${a.grade}, no unexplained jargon.`) : h('no', `Grade ${a.grade}${jar.length ? `, ${jar.length} unexplained terms` : ''}.`),
    P4: jar.length ? h('no', `Not defined: ${jar.slice(0, 5).map((j) => j.word).join(', ')}.`) : h('yes', 'Medical terms are explained.'),
    P5: passive / sentences > 0.15 ? h('no', `${passive} passive sentences of ${sentences}.`) : h('yes', `${passive} passive sentences of ${sentences}.`),
    P6: !hasNums ? h('na', 'No numbers.') : nums.length ? h('no', `${nums.length} number problems (see Risk and numbers).`) : h('yes', 'The number checks are clear.'),
    P7: calc ? h('no', 'The reader must calculate (relative or derived numbers).') : h('yes', 'No calculation needed.'),
    P8: paras <= 2 && a.words < 250 ? h('na', 'Very short material (two paragraphs or less).') : paras >= 3 ? h('yes', `${paras} sections.`) : h('no', 'One long block.'),
    P9: paras <= 2 && a.words < 250 ? h('na', 'Very short material.') : headings >= 2 ? h('yes', `${headings} headers.`) : h('no', 'No informative headers.'),
    P12: bullets ? h('yes', 'Bullets draw attention to points.') : h('no', 'No bullets, boxes or other cues found in the text.'),
    P20: action ? h('yes', 'At least one action is named.') : h('no', 'No action for the reader.'),
    P21: you ? h('yes', 'The text speaks to the reader as “you”.') : h('no', 'The text does not say “you”.'),
    P22: bullets >= 2 && action ? h('yes', 'Actions are listed as steps.') : h('no', 'Actions are not broken into steps.'),
  }
}

/** A worked handout for mission PL13, deliberately written in protocol style. */
export const PL13_TEXT = `Information about Visit Procedures
Subjects are required to attend scheduled visits at 4-weekly intervals throughout the treatment period, at which venipuncture will be performed and vital signs will be assessed, and the IGA-CHE and HECSI will be evaluated by the investigator; approximately 15 mL of blood will be drawn per visit, and hepatic enzyme monitoring is performed because ALT elevations were observed in 3% of subjects in prior studies, representing a relative increase of 50% versus placebo, so participants experiencing adverse events should contact the site.`

/** The reference ratings for PL13 (with the reason shown after submitting). */
export const PL13_KEY: Record<string, { r: Rating; why: string }> = {
  C1: { r: 'no', why: 'There is no single main message; it lists procedures.' }, C2: { r: 'no', why: 'Nothing that could be a main message comes first.' },
  C3: { r: 'no', why: 'No visual cues at all.' }, C4: { r: 'no', why: 'No visuals.' }, C5: { r: 'yes', why: '“Should contact the site” is a call to action, if a weak one.' },
  C6: { r: 'no', why: 'Mostly passive (“will be performed”, “will be drawn”).' }, C7: { r: 'no', why: 'Venipuncture, hepatic, ALT, IGA-CHE, HECSI.' },
  C8: { r: 'no', why: 'No lists.' }, C9: { r: 'no', why: 'One heading over one block of text.' }, C10: { r: 'no', why: 'The first sentence is about the visit interval, not what matters most.' },
  C11: { r: 'no', why: 'It does not say what is known and unknown about the risk.' }, C12: { r: 'yes', why: 'Attend the visits; contact the site.' },
  C13: { r: 'no', why: 'It does not say why the visits or the call matter to the reader.' }, C14: { r: 'no', why: 'No phone number, no when or how.' },
  C15: { r: 'no', why: '“A relative increase of 50%” is not a number readers use.' }, C16: { r: 'no', why: 'It does not explain what 3% or 50% means for the reader.' },
  C17: { r: 'yes', why: 'The reader must work out the real risk from a relative increase (scored 0).' }, C18: { r: 'no', why: '“ALT elevations” does not explain the nature of the risk.' },
  C19: { r: 'no', why: 'No benefits.' }, C20: { r: 'no', why: '3% is not explained in words or a picture.' },
  P1: { r: 'no', why: 'The purpose is not stated.' }, P2: { r: 'no', why: 'The scale names and relative risk distract from what to do.' },
  P3: { r: 'no', why: 'Protocol language.' }, P4: { r: 'no', why: 'Terms are not defined.' }, P5: { r: 'no', why: 'Passive voice.' },
  P6: { r: 'no', why: 'A relative percentage is not easy to understand.' }, P7: { r: 'no', why: 'A relative increase expects a calculation.' },
  P8: { r: 'na', why: 'Very short material: one paragraph.' }, P9: { r: 'na', why: 'Very short material.' }, P10: { r: 'yes', why: 'The order, from visits to tests to what to do, is logical enough.' },
  P11: { r: 'na', why: 'Very short material.' }, P12: { r: 'no', why: 'No visual cues.' }, P15: { r: 'no', why: 'A picture of the visit schedule would help.' },
  P16: { r: 'na', why: 'No visual aids.' }, P17: { r: 'na', why: 'No visual aids.' }, P18: { r: 'na', why: 'No visual aids.' }, P19: { r: 'na', why: 'No tables.' },
  P20: { r: 'yes', why: 'Contact the site.' }, P21: { r: 'no', why: '“Participants … should” instead of “you”.' }, P22: { r: 'no', why: 'No steps.' },
  P23: { r: 'no', why: 'A visit checklist or calendar would help.' }, P24: { r: 'no', why: 'It implies a calculation without explaining it.' },
  P25: { r: 'na', why: 'No charts, graphs, tables or diagrams.' }, P26: { r: 'no', why: 'A visual of the visit schedule would help the reader act.' },
}
