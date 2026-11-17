// The hand-off for the pharmolecule hub's Ostrevia lifecycle journey. Two steps read it:
// "Write the VERDANT-1 consent form" (after the protocol) and "Write the lay summary of results"
// (after the analysis). The hub's journey page checks the numbers below; it does not re-run them.
import type { Project } from './types'
import { sectionsOf, textOf, docChecks, laySections } from './project'
import { analyze } from './analyze'
import { layChecks, layText } from '../shared/laysummary'
import { indiaRecording, GAP } from '../shared/consent'
import { numberChecks } from './risk'

export const HANDOFF_FORMAT = 'plain-language-lab-handoff'
const EXAMPLE_SOURCE = 'TLF Programming Lab worked example'

export function handoff(p: Project, now = new Date().toISOString()) {
  const secs = sectionsOf(p, 'consent'), checks = docChecks(p, 'consent')
  const target = p.targets.consent ?? 8, key = secs.find((s) => s.id === 'key')
  const lay = laySections(p), lc = layChecks(lay), lt = layText(lay)
  const rec = indiaRecording(p.india)
  return {
    format: HANDOFF_FORMAT, schema: 1, exportedUtc: now, app: 'plain-language-lab',
    study: { id: p.facts.protocolId, acronym: p.facts.acronym, project: p.name, origin: p.origin ?? (p.kind === 'mission' ? 'mission' : 'example'), mission: p.mission?.id ?? null },
    consent: {
      version: p.docs.consent.version, regions: p.regions,
      elements: { total: checks.length, missing: checks.filter((c) => !c.ok).map((c) => c.el.id) },
      grade: analyze(textOf(secs), target).grade, target,
      keyFirst: secs[0]?.id === 'key', keyGrade: key ? analyze(key.text, target).grade : null,
      keyWords: key ? key.text.split(/\s+/).filter(Boolean).length : 0,
      gaps: secs.filter((s) => s.text.includes(GAP)).map((s) => s.id),
      india: { recording: rec.need, countries: p.facts.countries ?? [] },
    },
    lay: {
      results: p.lay.results ? { study: p.lay.results.study, source: p.lay.source, fromExample: p.lay.source === EXAMPLE_SOURCE } : null,
      checks: { total: lc.length, failed: lc.filter((c) => !c.ok).map((c) => c.id) },
      grade: analyze(lt, p.targets['lay-summary'] ?? 8).grade, target: p.targets['lay-summary'] ?? 8,
      numbers: numberChecks(lt).map((n) => n.rule),
    },
  }
}
