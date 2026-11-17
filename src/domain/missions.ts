// Missions PL1 to PL5 (Phase 1). Each is a project with a fixed start; the grade is computed by
// rules from the project and the answers, with a line for each mark.
import { EXAMPLES, newProject, sectionsOf, textOf, docChecks } from './project'
import { PASSAGES, scoreRewrite } from './drills'
import { analyze } from './analyze'
import { checkElements, indiaRecording, type Recording } from '../shared/consent'
import { findJargon } from '../shared/jargon'
import type { Project } from './types'
import { sectionsWith, reviewLeaflet, PL6_EDITS, KEY_MESSAGES, leafletText } from './leaflet'
import { verdict, EU_QUESTIONS } from './usertest'
import { laySections } from './project'
import { layChecks, layText } from '../shared/laysummary'
import { numberChecks } from './risk'
import { PL10_SEGMENTS, pl10Translation } from './translation'
import { issueVersion, submit, approve, latestIssued } from './versions'
import { blankEConsent, econsentChecks } from './econsent'
import type { StudyFacts } from './types'

export interface MissionDef { id: string; title: string; brief: string; steps: string[]; pass: number; expert: number; core: boolean; kind: 'drills' | 'consent' | 'key' | 'assent' | 'india' | 'leaflet' | 'usertest' | 'lay' | 'numbers' | 'translation' | 'amendment' | 'econsent'; start: () => Project }
export interface Line { label: string; got: number; of: number }
const line = (label: string, ok: boolean | number, of: number): Line => ({ label, got: Math.round((typeof ok === 'number' ? Math.max(0, Math.min(1, ok)) : ok ? 1 : 0) * of), of })
const hrp = () => EXAMPLES['HRP-301']

// ---------- PL2: a consent form missing ten required elements ----------
export const PL2_BROKEN: Record<string, string> = {
  risks: 'Side effects seen so far with lumiravostat (Ostrevia) include upper respiratory tract infection and increased ALT. Blood draws can cause brief pain or bruising.',
  voluntary: 'You can leave the study if you want to.',
  newinfo: 'The study may change over time.',
  number: 'Many people will take part.',
  privacy: 'Your records are private.',
  results: 'The study is registered.',
  contacts: 'Ask the study team if you have any questions.',
}
export const PL3_START = 'This document pertains to a Phase 3, multicentre, randomised, double-blind, placebo-controlled study evaluating the efficacy and safety of lumiravostat administered orally once daily for 16 weeks in subjects with moderate to severe chronic hand eczema inadequately controlled with topical corticosteroids, with a 4-week safety follow-up period, during which participants will undergo assessments including venipuncture, physical examination and investigator global assessments at scheduled visits.'
export const PL4_START = {
  '7-11': { what: 'You are being invited to participate in a clinical investigation evaluating an investigational medicinal product for chronic hand eczema.', no: 'Participation is voluntary and contingent upon parental permission and your assent.' },
  '12-17': { what: 'You are being asked to participate in a research study evaluating the efficacy and safety of an investigational agent for the treatment of chronic hand eczema.', no: 'Your participation is contingent upon your own agreement in addition to the permission of your legally authorised representative.' },
}

