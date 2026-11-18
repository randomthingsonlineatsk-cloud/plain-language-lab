// Document versions and ethics committee (EC/IRB) submissions: each issued version keeps a copy of
// its text; a submission sends versions to a committee; approvals are recorded per committee; sites
// record which version they use from which date. Flags: a version in use before its approval, a
// site on an outdated version, a translation older than its source. The approved versions export
// to the CDM Console, whose consent edit checks compare each participant's form version.
import type { DocSection, DocType, Project } from './types'
import { sectionsOf } from './project'

export interface VersionRec { version: string; date: string; summary: string; sections: DocSection[] }
export interface Committee { id: string; name: string; region: string; sites: string[]; country?: string }
export interface Submission { id: string; committee: string; date: string; docs: { type: DocType; language: string; version: string }[]; note: string }
export interface Approval { committee: string; type: DocType; language: string; version: string; date: string; decision: 'approved' | 'approved with conditions' | 'not approved' }
export interface SiteUse { site: string; type: DocType; language: string; version: string; from: string }
export interface Versions { history: Record<DocType, VersionRec[]>; committees: Committee[]; submissions: Submission[]; approvals: Approval[]; uses: SiteUse[] }

export function defaultCommittees(countries: string[]): Committee[] {
  const c: Committee[] = []
  for (const k of countries.map((x) => x.replace(/^the /i, ''))) {
    if (/United States/.test(k)) c.push({ id: 'US-IRB', name: 'Central IRB (US sites)', region: 'US', country: 'United States', sites: ['Site 101 Boston', 'Site 102 Denver'] })
    else if (/Germany/.test(k)) c.push({ id: 'DE-EC', name: 'Ethics committee, Germany (CTR Part II)', region: 'EU', country: 'Germany', sites: ['Site 201 Hamburg'] })
    else if (/India/.test(k)) c.push({ id: 'IN-IEC-PUNE', name: 'Institutional Ethics Committee, Pune site', region: 'IN', country: 'India', sites: ['Site 301 Pune'] }, { id: 'IN-IEC-MUM', name: 'Institutional Ethics Committee, Mumbai site', region: 'IN', country: 'India', sites: ['Site 302 Mumbai'] })
    else if (/Canada/.test(k)) c.push({ id: 'CA-REB', name: 'Research Ethics Board, Canada', region: 'CA', country: 'Canada', sites: ['Site 401 Toronto'] })
    else c.push({ id: `${k.slice(0, 2).toUpperCase()}-EC`, name: `Ethics committee, ${k}`, region: k, country: k, sites: [`Site in ${k}`] })
  }
  return c
}
export const blankVersions = (countries: string[]): Versions => ({ history: { consent: [], representative: [], 'assent-7-11': [], 'assent-12-17': [] }, committees: defaultCommittees(countries), submissions: [], approvals: [], uses: [] })

const bump = (v: string) => `${Math.floor(Number(v) || 0) + 1}.0`
/** Freezes the current text as an issued version; the draft then carries the next number. */
export function issueVersion(p: Project, type: DocType, summary: string, date = new Date().toISOString().slice(0, 10)) {
  if (!summary.trim()) throw new Error('Describe what changed in this version.')
  const d = p.docs[type]
  p.versions.history[type].push({ version: d.version, date, summary: summary.trim(), sections: structuredClone(sectionsOf(p, type)) })
  d.version = bump(d.version); d.versionDate = date
}
export const latestIssued = (p: Project, type: DocType) => p.versions.history[type].at(-1)
export const latestApproved = (p: Project, committee: string, type: DocType, language = 'en') =>
  p.versions.approvals.filter((a) => a.committee === committee && a.type === type && a.language === language && a.decision !== 'not approved').sort((a, b) => Number(b.version) - Number(a.version))[0]

