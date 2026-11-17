import { describe, expect, test } from 'vitest'
import { existsSync, writeFileSync } from 'node:fs'
import { readFile, exampleProject, exampleResults } from '../src/domain/project'
import { SKILL_SETS, SET_PASS, scoreSet } from '../src/domain/skills'
import { certificate, passportRecord, sealOf, hash, REQUIRED } from '../src/domain/certificate'
import { MISSIONS, startMission, grade } from '../src/domain/missions'
import { LESSONS } from '../src/domain/learn'
import { submissionPayload, verifySubmission } from '../src/domain/classroom'
import { handoff } from '../src/domain/handoff'
import type { Progress } from '../src/domain/types'
import { finish } from './journey.fixture'
import pbText from './fixtures/HRP-301.protocol-builder.json?raw'

const HUB = '../pharmolecule/tests/fixtures'
const save = (name: string, x: unknown) => { if (existsSync(HUB)) writeFileSync(`${HUB}/${name}`, JSON.stringify(x, null, 2) + '\n') }

describe('writing skills drills', () => {
  test('seven sets of eight, unique ids, every answer in range and explained', () => {
    expect(SKILL_SETS).toHaveLength(7)
    const ids = SKILL_SETS.flatMap((s) => s.items.map((i) => i.id)); expect(new Set(ids).size).toBe(ids.length)
    for (const s of SKILL_SETS) { expect(s.items).toHaveLength(8); for (const i of s.items) { expect(i.answer).toBeLessThan(i.options.length); expect(new Set(i.options).size).toBe(i.options.length); expect(i.why.length).toBeGreaterThan(20) } }
  })
  test('scoring counts right answers', () => {
    const s = SKILL_SETS[0], all = Object.fromEntries(s.items.map((i) => [i.id, i.answer]))
    expect(scoreSet(s, all)).toBe(8); expect(scoreSet(s, { ...all, [s.items[0].id]: (s.items[0].answer + 1) % s.items[0].options.length })).toBe(7)
  })
  test('the arithmetic in the statistics items is right', () => {
    expect(38 / 152).toBe(0.25); expect(Math.round(100 / (38.2 - 11.9))).toBe(4); expect(75 / 15).toBe(5)
  })
})

const learner = { name: 'Asha Verma', userId: 'U-test0005' }
const full = (): Progress => ({ id: 'me', userId: learner.userId, classId: '', drills: {}, name: learner.name,
  quizzes: Object.fromEntries(LESSONS.map((l) => [l.id, { score: 3, of: 3, utc: '2026-11-17T10:00:00Z' }])),
  skills: Object.fromEntries(SKILL_SETS.map((s) => [s.id, { score: 7, of: 8, utc: '2026-11-17T10:00:00Z' }])),
  missions: Object.fromEntries(MISSIONS.map((m, i) => [m.id, { score: i < 4 ? 96 : 85, utc: '2026-11-17T10:00:00Z' }])) })

describe('certificate and passport record', () => {
  test('core missions are PL1, PL2, PL3, PL6 and PL8', () => expect(REQUIRED).toEqual(['PL1', 'PL2', 'PL3', 'PL6', 'PL8']))
  test('missing quizzes, skills or a core mission withhold it; everything earns distinction', () => {
    const g = full()
    expect(certificate({ ...g, skills: {} }, learner).eligible).toBe(false)
    expect(certificate({ ...g, quizzes: {} }, learner).eligible).toBe(false)
    expect(certificate({ ...g, missions: { ...g.missions, PL6: { score: 60, utc: '' } } }, learner).eligible).toBe(false)
    const core = certificate({ ...g, missions: Object.fromEntries(REQUIRED.map((id) => [id, { score: 75, utc: '' }])) }, learner)
    expect(core.eligible).toBe(true); expect(core.distinction).toBe(false)
    const c = certificate(g, learner)
    expect(c.distinction).toBe(true); expect(c.code).toMatch(/^PL-[0-9A-F]{5}-[0-9A-F]{5}$/)
    const h = hash(c.basis).slice(-10).toUpperCase(); expect(c.code).toBe(`PL-${h.slice(0, 5)}-${h.slice(5)}`)
    const rec = passportRecord(c, learner, '2026-11-17')
    expect(rec.seal).toBe(sealOf(rec)); expect(rec.basis.startsWith('asha verma|')).toBe(true); expect(rec.basis.endsWith('|U-test0005')).toBe(true)
    save('pl.json', rec)
  })
})

describe('classroom submission', () => {
  test('a submitted mission travels compressed and re-scores the same', async () => {
    const p = startMission('PL5'); const g = grade(p)
    p.mission!.submittedUtc = '2026-11-17T10:00:00Z'; p.mission!.score = g.score; p.mission!.detail = g.detail
    const pl = await submissionPayload(p)
    expect(pl.project.kind).toBe('plain-language-lab/mission-submission'); expect(pl.project.missionId).toBe('PL5')
    const v = await verifySubmission(pl.project); expect(v.score).toBe(g.score)
    await expect(verifySubmission({ ...pl.project, kind: 'other' } as never)).rejects.toThrow(/not a Plain Language Lab/)
  })
})

describe('hand-off for the lifecycle journey', () => {
  test('from the learner’s Protocol Builder file: the draft fails, the finished documents pass', () => {
    const p = readFile(pbText)
    const start = handoff(p, '2026-11-17T10:00:00.000Z')
    expect(start.study).toMatchObject({ id: 'HRP-301', origin: 'protocol-builder' })
    expect(start.consent.elements.missing.length).toBeGreaterThan(0); expect(start.consent.grade).toBeGreaterThan(8)
    expect(start.lay.results?.fromExample).toBe(true); expect(start.lay.checks.failed.length).toBeGreaterThan(0)
    save('pll-handoff-start.json', start)
    finish(p); p.lay.results = exampleResults('HRP-301'); p.lay.source = 'ars-reporting-event.json'
    const done = handoff(p, '2026-11-17T12:00:00.000Z')
    expect(done.consent.elements.missing).toEqual([]); expect(done.consent.grade).toBeLessThanOrEqual(8); expect(done.consent.keyGrade!).toBeLessThanOrEqual(8)
    expect(done.consent.gaps).toEqual([]); expect(done.lay.checks.failed).toEqual([]); expect(done.lay.numbers).toEqual([]); expect(done.lay.results?.fromExample).toBe(false)
    save('pll-handoff.json', done)
  })
  test('the worked example is marked as such', () => {
    const p = exampleProject('HRP-301'); finish(p)
    const h = handoff(p, '2026-11-17T12:00:00.000Z'); expect(h.study.origin).toBe('example')
    save('pll-handoff-example.json', h)
  })
})