// ---------- PL5: India's recording rule ----------
export const PL5_CASES: { id: string; text: string; nce: boolean; hivOrLeprosy: boolean; vulnerable: boolean }[] = [
  { id: 'A', text: 'VERDANT-1 site in Pune. Lumiravostat is a new chemical entity. The participant cannot read; an impartial witness will attend.', nce: true, hivOrLeprosy: false, vulnerable: true },
  { id: 'B', text: 'A phase 3 trial of a new anti-HIV molecule (fictional, VX-207). The participant lives in a shelter for homeless people and is economically disadvantaged.', nce: true, hivOrLeprosy: true, vulnerable: true },
  { id: 'C', text: 'A bioequivalence study of a generic metformin tablet, already approved in India, in healthy literate volunteers.', nce: false, hivOrLeprosy: false, vulnerable: false },
  { id: 'D', text: 'VERDANT-1 site in Mumbai. A literate adult office worker, able to decide for himself, with no vulnerability.', nce: true, hivOrLeprosy: false, vulnerable: false },
]
export const PL5_CHECKLIST: { id: string; text: string; right: boolean; why: string }[] = [
  { id: 'whole', text: 'Record the whole consent process: the explanation, the questions and the participant’s answers showing understanding.', right: true, why: 'The recording documents the information given and the participant’s understanding.' },
  { id: 'keep', text: 'Keep the recording in the investigator’s files with the trial records.', right: true, why: 'The rule asks for the recording to be retained by the investigator.' },
  { id: 'agree', text: 'Ask the participant’s agreement to being recorded before starting.', right: true, why: 'Good practice: recording is itself something the participant should agree to.' },
  { id: 'private', text: 'Keep the recording confidential; only those who may see trial records (monitors, auditors, ethics committee, regulators) may view it.', right: true, why: 'The recording identifies the participant and is protected like the medical records.' },
  { id: 'written', text: 'Still obtain the written (or thumb-impressed and witnessed) consent form.', right: true, why: 'The recording adds to written consent; it does not replace it.' },
  { id: 'delete', text: 'Delete the recording once the form is signed.', right: false, why: 'It must be kept, not deleted.' },
  { id: 'signature', text: 'Record only the moment of signing.', right: false, why: 'The whole process is recorded, not just the signature.' },
  { id: 'replace', text: 'Skip the written form when there is a recording.', right: false, why: 'Written consent is still required.' },
  { id: 'publish', text: 'Send the recording to the sponsor’s public website as proof of ethics.', right: false, why: 'That would breach confidentiality.' },
]

// ---------- PL9: numbers that mislead ----------
export const PL9_ITEMS: { id: string; source: string; keep: { label: string; re: RegExp }[]; hint: string }[] = [
  { id: 'N1', source: 'Lumiravostat halved the risk of a serious flare compared with placebo.', keep: [{ label: 'Placebo: 8 in 100', re: /\b8 in 100\b/ }, { label: 'Lumiravostat: 4 in 100', re: /\b4 in 100\b/ }], hint: 'In the trial, 8 in 100 people on placebo and 4 in 100 on lumiravostat had a serious flare.' },
  { id: 'N2', source: 'Shingles was common (0.6%).', keep: [{ label: 'About 6 in 1,000', re: /6 in 1,?000/ }, { label: 'The right EU frequency word', re: /\buncommon\b/i }], hint: '0.6% is about 6 in 1,000 people: “uncommon” in the EU convention.' },
  { id: 'N3', source: 'Success rates were 38% versus 12%, an improvement of 217%.', keep: [{ label: '38 in 100', re: /38 in 100/ }, { label: '12 in 100', re: /12 in 100/ }, { label: 'The difference: 26 more in 100', re: /26 (more )?(people )?in (every )?100|26 more/ }], hint: 'Give each group as “in 100” and the difference in the same units.' },
  { id: 'N4', source: 'The difference was statistically significant (p<0.001), proving that the medicine works.', keep: [{ label: 'Says it is unlikely to be due to chance', re: /unlikely to be (due to|by) chance|not likely to be chance/i }], hint: 'Say in words that the difference is unlikely to be due to chance; one trial does not prove.' },
  { id: 'N5', source: 'A cold affected about 12 in 100 people, and acne about 3 in 1,000.', keep: [{ label: 'Cold: 12 in 100', re: /12 in 100/ }, { label: 'Acne: 3 in 1,000 in the same units (0.3 in 100 or 3 in 1,000 with colds as 120 in 1,000)', re: /(0\.3 in 100|(less|fewer) than 1 in 100|120 in 1,?000)/ }], hint: 'Use one denominator: “about 12 in 100 … fewer than 1 in 100”.' },
]

