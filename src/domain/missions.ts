// Missions PL1 to PL5 (Phase 1). Each is a project with a fixed start; the grade is computed by
// rules from the project and the answers, with a line for each mark.
import { EXAMPLES, newProject, sectionsOf, textOf, docChecks } from './project'
import { PASSAGES, scoreRewrite } from './drills'
import { analyze } from './analyze'
import { checkElements, indiaRecording, type Recording } from '../shared/consent'
import { findJargon } from '../shared/jargon'
import type { Project } from './types'

export interface MissionDef { id: string; title: string; brief: string; steps: string[]; pass: number; expert: number; core: boolean; kind: 'drills' | 'consent' | 'key' | 'assent' | 'india'; start: () => Project }
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

export const MISSIONS: MissionDef[] = [
  { id: 'PL1', title: 'Rewrite five consent and leaflet passages', core: true, pass: 70, expert: 90, kind: 'drills', brief: 'The VERDANT-1 team drafted their patient text in protocol language. Rewrite five passages for a lay reader. Each is scored on reading level, jargon, sentence length, passive voice and whether every fact survives.', steps: ['Rewrite each passage below. Keep every fact: numbers, durations, risks and rights.', 'Check the score and the facts list after each one; revise until you are happy.', 'Submit when all five are done: the mission score is their average.'], start: () => newProject('PL1: rewrite drills', hrp(), 'mission') },
  { id: 'PL2', title: 'Fix a consent form missing ten required elements', core: true, pass: 70, expert: 95, kind: 'consent', brief: 'A site returned the VERDANT-1 consent form after local edits. Ten required elements are now missing across the US, EU and Indian checklists. Restore them in plain words, without adding claims.', steps: ['Open the consent form and read the checklist on the right.', 'Rewrite the sections the checklist flags; write the three sections left for you (alternatives, costs and payments, injury).', 'Keep the reading level at grade 9 or below, then submit.'], start: () => { const p = newProject('PL2: VERDANT-1 consent form to fix', hrp(), 'mission'); p.docs.consent.edits = { ...PL2_BROKEN }; return p } },
  { id: 'PL3', title: 'Write the key information section', core: true, pass: 70, expert: 95, kind: 'key', brief: 'The key information section opens the consent form and must help a person decide whether to join. The draft is one long sentence of protocol language. Rewrite it: research and voluntary, what taking part involves and for how long, the main risks, the chance of no benefit and the alternatives, and the placebo.', steps: ['Open the consent form; the key information is the first section.', 'Rewrite it in at most 250 words, at grade 8 or below.', 'Submit.'], start: () => { const p = newProject('PL3: VERDANT-1 key information', hrp(), 'mission'); p.docs.consent.edits = { key: PL3_START }; return p } },
  { id: 'PL4', title: 'Write assent for two age groups', core: false, pass: 70, expert: 90, kind: 'assent', brief: 'VERDANT-1 is adding an adolescent cohort, and the ethics committee also wants an oral script for younger siblings in a planned paediatric study. The drafts copy the adult form’s language. Rewrite the two assent documents for their ages.', steps: ['Open “Oral assent script, ages 7 to 11”: grade 4 or below, simple sentences, the child can say no.', 'Open “Written assent, ages 12 to 17”: grade 6 or below, say that they can refuse even if their parent agrees, and keep what will happen.', 'Leave out adult-only matters (insurance, regulators, compensation law), then submit.'], start: () => { const p = newProject('PL4: assent forms', hrp(), 'mission'); p.docs['assent-7-11'].edits = { what: PL4_START['7-11'].what, no: PL4_START['7-11'].no }; p.docs['assent-12-17'].edits = { what: PL4_START['12-17'].what, no: PL4_START['12-17'].no }; return p } },
  { id: 'PL5', title: 'India: decide when consent is recorded', core: false, pass: 70, expert: 100, kind: 'india', brief: 'Under the New Drugs and Clinical Trials Rules, 2019, the consent process of vulnerable participants in trials of a new chemical or molecular entity is recorded on audio and video, and for anti-HIV and anti-leprosy drugs on audio only. Decide for four participants, then choose what the site’s recording procedure must say.', steps: ['For each case, choose audio and video, audio only, or not required.', 'Tick each statement that belongs in the recording procedure.', 'Submit.'], start: () => newProject('PL5: India consent recording', hrp(), 'mission') },
]
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
  const score = Math.max(0, Math.min(100, Math.round(detail.reduce((n, l) => n + l.got, 0))))
  return { score, detail, passed: score >= m.pass, expert: score >= m.expert }
}
export type { Recording }
export { docChecks }
