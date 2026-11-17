import { describe, expect, test } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { exampleProject, sectionsOf, readFile, projectFile, docChecks, EXAMPLES } from '../src/domain/project'
import { startMission, grade, MISSIONS, PL5_CASES, PL5_CHECKLIST } from '../src/domain/missions'
import { PASSAGES } from '../src/domain/drills'
import { analyze } from '../src/domain/analyze'
import { indiaRecording } from '../src/shared/consent'
import { LESSONS } from '../src/domain/learn'

const PB = '../protocol-builder'
describe('shared modules', () => {
  for (const f of ['consent', 'jargon']) test(`${f}.ts matches the Protocol Builder copy`, () => {
    if (!existsSync(`${PB}/src/shared/${f}.ts`)) return
    expect(readFileSync(`src/shared/${f}.ts`, 'utf8')).toBe(readFileSync(`${PB}/src/shared/${f}.ts`, 'utf8'))
  })
})

describe('projects and the consent form', () => {
  test('examples load and the consent form fails only where text is left to write', () => {
    for (const id of ['HRP-301']) {
      const p = exampleProject(id), bad = docChecks(p).filter((c) => !c.ok)
      expect(bad.every((c) => /still has text to write/.test(c.why)), `${id}: ${bad.map((c) => c.el.id + ' ' + c.why).join('; ')}`).toBe(true)
    }
  })
  test('GLV-12-301 shows real gaps: no pregnancy risk text, no EU trial number', () => {
    const ids = docChecks(exampleProject('GLV-12-301')).filter((c) => !c.ok && !/still has text/.test(c.why)).map((c) => c.el.id)
    expect(ids).toEqual(['US-b1', 'EU-e'])
    expect(Object.keys(EXAMPLES)).toEqual(['HRP-301', 'GLV-12-301'])
  })
  test('all four document types generate', () => {
    const p = exampleProject('HRP-301')
    for (const t of ['consent', 'representative', 'assent-7-11', 'assent-12-17'] as const) expect(sectionsOf(p, t).length).toBeGreaterThan(4)
    expect(analyze(sectionsOf(p, 'assent-7-11').map((s) => s.text).join(' ')).grade).toBeLessThanOrEqual(5)
  })
  test('project file round trip, and a Protocol Builder project file imports', () => {
    const p = exampleProject('GLV-12-301')
    expect(readFile(projectFile(p)).facts.id).toBe('GLV-12-301')
    const pb = { format: 'protocol-builder-project', project: { id: 'X', versions: [{ data: { title: { 'Short Title': 'A trial', 'Trial Acronym': 'TEST-1', 'NCT Number': 'NCT00000000' }, design: { 'Site Geographic Scope': 'India and Germany' }, narrative: {}, facts: { ageMin: 18, ageMax: 65, participants: 100, treatmentWeeks: 12, followUpWeeks: 4, participationWeeks: 18 }, arms: [{ name: 'Drug', type: 'Investigational', ratio: 1 }, { name: 'Placebo', type: 'Placebo', ratio: 1 }], interventions: [{ route: 'Oral', frequency: 'once daily' }], visits: [{ name: 'Day 1', type: 'On site' }], procedures: [{ name: 'Blood test', visits: ['D1'], bloodMl: 10 }], objectives: [] } }] } }
    const q = readFile(JSON.stringify(pb))
    expect(q.facts.acronym).toBe('TEST-1'); expect(q.regions).toEqual(expect.arrayContaining(['US', 'EU', 'IN']))
    expect(sectionsOf(q, 'consent').find((s) => s.id === 'what')!.text).toMatch(/1 in 2 chance of receiving placebo/)
    expect(() => readFile('{"format":"other"}')).toThrow()
  })
  test('India recording rule', () => {
    expect(indiaRecording({ newChemicalEntity: true, hivOrLeprosy: false, vulnerable: true }).need).toBe('audio-video')
    expect(indiaRecording({ newChemicalEntity: true, hivOrLeprosy: true, vulnerable: true }).need).toBe('audio')
    expect(indiaRecording({ newChemicalEntity: false, hivOrLeprosy: false, vulnerable: true }).need).toBe('not required')
  })
})