export const MISSIONS: MissionDef[] = [
  { id: 'PL1', title: 'Rewrite five consent and leaflet passages', core: true, pass: 70, expert: 90, kind: 'drills', brief: 'The VERDANT-1 team drafted their patient text in protocol language. Rewrite five passages for a lay reader. Each is scored on reading level, jargon, sentence length, passive voice and whether every fact survives.', steps: ['Rewrite each passage below. Keep every fact: numbers, durations, risks and rights.', 'Check the score and the facts list after each one; revise until you are happy.', 'Submit when all five are done: the mission score is their average.'], start: () => newProject('PL1: rewrite drills', hrp(), 'mission') },
  { id: 'PL2', title: 'Fix a consent form missing ten required elements', core: true, pass: 70, expert: 95, kind: 'consent', brief: 'A site returned the VERDANT-1 consent form after local edits. Ten required elements are now missing across the US, EU and Indian checklists. Restore them in plain words, without adding claims.', steps: ['Open the consent form and read the checklist on the right.', 'Rewrite the sections the checklist flags; write the three sections left for you (alternatives, costs and payments, injury).', 'Keep the reading level at grade 9 or below, then submit.'], start: () => { const p = newProject('PL2: VERDANT-1 consent form to fix', hrp(), 'mission'); p.docs.consent.edits = { ...PL2_BROKEN }; return p } },
  { id: 'PL3', title: 'Write the key information section', core: true, pass: 70, expert: 95, kind: 'key', brief: 'The key information section opens the consent form and must help a person decide whether to join. The draft is one long sentence of protocol language. Rewrite it: research and voluntary, what taking part involves and for how long, the main risks, the chance of no benefit and the alternatives, and the placebo.', steps: ['Open the consent form; the key information is the first section.', 'Rewrite it in at most 250 words, at grade 8 or below.', 'Submit.'], start: () => { const p = newProject('PL3: VERDANT-1 key information', hrp(), 'mission'); p.docs.consent.edits = { key: PL3_START }; return p } },
  { id: 'PL4', title: 'Write assent for two age groups', core: false, pass: 70, expert: 90, kind: 'assent', brief: 'VERDANT-1 is adding an adolescent cohort, and the ethics committee also wants an oral script for younger siblings in a planned paediatric study. The drafts copy the adult form’s language. Rewrite the two assent documents for their ages.', steps: ['Open “Oral assent script, ages 7 to 11”: grade 4 or below, simple sentences, the child can say no.', 'Open “Written assent, ages 12 to 17”: grade 6 or below, say that they can refuse even if their parent agrees, and keep what will happen.', 'Leave out adult-only matters (insurance, regulators, compensation law), then submit.'], start: () => { const p = newProject('PL4: assent forms', hrp(), 'mission'); p.docs['assent-7-11'].edits = { what: PL4_START['7-11'].what, no: PL4_START['7-11'].no }; p.docs['assent-12-17'].edits = { what: PL4_START['12-17'].what, no: PL4_START['12-17'].no }; return p } },
  { id: 'PL5', title: 'India: decide when consent is recorded', core: false, pass: 70, expert: 100, kind: 'india', brief: 'Under the New Drugs and Clinical Trials Rules, 2019, the consent process of vulnerable participants in trials of a new chemical or molecular entity is recorded on audio and video, and for anti-HIV and anti-leprosy drugs on audio only. Decide for four participants, then choose what the site’s recording procedure must say.', steps: ['For each case, choose audio and video, audio only, or not required.', 'Tick each statement that belongs in the recording procedure.', 'Submit.'], start: () => newProject('PL5: India consent recording', hrp(), 'mission') },
  { id: 'PL6', title: 'Bring the Ostrevia leaflet to its reading level', core: true, pass: 70, expert: 90, kind: 'leaflet', brief: 'A regulatory writer “tightened” four sections of the Ostrevia package leaflet in SmPC language. The leaflet now reads at a specialist level and several safety messages are buried. Rewrite those sections to grade 8 or below without losing any key message.', steps: ['Open the Leaflet page and read the review: grade by section, key messages, numbers.', 'Rewrite the hard sections (warnings, pregnancy, how to take, side effects).', 'Keep every key message and the EU frequency words, then submit.'], start: () => { const p = newProject('PL6: Ostrevia leaflet', hrp(), 'mission'); p.leaflet!.edits = { ...PL6_EDITS }; return p } },
  { id: 'PL7', title: 'User-test the leaflet and pass', core: false, pass: 70, expert: 90, kind: 'usertest', brief: 'Before the leaflet is submitted, it must pass a readability test with people likely to use it. The questionnaire is half written and two sections are still hard to read. Complete the questions, run a pilot and a first round, revise, and pass two rounds of 10 on the final text.', steps: ['On the User test page, add questions until every key message has one (at least 12).', 'Run the pilot and round 1; read which answers people could not find or understand.', 'Revise those sections, then run two rounds of 10 on the final text.'], start: () => { const p = newProject('PL7: Ostrevia user test', hrp(), 'mission'); p.leaflet!.edits = { 'pl2.6': PL6_EDITS['pl2.6'], pl4: PL6_EDITS.pl4 }; p.leaflet!.questions = EU_QUESTIONS.slice(0, 7); return p } },
  { id: 'PL8', title: 'Write the VERDANT-1 lay summary from its results', core: true, pass: 70, expert: 90, kind: 'lay', brief: 'VERDANT-1 has finished. The lay summary’s results, side effects and comments are empty, and the TLF results tables are on the page. Write them for the public: natural frequencies, what the differences mean, honest uncertainty, no p-values and no promotion.', steps: ['Open the Lay summary page and read the results tables from the TLF Programming Lab.', 'Write sections 6 to 9 and fill the gaps in 2 and 3.', 'Keep it at grade 8 or below, then submit.'], start: () => { const p = newProject('PL8: VERDANT-1 lay summary', hrp(), 'mission'); p.lay.edits = { results: '[To be written: the results of the main question and the other questions, from the tables]', reactions: '[To be written: the side effects, from the tables]' }; return p } },
  { id: 'PL9', title: 'Fix the numbers in a misleading summary', core: false, pass: 70, expert: 100, kind: 'numbers', brief: 'A draft summary for patients uses numbers that mislead: a relative risk alone, a frequency word that does not match its number, a percentage of percentages, a p-value, and mixed denominators. Rewrite each sentence with absolute numbers in one denominator.', steps: ['Rewrite each sentence; the hint gives the absolute numbers.', 'The number checks must be clear and the facts present.', 'Submit.'], start: () => newProject('PL9: misleading numbers', hrp(), 'mission') },
  { id: 'PL10', title: 'Reconcile a Hindi back-translation', core: false, pass: 70, expert: 90, kind: 'translation', brief: 'The Pune site’s Hindi consent form came back from an independent back-translator. Nine segments are shown with the English source, the Hindi and the back-translation. Six carry a discrepancy that would mislead participants; three are faithful. Classify each and write the reconciliation note.', steps: ['Open the Translations page and the Hindi translation.', 'For each segment, compare the source with the back-translation (and the Hindi where you can read it), and choose the kind of discrepancy.', 'Write a reconciliation note for each discrepancy (what the translator must change), then submit. Wrong alarms on faithful segments lose marks.'], start: () => { const p = newProject('PL10: Hindi back-translation', hrp(), 'mission'); p.translations = [pl10Translation()]; return p } },
  { id: 'PL11', title: 'After the amendment: consent form, re-consent and ethics submissions', core: false, pass: 70, expert: 90, kind: 'amendment', brief: 'Protocol amendment 1 to VERDANT-1 adds a new risk from a long-term study: thinning of the hair in about 2 in 100 people. Consent version 1.0 is approved and in use at every site. Decide whether participants must re-consent, update the consent form, issue version 2.0, submit it to every ethics committee, record the approvals and switch the sites.', steps: ['On the Versions page, read the amendment panel and choose the decision.', 'In Consent and assent, add the new risk to the key information as well as to the risks.', 'Issue version 2.0 with a summary of the change, submit it to each committee, record each approval and move each site to it.'], start: () => pl11Start() },
  { id: 'PL12', title: 'Build the eConsent flow with a comprehension quiz', core: false, pass: 70, expert: 90, kind: 'econsent', brief: 'VERDANT-1 sites in Germany and the US will use electronic consent. Set up the flow: identity first, a quiz that checks the key messages, teach-back for wrong answers, then try it as a participant to the signature and the copy.', steps: ['On the eConsent page, switch on the identity step and teach-back.', 'Write at least five quiz questions covering the placebo chance, duration, the right to stop, the main risks and whom to contact.', 'Try it as a participant: answer, sign and send yourself the copy; then submit.'], start: () => { const p = newProject('PL12: eConsent', hrp(), 'mission'); p.econsent = blankEConsent(p.facts); return p } },
]
export function pl11Start(): Project {
  const prev: StudyFacts = hrp(), next: StudyFacts = structuredClone(prev)
  next.risks += ' A longer study found thinning of the hair in about 2 in 100 people who took lumiravostat; it got better after stopping.'
  const p = newProject('PL11: VERDANT-1 amendment 1', next, 'mission')
  // Version 1.0, before the amendment, approved and in use everywhere.
  const now = p.facts; p.facts = prev
  issueVersion(p, 'consent', 'First approved version.', '2026-02-02')
  p.facts = now
  for (const c of p.versions.committees) { submit(p, c.id, [{ type: 'consent', language: 'en', version: '1.0' }], 'Initial submission', '2026-02-03'); approve(p, { committee: c.id, type: 'consent', language: 'en', version: '1.0', date: '2026-02-20', decision: 'approved' }); for (const s of c.sites) p.versions.uses.push({ site: s, type: 'consent', language: 'en', version: '1.0', from: '2026-03-01' }) }
  p.amendment = { number: '2.0', reason: 'New safety information: hair thinning in a long-term study.', safetyRights: true, prevFacts: prev }
  return p
}
export const missionById = (id: string) => MISSIONS.find((m) => m.id === id)!

