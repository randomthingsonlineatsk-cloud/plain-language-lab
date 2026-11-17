// The eConsent mock-up: the consent form screen by screen, with glossary pop-ups, an identity step,
// a comprehension quiz with teach-back on wrong answers, a question log, a signature with its
// meaning and time, an audit trail and a copy for the participant. After the FDA and OHRP Q&A on
// electronic informed consent (2016), the EU recommendation paper on decentralised elements (2022)
// and ICH E6(R3). A practice flow: no real identity checks or signatures.
import type { Project, StudyFacts } from './types'

export type KeyTopic = 'placebo' | 'duration' | 'voluntary' | 'risks' | 'contact'
export const KEY_TOPICS: { id: KeyTopic; label: string; right: RegExp }[] = [
  { id: 'placebo', label: 'The chance of getting placebo', right: /\d+ in \d+|one in|placebo/i },
  { id: 'duration', label: 'How long taking part lasts', right: /\d+ weeks|\d+ months/i },
  { id: 'voluntary', label: 'They can stop at any time without giving a reason', right: /any time|stop|without (giving )?a reason/i },
  { id: 'risks', label: 'The main risks', right: /cold|infection|liver|side effect|baby|blood/i },
  { id: 'contact', label: 'Whom to contact', right: /study doctor|ethics committee|telephone|phone/i },
]
export interface QuizQ { id: string; q: string; options: string[]; answer: number; topic?: KeyTopic; section: string }
export interface AuditEvent { utc: string; what: string }
export interface Session { id: string; participant: string; startedUtc: string; events: AuditEvent[]; answers: Record<string, number[]>; questions: string[]; signed?: { name: string; meaning: string; utc: string }; copy?: boolean }
export interface EConsent { identity: boolean; glossary: boolean; teachBack: boolean; questionLog: boolean; quiz: QuizQ[]; sessions: Session[] }

export function defaultQuiz(f: StudyFacts): QuizQ[] {
  const tot = f.arms.reduce((n, a) => n + a.ratio, 0) || 1, pbo = f.arms.filter((a) => a.placebo).reduce((n, a) => n + a.ratio, 0)
  return [
    { id: 'E1', q: 'How long will you be in the study?', options: [`About ${f.participationWeeks} weeks`, 'One week', 'For the rest of your life'], answer: 0, topic: 'duration', section: 'key' },
    { id: 'E2', q: 'What chance do you have of getting placebo?', options: [pbo ? `${pbo === 1 ? '1' : pbo} in ${tot}` : 'No placebo', 'No chance', 'Everyone gets placebo'], answer: 0, topic: 'placebo', section: 'what' },
    { id: 'E3', q: 'Can you stop taking part?', options: ['Yes, at any time, without giving a reason', 'Only with the doctor’s permission', 'No, once you sign you must finish'], answer: 0, topic: 'voluntary', section: 'voluntary' },
  ]
}
export const blankEConsent = (f: StudyFacts): EConsent => ({ identity: false, glossary: true, teachBack: false, questionLog: true, quiz: defaultQuiz(f), sessions: [] })

/** PL12 and the checklist on the eConsent page. */
export function econsentChecks(e: EConsent) {
  const covered = (t: KeyTopic) => e.quiz.some((q) => q.topic === t && KEY_TOPICS.find((k) => k.id === t)!.right.test(q.options[q.answer] ?? '') && q.options.length >= 2)
  const done = e.sessions.find((s) => s.signed && s.events.length >= 4)
  return [
    { id: 'identity', label: 'Identity is confirmed before consent', ok: e.identity },
    { id: 'quiz5', label: 'At least five comprehension questions', ok: e.quiz.length >= 5 },
    ...KEY_TOPICS.map((k) => ({ id: `topic:${k.id}`, label: `The quiz checks: ${k.label.toLowerCase()}`, ok: covered(k.id) })),
    { id: 'teachback', label: 'Wrong answers lead back to the section (teach-back)', ok: e.teachBack },
    { id: 'session', label: 'A complete session: identity, every screen, quiz, signature with its meaning', ok: !!done },
    { id: 'copy', label: 'The participant received a copy', ok: e.sessions.some((s) => s.copy) },
  ]
}
export const ensureEConsent = (p: Project) => (p.econsent ??= blankEConsent(p.facts))