export function submit(p: Project, committee: string, docs: Submission['docs'], note = '', date = new Date().toISOString().slice(0, 10)) {
  for (const x of docs) if (x.language === 'en' && !p.versions.history[x.type].some((h) => h.version === x.version)) throw new Error(`Version ${x.version} of this document has not been issued yet: issue it first.`)
  p.versions.submissions.push({ id: `S-${p.versions.submissions.length + 1}`, committee, date, docs, note })
}
export function approve(p: Project, a: Approval) {
  if (!p.versions.submissions.some((s) => s.committee === a.committee && s.docs.some((d) => d.type === a.type && d.version === a.version && d.language === a.language))) throw new Error('This version was not submitted to that committee.')
  p.versions.approvals.push(a)
}

export interface VersionFlag { id: string; text: string; fix: string }
export function versionFlags(p: Project): VersionFlag[] {
  const out: VersionFlag[] = [], V = p.versions
  for (const u of V.uses) {
    const c = V.committees.find((x) => x.sites.includes(u.site))
    if (!c) continue
    const ok = V.approvals.find((a) => a.committee === c.id && a.type === u.type && a.language === u.language && a.version === u.version && a.decision !== 'not approved')
    if (!ok) out.push({ id: `use-unapproved:${u.site}:${u.version}`, text: `${u.site} uses ${u.type} version ${u.version} (${u.language}) without ${c.name}’s approval.`, fix: 'Stop using it until the committee approves it.' })
    else if (u.from < ok.date) out.push({ id: `use-early:${u.site}:${u.version}`, text: `${u.site} started using version ${u.version} on ${u.from}, before its approval on ${ok.date}.`, fix: 'Record a protocol deviation; participants consented on it may need to sign the approved form.' })
    const latest = latestApproved(p, c.id, u.type, u.language)
    const current = V.uses.filter((x) => x.site === u.site && x.type === u.type && x.language === u.language).sort((a, b) => b.from.localeCompare(a.from))[0]
    if (latest && current === u && Number(u.version) < Number(latest.version)) out.push({ id: `use-old:${u.site}`, text: `${u.site} still uses version ${u.version}; version ${latest.version} is approved.`, fix: 'Switch the site to the approved version and re-consent as the amendment requires.' })
  }
  for (const t of p.translations) {
    const src = latestIssued(p, t.docType)
    if (src && Number(t.sourceVersion) < Number(src.version)) out.push({ id: `tr-old:${t.id}`, text: `The ${t.langName} translation was made from version ${t.sourceVersion}; version ${src.version} is now issued.`, fix: 'Update the translation from the new version and back-translate the changed sections.' })
  }
  return out
}

/** The approved consent versions in the form the CDM Console's consent edit checks expect. */
const COUNTRY: Record<string, string> = { 'US-IRB': 'United States', 'DE-EC': 'Germany', 'IN-IEC-PUNE': 'India', 'IN-IEC-MUM': 'India', 'CA-REB': 'Canada' }
export const countryOf = (c: Committee) => c.country ?? COUNTRY[c.id] ?? c.region
export function cdmConsentFile(p: Project) {
  const V = p.versions, com = (id: string) => V.committees.find((c) => c.id === id)
  return { format: 'plain-language-lab/consent-versions', schema: 1, exportedUtc: new Date().toISOString(), study: p.facts.protocolId,
    committees: V.committees.map((c) => ({ id: c.id, name: c.name, country: countryOf(c), sites: c.sites })),
    versions: V.approvals.filter((a) => a.decision !== 'not approved').map((a) => ({ document: a.type, language: a.language, version: `v${a.version}`, committeeId: a.committee, committee: com(a.committee)?.name ?? a.committee, country: com(a.committee) ? countryOf(com(a.committee)!) : '', sites: com(a.committee)?.sites ?? [], approved: a.date })),
    inUse: V.uses.map((u) => ({ site: u.site, document: u.type, language: u.language, version: `v${u.version}`, from: u.from })) }
}
