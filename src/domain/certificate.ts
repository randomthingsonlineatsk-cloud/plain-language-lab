// The Plain Language Lab certificate and its Skills Passport record. The certificate needs the core
// missions (PL1, PL2, PL3, PL6 and PL8) passed, every Learn quiz passed (2 of 3 or better) and every
// writing-skills set passed (6 of 8 or better). It is awarded with distinction when every mission
// is passed and at least three are at expert level. The verification code is cyrb53 of the basis,
// the same method as the other apps; the pharmolecule hub's Skills Passport recomputes it
// (verify.js, prefix PL-).
import type { Progress } from './types'
import { MISSIONS } from './missions'
import { LESSONS } from './learn'
import { SKILL_SETS, SET_PASS } from './skills'

export const PASSPORT_KIND = 'pharmolecule/passport-record' as const
export const PASSPORT_PAGE = 'https://randomthingsonlineatsk-cloud.github.io/pharmolecule/passport.html'
export const APP_ID = 'plain-language-lab'
export const APP_NAME = 'Plain Language Lab'
export const APP_URL = 'https://randomthingsonlineatsk-cloud.github.io/plain-language-lab/'
const NOTICE = 'Portfolio certificate from a training app. Not an accreditation.'
export const QUIZ_PASS = 2

export function hash(str: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677) }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0')
}

export const REQUIRED = MISSIONS.filter((m) => m.core).map((m) => m.id)
export interface Cert { eligible: boolean; distinction: boolean; basis: string; code: string; criteria: { label: string; met: boolean }[]; best: Record<string, { score: number; level: string } | undefined>; quizzes: number; skills: number }

const levelOf = (id: string, score: number) => { const m = MISSIONS.find((x) => x.id === id)!; return score >= m.expert ? 'expert' : score >= m.pass ? 'passed' : 'not yet' }

export function certificate(g: Progress, learner: { name: string; userId: string }): Cert {
  const best: Cert['best'] = {}
  for (const m of MISSIONS) { const r = g.missions[m.id]; best[m.id] = r ? { score: r.score, level: levelOf(m.id, r.score) } : undefined }
  const passed = (id: string) => !!best[id] && best[id]!.level !== 'not yet'
  const quizzes = LESSONS.filter((l) => (g.quizzes[l.id]?.score ?? 0) >= QUIZ_PASS).length
  const skills = SKILL_SETS.filter((s) => (g.skills?.[s.id]?.score ?? 0) >= SET_PASS).length
  const criteria = [
    ...REQUIRED.map((id) => ({ label: `${id} ${MISSIONS.find((m) => m.id === id)?.title ?? ''} passed`, met: passed(id) })),
    { label: `All ${LESSONS.length} Learn quizzes passed (${QUIZ_PASS} of 3 or better)`, met: quizzes === LESSONS.length },
    { label: `All ${SKILL_SETS.length} writing-skills sets passed (${SET_PASS} of 8 or better)`, met: skills === SKILL_SETS.length },
  ]
  const eligible = criteria.every((c) => c.met)
  const expert = MISSIONS.filter((m) => best[m.id]?.level === 'expert').length
  const distinction = eligible && MISSIONS.every((m) => passed(m.id)) && expert >= 3
  const basis = `${learner.name.trim().toLowerCase()}|${MISSIONS.filter((m) => passed(m.id)).map((m) => `${m.id}:${best[m.id]!.score}:${best[m.id]!.level}`).join(',')}|quiz:${quizzes}/${LESSONS.length}|skills:${skills}/${SKILL_SETS.length}|${learner.userId}`
  const h = hash(basis).slice(-10).toUpperCase()
  return { eligible, distinction, basis, code: `PL-${h.slice(0, 5)}-${h.slice(5)}`, criteria, best, quizzes, skills }
}

export const sealOf = (rec: object) => { const { seal: _s, ...rest } = rec as Record<string, unknown>; void _s; return hash(JSON.stringify(rest)) }
export function passportRecord(c: Cert, learner: { name: string; userId: string }, issued = new Date().toISOString().slice(0, 10)) {
  const rec = { kind: PASSPORT_KIND, schema: 1, app: APP_ID, appName: APP_NAME, certificate: c.distinction ? 'Plain-language patient writing, with distinction' : 'Plain-language patient writing', appUrl: APP_URL, name: learner.name.trim(), userId: learner.userId, issued, basis: c.basis, code: c.code, criteria: c.criteria, distinction: c.distinction, alg: 'cyrb53' as const, notice: NOTICE }
  return { ...rec, seal: sealOf(rec) }
}

const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!)
export function certificateHtml(c: Cert, learner: { name: string }, issued = new Date().toISOString().slice(0, 10)) {
  const rows = MISSIONS.map((m) => `<tr><td>${m.id}</td><td>${esc(m.title)}${m.core ? ' (core)' : ''}</td><td>${c.best[m.id] ? `${c.best[m.id]!.score} (${c.best[m.id]!.level})` : '—'}</td></tr>`).join('')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Certificate: plain-language patient writing</title><style>body{font-family:Georgia,serif;max-width:46rem;margin:3rem auto;padding:2rem;border:6px double #333;color:#111}h1{font-size:1.6rem}table{border-collapse:collapse;width:100%;font:0.85rem sans-serif}td{border-bottom:1px solid #ccc;padding:0.3rem}code{font-size:1.1rem}.n{font:0.8rem sans-serif;color:#555}</style></head><body>
<p class="n">Plain Language Lab · training certificate</p><h1>Plain-language patient writing${c.distinction ? ', with distinction' : ''}</h1>
<p>This certifies that <b>${esc(learner.name)}</b> wrote consent and assent forms, a package leaflet and a lay summary of results for readers without medical training: checked against the required elements of ICH E6(R3), 21 CFR 50.25, EU CTR Article 29 and India's NDCT Rules, measured with readability formulas, user-tested, and written with honest numbers.</p>
<table>${rows}<tr><td></td><td>Learn quizzes</td><td>${c.quizzes} of ${LESSONS.length} passed</td></tr><tr><td></td><td>Writing-skills sets</td><td>${c.skills} of ${SKILL_SETS.length} passed</td></tr></table>
<p>Issued ${issued}. Verification code: <code>${c.code}</code></p>
<p class="n">Check it on the Regulatory Skills Passport: ${PASSPORT_PAGE}. ${NOTICE} All studies, products and sponsors are fictional.</p>
<p class="n">Built by Khan Gulrez Shagufa Fazal Ahmed.</p></body></html>`
}