export function startMission(id: string): Project {
  const m = missionById(id), p = m.start()
  p.mission = { id, startedUtc: new Date().toISOString(), answers: {} }
  return p
}

export function grade(p: Project): { score: number; detail: Line[]; passed: boolean; expert: boolean } {
  const id = p.mission!.id, a = p.mission!.answers, m = missionById(id)
  let detail: Line[] = []
  if (id === 'PL1') {
    detail = PASSAGES.slice(0, 5).map((x) => { const t = a[`drill:${x.id}`] ?? ''; const s = t ? scoreRewrite(x, t).score : 0; return { label: `${x.id} ${x.title}: ${s}`, got: Math.round(s / 5), of: 20 } })
  }
  if (id === 'PL2') {
    const secs = sectionsOf(p, 'consent'), regs = ['GCP', 'US', 'EU', 'IN'] as const
    const all = checkElements(secs, [...regs]), ok = all.filter((c) => c.ok).length
    const g = analyze(textOf(secs)).grade
    const claims = /(?<!\b(?:if|whether)\b.{0,25})\b(?:is|are)\s+(?:completely |totally |very )?safe\b|\bno risks?\b|\bguarantee/i.test(textOf(secs))
    detail = [line(`Required elements present (${ok} of ${all.length}, ICH E6(R3), US, EU and India)`, ok / all.length, 70), line(`Reading level grade 9 or below (now ${g})`, g <= 9, 15), line('No safety claims or guarantees added', !claims, 15)]
  }
  if (id === 'PL3') {
    const key = sectionsOf(p, 'consent').find((s) => s.id === 'key')!.text, an = analyze(key)
    const k = checkElements(sectionsOf(p, 'consent'), ['KEY'])
    detail = [line(`Key information elements (${k.filter((c) => c.ok).length} of ${k.length})`, k.filter((c) => c.ok).length / k.length, 40), line(`Grade 8 or below (now ${an.grade})`, an.grade <= 8, 20), line(`At most 250 words (now ${an.words})`, an.words <= 250 && an.words >= 60, 15), line(`At most two unexplained jargon words (now ${findJargon(key).length})`, findJargon(key).length <= 2, 15), line('Says what placebo is', /placebo[^.]*(no medicine|dummy|nothing in it)/i.test(key), 10)]
  }
  if (id === 'PL4') {
    const y = textOf(sectionsOf(p, 'assent-7-11')), t = textOf(sectionsOf(p, 'assent-12-17'))
    const gy = analyze(y).grade, gt = analyze(t).grade, adult = /insurance|compensat|regulat|legally authori|contingent|investigational|participat/i
    detail = [line(`Ages 7 to 11 at grade 4 or below (now ${gy})`, gy <= 4, 20), line('Ages 7 to 11: the child can say no', /say no|don.t have to|do not have to/i.test(y), 10), line('Ages 7 to 11: no adult-only words', !adult.test(y), 10),
      line(`Ages 12 to 17 at grade 6 or below (now ${gt})`, gt <= 6, 20), line('Ages 12 to 17: can refuse even if the parent agrees', /even if|your parent says yes|your choice/i.test(t), 10), line('Ages 12 to 17: what will happen (visits, medicine, blood)', /visit/i.test(t) && /blood/i.test(t), 10), line('Ages 12 to 17: no adult-only words', !adult.test(t), 10), line('Ages 12 to 17: a place to sign', /your name|signature/i.test(t), 10)]
  }
  if (id === 'PL5') {
    const picks = PL5_CHECKLIST.filter((x) => a[`chk:${x.id}`] === 'yes'), good = picks.filter((x) => x.right).length, bad = picks.length - good, total = PL5_CHECKLIST.filter((x) => x.right).length
    detail = [...PL5_CASES.map((c) => { const need = indiaRecording({ newChemicalEntity: c.nce, hivOrLeprosy: c.hivOrLeprosy, vulnerable: c.vulnerable }).need; return line(`Case ${c.id}: ${need}`, a[`rec:${c.id}`] === need, 15) }), line(`Recording procedure: ${good} of ${total} right statements, ${bad} wrong`, Math.max(0, good - bad) / total, 40)]
  }
  if (id === 'PL6') {
    const f = p.leaflet!.file, secs = sectionsWith(f, p.leaflet!.edits), r = reviewLeaflet(f, secs)
    const kept = r.messages.filter((m) => m.ok).length
    const hard = r.perSection.filter((x) => x.num in PL6_EDITS && x.grade > 9)
    detail = [line(`Key messages kept (${kept} of ${r.messages.length})`, kept / r.messages.length, 40), line(`Whole leaflet at grade 8 or below (now ${r.grade})`, r.grade <= 8, 25), line(`No rewritten section above grade 9 (${hard.map((x) => x.num).join(', ') || 'none'})`, hard.length === 0, 15), line('EU frequency words match their numbers', !r.numbers.some((n) => n.rule === 'PL-N04'), 10), line(`At most 6 unexplained jargon words (now ${r.jargon})`, r.jargon <= 6, 10)]
  }
  if (id === 'PL7') {
    const L = p.leaflet!, secs = sectionsWith(L.file, L.edits), msgs = KEY_MESSAGES[L.file.region], text = leafletText(secs)
    const covered = msgs.filter((m) => L.questions.some((q) => q.message === m.id || new RegExp(q.answer, 'i').test(text.match(m.re)?.[0] ?? '\u0000'))).length
    const v = verdict(L.rounds, L.questions, secs), full = L.rounds.filter((r) => !r.pilot)
    const revised = new Set(full.map((r) => r.textHash)).size > 1
    const present = L.questions.filter((q) => { const sct = secs.find((x) => x.num === q.section); return !!sct && new RegExp(q.answer, 'i').test(sct.text) }).length
    detail = [line(`Key messages with a question (${covered} of ${msgs.length})`, covered / msgs.length, 25), line(`At least 12 questions (${L.questions.length})`, L.questions.length >= 12, 10), line(`Each answer is in the section the question points to (${present} of ${L.questions.length})`, L.questions.length ? present / L.questions.length : 0, 10), line('A pilot was run', L.rounds.some((r) => r.pilot), 5), line('The text was revised after a round', revised, 10), line(`Final two rounds on the same text pass the 90% and 90% criterion (${v.why})`, v.pass, 40)]
  }
  if (id === 'PL8') {
    const secs = laySections(p), checks = layChecks(secs), txt = layText(secs), g = analyze(txt).grade
    const R = p.lay.results, prim = R?.primary
    const nums = prim ? prim.values.filter((v) => new RegExp(`\\b(${[-1, 0, 1].map((d) => Math.round(v.pct ?? 0) + d).join('|')}) in 100\\b`).test(secs.find((x) => x.id === 'results')!.text)).length : 0
    const issues = numberChecks(txt).filter((n) => ['PL-N01', 'PL-N02', 'PL-N05'].includes(n.rule))
    detail = [line(`Annex V elements written (${checks.filter((c) => c.ok).length} of ${checks.length})`, checks.filter((c) => c.ok).length / checks.length, 40), line(`Main result for each group as “in 100” (${nums} of ${prim?.values.length ?? 0})`, prim ? nums / prim.values.length : 0, 20), line(`No misleading number habits (${issues.length})`, issues.length === 0, 15), line(`Grade 8 or below (now ${g})`, g <= 8, 15), line('Says how certain the result is (chance)', /chance/i.test(secs.find((x) => x.id === 'results')!.text), 10)]
  }
  if (id === 'PL9') {
    detail = PL9_ITEMS.map((it) => { const t = a[`num:${it.id}`] ?? ''; const ok = it.keep.filter((k) => k.re.test(t)).length / it.keep.length; const clean = t.trim() && !numberChecks(t).length && !/\bprov(es|ed|ing)\b/i.test(t); return line(`${it.id}: facts ${Math.round(ok * it.keep.length)} of ${it.keep.length}, ${clean ? 'number checks clear' : 'number checks not clear'}`, t.trim() ? ok * 0.6 + (clean ? 0.4 : 0) : 0, 20) })
  }
  if (id === 'PL10') {
    const t = p.translations[0], bad = PL10_SEGMENTS.filter((x) => x.answer !== 'none'), good = PL10_SEGMENTS.filter((x) => x.answer === 'none')
    const seg = (sid: string) => t?.segments.find((x) => x.id === sid)
    detail = [...bad.map((x) => line(`${x.id} ${x.heading}: ${x.answer}`, seg(x.id)?.discrepancy === x.answer ? 1 : seg(x.id)?.discrepancy && seg(x.id)?.discrepancy !== 'none' ? 0.4 : 0, 12)),
      line(`Faithful segments left as “no discrepancy” (${good.filter((x) => seg(x.id)?.discrepancy === 'none').length} of ${good.length})`, good.filter((x) => seg(x.id)?.discrepancy === 'none').length / good.length, 18),
      line('A reconciliation note for every discrepancy found', bad.every((x) => !seg(x.id)?.discrepancy || seg(x.id)?.discrepancy === 'none' || (seg(x.id)?.note.trim().length ?? 0) >= 10) && bad.some((x) => seg(x.id)?.discrepancy && seg(x.id)?.discrepancy !== 'none'), 10)]
  }
  if (id === 'PL11') {
    const V = p.versions, v2 = V.history.consent.find((h) => Number(h.version) >= 2)
    const key = sectionsOf(p, 'consent').find((x) => x.id === 'key')!.text
    const subs = V.committees.filter((c) => V.submissions.some((s) => s.committee === c.id && s.docs.some((d) => d.type === 'consent' && Number(d.version) >= 2)))
    const apps = V.committees.filter((c) => V.approvals.some((a) => a.committee === c.id && a.type === 'consent' && Number(a.version) >= 2 && a.decision !== 'not approved'))
    const sites = V.committees.flatMap((c) => c.sites), moved = sites.filter((st) => V.uses.some((u) => u.site === st && Number(u.version) >= 2))
    detail = [line('Decision: participants re-consent (new safety information)', p.amendment?.decision === 'Re-consent', 20), line('The key information names the new risk (hair thinning)', /hair/i.test(key), 20), line('Version 2.0 issued with a summary of the change', !!v2 && /hair|amend|risk/i.test(v2.summary), 20),
      line(`Submitted to every committee (${subs.length} of ${V.committees.length})`, subs.length / V.committees.length, 15), line(`Approved by every committee (${apps.length} of ${V.committees.length})`, apps.length / V.committees.length, 15), line(`Every site moved to version 2.0 (${moved.length} of ${sites.length})`, moved.length / sites.length, 10)]
    void latestIssued
  }
  if (id === 'PL12') {
    const c = econsentChecks(p.econsent ?? blankEConsent(p.facts)), w: Record<string, number> = { identity: 10, quiz5: 10, teachback: 10, session: 20, copy: 10 }
    detail = c.map((x) => line(x.label, x.ok, w[x.id] ?? 8))
  }
  const score = Math.max(0, Math.min(100, Math.round(detail.reduce((n, l) => n + l.got, 0))))
  return { score, detail, passed: score >= m.pass, expert: score >= m.expert }
}
export type { Recording }
export { docChecks }
