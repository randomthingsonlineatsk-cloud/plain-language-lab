// Projects: one study's patient documents. A project starts from a worked example (the Protocol
// Builder's HRP-301 and GLV-12-301, written into studies.json by its tests), or from a Protocol
// Builder project file. Export and import as one JSON file.
import STUDIES from './studies.json'
import { consentSections, representativeSections, assentSections, studyFacts, regionsOf, checkElements, type ProtocolProjectLike, type Region } from '../shared/consent'
import type { DocSection, DocState, DocType, Project, StudyFacts } from './types'
import { TARGETS } from './analyze'
import RESULTS from './results.json'
import { readReportingEvent, laySummarySections } from '../shared/laysummary'
import { LEAFLET_EXAMPLES } from './leaflet'
import { EU_QUESTIONS } from './usertest'
import { blankVersions } from './versions'

export const APP_URL = 'https://randomthingsonlineatsk-cloud.github.io/plain-language-lab/'
export const FORMAT = 'plain-language-lab-project'
export const EXAMPLES = STUDIES as unknown as Record<string, StudyFacts>
const now = () => new Date().toISOString()
const rid = () => Math.random().toString(36).slice(2, 10)

export function learner(): { userId: string; classId: string } {
  try {
    let u = localStorage.getItem('pl-user'); if (!u) { u = `U-${rid()}`; localStorage.setItem('pl-user', u) }
    return { userId: u, classId: localStorage.getItem('pl-class') ?? '' }
  } catch { return { userId: 'U-local', classId: '' } }
}
const blankDoc = (): DocState => ({ edits: {}, reviewed: [], version: '1.0', versionDate: now().slice(0, 10) })

export function newProject(name: string, facts: StudyFacts, kind: Project['kind'] = 'study'): Project {
  const l = learner(), t = now()
  return { id: `PL-${rid()}`, name, kind, userId: l.userId, classId: l.classId, createdUtc: t, updatedUtc: t, studyId: facts.id, facts: structuredClone(facts),
    docs: { consent: blankDoc(), representative: blankDoc(), 'assent-7-11': blankDoc(), 'assent-12-17': blankDoc() },
    regions: regionsOf(facts), targets: { ...TARGETS }, india: { newChemicalEntity: facts.newChemicalEntity, hivOrLeprosy: facts.hivOrLeprosy, vulnerable: false },
    versions: blankVersions(facts.countries), translations: [],
    leaflet: defaultLeaflet(facts), lay: { edits: {}, results: exampleResults(facts.id), source: (RESULTS as Record<string, unknown>)[facts.id] ? 'TLF Programming Lab worked example' : '' }, schema: 1 }
}
/** Ostrevia's EU leaflet goes with VERDANT-1 (the same product); other studies start without one. */
export function defaultLeaflet(f: StudyFacts): Project['leaflet'] {
  if (!/lumiravostat|ostrevia/i.test(f.product)) return null
  return { key: 'ostrevia-pl-eu', file: structuredClone(LEAFLET_EXAMPLES['ostrevia-pl-eu']), edits: {}, questions: structuredClone(EU_QUESTIONS), rounds: [] }
}
export function exampleResults(id: string) { const re = (RESULTS as Record<string, unknown>)[id]; return re ? readReportingEvent(re as Parameters<typeof readReportingEvent>[0]) : null }
export const laySections = (p: Project) => laySummarySections(p.facts, p.lay.results ?? undefined, p.lay.edits)
export const exampleProject = (id: string) => newProject(`${EXAMPLES[id].acronym || id} (${id}): patient documents`, EXAMPLES[id])

/** The sections of one document: generated from the study, then the writer's edits. */
export function sectionsOf(p: Project, type: DocType): DocSection[] {
  const e = p.docs[type].edits, f = p.facts
  return type === 'consent' ? consentSections(f, e) : type === 'representative' ? representativeSections(f, e) : assentSections(f, type === 'assent-7-11' ? '7-11' : '12-17', e)
}
export const textOf = (secs: DocSection[]) => secs.map((s) => `${s.heading}\n${s.text}`).join('\n\n')
export const docChecks = (p: Project, type: DocType = 'consent', regions: Region[] = p.regions) => checkElements(sectionsOf(p, type), regions)

// ---------- files ----------
export function projectFile(p: Project) { return JSON.stringify({ format: FORMAT, schema: 1, exportedUtc: now(), project: p }, null, 2) }
/** Reads a Plain Language Lab project file, or a Protocol Builder project file (its latest version). */
export function readFile(text: string): Project {
  let j: { format?: string; project?: unknown }
  try { j = JSON.parse(text) } catch { throw new Error('This is not a JSON file.') }
  if (j.format === FORMAT && j.project) return upgrade(j.project as Project)
  if (j.format === 'protocol-builder-project' && j.project) {
    const pb = j.project as ProtocolProjectLike & { name?: string }
    if (!pb.versions?.length) throw new Error('The Protocol Builder file has no protocol version.')
    const f = studyFacts(pb), p = newProject(`${f.acronym || f.protocolId || 'Study'}: patient documents (from the Protocol Builder)`, f)
    // An amended protocol: keep the previous version's facts, so the consent changes can be compared.
    const last = pb.versions[pb.versions.length - 1] as { number?: string; amendment?: { safetyRights?: string; reasons?: string[]; summary?: string } }
    if (pb.versions.length > 1) p.amendment = { number: last.number ?? String(pb.versions.length), reason: last.amendment?.summary ?? (last.amendment?.reasons ?? []).join(', '), safetyRights: last.amendment?.safetyRights === 'Yes', prevFacts: studyFacts(pb, pb.versions.length - 2) }
    return p
  }
  throw new Error('This is neither a Plain Language Lab project file nor a Protocol Builder project file.')
}
export function upgrade(p: Project): Project {
  const l = learner()
  for (const k of ['consent', 'representative', 'assent-7-11', 'assent-12-17'] as DocType[]) p.docs[k] ??= blankDoc()
  p.userId ||= l.userId; p.classId ??= l.classId; p.targets = { ...TARGETS, ...p.targets }
  if (p.leaflet === undefined) p.leaflet = defaultLeaflet(p.facts)
  p.lay ??= { edits: {}, results: exampleResults(p.facts.id), source: '' }
  p.versions ??= blankVersions(p.facts.countries); p.translations ??= []
  return p
}
