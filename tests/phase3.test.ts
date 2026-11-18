import { describe, expect, test } from 'vitest'
import { existsSync, writeFileSync } from 'node:fs'
import { exampleProject, readFile, sectionsOf } from '../src/domain/project'
import { startMission, grade } from '../src/domain/missions'
import { asciiDigits, numbersIn, newTranslation, translationChecks, PL10_SEGMENTS, staleTranslation } from '../src/domain/translation'
import { issueVersion, submit, approve, versionFlags, cdmConsentFile } from '../src/domain/versions'
import { econsentChecks, blankEConsent } from '../src/domain/econsent'
import { reconsentDecision, consentSections, wordDiff } from '../src/shared/consent'

describe('translation', () => {
  test('native digits are read, numbers compared, English left in is caught', () => {
    expect(asciiDigits('६ सप्ताह, ১৬, ௨௫')).toBe('6 सप्ताह, 16, 25')
    expect(numbersIn('16 weeks, 25 mg')).toEqual(['16', '25'])
    const p = exampleProject('HRP-301'), t = newTranslation(p, 'consent', 'hi')
    expect(t.segments.length).toBe(sectionsOf(p, 'consent').length)
    t.segments[0].forward = 'यह randomisation अध्ययन है, ६ सप्ताह'
    const ids = translationChecks(t, ['lumiravostat']).filter((i) => i.seg === t.segments[0].id).map((i) => i.rule)
    expect(ids).toEqual(expect.arrayContaining(['PL-T01', 'PL-T03']))
    expect(translationChecks(t).some((i) => i.rule === 'PL-T02')).toBe(true)
  })
  test('PL10: the right classifications and notes score 100; flagging everything does not pass', () => {
    const p = startMission('PL10')
    for (const s of p.translations[0].segments) { const a = PL10_SEGMENTS.find((x) => x.id === s.id)!; s.discrepancy = a.answer; s.note = a.answer === 'none' ? '' : 'Ask the translator to correct this.' }
    expect(grade(p).score).toBe(100)
    for (const s of p.translations[0].segments) { s.discrepancy = 'meaning'; s.note = 'Check this segment again.' }
    expect(grade(p).passed).toBe(false)
  })
})

describe('versions and committees', () => {
  test('issue, submit, approve, use; flags for early use, old versions and stale translations; CDM file', () => {
    const p = exampleProject('HRP-301')
    expect(p.versions.committees.map((c) => c.id)).toEqual(['CA-REB', 'DE-EC', 'IN-IEC-PUNE', 'IN-IEC-MUM', 'US-IRB'])
    expect(() => issueVersion(p, 'consent', '')).toThrow()
    issueVersion(p, 'consent', 'First version', '2026-01-10'); expect(p.docs.consent.version).toBe('2.0')
    expect(() => submit(p, 'IN-IEC-PUNE', [{ type: 'consent', language: 'en', version: '2.0' }])).toThrow(/not been issued/)
    submit(p, 'IN-IEC-PUNE', [{ type: 'consent', language: 'en', version: '1.0' }], '', '2026-01-11')
    expect(() => approve(p, { committee: 'US-IRB', type: 'consent', language: 'en', version: '1.0', date: '2026-01-20', decision: 'approved' })).toThrow()
    approve(p, { committee: 'IN-IEC-PUNE', type: 'consent', language: 'en', version: '1.0', date: '2026-01-20', decision: 'approved' })
    p.versions.uses.push({ site: 'Site 301 Pune', type: 'consent', language: 'en', version: '1.0', from: '2026-01-15' })
    expect(versionFlags(p).map((f) => f.id)).toContain('use-early:Site 301 Pune:1.0')
    const t = newTranslation(p, 'consent', 'mr'); p.translations.push(t)
    issueVersion(p, 'consent', 'Amendment 1', '2026-05-01')
    expect(staleTranslation(p, t)).toBe(true); expect(versionFlags(p).some((f) => f.id.startsWith('tr-old'))).toBe(true)
    const f = cdmConsentFile(p); expect(f.versions[0]).toMatchObject({ version: 'v1.0', approved: '2026-01-20' }); expect(f.format).toBe('plain-language-lab/consent-versions')
  })
  test('worked example for the CDM Console: HRP-301 consent v3.0 approved by the US IRB', () => {
    const p = exampleProject('HRP-301')
    issueVersion(p, 'consent', 'First version', '2025-09-01'); issueVersion(p, 'consent', 'Before first site opened', '2025-11-03'); issueVersion(p, 'consent', 'Amendment 1: hair thinning added to the risks', '2026-06-15')
    for (const [c, v, d] of [['IN-IEC-PUNE', '2.0', '2025-11-20'], ['US-IRB', '2.0', '2025-11-24'], ['US-IRB', '3.0', '2026-07-08']] as const) {
      submit(p, c, [{ type: 'consent', language: 'en', version: v }], '', d); approve(p, { committee: c, type: 'consent', language: 'en', version: v, date: d, decision: 'approved' })
    }
    p.versions.uses.push({ site: 'Site 101 Boston', type: 'consent', language: 'en', version: '3.0', from: '2026-07-15' })
    const f = cdmConsentFile(p); f.exportedUtc = '2026-07-20T09:00:00.000Z'
    expect(f.study).toBe('HRP-301'); expect(f.versions.map((v) => v.version)).toEqual(['v2.0', 'v2.0', 'v3.0'])
    const dir = '../cdm-query-console/tests/fixtures'
    if (existsSync(dir)) writeFileSync(`${dir}/HRP-301.consent-versions.json`, JSON.stringify(f, null, 2) + '\n')
  })
  test('the CDM Console mission M21: site approvals on different dates', () => {
    const p = exampleProject('HRP-301')
    issueVersion(p, 'consent', 'First version', '2025-12-01'); issueVersion(p, 'consent', 'Before first site opened', '2026-02-20'); issueVersion(p, 'consent', 'Amendment 1: hair thinning added to the risks', '2026-04-02')
    for (const [c, v, d] of [['DE-EC', '2.0', '2026-03-25'], ['IN-IEC-PUNE', '2.0', '2026-04-01'], ['IN-IEC-MUM', '2.0', '2026-04-01'], ['US-IRB', '2.0', '2026-04-10'], ['IN-IEC-PUNE', '3.0', '2026-04-15'], ['CA-REB', '2.0', '2026-05-01']] as const) {
      submit(p, c, [{ type: 'consent', language: 'en', version: v }], '', d); approve(p, { committee: c, type: 'consent', language: 'en', version: v, date: d, decision: 'approved' })
    }
    const f = cdmConsentFile(p); f.exportedUtc = '2026-06-30T09:00:00.000Z'
    expect(f.versions.every((v) => v.country)).toBe(true)
    const dir = '../cdm-query-console/src/domain/ost'
    if (existsSync(dir)) writeFileSync(`${dir}/consent-m21.json`, JSON.stringify(f, null, 2) + '\n')
  })
  test('re-consent decision and tracked changes', () => {
    const p = exampleProject('HRP-301'), next = structuredClone(p.facts); next.risks += ' Hair thinning was seen.'
    const r = reconsentDecision(consentSections(p.facts), consentSections(next))
    expect(r.needed).toBe('Re-consent'); expect(r.changes.map((c) => c.id)).toEqual(['risks'])
    expect(wordDiff('a b c', 'a x c').filter((s) => s.t !== '=').map((s) => s.t + s.s)).toEqual(['-b', '+x'])
  })
  test('a Protocol Builder file with an amendment keeps the previous version', () => {
    const d = (risk: string) => ({ title: { 'Short Title': 'T', 'Trial Acronym': 'A' }, design: {}, narrative: { '2.2.1': risk }, facts: { ageMin: 18, ageMax: 65, participants: 10, treatmentWeeks: 4, followUpWeeks: 2, participationWeeks: 8 }, arms: [{ name: 'X', type: 'Investigational', ratio: 1 }], interventions: [], visits: [], procedures: [], objectives: [] })
    const q = readFile(JSON.stringify({ format: 'protocol-builder-project', project: { id: 'P', versions: [{ number: '1.0', data: d('Risk A.') }, { number: '2.0', data: d('Risk A. Risk B.'), amendment: { summary: 'New risk', safetyRights: 'Yes' } }] } }))
    expect(q.amendment).toMatchObject({ number: '2.0', reason: 'New risk', safetyRights: true }); expect(q.amendment!.prevFacts.risks).toBe('Risk A.')
  })
})