describe('missions', () => {
  test('PL1: five model answers pass at expert', () => {
    const p = startMission('PL1'); expect(grade(p).score).toBe(0)
    p.mission!.answers = Object.fromEntries(PASSAGES.slice(0, 5).map((x) => [`drill:${x.id}`, x.model]))
    expect(grade(p).expert).toBe(true)
  })
  test('PL2: the broken form fails; restoring the sections passes', () => {
    const p = startMission('PL2'); expect(grade(p).passed).toBe(false)
    p.docs.consent.edits = {
      alternatives: 'You do not have to take part to receive treatment. Other treatments include steroid creams, other creams that calm the skin, and tablets that your doctor can prescribe. If you stop the study treatment early, the study doctor will discuss your care and follow-up with you.',
      costs: 'The study treatment and study procedures are free. Travel costs are paid back, and you receive a payment for each visit, prorated if you leave early.',
      injury: 'If you are injured as a result of taking part, you will receive medical treatment free of charge. You will receive compensation for study-related injury or death, as the law of your country requires; the sponsor holds insurance for this.',
    }
    const g = grade(p)
    expect(g.detail.map((d) => d.label + ' ' + d.got + '/' + d.of).join('\n')).toMatch(/Required elements present \((\d+) of \1/)
    expect(g.expert).toBe(true)
  })
  test('PL3: the long sentence fails; a plain key information section passes', () => {
    const p = startMission('PL3'); expect(grade(p).passed).toBe(false)
    p.docs.consent.edits = { key: 'This is a research study. Taking part is your choice. We want to find out if a new medicine, lumiravostat, helps hand eczema that steroid creams have not cleared. You would be in the study for about 25 weeks and come to 8 visits. You would take a tablet once a day for 16 weeks. You have a 1 in 3 chance of getting a placebo: a tablet with no medicine in it. The most common side effects so far were colds and changes in a liver blood test. You may not benefit, and there are other treatments. You can stop at any time without giving a reason.' }
    const g = grade(p); expect(g.detail.filter((d) => d.got < d.of).map((d) => d.label)).toEqual([]); expect(g.score).toBe(100)
  })
  test('PL4: adult language fails; the generated assent passes', () => {
    const p = startMission('PL4'); expect(grade(p).passed).toBe(false)
    p.docs['assent-7-11'].edits = {}; p.docs['assent-12-17'].edits = {}
    expect(grade(p).detail.filter((d) => d.got < d.of).map((d) => d.label)).toEqual([])
  })
  test('PL5: right answers score 100; ticking everything does not pass', () => {
    const p = startMission('PL5')
    p.mission!.answers = { ...Object.fromEntries(PL5_CASES.map((c) => [`rec:${c.id}`, indiaRecording({ newChemicalEntity: c.nce, hivOrLeprosy: c.hivOrLeprosy, vulnerable: c.vulnerable }).need])), ...Object.fromEntries(PL5_CHECKLIST.filter((x) => x.right).map((x) => [`chk:${x.id}`, 'yes'])) }
    expect(grade(p).score).toBe(100)
    p.mission!.answers = Object.fromEntries(PL5_CHECKLIST.map((x) => [`chk:${x.id}`, 'yes']))
    expect(grade(p).passed).toBe(false)
  })
  test('missions and lessons are well formed', () => {
    expect(MISSIONS.map((m) => m.id)).toEqual(['PL1', 'PL2', 'PL3', 'PL4', 'PL5', 'PL6', 'PL7', 'PL8', 'PL9', 'PL10', 'PL11', 'PL12'])
    for (const l of LESSONS) { expect(l.quiz.length).toBe(3); for (const q of l.quiz) expect(q.answer).toBeLessThan(q.options.length) }
  })
})