describe('missions PL11 and PL12', () => {
  test('PL11: the full path scores 100', () => {
    const p = startMission('PL11'); expect(grade(p).passed).toBe(false)
    p.amendment!.decision = 'Re-consent'
    p.docs.consent.edits.key = `${sectionsOf(p, 'consent')[0].text} A longer study found thinning of the hair in about 2 in 100 people.`
    issueVersion(p, 'consent', 'Amendment 1: hair thinning added to the risks and key information.', '2026-06-01')
    for (const c of p.versions.committees) { submit(p, c.id, [{ type: 'consent', language: 'en', version: '2.0' }], '', '2026-06-02'); approve(p, { committee: c.id, type: 'consent', language: 'en', version: '2.0', date: '2026-06-20', decision: 'approved' }); for (const s of c.sites) p.versions.uses.push({ site: s, type: 'consent', language: 'en', version: '2.0', from: '2026-06-25' }) }
    expect(grade(p).detail.filter((d) => d.got < d.of).map((d) => d.label)).toEqual([])
    expect(versionFlags(p)).toEqual([])
  })
  test('PL12: configuration, quiz and a session score 100', () => {
    const p = startMission('PL12'), e = p.econsent!
    expect(grade(p).passed).toBe(false)
    e.identity = true; e.teachBack = true
    e.quiz.push({ id: 'E4', q: 'What is a common side effect?', options: ['A cold', 'Hair turning blue'], answer: 0, topic: 'risks', section: 'risks' }, { id: 'E5', q: 'Whom do you call with questions?', options: ['The study doctor', 'Nobody'], answer: 0, topic: 'contact', section: 'contacts' })
    e.sessions.push({ id: 'X', participant: 'Test', startedUtc: 'u', events: [{ utc: 'u', what: 'identity' }, { utc: 'u', what: 'screens' }, { utc: 'u', what: 'quiz' }, { utc: 'u', what: 'signed' }], answers: {}, questions: [], signed: { name: 'T', meaning: 'consent', utc: 'u' }, copy: true })
    expect(econsentChecks(e).filter((c) => !c.ok)).toEqual([]); expect(grade(p).score).toBe(100)
    expect(econsentChecks(blankEConsent(p.facts)).filter((c) => c.ok).map((c) => c.id)).toEqual(['topic:placebo', 'topic:duration', 'topic:voluntary'])
  })
})
